/**
 * Audit service — public surface.
 *
 * Usage:
 *   import { auditEmit, SYSTEM_ACTOR } from "@/lib/audit";
 *
 *   await auditEmit({
 *     tenantId: tenant.id,
 *     actor: { userId, portalRole: 'ent.sponsor', sessionId, ipAddress, userAgent },
 *     action: 'sow.approve.business',
 *     resource: { type: 'sow', id: sow.id, label: sow.title },
 *     payload: { decision: 'approve', comment },
 *     before: { stage: 'business' },
 *     after: { stage: 'commercial' },
 *   });
 *
 * For system-fired events, use the SYSTEM_ACTOR constant in place of
 * the `actor` field.
 */

export { auditEmit, auditRead } from "./emit";
export { SYSTEM_ACTOR } from "./types";
export {
  canonicalJson,
  signAuditEvent,
  verifyAuditEvent,
  CURRENT_KEY_VERSION,
} from "./signature";
export type {
  AuditEventInput,
  AuditActor,
  AuditResource,
  AuditSeverity,
  EmittedAuditEvent,
} from "./types";
export type { AuditEmitOptions, AuditReadResult } from "./emit";

export {
  buildAuditExport,
  AuditExportError,
} from "./export";
export type {
  AuditExportFilter,
  AuditExportFormat,
  AuditExportResult,
} from "./export";
