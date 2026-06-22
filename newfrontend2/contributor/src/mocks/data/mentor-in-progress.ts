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

export const activeReviews: ActiveReviewRow[] = [
  {
    id: "ar-4821",
    reviewId: "r-4821",
    contributor: { code: "c4821", reliability: 87 },
    task: {
      title: "Build accessible date picker",
      project: "Acme-Helios",
      portfolio: "Enterprise Foundations",
      priority: "P0",
      type: "rework",
      round: 2,
      totalRounds: 3,
    },
    stage: "scoring",
    progressPct: 68,
    ageHours: 1,
    totalActiveHours: 3,
    lockedBy: "You · R. Verma",
    isMyLock: true,
    lastActivityAt: "13:42",
    isStalled: false,
    slaTier: "critical",
    slaRemainingHours: 2,
    aiConfidence: 94,
    aiConfidenceBand: "high",
    aiCue: "Quick-confirm candidate · C1, C2, C4 fully covered.",
    governance: { active: false },
    blockers: [],
    nextAction: "continue_scoring",
    notes: "Two criteria pre-filled from AI. C3 (Requirements) flagged for manual override pending JAWS evidence.",
    unresolvedIssues: 1,
    pendingDecisions: ["Confirm C3 score after JAWS recording attached", "Approve C5 if matches v1 commitment"],
    draftSummary: "Strong v2 — focus trap implemented, RTL polish noted. JAWS verification asked via clarification thread.",
  },
  {
    id: "ar-7715",
    reviewId: "r-7715",
    contributor: { code: "c7715", reliability: 58 },
    task: {
      title: "Search relevance ranker",
      project: "BetaCo",
      portfolio: "Discovery",
      priority: "P0",
      type: "rework",
      round: 2,
      totalRounds: 3,
    },
    stage: "evidence_review",
    progressPct: 24,
    ageHours: 3,
    totalActiveHours: 5,
    lockedBy: "You · R. Verma",
    isMyLock: true,
    lastActivityAt: "11:10",
    isStalled: false,
    slaTier: "critical",
    slaRemainingHours: 1,
    aiConfidence: 54,
    aiConfidenceBand: "low",
    aiCue: "Low confidence · coverage gap in evidence (offline-eval missing).",
    governance: { active: false },
    blockers: ["evidence_validation"],
    nextAction: "resume_evidence",
    notes: "Inspecting offline-eval harness. Coverage spreadsheet does not match SOW §4 metrics.",
    unresolvedIssues: 2,
    pendingDecisions: ["Validate eval metrics vs SOW §4", "Decide rework vs request clarification"],
    evidenceGaps: ["Offline evaluation harness output", "Latency benchmark on production traffic"],
    draftSummary: "Evidence is incomplete. Two criteria below threshold. Likely rework round 3.",
  },
  {
    id: "ar-3902",
    reviewId: "r-3902",
    contributor: { code: "c5102", reliability: 64 },
    task: {
      title: "Auth modal redesign",
      project: "BetaCo",
      portfolio: "Identity",
      priority: "P1",
      type: "rework",
      round: 3,
      totalRounds: 3,
    },
    stage: "governance_consultation",
    progressPct: 52,
    ageHours: 5,
    totalActiveHours: 9,
    lockedBy: "You · R. Verma",
    isMyLock: true,
    lastActivityAt: "09:18",
    isStalled: true,
    slaTier: "critical",
    slaRemainingHours: 3,
    aiConfidence: 41,
    aiConfidenceBand: "low",
    aiCue: "Spec ambiguity escalation open. Hold decision until ruling.",
    governance: {
      active: true,
      kind: "policy",
      owner: "S. Iyer · Enterprise admin",
      topic: "Session-timeout policy after step-up auth · spec §4.2 vs §4.7",
      raisedAt: "May 23 09:14",
      slaHours: 24,
      hoursRemaining: 6,
    },
    blockers: ["governance_dependency"],
    nextAction: "await_governance",
    notes: "Escalation routed to admin tier. Tracker open. Will resume once ruling returns.",
    unresolvedIssues: 3,
    pendingDecisions: ["Spec ruling (admin)", "Apply ruling to rubric C1/C3", "Notify contributor with outcome"],
    draftSummary: "Decision blocked by governance. Rubric partially complete (C2, C4, C5 ready).",
  },
  {
    id: "ar-1142",
    reviewId: "r-1142",
    contributor: { code: "c1142", reliability: 71 },
    task: {
      title: "Refactor billing service",
      project: "Acme-Helios",
      portfolio: "Payments",
      priority: "P0",
      type: "rework",
      round: 2,
      totalRounds: 3,
    },
    stage: "blocked",
    progressPct: 38,
    ageHours: 8,
    totalActiveHours: 12,
    lockedBy: "You · R. Verma",
    isMyLock: true,
    lastActivityAt: "06:30",
    isStalled: true,
    slaTier: "breached",
    slaRemainingHours: -8,
    aiConfidence: 78,
    aiConfidenceBand: "medium",
    aiCue: "Plagiarism flag unresolved. Block accept until acknowledgment.",
    governance: {
      active: true,
      kind: "policy",
      owner: "Conduct review · Mentor R.",
      topic: "Plagiarism dispute · 3 utility funcs",
      raisedAt: "May 23 09:42",
      slaHours: 24,
      hoursRemaining: 14,
    },
    blockers: ["policy_review", "ai_consultation"],
    nextAction: "await_governance",
    notes: "Contributor dispute pending; plagiarism report needs joint review with conduct team.",
    unresolvedIssues: 4,
    pendingDecisions: ["Conduct ruling", "AI override on C1", "Decide accept vs reject vs reassign"],
    draftSummary: "Decision blocked. Awaiting dispute resolution.",
  },
  {
    id: "ar-5520",
    reviewId: "r-5520",
    contributor: { code: "c5520", reliability: 79 },
    task: {
      title: "PII redaction module",
      project: "Helios-Vault",
      portfolio: "Privacy",
      priority: "P0",
      type: "final",
    },
    stage: "draft",
    progressPct: 82,
    ageHours: 18,
    totalActiveHours: 18,
    lockedBy: "You · R. Verma",
    isMyLock: true,
    lastActivityAt: "yesterday 16:40",
    isStalled: true,
    slaTier: "warning",
    slaRemainingHours: 12,
    aiConfidence: 72,
    aiConfidenceBand: "medium",
    aiCue: "Draft saved · resume to finalize. Hold may delay submission.",
    governance: {
      active: true,
      kind: "legal",
      owner: "J. Khan · Legal officer",
      topic: "Data sensitivity classification",
      raisedAt: "May 22 09:00",
      slaHours: 72,
      hoursRemaining: 30,
    },
    blockers: ["governance_dependency"],
    nextAction: "verify_resubmission",
    notes: "Pseudonymization key rotation confirmed via spec §7.2. Awaiting legal release before commit.",
    unresolvedIssues: 1,
    pendingDecisions: ["Verify hold release", "Confirm acceptance memo"],
    draftSummary: "Rubric 4/5 complete · C5 pending legal confirmation. Decision draft set to Accept.",
  },
  {
    id: "ar-6710",
    reviewId: "r-6710",
    contributor: { code: "c6710", reliability: 92 },
    task: {
      title: "Stripe webhook handler",
      project: "Acme-Helios",
      portfolio: "Payments",
      priority: "P1",
      type: "initial",
    },
    stage: "finalizing",
    progressPct: 96,
    ageHours: 1,
    totalActiveHours: 2,
    lockedBy: "You · R. Verma",
    isMyLock: true,
    lastActivityAt: "13:48",
    isStalled: false,
    slaTier: "warning",
    slaRemainingHours: 6,
    aiConfidence: 88,
    aiConfidenceBand: "high",
    aiCue: "Ready to finalize. AI suggests accept · clean evidence.",
    governance: { active: false },
    blockers: [],
    nextAction: "finalize_decision",
    notes: "All criteria scored. Feedback note drafted. Confidence high.",
    unresolvedIssues: 0,
    pendingDecisions: ["Submit accept decision"],
    draftSummary: "Accept · rubric 5/5. Strong v1 submission. Clean coverage.",
  },
  {
    id: "ar-8044",
    reviewId: "r-8044",
    contributor: { code: "c8044", reliability: 81 },
    task: {
      title: "Analytics SQL schema",
      project: "BetaCo",
      portfolio: "Analytics",
      priority: "P2",
      type: "initial",
    },
    stage: "feedback",
    progressPct: 75,
    ageHours: 2,
    totalActiveHours: 4,
    lockedBy: "You · R. Verma",
    isMyLock: true,
    lastActivityAt: "12:20",
    isStalled: false,
    slaTier: "watch",
    slaRemainingHours: 18,
    aiConfidence: 86,
    aiConfidenceBand: "high",
    aiCue: "On track. Minor schema-naming nit suggested.",
    governance: { active: false },
    blockers: [],
    nextAction: "complete_rubric",
    notes: "Writing feedback note for C3. Star-schema design solid; minor naming clean-up.",
    unresolvedIssues: 0,
    pendingDecisions: ["Save feedback for C3", "Decide nit vs major severity"],
    draftSummary: "Likely accept with one nit. Rubric 4/5 done.",
  },
  {
    id: "ar-9301",
    reviewId: "r-9301",
    contributor: { code: "c9301", reliability: 88 },
    task: {
      title: "Feature flag SDK",
      project: "Acme-Helios",
      portfolio: "Platform",
      priority: "P1",
      type: "initial",
      round: 1,
    },
    stage: "scoring",
    progressPct: 40,
    ageHours: 4,
    totalActiveHours: 4,
    lockedBy: "You · R. Verma",
    isMyLock: true,
    lastActivityAt: "10:24",
    isStalled: false,
    slaTier: "healthy",
    slaRemainingHours: 20,
    aiConfidence: 91,
    aiConfidenceBand: "high",
    aiCue: "AI-ready · 2 criteria already accepted. Consider quick-confirm.",
    governance: { active: false },
    blockers: [],
    nextAction: "continue_scoring",
    notes: "Two criteria pre-accepted via AI quick-confirm. Need to finish C4 and C5.",
    unresolvedIssues: 0,
    pendingDecisions: ["Score C4", "Score C5"],
    draftSummary: "Likely accept. Quick-confirm path available.",
  },
  {
    id: "ar-4480",
    reviewId: "r-4480",
    contributor: { code: "c4480", reliability: 76 },
    task: {
      title: "Auth tokens rotation script",
      project: "Acme-Helios",
      portfolio: "Security",
      priority: "P1",
      type: "final",
    },
    stage: "awaiting_clarification",
    progressPct: 55,
    ageHours: 6,
    totalActiveHours: 8,
    lockedBy: "You · R. Verma",
    isMyLock: true,
    lastActivityAt: "08:18",
    isStalled: false,
    slaTier: "watch",
    slaRemainingHours: 16,
    aiConfidence: 67,
    aiConfidenceBand: "medium",
    aiCue: "Pending clarification · resume after contributor reply.",
    governance: { active: false },
    blockers: ["contributor_response"],
    nextAction: "follow_up_contributor",
    notes: "Asked contributor to clarify KMS rotation schedule. Reply expected within 12h.",
    unresolvedIssues: 1,
    pendingDecisions: ["Read contributor response", "Continue C2 scoring"],
    draftSummary: "Mid-review. Awaiting Q&A clarification on rotation schedule.",
  },
  {
    id: "ar-7128",
    reviewId: "r-7128",
    contributor: { code: "c7128", reliability: 80 },
    task: {
      title: "Permissions matrix UI",
      project: "Acme-Helios",
      portfolio: "Admin",
      priority: "P1",
      type: "initial",
    },
    stage: "evidence_review",
    progressPct: 15,
    ageHours: 1,
    totalActiveHours: 1,
    lockedBy: "You · R. Verma",
    isMyLock: true,
    lastActivityAt: "14:00",
    isStalled: false,
    slaTier: "warning",
    slaRemainingHours: 9,
    aiConfidence: 76,
    aiConfidenceBand: "medium",
    aiCue: "Verify RBAC rules with policy doc.",
    governance: { active: false },
    blockers: [],
    nextAction: "resume_evidence",
    notes: "Just started evidence review. Need to cross-check RBAC matrix against policy spec.",
    unresolvedIssues: 0,
    pendingDecisions: ["Validate RBAC rules", "Open scoring after evidence pass"],
    draftSummary: "Early stage · no decisions yet.",
  },
  {
    id: "ar-5832",
    reviewId: "r-5832",
    contributor: { code: "c5832", reliability: 70 },
    task: {
      title: "Webhook signing key store",
      project: "Stratum-Pay",
      portfolio: "Security",
      priority: "P1",
      type: "initial",
    },
    stage: "awaiting_clarification",
    progressPct: 30,
    ageHours: 14,
    totalActiveHours: 16,
    lockedBy: "You · R. Verma",
    isMyLock: true,
    lastActivityAt: "yesterday 09:14",
    isStalled: true,
    slaTier: "warning",
    slaRemainingHours: 11,
    aiConfidence: 58,
    aiConfidenceBand: "low",
    aiCue: "Awaiting contributor reply · consider escalation if no response in 6h.",
    governance: { active: false },
    blockers: ["contributor_response"],
    nextAction: "follow_up_contributor",
    notes: "Sent clarification 14h ago. No response. Consider reminder or reassignment.",
    unresolvedIssues: 1,
    pendingDecisions: ["Send reminder", "Decide if reassignment needed"],
    draftSummary: "Stalled · clarification reply outstanding for 14h.",
  },
  {
    id: "ar-3208",
    reviewId: "r-3208",
    contributor: { code: "c3208", reliability: 74 },
    task: {
      title: "Customer export pipeline",
      project: "Helios-Vault",
      portfolio: "Privacy",
      priority: "P0",
      type: "final",
    },
    stage: "blocked",
    progressPct: 60,
    ageHours: 30,
    totalActiveHours: 36,
    lockedBy: "K. Singh",
    isMyLock: false,
    lastActivityAt: "yesterday 12:00",
    isStalled: true,
    slaTier: "breached",
    slaRemainingHours: -2,
    aiConfidence: 62,
    aiConfidenceBand: "medium",
    aiCue: "SOC2 hold blocks decision · governance ruling expected May 27.",
    governance: {
      active: true,
      kind: "compliance",
      owner: "M. Patel · Compliance",
      topic: "SOC2 evidence collection · financial-field export",
      raisedAt: "May 21 14:00",
      slaHours: 144,
      hoursRemaining: 96,
    },
    blockers: ["governance_dependency", "policy_review"],
    nextAction: "await_governance",
    notes: "Compliance review in progress. 3 of 5 artifacts gathered.",
    unresolvedIssues: 2,
    pendingDecisions: ["Reassign or hold until release", "Decide once SOC2 ruling lands"],
    draftSummary: "Blocked by compliance. Mentor R. cannot proceed until release.",
  },
];

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

export const statusBuckets: StatusBucket[] = [
  {
    key: "actively_reviewing",
    label: "Actively Reviewing",
    caption: "Scoring · feedback · finalizing",
    predicate: (r) =>
      ["scoring", "feedback", "finalizing"].includes(r.stage) && !r.isStalled,
    tone: "ok",
  },
  {
    key: "evidence_comparison",
    label: "Evidence Comparison",
    caption: "Reviewing artifacts and v↔v diffs",
    predicate: (r) => r.stage === "evidence_review",
    tone: "info",
  },
  {
    key: "awaiting_clarification",
    label: "Awaiting Clarification",
    caption: "Contributor Q&A pending",
    predicate: (r) => r.stage === "awaiting_clarification",
    tone: "neutral",
  },
  {
    key: "governance_consultation",
    label: "Governance Consultation",
    caption: "Active governance collaboration",
    predicate: (r) => r.governance.active,
    tone: "warn",
  },
  {
    key: "draft_reviews",
    label: "Draft Reviews",
    caption: "Saved drafts to resume",
    predicate: (r) => r.stage === "draft",
    tone: "info",
  },
  {
    key: "blocked",
    label: "Blocked",
    caption: "Stalled or dependency-blocked",
    predicate: (r) => r.stage === "blocked" || (r.isStalled && r.blockers.length > 0),
    tone: "danger",
  },
];

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
