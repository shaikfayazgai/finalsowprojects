/**
 * Notification taxonomy + types — the canonical kind list comes from
 * doc 05 §6.2.
 */

export type NotificationChannel = "in_app" | "email" | "sms";

export type NotificationSeverity =
  | "critical" //       must reach the user (sms allowed)
  | "important" //      should reach the user (in_app + email)
  | "informational"; // nice to know (in_app only)

/**
 * 26 canonical kinds. Add to this list whenever a new state-change
 * surface needs to notify a user. The handler `dispatchNotification`
 * uses the kind to determine default channels when the user has no
 * explicit preference for it.
 */
export type NotificationKind =
  // Auth + identity
  | "auth.password_changed"
  | "auth.mfa_setup_required"
  | "auth.session_revoked"
  // Task lifecycle (contributor side)
  | "task.assigned"
  | "task.accepted"
  | "task.revision_requested"
  | "task.accepted_final"
  // Submission (contributor + mentor)
  | "submission.under_review"
  // Review (mentor)
  | "review.assigned"
  | "review.sla_warning"
  | "review.sla_breach"
  // Mentorship (mentor + contributor)
  | "mentorship.session_in_30min"
  | "mentorship.session_no_show"
  // Payout
  | "payout.eligible"
  | "payout.sent"
  | "payout.failed"
  // SOW (enterprise)
  | "sow.stage_changed"
  | "sow.approved"
  | "sow.rejected"
  // Governance + KYC + safety
  | "governance.case_assigned"
  | "governance.case_resolved"
  | "safety.case_received"
  | "kyc.approved"
  | "kyc.rejected"
  // System
  | "system.tenant_paused"
  | "system.agent_unavailable"
  // Generic — for ad-hoc dispatch (admin tools, etc.)
  | "system.generic";

/**
 * Default severity per kind. Drives channel resolution when the user
 * has no explicit preference. Critical kinds enable SMS (per locked
 * decision #9 — SMS reserved for critical only).
 */
export const DEFAULT_SEVERITY: Record<NotificationKind, NotificationSeverity> = {
  "auth.password_changed": "critical",
  "auth.mfa_setup_required": "important",
  "auth.session_revoked": "critical",
  "task.assigned": "important",
  "task.accepted": "informational",
  "task.revision_requested": "important",
  "task.accepted_final": "important",
  "submission.under_review": "informational",
  "review.assigned": "important",
  "review.sla_warning": "important",
  "review.sla_breach": "critical",
  "mentorship.session_in_30min": "important",
  "mentorship.session_no_show": "informational",
  "payout.eligible": "important",
  "payout.sent": "important",
  "payout.failed": "critical",
  "sow.stage_changed": "informational",
  "sow.approved": "important",
  "sow.rejected": "important",
  "governance.case_assigned": "important",
  "governance.case_resolved": "informational",
  "safety.case_received": "critical",
  "kyc.approved": "important",
  "kyc.rejected": "important",
  "system.tenant_paused": "critical",
  "system.agent_unavailable": "informational",
  "system.generic": "informational",
};

/**
 * Default channels per severity. User preferences override these
 * (except critical, which always has at least in_app + email).
 */
export const DEFAULT_CHANNELS: Record<NotificationSeverity, NotificationChannel[]> = {
  critical: ["in_app", "email", "sms"],
  important: ["in_app", "email"],
  informational: ["in_app"],
};

/**
 * Input to dispatchNotification — what the caller supplies.
 */
export interface NotificationDispatchInput {
  recipientUserId: string;
  tenantId?: string | null;
  kind: NotificationKind;
  /** Defaults to the kind's default severity. */
  severity?: NotificationSeverity;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
  resourceType?: string;
  resourceId?: string;
  /**
   * Caller-supplied channel override. When present, takes precedence
   * over user preferences AND default-by-severity. Critical channels
   * are still force-included even if absent here.
   */
  channels?: NotificationChannel[];
}

/**
 * Public-facing notification shape returned by the listing API.
 * Mirrors the row but with ISO strings for dates.
 */
export interface NotificationSummary {
  id: string;
  kind: string;
  /** Grouping bucket: action | update | payment | complaint | security. */
  category?: string;
  severity: string;
  title: string;
  body: string;
  actionUrl: string | null;
  actionLabel: string | null;
  resourceType: string | null;
  resourceId: string | null;
  channels: string[];
  dispatchedAt: string;
  readAt: string | null;
}
