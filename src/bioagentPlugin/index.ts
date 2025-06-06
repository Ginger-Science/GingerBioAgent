import type { Plugin, IAgentRuntime } from "@elizaos/core";
import { logger } from "@elizaos/core";
import { dkgInsert } from "./actions/dkgInsert";
import { HypothesisService } from "./services";
import { initDriveSync } from "./helper";
import { gdriveManualSync, gdriveWebhook, health, totalAgents } from "./routes";

export const dkgPlugin: Plugin = {
  init: async (config: Record<string, string>, runtime: IAgentRuntime) => {
    logger.info("Initializing dkg plugin");
    logger.info(config);
    if (process.env.USE_GOOGLE_DRIVE === "true") {
      setTimeout(async () => {
        await initDriveSync(runtime);
      }, 20000); // prevent undefined error, the db property is not available immediately
    }
  },
  name: "vivian",
  description:
    "Ginger Science editor Vivian Flame",
  actions: [dkgInsert],
  providers: [],
  evaluators: [],
  services: [HypothesisService],
  routes: [health, gdriveWebhook, gdriveManualSync, totalAgents],
};

export * as actions from "./actions";
