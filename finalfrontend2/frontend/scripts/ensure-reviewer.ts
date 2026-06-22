import "./load-env";
/**
 * Upsert enterprise QA reviewer (ent.reviewer) for E2E and local sign-in.
 */
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const ACME_TENANT_ID = "tnt-acme-corp";
const REVIEWER_ROLE = "ent.reviewer";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  const email = "karthik@acme.com";
  const passwordHash = await bcrypt.hash("acme1234", 10);

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

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: "reviewer",
      passwordHash,
      emailVerified: true,
      firstName: "Karthik",
      lastName: "Iyer",
      tenantId: ACME_TENANT_ID,
    },
    create: {
      email,
      role: "reviewer",
      passwordHash,
      emailVerified: true,
      firstName: "Karthik",
      lastName: "Iyer",
      tenantId: ACME_TENANT_ID,
    },
  });

  const existingRole = await prisma.userRole.findFirst({
    where: { userId: user.id, roleCode: REVIEWER_ROLE, tenantId: ACME_TENANT_ID },
  });
  if (!existingRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleCode: REVIEWER_ROLE,
        tenantId: ACME_TENANT_ID,
        grantedBy: user.id,
      },
    });
  }

  console.log("OK", { id: user.id, email: user.email, role: user.role });
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
