/**
 * Admin · platform-wide RBAC roles — spec doc 04 §5.O.
 * Phase 1: list of role definitions across all portals.
 */

export type RoleScope = "plat" | "ent" | "mentor" | "contributor";

export interface MockRoleDef {
  code: string;              // e.g. "ent.admin"
  scope: RoleScope;
  description: string;
  permissions: string[];     // human-readable
  builtIn: boolean;
  membersCount: number;
}

export const MOCK_ROLES: MockRoleDef[] = [
  // Platform-side
  { code: "plat.admin",        scope: "plat", description: "Glimmora super-admin. Full read/write across the operations portal.",       permissions: ["All platform operations", "Cross-tenant audit + export", "Edit RBAC roles", "Disable AI agents", "Pause payment rails"], builtIn: true, membersCount: 0 },
  { code: "plat.tsm",          scope: "plat", description: "Tenant Success Manager — onboards and supports enterprise tenants.",         permissions: ["Provision tenant", "Suspend tenant", "View audit", "Read system health"], builtIn: true, membersCount: 0 },
  { code: "plat.mpm",          scope: "plat", description: "Mentor Program Manager — curates the mentor pool + skill taxonomy.",          permissions: ["Create / suspend mentor", "Edit competency", "Add / merge / deprecate skills", "Edit rubric templates"], builtIn: true, membersCount: 0 },
  { code: "plat.tns",          scope: "plat", description: "Trust & Safety Officer — triages safety + grievance + dispute cases.",         permissions: ["Triage governance cases", "KYC decision", "Suspend mentor via governance", "Forward to legal"], builtIn: true, membersCount: 0 },
  { code: "plat.compliance",   scope: "plat", description: "Compliance Officer — owns cross-tenant audit + retention evidence.",            permissions: ["Read all audit events", "Export audit slices", "Review consent + retention configs"], builtIn: true, membersCount: 0 },
  { code: "plat.payments",     scope: "plat", description: "Payments Operator — configures and reconciles payment rails.",                  permissions: ["Edit payment rail config", "Pause / drain rail", "View payout queue"], builtIn: true, membersCount: 0 },
  { code: "plat.partnerships", scope: "plat", description: "Partnership Manager — universities + women-workforce orgs.",                    permissions: ["Add / edit university partner", "Add / edit WW partner", "View KYC for WW track"], builtIn: true, membersCount: 0 },
  { code: "plat.ai",           scope: "plat", description: "AI Operator — agent + prompt configuration.",                                  permissions: ["Enable / disable agent", "Rollback prompt", "Save new prompt version", "Test prompt in sandbox"], builtIn: true, membersCount: 0 },

  // Enterprise-side
  { code: "ent.admin",         scope: "ent",  description: "Enterprise tenant administrator.",                                              permissions: ["Manage tenant users", "Configure integrations", "Edit policies", "Approve SOW", "View audit"], builtIn: true, membersCount: 0 },
  { code: "ent.sponsor",       scope: "ent",  description: "Business sponsor approving SOWs at the business stage.",                        permissions: ["Approve SOW (business)", "Decline SOW", "Comment on SOW"], builtIn: true, membersCount: 0 },
  { code: "ent.pmo",           scope: "ent",  description: "Programme management office — runs delivery + decomposition.",                  permissions: ["Edit decomposition", "Manage projects", "Reassign tasks"], builtIn: true, membersCount: 0 },
  { code: "ent.finance",       scope: "ent",  description: "Finance team — invoicing, rate cards, payouts oversight.",                      permissions: ["View invoices", "Edit rate cards", "Export billing"], builtIn: true, membersCount: 0 },
  { code: "ent.reviewer",      scope: "ent",  description: "Client-side reviewer — second-stage acceptance on two-stage reviews.",          permissions: ["Decide on routed reviews", "View review history"], builtIn: true, membersCount: 0 },
  { code: "ent.it",            scope: "ent",  description: "IT / security counterpart at the enterprise.",                                   permissions: ["Configure SSO / integrations", "View security audit"], builtIn: true, membersCount: 0 },

  // Mentor-side
  { code: "mentor",            scope: "mentor", description: "Mentor — first-pass reviewer + coach.",                                        permissions: ["Decide on assigned reviews", "Hold mentorship session", "Escalate"], builtIn: true, membersCount: 0 },
  { code: "mentor.senior",     scope: "mentor", description: "Senior mentor — broader competency, can pair with other mentors.",             permissions: ["All mentor actions", "Visible in cross-pool"], builtIn: true, membersCount: 0 },
  { code: "mentor.lead",       scope: "mentor", description: "Pool lead — coordinates pool load + escalations.",                              permissions: ["All mentor actions", "Pool load view", "Reassign within pool"], builtIn: true, membersCount: 0 },

  // Contributor-side
  { code: "contributor",       scope: "contributor", description: "Default contributor — does tasks and earns.",                              permissions: ["Accept / decline assigned tasks", "Submit work", "Withdraw earnings"], builtIn: true, membersCount: 0 },
];
