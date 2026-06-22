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

export const MOCK_DECISIONS: MockMentorDecision[] = [
  {
    id: "dec-001",
    reviewId: "rev-archived-1",
    taskTitle: "Date Picker · FocusScope (Round 1)",
    contributorId: "contrib-sneha",
    contributorName: "Sneha Menon",
    project: "Helios Q3",
    round: 1, totalRounds: 3,
    decision: "rework",
    decidedAt: hoursAgo(40),
    reviewerConfidence: "confident",
    reworkCorrections: [
      "Tighten the aria-live region wording for month announcements.",
      "Add mobile touch-outside dismiss behavior.",
    ],
    rubricOverall: 3.8,
    aiAlignment: "modified",
  },
  {
    id: "dec-002",
    reviewId: "rev-archived-2",
    taskTitle: "Auth modal",
    contributorId: "contrib-kavi",
    contributorName: "Kavi Senthil",
    project: "Helios Q3",
    round: 1, totalRounds: 3,
    decision: "accept",
    decidedAt: daysAgo(8),
    reviewerConfidence: "confident",
    finalComment: "Clean implementation. Tests cover the OTP rate-limit path.",
    rubricOverall: 4.8,
    aiAlignment: "took_as_is",
  },
  {
    id: "dec-003",
    reviewId: "rev-archived-3",
    taskTitle: "Search shortcuts",
    contributorId: "contrib-sneha",
    contributorName: "Sneha Menon",
    project: "Helios Q3",
    round: 1, totalRounds: 3,
    decision: "accept",
    decidedAt: daysAgo(18),
    reviewerConfidence: "confident",
    rubricOverall: 4.9,
    aiAlignment: "took_as_is",
  },
  {
    id: "dec-004",
    reviewId: "rev-archived-4",
    taskTitle: "Empty-state illustrations",
    contributorId: "contrib-sneha",
    contributorName: "Sneha Menon",
    project: "Helios Q3",
    round: 1, totalRounds: 3,
    decision: "accept",
    decidedAt: daysAgo(21),
    reviewerConfidence: "comfortable",
    rubricOverall: 4.6,
    aiAlignment: "modified",
  },
  {
    id: "dec-005",
    reviewId: "rev-archived-5",
    taskTitle: "Schema migration v3",
    contributorId: "contrib-yusuf",
    contributorName: "Yusuf Okeke",
    project: "Reporting V2",
    round: 1, totalRounds: 3,
    decision: "accept",
    decidedAt: daysAgo(11),
    reviewerConfidence: "confident",
    rubricOverall: 4.7,
    aiAlignment: "took_as_is",
  },
  {
    id: "dec-006",
    reviewId: "rev-archived-6",
    taskTitle: "Audit log query helper",
    contributorId: "contrib-yusuf",
    contributorName: "Yusuf Okeke",
    project: "Reporting V2",
    round: 1, totalRounds: 3,
    decision: "accept",
    decidedAt: daysAgo(4),
    reviewerConfidence: "comfortable",
    rubricOverall: 4.4,
    aiAlignment: "modified",
  },
  {
    id: "dec-007",
    reviewId: "rev-archived-7",
    taskTitle: "Audit timestamps fix",
    contributorId: "contrib-yusuf",
    contributorName: "Yusuf Okeke",
    project: "Reporting V2",
    round: 1, totalRounds: 3,
    decision: "reject",
    decidedAt: daysAgo(28),
    reviewerConfidence: "tentative",
    rejectReason: "Submission did not include reproduction of the underlying bug or migration test. Quality below threshold.",
    rejectCategory: "quality_below",
    rubricOverall: 2.1,
    aiAlignment: "overrode",
  },
];

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
