import "./load-env";
/**
 * Upsert local mentor users for dev sign-in and E2E audits.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const MENTORS = [
  {
    email: "priya@glimmora.team",
    password: "mentor1234",
    firstName: "Priya",
    lastName: "Iyer",
    role: "mentor" as const,
    roleCode: "mentor.lead",
  },
  {
    email: "amelia@glimmora.team",
    password: "mentor1234",
    firstName: "Amelia",
    lastName: "Stone",
    role: "mentor" as const,
    roleCode: "mentor",
  },
];

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  for (const m of MENTORS) {
    const passwordHash = await bcrypt.hash(m.password, 10);
    const user = await prisma.user.upsert({
      where: { email: m.email },
      update: {
        role: m.role,
        passwordHash,
        emailVerified: true,
        firstName: m.firstName,
        lastName: m.lastName,
        provider: "local-credentials",
      },
      create: {
        email: m.email,
        role: m.role,
        passwordHash,
        emailVerified: true,
        firstName: m.firstName,
        lastName: m.lastName,
        provider: "local-credentials",
      },
      select: { id: true, email: true, role: true },
    });

    const existingRole = await prisma.userRole.findFirst({
      where: { userId: user.id, roleCode: m.roleCode },
    });
    if (!existingRole) {
      await prisma.userRole.create({
        data: { userId: user.id, roleCode: m.roleCode, tenantId: null },
      });
    }

    console.log("OK", { email: user.email, role: user.role, password: m.password });

    await prisma.mentor.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        status: "active",
        acceptsMentorshipSessions: true,
        timezone: "Asia/Kolkata",
        bio: `${m.firstName} ${m.lastName} — dev mentor`,
      },
      update: {
        status: "active",
        acceptsMentorshipSessions: true,
        timezone: "Asia/Kolkata",
      },
    });
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
