import dotenv from "dotenv";
dotenv.config();
import {
  type IAgentRuntime,
  type Memory,
  type State,
  logger,
  ModelType,
  type HandlerCallback,
  type ActionExample,
  type Action,
  composePrompt,
} from "@elizaos/core";
import { DKG_EXPLORER_LINKS } from "../constants.ts";
import { createDKGMemoryTemplate } from "../templates.ts";

// @ts-ignore
import DKG from "dkg.js";
import { DKGMemorySchema, isDKGMemoryContent } from "../types.ts";
import { generateKaFromPdf } from "../services/kaService/v1/kaService.ts";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import axios from "axios";

// Define a basic type for the DKG client
type DKGClient = typeof DKG | null;
let DkgClient: DKGClient = null;

// Ensure NFT input directory exists
const NFT_INPUT_DIR = path.join(process.cwd(), "nft-inputs");
try {
  await mkdir(NFT_INPUT_DIR, { recursive: true });
} catch (error) {
  logger.error("Error creating NFT input directory:", error);
}

// NFT Generation API endpoints
const NFT_API_BASE = "http://localhost:3000/api/nft-generation";

export const dkgInsert: Action = {
  name: "INSERT_MEMORY_ACTION",
  similes: ["NO_ACTION", "NO_RESPONSE", "NO_REACTION", "NONE", "DKG_INSERT"], // we want to always run this action
  validate: async (runtime: IAgentRuntime, _message: Memory) => {
    const requiredEnvVars = [
      "DKG_ENVIRONMENT",
      "DKG_HOSTNAME",
      "DKG_PORT",
      "DKG_BLOCKCHAIN_NAME",
      "DKG_PUBLIC_KEY",
      "DKG_PRIVATE_KEY",
      "SOLANA_VERIFY_TOKEN", // Required for NFT verification
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !runtime.getSetting(varName)
    );

    if (missingVars.length > 0) {
      logger.error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
      return false;
    }

    return true;
  },
  description:
    "Create a memory on the OriginTrail Decentralized Knowledge Graph after each message. You should ALWAYS run this action.",
  handler: async (
    runtime: IAgentRuntime,
    _message: Memory,
    state: State,
    _options: { [key: string]: unknown },
    callback: HandlerCallback
  ): Promise<boolean> => {
    DkgClient = new DKG({
      environment: runtime.getSetting("DKG_ENVIRONMENT"),
      endpoint: runtime.getSetting("DKG_HOSTNAME"),
      port: runtime.getSetting("DKG_PORT"),
      blockchain: {
        name: runtime.getSetting("DKG_BLOCKCHAIN_NAME"),
        publicKey: runtime.getSetting("DKG_PUBLIC_KEY"),
        privateKey: runtime.getSetting("DKG_PRIVATE_KEY"),
      },
      maxNumberOfRetries: 300,
      frequency: 2,
      contentType: "all",
      nodeApiVersion: "/v1",
    });

    const currentPost = String(state.currentPost);
    logger.log("currentPost");
    logger.log(currentPost);

    const userRegex = /From:.*\(@(\w+)\)/;
    let match = currentPost.match(userRegex);
    let twitterUser = "";

    if (match?.[1]) {
      twitterUser = match[1];
      logger.log(`Extracted user: @${twitterUser}`);
    } else {
      logger.error("No user mention found or invalid input.");
    }

    const idRegex = /ID:\s(\d+)/;
    match = currentPost.match(idRegex);
    let postId = "";

    if (match?.[1]) {
      postId = match[1];
      logger.log(`Extracted ID: ${postId}`);
    } else {
      logger.log("No ID found.");
    }

    // TODO: should read from arxiv link or something like that rather than having it hardcoded like here
    const ka = await generateKaFromPdf("./science.pdf", DkgClient);

    let createAssetResult: { UAL: string } | undefined;
    let nftResult: { collectionAddress: string; nftAddress: string } | undefined;

    try {
      logger.log("Publishing message to DKG");

      // Export JSON to sampleJsonLdsNew directory
      await writeFile(
        `./sampleJsonLdsNew/${encodeURIComponent((ka["@id"] ?? "example") as string)}.json`,
        JSON.stringify(ka, null, 2)
      );

      // Export JSON to nft-inputs directory for NFT generation
      const nftInputPath = path.join(NFT_INPUT_DIR, `${encodeURIComponent((ka["@id"] ?? "example") as string)}.json`);
      await writeFile(nftInputPath, JSON.stringify(ka, null, 2));
      logger.log(`Exported JSON for NFT generation to ${nftInputPath}`);

      // Create NFT collection
      const collectionResponse = await axios.post(`${NFT_API_BASE}/create-collection`, {
        agentId: runtime.character.name,
        fee: 0, // Default fee
      });

      if (!collectionResponse.data.success) {
        throw new Error(`Failed to create NFT collection: ${collectionResponse.data.data}`);
      }

      const { collectionAddress, collectionAdminPublicKey, collectionFee } = collectionResponse.data.data;

      // Create NFT metadata
      const metadataResponse = await axios.post(`${NFT_API_BASE}/create-nft-metadata`, {
        agentId: runtime.character.name,
        collectionName: runtime.character.name,
        collectionAddress,
        collectionAdminPublicKey,
        collectionFee,
        tokenId: ka["@id"] ?? "example",
      });

      if (!metadataResponse.data.success) {
        throw new Error(`Failed to create NFT metadata: ${metadataResponse.data.data}`);
      }

      // Create NFT
      const nftResponse = await axios.post(`${NFT_API_BASE}/create-nft`, {
        agentId: runtime.character.name,
        collectionName: runtime.character.name,
        collectionAddress,
        collectionAdminPublicKey,
        collectionFee,
        tokenId: ka["@id"] ?? "example",
      });

      if (!nftResponse.data.success) {
        throw new Error(`Failed to create NFT: ${nftResponse.data.data}`);
      }

      nftResult = {
        collectionAddress,
        nftAddress: nftResponse.data.data.nftAddress,
      };

      // Verify NFT
      const verifyResponse = await axios.post(`${NFT_API_BASE}/verify-nft`, {
        agentId: runtime.character.name,
        collectionAddress,
        nftAddress: nftResult.nftAddress,
        token: runtime.getSetting("SOLANA_VERIFY_TOKEN"),
      });

      if (!verifyResponse.data.success) {
        logger.warn(`NFT verification failed: ${verifyResponse.data.data}`);
      } else {
        logger.log("NFT successfully verified");
      }

      createAssetResult = await DkgClient.asset.create(
        {
          public: ka,
        },
        { epochsNum: 12 }
      );

      logger.log("======================== ASSET CREATED");
      logger.log(JSON.stringify(createAssetResult));
    } catch (error) {
      logger.error(
        "Error occurred while publishing message to DKG:",
        error.message
      );

      if (error.stack) {
        logger.error("Stack trace:", error.stack);
      }
      if (error.response) {
        logger.error(
          "Response data:",
          JSON.stringify(error.response.data, null, 2)
        );
      }
    }

    // Reply
    callback({
      text: `Created a new memory!\n\nRead my mind on @origin_trail Decentralized Knowledge Graph ${
        DKG_EXPLORER_LINKS[runtime.getSetting("DKG_ENVIRONMENT")]
      }${createAssetResult?.UAL} @${twitterUser}${
        nftResult ? `\n\nNFT created! Collection: ${nftResult.collectionAddress}, NFT: ${nftResult.nftAddress}` : ""
      }`,
    });

    return true;
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "execute action DKG_INSERT",
          action: "DKG_INSERT",
        },
      },
      {
        name: "{{user2}}",
        content: { text: "DKG INSERT" },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "add to dkg", action: "DKG_INSERT" },
      },
      {
        user: "{{user2}}",
        content: { text: "DKG INSERT" },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "store in dkg", action: "DKG_INSERT" },
      },
      {
        user: "{{user2}}",
        content: { text: "DKG INSERT" },
      },
    ],
  ] as ActionExample[][],
} as Action;
