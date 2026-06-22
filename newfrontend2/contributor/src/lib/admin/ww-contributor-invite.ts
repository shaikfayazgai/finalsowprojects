/**
 * Per-contributor women workforce invite URLs — Option B (personal invite tokens).
 */

import { mintStudentInviteToken } from "@/lib/admin/university-student-invite";

export const mintWWInviteToken = mintStudentInviteToken;

export function buildWWContributorInviteUrl(
  origin: string,
  orgId: string,
  inviteToken: string,
): string {
  const q = new URLSearchParams({
    ref: orgId,
    track: "women_wf",
    invite: inviteToken,
  });
  return `${origin}/auth/register?${q.toString()}`;
}

export function buildWWContributorInviteMailto(params: {
  contributorName: string;
  contributorEmail: string;
  partnerName: string;
  inviteUrl: string;
  fromEmail?: string;
}): string {
  const subject = encodeURIComponent(`${params.partnerName} · Your GlimmoraTeam invite`);
  const body = encodeURIComponent(
    `Hi ${params.contributorName.split(" ")[0] ?? params.contributorName},\n\n` +
      `${params.partnerName} has invited you to join GlimmoraTeam on the women workforce track. ` +
      `Use the personal link below to create your account — it is tied to ${params.contributorEmail}.\n\n` +
      `${params.inviteUrl}\n\n` +
      `After registering you'll complete a short onboarding (partner details, skills, KYC).\n\n` +
      `— ${params.partnerName} & GlimmoraTeam`,
  );
  const to = encodeURIComponent(params.contributorEmail);
  return params.fromEmail
    ? `mailto:${to}?from=${encodeURIComponent(params.fromEmail)}&subject=${subject}&body=${body}`
    : `mailto:${to}?subject=${subject}&body=${body}`;
}
