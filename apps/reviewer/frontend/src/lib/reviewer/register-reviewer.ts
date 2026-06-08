/**
 * Reviewer self-registration — creates Prisma user + ent.reviewer role from invite.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { acceptReviewerInvite, getReviewerInvite } from "@/lib/reviewer/invite-store";

const REVIEWER_ROLE = "ent.reviewer";
const DEFAULT_TENANT_ID = "";

function prismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function registerReviewerFromInvite(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  inviteCode: string;
}): Promise<{ userId: string; email: string }> {
  const email = input.email.trim().toLowerCase();
  const invite = getReviewerInvite(input.inviteCode.trim());

  if (!invite || invite.status === "expired") {
    throw new Error("This invite is invalid or has expired.");
  }
  if (invite.status === "accepted") {
    throw new Error("This invite has already been used.");
  }
  if (invite.email !== email) {
    throw new Error("Use the same email address your admin invited.");
  }

  const prisma = prismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error("An account with this email already exists. Sign in instead.");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        passwordHash,
        role: "reviewer",
        emailVerified: true,
        tenantId: invite.tenantId || DEFAULT_TENANT_ID,
      },
      select: { id: true, email: true },
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleCode: REVIEWER_ROLE,
        tenantId: invite.tenantId || DEFAULT_TENANT_ID,
        grantedBy: invite.invitedByUserId,
      },
    });

    acceptReviewerInvite(input.inviteCode.trim());
    return { userId: user.id, email: user.email };
  } finally {
    await prisma.$disconnect();
  }
}
