/**
 * Validate a pending reviewer invite before the password step.
 */

import { getReviewerInvite } from "@/lib/reviewer/invite-store";

export function validateReviewerInvite(input: {
  inviteCode: string;
  email: string;
}): { orgName: string; expiresAt: string } {
  const email = input.email.trim().toLowerCase();
  const invite = getReviewerInvite(input.inviteCode.trim());

  if (!invite) {
    throw new Error("Invalid or unknown invite code.");
  }
  if (invite.status === "expired") {
    throw new Error("This invite has expired. Ask your admin to send a new one.");
  }
  if (invite.status === "accepted") {
    throw new Error("This invite has already been used.");
  }
  if (invite.email !== email) {
    throw new Error("Use the same email address your admin invited.");
  }

  return { orgName: invite.orgName, expiresAt: invite.expiresAt };
}
