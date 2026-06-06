/**
 * Reviewer v3 types — Validation orchestration model.
 * Reviewer sits between mentor governance and enterprise acceptance.
 * Outputs a recommendation, not a decision.
 */

export type ValidationPhase =
  | "fresh"
  | "in_validation"
  | "ready_for_enterprise"
  | "mentor_revisit"
  | "escalation"
  | "hold";

export type ValidationFlag =
  | "missing_evidence"
  | "conflicting_review"
  | "sla_breach"
  | "stale"
  | "governance_freeze"
  | "duplicate_submission"
  | "lineage_blocked"
  | "acceptance_rollback";

export type RecommendationKind =
  | "ready_for_enterprise"
  | "mentor_revisit"
  | "escalation_review"
  | "governance_hold"
  | "evidence_incomplete";

export type EvidenceGroup =
  | "milestone_evidence"
  | "operational_proof"
  | "governance_docs"
  | "review_lineage"
  | "acceptance_criteria"
  | "audit_artifacts";

export interface EvidenceVerification {
  /** key = artifact id */
  [artifactId: string]: "unverified" | "verified" | "rejected";
}

export interface RecommendationRecord {
  id: string;
  at: string;
  reviewer: string;
  kind: RecommendationKind;
  confidence: number; // 0–100
  note?: string;
}

export type ReviewerAuditKind =
  | "validation_opened"
  | "evidence_verified"
  | "evidence_rejected"
  | "recommendation_submitted"
  | "recommendation_revoked"
  | "escalation_raised"
  | "escalation_resolved"
  | "hold_applied"
  | "hold_released"
  | "owner_reassigned"
  | "conflict_resolved";

export interface ReviewerAuditEntry {
  id: string;
  at: string;
  kind: ReviewerAuditKind;
  actor: string;
  detail?: string;
}

export interface ReviewerEscalation {
  id: string;
  taskId: string;
  kind:
    | "missing_evidence"
    | "conflicting_review"
    | "governance_freeze"
    | "sla_breach"
    | "lineage_blocked"
    | "duplicate_submission";
  severity: "critical" | "high" | "watch";
  raisedAt: string;
  raisedBy: string;
  note?: string;
  resolvedAt?: string;
  resolution?: "reassigned" | "acknowledged" | "paused" | "resolved";
}

export interface ReviewerHold {
  raisedAt: string;
  raisedBy: string;
  reason: string;
  releasedAt?: string;
  releasedBy?: string;
}

export interface ValidationMetadata {
  taskId: string;
  /** overrides the derived phase when set */
  phase?: ValidationPhase;
  flags: ValidationFlag[];
  evidence: EvidenceVerification;
  recommendation?: RecommendationRecord;
  escalations: ReviewerEscalation[];
  hold?: ReviewerHold;
  audit: ReviewerAuditEntry[];
  reviewerInitials?: string;
}

export interface ValidationLifecycleNode {
  id: "contributor" | "mentor" | "reviewer" | "enterprise";
  label: string;
}

export const VALIDATION_LIFECYCLE: ValidationLifecycleNode[] = [
  { id: "contributor", label: "Contributor" },
  { id: "mentor", label: "Mentor" },
  { id: "reviewer", label: "Reviewer" },
  { id: "enterprise", label: "Enterprise" },
];

export const RECOMMENDATION_LABEL: Record<RecommendationKind, string> = {
  ready_for_enterprise: "Ready for Enterprise",
  mentor_revisit: "Mentor Revisit Required",
  escalation_review: "Escalation Review Needed",
  governance_hold: "Governance Hold",
  evidence_incomplete: "Evidence Incomplete",
};

export const EVIDENCE_GROUP_LABEL: Record<EvidenceGroup, string> = {
  milestone_evidence: "Milestone evidence",
  operational_proof: "Operational proof",
  governance_docs: "Governance documents",
  review_lineage: "Review lineage",
  acceptance_criteria: "Acceptance criteria",
  audit_artifacts: "Audit artifacts",
};

export const PHASE_LABEL: Record<ValidationPhase, string> = {
  fresh: "Fresh",
  in_validation: "In validation",
  ready_for_enterprise: "Ready for enterprise",
  mentor_revisit: "Mentor revisit",
  escalation: "Escalation",
  hold: "On hold",
};
