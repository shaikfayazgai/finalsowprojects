import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { acceptMentorInvite, getMentorInvite } from "@/lib/mentor/invite-store";
import { updateAdminMentor, listAdminMentors } from "@/lib/admin/mocks/mentors-service";

function prismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

export async function registerMentorFromInvite(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  inviteCode: string;
}): Promise<{ userId: string; email: string }> {
  const email = input.email.trim().toLowerCase();
  const invite = getMentorInvite(input.inviteCode.trim());

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
        role: "mentor",
        emailVerified: true,
        provider: "local-credentials",
      },
      select: { id: true, email: true },
    });

    for (const roleCode of invite.mentorRoles) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleCode,
          tenantId: null,
          grantedBy: invite.invitedByUserId,
        },
      });
    }

    const adminMentor = listAdminMentors().find((m) => m.email.toLowerCase() === email);
    if (adminMentor) {
      updateAdminMentor(adminMentor.id, { status: "active" });
    }

    acceptMentorInvite(input.inviteCode.trim());
    return { userId: user.id, email: user.email };
  } finally {
    await prisma.$disconnect();
  }
}
