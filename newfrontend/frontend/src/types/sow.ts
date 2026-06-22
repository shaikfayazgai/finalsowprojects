/**
 * SOW v3 types — single canonical state machine + orthogonal 2-gate
 * approval matrix. Replaces the two competing legacy lifecycles.
 */

export type SowState =
  | "intake"
  | "scoped"
  | "pending_approval"
  | "approved"
  | "decomposing"
  | "delivering"
  | "completed";

export type ApprovalGateId = "commercial" | "enterprise";

export type GateState =
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "clarification_requested";

export interface ApprovalGate {
  id: ApprovalGateId;
  label: string;
  approverName: string;
  approverInitials: string;
  state: GateState;
  decidedAt?: string;
  note?: string;
  daysInState: number;
  /** Active workload of this approver (for overload detection). */
  approverActiveCount: number;
}

export type EscalationReason =
  | "gate_rejected"
  | "stale_approval"
  | "deadlock"
  | "reviewer_overload"
  | "stale_workflow"
  | "ai_confidence_low";

export interface EscalationRecord {
  id: string;
  sowId: string;
  reason: EscalationReason;
  raisedAt: string;
  raisedBy: string;
  resolvedAt?: string;
  resolution?: "reassigned" | "overridden" | "convened" | "held" | "withdrawn";
  note?: string;
}

export type HoldReason = "compliance" | "budget" | "ops" | "legal" | "other";

export interface SowHold {
  raisedAt: string;
  raisedBy: string;
  reason: HoldReason;
  note?: string;
  releasedAt?: string;
  releasedBy?: string;
}

export type SowAuditKind =
  | "intake_started"
  | "scoped"
  | "submitted_for_approval"
  | "gate_decision"
  | "gate_reassigned"
  | "approved"
  | "rejected"
  | "decomposed"
  | "delivery_started"
  | "completed"
  | "escalated"
  | "escalation_resolved"
  | "held"
  | "released"
  | "edited";

export interface SowAuditEntry {
  id: string;
  at: string;
  kind: SowAuditKind;
  actor: string;
  detail?: string;
  /** Optional gate this row pertains to. */
  gateId?: ApprovalGateId;
}

export interface SowMetadata {
  sowId: string;
  state: SowState;
  gates: ApprovalGate[];
  escalations: EscalationRecord[];
  hold?: SowHold;
  audit: SowAuditEntry[];
  /** Timestamps captured at each lifecycle transition. */
  intakeStartedAt?: string;
  scopedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  decomposingAt?: string;
  deliveringAt?: string;
  completedAt?: string;
}

export interface SowLifecycleNode {
  state: SowState;
  label: string;
  sub: string;
}

export const SOW_LIFECYCLE: SowLifecycleNode[] = [
  { state: "intake", label: "Intake", sub: "Scope captured" },
  { state: "scoped", label: "Scoped", sub: "AI analysis cleared" },
  { state: "pending_approval", label: "Pending", sub: "Gate review" },
  { state: "approved", label: "Approved", sub: "Ready to decompose" },
  { state: "decomposing", label: "Decomposing", sub: "Plan + tasks" },
  { state: "delivering", label: "Delivering", sub: "Active execution" },
  { state: "completed", label: "Completed", sub: "Lifecycle closed" },
];

export const APPROVAL_GATES: { id: ApprovalGateId; label: string }[] = [
  { id: "commercial", label: "Glimmora Commercial" },
  { id: "enterprise", label: "Enterprise approval" },
];
