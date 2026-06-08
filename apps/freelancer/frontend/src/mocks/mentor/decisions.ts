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
  reviewCount: 0,
  avgTimeMin: 0,
  slaHitPct: 0,
  acceptPct: 0,
  decisionsByKind: { accept: 0, rework: 0, reject: 0 },
  aiAlignment: { tookAsIs: 0, modified: 0, overrode: 0 },
  coachingNotesWritten: 0,
};

export function getMockDecision(id: string): MockMentorDecision | undefined {
  return MOCK_DECISIONS.find((d) => d.id === id);
}
