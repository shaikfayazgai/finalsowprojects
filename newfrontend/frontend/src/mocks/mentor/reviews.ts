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

  /** Role-shared task code (T-XXXX) + readable submission id (T-XXXX-SUB-vN). */
  taskRef?: string;
  submissionRef?: string;
  /** Contributor's deliverable GitHub link + the task acceptance criteria text. */
  githubUrl?: string | null;
  acceptanceCriteria?: string | null;
  /** Contributor's self-assessed completion % (0-100) at submit. */
  completionPct?: number | null;

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

export const MOCK_REVIEWS: MockReview[] = [
  {
    id: "rev-001",
    taskId: "task-008",
    taskTitle: "Date Picker · FocusScope",
    taskSubtitle: "Implement focus management for the date-picker overlay",
    contributorId: "contrib-sneha",
    contributorName: "Sneha Menon",
    contributorTrack: "women",
    project: "Helios Q3",
    tenant: "Acme Corp",
    skills: ["React", "Accessibility / WCAG", "Figma"],
    round: 2,
    totalRounds: 3,
    stage: "two_stage",
    submittedAt: minutesAgo(14),
    dueAt: hoursFromNow(2 + 14 / 60),
    slaTier: "warning",
    flag: "continuity",
    brief: "Implement focus management for the date-picker overlay. Trap focus on open and restore on close. Announce month changes via aria-live; support touch dismiss outside the picker on mobile.",
    evidence: [
      { id: "e1", name: "spec.md",       kind: "doc",   sizeBytes: 14_300 },
      { id: "e2", name: "demo.mp4",      kind: "video", sizeBytes: 2_400_000 },
      { id: "e3", name: "tests.txt",     kind: "text",  sizeBytes: 8_200 },
      { id: "e4", name: "aria-test.md",  kind: "doc",   sizeBytes: 5_700 },
    ],
    criteria: [
      { id: "c1", label: "Focus trap on open",            aiSuggestion: 5, aiConfidence: 0.91, aiSource: "Code review check passed", isCoverageGap: false },
      { id: "c2", label: "ESC closes + restores focus",   aiSuggestion: 5, aiConfidence: 0.88, aiSource: "Tests file present",        isCoverageGap: false },
      { id: "c3", label: "TAB cycles within picker",      aiSuggestion: 5, aiConfidence: 0.86, aiSource: "Tests file present",        isCoverageGap: false },
      { id: "c4", label: "SHIFT-TAB reverses cycle",      aiSuggestion: 5, aiConfidence: 0.83, aiSource: "Tests file present",        isCoverageGap: false },
      { id: "c5", label: "Screen reader month change",    aiSuggestion: 4, aiConfidence: 0.78, aiSource: "aria-live region added",    isCoverageGap: false },
      { id: "c6", label: "Mobile touch dismisses",        aiSuggestion: null, aiConfidence: null, aiSource: "Not auto-checked",      isCoverageGap: true },
    ],
    priorFeedback: {
      requiredCorrections: [
        { text: "Tighten the aria-live region wording for month announcements", addressed: true },
        { text: "Add mobile touch-outside dismiss behavior",                    addressed: true },
      ],
      optionalSuggestions: [
        "Consider documenting the focus restoration target in JSDoc",
      ],
    },
    state: "open",
    aiOverallConfidence: 0.91,
    riskFlags: [],
    references: [
      { label: "Mentor playbook",       url: "#" },
      { label: "WAI-ARIA dialog pattern", url: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" },
    ],
  },
  {
    id: "rev-002",
    taskId: "task-009",
    taskTitle: "CSV export",
    taskSubtitle: "Add a CSV export action to the reports table",
    contributorId: "contrib-yusuf",
    contributorName: "Yusuf Okeke",
    contributorTrack: "freelancer",
    project: "Reporting V2",
    tenant: "Helios",
    skills: ["TypeScript", "React"],
    round: 1,
    totalRounds: 3,
    stage: "single",
    submittedAt: minutesAgo(60),
    dueAt: hoursFromNow(5),
    slaTier: "warning",
    flag: null,
    brief: "Add a CSV export button to the reports table. Stream rows; respect column filter state; produce UTF-8 with BOM for Excel compatibility.",
    evidence: [
      { id: "e1", name: "implementation.md", kind: "doc",   sizeBytes: 9_400 },
      { id: "e2", name: "demo.mp4",          kind: "video", sizeBytes: 3_100_000 },
      { id: "e3", name: "unit-tests.txt",    kind: "text",  sizeBytes: 12_800 },
    ],
    criteria: [
      { id: "c1", label: "Export honors active filters",     aiSuggestion: 5, aiConfidence: 0.89, aiSource: "Tests file present",   isCoverageGap: false },
      { id: "c2", label: "Stream rows (no full load)",       aiSuggestion: 4, aiConfidence: 0.74, aiSource: "Code review check",    isCoverageGap: false },
      { id: "c3", label: "UTF-8 BOM included",               aiSuggestion: 5, aiConfidence: 0.95, aiSource: "Hex inspection",       isCoverageGap: false },
      { id: "c4", label: "Excel opens cleanly",              aiSuggestion: null, aiConfidence: null, aiSource: "Not auto-checked", isCoverageGap: true },
    ],
    state: "open",
    aiOverallConfidence: 0.86,
    riskFlags: [],
    references: [
      { label: "Mentor playbook", url: "#" },
    ],
  },
  {
    id: "rev-003",
    taskId: "task-010",
    taskTitle: "Auth modal",
    taskSubtitle: "Build the password-reset flow modal",
    contributorId: "contrib-kavi",
    contributorName: "Kavi Senthil",
    contributorTrack: "freelancer",
    project: "Helios Q3",
    tenant: "Acme Corp",
    skills: ["React", "TypeScript"],
    round: 1,
    totalRounds: 3,
    stage: "single",
    submittedAt: minutesAgo(60 * 8),
    dueAt: hoursFromNow(48),
    slaTier: "watch",
    flag: "fresh",
    brief: "Build the password-reset modal in the auth flow. Show inline validation; accept the standard six-character one-time code; handle rate-limit error gracefully.",
    evidence: [
      { id: "e1", name: "spec.md",     kind: "doc",   sizeBytes: 6_400 },
      { id: "e2", name: "screen.mp4",  kind: "video", sizeBytes: 1_100_000 },
    ],
    criteria: [
      { id: "c1", label: "Inline validation",         aiSuggestion: 5, aiConfidence: 0.87, aiSource: "Code review check", isCoverageGap: false },
      { id: "c2", label: "Six-char OTP entry",        aiSuggestion: 5, aiConfidence: 0.93, aiSource: "Tests file",        isCoverageGap: false },
      { id: "c3", label: "Rate-limit error UI",       aiSuggestion: 4, aiConfidence: 0.71, aiSource: "Code review check", isCoverageGap: false },
    ],
    state: "open",
    aiOverallConfidence: 0.84,
    riskFlags: [],
    references: [],
  },
  {
    id: "rev-004",
    taskId: "task-011",
    taskTitle: "Search shortcuts",
    taskSubtitle: "Add keyboard shortcuts to the search palette",
    contributorId: "contrib-sneha",
    contributorName: "Sneha Menon",
    contributorTrack: "women",
    project: "Helios Q3",
    tenant: "Acme Corp",
    skills: ["React", "Accessibility / WCAG"],
    round: 1,
    totalRounds: 3,
    stage: "single",
    submittedAt: minutesAgo(60 * 12),
    dueAt: hoursFromNow(72),
    slaTier: "watch",
    flag: "recent_paired",
    brief: "Add Cmd/Ctrl+K, arrow-key navigation, and Enter selection to the search palette. Maintain focus on close.",
    evidence: [
      { id: "e1", name: "spec.md", kind: "doc", sizeBytes: 4_200 },
    ],
    criteria: [
      { id: "c1", label: "Cmd/Ctrl+K opens palette",  aiSuggestion: 5, aiConfidence: 0.88, aiSource: "Tests file",       isCoverageGap: false },
      { id: "c2", label: "Arrow keys navigate",       aiSuggestion: 5, aiConfidence: 0.90, aiSource: "Tests file",       isCoverageGap: false },
      { id: "c3", label: "Enter selects",             aiSuggestion: 5, aiConfidence: 0.92, aiSource: "Tests file",       isCoverageGap: false },
      { id: "c4", label: "Focus restored on close",   aiSuggestion: 4, aiConfidence: 0.76, aiSource: "Code review check", isCoverageGap: false },
    ],
    state: "open",
    aiOverallConfidence: 0.87,
    riskFlags: [],
    references: [],
  },
];

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

export const MOCK_CONTRIBUTOR_DECISIONS: Record<string, MockContributorDecision[]> = {
  "contrib-sneha": [
    { taskTitle: "Auth modal",                  decidedAt: daysAgo(8),  decision: "accept", yours: false },
    { taskTitle: "CSV export",                  decidedAt: daysAgo(14), decision: "accept", yours: false },
    { taskTitle: "Date Picker v1",              decidedAt: daysAgo(2),  decision: "rework", yours: true },
    { taskTitle: "Search shortcuts",            decidedAt: daysAgo(18), decision: "accept", yours: false },
    { taskTitle: "Empty-state illustrations",   decidedAt: daysAgo(21), decision: "accept", yours: false },
  ],
  "contrib-yusuf": [
    { taskTitle: "Audit log query helper",      decidedAt: daysAgo(4),  decision: "accept", yours: false },
    { taskTitle: "Schema migration v3",         decidedAt: daysAgo(11), decision: "accept", yours: true },
    { taskTitle: "Reporting cache",             decidedAt: daysAgo(15), decision: "rework", yours: false },
  ],
  "contrib-kavi": [],
};
