/**
 * Enterprise-review domain types (M19).
 *
 * The two-stage review model: a mentor decides the work meets quality
 * bar (M16) → submission flips to 'accepted'; an enterprise reviewer
 * (ent.reviewer / ent.sponsor / ent.admin) makes the FINAL business
 * decision: accept (closes the loop) or rework (returns to contributor).
 *
 * The enterprise-review queue surfaces submissions where:
 *   - status === 'accepted' (mentor signed off)
 *   - no terminal enterprise decision yet
 *
 * Lifecycle on Submission:
 *   accepted → (claim) enterpriseReviewerId set
 *   accepted → (decide.accept) enterpriseDecidedAt + AcceptanceDecision('accept')
 *   accepted → (decide.rework) enterpriseDecidedAt + AcceptanceDecision('rework')
 *                              + status reverts to 'feedback_requested' so the
 *                              contributor can edit + resubmit through the
 *                              normal cycle.
 */

export type EnterpriseDecision = "accept" | "rework";

export interface EnterpriseReviewQueueItem {
  submissionId: string;
  taskDefinitionId: string;
  taskTitle: string;
  contributorId: string;
  contributorName: string;
  version: number;
  /** When the mentor flipped this to 'accepted'. */
  acceptedAt: string;
  /** Mentor who recommended. */
  mentorReviewerId: string | null;
  /** Enterprise reviewer holding the claim (null = unclaimed). */
  enterpriseReviewerId: string | null;
  enterpriseReviewerAssignedAt: string | null;
  artifactCount: number;
}

export interface EnterpriseDecisionResult {
  submissionId: string;
  decision: EnterpriseDecision;
  decisionId: string;
  decidedAt: string;
}
