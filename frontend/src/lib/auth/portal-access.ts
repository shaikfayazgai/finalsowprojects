/**
 * Single source of truth for role → portal access and post-login routing.
 *
 * Per cross-functional spec (plans/05-cross-functional §2.3, §3.1–3.3):
 *  - Four portals, each under its own URL prefix.
 *  - A user holds one or more dotted-scope roles: `contributor`, `mentor.*`,
 *    `ent.*`, `plat.*`. The role's scope decides which portal(s) it may enter.
 *  - Server middleware enforces portal-scope by URL; the client guard and the
 *    post-login redirect both read this same map so they can never drift.
 *
 * This module is import-safe from the Edge runtime (no node-only deps).
 */

export type PortalKey = "contributor" | "enterprise" | "mentor" | "admin";

/**
 * Raw role strings the backend / NextAuth may emit. We keep the legacy
 * unscoped values (`admin`, `superadmin`, `reviewer`, …) alongside the
 * dotted-scope values from the spec so existing backend responses keep working
 * while we migrate. `normalizePortalScope` maps any of them to a PortalKey.
 */
export type Role = string;

/** Each portal, its URL prefix, and where a member of that portal lands. */
export interface PortalDef {
  key: PortalKey;
  /** URL prefix that scopes the portal (everything under it is portal-scoped). */
  basePath: string;
  /** Per-portal login page. */
  loginPath: string;
  /** Where a user of this portal goes after login. */
  dashboardPath: string;
  /** Human label (for selector page / errors / login branding). */
  name: string;
  /** One-line description for the login split-screen. */
  description: string;
  /** Brand accent (hex) for the login screen. */
  accentHex: string;
}

export const PORTALS: Record<PortalKey, PortalDef> = {
  contributor: {
    key: "contributor",
    basePath: "/contributor",
    loginPath: "/contributor/login",
    dashboardPath: "/contributor/dashboard",
    name: "Contributor Portal",
    description: "AI-matched tasks, a verified work portfolio, earnings, and credentials.",
    accentHex: "#0d9488",
  },
  enterprise: {
    key: "enterprise",
    basePath: "/enterprise",
    loginPath: "/enterprise/login",
    dashboardPath: "/enterprise/dashboard",
    name: "Enterprise Console",
    description: "SOW management, AI decomposition, team formation, and project delivery.",
    accentHex: "#92400e",
  },
  mentor: {
    key: "mentor",
    basePath: "/mentor",
    loginPath: "/mentor/login",
    dashboardPath: "/mentor/dashboard",
    name: "Mentor & Reviewer Workspace",
    description: "Review queue, mentorship sessions, escalations, and quality assurance.",
    accentHex: "#7c3aed",
  },
  admin: {
    key: "admin",
    basePath: "/admin",
    loginPath: "/admin/login",
    dashboardPath: "/admin/dashboard",
    name: "Platform Admin Console",
    description: "Tenants, taxonomy, governance, audit, and full platform oversight.",
    accentHex: "#9333ea",
  },
};

/** Ordered list — used to infer the portal from a pathname (longest prefix first is unnecessary; prefixes are disjoint). */
const PORTAL_LIST = Object.values(PORTALS);

/**
 * Resolve which portal a given role belongs to.
 *
 * Scope rules (dotted notation `<scope>.<role>`):
 *   - `contributor`            → contributor
 *   - `mentor`, `mentor.*`     → mentor
 *   - `ent`,    `ent.*`        → enterprise
 *   - `plat`,   `plat.*`       → admin
 *
 * Legacy / unscoped fallbacks (kept until the backend emits dotted scopes):
 *   - `enterprise`, `reviewer` → enterprise  (ent.reviewer = internal client
 *                                reviewer; lives under /enterprise/reviewer)
 *   - `admin`, `super_admin`, `superadmin` → admin
 *   - `student`, `freelancer`  → contributor (personas of the contributor portal)
 */
export function rolePortal(role: Role | null | undefined): PortalKey | null {
  if (!role) return null;
  const r = role.toLowerCase();
  const scope = r.includes(".") ? r.slice(0, r.indexOf(".")) : r;

  switch (scope) {
    case "contributor":
    case "student":
    case "freelancer":
      return "contributor";
    case "mentor":
      return "mentor";
    case "ent":
    case "enterprise":
    case "reviewer":
      return "enterprise";
    case "plat":
    case "admin":
    case "super_admin":
    case "superadmin":
    case "university_admin":
      return "admin";
    default:
      return null;
  }
}

/** All portals a set of roles can access. */
export function portalsForRoles(roles: Role[]): PortalKey[] {
  const set = new Set<PortalKey>();
  for (const role of roles) {
    const p = rolePortal(role);
    if (p) set.add(p);
  }
  return [...set];
}

/** The portal that owns a given pathname, or null if the path is portal-agnostic. */
export function portalForPath(pathname: string): PortalKey | null {
  for (const p of PORTAL_LIST) {
    if (pathname === p.basePath || pathname.startsWith(p.basePath + "/")) {
      return p.key;
    }
  }
  return null;
}

/** Post-login destination for a user given their roles. */
export function homePathForRoles(roles: Role[]): string {
  const portals = portalsForRoles(roles);
  if (portals.length === 0) return "/auth/login?error=UnknownRole";
  if (portals.length > 1) return "/auth/select-portal";
  return PORTALS[portals[0]].dashboardPath;
}

/** Convenience for the common single-role case (NextAuth session carries one `role`). */
export function homePathForRole(role: Role | null | undefined): string {
  return homePathForRoles(role ? [role] : []);
}

/** Can a user with these roles enter the portal that owns `pathname`? */
export function canAccessPath(pathname: string, roles: Role[]): boolean {
  const portal = portalForPath(pathname);
  if (!portal) return true; // not a portal-scoped path
  return portalsForRoles(roles).includes(portal);
}
