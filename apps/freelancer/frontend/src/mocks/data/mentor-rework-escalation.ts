/**
 * Mentor Workspace V2 — Rework, Escalation, Governance Hold, Clarification
 * operational mock data.
 *
 * Powers /mentor/reviews/rework, /mentor/reviews/escalated,
 * /mentor/reviews/governance-holds, and /mentor/governance/audit.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

import type { RiskSeverity } from "./mentor-workspace";

export type WorkflowState =
  | "pending"
  | "rework"
  | "rework_requested"
  | "awaiting_contributor"
  | "revision_submitted"
  | "pending_validation"
  | "in_progress"
  | "ai_ready"
  | "overdue"
  | "escalated"
  | "escalation_routed"
  | "escalation_under_review"
  | "escalation_resolved"
  | "governance_hold"
  | "hold_released"
  | "blocked"
  | "clarification_pending"
  | "policy_review"
  | "closed";

export type CorrectionSeverity = "blocker" | "major" | "nit";
export type CorrectionStatus = "open" | "acknowledged" | "resolved" | "rejected";
export type EscalationCategory =
  | "spec_ambiguity"
  | "quality_dispute"
  | "contributor_conduct"
  | "reviewer_capacity"
  | "sla_breach"
  | "tooling_failure"
  | "policy_gap"
  | "compliance_concern";
export type EscalationTier =
  | "reviewer_pool_lead"
  | "mentor"
  | "enterprise_admin"
  | "platform_admin";
export type HoldKind = "legal" | "compliance" | "security" | "policy";

export interface GovernanceEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  category: "ai" | "human" | "system" | "policy" | "governance";
}

/* ────────────────── Anchored corrections ────────────────── */

export interface AnchoredCorrection {
  id: string;
  criterionId: string;
  criterionLabel: string;
  severity: CorrectionSeverity;
  required: boolean;
  description: string;
  internalNote?: string;
  evidenceRefs: string[];
  status: CorrectionStatus;
  contributorResponse?: string;
}

/* ────────────────── Clarifications ────────────────── */

export type ClarificationStatus = "pending" | "answered" | "resolved" | "expired";

export interface ClarificationMessage {
  id: string;
  author: string;
  authorRole: "mentor" | "reviewer" | "contributor";
  body: string;
  timestamp: string;
  attachments?: { label: string; size?: string }[];
}

export interface ClarificationThread {
  id: string;
  reviewId: string;
  raisedBy: string;
  status: ClarificationStatus;
  pauseSla: boolean;
  expectedBy: string;
  messages: ClarificationMessage[];
}

/* ────────────────── Rework ────────────────── */

export interface ReworkItem {
  id: string;
  reviewId: string;
  taskTitle: string;
  project: string;
  contributorCode: string;
  contributorReliability: number;
  round: number;
  totalRounds: number;
  state: WorkflowState;
  severity: RiskSeverity;
  raisedBy: string;
  raisedAt: string;
  dueAt: string;
  hoursRemaining: number;
  corrections: AnchoredCorrection[];
  whatWorked: string;
  contributorAck: { acknowledged: boolean; ackedAt?: string; note?: string };
  routingOnResubmit: "same_reviewer" | "fresh_reviewer";
  clarificationThreadId?: string;
  timeline: GovernanceEvent[];
}

/* ────────────────── Escalations ────────────────── */

export interface EscalationRoutingHop {
  tier: EscalationTier;
  owner: string;
  receivedAt: string;
  status: "received" | "in_review" | "passed" | "resolved";
  note?: string;
}

export interface EscalationItem {
  id: string;
  reviewId: string;
  taskTitle: string;
  project: string;
  contributorCode: string;
  type: EscalationCategory;
  rootCause: string;
  severity: RiskSeverity;
  state: WorkflowState;
  raisedBy: string;
  raisedAt: string;
  resolutionSlaHours: number;
  hoursRemaining: number;
  pausedReview: boolean;
  description: string;
  affectedAreas: string[];
  evidence: { label: string; size?: string }[];
  routing: {
    currentTier: EscalationTier;
    currentOwner: string;
    chain: EscalationRoutingHop[];
  };
  policyRefs: string[];
  timeline: GovernanceEvent[];
  proposedResolution?: string;
}

/* ────────────────── Holds ────────────────── */

export interface HoldItem {
  id: string;
  reviewId: string;
  taskTitle: string;
  project: string;
  kind: HoldKind;
  reason: string;
  heldBy: string;
  heldSince: string;
  expectedRelease: string;
  hoursActive: number;
  contributorCode: string;
  policyRefs: string[];
  restrictedActions: string[];
  state: WorkflowState;
  severity: RiskSeverity;
  timeline: GovernanceEvent[];
  awaitingExternal?: string;
}

/* ────────────────── State display map ────────────────── */

export const workflowStateLabel: Record<WorkflowState, string> = {
  pending: "Pending",
  rework: "Rework",
  rework_requested: "Rework requested",
  awaiting_contributor: "Awaiting contributor",
  revision_submitted: "Revision submitted",
  pending_validation: "Pending mentor validation",
  in_progress: "In progress",
  ai_ready: "AI ready",
  overdue: "Overdue",
  escalated: "Escalated",
  escalation_routed: "Routed",
  escalation_under_review: "Under review",
  escalation_resolved: "Resolved",
  governance_hold: "Governance hold",
  hold_released: "Hold released",
  blocked: "Blocked",
  clarification_pending: "Clarification pending",
  policy_review: "Policy review",
  closed: "Closed",
};

export const escalationCategoryLabel: Record<EscalationCategory, string> = {
  spec_ambiguity: "Spec ambiguity",
  quality_dispute: "Quality dispute",
  contributor_conduct: "Contributor conduct",
  reviewer_capacity: "Reviewer capacity",
  sla_breach: "SLA breach risk",
  tooling_failure: "Tooling failure",
  policy_gap: "Policy gap",
  compliance_concern: "Compliance concern",
};

export const tierLabel: Record<EscalationTier, string> = {
  reviewer_pool_lead: "Reviewer pool lead",
  mentor: "Mentor",
  enterprise_admin: "Enterprise admin",
  platform_admin: "Platform admin",
};

export const holdKindLabel: Record<HoldKind, string> = {
  legal: "Legal",
  compliance: "Compliance",
  security: "Security",
  policy: "Policy",
};

/* ────────────────── Mock collections ────────────────── */

export const reworkItems: ReworkItem[] = [];

export const clarificationThreads: ClarificationThread[] = [];

export const escalationItems: EscalationItem[] = [];

export const holdItems: HoldItem[] = [];

/* ────────────────── Cross-workflow audit ────────────────── */

export const governanceAuditEvents: GovernanceEvent[] = [
  ...reworkItems.flatMap((r) => r.timeline.map((e) => ({ ...e, id: `${r.id}-${e.id}` }))),
  ...escalationItems.flatMap((e) => e.timeline.map((ev) => ({ ...ev, id: `${e.id}-${ev.id}` }))),
  ...holdItems.flatMap((h) => h.timeline.map((e) => ({ ...e, id: `${h.id}-${e.id}` }))),
].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
