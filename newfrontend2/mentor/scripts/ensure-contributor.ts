import "./load-env";
/**
 * Upsert demo contributor for task-assignment walkthroughs.
 *   priya@glimmora.dev / contrib1234
 *
 * Also grants the contributor RBAC role and seeds smoke tasks/payouts
 * so Assigned, Revisions, Completed, Earnings, and Workroom render real data.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const TENANT_ID = "tnt-acme-corp";
const PLAN_ID = "plan-acme-5";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const email = "priya@glimmora.dev";
  const passwordHash = await bcrypt.hash("contrib1234", 10);

  const u = await prisma.user.upsert({
    where: { email },
    update: {
      role: "contributor",
      passwordHash,
      emailVerified: true,
      firstName: "Priya",
      lastName: "Raghav",
    },
    create: {
      email,
      role: "contributor",
      passwordHash,
      emailVerified: true,
      firstName: "Priya",
      lastName: "Raghav",
    },
  });

  const existingRole = await prisma.userRole.findFirst({
    where: { userId: u.id, roleCode: "contributor" },
  });
  if (!existingRole) {
    await prisma.userRole.create({
      data: { userId: u.id, roleCode: "contributor", tenantId: null },
    });
  }

  await seedSmokeWork(prisma, u.id);

  await prisma.contributorProfile.upsert({
    where: { userId: u.id },
    create: {
      userId: u.id,
      contribType: "general_workforce",
      country: "India",
      dob: new Date("1998-03-15"),
      timezone: "Asia/Kolkata",
      departmentCategory: "engineering",
      primarySkills: ["React", "TypeScript", "Figma"],
      secondarySkills: [],
      otherSkills: [],
      availability: "20",
      ndaAccepted: true,
      ndaSignature: "Priya Raghav",
      acceptTos: true,
      acceptCoc: true,
      acceptPrivacy: true,
      acceptFee: true,
      acceptAhp: true,
      marketingOptIn: false,
    },
    update: {
      contribType: "general_workforce",
      country: "India",
      timezone: "Asia/Kolkata",
      ndaAccepted: true,
      acceptTos: true,
      acceptCoc: true,
      acceptPrivacy: true,
      acceptFee: true,
      acceptAhp: true,
    },
  });

  console.log("OK", {
    id: u.id,
    email: u.email,
    role: u.role,
    rbac: "contributor",
    smokeTasks: 6,
  });
  await prisma.$disconnect();
}

async function seedSmokeWork(prisma: PrismaClient, contribId: string) {
  const prefix = "seed-sm-";

  await prisma.payoutRecord.deleteMany({ where: { id: { startsWith: prefix } } });
  await prisma.submission.deleteMany({ where: { id: { startsWith: prefix } } });
  await prisma.taskDefinition.deleteMany({ where: { id: { startsWith: prefix } } });

  const now = new Date();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3_600_000);
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

  const tasks = [
    {
      id: `${prefix}task-1`,
      externalKey: "TSK-001",
      title: "Build date-range picker",
      description: "Design + implement an accessible date-range picker component.",
      requiredSkills: ["React", "TypeScript", "Figma"],
      estimatedHours: 8,
      acceptanceCriteria: "WCAG 2.1 AA, keyboard nav, two months visible.",
      complexity: "medium",
      order: 1,
      status: "matched",
      assignedAt: hoursAgo(6),
      acceptedAt: null,
      agreedCurrency: "INR",
      agreedRatePerHour: 1500,
    },
    {
      id: `${prefix}task-2`,
      externalKey: "TSK-002",
      title: "Reporting CSV export endpoint",
      description: "Streaming CSV export, signed-URL delivery.",
      requiredSkills: ["Python", "FastAPI"],
      estimatedHours: 12,
      acceptanceCriteria: "Streams without buffering whole result in memory.",
      complexity: "medium",
      order: 2,
      status: "in_progress",
      assignedAt: daysAgo(2),
      acceptedAt: hoursAgo(46),
      agreedCurrency: "INR",
      agreedRatePerHour: 1800,
    },
    {
      id: `${prefix}task-3`,
      externalKey: "TSK-003",
      title: "Auth modal UX polish",
      description: "Tighten validation states + animation timing.",
      requiredSkills: ["React", "Framer Motion"],
      estimatedHours: 4,
      acceptanceCriteria: "No layout shift on error; reduce focus jumps.",
      complexity: "small",
      order: 3,
      status: "in_progress",
      assignedAt: daysAgo(5),
      acceptedAt: daysAgo(4),
      agreedCurrency: "INR",
      agreedRatePerHour: 1500,
    },
    {
      id: `${prefix}task-4`,
      externalKey: "TSK-004",
      title: "ETL spec — events table v2",
      description: "Spec + migration notes for the new partitioning scheme.",
      requiredSkills: ["Postgres", "SQL"],
      estimatedHours: 6,
      acceptanceCriteria: "Includes rollback plan + index strategy.",
      complexity: "medium",
      order: 4,
      status: "submitted",
      assignedAt: daysAgo(7),
      acceptedAt: daysAgo(6),
      agreedCurrency: "INR",
      agreedRatePerHour: 2000,
    },
    {
      id: `${prefix}task-5`,
      externalKey: "TSK-005",
      title: "Tenancy bootstrap script",
      description: "CLI to scaffold a new tenant with default rate cards.",
      requiredSkills: ["TypeScript", "Prisma"],
      estimatedHours: 10,
      acceptanceCriteria: "Single command; idempotent; logs every step.",
      complexity: "large",
      order: 5,
      status: "accepted",
      assignedAt: daysAgo(12),
      acceptedAt: daysAgo(11),
      agreedCurrency: "INR",
      agreedRatePerHour: 2200,
    },
    {
      id: `${prefix}task-6`,
      externalKey: "TSK-006",
      title: "Decomposition unit tests",
      description: "Add unit coverage for the dependency-resolver edge cases.",
      requiredSkills: ["Jest", "TypeScript"],
      estimatedHours: 5,
      acceptanceCriteria: "All resolver branches covered; CI green.",
      complexity: "small",
      order: 6,
      status: "accepted",
      assignedAt: daysAgo(18),
      acceptedAt: daysAgo(17),
      agreedCurrency: "INR",
      agreedRatePerHour: 1600,
    },
  ] as const;

  for (const t of tasks) {
    await prisma.taskDefinition.create({
      data: {
        id: t.id,
        planId: PLAN_ID,
        tenantId: TENANT_ID,
        externalKey: t.externalKey,
        title: t.title,
        description: t.description,
        requiredSkills: [...t.requiredSkills],
        estimatedHours: t.estimatedHours,
        acceptanceCriteria: t.acceptanceCriteria,
        complexity: t.complexity,
        order: t.order,
        status: t.status,
        assignedContributorId: contribId,
        assignedAt: t.assignedAt,
        acceptedAt: t.acceptedAt,
        agreedCurrency: t.agreedCurrency,
        agreedRatePerHour: t.agreedRatePerHour,
      },
    });
  }

  const submissions = [
    {
      id: `${prefix}sub-3`,
      taskDefinitionId: `${prefix}task-3`,
      version: 1,
      status: "feedback_requested",
      decisionRationale:
        "**Required corrections (2)**\n- Validation shake animation still flashes on first render\n- Submit button focus ring is clipped by the modal overflow",
      submittedAt: daysAgo(2),
      decidedAt: daysAgo(1),
    },
    {
      id: `${prefix}sub-4`,
      taskDefinitionId: `${prefix}task-4`,
      version: 1,
      status: "under_review",
      decisionRationale: null,
      submittedAt: daysAgo(1),
      decidedAt: null,
    },
    {
      id: `${prefix}sub-5`,
      taskDefinitionId: `${prefix}task-5`,
      version: 1,
      status: "accepted",
      decisionRationale: null,
      submittedAt: daysAgo(4),
      decidedAt: daysAgo(3),
    },
    {
      id: `${prefix}sub-6`,
      taskDefinitionId: `${prefix}task-6`,
      version: 1,
      status: "accepted",
      decisionRationale: null,
      submittedAt: daysAgo(7),
      decidedAt: daysAgo(6),
    },
  ] as const;

  for (const s of submissions) {
    await prisma.submission.create({
      data: {
        id: s.id,
        taskDefinitionId: s.taskDefinitionId,
        contributorId: contribId,
        tenantId: TENANT_ID,
        version: s.version,
        status: s.status,
        decisionRationale: s.decisionRationale,
        submittedAt: s.submittedAt,
        decidedAt: s.decidedAt,
      },
    });
  }

  await prisma.payoutRecord.createMany({
    data: [
      {
        id: `${prefix}payout-5`,
        contributorId: contribId,
        taskDefinitionId: `${prefix}task-5`,
        submissionId: `${prefix}sub-5`,
        tenantId: TENANT_ID,
        amountMinor: 2_200_000,
        currency: "INR",
        computation: {},
        status: "sent",
        externalRef: "PAY-2025-0042",
        eligibleAt: daysAgo(3),
        requestedAt: daysAgo(3),
        processingAt: daysAgo(2),
        sentAt: daysAgo(1),
      },
      {
        id: `${prefix}payout-6`,
        contributorId: contribId,
        taskDefinitionId: `${prefix}task-6`,
        submissionId: `${prefix}sub-6`,
        tenantId: TENANT_ID,
        amountMinor: 800_000,
        currency: "INR",
        computation: {},
        status: "sent",
        externalRef: "PAY-2025-0038",
        eligibleAt: daysAgo(6),
        requestedAt: daysAgo(6),
        processingAt: daysAgo(5),
        sentAt: daysAgo(5),
      },
    ],
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
