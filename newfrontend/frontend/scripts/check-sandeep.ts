import "./load-env";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const u = await prisma.user.findUnique({ where: { email: "sandeep@acme.com" } });
  const tenant = u?.tenantId ? await prisma.tenant.findUnique({ where: { id: u.tenantId } }) : null;
  const sowsForSandeep = u?.tenantId ? await prisma.sow.findMany({ where: { tenantId: u.tenantId }, select: { id: true, title: true, status: true, stage: true } }) : [];
  const acmeSows = await prisma.sow.findMany({ where: { tenantId: "tnt-acme-corp" }, select: { id: true, title: true, status: true } });
  const allTenants = await prisma.tenant.findMany({ select: { id: true, name: true } });
  console.log("Sandeep:", { id: u?.id, email: u?.email, role: u?.role, tenantId: u?.tenantId });
  console.log("Tenant:", tenant);
  console.log("All tenants:", allTenants);
  console.log("SOWs in Sandeep's tenant:", sowsForSandeep);
  console.log("SOWs in tnt-acme-corp:", acmeSows);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
