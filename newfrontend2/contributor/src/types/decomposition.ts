/**
 * Decomposition v3 types — single canonical 7-state lifecycle + orthogonal
 * 3-gate approval matrix (Architecture · Workforce · Governance).
 */

export type PlanState =
  | "drafting"
  | "scoped"
  | "ai_reviewed"
  | "pending_approval"
  | "approved"
  | "decomposed"
  | "in_delivery";

export type GateId = "architecture" | "workforce" | "governance";

export type GateState =
  | "pending"
  | "in_review"
  | "approved"
  | "rejected"
  | "clarification_requested";

export interface ApprovalGate {
  id: GateId;
  label: string;
  approverName: string;
  approverInitials: string;
  state: GateState;
  decidedAt?: string;
  note?: string;
  daysInState: number;
  approverActiveCount: number;
}

export type HoldReason = "compliance" | "scope_change" | "budget" | "ops" | "other";

export interface PlanHold {
  raisedAt: string;
  raisedBy: string;
  reason: HoldReason;
  note?: string;
  releasedAt?: string;
  releasedBy?: string;
}

export type EscalationReason =
  | "gate_rejected"
  | "stale_approval"
  | "deadlock"
  | "reviewer_overload"
  | "blocked_dependency"
  | "stale_workflow";

export interface EscalationRecord {
  id: string;
  planId: string;
  reason: EscalationReason;
  raisedAt: string;
  raisedBy: string;
  resolvedAt?: string;
  resolution?: "reassigned" | "overridden" | "convened" | "held" | "withdrawn";
  note?: string;
}

export type DecompAuditKind =
  | "drafted"
  | "scoped"
  | "ai_reviewed"
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
  | "edited"
  | "ai_hint_applied"
  | "ai_hint_dismissed";

export interface DecompAuditEntry {
  id: string;
  at: string;
  kind: DecompAuditKind;
  actor: string;
  detail?: string;
  gateId?: GateId;
  workstreamId?: string;
  hintId?: string;
}

export interface PlanMetadata {
  planId: string;
  state: PlanState;
  gates: ApprovalGate[];
  escalations: EscalationRecord[];
  hold?: PlanHold;
  audit: DecompAuditEntry[];
  appliedHintIds: string[];
  dismissedHintIds: string[];
  // Lifecycle timestamps
  draftedAt?: string;
  scopedAt?: string;
  aiReviewedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  decomposedAt?: string;
  deliveryStartedAt?: string;
  completedAt?: string;
}

export interface PlanLifecycleNode {
  state: PlanState;
  label: string;
  sub: string;
}

export const PLAN_LIFECYCLE: PlanLifecycleNode[] = [
  { state: "drafting", label: "Drafting", sub: "Workstreams forming" },
  { state: "scoped", label: "Scoped", sub: "Structure complete" },
  { state: "ai_reviewed", label: "AI reviewed", sub: "Risk + capacity" },
  { state: "pending_approval", label: "Pending", sub: "Gate review" },
  { state: "approved", label: "Approved", sub: "Ready to commit" },
  { state: "decomposed", label: "Decomposed", sub: "Tasks seeded" },
  { state: "in_delivery", label: "In delivery", sub: "Active execution" },
];

export const APPROVAL_GATES: { id: GateId; label: string }[] = [
  { id: "architecture", label: "Architecture" },
  { id: "workforce", label: "Workforce" },
  { id: "governance", label: "Governance" },
];

export interface DependencyEdge {
  fromWorkstreamId: string;
  toWorkstreamId: string;
  state: "cleared" | "pending" | "blocked";
  reason?: string;
}

export interface MilestoneNode {
  id: string;
  label: string;
  targetDate: string;
  status: "upcoming" | "active" | "blocked" | "done";
  workstreamIds: string[];
}
