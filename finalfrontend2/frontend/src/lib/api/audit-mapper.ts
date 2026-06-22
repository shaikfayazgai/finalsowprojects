/**
 * Maps AuditViewEvent (from /api/audit/export?format=json) to the
 * MockAdminAuditEvent shape that audit-workspace and related components expect.
 *
 * Field mapping:
 *   AuditViewEvent.actor.userId        → MockAdminAuditEvent.actor        (display name falls back to userId)
 *   AuditViewEvent.actor.portalRole    → MockAdminAuditEvent.actorRole
 *   AuditViewEvent.actor.ipAddress     → MockAdminAuditEvent.ip
 *   AuditViewEvent.resource.type       → MockAdminAuditEvent.resourceType
 *   AuditViewEvent.resource.id         → MockAdminAuditEvent.resourceId
 *   AuditViewEvent.resource.label      → MockAdminAuditEvent.resourceLabel
 *   AuditViewEvent.payload             → MockAdminAuditEvent.details       (string-valued pairs only)
 *   AuditViewEvent.tenantId            → MockAdminAuditEvent.tenantId
 *   (tenant display name not in payload — keep empty string so UI shows "Glimmora internal" for null)
 */

import type { AuditViewEvent } from "@/lib/api/audit-view";
import type { MockAdminAuditEvent } from "@/mocks/admin/audit";

/**
 * Extract only string-valued key-value pairs from the payload so they can be
 * shown in the "Extended payload" details section.
 */
function payloadToDetails(
  payload: unknown,
): Record<string, string> | undefined {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return undefined;
  }
  const entries = Object.entries(payload as Record<string, unknown>).filter(
    ([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean",
  );
  if (entries.length === 0) return undefined;
  return Object.fromEntries(entries.map(([k, v]) => [k, String(v)]));
}

export function mapAuditViewEventToMock(e: AuditViewEvent): MockAdminAuditEvent {
  return {
    id: e.id,
    timestamp: e.timestamp,
    // tenantId present but no display name available from this endpoint
    tenantId: e.tenantId ?? undefined,
    tenant: e.tenantId ?? "",          // empty string = Glimmora internal
    actor: e.actor.userId,
    actorRole: e.actor.portalRole,
    action: e.action,
    resourceType: e.resource.type,
    resourceId: e.resource.id,
    resourceLabel: e.resource.label ?? e.resource.id,
    severity: e.severity,
    ip: e.actor.ipAddress ?? undefined,
    details: payloadToDetails(e.payload),
  };
}
