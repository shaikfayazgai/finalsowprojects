import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminHash = await bcrypt.hash("Admin@1234", 10);

  await prisma.user.upsert({
    where: { email: "admin@glimmora.com" },
    update: {},
    create: {
      email: "admin@glimmora.com",
      passwordHash: adminHash,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      emailVerified: true,
    },
  });

  console.log("Seed complete: admin user created");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
