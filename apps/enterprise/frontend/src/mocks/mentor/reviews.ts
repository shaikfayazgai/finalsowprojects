/**
 * Mentor reviews — spec doc 03 §5.C / §5.D.
 *
 * Each review represents an assignment (task + submission round) routed to
 * a mentor. The queue is sorted SLA-closest-first.
 */

export type SlaTier = "breached" | "critical" | "warning" | "watch" | "healthy";
export type ReviewStage = "single" | "two_stage";
export type ReviewState =
  | "open"
  | "draft_saved"
  | "decided_accept"
  | "decided_rework"
  | "decided_reject"
  | "withdrawn"
  | "reassigned";

export interface MockRubricCriterion {
  id: string;
  label: string;
  aiSuggestion: 1 | 2 | 3 | 4 | 5 | null;
  aiConfidence: number | null;
  aiSource: string;
  isCoverageGap: boolean;
}

export interface MockEvidenceFile {
  id: string;
  name: string;
  kind: "doc" | "video" | "image" | "text";
  sizeBytes: number;
  url?: string;
}

export interface MockReview {
  id: string;
  taskId: string;
  taskTitle: string;
  taskSubtitle: string;
  contributorId: string;
  contributorName: string;
  contributorTrack?: "internal" | "freelancer" | "student" | "women";
  project: string;
  tenant: string;
  skills: string[];
  round: number;
  totalRounds: number;
  stage: ReviewStage;
  submittedAt: string;
  dueAt: string;
  slaTier: SlaTier;

  /** Mentor flags shown on queue rows. */
  flag: "continuity" | "fresh" | "recent_paired" | null;

  brief: string;
  evidence: MockEvidenceFile[];
  criteria: MockRubricCriterion[];
  coverNote?: string;

  /** Round-1 corrections + addressed status (only on rounds > 1). */
  priorFeedback?: {
    requiredCorrections: Array<{ text: string; addressed: boolean }>;
    optionalSuggestions: string[];
  };

  state: ReviewState;
  aiOverallConfidence: number;
  riskFlags: string[];
  references: Array<{ label: string; url: string }>;
}

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const MOCK_REVIEWS: MockReview[] = [];

export function getMockReview(id: string): MockReview | undefined {
  return MOCK_REVIEWS.find((r) => r.id === id);
}

/** Last 5 decisions for a contributor — for the context rail. */
export interface MockContributorDecision {
  taskTitle: string;
  decidedAt: string;
  decision: "accept" | "rework" | "reject";
  yours: boolean;
}

export const MOCK_CONTRIBUTOR_DECISIONS: Record<string, MockContributorDecision[]> = {};
