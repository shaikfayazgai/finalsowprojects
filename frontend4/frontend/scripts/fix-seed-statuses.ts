import "./load-env";
/**
 * Patch the seeded SOW statuses/stages to match the values the SOW
 * service expects ("draft" | "approval" | "approved" | "rejected" /
 * "business" | "commercial" | "legal" | "security" | "final").
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // Normalise statuses
  await prisma.$executeRaw`UPDATE "Sow" SET status = 'approval' WHERE status = 'in_approval'`;
  // Normalise stages (Title case → lowercase)
  await prisma.$executeRaw`UPDATE "Sow" SET stage = LOWER(stage) WHERE stage != LOWER(stage)`;
  await prisma.$executeRaw`UPDATE "Sow" SET stage = 'commercial' WHERE stage = 'glimmora commercial'`;

  // Touch updatedAt so anything cached invalidates.
  await prisma.$executeRaw`UPDATE "Sow" SET "updatedAt" = NOW() WHERE "tenantId" = 'tnt-acme-corp'`;

  const rows = await prisma.$queryRaw<Array<{ id: string; status: string; stage: string; title: string }>>`
    SELECT id, status, stage, title FROM "Sow" WHERE "tenantId" = 'tnt-acme-corp' ORDER BY id
  `;
  console.log("Acme SOWs:");
  for (const r of rows) console.log(` · ${r.id} · status=${r.status} stage=${r.stage} · ${r.title}`);

  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
