/** Enterprise tenant RBAC — shared between workspace and invite drawer. */

export const ENTERPRISE_ROLES = [
  "admin",
  "sponsor",
  "pmo",
  "finance",
  "compliance",
  "reviewer",
  "procurement",
  "it",
] as const;

export type EnterpriseRole = (typeof ENTERPRISE_ROLES)[number];

export const ROLE_META: Record<
  EnterpriseRole,
  { label: string; description: string }
> = {
  admin: {
    label: "Admin",
    description: "Full tenant configuration, billing, and member management.",
  },
  sponsor: {
    label: "Sponsor",
    description: "Executive oversight — approve SOWs and major spend.",
  },
  pmo: {
    label: "PMO",
    description: "Project delivery — decomposition, staffing, and milestones.",
  },
  finance: {
    label: "Finance",
    description: "Invoices, payouts, rate cards, and budget controls.",
  },
  compliance: {
    label: "Compliance",
    description: "Audit, consent, retention, and policy enforcement.",
  },
  reviewer: {
    label: "Reviewer",
    description: "Acceptance queue — sign off on contributor deliverables.",
  },
  procurement: {
    label: "Procurement",
    description: "Vendor onboarding, PO alignment, and purchase approvals.",
  },
  it: {
    label: "IT",
    description: "SSO, integrations, security settings, and API access.",
  },
};

/** Segregation of duties: pairs that should not sit on one person. */
export const SOD_PAIRS: Array<[EnterpriseRole, EnterpriseRole]> = [
  ["finance", "procurement"],
];

export function detectSodViolations(
  roles: Set<EnterpriseRole> | string[],
): Array<[EnterpriseRole, EnterpriseRole]> {
  const set = roles instanceof Set ? roles : new Set(roles as EnterpriseRole[]);
  return SOD_PAIRS.filter(([a, b]) => set.has(a) && set.has(b));
}

export function memberHasSod(roles: string[]): boolean {
  return detectSodViolations(roles).length > 0;
}

export function roleLabel(role: string): string {
  if (role in ROLE_META) return ROLE_META[role as EnterpriseRole].label;
  return role;
}

export function countActiveAdmins(
  members: Array<{ roles: string[]; status: string }>,
): number {
  return members.filter((m) => m.status === "active" && m.roles.includes("admin")).length;
}

export function rolePillCls(role: string): string {
  switch (role) {
    case "admin":
      return "bg-brand-subtle text-brand-subtle-text";
    case "finance":
    case "procurement":
      return "bg-warning-subtle/80 text-warning-text";
    case "compliance":
      return "bg-error-subtle/60 text-error-text";
    default:
      return "bg-bg-subtle text-text-secondary";
  }
}
