/**
 * Enterprise tenant RBAC — shared between settings UI, platform provisioning,
 * and runtime access control. Short keys (`finance`) match `ent.finance` in the DB.
 */

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

/**
 * Release-scoped tenant roles currently enabled in product UX.
 * The SOW approval pipeline runs enterprise internal gates (finance →
 * security/IT → legal/compliance) before the Glimmora platform gate, so
 * these stakeholder roles are surfaced for provisioning + member flows.
 */
export const RELEASE_ENTERPRISE_ROLES: EnterpriseRole[] = [
  "admin",
  "sponsor",
  "pmo",
  "finance",
  "it",
  "compliance",
  "reviewer",
];

export type EnterpriseRoleGroupId = "core" | "governance" | "delivery";

export interface EnterpriseRoleGroup {
  id: EnterpriseRoleGroupId;
  title: string;
  description: string;
  roles: EnterpriseRole[];
}

/** Mirrors platform tenant wizard — licensed role types for a customer. */
export const ENTERPRISE_ROLE_GROUPS: EnterpriseRoleGroup[] = [
  {
    id: "core",
    title: "Core operations",
    description: "Day-to-day SOW, delivery, and tenant administration.",
    roles: ["admin", "sponsor", "pmo"],
  },
  {
    id: "governance",
    title: "Internal stakeholders",
    description:
      "Finance, legal/compliance, security/IT, and procurement — each gets a focused workspace after sign-in.",
    roles: ["finance", "compliance", "it", "procurement"],
  },
  {
    id: "delivery",
    title: "Acceptance",
    description: "Contributor deliverable review (separate signup for external reviewers).",
    roles: ["reviewer"],
  },
];

/** Default licenses when provisioning a new tenant (platform wizard). */
export const DEFAULT_LICENSED_ROLES: Record<EnterpriseRole, boolean> = {
  admin: true,
  sponsor: true,
  pmo: true,
  finance: true,
  compliance: true,
  reviewer: true,
  procurement: false,
  it: true,
};

export const ROLE_META: Record<
  EnterpriseRole,
  { label: string; description: string; sowStageLabel?: string }
> = {
  admin: {
    label: "Admin",
    description: "Full tenant configuration, billing, and member management.",
  },
  sponsor: {
    label: "Sponsor",
    description: "Authors and submits SOWs; tracks approval and delivery (no final sign-off).",
  },
  pmo: {
    label: "PMO",
    description: "Decomposes approved SOWs into plans, runs projects and delivery health.",
  },
  finance: {
    label: "Finance",
    description: "Invoices, payouts, rate cards, and budget controls.",
  },
  compliance: {
    label: "Legal & compliance",
    description: "Audit, consent, retention, and policy oversight.",
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
    label: "Security & IT",
    description: "SSO, integrations, and workspace security.",
  },
};

/** Segregation of duties: pairs that should not sit on one person. */
export const SOD_PAIRS: Array<[EnterpriseRole, EnterpriseRole]> = [
  ["finance", "procurement"],
];

export function toEntRoleCode(role: EnterpriseRole): string {
  return `ent.${role}`;
}

/** Accepts `finance`, `ent.finance`, or unknown → null. */
export function normalizeEnterpriseRole(code: string): EnterpriseRole | null {
  const raw = code.startsWith("ent.") ? code.slice(4) : code;
  return (ENTERPRISE_ROLES as readonly string[]).includes(raw)
    ? (raw as EnterpriseRole)
    : null;
}

export function normalizeEnterpriseRoles(codes: string[]): EnterpriseRole[] {
  const out = new Set<EnterpriseRole>();
  for (const code of codes) {
    const r = normalizeEnterpriseRole(code);
    if (r) out.add(r);
  }
  return [...out];
}

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
  const normalized = normalizeEnterpriseRole(role);
  if (normalized) return ROLE_META[normalized].label;
  return role;
}

export function countActiveAdmins(
  members: Array<{ roles: string[]; status: string }>,
): number {
  return members.filter((m) => m.status === "active" && m.roles.includes("admin")).length;
}

export function rolePillCls(role: string): string {
  switch (normalizeEnterpriseRole(role) ?? role) {
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
