/**
 * Past mentor decisions — spec doc 03 §5.E.
 *
 * Each decision is the immutable record of one round's outcome.
 */

export type MentorDecisionKind = "accept" | "rework" | "reject" | "withdrawn";
export type ReviewerConfidence = "confident" | "comfortable" | "tentative";

export interface MockMentorDecision {
  id: string;
  reviewId: string;
  taskTitle: string;
  contributorId: string;
  contributorName: string;
  project: string;
  round: number;
  totalRounds: number;
  decision: MentorDecisionKind;
  decidedAt: string;
  reviewerConfidence: ReviewerConfidence;
  finalComment?: string;
  rejectReason?: string;
  rejectCategory?: "doesnt_meet_criteria" | "off_spec" | "quality_below" | "plagiarism" | "other";
  reworkCorrections?: string[];
  withdrawType?: "personal" | "prior_employment" | "financial" | "other";
  rubricOverall?: number;
  aiAlignment: "took_as_is" | "modified" | "overrode";
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const MOCK_DECISIONS: MockMentorDecision[] = [];

/** Metrics rollup — spec §5.E.3 + Profile §5.H.1 */
export const MOCK_MENTOR_METRICS = {
  periodDays: 30,
  reviewCount: 18,
  avgTimeMin: 22,
  slaHitPct: 94,
  acceptPct: 78,
  decisionsByKind: { accept: 14, rework: 3, reject: 1 },
  aiAlignment: { tookAsIs: 11, modified: 5, overrode: 2 },
  coachingNotesWritten: 9,
};

export function getMockDecision(id: string): MockMentorDecision | undefined {
  return MOCK_DECISIONS.find((d) => d.id === id);
}
