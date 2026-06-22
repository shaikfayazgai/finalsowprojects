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

export const reworkOpsRows: ReworkOpsRow[] = [
  {
    id: "rwo-4821",
    reviewId: "r-4821",
    task: {
      title: "Build accessible date picker",
      project: "Acme-Helios",
      portfolio: "Enterprise Foundations",
      priority: "P0",
    },
    contributor: { code: "c4821", reliability: 87, repeatFailures: 0 },
    category: "awaiting_revision",
    state: "awaiting_revision",
    governanceSeverity: "low",
    round: 2,
    totalRounds: 3,
    raisedBy: "R. Verma",
    raisedAt: "2026-05-22 11:15",
    dueAt: "2026-05-26 18:00",
    revisionAgeHours: 51,
    slaRemainingHours: 26,
    isOverdue: false,
    contributorAck: {
      acknowledged: true,
      ackedAt: "2026-05-22 15:42",
      note: "Acknowledged. ETA Tuesday EOD for resubmission with JAWS recording.",
    },
    corrections: [
      {
        id: "ci-1",
        criterionId: "C5",
        criterionLabel: "Accessibility",
        severity: "major",
        required: true,
        description: "Focus trap missing in popover; JAWS verification not provided per spec §5.3.",
        status: "addressed",
        contributorResponse: "Will wrap popover in <FocusScope contain restoreFocus> and add JAWS test note.",
        evidenceRefs: ["spec §5.3", "src/components/DatePicker.tsx:124-132"],
      },
      {
        id: "ci-2",
        criterionId: "C3",
        criterionLabel: "Requirements adherence",
        severity: "major",
        required: true,
        description: "RTL layout offset on month dropdown — visual polish required.",
        status: "open",
        evidenceRefs: ["storybook · rtl-layout"],
      },
      {
        id: "ci-3",
        criterionId: "C4",
        criterionLabel: "Testing",
        severity: "nit",
        required: false,
        description: "Add unit test that exercises focus trap on close (escape key returns focus).",
        status: "open",
        evidenceRefs: ["spec §6.1"],
      },
    ],
    revalidationChecklist: [
      { id: "rv-1", label: "Focus trap verified", status: "pending", required: true },
      { id: "rv-2", label: "JAWS walkthrough recording", status: "pending", required: true },
      { id: "rv-3", label: "RTL screenshots provided", status: "pending", required: true },
      { id: "rv-4", label: "Unit tests updated", status: "pending", required: false },
    ],
    validationState: "not_started",
    validationProgressPct: 0,
    governanceInvolvement: { active: false },
    clarification: {
      id: "cl-rwo-1",
      status: "answered",
      raisedBy: "R. Verma",
      expectedBy: "2026-05-24 18:00",
      pauseSla: false,
      messages: [
        {
          id: "m-1",
          author: "R. Verma",
          authorRole: "mentor",
          body: "Could you walk me through your JAWS testing strategy for v3? Spec §5.3 explicitly requires it.",
          at: "2026-05-23 09:30",
        },
        {
          id: "m-2",
          author: "c4821",
          authorRole: "contributor",
          body: "Will record a JAWS pass-through on the demo route and attach it. Tested locally on Win11 + JAWS 2024.",
          at: "2026-05-23 11:14",
          attachments: [{ label: "jaws-walkthrough.mp4 (pending)", size: "—" }],
        },
      ],
    },
    priorRounds: [
      { round: 1, outcome: "failed", reviewer: "R. Verma", closedAt: "May 22 11:15", unresolvedAtClose: 2 },
    ],
    routingOnResubmit: "fresh_reviewer",
    nextAction: "send_reminder",
    timeline: [
      { id: "rwt-1", timestamp: "May 22 11:15", actor: "R. Verma", action: "Rework requested", detail: "Round 2 · 2 major + 1 nit · routing: fresh reviewer", category: "human" },
      { id: "rwt-2", timestamp: "May 22 15:42", actor: "c4821", action: "Acknowledged", detail: "ETA Tuesday EOD", category: "human" },
      { id: "rwt-3", timestamp: "May 23 09:30", actor: "R. Verma", action: "Clarification requested", detail: "JAWS test strategy", category: "human" },
      { id: "rwt-4", timestamp: "May 23 11:14", actor: "c4821", action: "Clarification answered", detail: "Will attach JAWS recording", category: "human" },
    ],
    ai: {
      summary:
        "Contributor acknowledged early and responded to clarification within 2h. Strong signal of timely resubmission.",
      confidence: 84,
      recommendation: "Monitor · no reminder needed before Monday.",
      escalationRecommended: false,
      improvementTrend: "improving",
      tags: ["acknowledged", "responsive"],
    },
  },
  {
    id: "rwo-1142",
    reviewId: "r-1142",
    task: {
      title: "Refactor billing service",
      project: "Acme-Helios",
      portfolio: "Payments",
      priority: "P0",
    },
    contributor: { code: "c1142", reliability: 71, repeatFailures: 3 },
    category: "overdue",
    state: "overdue",
    governanceSeverity: "high",
    round: 2,
    totalRounds: 3,
    raisedBy: "K. Singh",
    raisedAt: "2026-05-18 16:00",
    dueAt: "2026-05-22 18:00",
    revisionAgeHours: 130,
    slaRemainingHours: -22,
    isOverdue: true,
    contributorAck: { acknowledged: false },
    corrections: [
      {
        id: "ci-4",
        criterionId: "C3",
        criterionLabel: "Requirements adherence",
        severity: "blocker",
        required: true,
        description: "Idempotency missing on Stripe webhook retries (spec §3.1).",
        status: "open",
        evidenceRefs: ["spec §3.1", "webhook tests"],
      },
      {
        id: "ci-5",
        criterionId: "C1",
        criterionLabel: "Code quality",
        severity: "major",
        required: true,
        description: "Three utility functions duplicate a public-repo source. Replace with attributed implementation.",
        status: "open",
        evidenceRefs: ["AI plagiarism report"],
      },
    ],
    revalidationChecklist: [
      { id: "rv-10", label: "Idempotency implemented", status: "pending", required: true },
      { id: "rv-11", label: "Plagiarism resolution", status: "pending", required: true },
      { id: "rv-12", label: "Coverage ≥ 80%", status: "pending", required: true },
    ],
    validationState: "not_started",
    validationProgressPct: 0,
    governanceInvolvement: {
      active: true,
      kind: "policy",
      owner: "Conduct review · Rajesh V.",
      detail: "Plagiarism finding under conduct review.",
    },
    priorRounds: [
      { round: 1, outcome: "failed", reviewer: "K. Singh", closedAt: "May 18 16:00", unresolvedAtClose: 2 },
    ],
    routingOnResubmit: "same_reviewer",
    nextAction: "escalate",
    timeline: [
      { id: "rwt-10", timestamp: "May 18 16:00", actor: "K. Singh", action: "Rework requested", detail: "Round 2 · 1 blocker + 1 major", category: "human" },
      { id: "rwt-11", timestamp: "May 22 18:00", actor: "System", action: "SLA breached", detail: "Deadline passed without ack", category: "system" },
      { id: "rwt-12", timestamp: "May 23 09:42", actor: "AI v3.2", action: "Escalation recommended", detail: "Repeat failure + overdue + plagiarism", category: "ai" },
    ],
    ai: {
      summary:
        "Contributor has 3 repeat-failure rounds in 30 days with no acknowledgment on this rework. Plagiarism finding compounds risk.",
      confidence: 89,
      recommendation: "Escalate immediately · consider conduct ruling.",
      escalationRecommended: true,
      improvementTrend: "declining",
      tags: ["overdue", "repeat-failure", "plagiarism"],
    },
  },
  {
    id: "rwo-6710",
    reviewId: "r-6710",
    task: {
      title: "Stripe webhook handler",
      project: "Acme-Helios",
      portfolio: "Payments",
      priority: "P1",
    },
    contributor: { code: "c6710", reliability: 92, repeatFailures: 0 },
    category: "revision_submitted",
    state: "revision_submitted",
    governanceSeverity: "low",
    round: 1,
    totalRounds: 3,
    raisedBy: "L. Mehta",
    raisedAt: "2026-05-21 09:00",
    dueAt: "2026-05-24 18:00",
    revisionAgeHours: 55,
    slaRemainingHours: 8,
    isOverdue: false,
    contributorAck: { acknowledged: true, ackedAt: "2026-05-21 10:14" },
    corrections: [
      {
        id: "ci-7",
        criterionId: "C4",
        criterionLabel: "Testing",
        severity: "major",
        required: true,
        description: "Coverage at 62% — threshold is 80%. Cover retry + error paths.",
        status: "addressed",
        contributorResponse: "Added 14 new tests · coverage 86%.",
        evidenceRefs: ["coverage-report-v2.json"],
      },
    ],
    revalidationChecklist: [
      { id: "rv-20", label: "Coverage ≥ 80%", status: "verified", evidenceRef: "coverage-report-v2.json", required: true },
      { id: "rv-21", label: "Retry path tests", status: "verified", evidenceRef: "retry-tests.spec.ts", required: true },
      { id: "rv-22", label: "Error path tests", status: "pending", required: true },
    ],
    validationState: "in_progress",
    validationProgressPct: 66,
    governanceInvolvement: { active: false },
    priorRounds: [
      { round: 0, outcome: "passed", reviewer: "L. Mehta", closedAt: "May 21 09:00", unresolvedAtClose: 1 },
    ],
    routingOnResubmit: "fresh_reviewer",
    nextAction: "continue_revalidation",
    timeline: [
      { id: "rwt-20", timestamp: "May 21 09:00", actor: "L. Mehta", action: "Rework requested", detail: "1 major · testing coverage", category: "human" },
      { id: "rwt-21", timestamp: "May 23 14:08", actor: "c6710", action: "Revision submitted", detail: "v2 uploaded · coverage 86%", category: "human" },
      { id: "rwt-22", timestamp: "May 23 14:30", actor: "L. Mehta", action: "Revalidation started", detail: "2 of 3 checks verified", category: "human" },
    ],
    ai: {
      summary:
        "Resubmission addresses the failed criterion · coverage rose from 62% → 86%. Error-path tests partially present.",
      confidence: 88,
      recommendation: "Verify error-path coverage and pass.",
      escalationRecommended: false,
      improvementTrend: "improving",
      tags: ["responsive", "ai-friendly"],
    },
  },
  {
    id: "rwo-5520",
    reviewId: "r-5520",
    task: {
      title: "PII redaction module",
      project: "Helios-Vault",
      portfolio: "Privacy",
      priority: "P0",
    },
    contributor: { code: "c5520", reliability: 79, repeatFailures: 0 },
    category: "mentor_revalidating",
    state: "mentor_revalidating",
    governanceSeverity: "medium",
    round: 1,
    totalRounds: 3,
    raisedBy: "R. Verma",
    raisedAt: "2026-05-20 14:00",
    dueAt: "2026-05-24 18:00",
    revisionAgeHours: 76,
    slaRemainingHours: 6,
    isOverdue: false,
    contributorAck: { acknowledged: true, ackedAt: "2026-05-20 16:30" },
    corrections: [
      {
        id: "ci-9",
        criterionId: "C5",
        criterionLabel: "Compliance",
        severity: "major",
        required: true,
        description: "Pseudonymization key rotation missing per spec §7.2.",
        status: "addressed",
        contributorResponse: "Implemented · rotates every 30 days · KMS-backed.",
        evidenceRefs: ["module/redactor.ts", "kms-config.yaml"],
        mentorVerdict: "pass",
        mentorNote: "Verified · KMS rotation cycle matches spec.",
      },
    ],
    revalidationChecklist: [
      { id: "rv-30", label: "Key rotation implemented", status: "verified", evidenceRef: "redactor.ts:108-142", required: true },
      { id: "rv-31", label: "KMS integration", status: "verified", evidenceRef: "kms-config.yaml", required: true },
      { id: "rv-32", label: "Audit log present", status: "pending", required: true },
    ],
    validationState: "in_progress",
    validationProgressPct: 66,
    governanceInvolvement: {
      active: true,
      kind: "legal",
      owner: "J. Khan · Legal officer",
      detail: "Awaiting legal release on data sensitivity classification.",
    },
    priorRounds: [
      { round: 0, outcome: "passed", reviewer: "R. Verma", closedAt: "May 20 14:00", unresolvedAtClose: 1 },
    ],
    routingOnResubmit: "same_reviewer",
    nextAction: "verify_resubmission",
    timeline: [
      { id: "rwt-30", timestamp: "May 20 14:00", actor: "R. Verma", action: "Rework requested", detail: "1 major · compliance gap", category: "human" },
      { id: "rwt-31", timestamp: "May 23 11:50", actor: "c5520", action: "Revision submitted", detail: "v2 uploaded · KMS rotation added", category: "human" },
      { id: "rwt-32", timestamp: "May 23 12:50", actor: "J. Khan", action: "Governance hold placed", detail: "Pending legal review", category: "governance" },
    ],
    ai: {
      summary:
        "Correction comprehensive. Final blocker is legal hold release, not the contributor's work.",
      confidence: 91,
      recommendation: "Verify audit log then queue for legal release.",
      escalationRecommended: false,
      improvementTrend: "improving",
      tags: ["legal-hold", "near-complete"],
    },
  },
  {
    id: "rwo-7715",
    reviewId: "r-7715",
    task: {
      title: "Search relevance ranker",
      project: "BetaCo",
      portfolio: "Discovery",
      priority: "P0",
    },
    contributor: { code: "c7715", reliability: 58, repeatFailures: 4 },
    category: "validated_fail",
    state: "validated_fail",
    governanceSeverity: "high",
    round: 2,
    totalRounds: 3,
    raisedBy: "L. Mehta",
    raisedAt: "2026-05-19 10:00",
    dueAt: "2026-05-22 18:00",
    revisionAgeHours: 100,
    slaRemainingHours: -30,
    isOverdue: true,
    contributorAck: { acknowledged: true, ackedAt: "2026-05-19 11:30" },
    corrections: [
      {
        id: "ci-10",
        criterionId: "C3",
        criterionLabel: "Requirements adherence",
        severity: "major",
        required: true,
        description: "Offline-evaluation harness missing.",
        status: "rejected",
        contributorResponse: "Added eval-harness.py but uses local data, not SOW dataset.",
        evidenceRefs: ["spec §4 metrics"],
        mentorVerdict: "fail",
        mentorNote: "Eval data does not match SOW §4 metrics; revalidation failed.",
      },
      {
        id: "ci-11",
        criterionId: "C4",
        criterionLabel: "Testing",
        severity: "major",
        required: true,
        description: "Latency benchmark on production traffic.",
        status: "open",
        evidenceRefs: ["perf-targets.md"],
      },
    ],
    revalidationChecklist: [
      { id: "rv-40", label: "Eval harness matches SOW §4", status: "failed", required: true },
      { id: "rv-41", label: "Latency benchmark present", status: "failed", required: true },
      { id: "rv-42", label: "Coverage report attached", status: "verified", evidenceRef: "coverage-v2.json", required: true },
    ],
    validationState: "complete_fail",
    validationProgressPct: 100,
    governanceInvolvement: { active: false },
    priorRounds: [
      { round: 0, outcome: "passed", reviewer: "L. Mehta", closedAt: "May 19 10:00", unresolvedAtClose: 2 },
      { round: 1, outcome: "failed", reviewer: "L. Mehta", closedAt: "May 21 14:00", unresolvedAtClose: 2 },
    ],
    routingOnResubmit: "fresh_reviewer",
    nextAction: "request_another_round",
    timeline: [
      { id: "rwt-40", timestamp: "May 19 10:00", actor: "L. Mehta", action: "Rework requested", detail: "Round 1 · 2 major", category: "human" },
      { id: "rwt-41", timestamp: "May 21 14:00", actor: "L. Mehta", action: "Revalidation failed", detail: "Eval harness incorrect", category: "human" },
      { id: "rwt-42", timestamp: "May 22 09:00", actor: "L. Mehta", action: "Rework requested", detail: "Round 2 · 2 major persists", category: "human" },
    ],
    ai: {
      summary:
        "Contributor's correction pattern is superficial. Same criteria failing across rounds 1 and 2. Round 3 likely to auto-escalate.",
      confidence: 86,
      recommendation: "Escalate now or apply tighter coaching before round 3.",
      escalationRecommended: true,
      improvementTrend: "declining",
      tags: ["repeat-failure", "round-3-risk"],
    },
  },
  {
    id: "rwo-9301",
    reviewId: "r-9301",
    task: {
      title: "Feature flag SDK",
      project: "Acme-Helios",
      portfolio: "Platform",
      priority: "P1",
    },
    contributor: { code: "c9301", reliability: 88, repeatFailures: 0, new: true },
    category: "validated_pass",
    state: "validated_pass",
    governanceSeverity: "low",
    round: 1,
    totalRounds: 3,
    raisedBy: "K. Singh",
    raisedAt: "2026-05-20 09:00",
    dueAt: "2026-05-23 18:00",
    revisionAgeHours: 81,
    slaRemainingHours: 0,
    isOverdue: false,
    contributorAck: { acknowledged: true, ackedAt: "2026-05-20 10:00" },
    corrections: [
      {
        id: "ci-12",
        criterionId: "C2",
        criterionLabel: "Completeness",
        severity: "major",
        required: true,
        description: "Evaluation API timeouts missing.",
        status: "addressed",
        contributorResponse: "Added 250ms default timeout · configurable per SDK init.",
        evidenceRefs: ["sdk-init.ts", "tests/timeout.spec.ts"],
        mentorVerdict: "pass",
        mentorNote: "Verified · default timeout matches platform conventions.",
      },
    ],
    revalidationChecklist: [
      { id: "rv-50", label: "Timeout default verified", status: "verified", evidenceRef: "sdk-init.ts:42", required: true },
      { id: "rv-51", label: "Timeout config docs", status: "verified", evidenceRef: "README.md", required: true },
      { id: "rv-52", label: "Tests cover timeout", status: "verified", evidenceRef: "timeout.spec.ts", required: true },
    ],
    validationState: "complete_pass",
    validationProgressPct: 100,
    governanceInvolvement: { active: false },
    priorRounds: [
      { round: 0, outcome: "passed", reviewer: "K. Singh", closedAt: "May 20 09:00", unresolvedAtClose: 1 },
    ],
    routingOnResubmit: "same_reviewer",
    nextAction: "close_passed",
    timeline: [
      { id: "rwt-50", timestamp: "May 20 09:00", actor: "K. Singh", action: "Rework requested", detail: "1 major · timeout config", category: "human" },
      { id: "rwt-51", timestamp: "May 23 12:00", actor: "c9301", action: "Revision submitted", detail: "v2 with timeouts", category: "human" },
      { id: "rwt-52", timestamp: "May 23 13:42", actor: "K. Singh", action: "Revalidation passed", detail: "All 3 checks verified", category: "human" },
    ],
    ai: {
      summary:
        "Clean correction by a new contributor. Ready to close pass.",
      confidence: 94,
      recommendation: "Close passed.",
      escalationRecommended: false,
      improvementTrend: "improving",
      tags: ["clean-pass", "new-contributor"],
    },
  },
  {
    id: "rwo-3417",
    reviewId: "r-3417",
    task: {
      title: "Onboarding wizard rebuild",
      project: "Stratum-Pay",
      portfolio: "Onboarding",
      priority: "P2",
    },
    contributor: { code: "c3417", reliability: 66, repeatFailures: 2, new: true },
    category: "awaiting_revision",
    state: "awaiting_revision",
    governanceSeverity: "medium",
    round: 1,
    totalRounds: 3,
    raisedBy: "R. Verma",
    raisedAt: "2026-05-22 16:00",
    dueAt: "2026-05-26 18:00",
    revisionAgeHours: 22,
    slaRemainingHours: 27,
    isOverdue: false,
    contributorAck: { acknowledged: false },
    corrections: [
      {
        id: "ci-13",
        criterionId: "C4",
        criterionLabel: "Testing",
        severity: "major",
        required: true,
        description: "Form validation tests missing for invalid input cases.",
        status: "open",
        evidenceRefs: ["spec §6"],
      },
    ],
    revalidationChecklist: [
      { id: "rv-60", label: "Validation tests added", status: "pending", required: true },
    ],
    validationState: "not_started",
    validationProgressPct: 0,
    governanceInvolvement: { active: false },
    priorRounds: [],
    routingOnResubmit: "same_reviewer",
    nextAction: "send_reminder",
    timeline: [
      { id: "rwt-60", timestamp: "May 22 16:00", actor: "R. Verma", action: "Rework requested", detail: "1 major · validation tests", category: "human" },
    ],
    ai: {
      summary:
        "New contributor with 2 prior failures. No ack within first 22h; reminder recommended to avoid stalling.",
      confidence: 78,
      recommendation: "Send a gentle reminder · share validation-test pattern doc.",
      escalationRecommended: false,
      improvementTrend: "flat",
      tags: ["new-contributor", "no-ack"],
    },
  },
  {
    id: "rwo-6620",
    reviewId: "r-6620",
    task: {
      title: "Notification queue v2",
      project: "Atlas-Insights",
      portfolio: "Platform",
      priority: "P1",
    },
    contributor: { code: "c6620", reliability: 53, repeatFailures: 5 },
    category: "validated_fail",
    state: "validated_fail",
    governanceSeverity: "high",
    round: 3,
    totalRounds: 3,
    raisedBy: "L. Mehta",
    raisedAt: "2026-05-20 12:00",
    dueAt: "2026-05-23 18:00",
    revisionAgeHours: 78,
    slaRemainingHours: 0,
    isOverdue: true,
    contributorAck: { acknowledged: true, ackedAt: "2026-05-20 12:30" },
    corrections: [
      {
        id: "ci-14",
        criterionId: "C3",
        criterionLabel: "Requirements adherence",
        severity: "blocker",
        required: true,
        description: "Queue durability under failover missing.",
        status: "rejected",
        contributorResponse: "Submitted retry policy v2 — but does not address durability per SOW.",
        evidenceRefs: ["SOW §3.4"],
        mentorVerdict: "fail",
        mentorNote: "Round 3 failure · contributor not addressing the actual requirement.",
      },
    ],
    revalidationChecklist: [
      { id: "rv-70", label: "Failover durability", status: "failed", required: true },
    ],
    validationState: "complete_fail",
    validationProgressPct: 100,
    governanceInvolvement: {
      active: true,
      kind: "policy",
      owner: "Rajesh V.",
      detail: "Automation signature flagged; conduct council scheduled.",
    },
    priorRounds: [
      { round: 1, outcome: "failed", reviewer: "L. Mehta", closedAt: "May 18 12:00", unresolvedAtClose: 1 },
      { round: 2, outcome: "failed", reviewer: "L. Mehta", closedAt: "May 20 12:00", unresolvedAtClose: 1 },
    ],
    routingOnResubmit: "fresh_reviewer",
    nextAction: "escalate",
    timeline: [
      { id: "rwt-70", timestamp: "May 20 12:00", actor: "L. Mehta", action: "Rework requested · round 3", detail: "Persistent durability gap", category: "human" },
      { id: "rwt-71", timestamp: "May 22 18:00", actor: "AI v3.2", action: "Automation signature flagged", detail: "Rapid resubmit pattern", category: "ai" },
      { id: "rwt-72", timestamp: "May 23 14:00", actor: "L. Mehta", action: "Revalidation failed", detail: "Round 3 failure · auto-escalating", category: "human" },
    ],
    ai: {
      summary:
        "Round 3 failure on a P1 item. Contributor reliability dropped 15 points in 7 days. Automation signature compounds escalation justification.",
      confidence: 92,
      recommendation: "Auto-escalate now · conduct council ruling.",
      escalationRecommended: true,
      improvementTrend: "declining",
      tags: ["round-3-failure", "automation", "repeat-failure"],
    },
  },
];

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

export const repeatFailureSignals: RepeatFailureSignal[] = [
  {
    contributorCode: "c1142",
    reliability: 71,
    reliabilityTrend: -8,
    reworkLast30d: 4,
    failedRevalidations30d: 3,
    unresolvedPatterns: ["idempotency", "plagiarism"],
    escalationsTriggered: 2,
  },
  {
    contributorCode: "c7715",
    reliability: 58,
    reliabilityTrend: -12,
    reworkLast30d: 5,
    failedRevalidations30d: 4,
    unresolvedPatterns: ["spec misinterpretation", "low coverage"],
    escalationsTriggered: 2,
  },
  {
    contributorCode: "c6620",
    reliability: 53,
    reliabilityTrend: -15,
    reworkLast30d: 6,
    failedRevalidations30d: 5,
    unresolvedPatterns: ["durability", "rapid resubmit"],
    escalationsTriggered: 3,
  },
  {
    contributorCode: "c3417",
    reliability: 66,
    reliabilityTrend: -4,
    reworkLast30d: 2,
    failedRevalidations30d: 2,
    unresolvedPatterns: ["validation tests"],
    escalationsTriggered: 0,
  },
];

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

export const reworkAiAggregates: ReworkAiAggregate[] = [
  {
    id: "rai-1",
    title: "Round-3 escalation forecast",
    summary:
      "Two rework items will auto-escalate at round 3 within 48h (rwo-7715, rwo-6620). Both contributors show declining reliability.",
    recommendation: "Escalate proactively · save 48h of cycle time.",
    confidence: 89,
    affects: ["rwo-7715", "rwo-6620"],
    kind: "escalation_forecast",
    generatedAt: "14:08",
  },
  {
    id: "rai-2",
    title: "Repeat pattern · spec misinterpretation",
    summary:
      "Three contributors (c1142, c7715, c6620) show repeated spec-misinterpretation patterns across the last 7 days.",
    recommendation: "Schedule targeted spec-reading coaching session.",
    confidence: 82,
    affects: ["rwo-1142", "rwo-7715", "rwo-6620"],
    kind: "repeat_pattern",
    generatedAt: "12:42",
  },
  {
    id: "rai-3",
    title: "Coaching opportunity · c3417",
    summary:
      "New contributor c3417 missed validation tests on first rework. Standard onboarding gap; coaching likely sufficient.",
    recommendation: "Share validation-test pattern doc with reminder.",
    confidence: 76,
    affects: ["rwo-3417"],
    kind: "coaching_opportunity",
    generatedAt: "11:24",
  },
  {
    id: "rai-4",
    title: "Improvement trend · c4821",
    summary:
      "Contributor c4821 is on an improving trajectory. v2 addressed v1 issues and proactively answered clarification.",
    confidence: 84,
    affects: ["rwo-4821"],
    kind: "improvement_trend",
    generatedAt: "10:18",
  },
  {
    id: "rai-5",
    title: "Anomaly cluster · automation signatures",
    summary:
      "Rapid-resubmit pattern detected on rwo-6620; cadence < 8 min between feedback and resubmit on 4 occasions.",
    recommendation: "Require live demo before next rework round.",
    confidence: 81,
    affects: ["rwo-6620"],
    kind: "anomaly_cluster",
    generatedAt: "09:42",
  },
];

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
