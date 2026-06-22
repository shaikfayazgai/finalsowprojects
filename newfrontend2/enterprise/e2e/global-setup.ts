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
  try {
    execSync("npx prisma migrate deploy --schema=prisma/schema.prisma", {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    });
  } catch {
    console.warn(
      "[e2e global-setup] migrate deploy failed — continuing with seed scripts. " +
        "If your local DB has a failed migration, run: npx prisma migrate resolve",
    );
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
    "scripts/ensure-enterprise-stakeholders.ts",
    "scripts/ensure-reviewer.ts",
    "scripts/ensure-contributor.ts",
    "scripts/ensure-mentor.ts",
  ];
  for (const s of scripts) {
    execSync(`npx tsx ${s}`, { cwd: root, stdio: "inherit" });
  }
}
