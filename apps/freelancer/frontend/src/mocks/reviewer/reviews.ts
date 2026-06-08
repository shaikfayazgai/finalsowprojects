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

export const MOCK_REVIEWER_ITEMS: MockReviewerItem[] = [
  {
    id: "rrev-001",
    taskTitle: "Date Picker · FocusScope",
    taskSubtitle: "Implement focus management for the date picker overlay",
    project: "Helios Q3",
    tenant: "Acme Corp",
    contributorName: "Sneha Menon",
    mentorName: "Priya Iyer",
    round: 2,
    totalRounds: 3,
    submittedAt: minutesAgo(14),
    mentorAcceptedAt: minutesAgo(12),
    dueAt: hoursFromNow(2),
    slaTier: "warning",
    state: "open",
    criteria: [
      { id: "c1", label: "Focus trap on open",                  mentorStars: 5 },
      { id: "c2", label: "ESC closes and restores focus",       mentorStars: 5 },
      { id: "c3", label: "TAB cycles within picker",            mentorStars: 4 },
      { id: "c4", label: "SHIFT-TAB reverses cycle",            mentorStars: 5 },
      { id: "c5", label: "Screen reader announces month change",mentorStars: 4 },
      { id: "c6", label: "Mobile touch outside dismisses",      mentorStars: 5 },
    ],
    criteriaValidatedCount: 4,
    evidence: [
      { id: "e1", name: "spec.md",       kind: "doc",   sizeBytes: 14_300 },
      { id: "e2", name: "demo.mp4",      kind: "video", sizeBytes: 2_400_000 },
      { id: "e3", name: "tests.txt",     kind: "text",  sizeBytes: 8_200 },
      { id: "e4", name: "aria-test.md",  kind: "doc",   sizeBytes: 5_700 },
    ],
    mentorOverall: 4.67,
    mentorNote: "Strong submission. All criteria met. Recommend acceptance.",
    contributorCoverNote: "Tested in Chrome, Firefox, Safari + mobile Safari. Added aria-live region for month change as per round 1 feedback.",
  },
  {
    id: "rrev-002",
    taskTitle: "CSV export",
    taskSubtitle: "Add a CSV export action to the reports table",
    project: "Reporting V2",
    tenant: "Helios",
    contributorName: "Yusuf Okeke",
    mentorName: "Rajesh Verma",
    round: 1,
    totalRounds: 3,
    submittedAt: minutesAgo(60),
    mentorAcceptedAt: minutesAgo(20),
    dueAt: hoursFromNow(5),
    slaTier: "warning",
    state: "open",
    criteria: [
      { id: "c1", label: "Export honors active filters", mentorStars: 5 },
      { id: "c2", label: "Stream rows (no full load)",    mentorStars: 4 },
      { id: "c3", label: "UTF-8 BOM included",            mentorStars: 5 },
      { id: "c4", label: "Excel opens cleanly",           mentorStars: 5 },
    ],
    criteriaValidatedCount: 3,
    evidence: [
      { id: "e1", name: "implementation.md", kind: "doc",   sizeBytes: 9_400 },
      { id: "e2", name: "demo.mp4",          kind: "video", sizeBytes: 3_100_000 },
      { id: "e3", name: "unit-tests.txt",    kind: "text",  sizeBytes: 12_800 },
    ],
    mentorOverall: 4.75,
    mentorNote: "Clean implementation. Streaming verified at 100k rows. Excel opens without prompt.",
    contributorCoverNote: "Implemented streaming export with backpressure. Tested with 100k rows in Excel 365 and LibreOffice.",
  },
  {
    id: "rrev-003",
    taskTitle: "Auth modal",
    taskSubtitle: "Build the password-reset flow modal",
    project: "Helios Q3",
    tenant: "Acme Corp",
    contributorName: "Kavi Senthil",
    mentorName: "Priya Iyer",
    round: 1,
    totalRounds: 3,
    submittedAt: hoursAgo(8),
    mentorAcceptedAt: hoursAgo(7),
    dueAt: hoursFromNow(48),
    slaTier: "watch",
    state: "open",
    criteria: [
      { id: "c1", label: "Inline validation",       mentorStars: 5 },
      { id: "c2", label: "Six-char OTP entry",      mentorStars: 5 },
      { id: "c3", label: "Rate-limit error UI",     mentorStars: 4 },
    ],
    criteriaValidatedCount: 3,
    evidence: [
      { id: "e1", name: "spec.md",     kind: "doc",   sizeBytes: 6_400 },
      { id: "e2", name: "screen.mp4",  kind: "video", sizeBytes: 1_100_000 },
    ],
    mentorOverall: 4.67,
    mentorNote: "Tests cover the OTP rate-limit path. Inline validation reads naturally.",
    contributorCoverNote: "Added inline validation with debounced error states. Tested rate-limit at 5/min.",
  },
  {
    id: "rrev-004",
    taskTitle: "Search shortcuts",
    taskSubtitle: "Add keyboard shortcuts to the search palette",
    project: "Helios Q3",
    tenant: "Acme Corp",
    contributorName: "Sneha Menon",
    mentorName: "Priya Iyer",
    round: 1,
    totalRounds: 3,
    submittedAt: hoursAgo(12),
    mentorAcceptedAt: hoursAgo(11),
    dueAt: hoursFromNow(72),
    slaTier: "watch",
    state: "open",
    criteria: [
      { id: "c1", label: "Cmd/Ctrl+K opens palette", mentorStars: 5 },
      { id: "c2", label: "Arrow keys navigate",      mentorStars: 5 },
      { id: "c3", label: "Enter selects",            mentorStars: 5 },
      { id: "c4", label: "Focus restored on close",  mentorStars: 4 },
    ],
    criteriaValidatedCount: 4,
    evidence: [
      { id: "e1", name: "spec.md", kind: "doc", sizeBytes: 4_200 },
    ],
    mentorOverall: 4.75,
    mentorNote: "Clean keyboard handler. Focus restoration verified in test matrix.",
    contributorCoverNote: "Pattern follows Cmd+K spec. Focus restored to invoker element on close.",
  },
];

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

export const MOCK_REVIEWER_DECISIONS: MockReviewerDecision[] = [
  {
    id: "rdec-001",
    reviewId: "rrev-arch-1",
    taskTitle: "Audit log timestamp fix",
    contributorName: "Yusuf Okeke",
    mentorName: "Priya Iyer",
    project: "Reporting V2",
    decision: "accept",
    agreedWithMentor: true,
    decidedAt: daysAgo(1),
  },
  {
    id: "rdec-002",
    reviewId: "rrev-arch-2",
    taskTitle: "Empty-state illustrations",
    contributorName: "Sneha Menon",
    mentorName: "Priya Iyer",
    project: "Helios Q3",
    decision: "accept",
    agreedWithMentor: true,
    decidedAt: daysAgo(3),
  },
  {
    id: "rdec-003",
    reviewId: "rrev-arch-3",
    taskTitle: "Tenancy bootstrap docs",
    contributorName: "Priya Iyer",
    mentorName: "Karthik Iyer",
    project: "Reporting V2",
    decision: "rework",
    agreedWithMentor: false,
    decidedAt: daysAgo(4),
    comment: "Strong content but screenshots are out of date — please refresh against the current onboarding wizard.",
  },
  {
    id: "rdec-004",
    reviewId: "rrev-arch-4",
    taskTitle: "Reporting cache layer",
    contributorName: "Yusuf Okeke",
    mentorName: "Rajesh Verma",
    project: "Reporting V2",
    decision: "accept",
    agreedWithMentor: true,
    decidedAt: daysAgo(6),
  },
  {
    id: "rdec-005",
    reviewId: "rrev-arch-5",
    taskTitle: "Decomposition unit tests",
    contributorName: "Kavi Senthil",
    mentorName: "Priya Iyer",
    project: "Reporting V2",
    decision: "accept",
    agreedWithMentor: true,
    decidedAt: daysAgo(8),
  },
  {
    id: "rdec-006",
    reviewId: "rrev-arch-6",
    taskTitle: "Schema migration v3",
    contributorName: "Yusuf Okeke",
    mentorName: "Priya Iyer",
    project: "Reporting V2",
    decision: "accept",
    agreedWithMentor: true,
    decidedAt: daysAgo(11),
  },
  {
    id: "rdec-007",
    reviewId: "rrev-arch-7",
    taskTitle: "Audit query helper",
    contributorName: "Yusuf Okeke",
    mentorName: "Priya Iyer",
    project: "Reporting V2",
    decision: "reject",
    agreedWithMentor: false,
    decidedAt: daysAgo(13),
    comment: "Production-grade error handling missing. Please re-submit with timeouts + retries.",
  },
];

export function getMockReviewerDecision(id: string): MockReviewerDecision | undefined {
  return MOCK_REVIEWER_DECISIONS.find((d) => d.id === id);
}

// ── Metrics ─────────────────────────────────────────────────────────────

export const MOCK_REVIEWER_METRICS = {
  periodDays: 30,
  reviewCount: 12,
  avgTimeMin: 28,
  slaHitPct: 92,
  acceptPct: 83,
  agreementWithMentorPct: 71,
  decisionsByKind: { accept: 10, rework: 1, reject: 1 },
};

// ── Reviewer identity ──────────────────────────────────────────────────

export const MOCK_REVIEWER_PROFILE = {
  id: "rev-karthik",
  name: "Karthik Iyer",
  firstName: "Karthik",
  email: "karthik@acmecorp.com",
  initials: "KI",
  title: "Enterprise Reviewer · Acme Corp",
  joinedAt: "2024-11-04",
};
