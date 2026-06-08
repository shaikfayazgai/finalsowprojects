/**
 * Mentor Workspace V2 — In Progress Reviews mock data.
 *
 * Active review continuity layer: stage, progress, draft summary, locks,
 * blockers, governance consultations, next required action, AI cues.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

import type {
  AiConfidenceBand,
  SlaTier,
} from "./mentor-workspace";

export type ActiveReviewStage =
  | "evidence_review"
  | "scoring"
  | "feedback"
  | "finalizing"
  | "draft"
  | "awaiting_clarification"
  | "governance_consultation"
  | "blocked";

export type ActiveReviewBlocker =
  | "contributor_response"
  | "governance_dependency"
  | "evidence_validation"
  | "policy_review"
  | "external_input"
  | "ai_consultation";

export type NextAction =
  | "continue_scoring"
  | "resume_evidence"
  | "send_clarification"
  | "await_governance"
  | "finalize_decision"
  | "follow_up_contributor"
  | "complete_rubric"
  | "verify_resubmission";

export type GovernanceConsultKind = "legal" | "compliance" | "security" | "policy";

export interface GovernanceConsult {
  active: boolean;
  kind?: GovernanceConsultKind;
  owner?: string;
  topic?: string;
  raisedAt?: string;
  slaHours?: number;
  hoursRemaining?: number;
}

export interface ActiveReviewRow {
  id: string;
  reviewId: string;
  contributor: {
    code: string;
    reliability: number;
  };
  task: {
    title: string;
    project: string;
    portfolio: string;
    priority: "P0" | "P1" | "P2";
    type: "initial" | "rework" | "final";
    round?: number;
    totalRounds?: number;
  };
  stage: ActiveReviewStage;
  progressPct: number; // 0–100, scoring progress
  ageHours: number; // hours since last meaningful activity
  totalActiveHours: number; // total hours in progress
  lockedBy: string; // mentor name
  isMyLock: boolean;
  lastActivityAt: string;
  isStalled: boolean;

  slaTier: SlaTier;
  slaRemainingHours: number;

  aiConfidence: number;
  aiConfidenceBand: AiConfidenceBand;
  aiCue?: string;

  governance: GovernanceConsult;

  blockers: ActiveReviewBlocker[];
  nextAction: NextAction;

  draftSummary?: string;
  notes: string;
  unresolvedIssues: number;
  pendingDecisions: string[];
  evidenceGaps?: string[];
}

export const blockerLabel: Record<ActiveReviewBlocker, string> = {
  contributor_response: "Awaiting contributor",
  governance_dependency: "Governance dependency",
  evidence_validation: "Evidence validation",
  policy_review: "Policy review",
  external_input: "External input",
  ai_consultation: "AI consultation",
};

export const stageLabel: Record<ActiveReviewStage, string> = {
  evidence_review: "Evidence review",
  scoring: "Scoring",
  feedback: "Feedback",
  finalizing: "Finalizing",
  draft: "Draft saved",
  awaiting_clarification: "Awaiting clarification",
  governance_consultation: "Governance consult",
  blocked: "Blocked",
};

export const nextActionLabel: Record<NextAction, string> = {
  continue_scoring: "Continue scoring",
  resume_evidence: "Resume evidence",
  send_clarification: "Send clarification",
  await_governance: "Await governance",
  finalize_decision: "Finalize decision",
  follow_up_contributor: "Follow up contributor",
  complete_rubric: "Complete rubric",
  verify_resubmission: "Verify resubmission",
};

export const activeReviews: ActiveReviewRow[] = [];

/* ────────────────── Status buckets ────────────────── */

export type StatusBucketKey =
  | "actively_reviewing"
  | "awaiting_clarification"
  | "governance_consultation"
  | "draft_reviews"
  | "evidence_comparison"
  | "blocked";

export interface StatusBucket {
  key: StatusBucketKey;
  label: string;
  caption: string;
  predicate: (r: ActiveReviewRow) => boolean;
  tone: "ok" | "info" | "warn" | "danger" | "neutral";
}

export const statusBuckets: StatusBucket[] = [];

/* ────────────────── Saved views ────────────────── */

export const activeSavedViews: {
  key: string;
  label: string;
  description: string;
  predicate: (r: ActiveReviewRow) => boolean;
}[] = [
  { key: "mine", label: "My active", description: "Active reviews I own", predicate: (r) => r.isMyLock },
  { key: "stalled", label: "Stalled > 4h", description: "Aging without movement", predicate: (r) => r.isStalled },
  { key: "ready_finalize", label: "Ready to finalize", description: "≥ 90% progress", predicate: (r) => r.progressPct >= 90 },
  { key: "governance_loop", label: "Governance loop", description: "In active consultation", predicate: (r) => r.governance.active },
  { key: "p0", label: "P0 priority", description: "P0 active reviews", predicate: (r) => r.task.priority === "P0" },
];

/* ────────────────── Helpers ────────────────── */

export function formatHoursAgo(hours: number): string {
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const d = Math.floor(hours / 24);
  const h = hours % 24;
  return h ? `${d}d ${h}h ago` : `${d}d ago`;
}
