/**
 * Submission domain types.
 *
 * Status lifecycle:
 *   draft → submitted → under_review → (feedback_requested → resubmitted → under_review)*
 *                                    → accepted (mentor)
 *                                    → rejected (mentor)
 *
 * Resubmitted re-enters the queue; mentor flips it back to under_review
 * when they pick it up.
 */

export type SubmissionStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "feedback_requested"
  | "resubmitted"
  | "accepted"
  | "rejected";

export type ArtifactKind = "file" | "link" | "evidence";

export interface SubmissionArtifactDetail {
  id: string;
  kind: ArtifactKind;
  name: string;
  url: string;
  mimeType: string | null;
  sizeBytes: number | null;
  caption: string | null;
  scanCleared: boolean;
  /** Set when the file-scan worker has attempted at least one scan. */
  scanAttemptedAt: string | null;
  /** Most recent scan failure reason (null on clear or never-scanned). */
  scanError: string | null;
  createdAt: string;
}

export interface SubmissionDetail {
  id: string;
  taskDefinitionId: string;
  contributorId: string;
  tenantId: string;
  version: number;
  status: SubmissionStatus;
  body: string | null;
  payload: Record<string, unknown> | null;
  reviewerId: string | null;
  reviewerAssignedAt: string | null;
  submittedAt: string | null;
  decidedAt: string | null;
  /** AI rubric-assist suggestion captured at decision time (M16). */
  aiSuggestedDecision: "accept" | "reject" | "feedback_requested" | null;
  /** FK to AgentInvocation when AI was consulted. */
  aiInvocationId: string | null;
  /** Mentor's free-form decision rationale. */
  decisionRationale: string | null;
  createdAt: string;
  updatedAt: string;
  artifacts: SubmissionArtifactDetail[];
}

export interface SubmissionSummary {
  id: string;
  taskDefinitionId: string;
  taskTitle: string;
  contributorId: string;
  contributorName: string;
  version: number;
  status: SubmissionStatus;
  submittedAt: string | null;
  reviewerId: string | null;
  reviewerName?: string | null;
  artifactCount: number;
}

export interface CreateDraftInput {
  taskDefinitionId: string;
  body?: string;
  payload?: Record<string, unknown>;
}

export interface UpdateDraftInput {
  body?: string;
  payload?: Record<string, unknown>;
}

export interface AttachArtifactInput {
  kind: ArtifactKind;
  name: string;
  url: string;
  mimeType?: string;
  sizeBytes?: number;
  caption?: string;
  /** Defaults to true for 'link' / 'evidence'; false for 'file' until scan completes. */
  scanCleared?: boolean;
}
