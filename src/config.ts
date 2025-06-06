import "dotenv/config";

function required(key: string): string {
  const val = process.env[key];
  if (val === undefined || val === "") {
    throw new Error(`Environment variable ${key} is required`);
  }
  return val;
}

export class Config {
  static readonly PROD_URL: string = process.env["PROD_URL"];
  static readonly DEV_URL: string = process.env["DEV_URL"];

  static readonly POSTGRES_URL: string = required("POSTGRES_URL");
  static readonly PROD_POSTGRES_PASSWORD?: string =
    process.env["PROD_POSTGRES_PASSWORD"];
  static readonly PROD_POSTGRES_URL?: string = process.env["PROD_POSTGRES_URL"];
  static readonly PROD_PUBLIC_POSTGRES_URL?: string =
    process.env["PROD_PUBLIC_POSTGRES_URL"];

  static readonly DEFAULT_LOG_LEVEL: string = required("DEFAULT_LOG_LEVEL");
  static readonly LOG_JSON_FORMAT: boolean =
    process.env.LOG_JSON_FORMAT === "true";

  static readonly DISCORD_APPLICATION_ID?: string =
    process.env["DISCORD_APPLICATION_ID"];
  static readonly DISCORD_API_TOKEN?: string = process.env["DISCORD_API_TOKEN"];
  static readonly DISCORD_VOICE_CHANNEL_ID?: string =
    process.env.DISCORD_VOICE_CHANNEL_ID;
  static readonly DISCORD_CHANNEL_ID?: string =
    process.env["DISCORD_CHANNEL_ID"];

  static readonly OPENAI_API_KEY: string = required("OPENAI_API_KEY");
  static readonly ANTHROPIC_API_KEY: string = required("ANTHROPIC_API_KEY");

  static readonly DKG_ENVIRONMENT: "development" | "testnet" | "mainnet" =
    process.env["DKG_ENVIRONMENT"] as "development" | "testnet" | "mainnet";
  static readonly DKG_HOSTNAME?: string = process.env["DKG_HOSTNAME"];
  static readonly DKG_PORT?: number = Number(process.env["DKG_PORT"]);
  static readonly DKG_PUBLIC_KEY?: string = process.env["DKG_PUBLIC_KEY"];
  static readonly DKG_PRIVATE_KEY?: string = process.env["DKG_PRIVATE_KEY"];
  static readonly DKG_BLOCKCHAIN_NAME?: string =
    process.env["DKG_BLOCKCHAIN_NAME"];

  static readonly UNSTRUCTURED_API_KEY: string = required(
    "UNSTRUCTURED_API_KEY"
  );
  static readonly BIONTOLOGY_KEY: string = required("BIONTOLOGY_KEY");

  static readonly GCP_JSON_CREDENTIALS = JSON.parse(
    required("GCP_JSON_CREDENTIALS")
  );
  static readonly GOOGLE_DRIVE_FOLDER_ID?: string =
    process.env["GOOGLE_DRIVE_FOLDER_ID"];
  static readonly SHARED_DRIVE_ID?: string = process.env["SHARED_DRIVE_ID"];

  static readonly GROBID_URL?: string =
    process.env["GROBID_URL"] ?? "http://localhost:8070";
  static readonly RAILWAY_ENVIRONMENT_NAME?: string =
    process.env["RAILWAY_ENVIRONMENT_NAME"] ?? "local";

  static readonly PROD_OXIGRAPH_HOST?: string =
    process.env["PROD_OXIGRAPH_HOST"];
  static readonly LOCAL_OXIGRAPH_HOST?: string =
    process.env["LOCAL_OXIGRAPH_HOST"] ?? "http://localhost:7878";

  static readonly ENV: string = process.env["ENV"] ?? "dev";
}