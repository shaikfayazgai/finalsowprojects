/**
 * Mock submissions. One per task that has reached or passed the submit
 * gate. Status mirrors the parent task's contributor-facing state.
 */

export interface MockSubmissionArtifact {
  id: string;
  kind: "file" | "link";
  name: string;
  url: string;
  sizeBytes: number | null;
  mimeType: string | null;
  scanCleared: boolean;
  scanError: string | null;
  scanAttemptedAt: string | null;
  createdAt: string;
}

export interface MockSubmission {
  id: string;
  taskId: string;
  version: number;
  status: "draft" | "submitted" | "under_review" | "feedback_requested" | "resubmitted" | "accepted" | "rejected";
  body: string | null;
  routing: "mentor" | "mentor_client";
  submittedAt: string | null;
  decidedAt: string | null;
  reviewerId: string | null;
  reviewerName: string | null;
  /** Structured feedback (3-block view per §5.E.1 / §5.H.2). */
  feedback: {
    whatWorked: string;
    requiredCorrections: Array<{ id: string; criterion: string; description: string; severity: "major" | "minor"; addressed: boolean; resolutionNote?: string }>;
    suggestions: string[];
  } | null;
  /** Free-text rationale (rejected / one-line revision). */
  decisionRationale: string | null;
  artifacts: MockSubmissionArtifact[];
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const MOCK_SUBMISSIONS: MockSubmission[] = [];

export function getMockSubmissionForTask(taskId: string): MockSubmission | undefined {
  return MOCK_SUBMISSIONS.find((s) => s.taskId === taskId);
}

export function getMockSubmission(id: string): MockSubmission | undefined {
  return MOCK_SUBMISSIONS.find((s) => s.id === id);
}
