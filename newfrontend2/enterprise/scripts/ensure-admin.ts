import "./load-env";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const email = "admin@glimmora.ai";
  const passwordHash = await bcrypt.hash("admin1234", 10);
  const u = await prisma.user.upsert({
    where: { email },
    update: { role: "super_admin", passwordHash, emailVerified: true },
    create: { email, role: "super_admin", passwordHash, emailVerified: true, firstName: "Aishwarya", lastName: "Rao" },
  });
  console.log("OK", { id: u.id, email: u.email, role: u.role });
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
