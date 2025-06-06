import { type Project } from "@elizaos/core";
import "dotenv/config";
import { logger } from "@elizaos/core";

// Debug logging for environment variables
logger.info("Environment variables at startup:");
logger.info(`DISCORD_WEBHOOK_URL exists: ${!!process.env.DISCORD_WEBHOOK_URL}`);
logger.info(`DISCORD_WEBHOOK_URL length: ${process.env.DISCORD_WEBHOOK_URL?.length || 0}`);

import { dkgAgent } from "./scholar";

const project: Project = {
  agents: [dkgAgent],
};

export default project;
