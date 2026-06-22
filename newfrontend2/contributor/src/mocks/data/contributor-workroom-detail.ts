/**
 * Contributor Portal V2 — Workroom detail mock.
 *
 * Powers `/contributor/tasks/[taskId]` — the contributor's execution cockpit.
 * Rich shape covering: brief, instructions, deliverables, dependencies,
 * milestones, evidence, draft state, mentor + clarification, AI suggestions,
 * submission readiness signals.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

import type {
  ContributorPriority,
  ContributorState,
  MentorFeedback,
} from "./contributor-workspace";

/* ─────────────────────── Sub-types ─────────────────────── */

export interface InstructionStep {
  id: string;
  step: number;
  title: string;
  body: string;
  status: "todo" | "in_progress" | "done";
}

export interface Deliverable {
  id: string;
  label: string;
  required: boolean;
  status: "todo" | "in_progress" | "done";
  evidenceRef?: string;
}

export interface Dependency {
  label: string;
  status: "ready" | "pending" | "blocked";
  detail?: string;
}

export interface Milestone {
  id: string;
  label: string;
  status: "completed" | "current" | "upcoming";
  completedAt?: string;
}

export interface WorkroomArtifact {
  id: string;
  name: string;
  kind: "code" | "doc" | "image" | "video" | "archive" | "link";
  size: string;
  uploadedAt: string;
  status: "uploaded" | "uploading" | "failed";
  url?: string;
}

export interface DraftState {
  notes: string;
  lastSavedAt: string;
  autosaveStatus: "saved" | "saving" | "unsaved";
}

export interface ClarificationMessage {
  id: string;
  author: string;
  authorRole: "mentor" | "contributor" | "system";
  body: string;
  at: string;
  attachments?: { label: string; size?: string }[];
}

export interface ClarificationThread {
  id: string;
  status: "pending" | "answered" | "resolved";
  raisedBy: string;
  expectedBy?: string;
  pauseSla: boolean;
  messages: ClarificationMessage[];
}

export interface WorkroomAiSuggestion {
  id: string;
  kind: "next_step" | "evidence" | "submission_check" | "fix_suggestion" | "workflow_tip";
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  cta?: string;
}

export interface ReadinessSignal {
  id: string;
  label: string;
  status: "ok" | "partial" | "missing";
  detail?: string;
}

export interface WorkroomTask {
  id: string;
  title: string;
  shortDescription: string;
  brief: string;
  project: string;
  portfolio: string;
  priority: ContributorPriority;
  skill: string;
  skillLevel: string;

  deadline: string;
  deadlineHoursRemaining: number;

  state: ContributorState;
  progressPct: number;
  readinessScore: number;
  estimatedMinutesRemaining: number;
  payoutAmount: string;
  payoutCurrency: string;

  mentor: {
    name: string;
    role: string;
    initials: string;
  };

  reworkRound?: number;
  totalRounds?: number;

  instructions: InstructionStep[];
  deliverables: Deliverable[];
  dependencies: Dependency[];
  milestones: Milestone[];
  acceptanceCriteria: { id: string; label: string; addressed: boolean }[];

  evidence: {
    artifacts: WorkroomArtifact[];
    requiredCount: number;
    completeCount: number;
  };

  draft: DraftState;

  mentorFeedback?: MentorFeedback;
  clarification?: ClarificationThread;

  aiSuggestions: WorkroomAiSuggestion[];

  submissionReadiness: {
    overall: number;
    signals: ReadinessSignal[];
  };

  history: { round: number; outcome: "passed" | "failed" | "withdrawn"; when: string; note?: string }[];

  externalLinks: { label: string; url: string; kind: "github" | "storybook" | "demo" | "doc" | "spec" }[];

  lastActivityAt: string;
  reviewWindowHours?: number;
}

/* ─────────────────────── Canonical mock task ─────────────────────── */

export const sampleWorkroomTask: WorkroomTask = {
  id: "t-4821",
  title: "Build accessible date picker component",
  shortDescription:
    "WCAG 2.2 AA accessible date picker for the Helios design system",
  brief: `Implement a fully WCAG 2.2 AA compliant date-picker component for the Helios design system.

The component must support keyboard navigation (arrow keys, PageUp/Down, Home/End), screen-reader announcements via aria-live, focus trapping inside the popover, locale-aware formatting, and a headless usage pattern.

Deliverables include the component itself, unit tests with ≥80% coverage, Storybook stories for the major states, and a live demo route.`,
  project: "Acme-Helios",
  portfolio: "Enterprise Foundations",
  priority: "P0",
  skill: "React",
  skillLevel: "L3",
  deadline: "2026-05-26 18:00",
  deadlineHoursRemaining: 56,
  state: "in_progress",
  progressPct: 68,
  readinessScore: 74,
  estimatedMinutesRemaining: 90,
  payoutAmount: "$240",
  payoutCurrency: "USD",
  mentor: {
    name: "Rajesh Verma",
    role: "Mentor · A11y track",
    initials: "RV",
  },
  reworkRound: 2,
  totalRounds: 3,
  instructions: [
    {
      id: "i1",
      step: 1,
      title: "Set up the component shell",
      body: "Create the component file at src/components/DatePicker.tsx with the headless pattern from react-aria. Export a typed props interface.",
      status: "done",
    },
    {
      id: "i2",
      step: 2,
      title: "Implement keyboard navigation",
      body: "Arrow keys move day-by-day · PageUp/Down move month-by-month · Home/End jump to start/end of week · Escape closes the popover.",
      status: "done",
    },
    {
      id: "i3",
      step: 3,
      title: "Add focus trap inside popover",
      body: "Wrap the popover in <FocusScope contain restoreFocus> from react-aria so Tab cycles inside until the user presses Escape.",
      status: "in_progress",
    },
    {
      id: "i4",
      step: 4,
      title: "Wire screen-reader announcements",
      body: "Use aria-live='polite' on the selected-date label. Test with VoiceOver and NVDA at minimum; JAWS recording is acceptable as evidence.",
      status: "todo",
    },
    {
      id: "i5",
      step: 5,
      title: "Write Storybook stories",
      body: "Three stories: default · disabled-dates · controlled. Add a11y addon checks.",
      status: "todo",
    },
    {
      id: "i6",
      step: 6,
      title: "Tests and coverage",
      body: "Unit tests with axe-core integration. Target ≥80% coverage. Test focus restoration on close.",
      status: "todo",
    },
  ],
  deliverables: [
    { id: "d1", label: "DatePicker.tsx component", required: true, status: "in_progress", evidenceRef: "datepicker-v2.zip" },
    { id: "d2", label: "Unit tests (≥80% coverage)", required: true, status: "todo" },
    { id: "d3", label: "Storybook stories", required: true, status: "todo" },
    { id: "d4", label: "Live demo route", required: true, status: "todo" },
    { id: "d5", label: "Video walkthrough", required: false, status: "todo" },
    { id: "d6", label: "JAWS verification recording", required: true, status: "todo" },
  ],
  dependencies: [
    { label: "Helios design tokens v2", status: "ready" },
    { label: "react-aria 3.x in package.json", status: "ready" },
    { label: "JAWS screen reader (Windows VM)", status: "ready", detail: "Provided by GlimmoraTeam" },
  ],
  milestones: [
    { id: "m1", label: "Component shell complete", status: "completed", completedAt: "yesterday" },
    { id: "m2", label: "Keyboard navigation working", status: "completed", completedAt: "yesterday" },
    { id: "m3", label: "Focus trap implemented", status: "current" },
    { id: "m4", label: "Screen-reader verified", status: "upcoming" },
    { id: "m5", label: "Stories + tests complete", status: "upcoming" },
    { id: "m6", label: "Ready to submit", status: "upcoming" },
  ],
  acceptanceCriteria: [
    { id: "c1", label: "Component renders with all expected props", addressed: true },
    { id: "c2", label: "Keyboard navigation works (arrow / PgUp / PgDn / Home / End / Esc)", addressed: true },
    { id: "c3", label: "Screen reader announcements correct (VoiceOver + NVDA)", addressed: true },
    { id: "c4", label: "Focus trap inside popover", addressed: false },
    { id: "c5", label: "Unit test coverage ≥ 80%", addressed: false },
    { id: "c6", label: "Storybook stories for 3 states", addressed: false },
    { id: "c7", label: "JAWS verification recording attached", addressed: false },
  ],
  evidence: {
    artifacts: [
      {
        id: "ev1",
        name: "datepicker-v2.zip",
        kind: "archive",
        size: "2.4 MB",
        uploadedAt: "an hour ago",
        status: "uploaded",
      },
      {
        id: "ev2",
        name: "stories.mdx",
        kind: "doc",
        size: "480 KB",
        uploadedAt: "an hour ago",
        status: "uploaded",
      },
      {
        id: "ev3",
        name: "demo-walkthrough-draft.mp4",
        kind: "video",
        size: "12.6 MB",
        uploadedAt: "30 minutes ago",
        status: "uploaded",
      },
    ],
    requiredCount: 6,
    completeCount: 3,
  },
  draft: {
    notes:
      "Implementing FocusScope from react-aria for the popover. Tested keyboard nav locally with VoiceOver — works. Need to record a JAWS pass-through tomorrow on the Windows VM.",
    lastSavedAt: "2 minutes ago",
    autosaveStatus: "saved",
  },
  mentorFeedback: {
    received: true,
    receivedAt: "yesterday",
    mentorName: "Rajesh Verma",
    whatWorked:
      "Strong component composition · idiomatic hooks usage · stories are clean. The v1 → v2 diff is tight and addresses prior feedback well.",
    requiredCorrections: [
      {
        id: "fc1",
        criterion: "Accessibility",
        description:
          "Add focus trap to the popover so Tab doesn't escape until Esc is pressed. Use FocusScope from react-aria.",
        severity: "major",
        addressed: false,
      },
      {
        id: "fc2",
        criterion: "Requirements adherence",
        description:
          "JAWS verification recording required per spec §5.3. A short pass-through on the demo route is sufficient.",
        severity: "major",
        addressed: false,
      },
    ],
    suggestions: [
      "RTL layout has a small offset on the month dropdown — fine to address in a follow-up.",
    ],
  },
  clarification: {
    id: "cl-1",
    status: "answered",
    raisedBy: "Rajesh Verma",
    expectedBy: "by tomorrow EOD",
    pauseSla: false,
    messages: [
      {
        id: "m1",
        author: "Rajesh Verma",
        authorRole: "mentor",
        body: "Could you walk me through your JAWS testing strategy for v3? Spec §5.3 explicitly requires it.",
        at: "yesterday 09:30",
      },
      {
        id: "m2",
        author: "You",
        authorRole: "contributor",
        body: "I'll record a JAWS pass-through on the demo route and attach the recording. Tested locally on Win11 + JAWS 2024 — focus trap and live region announcements both work.",
        at: "yesterday 11:14",
      },
      {
        id: "m3",
        author: "Rajesh Verma",
        authorRole: "mentor",
        body: "Perfect. Attach with the v3 submission. No SLA pause needed.",
        at: "yesterday 11:22",
      },
    ],
  },
  aiSuggestions: [
    {
      id: "ai1",
      kind: "fix_suggestion",
      title: "Wrap the popover in FocusScope",
      detail:
        "react-aria's <FocusScope contain restoreFocus> is a clean fit. A similar pattern appeared in your accepted Auth Modal submission from May 10.",
      confidence: "high",
      cta: "Show the example",
    },
    {
      id: "ai2",
      kind: "evidence",
      title: "JAWS recording is the biggest remaining gap",
      detail:
        "A 60-90 second screencast of the demo route with JAWS reading entries is usually sufficient. The Windows VM has JAWS 2024 pre-installed.",
      confidence: "high",
      cta: "Open Windows VM",
    },
    {
      id: "ai3",
      kind: "submission_check",
      title: "Estimated 90 minutes to ready",
      detail:
        "Focus trap (40m) + JAWS recording (15m) + stories (25m) + final coverage check (10m). You'll cross 90% readiness when all four are done.",
      confidence: "medium",
    },
    {
      id: "ai4",
      kind: "workflow_tip",
      title: "Coverage report shortcut",
      detail:
        "Running `npm test -- --coverage` will generate a coverage badge you can drop straight into the evidence checklist.",
      confidence: "medium",
    },
  ],
  submissionReadiness: {
    overall: 74,
    signals: [
      { id: "r1", label: "All required deliverables uploaded", status: "partial", detail: "3 of 6 uploaded" },
      { id: "r2", label: "Acceptance criteria addressed", status: "partial", detail: "3 of 7 addressed" },
      { id: "r3", label: "Tests at coverage threshold", status: "missing", detail: "Coverage report not yet attached" },
      { id: "r4", label: "Mentor feedback addressed", status: "partial", detail: "2 corrections still open" },
      { id: "r5", label: "Submission notes drafted", status: "ok" },
      { id: "r6", label: "No blockers", status: "ok" },
    ],
  },
  history: [
    {
      round: 1,
      outcome: "failed",
      when: "yesterday",
      note: "Mentor asked for focus trap + JAWS verification.",
    },
  ],
  externalLinks: [
    { label: "Storybook · DatePicker", url: "https://storybook.example.com/datepicker", kind: "storybook" },
    { label: "GitHub PR #284", url: "https://github.com/example/repo/pull/284", kind: "github" },
    { label: "Live demo (staging)", url: "https://staging.example.com/datepicker", kind: "demo" },
    { label: "Spec doc · datepicker.pdf", url: "/specs/datepicker.pdf", kind: "spec" },
  ],
  lastActivityAt: "an hour ago",
};

/* ─────────────────────── Revision overlay ─────────────────────── */

export interface CorrectionAiHint {
  correctionId: string;
  pattern: string;
  detail: string;
  example?: string;
  confidence: "high" | "medium" | "low";
  source?: string;
}

export interface VersionComparisonRow {
  id: string;
  label: string;
  kind: "criterion" | "evidence" | "deliverable";
  previous: { state: "missing" | "partial" | "present"; note?: string };
  updated: { state: "missing" | "partial" | "present"; note?: string };
  movement: "improved" | "unchanged" | "regressed" | "added" | "removed";
}

export interface RevisionRoundSummary {
  round: number;
  submittedAt: string;
  outcome: "passed" | "failed" | "withdrawn" | "in_revision";
  mentorNote?: string;
  changedAreas: string[];
}

export const correctionAiHints: CorrectionAiHint[] = [
  {
    correctionId: "fc1",
    pattern: "Wrap popover in <FocusScope contain restoreFocus>",
    detail:
      "react-aria's FocusScope contains Tab inside the popover and restores focus to the trigger on Esc. This is the cleanest fit and works without extra ref plumbing.",
    example:
      "<FocusScope contain restoreFocus>\n  <Popover>{children}</Popover>\n</FocusScope>",
    confidence: "high",
    source: "Your accepted Auth Modal submission · May 10",
  },
  {
    correctionId: "fc2",
    pattern: "60–90 second JAWS screencast on the demo route",
    detail:
      "Short pass-through that opens the demo, navigates a few days with arrows, and selects a date. Capture the live-region announcement of the selected date.",
    example:
      "Open Windows VM → run `npm run demo` → start JAWS → screen-record 60–90s",
    confidence: "high",
    source: "Spec §5.3 acceptance language",
  },
];

export const revisionComparisonRows: VersionComparisonRow[] = [
  {
    id: "vc1",
    label: "Keyboard navigation (arrow / PgUp / PgDn / Home / End / Esc)",
    kind: "criterion",
    previous: { state: "partial", note: "Missing Home/End" },
    updated: { state: "present", note: "All six keys handled" },
    movement: "improved",
  },
  {
    id: "vc2",
    label: "Screen-reader announcements (VoiceOver + NVDA)",
    kind: "criterion",
    previous: { state: "missing", note: "No aria-live region" },
    updated: { state: "present", note: "aria-live polite on selected-date label" },
    movement: "improved",
  },
  {
    id: "vc3",
    label: "Focus trap inside popover",
    kind: "criterion",
    previous: { state: "missing" },
    updated: { state: "missing", note: "Still open — addressing in v3" },
    movement: "unchanged",
  },
  {
    id: "vc4",
    label: "JAWS verification recording",
    kind: "evidence",
    previous: { state: "missing" },
    updated: { state: "missing", note: "Recording planned for v3" },
    movement: "unchanged",
  },
  {
    id: "vc5",
    label: "Storybook stories (default · disabled · controlled)",
    kind: "deliverable",
    previous: { state: "partial", note: "default only" },
    updated: { state: "partial", note: "default + disabled drafted" },
    movement: "improved",
  },
  {
    id: "vc6",
    label: "Unit test coverage report",
    kind: "evidence",
    previous: { state: "missing" },
    updated: { state: "missing", note: "Pending after focus trap merge" },
    movement: "unchanged",
  },
];

export const revisionHistory: RevisionRoundSummary[] = [
  {
    round: 1,
    submittedAt: "two days ago · 14:08",
    outcome: "failed",
    mentorNote: "Strong start. Two required fixes: focus trap and JAWS recording.",
    changedAreas: ["Component shell", "Keyboard navigation", "Stories (initial)"],
  },
  {
    round: 2,
    submittedAt: "yesterday · 18:32",
    outcome: "in_revision",
    mentorNote: "Big improvement on keyboard nav and announcements. Two corrections still open.",
    changedAreas: [
      "Added Home / End / PgUp / PgDn handling",
      "aria-live polite for selected date",
      "Disabled-dates story drafted",
    ],
  },
];

/* ─────────────────────── Helpers ─────────────────────── */

export function formatReadinessLabel(score: number): string {
  if (score >= 90) return "Ready to submit";
  if (score >= 70) return "Almost ready";
  if (score >= 40) return "Making progress";
  return "Getting started";
}

export function deliverableProgress(t: WorkroomTask): { done: number; total: number; pct: number } {
  const required = t.deliverables.filter((d) => d.required);
  const done = required.filter((d) => d.status === "done").length;
  return {
    done,
    total: required.length,
    pct: required.length === 0 ? 0 : Math.round((done / required.length) * 100),
  };
}
