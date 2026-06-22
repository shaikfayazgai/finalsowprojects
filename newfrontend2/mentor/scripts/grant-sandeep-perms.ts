import "./load-env";
/**
 * Ensure Sandeep holds ent.sponsor (Phase 1 demo — submit SOWs, no final sign-off).
 * Does NOT grant ent.admin (use ensure-enterprise-stakeholders.ts for full Acme cast).
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const SPONSOR_CODE = "ent.sponsor";
const ACME_TENANT_ID = "tnt-acme-corp";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const u = await prisma.user.findUnique({ where: { email: "sandeep@acme.com" } });
  if (!u) {
    console.error("Run scripts/ensure-enterprise.ts first");
    process.exit(1);
  }

  const adminRole = await prisma.userRole.findFirst({
    where: { userId: u.id, roleCode: "ent.admin" },
  });
  if (adminRole) {
    await prisma.userRole.delete({ where: { id: adminRole.id } });
    console.log("Removed ent.admin from sandeep@acme.com (sponsor-only demo)");
  }

  const existing = await prisma.userRole.findFirst({
    where: { userId: u.id, roleCode: SPONSOR_CODE, tenantId: ACME_TENANT_ID },
  });
  if (!existing) {
    await prisma.userRole.create({
      data: {
        userId: u.id,
        roleCode: SPONSOR_CODE,
        tenantId: u.tenantId ?? ACME_TENANT_ID,
        grantedBy: u.id,
      },
    });
    console.log("Granted", SPONSOR_CODE);
  } else {
    console.log("Already has", SPONSOR_CODE);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
