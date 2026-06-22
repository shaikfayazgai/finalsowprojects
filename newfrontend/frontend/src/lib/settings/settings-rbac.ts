/**
 * Enterprise settings RBAC — doc 02 §3.2 sidebar mapping.
 */

export type SettingsSectionId = "tenant" | "team" | "plan" | "integrations" | "policies" | "workspace";

export type SettingsAccessLevel = "none" | "view" | "manage";

export interface SettingsSectionDef {
  id: SettingsSectionId;
  label: string;
  href: string;
  description: string;
}

export const SETTINGS_SECTIONS: SettingsSectionDef[] = [
  {
    id: "tenant",
    label: "Tenant & roles",
    href: "/enterprise/settings/tenant",
    description: "Tenant info, members, and role assignments.",
  },
  {
    id: "team",
    label: "Team",
    href: "/enterprise/settings/team",
    description: "Provision team members — reviewers, PMO, finance, IT/security, compliance.",
  },
  {
    id: "plan",
    label: "Plan & billing",
    href: "/enterprise/settings/plan",
    description: "Platform subscription, usage limits, and upgrade options.",
  },
  {
    id: "integrations",
    label: "Integrations",
    href: "/enterprise/settings/integrations",
    description: "SSO, webhooks, and ERP / procurement connectors.",
  },
  {
    id: "policies",
    label: "Policies",
    href: "/enterprise/settings/policies",
    description: "SLA templates, escalation rules, and governance thresholds.",
  },
  {
    id: "workspace",
    label: "Workspace security",
    href: "/enterprise/settings/security",
    description: "Session timeout, IP allowlist, and audit signing keys.",
  },
];

/** Role → section access per spec §3.2. */
const ACCESS: Record<SettingsSectionId, Partial<Record<string, SettingsAccessLevel>>> = {
  tenant: { admin: "manage", it: "view" },
  // Team provisioning is an admin function (backend `_require_enterprise_admin`
  // is the real gate). The tenant owner resolves to `admin` via /api/v1/me.
  team: { admin: "manage" },
  plan: { admin: "manage", finance: "view" },
  integrations: { admin: "manage", it: "manage" },
  policies: { admin: "manage", compliance: "manage" },
  workspace: { admin: "manage", it: "manage" },
};

export function getSectionAccess(
  tenantRoles: string[],
  section: SettingsSectionId,
): SettingsAccessLevel {
  let best: SettingsAccessLevel = "none";
  for (const role of tenantRoles) {
    const level = ACCESS[section][role];
    if (level === "manage") return "manage";
    if (level === "view") best = "view";
  }
  return best;
}

export function canAccessAnySettings(tenantRoles: string[]): boolean {
  return SETTINGS_SECTIONS.some(
    (section) => getSectionAccess(tenantRoles, section.id) !== "none",
  );
}

export function getAccessibleSections(tenantRoles: string[]): Array<
  SettingsSectionDef & { access: SettingsAccessLevel }
> {
  return SETTINGS_SECTIONS.map((section) => ({
    ...section,
    access: getSectionAccess(tenantRoles, section.id),
  })).filter((section) => section.access !== "none");
}

export function pathnameToSettingsSection(pathname: string): SettingsSectionId | null {
  if (pathname.startsWith("/enterprise/settings/tenant")) return "tenant";
  if (pathname.startsWith("/enterprise/settings/team")) return "team";
  if (pathname.startsWith("/enterprise/settings/plan")) return "plan";
  if (pathname.startsWith("/enterprise/settings/integrations")) return "integrations";
  if (pathname.startsWith("/enterprise/settings/policies")) return "policies";
  if (pathname.startsWith("/enterprise/settings/security")) return "workspace";
  return null;
}

export function canManageSection(
  tenantRoles: string[],
  section: SettingsSectionId,
): boolean {
  return getSectionAccess(tenantRoles, section) === "manage";
}
