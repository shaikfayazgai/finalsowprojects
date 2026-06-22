import "./load-env";
/**
 * Idempotent dev seed: mentorship permissions, tables, contributor opt-in columns.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const PERMISSIONS = [
  { code: "read.mentorship_session", resource: "mentorship_session", action: "read", description: "List and read mentorship sessions" },
  { code: "schedule.mentorship_session", resource: "mentorship_session", action: "schedule", description: "Schedule a mentorship session" },
  { code: "hold.mentorship_session", resource: "mentorship_session", action: "hold", description: "Mark session held, no-show, or cancel" },
  { code: "write.coaching_note", resource: "coaching_note", action: "write", description: "Write coaching notes for contributors" },
  { code: "request.mentorship", resource: "mentorship", action: "request", description: "Opt in to mentorship matching" },
] as const;

const ROLE_GRANTS: Array<[string, string]> = [
  ["mentor", "read.mentorship_session"],
  ["mentor", "schedule.mentorship_session"],
  ["mentor", "hold.mentorship_session"],
  ["mentor", "write.coaching_note"],
  ["mentor.senior", "read.mentorship_session"],
  ["mentor.senior", "schedule.mentorship_session"],
  ["mentor.senior", "hold.mentorship_session"],
  ["mentor.senior", "write.coaching_note"],
  ["mentor.lead", "read.mentorship_session"],
  ["mentor.lead", "schedule.mentorship_session"],
  ["mentor.lead", "hold.mentorship_session"],
  ["mentor.lead", "write.coaching_note"],
  ["contributor", "request.mentorship"],
  ["contributor", "read.mentorship_session"],
];

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      create: p,
      update: { description: p.description },
    });
  }

  for (const [roleCode, permissionCode] of ROLE_GRANTS) {
    await prisma.rolePermission.upsert({
      where: { roleCode_permissionCode: { roleCode, permissionCode } },
      create: { roleCode, permissionCode },
      update: {},
    });
  }

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "ContributorProfile"
      ADD COLUMN IF NOT EXISTS "mentorshipOptInAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "mentorshipFocus" TEXT
  `);

  console.log("OK mentorship flow schema + permissions");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
