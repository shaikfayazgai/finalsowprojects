/**
 * Admin · cross-tenant audit — spec doc 04 §5.J.
 * Same shape as enterprise audit but with a tenant column. Empty tenant = internal Glimmora action.
 */

export type AdminAuditSeverity = "info" | "warning" | "critical";

export interface MockAdminAuditEvent {
  id: string;
  timestamp: string;
  tenant?: string;           // human-readable; "" = Glimmora-internal
  tenantId?: string;
  actor: string;
  actorRole: string;
  action: string;            // e.g. "sow.approve"
  resourceType: string;
  resourceId: string;
  resourceLabel: string;
  severity: AdminAuditSeverity;
  ip?: string;
  details?: Record<string, string>;
}

export const MOCK_ADMIN_AUDIT_EVENTS: MockAdminAuditEvent[] = [
  { id: "ae-1004", timestamp: "2026-05-27T12:14:00Z", tenant: "Acme Corp",      tenantId: "t-acme",   actor: "Sandeep Kulkarni", actorRole: "ent.admin",    action: "sow.approve",       resourceType: "sow",        resourceId: "sow-9921",   resourceLabel: "SOW-9921 · API redesign",        severity: "info",     ip: "10.42.18.4",  details: { stage: "Final" } },
  { id: "ae-1003", timestamp: "2026-05-27T12:08:00Z", tenant: "Helios Studios", tenantId: "t-helios", actor: "Priya Iyer",       actorRole: "mentor.lead",   action: "review.accept",     resourceType: "review",     resourceId: "rv-8804",    resourceLabel: "RV-8804 · UI walkthroughs",      severity: "info" },
  { id: "ae-1002", timestamp: "2026-05-27T11:45:00Z", tenant: "",                                          actor: "Aishwarya Rao",    actorRole: "plat.admin",    action: "mentor.suspend",    resourceType: "mentor",     resourceId: "m-marco",    resourceLabel: "Marco Bianchi",                   severity: "warning",  details: { reason: "Pending T&S investigation" } },
  { id: "ae-1001", timestamp: "2026-05-27T10:50:00Z", tenant: "Helios Studios", tenantId: "t-helios", actor: "Helena Bourne",     actorRole: "ent.admin",    action: "user.invite",       resourceType: "user",       resourceId: "u-19",       resourceLabel: "designer-3@helios.io",            severity: "info" },
  { id: "ae-1000", timestamp: "2026-05-27T09:12:00Z", tenant: "",                                          actor: "Priyanka Bansal",  actorRole: "plat.ai",       action: "ai.prompt.rollback",resourceType: "prompt",     resourceId: "pr-rev-04",  resourceLabel: "review-assistant.score-rubric → v3", severity: "warning", details: { from: "v4", to: "v3" } },
  { id: "ae-0999", timestamp: "2026-05-27T08:40:00Z", tenant: "Acme Corp",      tenantId: "t-acme",   actor: "Meera Bhat",       actorRole: "ent.sponsor",   action: "decomp.approve",    resourceType: "decomposition", resourceId: "dp-441", resourceLabel: "DP-441 · Reporting V2",          severity: "info" },
  { id: "ae-0998", timestamp: "2026-05-27T07:50:00Z", tenant: "Northwind",      tenantId: "t-northwind", actor: "—",            actorRole: "system",        action: "payout.released",   resourceType: "payout",     resourceId: "po-3309",    resourceLabel: "Payout ₹4,200 → Anita Ramesh",   severity: "info" },
  { id: "ae-0997", timestamp: "2026-05-27T06:30:00Z", tenant: "Acme Corp",      tenantId: "t-acme",   actor: "Karthik Iyer",     actorRole: "ent.reviewer",  action: "review.accept",     resourceType: "review",     resourceId: "rv-8803",    resourceLabel: "RV-8803 · Order edge cases",     severity: "info" },
  { id: "ae-0996", timestamp: "2026-05-27T04:00:00Z", tenant: "Helios Studios", tenantId: "t-helios", actor: "Helena Bourne",    actorRole: "ent.admin",    action: "ratecard.update",   resourceType: "ratecard",   resourceId: "rc-12",      resourceLabel: "Designer L3 → $40/hr",            severity: "warning" },
  { id: "ae-0995", timestamp: "2026-05-26T22:10:00Z", tenant: "",                                          actor: "Anjali Rao",       actorRole: "plat.mpm",      action: "skill.add",         resourceType: "skill",      resourceId: "s-rust",     resourceLabel: "Rust (pending review)",          severity: "info" },
  { id: "ae-0994", timestamp: "2026-05-26T20:00:00Z", tenant: "Acme Corp",      tenantId: "t-acme",   actor: "Sandeep Kulkarni", actorRole: "ent.admin",    action: "sow.submit",        resourceType: "sow",        resourceId: "sow-9921",   resourceLabel: "SOW-9921 → approval pipeline",   severity: "info" },
  { id: "ae-0993", timestamp: "2026-05-26T18:50:00Z", tenant: "",                                          actor: "Vikram Shenoy",    actorRole: "plat.tsm",      action: "tenant.provision",  resourceType: "tenant",     resourceId: "t-reporting",resourceLabel: "Reporting Inc.",                  severity: "info" },
];

export function findAdminAuditEvent(id: string) {
  return MOCK_ADMIN_AUDIT_EVENTS.find((e) => e.id === id);
}
