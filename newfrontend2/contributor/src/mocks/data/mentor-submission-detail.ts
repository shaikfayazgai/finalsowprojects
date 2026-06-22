/**
 * Mentor Workspace V2 — Submission Review detail mock.
 * Powers /mentor/reviews/[reviewId]. Frontend-only; backend integration in Phase 2.
 *
 * Shape covers everything the operational review cockpit needs:
 *   task + contributor + artifacts + rubric + AI rationale + governance + audit history.
 */

import type {
  AiConfidenceBand,
  ReviewState,
  RiskSeverity,
  SlaTier,
} from "./mentor-workspace";

export type ReviewType = "initial" | "rework" | "final" | "escalation";
export type ArtifactKind = "archive" | "doc" | "image" | "video" | "link";
export type RiskFlagKind = "plagiarism" | "timing" | "integrity" | "scope";
export type CriterionSeverity = "blocker" | "major" | "nit";
export type Decision = "accept" | "rework" | "reject" | "escalate" | "hold";

export interface SubmissionArtifact {
  id: string;
  name: string;
  kind: ArtifactKind;
  mime: string;
  sizeLabel: string;
  sha256: string;
  shaMatches: boolean;
  virusScan: "clean" | "infected" | "pending";
  plagiarismOriginalityPct?: number;
  plagiarismNote?: string;
  uploadedAt: string;
  previewLines?: string[];
}

export interface StructuredResponse {
  question: string;
  answer: string;
}

export interface EvidenceCheck {
  label: string;
  status: "ok" | "missing" | "partial";
  note?: string;
}

export interface RubricCriterion {
  id: string;
  label: string;
  description: string;
  weight: number;
  examples: string[];
  aiScore: number;
  aiConfidence: number;
  aiConfidenceBand: AiConfidenceBand;
  aiRationale: string;
  sourceRefs: string[];
  examined: string[];
  notReviewed: string[];
  yourScore?: number;
  severity?: CriterionSeverity;
  reasoning?: string;
}

export interface RiskFlag {
  kind: RiskFlagKind;
  title: string;
  detail: string;
  confidence: number;
  acknowledged?: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  tone?: "ai" | "human" | "system";
}

export interface PriorVersion {
  version: number;
  decision: Decision;
  reviewer: string;
  when: string;
  reworkItems?: number;
}

export interface PriorEscalation {
  id: string;
  raisedAt: string;
  type: string;
  resolution: string;
}

export interface ContributorContext {
  code: string;
  name: string;
  joinedMonths: number;
  level: string;
  reliability: number;
  reliabilityTrend: number;
  acceptancePct: number;
  avgReworkRounds: number;
  last5: ("accept" | "rework" | "reject")[];
  anomaly?: string;
  watch?: string;
  skills: { name: string; level: string }[];
}

export interface GovernanceHoldNote {
  active: boolean;
  kind?: "legal" | "compliance" | "security" | "policy";
  heldBy?: string;
  heldSince?: string;
  expectedRelease?: string;
  reason?: string;
}

export interface SubmissionDetail {
  id: string;
  task: {
    title: string;
    description: string;
    project: string;
    portfolio: string;
    priority: "P0" | "P1" | "P2";
    skills: string[];
    sowRef: string;
  };
  contributor: ContributorContext;
  version: number;
  round: number;
  totalRounds: number;
  type: ReviewType;
  state: ReviewState;
  slaTier: SlaTier;
  slaRemainingHours: number;
  submissionAgeHours: number;
  riskSeverity: RiskSeverity;
  continuityFlag?: string;
  artifacts: SubmissionArtifact[];
  externalLinks: { label: string; url: string }[];
  structuredResponses: StructuredResponse[];
  evidenceChecklist: EvidenceCheck[];
  rubric: RubricCriterion[];
  ai: {
    version: string;
    overallConfidence: number;
    overallBand: AiConfidenceBand;
    generatedAt: string;
    coverageGaps: string[];
    riskFlags: RiskFlag[];
    savedMinutes: number;
    summary: string;
  };
  governance: {
    hold: GovernanceHoldNote;
    policyWarnings: { id: string; severity: RiskSeverity; label: string; detail: string }[];
    sowChecks: { label: string; status: "ok" | "warn" | "fail" }[];
    complianceTags: string[];
  };
  audit: AuditEvent[];
  priorVersions: PriorVersion[];
  priorEscalations: PriorEscalation[];
}

export const sampleSubmissionDetail: SubmissionDetail = {
  id: "r-4821",
  task: {
    title: "Build accessible date picker component",
    description:
      "Implement a fully WCAG 2.2 AA compliant date-picker component for the Helios design system. Must support keyboard navigation, screen-reader announcements, focus trapping inside the popover, locale-aware formatting, and headless usage. Include unit tests, Storybook stories, and a live demo route.",
    project: "Acme-Helios",
    portfolio: "Enterprise Foundations",
    priority: "P0",
    skills: ["React", "TypeScript", "A11y", "Tailwind", "Testing"],
    sowRef: "SOW-2026-014 · Milestone M3 · Task T-318",
  },
  contributor: {
    code: "c4821",
    name: "Verified Contributor · L3 React",
    joinedMonths: 7,
    level: "L3",
    reliability: 87,
    reliabilityTrend: 4,
    acceptancePct: 80,
    avgReworkRounds: 1.4,
    last5: ["accept", "accept", "rework", "accept", "reject"],
    anomaly: undefined,
    watch: "A11y coaching track",
    skills: [
      { name: "React", level: "L3" },
      { name: "TypeScript", level: "L3" },
      { name: "A11y", level: "L2" },
      { name: "Tailwind", level: "L2" },
    ],
  },
  version: 2,
  round: 2,
  totalRounds: 3,
  type: "rework",
  state: "in_progress",
  slaTier: "critical",
  slaRemainingHours: 2,
  submissionAgeHours: 22,
  riskSeverity: "low",
  continuityFlag: "You reviewed v1 of this submission — continuity bias risk.",
  artifacts: [
    {
      id: "art-1",
      name: "datepicker-v2.zip",
      kind: "archive",
      mime: "application/zip",
      sizeLabel: "2.4 MB",
      sha256: "7a9c4b2d1e8f3a06c5b9d4e2f1a8c7b9d4e2f1a8c7b9d4e2f1a8c7b9d4e2f1a8",
      shaMatches: true,
      virusScan: "clean",
      plagiarismOriginalityPct: 94,
      plagiarismNote: "3 utility funcs overlap public repo (88% match)",
      uploadedAt: "2026-05-22 18:04",
      previewLines: [
        "import React from \"react\"",
        "import { Dialog } from \"./Dialog\"",
        "",
        "export function DatePicker() {",
        "  const focusRef = useRef<HTMLButtonElement>(null)",
        "  useEffect(() => focusRef.current?.focus(), [open])",
        "  return (",
        "    <Dialog aria-label=\"Choose date\" initialFocus={focusRef}>",
        "      …",
        "    </Dialog>",
        "  )",
        "}",
      ],
    },
    {
      id: "art-2",
      name: "stories.mdx",
      kind: "doc",
      mime: "text/markdown",
      sizeLabel: "480 KB",
      sha256: "a1c4b2d1e8f3a06c5b9d4e2f1a8c7b9d4e2f1a8c7b9d4e2f1a8c7b9d4e2f1aff",
      shaMatches: true,
      virusScan: "clean",
      uploadedAt: "2026-05-22 18:04",
    },
    {
      id: "art-3",
      name: "demo-walkthrough.mp4",
      kind: "video",
      mime: "video/mp4",
      sizeLabel: "12.6 MB",
      sha256: "bb33c4b2d1e8f3a06c5b9d4e2f1a8c7b9d4e2f1a8c7b9d4e2f1a8c7b9d4e2f001",
      shaMatches: true,
      virusScan: "clean",
      uploadedAt: "2026-05-22 18:07",
    },
  ],
  externalLinks: [
    { label: "Storybook · DatePicker", url: "https://storybook.example.com/datepicker" },
    { label: "GitHub PR #284", url: "https://github.com/example/repo/pull/284" },
    { label: "Live demo (staging)", url: "https://staging.example.com/datepicker" },
  ],
  structuredResponses: [
    {
      question: "What rework items from v1 did you address?",
      answer:
        "Implemented focus-trap in popover via react-aria FocusScope, added aria-label and aria-describedby on the trigger, added keyboard nav (arrow keys, PageUp/Down, Home/End) and screen-reader announcements via aria-live polite.",
    },
    {
      question: "What's still uncertain or risky?",
      answer:
        "RTL layout has minor visual offset on the month dropdown — works functionally but needs polish. Did not include a video tour of RTL specifically.",
    },
    {
      question: "How did you test accessibility?",
      answer:
        "axe-core in unit tests (0 violations), VoiceOver on macOS, NVDA on Windows. Did not test JAWS.",
    },
  ],
  evidenceChecklist: [
    { label: "Unit tests added", status: "ok", note: "94% coverage" },
    { label: "Storybook stories", status: "ok" },
    { label: "Type definitions", status: "ok" },
    { label: "Accessibility audit", status: "partial", note: "axe + VoiceOver + NVDA, no JAWS" },
    { label: "Live demo route", status: "ok" },
    { label: "Video walkthrough", status: "ok" },
    { label: "Performance budget", status: "ok", note: "≤ 12kb gzipped" },
    { label: "RTL test", status: "missing", note: "not provided" },
  ],
  rubric: [
    {
      id: "C1",
      label: "Code quality",
      description: "Readability, modularity, idiomatic React/TS",
      weight: 20,
      examples: ["Hooks usage", "Type strictness", "Naming"],
      aiScore: 4,
      aiConfidence: 92,
      aiConfidenceBand: "high",
      aiRationale:
        "Component is well-structured. Hooks usage is idiomatic, types are strict. Minor: a few utility hooks could be extracted.",
      sourceRefs: ["src/components/DatePicker.tsx lines 1-180"],
      examined: ["source files", "type definitions", "story files"],
      notReviewed: [],
      yourScore: 4,
    },
    {
      id: "C2",
      label: "Completeness",
      description: "Covers all SOW requirements",
      weight: 20,
      examples: ["All required props", "All required interactions"],
      aiScore: 5,
      aiConfidence: 88,
      aiConfidenceBand: "high",
      aiRationale: "All 12 requirements from spec are addressed. Demo route works.",
      sourceRefs: ["spec §3", "demo route"],
      examined: ["spec", "live demo path"],
      notReviewed: [],
      yourScore: 5,
    },
    {
      id: "C3",
      label: "Requirements adherence",
      description: "Implements spec verbatim, no scope drift",
      weight: 25,
      examples: ["Keyboard contract matches spec", "Locale support"],
      aiScore: 3,
      aiConfidence: 71,
      aiConfidenceBand: "medium",
      aiRationale:
        "Covers 5 of 6 requirements. Missing explicit JAWS verification per spec §4.2. RTL polish gap noted by contributor.",
      sourceRefs: ["spec §4.2 lines 12-17", "contributor Q&A response 3"],
      examined: ["spec", "stories", "code"],
      notReviewed: ["live demo with JAWS", "RTL screenshots"],
      severity: "major",
    },
    {
      id: "C4",
      label: "Testing",
      description: "Quality and coverage of tests",
      weight: 15,
      examples: ["Unit", "Integration", "A11y"],
      aiScore: 4,
      aiConfidence: 84,
      aiConfidenceBand: "high",
      aiRationale: "94% coverage. axe-core present. No e2e in scope.",
      sourceRefs: ["package.json test scripts", "coverage report"],
      examined: ["test files", "coverage output"],
      notReviewed: [],
      yourScore: 4,
    },
    {
      id: "C5",
      label: "Accessibility",
      description: "WCAG 2.2 AA conformance",
      weight: 20,
      examples: ["Keyboard", "Screen reader", "Focus management"],
      aiScore: 3,
      aiConfidence: 54,
      aiConfidenceBand: "low",
      aiRationale:
        "Focus trap and aria-label implemented in v2. JAWS unverified. Spec §5.3 explicitly requires JAWS support.",
      sourceRefs: ["spec §5.3", "code lines 124-132"],
      examined: ["code", "stories"],
      notReviewed: ["JAWS verification", "live demo with NVDA"],
      severity: "major",
    },
  ],
  ai: {
    version: "v3.2",
    overallConfidence: 78,
    overallBand: "medium",
    generatedAt: "2026-05-23 14:08",
    coverageGaps: [
      "JAWS screen-reader verification not run",
      "RTL screenshots not provided",
      "Live demo not invoked end-to-end by model",
    ],
    riskFlags: [
      {
        kind: "plagiarism",
        title: "Plagiarism · 3 utility functions",
        detail: "Originality 94%. Three small util functions match a public repo at 88%.",
        confidence: 88,
        acknowledged: false,
      },
      {
        kind: "timing",
        title: "Timing · v2 submitted 4 min after v1 feedback",
        detail: "Resubmission cadence is faster than the contributor's median (median 6h).",
        confidence: 72,
        acknowledged: false,
      },
    ],
    savedMinutes: 28,
    summary:
      "Rework round 2 substantially addresses v1's focus-trap and labeling gaps. Confidence is medium because JAWS support claim cannot be verified from artifacts alone — requires human review.",
  },
  governance: {
    hold: {
      active: false,
    },
    policyWarnings: [
      {
        id: "pol-cont-1",
        severity: "low",
        label: "Reviewer continuity",
        detail: "You reviewed v1 of this submission. Consider releasing to a fresh reviewer at round 3.",
      },
    ],
    sowChecks: [
      { label: "Inside SOW scope", status: "ok" },
      { label: "Spec version match", status: "ok" },
      { label: "Sensitive data handling", status: "warn" },
      { label: "GDPR boundary", status: "ok" },
    ],
    complianceTags: ["WCAG 2.2 AA", "GDPR", "SOC2"],
  },
  audit: [
    {
      id: "ev-1",
      timestamp: "May 23 14:08",
      actor: "AI v3.2",
      action: "Generated rubric proposal",
      detail: "Confidence 78% medium · 4/5 criteria pre-filled",
      tone: "ai",
    },
    {
      id: "ev-2",
      timestamp: "May 23 14:21",
      actor: "R. Verma",
      action: "Claimed item",
      detail: "Lock acquired · continuity flag noted",
      tone: "human",
    },
    {
      id: "ev-3",
      timestamp: "May 22 18:04",
      actor: "c4821",
      action: "Submitted v2",
      detail: "Resubmission after rework round 1",
      tone: "human",
    },
    {
      id: "ev-4",
      timestamp: "May 22 11:15",
      actor: "R. Verma",
      action: "Rework requested on v1",
      detail: "2 criteria below threshold · C3 + C5",
      tone: "human",
    },
    {
      id: "ev-5",
      timestamp: "May 22 09:42",
      actor: "AI v3.2",
      action: "Flagged risk · plagiarism",
      detail: "3 utility funcs overlap public repo (88% match)",
      tone: "ai",
    },
    {
      id: "ev-6",
      timestamp: "May 21 16:00",
      actor: "c4821",
      action: "Submitted v1",
      detail: "Initial submission",
      tone: "human",
    },
  ],
  priorVersions: [
    {
      version: 1,
      decision: "rework",
      reviewer: "R. Verma",
      when: "May 22 11:15",
      reworkItems: 2,
    },
  ],
  priorEscalations: [],
};
