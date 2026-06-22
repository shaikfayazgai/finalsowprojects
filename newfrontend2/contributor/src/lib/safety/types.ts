/**
 * Safety-report domain types (M22).
 *
 * A SafetyReport flows through:
 *   open → triaging → (resolved | dismissed | escalated_external)
 *
 * Resolution actions express the result of triage and drive downstream
 * effects (warning_issued / account_suspended / tenant_paused are the
 * meaningful "did something" outcomes; no_action / duplicate close the
 * report without modifying any other entity).
 */

export type SubjectKind =
  | "user"
  | "task"
  | "tenant"
  | "submission"
  | "comment";

export type SafetyCategory =
  | "harassment"
  | "fraud"
  | "spam"
  | "unsafe_work"
  | "plagiarism"
  | "other";

export type SafetySeverity = "immediate" | "high" | "normal" | "low";

export type SafetyStatus =
  | "open"
  | "triaging"
  | "resolved"
  | "dismissed"
  | "escalated_external";

export type ResolutionAction =
  | "no_action"
  | "warning_issued"
  | "account_suspended"
  | "content_removed"
  | "tenant_paused"
  | "external_handoff"
  | "duplicate";

export interface SafetyReportDetail {
  id: string;
  reporterId: string;
  subjectKind: SubjectKind;
  subjectId: string;
  tenantId: string | null;
  category: SafetyCategory;
  severity: SafetySeverity;
  description: string;
  evidence: Record<string, unknown> | null;
  status: SafetyStatus;
  assigneeId: string | null;
  assignedAt: string | null;
  decidedAt: string | null;
  decidedBy: string | null;
  resolutionAction: ResolutionAction | null;
  resolutionNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileReportInput {
  subjectKind: SubjectKind;
  subjectId: string;
  tenantId?: string | null;
  category: SafetyCategory;
  severity?: SafetySeverity;
  description: string;
  evidence?: Record<string, unknown>;
}

export interface ResolveReportInput {
  action: ResolutionAction;
  /** Required for any action that affects another entity. */
  note?: string;
  /** Set when the operator wants escalated_external instead of resolved. */
  escalate?: boolean;
  /** Set when the operator wants dismissed instead of resolved. */
  dismiss?: boolean;
}
