/**
 * Contributor Portal V2 — Revisions workspace mock.
 *
 * Powers `/contributor/tasks/revisions` — the real operational revision
 * management workspace (not a placeholder).
 *
 * Each row is a task that requires correction. Rich enough to drive the
 * cross-revision queue, the selected revision's detail preview, and the
 * AI cross-revision helper.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

export type RevisionWorkflowState =
  | "feedback_received"
  | "in_correction"
  | "awaiting_clarification"
  | "ready_for_resubmission"
  | "resubmitted_under_review";

export interface RevisionCorrection {
  id: string;
  criterion: string;
  description: string;
  severity: "blocker" | "major" | "nit";
  category: "Functionality" | "Quality" | "Accessibility" | "Testing" | "Docs" | "Requirements";
  resolved: boolean;
  evidenceRef?: string;
  blockedBy?: string;
}

export interface RevisionEvidenceDelta {
  id: string;
  label: string;
  kind: "deliverable" | "evidence" | "criterion";
  previous: "missing" | "partial" | "present";
  updated: "missing" | "partial" | "present";
  note?: string;
}

export interface RevisionClarificationMessage {
  id: string;
  author: string;
  authorRole: "mentor" | "contributor" | "system";
  body: string;
  at: string;
}

export interface RevisionClarification {
  status: "pending" | "answered" | "resolved";
  raisedBy: "mentor" | "contributor";
  pauseSla: boolean;
  expectedBy?: string;
  messages: RevisionClarificationMessage[];
}

export interface RevisionAiHint {
  id: string;
  correctionId?: string;
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  source: string;
}

export interface RevisionActivityEvent {
  id: string;
  at: string;
  kind:
    | "feedback_received"
    | "correction_resolved"
    | "clarification_sent"
    | "clarification_replied"
    | "draft_saved"
    | "evidence_uploaded"
    | "resubmitted";
  taskId: string;
  detail: string;
  mentor?: string;
}

export interface RevisionRow {
  id: string;
  taskId: string;
  title: string;
  shortDescription: string;
  project: string;
  portfolio: string;
  priority: "P0" | "P1" | "P2";
  skill: string;

  state: RevisionWorkflowState;
  reworkRound: number;
  totalRounds: number;
  feedbackReceivedAt: string;
  dueAt: string;
  hoursToDue: number;
  lastActivityAt: string;

  mentor: { name: string; initials: string; role: string };

  whatWorked: string;
  mentorGuidance: string;
  corrections: RevisionCorrection[];
  optionalSuggestions: string[];

  evidenceDeltas: RevisionEvidenceDelta[];
  draftNote?: string;
  draftSavedAt?: string;

  clarification?: RevisionClarification;

  aiHints: RevisionAiHint[];
  readinessScore: number;
  nextRequiredAction: string;
  payoutAmount: string;
}

/* ─────────────────────── Canonical mock rows ─────────────────────── */

export const revisionRows: RevisionRow[] = [
  {
    id: "rev-t-4821",
    taskId: "t-4821",
    title: "Build accessible date picker component",
    shortDescription: "Helios design system · WCAG 2.2 AA",
    project: "Acme-Helios",
    portfolio: "Enterprise Foundations",
    priority: "P0",
    skill: "React · L3",
    state: "in_correction",
    reworkRound: 2,
    totalRounds: 3,
    feedbackReceivedAt: "yesterday · 09:30",
    dueAt: "May 26, 18:00",
    hoursToDue: 56,
    lastActivityAt: "an hour ago",
    mentor: { name: "Rajesh Verma", initials: "RV", role: "Mentor · A11y track" },
    whatWorked:
      "Strong component composition · idiomatic hooks usage · stories are clean. The v1 → v2 diff is tight and addresses prior feedback well.",
    mentorGuidance:
      "Two targeted fixes will close this out. The plan reads supportive — take them one at a time.",
    corrections: [
      {
        id: "fc1",
        criterion: "Focus trap",
        description: "Wrap popover in FocusScope (react-aria) so Tab cycles inside until Esc.",
        severity: "major",
        category: "Accessibility",
        resolved: false,
        evidenceRef: "DatePicker.tsx",
      },
      {
        id: "fc2",
        criterion: "JAWS verification",
        description: "60–90s JAWS screencast on the demo route per spec §5.3.",
        severity: "major",
        category: "Requirements",
        resolved: false,
        evidenceRef: "jaws-pass-through.mp4",
      },
    ],
    optionalSuggestions: [
      "RTL layout has a small offset on the month dropdown — fine to address in a follow-up.",
    ],
    evidenceDeltas: [
      {
        id: "vc1",
        label: "Keyboard navigation",
        kind: "criterion",
        previous: "partial",
        updated: "present",
        note: "All six keys handled",
      },
      {
        id: "vc2",
        label: "Screen-reader announcements",
        kind: "criterion",
        previous: "missing",
        updated: "present",
        note: "aria-live polite added",
      },
      {
        id: "vc3",
        label: "Focus trap",
        kind: "criterion",
        previous: "missing",
        updated: "missing",
        note: "Still open · addressing in v3",
      },
      {
        id: "vc4",
        label: "JAWS recording",
        kind: "evidence",
        previous: "missing",
        updated: "missing",
        note: "Recording planned",
      },
    ],
    draftNote:
      "FocusScope wrapper drafted locally. JAWS recording planned on the Windows VM tomorrow morning.",
    draftSavedAt: "2 minutes ago",
    clarification: {
      status: "answered",
      raisedBy: "mentor",
      pauseSla: false,
      messages: [
        {
          id: "m1",
          author: "Rajesh Verma",
          authorRole: "mentor",
          body: "Walk me through your JAWS testing strategy for v3? Spec §5.3 explicitly requires it.",
          at: "yesterday · 09:30",
        },
        {
          id: "m2",
          author: "You",
          authorRole: "contributor",
          body: "Recording a JAWS pass-through on the demo route. Tested locally on Win11 + JAWS 2024 — works.",
          at: "yesterday · 11:14",
        },
        {
          id: "m3",
          author: "Rajesh Verma",
          authorRole: "mentor",
          body: "Perfect. Attach with v3 submission. No SLA pause needed.",
          at: "yesterday · 11:22",
        },
      ],
    },
    aiHints: [
      {
        id: "ai1",
        correctionId: "fc1",
        title: "FocusScope from react-aria is the cleanest fit",
        detail:
          "A similar pattern appeared in your accepted Auth Modal submission from May 18.",
        confidence: "high",
        source: "Your accepted history",
      },
      {
        id: "ai2",
        correctionId: "fc2",
        title: "60-90s screencast is the typical evidence shape",
        detail:
          "Open demo → arrow through 3 days → select. The aria-live announcement is the moment that matters.",
        confidence: "high",
        source: "Spec §5.3 + recent accepted recordings",
      },
    ],
    readinessScore: 74,
    nextRequiredAction: "Wire FocusScope · then record JAWS",
    payoutAmount: "$240",
  },

  {
    id: "rev-t-3417",
    taskId: "t-3417",
    title: "Onboarding wizard rebuild",
    shortDescription: "Multi-step form with client-side validation",
    project: "Stratum-Pay",
    portfolio: "Onboarding",
    priority: "P1",
    skill: "React · L2",
    state: "feedback_received",
    reworkRound: 1,
    totalRounds: 3,
    feedbackReceivedAt: "yesterday · 16:42",
    dueAt: "May 27, 12:00",
    hoursToDue: 74,
    lastActivityAt: "yesterday",
    mentor: { name: "R. Verma", initials: "RV", role: "Mentor · Forms" },
    whatWorked:
      "Wizard structure is clear. Step transitions are smooth. Field components are well-composed.",
    mentorGuidance:
      "One required correction. Easy to close out cleanly — won't take long.",
    corrections: [
      {
        id: "c1",
        criterion: "Validation tests",
        description:
          "Add validation tests for invalid input cases (empty fields, malformed email, out-of-range numbers).",
        severity: "major",
        category: "Testing",
        resolved: false,
        evidenceRef: "tests/wizard.test.tsx",
      },
    ],
    optionalSuggestions: [
      "Consider extracting validation rules into a separate utility.",
    ],
    evidenceDeltas: [
      { id: "v1", label: "All five steps render", kind: "criterion", previous: "present", updated: "present" },
      { id: "v2", label: "Validation messages clear", kind: "criterion", previous: "present", updated: "present" },
      { id: "v3", label: "Validation tests for invalid input", kind: "criterion", previous: "missing", updated: "missing" },
    ],
    aiHints: [
      {
        id: "ai1",
        correctionId: "c1",
        title: "Vitest pattern matches your accepted Auth form tests",
        detail:
          "Three cases per field — empty, malformed, edge value. ~12 tests total at the same depth.",
        confidence: "high",
        source: "Your accepted Auth Modal tests · May 10",
      },
    ],
    readinessScore: 62,
    nextRequiredAction: "Write 12 validation test cases",
    payoutAmount: "$140",
  },

  {
    id: "rev-t-5209",
    taskId: "t-5209",
    title: "Reporting dashboard CSV export",
    shortDescription: "Export current view + filters as CSV",
    project: "Lighthouse-Ops",
    portfolio: "Reporting",
    priority: "P1",
    skill: "TypeScript · L3",
    state: "awaiting_clarification",
    reworkRound: 1,
    totalRounds: 2,
    feedbackReceivedAt: "2 days ago",
    dueAt: "May 28, 18:00",
    hoursToDue: 98,
    lastActivityAt: "5 hours ago",
    mentor: { name: "Hana Park", initials: "HP", role: "Mentor · Data" },
    whatWorked:
      "Filter respect is solid. The CSV header row matches the visible columns exactly — nice touch.",
    mentorGuidance:
      "One blocker on date locale, plus a clarification question pending from your side. The SLA is paused while we resolve it.",
    corrections: [
      {
        id: "c1",
        criterion: "Date locale",
        description:
          "Dates in the export must respect the user's locale, not the server default.",
        severity: "blocker",
        category: "Functionality",
        resolved: false,
        blockedBy: "Awaiting your clarification reply",
      },
    ],
    optionalSuggestions: [],
    evidenceDeltas: [
      { id: "v1", label: "Filters applied to export", kind: "criterion", previous: "present", updated: "present" },
      { id: "v2", label: "Date locale honored", kind: "criterion", previous: "missing", updated: "missing" },
    ],
    clarification: {
      status: "pending",
      raisedBy: "contributor",
      pauseSla: true,
      expectedBy: "today EOD",
      messages: [
        {
          id: "m1",
          author: "You",
          authorRole: "contributor",
          body: "Should locale come from the requesting user, or the team workspace default?",
          at: "5 hours ago",
        },
      ],
    },
    aiHints: [
      {
        id: "ai1",
        title: "Most reporting exports key off requester locale",
        detail:
          "In your accepted Invoice Export, locale came from the requester session. Sticking with that pattern is low risk.",
        confidence: "medium",
        source: "Your accepted Invoice Export · Mar 2026",
      },
    ],
    readinessScore: 48,
    nextRequiredAction: "Wait for mentor reply on locale source",
    payoutAmount: "$160",
  },

  {
    id: "rev-t-6033",
    taskId: "t-6033",
    title: "Empty-state illustrations · system",
    shortDescription: "Eight illustrations for the Helios empty states",
    project: "Acme-Helios",
    portfolio: "Enterprise Foundations",
    priority: "P2",
    skill: "Design · L2",
    state: "ready_for_resubmission",
    reworkRound: 2,
    totalRounds: 3,
    feedbackReceivedAt: "3 days ago",
    dueAt: "May 25, 18:00",
    hoursToDue: 32,
    lastActivityAt: "1 hour ago",
    mentor: { name: "Priya Iyer", initials: "PI", role: "Mentor · Design" },
    whatWorked:
      "Tone is consistent across all eight. The color choices read calm — exactly the brief.",
    mentorGuidance:
      "Two small polish items addressed. Looks ready to resubmit on your timing.",
    corrections: [
      {
        id: "c1",
        criterion: "Contrast on empty-error variant",
        description: "Increase contrast on the error variant to meet WCAG AA.",
        severity: "major",
        category: "Accessibility",
        resolved: true,
        evidenceRef: "empty-error-v2.svg",
      },
      {
        id: "c2",
        criterion: "File naming",
        description: "Rename to kebab-case per design-system file naming conventions.",
        severity: "nit",
        category: "Docs",
        resolved: true,
      },
    ],
    optionalSuggestions: [
      "If you have bandwidth, an empty-loading variant would be welcome but isn't required.",
    ],
    evidenceDeltas: [
      { id: "v1", label: "Error variant contrast", kind: "criterion", previous: "partial", updated: "present", note: "Now WCAG AA" },
      { id: "v2", label: "File naming", kind: "criterion", previous: "missing", updated: "present", note: "Renamed to kebab-case" },
      { id: "v3", label: "Source files", kind: "evidence", previous: "present", updated: "present" },
    ],
    aiHints: [],
    readinessScore: 96,
    nextRequiredAction: "Resubmit when ready",
    payoutAmount: "$180",
  },

  {
    id: "rev-t-4188",
    taskId: "t-4188",
    title: "Search bar keyboard shortcuts",
    shortDescription: "Cmd-K invocation with arrow navigation",
    project: "Helios-Core",
    portfolio: "Enterprise Foundations",
    priority: "P1",
    skill: "React · L3",
    state: "resubmitted_under_review",
    reworkRound: 2,
    totalRounds: 2,
    feedbackReceivedAt: "4 days ago",
    dueAt: "Resubmitted yesterday",
    hoursToDue: -1,
    lastActivityAt: "yesterday",
    mentor: { name: "Rajesh Verma", initials: "RV", role: "Mentor · A11y track" },
    whatWorked:
      "Cmd-K invocation is smooth. Recent searches caching landed cleanly. Strong test coverage.",
    mentorGuidance:
      "v2 resubmitted yesterday — sits in mentor review now. No action from you until they respond.",
    corrections: [
      {
        id: "c1",
        criterion: "Esc to close",
        description: "Esc should close even when an option is focused.",
        severity: "major",
        category: "Accessibility",
        resolved: true,
      },
    ],
    optionalSuggestions: [],
    evidenceDeltas: [
      { id: "v1", label: "Esc-to-close from focused option", kind: "criterion", previous: "missing", updated: "present" },
    ],
    aiHints: [],
    readinessScore: 100,
    nextRequiredAction: "Awaiting mentor decision · typically <24h",
    payoutAmount: "$200",
  },
];

/* ─────────────────────── Activity stream ─────────────────────── */

export const revisionActivityStream: RevisionActivityEvent[] = [
  {
    id: "a1",
    at: "an hour ago",
    kind: "draft_saved",
    taskId: "t-4821",
    detail: "Saved draft notes for Date Picker · FocusScope sketch",
  },
  {
    id: "a2",
    at: "5 hours ago",
    kind: "clarification_sent",
    taskId: "t-5209",
    detail: "Asked Hana about locale source",
    mentor: "Hana Park",
  },
  {
    id: "a3",
    at: "yesterday",
    kind: "resubmitted",
    taskId: "t-4188",
    detail: "Search shortcuts resubmitted (v2)",
    mentor: "Rajesh Verma",
  },
  {
    id: "a4",
    at: "yesterday · 16:42",
    kind: "feedback_received",
    taskId: "t-3417",
    detail: "Mentor feedback received · one correction",
    mentor: "R. Verma",
  },
  {
    id: "a5",
    at: "2 days ago",
    kind: "correction_resolved",
    taskId: "t-6033",
    detail: "Marked file-naming correction addressed",
  },
];

/* ─────────────────────── Helpers ─────────────────────── */

export function stateTone(state: RevisionWorkflowState): { chip: string; dot: string; label: string } {
  switch (state) {
    case "feedback_received":
      return {
        chip: "border-gold-200 bg-gold-50 text-gold-800",
        dot: "bg-gold-500",
        label: "Feedback received",
      };
    case "in_correction":
      return {
        chip: "border-teal-200 bg-teal-50 text-teal-800",
        dot: "bg-teal-600",
        label: "In correction",
      };
    case "awaiting_clarification":
      return {
        chip: "border-gold-200 bg-gold-50 text-gold-800",
        dot: "bg-gold-500",
        label: "Awaiting clarification",
      };
    case "ready_for_resubmission":
      return {
        chip: "border-forest-200 bg-forest-50 text-forest-800",
        dot: "bg-forest-500",
        label: "Ready to resubmit",
      };
    case "resubmitted_under_review":
      return {
        chip: "border-beige-200 bg-beige-50 text-beige-700",
        dot: "bg-beige-500",
        label: "Under review",
      };
  }
}

export function formatHoursToDue(hoursToDue: number): string {
  if (hoursToDue < 0) return "Resubmitted";
  if (hoursToDue === 0) return "Due now";
  if (hoursToDue < 24) return `${hoursToDue}h left`;
  return `${Math.floor(hoursToDue / 24)}d ${hoursToDue % 24}h`;
}

export function correctionStats(r: RevisionRow): {
  total: number;
  resolved: number;
  unresolved: number;
  pct: number;
} {
  const total = r.corrections.length;
  const resolved = r.corrections.filter((c) => c.resolved).length;
  return {
    total,
    resolved,
    unresolved: total - resolved,
    pct: total === 0 ? 0 : Math.round((resolved / total) * 100),
  };
}

export function severityTone(s: RevisionCorrection["severity"]): { chip: string; label: string } {
  switch (s) {
    case "blocker":
      return { chip: "border-brown-300 bg-brown-50 text-brown-800", label: "Must fix" };
    case "major":
      return { chip: "border-gold-200 bg-gold-50 text-gold-800", label: "Required" };
    case "nit":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "Polish" };
  }
}

export function urgencyOf(r: RevisionRow): "due_today" | "due_soon" | "comfortable" | "submitted" {
  if (r.state === "resubmitted_under_review") return "submitted";
  if (r.hoursToDue <= 24) return "due_today";
  if (r.hoursToDue <= 48) return "due_soon";
  return "comfortable";
}
