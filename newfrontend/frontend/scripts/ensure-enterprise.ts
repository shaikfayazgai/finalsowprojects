import "./load-env";
/**
 * Upsert a local enterprise user for dev sign-in.
 * Mirrors scripts/ensure-admin.ts but with role: "enterprise".
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const email = "sandeep@acme.com";
  const passwordHash = await bcrypt.hash("acme1234", 10);
  const u = await prisma.user.upsert({
    where: { email },
    update: { role: "enterprise", passwordHash, emailVerified: true },
    create: { email, role: "enterprise", passwordHash, emailVerified: true, firstName: "Sandeep", lastName: "Kulkarni" },
  });
  console.log("OK", { id: u.id, email: u.email, role: u.role });
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
