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

export const pendingReviewQueue: PendingReviewRow[] = [
  {
    id: "r-1142",
    contributor: { code: "c1142", name: "Refactor billing service", reliability: 71, repeatFailure: true },
    task: {
      title: "Refactor billing service",
      description: "Stripe webhook adapter rewrite for idempotency + retries",
      project: "Acme-Helios",
      portfolio: "Enterprise Foundations",
      priority: "P0",
      skills: ["Node", "Stripe"],
      type: "rework",
      round: 2,
      totalRounds: 3,
    },
    submissionAgeHours: r(32),
    slaRemainingHours: r(-8),
    slaTier: "breached",
    riskSeverity: "high",
    reviewState: "escalated",
    aiConfidence: 78,
    aiConfidenceBand: "medium",
    aiPriorityRank: 1,
    aiRecommendation: "Pick up first · escalation in progress · plagiarism flag unresolved.",
    flags: ["plagiarism", "round-2"],
    complexity: "critical",
    estReviewMinutes: 75,
    clarificationPending: false,
    governance: { holds: 0, policyWarnings: 1, repeatFailure: true },
    evidenceCompleteness: 70,
  },
  {
    id: "r-4821",
    contributor: { code: "c4821", name: "Date picker A11y", reliability: 87 },
    task: {
      title: "Build accessible date picker",
      description: "WCAG 2.2 AA, keyboard nav, JAWS verification",
      project: "Acme-Helios",
      portfolio: "Enterprise Foundations",
      priority: "P0",
      skills: ["React", "A11y", "Tailwind"],
      type: "rework",
      round: 2,
      totalRounds: 3,
    },
    submissionAgeHours: r(22),
    slaRemainingHours: r(2),
    slaTier: "critical",
    riskSeverity: "low",
    reviewState: "ai_ready",
    aiConfidence: 94,
    aiConfidenceBand: "high",
    aiPriorityRank: 2,
    aiRecommendation: "AI quick-confirm candidate · evidence complete · clean flags.",
    flags: ["ai-ready"],
    complexity: "low",
    estReviewMinutes: 12,
    clarificationPending: false,
    governance: { holds: 0, policyWarnings: 1 },
    evidenceCompleteness: 95,
  },
  {
    id: "r-3902",
    contributor: { code: "c5102", name: "Auth modal redesign", reliability: 64, repeatFailure: true },
    task: {
      title: "Auth modal redesign",
      description: "Session-timeout behavior · step-up auth",
      project: "BetaCo",
      portfolio: "Identity",
      priority: "P1",
      skills: ["React", "Auth"],
      type: "rework",
      round: 3,
      totalRounds: 3,
    },
    submissionAgeHours: r(28),
    slaRemainingHours: r(3),
    slaTier: "critical",
    riskSeverity: "high",
    reviewState: "escalated",
    aiConfidence: 41,
    aiConfidenceBand: "low",
    aiPriorityRank: 3,
    aiRecommendation: "Spec dispute open · do not decide before mentor ruling.",
    flags: ["spec-ambiguity", "round-3"],
    complexity: "critical",
    estReviewMinutes: 90,
    clarificationPending: true,
    governance: { holds: 0, policyWarnings: 1 },
    evidenceCompleteness: 82,
  },
  {
    id: "r-7715",
    contributor: { code: "c7715", name: "Search ranker", reliability: 58, repeatFailure: true },
    task: {
      title: "Search relevance ranker",
      description: "Offline evaluation harness + ranker tuning",
      project: "BetaCo",
      portfolio: "Discovery",
      priority: "P0",
      skills: ["ML", "Python"],
      type: "rework",
      round: 2,
      totalRounds: 3,
    },
    submissionAgeHours: r(19),
    slaRemainingHours: r(1),
    slaTier: "critical",
    riskSeverity: "high",
    reviewState: "in_progress",
    aiConfidence: 54,
    aiConfidenceBand: "low",
    aiPriorityRank: 4,
    aiRecommendation: "Low-reliability + low-confidence · deep review + flag check needed.",
    flags: ["low-reliability", "round-2"],
    complexity: "high",
    estReviewMinutes: 65,
    clarificationPending: false,
    governance: { holds: 0, policyWarnings: 0 },
    evidenceCompleteness: 64,
  },
  {
    id: "r-5520",
    contributor: { code: "c5520", name: "PII redaction module", reliability: 79 },
    task: {
      title: "PII redaction module",
      description: "Pseudonymization key rotation · GDPR scope",
      project: "Helios-Vault",
      portfolio: "Privacy",
      priority: "P0",
      skills: ["Privacy", "Crypto"],
      type: "final",
    },
    submissionAgeHours: r(14),
    slaRemainingHours: r(12),
    slaTier: "warning",
    riskSeverity: "medium",
    reviewState: "governance_hold",
    aiConfidence: 72,
    aiConfidenceBand: "medium",
    aiRecommendation: "Legal hold active · cannot decide until released.",
    flags: ["legal-hold"],
    complexity: "high",
    estReviewMinutes: 55,
    governance: { holds: 1, policyWarnings: 0 },
    evidenceCompleteness: 88,
  },
  {
    id: "r-6710",
    contributor: { code: "c6710", name: "Stripe webhook handler", reliability: 92 },
    task: {
      title: "Stripe webhook handler",
      description: "Retry + idempotency",
      project: "Acme-Helios",
      portfolio: "Payments",
      priority: "P1",
      skills: ["Node", "Stripe"],
      type: "initial",
    },
    submissionAgeHours: r(9),
    slaRemainingHours: r(6),
    slaTier: "warning",
    riskSeverity: "low",
    reviewState: "pending",
    aiConfidence: 88,
    aiConfidenceBand: "high",
    aiRecommendation: "AI quick-confirm eligible · 86% test coverage.",
    flags: ["ai-ready"],
    complexity: "low",
    estReviewMinutes: 15,
    governance: { holds: 0, policyWarnings: 0 },
    evidenceCompleteness: 92,
  },
  {
    id: "r-8044",
    contributor: { code: "c8044", name: "Analytics SQL schema", reliability: 81 },
    task: {
      title: "Analytics SQL schema",
      description: "Star-schema design · denormalization rules",
      project: "BetaCo",
      portfolio: "Analytics",
      priority: "P2",
      skills: ["SQL", "Data modelling"],
      type: "initial",
    },
    submissionAgeHours: r(6),
    slaRemainingHours: r(18),
    slaTier: "watch",
    riskSeverity: "low",
    reviewState: "in_progress",
    aiConfidence: 86,
    aiConfidenceBand: "high",
    aiRecommendation: "Straightforward review · light governance footprint.",
    flags: [],
    complexity: "medium",
    estReviewMinutes: 25,
    governance: { holds: 0, policyWarnings: 0 },
    evidenceCompleteness: 86,
  },
  {
    id: "r-9301",
    contributor: { code: "c9301", name: "Feature flag SDK", reliability: 88, new: true },
    task: {
      title: "Feature flag SDK",
      description: "Client SDK · evaluation API",
      project: "Acme-Helios",
      portfolio: "Platform",
      priority: "P1",
      skills: ["TypeScript", "SDK"],
      type: "initial",
      round: 1,
    },
    submissionAgeHours: r(4),
    slaRemainingHours: r(20),
    slaTier: "healthy",
    riskSeverity: "low",
    reviewState: "pending",
    aiConfidence: 91,
    aiConfidenceBand: "high",
    aiRecommendation: "AI quick-confirm · clean evidence · no flags.",
    flags: ["ai-ready", "new-contributor"],
    complexity: "medium",
    estReviewMinutes: 22,
    governance: { holds: 0, policyWarnings: 0 },
    evidenceCompleteness: 90,
  },
  {
    id: "r-4480",
    contributor: { code: "c4480", name: "Auth tokens rotation", reliability: 76 },
    task: {
      title: "Auth tokens rotation script",
      description: "Token-issuance rotation · KMS",
      project: "Acme-Helios",
      portfolio: "Security",
      priority: "P1",
      skills: ["Node", "Security"],
      type: "final",
    },
    submissionAgeHours: r(11),
    slaRemainingHours: r(16),
    slaTier: "watch",
    riskSeverity: "high",
    reviewState: "governance_hold",
    aiConfidence: 67,
    aiConfidenceBand: "medium",
    aiRecommendation: "Security hold · awaiting review by T. Rao.",
    flags: ["security-hold"],
    complexity: "high",
    estReviewMinutes: 55,
    governance: { holds: 1, policyWarnings: 0 },
    evidenceCompleteness: 78,
  },
  {
    id: "r-3208",
    contributor: { code: "c3208", name: "Customer export pipeline", reliability: 74 },
    task: {
      title: "Customer export pipeline",
      description: "Export route ingests financial fields",
      project: "Helios-Vault",
      portfolio: "Privacy",
      priority: "P0",
      skills: ["Data", "ETL"],
      type: "final",
    },
    submissionAgeHours: r(50),
    slaRemainingHours: r(-2),
    slaTier: "breached",
    riskSeverity: "high",
    reviewState: "governance_hold",
    aiConfidence: 62,
    aiConfidenceBand: "medium",
    aiRecommendation: "SOC2 hold · escalation considered if hold drags past 7 days.",
    flags: ["soc2-hold"],
    complexity: "critical",
    estReviewMinutes: 70,
    governance: { holds: 1, policyWarnings: 1 },
    evidenceCompleteness: 80,
  },
  {
    id: "r-2114",
    contributor: { code: "c2114", name: "Mobile push notifications", reliability: 84 },
    task: {
      title: "Mobile push notifications",
      description: "FCM + APNS adapter",
      project: "Atlas-Insights",
      portfolio: "Mobile",
      priority: "P1",
      skills: ["Mobile", "FCM"],
      type: "initial",
    },
    submissionAgeHours: r(7),
    slaRemainingHours: r(17),
    slaTier: "watch",
    riskSeverity: "low",
    reviewState: "pending",
    aiConfidence: 84,
    aiConfidenceBand: "high",
    aiRecommendation: "Routine review · no flags.",
    flags: [],
    complexity: "medium",
    estReviewMinutes: 25,
    governance: { holds: 0, policyWarnings: 0 },
    evidenceCompleteness: 84,
  },
  {
    id: "r-2516",
    contributor: { code: "c2516", name: "Dashboard charting", reliability: 89 },
    task: {
      title: "Dashboard charting library",
      description: "Custom Recharts theme + accessibility",
      project: "Atlas-Insights",
      portfolio: "Analytics",
      priority: "P2",
      skills: ["React", "Charts"],
      type: "initial",
    },
    submissionAgeHours: r(3),
    slaRemainingHours: r(20),
    slaTier: "healthy",
    riskSeverity: "low",
    reviewState: "pending",
    aiConfidence: 89,
    aiConfidenceBand: "high",
    aiRecommendation: "AI ready · clean evidence.",
    flags: ["ai-ready"],
    complexity: "low",
    estReviewMinutes: 18,
    governance: { holds: 0, policyWarnings: 0 },
    evidenceCompleteness: 91,
  },
  {
    id: "r-3417",
    contributor: { code: "c3417", name: "Onboarding flow", reliability: 66, new: true },
    task: {
      title: "Onboarding wizard rebuild",
      description: "Multi-step form · client validation",
      project: "Stratum-Pay",
      portfolio: "Onboarding",
      priority: "P2",
      skills: ["React", "Forms"],
      type: "initial",
    },
    submissionAgeHours: r(10),
    slaRemainingHours: r(13),
    slaTier: "watch",
    riskSeverity: "medium",
    reviewState: "pending",
    aiConfidence: 71,
    aiConfidenceBand: "medium",
    aiRecommendation: "Coverage gaps in validation tests · request more evidence.",
    flags: ["new-contributor"],
    complexity: "medium",
    estReviewMinutes: 30,
    clarificationPending: true,
    governance: { holds: 0, policyWarnings: 0 },
    evidenceCompleteness: 71,
  },
  {
    id: "r-4019",
    contributor: { code: "c4019", name: "Search index migration", reliability: 91 },
    task: {
      title: "Search index migration v2",
      description: "Elasticsearch 8 upgrade · index aliases",
      project: "BetaCo",
      portfolio: "Discovery",
      priority: "P1",
      skills: ["ES", "DevOps"],
      type: "final",
    },
    submissionAgeHours: r(17),
    slaRemainingHours: r(7),
    slaTier: "warning",
    riskSeverity: "low",
    reviewState: "pending",
    aiConfidence: 82,
    aiConfidenceBand: "high",
    aiRecommendation: "Routine · final acceptance step.",
    flags: [],
    complexity: "medium",
    estReviewMinutes: 28,
    governance: { holds: 0, policyWarnings: 0 },
    evidenceCompleteness: 88,
  },
  {
    id: "r-5832",
    contributor: { code: "c5832", name: "Webhook signing keys", reliability: 70 },
    task: {
      title: "Webhook signing key store",
      description: "Rotation + revocation flow",
      project: "Stratum-Pay",
      portfolio: "Security",
      priority: "P1",
      skills: ["Security"],
      type: "initial",
    },
    submissionAgeHours: r(12),
    slaRemainingHours: r(11),
    slaTier: "warning",
    riskSeverity: "high",
    reviewState: "pending",
    aiConfidence: 58,
    aiConfidenceBand: "low",
    aiRecommendation: "Low confidence · security-sensitive · request live demo.",
    flags: ["low-conf"],
    complexity: "high",
    estReviewMinutes: 60,
    clarificationPending: true,
    governance: { holds: 0, policyWarnings: 1 },
    evidenceCompleteness: 62,
  },
  {
    id: "r-6014",
    contributor: { code: "c6014", name: "Email templating engine", reliability: 83 },
    task: {
      title: "Email templating engine",
      description: "MJML pipeline + preview",
      project: "Stratum-Pay",
      portfolio: "Comms",
      priority: "P2",
      skills: ["MJML", "Email"],
      type: "initial",
    },
    submissionAgeHours: r(5),
    slaRemainingHours: r(19),
    slaTier: "healthy",
    riskSeverity: "low",
    reviewState: "pending",
    aiConfidence: 90,
    aiConfidenceBand: "high",
    aiRecommendation: "AI ready · clean evidence · light scope.",
    flags: ["ai-ready"],
    complexity: "low",
    estReviewMinutes: 14,
    governance: { holds: 0, policyWarnings: 0 },
    evidenceCompleteness: 93,
  },
  {
    id: "r-7128",
    contributor: { code: "c7128", name: "Permissions matrix", reliability: 80 },
    task: {
      title: "Permissions matrix UI",
      description: "Role/permission grid",
      project: "Acme-Helios",
      portfolio: "Admin",
      priority: "P1",
      skills: ["React", "RBAC"],
      type: "initial",
    },
    submissionAgeHours: r(13),
    slaRemainingHours: r(9),
    slaTier: "warning",
    riskSeverity: "medium",
    reviewState: "pending",
    aiConfidence: 76,
    aiConfidenceBand: "medium",
    aiRecommendation: "Verify RBAC rules with policy doc · medium complexity.",
    flags: [],
    complexity: "medium",
    estReviewMinutes: 35,
    governance: { holds: 0, policyWarnings: 1 },
    evidenceCompleteness: 80,
  },
  {
    id: "r-8290",
    contributor: { code: "c8290", name: "Background jobs runner", reliability: 87 },
    task: {
      title: "Background jobs runner",
      description: "Queue + worker pool · retries",
      project: "Atlas-Insights",
      portfolio: "Platform",
      priority: "P1",
      skills: ["Node", "Queues"],
      type: "initial",
    },
    submissionAgeHours: r(8),
    slaRemainingHours: r(15),
    slaTier: "watch",
    riskSeverity: "low",
    reviewState: "pending",
    aiConfidence: 87,
    aiConfidenceBand: "high",
    aiRecommendation: "AI ready · proceed.",
    flags: ["ai-ready"],
    complexity: "medium",
    estReviewMinutes: 22,
    governance: { holds: 0, policyWarnings: 0 },
    evidenceCompleteness: 89,
  },
];

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

export const triageBuckets: TriageBucket[] = [
  {
    key: "sla_critical",
    label: "SLA Critical",
    caption: "Breached or ≤ 2h remaining",
    predicate: (r) => r.slaTier === "breached" || r.slaTier === "critical",
    tone: "danger",
  },
  {
    key: "governance_risk",
    label: "Governance Risk",
    caption: "Holds, repeats, policy warnings",
    predicate: (r) =>
      r.governance.holds > 0 ||
      r.governance.policyWarnings > 0 ||
      !!r.governance.repeatFailure,
    tone: "warn",
  },
  {
    key: "ai_flagged",
    label: "AI Flagged",
    caption: "Plagiarism · timing · anomaly",
    predicate: (r) =>
      r.flags.some((f) =>
        ["plagiarism", "timing", "anomaly", "low-conf"].includes(f)
      ) || r.aiConfidenceBand === "low",
    tone: "danger",
  },
  {
    key: "high_complexity",
    label: "High Complexity",
    caption: "≥ 45m estimated review time",
    predicate: (r) =>
      r.complexity === "high" || r.complexity === "critical" || r.estReviewMinutes >= 45,
    tone: "warn",
  },
  {
    key: "immediate",
    label: "Awaiting Immediate Review",
    caption: "AI ready · clean evidence",
    predicate: (r) => r.reviewState === "ai_ready" || r.flags.includes("ai-ready"),
    tone: "info",
  },
  {
    key: "clarification",
    label: "Clarification Needed",
    caption: "Awaiting contributor response",
    predicate: (r) => !!r.clarificationPending,
    tone: "neutral",
  },
];

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
