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

export const MOCK_ADMIN_AUDIT_EVENTS: MockAdminAuditEvent[] = [];

export function findAdminAuditEvent(id: string) {
  return MOCK_ADMIN_AUDIT_EVENTS.find((e) => e.id === id);
}
