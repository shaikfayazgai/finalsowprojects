/**
 * Platform Admin · invite URL + post-login routing reference.
 * Used by the identity hub, tenant provisioning, and login invite handling.
 */

export type InviteRoleKey =
  | "enterprise_admin"
  | "reviewer"
  | "mentor"
  | "contributor"
  | "contributor_student"
  | "contributor_women_wf"
  | "platform_admin";

export interface InviteRoleSpec {
  key: InviteRoleKey;
  label: string;
  description: string;
  jwtRole: string;
  postLoginPath: string;
  /** Whether operators can mint a link from the Users hub. */
  mintable: boolean;
  buildInviteUrl: (origin: string, token: string) => string;
}

export const ROLE_HOME: Record<string, string> = {
  admin: "/admin/dashboard",
  super_admin: "/admin/dashboard",
  enterprise: "/enterprise/dashboard",
  reviewer: "/enterprise/reviewer",
  mentor: "/mentor/dashboard",
  contributor: "/contributor/dashboard",
};

export const INVITE_ROLE_SPECS: InviteRoleSpec[] = [
  {
    key: "enterprise_admin",
    label: "Enterprise primary admin",
    description: "First ent.admin for a newly provisioned tenant.",
    jwtRole: "enterprise",
    postLoginPath: "/enterprise/onboarding",
    mintable: true,
    buildInviteUrl: (origin, token) =>
      `${origin}/auth/login?invite=${encodeURIComponent(token)}&role=enterprise`,
  },
  {
    key: "reviewer",
    label: "Enterprise reviewer",
    description: "QA reviewer invited by enterprise or platform admin.",
    jwtRole: "reviewer",
    postLoginPath: "/enterprise/reviewer/queue",
    mintable: true,
    buildInviteUrl: (origin, token) =>
      `${origin}/auth/register/reviewer?code=${encodeURIComponent(token)}`,
  },
  {
    key: "mentor",
    label: "Mentor",
    description: "External mentor — activate account then sign in.",
    jwtRole: "mentor",
    postLoginPath: "/mentor/onboarding",
    mintable: true,
    buildInviteUrl: (origin, token) =>
      `${origin}/auth/register/mentor?code=${encodeURIComponent(token)}`,
  },
  {
    key: "contributor",
    label: "Contributor (freelancer)",
    description: "Open registration — general workforce track.",
    jwtRole: "contributor",
    postLoginPath: "/contributor/onboarding",
    mintable: true,
    buildInviteUrl: (origin) => `${origin}/auth/register`,
  },
  {
    key: "contributor_student",
    label: "Contributor (student)",
    description: "University partnership MOU track — personal invite per student.",
    jwtRole: "contributor",
    postLoginPath: "/onboarding/student",
    mintable: true,
    buildInviteUrl: (origin, token) => {
      const [ref, invite] = token.includes("|") ? token.split("|") : [token, ""];
      const q = new URLSearchParams({ ref: ref ?? token, track: "student" });
      if (invite) q.set("invite", invite);
      return `${origin}/auth/register?${q.toString()}`;
    },
  },
  {
    key: "contributor_women_wf",
    label: "Contributor (women workforce)",
    description: "Partner org referral track.",
    jwtRole: "contributor",
    postLoginPath: "/onboarding/women",
    mintable: true,
    buildInviteUrl: (origin, token) => {
      const [ref, invite] = token.includes("|") ? token.split("|") : [token, ""];
      const q = new URLSearchParams({ ref: ref ?? token, track: "women_wf" });
      if (invite) q.set("invite", invite);
      return `${origin}/auth/register?${q.toString()}`;
    },
  },
  {
    key: "platform_admin",
    label: "Platform operator",
    description: "Glimmora staff — seeded via ensure-admin or backend promotion only.",
    jwtRole: "super_admin",
    postLoginPath: "/admin/dashboard",
    mintable: false,
    buildInviteUrl: (origin) => `${origin}/auth/login`,
  },
];

export function getInviteRoleSpec(key: InviteRoleKey): InviteRoleSpec {
  const spec = INVITE_ROLE_SPECS.find((s) => s.key === key);
  if (!spec) throw new Error(`Unknown invite role: ${key}`);
  return spec;
}

export function findSpecByJwtRole(jwtRole: string | null): InviteRoleSpec | undefined {
  if (!jwtRole) return undefined;
  return INVITE_ROLE_SPECS.find((s) => s.jwtRole === jwtRole);
}

export function mintInviteToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  }
  return Math.random().toString(36).slice(2, 18);
}

/** Resolve post-login destination after sign-in (honours invite + returnTo). */
export function resolvePostLogin(params: {
  sessionRole: string;
  inviteRole?: string | null;
  returnTo?: string | null;
  hasInvite?: boolean;
}): string {
  if (params.returnTo) return params.returnTo;
  // Invite deep-link only applies when JWT role matches the invited role.
  if (
    params.hasInvite &&
    params.inviteRole &&
    params.inviteRole === params.sessionRole
  ) {
    const spec = findSpecByJwtRole(params.inviteRole);
    if (spec) return spec.postLoginPath;
  }
  return ROLE_HOME[params.sessionRole] ?? "/contributor/dashboard";
}

export const MINTABLE_INVITE_SPECS = INVITE_ROLE_SPECS.filter((s) => s.mintable);
