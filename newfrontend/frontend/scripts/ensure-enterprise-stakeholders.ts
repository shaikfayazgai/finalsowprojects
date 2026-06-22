import "./load-env";
/**
 * Upsert Acme stakeholder dev users (finance, legal, security) + admin grants.
 * Run after ensure-enterprise.ts. Password for all: acme1234
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const ACME_TENANT_ID = "tnt-acme-corp";
const PASSWORD = "acme1234";

const STAKEHOLDERS = [
  {
    email: "vikram@acme.com",
    firstName: "Vikram",
    lastName: "Patel",
    roleCode: "ent.finance",
  },
  {
    email: "meera@acme.com",
    firstName: "Meera",
    lastName: "Joshi",
    roleCode: "ent.compliance",
  },
  {
    email: "rohit@acme.com",
    firstName: "Rohit",
    lastName: "Banerjee",
    roleCode: "ent.it",
  },
] as const;

/** Submits SOWs — not final sign-off (four-eyes). */
const SPONSOR_EMAIL = "sandeep@acme.com";
const SPONSOR_ROLE_CODES = ["ent.sponsor"] as const;

/** Counter-signs after Glimmora Commercial — must not be the SOW owner. */
const ENTERPRISE_ADMIN_EMAIL = "anjali@acme.com";
const ENTERPRISE_ADMIN_ROLE_CODES = ["ent.admin"] as const;

/** Delivery lead — decomposition and projects (no SOW submit / final sign-off). */
const PMO_EMAIL = "rahul@acme.com";
const PMO_ROLE_CODES = ["ent.pmo"] as const;

async function ensureUserRole(
  prisma: PrismaClient,
  userId: string,
  roleCode: string,
  tenantId: string,
) {
  const existing = await prisma.userRole.findFirst({
    where: { userId, roleCode, tenantId },
  });
  if (!existing) {
    await prisma.userRole.create({
      data: { userId, roleCode, tenantId, grantedBy: userId },
    });
  }
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await prisma.tenant.upsert({
    where: { id: ACME_TENANT_ID },
    update: { name: "Acme Corp", slug: "acme-corp", status: "active" },
    create: {
      id: ACME_TENANT_ID,
      name: "Acme Corp",
      slug: "acme-corp",
      status: "active",
      subscriptionTier: "enterprise",
      defaultCurrency: "INR",
      defaultRegion: "asia-south",
    } as never,
  }).catch(() => undefined);

  for (const spec of STAKEHOLDERS) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {
        role: "enterprise",
        passwordHash,
        emailVerified: true,
        firstName: spec.firstName,
        lastName: spec.lastName,
        tenantId: ACME_TENANT_ID,
      },
      create: {
        email: spec.email,
        role: "enterprise",
        passwordHash,
        emailVerified: true,
        firstName: spec.firstName,
        lastName: spec.lastName,
        tenantId: ACME_TENANT_ID,
      },
    });
    await ensureUserRole(prisma, user.id, spec.roleCode, ACME_TENANT_ID);
    console.log("OK", spec.email, spec.roleCode);
  }

  const sponsor = await prisma.user.findUnique({ where: { email: SPONSOR_EMAIL } });
  if (sponsor) {
    await prisma.user.update({
      where: { id: sponsor.id },
      data: { tenantId: ACME_TENANT_ID },
    });
    const stripAdmin = await prisma.userRole.findFirst({
      where: { userId: sponsor.id, roleCode: "ent.admin" },
    });
    if (stripAdmin) {
      await prisma.userRole.delete({ where: { id: stripAdmin.id } });
    }
    for (const code of SPONSOR_ROLE_CODES) {
      await ensureUserRole(prisma, sponsor.id, code, ACME_TENANT_ID);
    }
    console.log("OK", SPONSOR_EMAIL, SPONSOR_ROLE_CODES.join(", "));
  } else {
    console.warn("Skip sponsor grants — run scripts/ensure-enterprise.ts first");
  }

  const entAdminHash = await bcrypt.hash(PASSWORD, 10);
  const entAdmin = await prisma.user.upsert({
    where: { email: ENTERPRISE_ADMIN_EMAIL },
    update: {
      role: "enterprise",
      passwordHash: entAdminHash,
      emailVerified: true,
      firstName: "Anjali",
      lastName: "Rao",
      tenantId: ACME_TENANT_ID,
    },
    create: {
      email: ENTERPRISE_ADMIN_EMAIL,
      role: "enterprise",
      passwordHash: entAdminHash,
      emailVerified: true,
      firstName: "Anjali",
      lastName: "Rao",
      tenantId: ACME_TENANT_ID,
    },
  });
  for (const code of ENTERPRISE_ADMIN_ROLE_CODES) {
    await ensureUserRole(prisma, entAdmin.id, code, ACME_TENANT_ID);
  }
  console.log("OK", ENTERPRISE_ADMIN_EMAIL, ENTERPRISE_ADMIN_ROLE_CODES.join(", "));

  const pmoHash = await bcrypt.hash(PASSWORD, 10);
  const pmo = await prisma.user.upsert({
    where: { email: PMO_EMAIL },
    update: {
      role: "enterprise",
      passwordHash: pmoHash,
      emailVerified: true,
      firstName: "Rahul",
      lastName: "Desai",
      tenantId: ACME_TENANT_ID,
    },
    create: {
      email: PMO_EMAIL,
      role: "enterprise",
      passwordHash: pmoHash,
      emailVerified: true,
      firstName: "Rahul",
      lastName: "Desai",
      tenantId: ACME_TENANT_ID,
    },
  });
  for (const code of PMO_ROLE_CODES) {
    await ensureUserRole(prisma, pmo.id, code, ACME_TENANT_ID);
  }
  console.log("OK", PMO_EMAIL, PMO_ROLE_CODES.join(", "));

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
