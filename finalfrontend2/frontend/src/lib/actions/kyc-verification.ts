"use server";

import { revalidatePath } from "next/cache";
import { markContributorKycVerified } from "@/lib/contributor/kyc-portal";

export async function markContributorKycVerifiedAction(
  email: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const result = await markContributorKycVerified(email);
  if (!result.success) return result;

  revalidatePath("/contributor/dashboard");
  revalidatePath("/onboarding/kyc-pending");
  return { success: true };
}
