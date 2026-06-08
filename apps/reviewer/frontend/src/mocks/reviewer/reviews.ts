/**
 * Reviewer (enterprise sub-portal) mocks — spec doc 02 §5.F.
 *
 * Each item is a submission a mentor has already accepted that now awaits
 * the internal client reviewer's go/no-go (second-stage in two-stage review).
 */

export type SlaTier = "breached" | "critical" | "warning" | "watch" | "healthy";
export type ReviewerState = "open" | "decided_accept" | "decided_rework" | "decided_reject";

export interface MockReviewerCriterion {
  id: string;
  label: string;
  mentorStars: 1 | 2 | 3 | 4 | 5;
}

export interface MockReviewerEvidence {
  id: string;
  name: string;
  kind: "doc" | "video" | "image" | "text";
  sizeBytes: number;
}

export interface MockReviewerItem {
  id: string;
  taskTitle: string;
  taskSubtitle: string;
  project: string;
  tenant: string;
  contributorName: string;
  mentorName: string;
  round: number;
  totalRounds: number;
  submittedAt: string;
  mentorAcceptedAt: string;
  dueAt: string;
  slaTier: SlaTier;
  state: ReviewerState;

  evidence: MockReviewerEvidence[];
  criteria: MockReviewerCriterion[];
  mentorOverall: number;
  mentorNote: string;
  contributorCoverNote: string;
  criteriaValidatedCount: number;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const MOCK_REVIEWER_ITEMS: MockReviewerItem[] = [];

export function getMockReviewerItem(id: string): MockReviewerItem | undefined {
  return MOCK_REVIEWER_ITEMS.find((r) => r.id === id);
}

// ── Past decisions ──────────────────────────────────────────────────────

export type ReviewerDecisionKind = "accept" | "rework" | "reject";

export interface MockReviewerDecision {
  id: string;
  reviewId: string;
  taskTitle: string;
  contributorName: string;
  mentorName: string;
  project: string;
  decision: ReviewerDecisionKind;
  agreedWithMentor: boolean;
  decidedAt: string;
  comment?: string;
}

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const MOCK_REVIEWER_DECISIONS: MockReviewerDecision[] = [];

export function getMockReviewerDecision(id: string): MockReviewerDecision | undefined {
  return MOCK_REVIEWER_DECISIONS.find((d) => d.id === id);
}

// ── Metrics ─────────────────────────────────────────────────────────────

export const MOCK_REVIEWER_METRICS = {
  periodDays: 30,
  reviewCount: 0,
  avgTimeMin: 0,
  slaHitPct: 0,
  acceptPct: 0,
  agreementWithMentorPct: 0,
  decisionsByKind: { accept: 0, rework: 0, reject: 0 },
};

// ── Reviewer identity ──────────────────────────────────────────────────

export const MOCK_REVIEWER_PROFILE = {
  id: "",
  name: "",
  firstName: "",
  email: "",
  initials: "",
  title: "",
  joinedAt: "",
};
