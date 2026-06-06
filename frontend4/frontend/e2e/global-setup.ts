import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

export default async function globalSetup() {
  const root = path.resolve(__dirname, "..");
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
  }
  // When we authenticate against the real FastAPI backend (not the Prisma seed
  // accounts), the migrate/seed bootstrap is unnecessary — and it crashes on
  // the shared glimmora_fe4 DB. Skip it.
  if (process.env.PLAYWRIGHT_SKIP_DB_SETUP === "1") {
    return;
  }
  try {
    execSync("npx prisma migrate deploy --schema=prisma/schema.prisma", {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
  } catch {
    execSync("npx tsx scripts/ensure-mentorship-flow.ts", {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
  }
  execSync("npx prisma generate --schema=prisma/schema.prisma", {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  const scripts = [
    "scripts/ensure-mentorship-flow.ts",
    "scripts/ensure-admin.ts",
    "scripts/ensure-enterprise.ts",
    "scripts/ensure-contributor.ts",
    "scripts/ensure-mentor.ts",
  ];
  for (const s of scripts) {
    execSync(`npx tsx ${s}`, { cwd: root, stdio: "inherit" });
  }
}
