/**
 * Mentor Workspace V2 — Rework Requests operations mock data.
 *
 * Correction lifecycle: rework state, anchored corrections with contributor
 * responses, revalidation checklist, repeat-failure tracking, clarification
 * thread, AI rework insight, audit timeline.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

import type { GovernanceEvent } from "./mentor-rework-escalation";
import type { RiskSeverity } from "./mentor-workspace";

export type ReworkOpsState =
  | "awaiting_revision"
  | "revision_submitted"
  | "mentor_revalidating"
  | "validated_pass"
  | "validated_fail"
  | "overdue"
  | "closed";

export type CorrectionSeverity = "blocker" | "major" | "nit";
export type CorrectionStatus = "open" | "addressed" | "rejected" | "deferred";

export type ReworkActionKey =
  | "send_reminder"
  | "begin_revalidation"
  | "continue_revalidation"
  | "verify_resubmission"
  | "request_clarification"
  | "approve_correction"
  | "request_another_round"
  | "escalate"
  | "close_passed";

export interface CorrectionItem {
  id: string;
  criterionId: string;
  criterionLabel: string;
  severity: CorrectionSeverity;
  required: boolean;
  description: string;
  status: CorrectionStatus;
  contributorResponse?: string;
  evidenceRefs: string[];
  mentorVerdict?: "pass" | "fail" | "needs_clarification";
  mentorNote?: string;
}

export interface RevalidationCheck {
  id: string;
  label: string;
  status: "verified" | "pending" | "failed";
  evidenceRef?: string;
  required: boolean;
}

export interface ReworkClarificationMessage {
  id: string;
  author: string;
  authorRole: "mentor" | "reviewer" | "contributor" | "system";
  body: string;
  at: string;
  attachments?: { label: string; size?: string }[];
}

export interface ReworkClarification {
  id: string;
  status: "pending" | "answered" | "resolved";
  raisedBy: string;
  expectedBy: string;
  pauseSla: boolean;
  messages: ReworkClarificationMessage[];
}

export interface PriorReworkRound {
  round: number;
  outcome: "passed" | "failed" | "withdrawn";
  reviewer: string;
  closedAt: string;
  unresolvedAtClose?: number;
}

export interface RepeatFailureSignal {
  contributorCode: string;
  reliability: number;
  reliabilityTrend: number;
  reworkLast30d: number;
  failedRevalidations30d: number;
  unresolvedPatterns: string[];
  escalationsTriggered: number;
}

export interface ReworkAiInsight {
  summary: string;
  confidence: number;
  recommendation?: string;
  escalationRecommended: boolean;
  improvementTrend: "improving" | "flat" | "declining";
  tags: string[];
}

export interface ReworkOpsRow {
  id: string;
  reviewId: string;
  task: {
    title: string;
    project: string;
    portfolio: string;
    priority: "P0" | "P1" | "P2";
  };
  contributor: {
    code: string;
    reliability: number;
    repeatFailures: number;
    new?: boolean;
  };
  category: ReworkOpsState; // primary lifecycle state
  state: ReworkOpsState;
  governanceSeverity: RiskSeverity;
  round: number;
  totalRounds: number;
  raisedBy: string;
  raisedAt: string;
  dueAt: string;
  revisionAgeHours: number; // hours since rework requested
  slaRemainingHours: number;
  isOverdue: boolean;

  contributorAck: {
    acknowledged: boolean;
    ackedAt?: string;
    note?: string;
  };

  corrections: CorrectionItem[];
  revalidationChecklist: RevalidationCheck[];

  validationState: "not_started" | "in_progress" | "complete_pass" | "complete_fail";
  validationProgressPct: number;

  governanceInvolvement?: {
    active: boolean;
    kind?: "policy" | "compliance" | "legal" | "security";
    owner?: string;
    detail?: string;
  };

  clarification?: ReworkClarification;
  priorRounds: PriorReworkRound[];

  routingOnResubmit: "same_reviewer" | "fresh_reviewer";

  nextAction: ReworkActionKey;
  timeline: GovernanceEvent[];

  ai: ReworkAiInsight;
}

export const reworkOpsStateLabel: Record<ReworkOpsState, string> = {
  awaiting_revision: "Awaiting revision",
  revision_submitted: "Revision submitted",
  mentor_revalidating: "Mentor revalidating",
  validated_pass: "Validated · pass",
  validated_fail: "Validated · fail",
  overdue: "Overdue",
  closed: "Closed",
};

export const reworkActionLabel: Record<ReworkActionKey, string> = {
  send_reminder: "Send reminder",
  begin_revalidation: "Begin revalidation",
  continue_revalidation: "Continue revalidation",
  verify_resubmission: "Verify resubmission",
  request_clarification: "Request clarification",
  approve_correction: "Approve correction",
  request_another_round: "Request another round",
  escalate: "Escalate",
  close_passed: "Close · passed",
};

export const reworkOpsRows: ReworkOpsRow[] = [];

/* ────────────────── Priority buckets ────────────────── */

export type ReworkBucketKey =
  | "awaiting_revision"
  | "revision_submitted"
  | "overdue"
  | "revalidation_pending"
  | "repeated_failure"
  | "escalation_recommended";

export interface ReworkBucket {
  key: ReworkBucketKey;
  label: string;
  caption: string;
  predicate: (r: ReworkOpsRow) => boolean;
  tone: "danger" | "warn" | "info" | "neutral" | "ok";
}

export const reworkBuckets: ReworkBucket[] = [
  {
    key: "awaiting_revision",
    label: "Awaiting Contributor Revision",
    caption: "Not yet resubmitted",
    predicate: (r) => r.state === "awaiting_revision" && !r.isOverdue,
    tone: "info",
  },
  {
    key: "revision_submitted",
    label: "Revision Submitted",
    caption: "Ready for mentor validation",
    predicate: (r) => r.state === "revision_submitted",
    tone: "ok",
  },
  {
    key: "overdue",
    label: "Overdue Rework",
    caption: "Past SLA · no movement",
    predicate: (r) => r.isOverdue,
    tone: "danger",
  },
  {
    key: "revalidation_pending",
    label: "Mentor Revalidation Pending",
    caption: "Mentor active or queued",
    predicate: (r) => r.state === "mentor_revalidating" || r.state === "revision_submitted",
    tone: "warn",
  },
  {
    key: "repeated_failure",
    label: "Repeated Correction Failure",
    caption: "2+ failed validations",
    predicate: (r) => r.contributor.repeatFailures >= 2,
    tone: "danger",
  },
  {
    key: "escalation_recommended",
    label: "Escalation Recommended",
    caption: "AI-suggested escalation",
    predicate: (r) => r.ai.escalationRecommended,
    tone: "danger",
  },
];

/* ────────────────── Saved views ────────────────── */

export const reworkSavedViews: {
  key: string;
  label: string;
  description: string;
  predicate: (r: ReworkOpsRow) => boolean;
}[] = [
  { key: "my_validations", label: "My validations", description: "Items I need to validate", predicate: (r) => r.state === "revision_submitted" || r.state === "mentor_revalidating" },
  { key: "needs_reminder", label: "Needs reminder", description: "Awaiting + no ack > 24h", predicate: (r) => r.state === "awaiting_revision" && !r.contributorAck.acknowledged && r.revisionAgeHours > 24 },
  { key: "ready_close", label: "Ready to close", description: "Validation passed", predicate: (r) => r.state === "validated_pass" },
  { key: "round_3_risk", label: "Round-3 risk", description: "Round 2+ with declining trend", predicate: (r) => r.round >= 2 && r.ai.improvementTrend === "declining" },
  { key: "clarification_active", label: "Active clarification", description: "Open Q&A thread", predicate: (r) => !!r.clarification && r.clarification.status !== "resolved" },
];

/* ────────────────── Repeat failure signals ────────────────── */

export const repeatFailureSignals: RepeatFailureSignal[] = [];

/* ────────────────── AI rework aggregates ────────────────── */

export interface ReworkAiAggregate {
  id: string;
  title: string;
  summary: string;
  recommendation?: string;
  confidence: number;
  affects: string[];
  kind: "improvement_trend" | "repeat_pattern" | "escalation_forecast" | "coaching_opportunity" | "anomaly_cluster";
  generatedAt: string;
}

export const reworkAiAggregates: ReworkAiAggregate[] = [];

/* ────────────────── Helpers ────────────────── */

export function formatRevisionAge(h: number): string {
  if (h < 0) return `${Math.abs(h)}h overdue`;
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export function formatSlaLabel(h: number): string {
  if (h < 0) return `${Math.abs(h)}h overdue`;
  if (h === 0) return "due now";
  if (h < 24) return `${h}h left`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h left`;
}
