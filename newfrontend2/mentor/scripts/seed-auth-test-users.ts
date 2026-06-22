import "./load-env";
/**
 * Seed contributors for account-auth Settings browser QA.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const ACME_TENANT_ID = "tnt-acme-corp";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  await prisma.tenant.upsert({
    where: { id: ACME_TENANT_ID },
    update: {
      name: "Acme Corp",
      slug: "acme-corp",
      subscriptionTier: "enterprise",
      status: "active",
    },
    create: {
      id: ACME_TENANT_ID,
      name: "Acme Corp",
      slug: "acme-corp",
      status: "active",
      subscriptionTier: "enterprise",
      defaultCurrency: "INR",
      defaultRegion: "asia-south",
    } as never,
  }).catch(async () => {
    await prisma.$executeRaw`
      INSERT INTO "Tenant" (id, name, slug, status, "subscriptionTier", "createdAt", "updatedAt")
      VALUES (${ACME_TENANT_ID}, 'Acme Corp', 'acme-corp', 'active', 'enterprise', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = 'Acme Corp',
        slug = 'acme-corp',
        "subscriptionTier" = 'enterprise'
    `;
  });

  const profileBase = {
    country: "India",
    dob: new Date("1998-03-15"),
    timezone: "Asia/Kolkata",
    departmentCategory: "engineering",
    primarySkills: ["React"],
    secondarySkills: [] as string[],
    otherSkills: [] as string[],
    availability: "20",
    ndaAccepted: true,
    acceptTos: true,
    acceptCoc: true,
    acceptPrivacy: true,
    acceptFee: true,
    acceptAhp: true,
    marketingOptIn: false,
  };

  const oauth = await prisma.user.upsert({
    where: { email: "oauth-freelancer@test.dev" },
    update: {
      role: "contributor",
      passwordHash: null,
      provider: "google",
      emailVerified: true,
      firstName: "OAuth",
      lastName: "Freelancer",
      tenantId: null,
    },
    create: {
      email: "oauth-freelancer@test.dev",
      role: "contributor",
      passwordHash: null,
      provider: "google",
      emailVerified: true,
      firstName: "OAuth",
      lastName: "Freelancer",
    },
  });

  await prisma.contributorProfile.upsert({
    where: { userId: oauth.id },
    create: {
      userId: oauth.id,
      contribType: "student",
      ndaSignature: "OAuth Freelancer",
      ...profileBase,
    },
    update: {
      contribType: "student",
      departmentCategory: "engineering",
      acceptTos: true,
    },
  });

  const internal = await prisma.user.upsert({
    where: { email: "internal.sso@acme.com" },
    update: {
      role: "contributor",
      passwordHash: null,
      provider: "sso",
      emailVerified: true,
      firstName: "Internal",
      lastName: "SSO",
      tenantId: ACME_TENANT_ID,
    },
    create: {
      email: "internal.sso@acme.com",
      role: "contributor",
      passwordHash: null,
      provider: "sso",
      emailVerified: true,
      firstName: "Internal",
      lastName: "SSO",
      tenantId: ACME_TENANT_ID,
    },
  });

  await prisma.contributorProfile.upsert({
    where: { userId: internal.id },
    create: {
      userId: internal.id,
      contribType: "internal",
      ndaSignature: "Internal SSO",
      ...profileBase,
      departmentCategory: "design",
      primarySkills: ["Figma"],
    },
    update: {
      contribType: "internal",
      departmentCategory: "design",
      acceptTos: true,
    },
  });

  console.log(JSON.stringify({ oauth: oauth.id, internal: internal.id }, null, 2));

  const passwordHash = await bcrypt.hash("testpass123", 10);
  const passwordUser = await prisma.user.upsert({
    where: { email: "password-freelancer@test.dev" },
    update: {
      role: "contributor",
      passwordHash,
      provider: "local-credentials",
      emailVerified: true,
      firstName: "Password",
      lastName: "Freelancer",
      tenantId: null,
    },
    create: {
      email: "password-freelancer@test.dev",
      role: "contributor",
      passwordHash,
      provider: "local-credentials",
      emailVerified: true,
      firstName: "Password",
      lastName: "Freelancer",
    },
  });

  await prisma.contributorProfile.upsert({
    where: { userId: passwordUser.id },
    create: {
      userId: passwordUser.id,
      contribType: "student",
      ndaSignature: "Password Freelancer",
      ...profileBase,
    },
    update: {
      contribType: "student",
      departmentCategory: "engineering",
      acceptTos: true,
    },
  });

  console.log(JSON.stringify({ oauth: oauth.id, internal: internal.id, password: passwordUser.id }, null, 2));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
