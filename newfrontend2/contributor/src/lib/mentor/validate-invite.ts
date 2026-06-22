import { getMentorInvite } from "@/lib/mentor/invite-store";

export function validateMentorInvite(input: {
  code: string;
  email: string;
}): { ok: true; orgLabel: string } | { ok: false; message: string } {
  const email = input.email.trim().toLowerCase();
  const invite = getMentorInvite(input.code.trim());
  if (!invite) return { ok: false, message: "This invite link is invalid." };
  if (invite.status === "expired") {
    return { ok: false, message: "This invite has expired. Ask your program manager for a new one." };
  }
  if (invite.status === "accepted") {
    return { ok: false, message: "This invite was already used. Sign in instead." };
  }
  if (invite.email !== email) {
    return { ok: false, message: "Use the email address that received the invite." };
  }
  return { ok: true, orgLabel: "Glimmora Mentor Program" };
}
