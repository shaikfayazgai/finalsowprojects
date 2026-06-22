import "./load-env";
/**
 * Patch sandeep@acme.com's User.tenantId so the enterprise portal's
 * /api/sow + /api/decomposition routes can find his SOWs. Also ensures
 * the admin user has cross-tenant visibility (tenantId null is fine).
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const u = await prisma.user.update({
    where: { email: "sandeep@acme.com" },
    data: { tenantId: "tnt-acme-corp" } as never,
  });
  console.log("OK", { id: u.id, tenantId: (u as { tenantId?: string }).tenantId });
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
