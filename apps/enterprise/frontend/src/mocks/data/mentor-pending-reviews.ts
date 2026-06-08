/**
 * Mentor Workspace V2 — Pending Reviews queue mock data.
 *
 * Extended shape over the dashboard's PriorityReviewRow: adds review
 * complexity, estimated review minutes, contributor clarification flag,
 * governance hold + policy counts, and AI priority guidance.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

import type {
  AiConfidenceBand,
  RiskSeverity,
  SlaTier,
} from "./mentor-workspace";

export type PendingReviewState =
  | "pending"
  | "in_progress"
  | "ai_ready"
  | "rework"
  | "escalated"
  | "governance_hold";

export type ReviewComplexity = "low" | "medium" | "high" | "critical";
export type ReviewType = "initial" | "rework" | "final" | "escalation";

export interface PendingReviewRow {
  id: string;
  contributor: {
    code: string;
    name: string;
    reliability: number;
    new?: boolean;
    repeatFailure?: boolean;
  };
  task: {
    title: string;
    description: string;
    project: string;
    portfolio: string;
    priority: "P0" | "P1" | "P2";
    skills: string[];
    type: ReviewType;
    round?: number;
    totalRounds?: number;
  };
  submissionAgeHours: number;
  slaRemainingHours: number;
  slaTier: SlaTier;
  riskSeverity: RiskSeverity;
  reviewState: PendingReviewState;
  aiConfidence: number;
  aiConfidenceBand: AiConfidenceBand;
  aiPriorityRank?: number;
  aiRecommendation?: string;
  flags: string[];
  complexity: ReviewComplexity;
  estReviewMinutes: number;
  clarificationPending?: boolean;
  governance: {
    holds: number;
    policyWarnings: number;
    blockedDependency?: string;
    repeatFailure?: boolean;
  };
  evidenceCompleteness: number; // 0–100
}

const r = (h: number) => h; // tiny readability helper

export const pendingReviewQueue: PendingReviewRow[] = [];

/* ────────────────── Triage bucket logic ────────────────── */

export type TriageKey =
  | "sla_critical"
  | "governance_risk"
  | "ai_flagged"
  | "high_complexity"
  | "immediate"
  | "clarification";

export interface TriageBucket {
  key: TriageKey;
  label: string;
  caption: string;
  predicate: (r: PendingReviewRow) => boolean;
  tone: "danger" | "warn" | "info" | "neutral";
}

export const triageBuckets: TriageBucket[] = [];

/* ────────────────── Saved views ────────────────── */

export interface SavedView {
  key: string;
  label: string;
  description: string;
  count: number;
}

export const savedViews: { key: string; label: string; description: string; predicate: (r: PendingReviewRow) => boolean }[] = [
  {
    key: "todays_critical",
    label: "Today's critical",
    description: "Breached + critical SLA items active today",
    predicate: (r) => r.slaTier === "breached" || r.slaTier === "critical",
  },
  {
    key: "ai_ready",
    label: "AI quick-confirm",
    description: "High-confidence + clean evidence",
    predicate: (r) => r.reviewState === "ai_ready" || r.flags.includes("ai-ready"),
  },
  {
    key: "round_2_plus",
    label: "Round 2+",
    description: "Rework items past round 1",
    predicate: (r) => (r.task.round ?? 1) >= 2,
  },
  {
    key: "governance_flagged",
    label: "Governance flagged",
    description: "Holds, policy warnings, repeat offenders",
    predicate: (r) =>
      r.governance.holds > 0 ||
      r.governance.policyWarnings > 0 ||
      !!r.governance.repeatFailure,
  },
  {
    key: "new_contributors",
    label: "New contributors",
    description: "First few submissions",
    predicate: (r) => !!r.contributor.new,
  },
];

/* ────────────────── Helpers ────────────────── */

export function formatAge(hours: number): string {
  if (hours < 24) return `${hours}h`;
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  return h ? `${d}d ${h}h` : `${d}d`;
}
