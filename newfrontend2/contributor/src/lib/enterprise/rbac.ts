/**
 * Enterprise portal RBAC — doc 02 §3.2 sidebar + §5.B role-conditional dashboard.
 */

import type { ModuleConfig } from "@/lib/config/navigation";
import type { SowStage } from "@/lib/sow/types";
import {
  DEFAULT_LICENSED_ROLES,
  type EnterpriseRole,
  toEntRoleCode,
  normalizeEnterpriseRoles,
} from "./tenant-roles-shared";

export type EnterprisePersona =
  | "admin"
  | "sponsor"
  | "pmo"
  | "finance"
  | "compliance"
  | "it"
  | "reviewer"
  | "procurement";

/** Priority when multiple roles — first match wins for home + dashboard module. */
const PERSONA_PRIORITY: EnterprisePersona[] = [
  "admin",
  "sponsor",
  "pmo",
  "finance",
  "compliance",
  "it",
  "procurement",
  "reviewer",
];

export function resolveEnterprisePersona(roles: EnterpriseRole[]): EnterprisePersona {
  for (const p of PERSONA_PRIORITY) {
    if (roles.includes(p)) return p;
  }
  return "admin";
}

export function resolveEnterpriseRoles(input: {
  meRoleCodes?: string[] | null;
  memberRoles?: string[] | null;
  sessionPortalRole?: string | null;
  email?: string | null;
  /** Wait for /api/me before assuming admin for unknown emails. */
  meLoading?: boolean;
}): EnterpriseRole[] {
  const fromMe = normalizeEnterpriseRoles(input.meRoleCodes ?? []);
  if (fromMe.length > 0) return fromMe;

  const fromMember = normalizeEnterpriseRoles(input.memberRoles ?? []);
  if (fromMember.length > 0) return fromMember;

  const portalEnterprise =
    input.sessionPortalRole === "enterprise" ||
    input.sessionPortalRole === "admin" ||
    input.sessionPortalRole === "super_admin";

  if (!portalEnterprise) return [];

  if (input.meLoading) return [];

  /** Avoid elevating unknown enterprise users to admin when /api/me has no roles yet. */
  return ["sponsor"];
}

/** Who may start SOW intake (doc 02 — /enterprise/sow/new: admin, sponsor). */
export function canCreateSow(roles: EnterpriseRole[]): boolean {
  return hasEnterpriseCapability(roles, ["admin", "sponsor"]);
}

export function isEnterpriseAdmin(roles: EnterpriseRole[]): boolean {
  return roles.includes("admin");
}

export function hasEnterpriseCapability(
  roles: EnterpriseRole[],
  allowed: EnterpriseRole[] | "all",
): boolean {
  if (allowed === "all") return true;
  if (roles.includes("admin")) return true;
  return allowed.some((r) => roles.includes(r));
}

/** Post-login landing per persona (spec §5.B — role module emphasis). */
export function getEnterpriseHomePath(persona: EnterprisePersona): string {
  switch (persona) {
    case "finance":
      return "/enterprise/billing";
    case "compliance":
      return "/enterprise/compliance";
    case "it":
      return "/enterprise/settings/security";
    case "reviewer":
      return "/enterprise/reviewer";
    case "procurement":
      return "/enterprise/billing";
    case "admin":
    case "sponsor":
    case "pmo":
    default:
      return "/enterprise/dashboard";
  }
}

export function resolveEnterpriseHomePath(roles: EnterpriseRole[]): string {
  return getEnterpriseHomePath(resolveEnterprisePersona(roles));
}

/** Sidebar visibility — longest href prefix wins. Doc 02 §3.2. */
const NAV_ACCESS: Array<{ prefix: string; roles: EnterpriseRole[] | "all" }> = [
  { prefix: "/enterprise/dashboard", roles: "all" },
  { prefix: "/enterprise/sow", roles: ["admin", "sponsor", "pmo", "finance", "compliance", "procurement"] },
  { prefix: "/enterprise/decomposition", roles: ["admin", "pmo"] },
  { prefix: "/enterprise/projects", roles: ["admin", "sponsor", "pmo", "finance", "compliance", "procurement"] },
  { prefix: "/enterprise/workforce", roles: ["admin", "sponsor", "pmo"] },
  { prefix: "/enterprise/review", roles: ["admin", "sponsor", "pmo"] },
  { prefix: "/enterprise/reviewer", roles: ["admin", "reviewer"] },
  { prefix: "/enterprise/billing/rate-cards", roles: ["admin", "finance"] },
  { prefix: "/enterprise/billing/payouts", roles: ["admin", "finance", "compliance"] },
  { prefix: "/enterprise/billing", roles: ["admin", "finance", "sponsor", "procurement"] },
  { prefix: "/enterprise/audit", roles: "all" },
  { prefix: "/enterprise/compliance", roles: ["admin", "compliance"] },
  { prefix: "/enterprise/analytics", roles: ["admin", "sponsor", "pmo", "finance", "procurement"] },
];

function navAccessForHref(href: string): EnterpriseRole[] | "all" {
  const sorted = [...NAV_ACCESS].sort((a, b) => b.prefix.length - a.prefix.length);
  const match = sorted.find((row) => href === row.prefix || href.startsWith(row.prefix + "/"));
  return match?.roles ?? "all";
}

export function canAccessEnterpriseNavHref(href: string, roles: EnterpriseRole[]): boolean {
  return hasEnterpriseCapability(roles, navAccessForHref(href));
}

/** Route guard for direct URL entry. */
const ROUTE_ACCESS: Array<{ prefix: string; roles: EnterpriseRole[] | "all" }> = [
  ...NAV_ACCESS,
  /**
   * Intake is author-only even though PMO can access /enterprise/sow list.
   * Keep this more specific prefix before /enterprise/sow so direct URLs are blocked.
   */
  { prefix: "/enterprise/sow/intake", roles: ["admin", "sponsor"] },
  { prefix: "/enterprise/settings/tenant", roles: ["admin"] },
  { prefix: "/enterprise/settings/plan", roles: ["admin", "finance"] },
  { prefix: "/enterprise/settings/integrations", roles: ["admin", "it"] },
  { prefix: "/enterprise/settings/policies", roles: ["admin", "compliance"] },
  { prefix: "/enterprise/settings/security", roles: ["admin", "it"] },
  { prefix: "/enterprise/settings", roles: ["admin", "finance", "compliance", "it"] },
  { prefix: "/enterprise/profile", roles: "all" },
  { prefix: "/enterprise/notifications", roles: "all" },
  { prefix: "/enterprise/onboarding", roles: ["admin", "sponsor"] },
];

function routeAccessForPath(pathname: string): EnterpriseRole[] | "all" {
  const sorted = [...ROUTE_ACCESS].sort((a, b) => b.prefix.length - a.prefix.length);
  const match = sorted.find(
    (row) => pathname === row.prefix || pathname.startsWith(row.prefix + "/"),
  );
  return match?.roles ?? "all";
}

export function canAccessEnterprisePath(pathname: string, roles: EnterpriseRole[]): boolean {
  if (roles.length === 0) return false;
  if (pathname.startsWith("/enterprise/reviewer")) {
    return hasEnterpriseCapability(roles, ["admin", "reviewer"]);
  }
  const sorted = [...ROUTE_ACCESS].sort((a, b) => b.prefix.length - a.prefix.length);
  const match = sorted.find(
    (row) => pathname === row.prefix || pathname.startsWith(row.prefix + "/"),
  );
  if (!match) {
    return roles.includes("admin");
  }
  return hasEnterpriseCapability(roles, match.roles);
}

export function filterEnterpriseNavByRbac(
  config: ModuleConfig,
  roles: EnterpriseRole[],
): ModuleConfig {
  if (roles.length === 0) return config;

  const sections = config.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessEnterpriseNavHref(item.href, roles)),
    }))
    .filter((section) => section.items.length > 0);

  return { ...config, sections };
}

/** Normalize SOW owner id (mock uses email; DB may use user id). */
export function normalizeSowOwnerKey(ownerId: string): string {
  return ownerId.trim().toLowerCase();
}

export function isSowOwner(actorEmail: string | null | undefined, ownerId: string): boolean {
  if (!actorEmail?.trim()) return false;
  return normalizeSowOwnerKey(actorEmail) === normalizeSowOwnerKey(ownerId);
}

/**
 * Stage → enterprise role mapping for the internal approval gates.
 * The platform gate is Glimmora-only and never actionable in the
 * enterprise portal. Admin may act on any enterprise gate (override).
 */
export function canApproveSowStage(roles: EnterpriseRole[], stage: SowStage): boolean {
  switch (stage) {
    case "finance":
      return roles.includes("finance") || roles.includes("admin");
    case "security":
      return roles.includes("it") || roles.includes("admin");
    case "legal":
      return roles.includes("compliance") || roles.includes("admin");
    case "platform":
    default:
      return false;
  }
}

/**
 * Whether this user may record a decision on the current enterprise gate.
 * Four-eyes: the SOW owner (who uploaded/submitted) can never approve their
 * own SOW's internal gates.
 */
export function canActOnEnterpriseStage(
  roles: EnterpriseRole[],
  actorEmail: string | null | undefined,
  ownerId: string,
  stage: SowStage,
): boolean {
  if (!canApproveSowStage(roles, stage)) return false;
  return !isSowOwner(actorEmail, ownerId);
}

/**
 * Back-compat shim retained for callers that ask "can this user sign off the
 * enterprise side of this SOW". Returns true if the user can act on ANY
 * enterprise internal gate and is not the SOW owner (four-eyes).
 */
export function canSignOffSowFinal(
  roles: EnterpriseRole[],
  actorEmail: string | null | undefined,
  ownerId: string,
): boolean {
  const canAnyGate =
    canApproveSowStage(roles, "finance") ||
    canApproveSowStage(roles, "security") ||
    canApproveSowStage(roles, "legal");
  if (!canAnyGate) return false;
  return !isSowOwner(actorEmail, ownerId);
}

export interface DashboardMetricDef {
  label: string;
  hint: string;
  href: string;
  tone: "violet" | "amber" | "green" | "blue";
}

export interface RoleDashboardModule {
  persona: EnterprisePersona;
  personaLabel: string;
  briefTitle: string;
  briefBody: string;
  briefHref: string;
  metrics: DashboardMetricDef[];
}

const PERSONA_LABEL: Record<EnterprisePersona, string> = {
  admin: "Enterprise admin",
  sponsor: "Project sponsor",
  pmo: "PMO",
  finance: "Finance",
  compliance: "Legal & compliance",
  it: "Security & IT",
  reviewer: "Reviewer",
  procurement: "Procurement",
};

export function getRoleDashboardModule(
  persona: EnterprisePersona,
  counts: {
    sowApproval: number;
    sowStale: number;
    pendingReviews: number;
    planActive: number;
    planDraft: number;
    sowApproved: number;
  },
): RoleDashboardModule {
  const base = {
    persona,
    personaLabel: PERSONA_LABEL[persona],
  };

  switch (persona) {
    case "finance":
      return {
        ...base,
        briefTitle: "Billing & payouts",
        briefBody: "Rate cards, invoices, and payout release for this period.",
        briefHref: "/enterprise/billing",
        metrics: [
          {
            label: "In approval",
            hint: "SOWs awaiting commercial sign-off",
            href: "/enterprise/sow?status=approval",
            tone: counts.sowStale > 0 ? "amber" : "violet",
          },
          {
            label: "Rate cards",
            hint: "configure pricing",
            href: "/enterprise/billing/rate-cards",
            tone: "blue",
          },
          {
            label: "Payouts",
            hint: "ledger & release",
            href: "/enterprise/billing/payouts",
            tone: "green",
          },
          {
            label: "Analytics",
            hint: "economic view",
            href: "/enterprise/analytics/economic",
            tone: "blue",
          },
        ],
      };
    case "compliance":
      return {
        ...base,
        briefTitle: "Compliance posture",
        briefBody: "Consent inventory, retention rules, and audit exports.",
        briefHref: "/enterprise/compliance",
        metrics: [
          {
            label: "Legal queue",
            hint: "SOWs in legal stage",
            href: "/enterprise/sow?status=approval",
            tone: "violet",
          },
          {
            label: "Compliance",
            hint: "consent & retention",
            href: "/enterprise/compliance",
            tone: "amber",
          },
          {
            label: "Audit",
            hint: "tenant activity",
            href: "/enterprise/audit",
            tone: "blue",
          },
          {
            label: "Policies",
            hint: "governance thresholds",
            href: "/enterprise/settings/policies",
            tone: "blue",
          },
        ],
      };
    case "it":
      return {
        ...base,
        briefTitle: "Workspace security",
        briefBody: "Session policy, IP allowlist, SSO, and integrations.",
        briefHref: "/enterprise/settings/security",
        metrics: [
          {
            label: "Security queue",
            hint: "SOWs in security stage",
            href: "/enterprise/sow?status=approval",
            tone: "violet",
          },
          {
            label: "Security",
            hint: "session & access policy",
            href: "/enterprise/settings/security",
            tone: "amber",
          },
          {
            label: "Integrations",
            hint: "SSO · HRIS · webhooks",
            href: "/enterprise/settings/integrations",
            tone: "blue",
          },
          {
            label: "Audit",
            hint: "security events",
            href: "/enterprise/audit",
            tone: "blue",
          },
        ],
      };
    case "reviewer":
      return {
        ...base,
        briefTitle: "Acceptance queue",
        briefBody: "Review contributor submissions and sign off deliverables.",
        briefHref: "/enterprise/reviewer",
        metrics: [
          {
            label: "Pending reviews",
            hint: "submissions waiting",
            href: "/enterprise/reviewer",
            tone: counts.pendingReviews > 5 ? "amber" : "green",
          },
          {
            label: "Acceptance",
            hint: "enterprise review hub",
            href: "/enterprise/review",
            tone: "violet",
          },
          {
            label: "History",
            hint: "past decisions",
            href: "/enterprise/reviewer/history",
            tone: "blue",
          },
          {
            label: "Audit",
            hint: "review events",
            href: "/enterprise/audit",
            tone: "blue",
          },
        ],
      };
    case "pmo":
      return {
        ...base,
        briefTitle: "Delivery health",
        briefBody: "Decomposition, active projects, and exceptions.",
        briefHref: "/enterprise/projects",
        metrics: [
          {
            label: "In delivery",
            hint: "active projects",
            href: "/enterprise/projects",
            tone: "green",
          },
          {
            label: "Decomposition",
            hint: "plans awaiting PMO",
            href: "/enterprise/decomposition?status=draft",
            tone: "blue",
          },
          {
            label: "Acceptance",
            hint: "submission backlog",
            href: "/enterprise/review",
            tone: counts.pendingReviews > 0 ? "amber" : "green",
          },
          {
            label: "SOWs",
            hint: "workspace",
            href: "/enterprise/sow",
            tone: "violet",
          },
        ],
      };
    case "procurement":
      return {
        ...base,
        briefTitle: "Commercial alignment",
        briefBody: "Billing exports, PO mapping, and vendor records.",
        briefHref: "/enterprise/billing",
        metrics: [
          {
            label: "Billing",
            hint: "invoices & exports",
            href: "/enterprise/billing",
            tone: "violet",
          },
          {
            label: "Projects",
            hint: "procurement view",
            href: "/enterprise/projects",
            tone: "green",
          },
          {
            label: "SOWs",
            hint: "read-only pipeline",
            href: "/enterprise/sow",
            tone: "blue",
          },
          {
            label: "Analytics",
            hint: "spend baseline",
            href: "/enterprise/analytics",
            tone: "blue",
          },
        ],
      };
    case "sponsor":
      return {
        ...base,
        persona: "sponsor",
        personaLabel: PERSONA_LABEL.sponsor,
        briefTitle: "SOW pipeline",
        briefBody: "Submit SOWs, track approval, and monitor delivery.",
        briefHref: "/enterprise/sow?status=approval",
        metrics: [
          {
            label: "In approval",
            hint: counts.sowStale > 0 ? "overdue sign-offs" : "awaiting sign-off",
            href: "/enterprise/sow?status=approval",
            tone: counts.sowStale > 0 ? "amber" : "violet",
          },
          {
            label: "Acceptance",
            hint: "submissions to review",
            href: "/enterprise/review",
            tone: counts.pendingReviews > 5 ? "amber" : "green",
          },
          {
            label: "In delivery",
            hint: "active projects",
            href: "/enterprise/projects",
            tone: "green",
          },
          {
            label: "Approved SOWs",
            hint: "ready for PMO",
            href: "/enterprise/sow?status=approved",
            tone: "blue",
          },
        ],
      };
    case "admin":
    default:
      return {
        ...base,
        persona: persona === "admin" ? "admin" : "sponsor",
        personaLabel: persona === "admin" ? PERSONA_LABEL.admin : PERSONA_LABEL.sponsor,
        briefTitle:
          persona === "admin" ? "Tenant overview" : "SOW pipeline",
        briefBody:
          persona === "admin"
            ? "Members, policies, and cross-functional queues."
            : "Submit SOWs, track approval, and monitor delivery.",
        briefHref:
          persona === "admin" ? "/enterprise/settings/tenant" : "/enterprise/sow?status=approval",
        metrics: [
          {
            label: "In approval",
            hint: counts.sowStale > 0 ? "overdue sign-offs" : "awaiting sign-off",
            href: "/enterprise/sow?status=approval",
            tone: counts.sowStale > 0 ? "amber" : "violet",
          },
          {
            label: "Acceptance",
            hint: "submissions to review",
            href: "/enterprise/review",
            tone: counts.pendingReviews > 5 ? "amber" : "green",
          },
          {
            label: "In delivery",
            hint: "active projects",
            href: "/enterprise/projects",
            tone: "green",
          },
          {
            label: "Decomposition",
            hint: "plans awaiting PMO",
            href: "/enterprise/decomposition?status=draft",
            tone: "blue",
          },
        ],
      };
  }
}

export function licensedRolesFromRecord(
  record: Partial<Record<string, boolean>> | undefined,
): EnterpriseRole[] {
  if (!record) {
    return (Object.keys(DEFAULT_LICENSED_ROLES) as EnterpriseRole[]).filter(
      (k) => DEFAULT_LICENSED_ROLES[k],
    );
  }
  return (Object.keys(DEFAULT_LICENSED_ROLES) as EnterpriseRole[]).filter(
    (k) => record[k] ?? DEFAULT_LICENSED_ROLES[k],
  );
}

export function roleCodesForDisplay(roles: string[]): string[] {
  return roles.map((r) => {
    const normalized = normalizeEnterpriseRoles([r])[0];
    return normalized ? toEntRoleCode(normalized) : r;
  });
}
