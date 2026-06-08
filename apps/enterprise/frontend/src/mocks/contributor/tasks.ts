/**
 * Mock tasks covering every lifecycle state from spec §7.1.
 *
 *   matched / accepted / in_progress / blocked / awaiting_clarification /
 *   ready_for_submission / under_review / revision_requested /
 *   accepted (completed) / rejected
 *
 * The shape matches `ContributorTaskSummary` + workroom fields so the
 * UI can read these without backend changes.
 */

export type ContributorTaskMockStatus =
  | "matched"
  | "accepted"
  | "in_progress"
  | "blocked"
  | "awaiting_clarification"
  | "ready_for_submission"
  | "submitted"
  | "under_review"
  | "feedback_requested"
  | "resubmitted"
  | "completed"
  | "rejected";

export interface MockTask {
  id: string;
  externalKey: string;
  title: string;
  status: ContributorTaskMockStatus;
  description: string;
  acceptanceCriteria: string[];
  requiredSkills: string[];
  estimatedHours: number;
  complexity: "small" | "medium" | "large";
  agreedCurrency: "INR";
  agreedRatePerHour: number;
  assignedAt: string;
  acceptedAt: string | null;
  /** When the task hit a terminal state (completed / rejected). */
  decidedAt: string | null;
  /** SLA deadline in ISO; used by the list + workroom Due column. */
  dueAt: string;
  sow: { id: string; title: string; tenantId: string; tenantName: string };
  milestone: { id: string; name: string } | null;
  /** Mentor / reviewer assigned to this task. */
  mentor: { id: string; name: string; initials: string; role: string };
  /** Round counter for revision tracking (1-based). */
  round: number;
  totalRounds: number;
  /** Per-criterion 'addressed' flags. Same length as acceptanceCriteria. */
  criteriaAddressed: boolean[];
  /** Readiness 0–100 — visible in list + workroom footer. */
  readinessPct: number;
}

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3_600_000).toISOString();
const hoursFromNow = (h: number) => new Date(now + h * 3_600_000).toISOString();

export const MOCK_TASKS: MockTask[] = [];

export function getMockTask(id: string): MockTask | undefined {
  return MOCK_TASKS.find((t) => t.id === id);
}
