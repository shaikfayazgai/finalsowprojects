import { prisma } from "@/lib/db";

export type MarkKycVerifiedResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Platform admin approved identity verification — unlocks contributor portal
 * for freelancer and women-workforce tracks.
 */
export async function markContributorKycVerified(
  email: string,
): Promise<MarkKycVerifiedResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { success: false, error: "Contributor email is required." };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: {
      id: true,
      contributorProfile: { select: { contribType: true } },
    },
  });

  if (!user?.contributorProfile) {
    return { success: false, error: "No contributor profile found for this email." };
  }

  const { contribType } = user.contributorProfile;
  if (contribType !== "general_workforce" && contribType !== "women_workforce") {
    return {
      success: false,
      error: "KYC approval applies only to freelancer and women-workforce contributors.",
    };
  }

  await prisma.contributorProfile.update({
    where: { userId: user.id },
    data: { kycVerifiedAt: new Date() },
  });

  return { success: true };
}
