import { register } from "node:module";
import { dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

import tsConfigPaths from "tsconfig-paths";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register ts-node
register("ts-node/esm", pathToFileURL("./src"));

// Register path aliases
try {
  const baseUrl = resolve(__dirname);
  const cleanup = tsConfigPaths.register({
    baseUrl,
    paths: {
      "@elizaos/core": ["../core/src"],
      "@elizaos/core/*": ["../core/src/*"],
    },
  });

  // Cleanup on process exit
  process.on("exit", () => {
    cleanup();
  });
} catch (error) {
  console.error("Failed to register tsconfig paths:", error);
  process.exit(1);
}
