import "./load-env";
/**
 * Seed contributor track test users for browser QA.
 *   student@glimmora.dev / tracktest1  (student track)
 *   women@glimmora.dev   / tracktest1  (women workforce)
 *   designer-1@acme.com / acme1234    (internal employee — Acme Corp HRIS)
 *   incomplete@glimmora.dev / tracktest1 (stub — onboarding required)
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { stubContributorProfileData } from "@/lib/contributor/profile-status";
import type { ContribType } from "@/lib/contributor/track";

const ACME_TENANT_ID = "tnt-acme-corp";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const passwordHash = await bcrypt.hash("tracktest1", 10);
  const acmePasswordHash = await bcrypt.hash("acme1234", 10);

  await prisma.tenant.upsert({
    where: { id: ACME_TENANT_ID },
    update: { name: "Acme Corp", slug: "acme-corp" },
    create: {
      id: ACME_TENANT_ID,
      name: "Acme Corp",
      slug: "acme-corp",
      status: "active",
      defaultCurrency: "INR",
      defaultRegion: "asia-south",
    } as never,
  }).catch(async () => {
    await prisma.$executeRaw`
      INSERT INTO "Tenant" (id, name, slug, status, "createdAt", "updatedAt")
      VALUES (${ACME_TENANT_ID}, 'Acme Corp', 'acme-corp', 'active', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET name = 'Acme Corp', slug = 'acme-corp'
    `;
  });

  async function upsert(
    email: string,
    firstName: string,
    lastName: string,
    contribType: ContribType,
    complete: boolean,
    extra: Record<string, unknown> = {},
  ) {
    const u = await prisma.user.upsert({
      where: { email },
      update: { firstName, lastName, passwordHash, role: "contributor" },
      create: {
        email,
        firstName,
        lastName,
        passwordHash,
        role: "contributor",
        emailVerified: true,
      },
    });
    const role = await prisma.userRole.findFirst({
      where: { userId: u.id, roleCode: "contributor" },
    });
    if (!role) {
      await prisma.userRole.create({
        data: { userId: u.id, roleCode: "contributor", tenantId: null },
      });
    }
    const base = complete
      ? {
          contribType,
          country: "India",
          dob: new Date("2000-05-01"),
          timezone: "Asia/Kolkata",
          departmentCategory: "engineering",
          departmentOther: null,
          primarySkills: ["React"],
          secondarySkills: [],
          otherSkills: [],
          availability: "15",
          ndaAccepted: true,
          ndaSignature: `${firstName} ${lastName}`,
          acceptTos: true,
          acceptCoc: true,
          acceptPrivacy: true,
          acceptFee: true,
          acceptAhp: true,
          marketingOptIn: false,
          ...extra,
        }
      : stubContributorProfileData(contribType);

    await prisma.contributorProfile.upsert({
      where: { userId: u.id },
      create: { userId: u.id, ...base },
      update: base,
    });
    console.log("OK", email, contribType, complete ? "complete" : "incomplete");
  }

  async function upsertInternal(
    email: string,
    firstName: string,
    lastName: string,
    departmentLabel: string,
  ) {
    const u = await prisma.user.upsert({
      where: { email },
      update: {
        firstName,
        lastName,
        passwordHash: acmePasswordHash,
        role: "contributor",
        tenantId: ACME_TENANT_ID,
        provider: "microsoft-entra-id",
        emailVerified: true,
      },
      create: {
        email,
        firstName,
        lastName,
        passwordHash: acmePasswordHash,
        role: "contributor",
        tenantId: ACME_TENANT_ID,
        provider: "microsoft-entra-id",
        emailVerified: true,
      },
    });
    const role = await prisma.userRole.findFirst({
      where: { userId: u.id, roleCode: "contributor" },
    });
    if (!role) {
      await prisma.userRole.create({
        data: { userId: u.id, roleCode: "contributor", tenantId: null },
      });
    }
    const profile = {
      contribType: "internal" as const,
      country: "India",
      dob: new Date("1994-03-18"),
      timezone: "Asia/Kolkata",
      departmentCategory: "other",
      departmentOther: departmentLabel,
      primarySkills: ["Figma", "UX design"],
      secondarySkills: [] as string[],
      otherSkills: [] as string[],
      availability: "20",
      ndaAccepted: true,
      ndaSignature: `${firstName} ${lastName}`,
      acceptTos: true,
      acceptCoc: true,
      acceptPrivacy: true,
      acceptFee: true,
      acceptAhp: true,
      marketingOptIn: false,
    };
    await prisma.contributorProfile.upsert({
      where: { userId: u.id },
      create: { userId: u.id, ...profile },
      update: profile,
    });
    console.log("OK", email, "internal", "complete", `(tenant: ${ACME_TENANT_ID})`);
  }

  await upsert("student@glimmora.dev", "Meera", "Prakash", "student", true, {
    degree: "B.Tech CS",
    branch: "Anna University",
    supervisorEmail: "lakshmi@annauniv.edu",
    supervisorName: "Dr. Lakshmi Murthy",
    supervisorApprovedAt: null,
  });
  await upsert("women@glimmora.dev", "Priya", "Iyer", "women_workforce", true, {
    kycVerifiedAt: null,
  });
  await upsert("freelancer-pending@glimmora.dev", "Arjun", "Nair", "general_workforce", true, {
    kycVerifiedAt: null,
  });
  await upsert("incomplete@glimmora.dev", "New", "User", "general_workforce", false);

  await upsertInternal("designer-1@acme.com", "Aanya", "Sharma", "Design org");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
