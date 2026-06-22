import "./load-env";
/**
 * Normalize DecompositionPlan.status values to match the page's PlanStatus
 * union ("draft" | "approved" | "active" | "archived"). The earlier seed
 * accidentally inserted "in_progress" which crashes planStatusTone().
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const n = await prisma.$executeRaw`UPDATE "DecompositionPlan" SET status='active', "updatedAt"=NOW() WHERE status='in_progress'`;
  console.log("rows updated:", n);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
