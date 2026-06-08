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
  id: "",
  title: "",
  shortDescription: "",
  brief: "",
  project: "",
  portfolio: "",
  priority: "P2",
  skill: "",
  skillLevel: "",
  deadline: "",
  deadlineHoursRemaining: 0,
  state: "assigned",
  progressPct: 0,
  readinessScore: 0,
  estimatedMinutesRemaining: 0,
  payoutAmount: "",
  payoutCurrency: "USD",
  mentor: {
    name: "",
    role: "",
    initials: "",
  },
  instructions: [],
  deliverables: [],
  dependencies: [],
  milestones: [],
  acceptanceCriteria: [],
  evidence: {
    artifacts: [],
    requiredCount: 0,
    completeCount: 0,
  },
  draft: {
    notes: "",
    lastSavedAt: "",
    autosaveStatus: "saved",
  },
  aiSuggestions: [],
  submissionReadiness: {
    overall: 0,
    signals: [],
  },
  history: [],
  externalLinks: [],
  lastActivityAt: "",
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

export const correctionAiHints: CorrectionAiHint[] = [];

export const revisionComparisonRows: VersionComparisonRow[] = [];

export const revisionHistory: RevisionRoundSummary[] = [];

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
