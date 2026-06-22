/**
 * Projects v3 types — explicit lifecycle + health + flag model.
 * Replaces the implicit "health" field with a richer state machine so
 * milestone progression, governance holds, and SLA risk can all be
 * surfaced without ambiguity.
 */

export type ProjectLifecycleState =
  | "intake"
  | "decomposition"
  | "staffing"
  | "execution"
  | "mentor_review"
  | "reviewer_validation"
  | "enterprise_acceptance"
  | "billing"
  | "closed";

export type ProjectHealth = "on_track" | "watch" | "at_risk" | "completed";

export type ProjectFlag =
  | "blocked"
  | "on_hold"
  | "stale"
  | "sla_breach"
  | "budget_overrun"
  | "contributor_dropout"
  | "reviewer_backlog"
  | "acceptance_rejected"
  | "billing_hold";

export type MilestoneState =
  | "upcoming"
  | "active"
  | "blocked"
  | "delayed"
  | "done";

export interface MilestoneRecord {
  id: string;
  label: string;
  state: MilestoneState;
  /** Display dates; "—" when unknown. */
  startedAt?: string;
  dueAt?: string;
  completedAt?: string;
  /** Indicates this milestone unlocks a downstream billing event. */
  billingTrigger?: boolean;
  /** Indicates this milestone gates a governance approval. */
  reviewGate?: boolean;
  note?: string;
}

export interface ExceptionRecord {
  id: string;
  projectId: string;
  kind:
    | "blocked_milestone"
    | "sla_breach"
    | "contributor_dropout"
    | "reviewer_backlog"
    | "acceptance_rejected"
    | "governance_hold"
    | "dependency_break"
    | "budget_overrun";
  severity: "critical" | "high" | "watch";
  raisedAt: string;
  raisedBy: string;
  note?: string;
  resolvedAt?: string;
  resolution?: "reassigned" | "overridden" | "acknowledged" | "paused" | "withdrawn";
}

export type ProjectAuditKind =
  | "milestone_started"
  | "milestone_completed"
  | "milestone_blocked"
  | "phase_advanced"
  | "owner_reassigned"
  | "hold_applied"
  | "hold_released"
  | "exception_raised"
  | "exception_resolved"
  | "risk_acknowledged"
  | "edited";

export interface ProjectAuditEntry {
  id: string;
  at: string;
  kind: ProjectAuditKind;
  actor: string;
  detail?: string;
  milestoneId?: string;
}

export interface ProjectHold {
  raisedAt: string;
  raisedBy: string;
  reason: "compliance" | "budget" | "ops" | "legal" | "other";
  note?: string;
  releasedAt?: string;
  releasedBy?: string;
}

export interface ProjectMetadata {
  projectId: string;
  /** Operator-recorded lifecycle override. Derived if unset. */
  lifecycleOverride?: ProjectLifecycleState;
  /** Operator-recorded milestone state overrides keyed by milestone id. */
  milestoneOverrides?: Record<string, MilestoneState>;
  flags: ProjectFlag[];
  exceptions: ExceptionRecord[];
  hold?: ProjectHold;
  audit: ProjectAuditEntry[];
  /** Operator who currently owns the program (overrides default ownerInitials). */
  ownerOverride?: string;
}

export interface ProjectLifecycleNode {
  state: ProjectLifecycleState;
  label: string;
  sub: string;
}

export const PROJECT_LIFECYCLE: ProjectLifecycleNode[] = [
  { state: "intake", label: "Intake", sub: "SOW signed" },
  { state: "decomposition", label: "Decomposition", sub: "Plan drafted" },
  { state: "staffing", label: "Staffing", sub: "Team assembled" },
  { state: "execution", label: "Execution", sub: "Contributors active" },
  { state: "mentor_review", label: "Mentor review", sub: "Quality gate" },
  { state: "reviewer_validation", label: "Reviewer", sub: "Validation" },
  { state: "enterprise_acceptance", label: "Acceptance", sub: "Enterprise sign-off" },
  { state: "billing", label: "Billing", sub: "Invoice eligible" },
  { state: "closed", label: "Closed", sub: "Program complete" },
];

export const HEALTH_LABEL: Record<ProjectHealth, string> = {
  on_track: "On track",
  watch: "Watch",
  at_risk: "At risk",
  completed: "Completed",
};
