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

export const MOCK_SUBMISSIONS: MockSubmission[] = [
  // task-003 in_progress — draft state
  {
    id: "sub-003-v1",
    taskId: "task-003",
    version: 1,
    status: "draft",
    body: "First pass of the streaming endpoint. Need to wire up the signed-URL TTL config from the platform settings before submit.",
    routing: "mentor",
    submittedAt: null,
    decidedAt: null,
    reviewerId: null,
    reviewerName: null,
    feedback: null,
    decisionRationale: null,
    artifacts: [
      { id: "art-003-1", kind: "file", name: "spec.md", url: "upload://spec.md", sizeBytes: 42_000, mimeType: "text/markdown", scanCleared: true, scanError: null, scanAttemptedAt: hoursAgo(6), createdAt: hoursAgo(6) },
      { id: "art-003-2", kind: "link", name: "PR #1421", url: "https://github.com/glimmora/api/pull/1421", sizeBytes: null, mimeType: null, scanCleared: true, scanError: null, scanAttemptedAt: hoursAgo(5), createdAt: hoursAgo(5) },
    ],
  },

  // task-006 feedback_requested — round 2 in flight
  {
    id: "sub-006-v1",
    taskId: "task-006",
    version: 1,
    status: "feedback_requested",
    body: "Tightened the focus-error animation. Tested on Chrome + Firefox.",
    routing: "mentor",
    submittedAt: hoursAgo(48),
    decidedAt: hoursAgo(24),
    reviewerId: "mentor-priya",
    reviewerName: "Priya Iyer",
    feedback: {
      whatWorked:
        "Strong implementation of the validation tone shift. The focus restoration on the email field is clean and the code reads well.",
      requiredCorrections: [
        { id: "corr-1", criterion: "No layout shift on error", description: "Validation shake animation still flashes on first render — needs an initial-mount guard.", severity: "major", addressed: true, resolutionNote: "Added isInitialMount ref to suppress the first transition." },
        { id: "corr-2", criterion: "Reduce focus jumps", description: "Submit button focus ring is clipped by the modal overflow on Safari.", severity: "major", addressed: false },
      ],
      suggestions: [
        "Consider a subtle haptic on mobile success (navigator.vibrate(10)).",
      ],
    },
    decisionRationale: null,
    artifacts: [
      { id: "art-006-1", kind: "file", name: "demo.mp4", url: "upload://demo.mp4", sizeBytes: 18_000_000, mimeType: "video/mp4", scanCleared: true, scanError: null, scanAttemptedAt: hoursAgo(49), createdAt: hoursAgo(49) },
      { id: "art-006-2", kind: "file", name: "tests.txt", url: "upload://tests.txt", sizeBytes: 2_100, mimeType: "text/plain", scanCleared: true, scanError: null, scanAttemptedAt: hoursAgo(49), createdAt: hoursAgo(49) },
    ],
  },

  // task-007 under_review
  {
    id: "sub-007-v1",
    taskId: "task-007",
    version: 1,
    status: "under_review",
    body: "Per-channel grid with debounced save. Critical row is locked, marketing defaults off.",
    routing: "mentor",
    submittedAt: hoursAgo(8),
    decidedAt: null,
    reviewerId: "mentor-priya",
    reviewerName: "Priya Iyer",
    feedback: null,
    decisionRationale: null,
    artifacts: [
      { id: "art-007-1", kind: "file", name: "settings-panel.tsx", url: "upload://settings-panel.tsx", sizeBytes: 6_800, mimeType: "text/plain", scanCleared: true, scanError: null, scanAttemptedAt: hoursAgo(9), createdAt: hoursAgo(9) },
    ],
  },

  // task-008 completed (accepted)
  {
    id: "sub-008-v1",
    taskId: "task-008",
    version: 1,
    status: "accepted",
    body: "Coverage for the resolver branches. Edge cases: cyclic deps, missing milestone, orphan task.",
    routing: "mentor",
    submittedAt: hoursAgo(15 * 24),
    decidedAt: hoursAgo(14 * 24),
    reviewerId: "mentor-karthik",
    reviewerName: "Karthik Iyer",
    feedback: {
      whatWorked:
        "Great cover of the cyclic-dependency path; the snapshot tests are well-named and easy to read.",
      requiredCorrections: [],
      suggestions: ["Could add a snapshot for the deep-nesting case (>5 levels) for future regression."],
    },
    decisionRationale: null,
    artifacts: [
      { id: "art-008-1", kind: "link", name: "PR #1392", url: "https://github.com/glimmora/api/pull/1392", sizeBytes: null, mimeType: null, scanCleared: true, scanError: null, scanAttemptedAt: hoursAgo(15 * 24), createdAt: hoursAgo(15 * 24) },
    ],
  },

  // task-011 resubmitted — round 2 waiting on mentor
  {
    id: "sub-011-v2",
    taskId: "task-011",
    version: 2,
    status: "resubmitted",
    body: "Added host allowlist + state validation. Regression suite covers 12 bypass vectors.",
    routing: "mentor",
    submittedAt: hoursAgo(4),
    decidedAt: null,
    reviewerId: "mentor-karthik",
    reviewerName: "Karthik Iyer",
    feedback: {
      whatWorked: "Allowlist approach is sound; tests are thorough.",
      requiredCorrections: [
        { id: "corr-3", criterion: "State param validated", description: "State TTL was 24h — spec requires 15m max.", severity: "major", addressed: true, resolutionNote: "Reduced state TTL to 15m with refresh on retry." },
      ],
      suggestions: [],
    },
    decisionRationale: null,
    artifacts: [
      { id: "art-011-1", kind: "link", name: "PR #1440", url: "https://github.com/glimmora/api/pull/1440", sizeBytes: null, mimeType: null, scanCleared: true, scanError: null, scanAttemptedAt: hoursAgo(5), createdAt: hoursAgo(5) },
    ],
  },

  // task-012 submitted — in mentor queue
  {
    id: "sub-012-v1",
    taskId: "task-012",
    version: 1,
    status: "submitted",
    body: "Import wizard with dry-run preview and row-level error CSV export.",
    routing: "mentor",
    submittedAt: hoursAgo(3),
    decidedAt: null,
    reviewerId: null,
    reviewerName: null,
    feedback: null,
    decisionRationale: null,
    artifacts: [
      { id: "art-012-1", kind: "file", name: "import-wizard.tsx", url: "upload://import-wizard.tsx", sizeBytes: 9_200, mimeType: "text/plain", scanCleared: true, scanError: null, scanAttemptedAt: hoursAgo(4), createdAt: hoursAgo(4) },
    ],
  },

  // task-010 rejected
  {
    id: "sub-010-v2",
    taskId: "task-010",
    version: 2,
    status: "rejected",
    body: "Repositioned the quick-add button to bottom-right with 96px clearance.",
    routing: "mentor",
    submittedAt: hoursAgo(8 * 24),
    decidedAt: hoursAgo(7 * 24),
    reviewerId: "mentor-priya",
    reviewerName: "Priya Iyer",
    feedback: null,
    decisionRationale:
      "After two rounds the button still overlaps the floating chat widget at >1440px viewports. Consider an alternate trigger pattern (⌘N) rather than a floating affordance.",
    artifacts: [],
  },
];

export function getMockSubmissionForTask(taskId: string): MockSubmission | undefined {
  return MOCK_SUBMISSIONS.find((s) => s.taskId === taskId);
}

export function getMockSubmission(id: string): MockSubmission | undefined {
  return MOCK_SUBMISSIONS.find((s) => s.id === id);
}
