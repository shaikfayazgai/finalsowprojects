/**
 * Load frontend env for CLI scripts run from the repo root.
 * Prefers `.env.local`, then `.env`.
 */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

for (const file of [".env.local", ".env"]) {
  const envPath = path.join(frontendRoot, file);
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
