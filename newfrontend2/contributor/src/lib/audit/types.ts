/**
 * Audit event input passed to auditEmit().
 *
 * Caller supplies everything *except* id, timestamp, and signature —
 * the service mints id (UUID) + timestamp (now) and computes the HMAC
 * signature before insert.
 *
 * Schema reference: prisma/schema.prisma AuditEvent model
 * Spec reference:   docs/portal-specs/05-cross-functional.md §4.2
 */

export interface AuditEventInput {
  /**
   * Tenant scope. Null only for platform-internal events (e.g., tenant
   * provisioning itself). Every other event MUST set this for proper
   * scoping + RLS enforcement.
   */
  tenantId?: string | null;

  actor: AuditActor;

  /**
   * Dotted action verb. See cross-functional doc §4.4 for the canonical
   * action catalog (sow.approve, review.accept, payout.release, etc.).
   */
  action: string;

  resource: AuditResource;

  /** Action-specific data. */
  payload: Record<string, unknown>;

  /** Pre-mutation snapshot for state transitions. */
  before?: Record<string, unknown> | null;

  /** Post-mutation snapshot for state transitions. */
  after?: Record<string, unknown> | null;

  /** Defaults to 'info'. */
  severity?: AuditSeverity;
}

export interface AuditActor {
  userId: string;
  /** e.g., 'ent.sponsor', 'mentor.lead', 'plat.tsm', 'system' */
  portalRole: string;
  /** Session id at time of action — null for system-fired events. */
  sessionId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditResource {
  /** e.g., 'sow' | 'task' | 'review' | 'payout' | 'tenant' | 'user' | 'role' */
  type: string;
  id: string;
  /**
   * Human-readable label cached at write time so audit UI doesn't need
   * to join into the resource table (which may have been soft-deleted
   * or renamed). E.g., the SOW title at the time of approval.
   */
  label?: string | null;
}

export type AuditSeverity = "info" | "warning" | "error" | "critical";

/**
 * Reserved actor used for system-fired events (cron jobs, mentor reply
 * simulator, key rotation, RLS deny audit, etc.). Use this any time no
 * human acts.
 */
export const SYSTEM_ACTOR: AuditActor = {
  userId: "system",
  portalRole: "system",
} as const;

/**
 * Return value of auditEmit() — the minimum the caller needs to
 * correlate further actions or display "logged as event #X".
 */
export interface EmittedAuditEvent {
  id: string;
  timestamp: Date;
  signature: string;
}
