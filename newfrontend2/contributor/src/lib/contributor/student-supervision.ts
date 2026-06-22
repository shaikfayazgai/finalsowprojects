import { prisma } from "@/lib/db";

export type ApproveStudentParticipationResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Partnership admin confirms a student may participate this term.
 * Sets supervisorApprovedAt on the contributor profile (source of truth for the dashboard).
 */
export async function approveStudentParticipation(
  email: string,
): Promise<ApproveStudentParticipationResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { success: false, error: "Student email is required." };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: {
      id: true,
      contributorProfile: {
        select: { contribType: true, supervisorEmail: true },
      },
    },
  });

  if (!user?.contributorProfile) {
    return { success: false, error: "No contributor profile found for this email." };
  }
  if (user.contributorProfile.contribType !== "student") {
    return { success: false, error: "This contributor is not on the student track." };
  }
  if (!user.contributorProfile.supervisorEmail) {
    return {
      success: false,
      error: "Student has not selected a supervisor during onboarding yet.",
    };
  }

  await prisma.contributorProfile.update({
    where: { userId: user.id },
    data: { supervisorApprovedAt: new Date() },
  });

  return { success: true };
}
