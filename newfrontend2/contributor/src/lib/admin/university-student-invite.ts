/**
 * Per-student university invite URLs — Option B (personal invite tokens).
 */

export function mintStudentInviteToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return Math.random().toString(36).slice(2, 18);
}

export function buildUniversityStudentInviteUrl(
  origin: string,
  uniId: string,
  inviteToken: string,
): string {
  const q = new URLSearchParams({
    ref: uniId,
    track: "student",
    invite: inviteToken,
  });
  return `${origin}/auth/register?${q.toString()}`;
}

export function buildStudentInviteMailto(
  params: {
    studentName: string;
    studentEmail: string;
    universityName: string;
    inviteUrl: string;
    fromEmail?: string;
  },
): string {
  const subject = encodeURIComponent(`${params.universityName} · Your GlimmoraTeam student invite`);
  const body = encodeURIComponent(
    `Hi ${params.studentName.split(" ")[0] ?? params.studentName},\n\n` +
      `${params.universityName} has invited you to join GlimmoraTeam as a student contributor. ` +
      `Use the personal link below to create your account — it is tied to ${params.studentEmail}.\n\n` +
      `${params.inviteUrl}\n\n` +
      `After registering you'll complete a short onboarding (university details, skills, KYC).\n\n` +
      `— ${params.universityName} & GlimmoraTeam`,
  );
  const to = encodeURIComponent(params.studentEmail);
  return params.fromEmail
    ? `mailto:${to}?from=${encodeURIComponent(params.fromEmail)}&subject=${subject}&body=${body}`
    : `mailto:${to}?subject=${subject}&body=${body}`;
}

/** Split a display name into first / last for registration prefill. */
export function splitDisplayName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}
