/**
 * Mentor Workspace V2 — operational mock data.
 * Powers the redesigned Operational Dashboard and related views.
 * No backend wired up; all values are frontend-only stand-ins for stakeholder demo.
 */

export type SlaTier = "breached" | "critical" | "warning" | "watch" | "healthy";
export type RiskSeverity = "high" | "medium" | "low";
export type ReviewState =
  | "pending"
  | "in_progress"
  | "escalated"
  | "governance_hold"
  | "rework"
  | "ai_ready";
export type AiConfidenceBand = "high" | "medium" | "low";

export interface OperationalKpi {
  key: string;
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "flat";
  deltaTone?: "positive" | "negative" | "neutral";
  caption?: string;
  emphasis?: "critical" | "warning" | "default";
}

export const operationalKpis: OperationalKpi[] = [
  {
    key: "pending",
    label: "Pending Reviews",
    value: "47",
    delta: "+6",
    deltaDirection: "up",
    deltaTone: "negative",
    caption: "12 unassigned · 35 claimed",
  },
  {
    key: "sla_risk",
    label: "SLA Breach Risks",
    value: "9",
    delta: "+3",
    deltaDirection: "up",
    deltaTone: "negative",
    caption: "2 breached · 7 critical",
    emphasis: "critical",
  },
  {
    key: "escalated",
    label: "Escalated Reviews",
    value: "5",
    delta: "+1",
    deltaDirection: "up",
    deltaTone: "negative",
    caption: "3 awaiting mentor ruling",
    emphasis: "warning",
  },
  {
    key: "holds",
    label: "Governance Holds",
    value: "3",
    delta: "0",
    deltaDirection: "flat",
    deltaTone: "neutral",
    caption: "Legal · Compliance · Security",
  },
  {
    key: "avg_time",
    label: "Avg Review Time",
    value: "1.8h",
    delta: "-12%",
    deltaDirection: "down",
    deltaTone: "positive",
    caption: "Target 4h · last 7d",
  },
  {
    key: "throughput",
    label: "Review Throughput",
    value: "62 / wk",
    delta: "+8%",
    deltaDirection: "up",
    deltaTone: "positive",
    caption: "Pace on track for 70",
  },
];

export interface PriorityReviewRow {
  id: string;
  contributor: { code: string; name: string; reliability: number };
  task: { title: string; project: string; round?: number; type: "initial" | "rework" | "final" | "escalation" };
  submissionAgeHours: number;
  slaRemainingHours: number;
  slaTier: SlaTier;
  riskSeverity: RiskSeverity;
  reviewState: ReviewState;
  aiConfidence: number;
  aiConfidenceBand: AiConfidenceBand;
  flags: string[];
}

export const priorityReviewQueue: PriorityReviewRow[] = [
  {
    id: "r-1142",
    contributor: { code: "c1142", name: "Refactor billing service", reliability: 71 },
    task: { title: "Refactor billing service", project: "Acme-Helios · P0", round: 2, type: "rework" },
    submissionAgeHours: 32,
    slaRemainingHours: -8,
    slaTier: "breached",
    riskSeverity: "high",
    reviewState: "escalated",
    aiConfidence: 78,
    aiConfidenceBand: "medium",
    flags: ["plagiarism", "round-2"],
  },
  {
    id: "r-4821",
    contributor: { code: "c4821", name: "Date picker A11y", reliability: 87 },
    task: { title: "Build accessible date picker", project: "Acme-Helios · P0", round: 2, type: "rework" },
    submissionAgeHours: 22,
    slaRemainingHours: 2,
    slaTier: "critical",
    riskSeverity: "low",
    reviewState: "ai_ready",
    aiConfidence: 94,
    aiConfidenceBand: "high",
    flags: ["ai-ready"],
  },
  {
    id: "r-3902",
    contributor: { code: "c5102", name: "Auth modal redesign", reliability: 64 },
    task: { title: "Auth modal redesign", project: "BetaCo · P1", round: 3, type: "rework" },
    submissionAgeHours: 28,
    slaRemainingHours: 3,
    slaTier: "critical",
    riskSeverity: "high",
    reviewState: "escalated",
    aiConfidence: 41,
    aiConfidenceBand: "low",
    flags: ["spec-ambiguity"],
  },
  {
    id: "r-6710",
    contributor: { code: "c6710", name: "Stripe webhook handler", reliability: 92 },
    task: { title: "Stripe webhook handler", project: "Acme-Helios · P1", type: "initial" },
    submissionAgeHours: 9,
    slaRemainingHours: 6,
    slaTier: "warning",
    riskSeverity: "low",
    reviewState: "pending",
    aiConfidence: 88,
    aiConfidenceBand: "high",
    flags: [],
  },
  {
    id: "r-5520",
    contributor: { code: "c5520", name: "PII redaction module", reliability: 79 },
    task: { title: "PII redaction module", project: "Helios-Vault · P0", type: "final" },
    submissionAgeHours: 14,
    slaRemainingHours: 12,
    slaTier: "warning",
    riskSeverity: "medium",
    reviewState: "governance_hold",
    aiConfidence: 72,
    aiConfidenceBand: "medium",
    flags: ["legal-hold"],
  },
  {
    id: "r-8044",
    contributor: { code: "c8044", name: "Analytics SQL schema", reliability: 81 },
    task: { title: "Analytics SQL schema", project: "BetaCo · P2", type: "initial" },
    submissionAgeHours: 6,
    slaRemainingHours: 18,
    slaTier: "watch",
    riskSeverity: "low",
    reviewState: "in_progress",
    aiConfidence: 86,
    aiConfidenceBand: "high",
    flags: [],
  },
  {
    id: "r-9301",
    contributor: { code: "c9301", name: "Feature flag SDK", reliability: 88 },
    task: { title: "Feature flag SDK", project: "Acme-Helios · P1", round: 1, type: "initial" },
    submissionAgeHours: 4,
    slaRemainingHours: 20,
    slaTier: "healthy",
    riskSeverity: "low",
    reviewState: "pending",
    aiConfidence: 91,
    aiConfidenceBand: "high",
    flags: ["ai-ready"],
  },
  {
    id: "r-7715",
    contributor: { code: "c7715", name: "Search ranker", reliability: 58 },
    task: { title: "Search relevance ranker", project: "BetaCo · P0", round: 2, type: "rework" },
    submissionAgeHours: 19,
    slaRemainingHours: 1,
    slaTier: "critical",
    riskSeverity: "high",
    reviewState: "in_progress",
    aiConfidence: 54,
    aiConfidenceBand: "low",
    flags: ["low-reliability", "round-2"],
  },
];

export type GovernanceAlertKind = "escalation" | "blocked" | "hold" | "policy";

export interface GovernanceAlert {
  id: string;
  kind: GovernanceAlertKind;
  title: string;
  context: string;
  raisedBy: string;
  raisedAt: string;
  severity: RiskSeverity;
  slaRemainingHours?: number;
}

export const governanceAlerts: GovernanceAlert[] = [
  {
    id: "esc-7821",
    kind: "escalation",
    title: "Spec ambiguity — Auth modal redesign",
    context: "Round 3 reached · routed from R. Verma",
    raisedBy: "R. Verma",
    raisedAt: "2026-05-23 09:14",
    severity: "high",
    slaRemainingHours: 6,
  },
  {
    id: "esc-7826",
    kind: "escalation",
    title: "Quality dispute — Billing service refactor",
    context: "Contributor requested mentor review",
    raisedBy: "c1142",
    raisedAt: "2026-05-23 11:02",
    severity: "high",
    slaRemainingHours: 14,
  },
  {
    id: "hold-2210",
    kind: "hold",
    title: "Legal hold — PII redaction module",
    context: "Data sensitivity classification in review",
    raisedBy: "J. Khan · Legal",
    raisedAt: "2026-05-22 09:00",
    severity: "medium",
  },
  {
    id: "blk-1190",
    kind: "blocked",
    title: "Workflow blocked — Helios-Vault Phase 3",
    context: "Upstream dependency awaiting client sign-off",
    raisedBy: "System",
    raisedAt: "2026-05-22 16:40",
    severity: "medium",
  },
  {
    id: "pol-4401",
    kind: "policy",
    title: "Policy warning — repeat reviewer continuity",
    context: "Same reviewer assigned 3 consecutive rounds (c5102)",
    raisedBy: "Governance Engine",
    raisedAt: "2026-05-23 07:30",
    severity: "low",
  },
];

export type AiInsightKind = "flagged" | "low_confidence" | "recommendation";

export interface AiInsight {
  id: string;
  kind: AiInsightKind;
  title: string;
  summary: string;
  confidence?: number;
  reviewId?: string;
  tags?: string[];
}

export const aiInsights: AiInsight[] = [
  {
    id: "ai-9012",
    kind: "flagged",
    title: "Plagiarism flag · billing service refactor",
    summary: "3 functions overlap a public repository at 88% match. Requires human acknowledgment before accept.",
    confidence: 88,
    reviewId: "r-1142",
    tags: ["plagiarism", "integrity"],
  },
  {
    id: "ai-9024",
    kind: "flagged",
    title: "Timing anomaly · auth modal v3",
    summary: "Re-submission arrived 4 minutes after prior feedback. Pattern suggests minimal revision.",
    confidence: 76,
    reviewId: "r-3902",
    tags: ["timing", "round-3"],
  },
  {
    id: "ai-9051",
    kind: "low_confidence",
    title: "Low confidence cluster · search ranker",
    summary: "Model confidence 54%. Spec coverage gaps in latency criteria and offline-eval evidence.",
    confidence: 54,
    reviewId: "r-7715",
    tags: ["coverage-gap"],
  },
  {
    id: "ai-9077",
    kind: "recommendation",
    title: "Recommend quick-confirm · feature flag SDK",
    summary: "Confidence 91% high · zero risk flags · evidence complete. Suitable for AI-assisted accept.",
    confidence: 91,
    reviewId: "r-9301",
    tags: ["ai-ready"],
  },
  {
    id: "ai-9081",
    kind: "recommendation",
    title: "Suggest fresh reviewer · auth modal",
    summary: "Continuity bias risk detected. Recommend rotation to break reviewer-contributor pairing.",
    reviewId: "r-3902",
    tags: ["continuity", "fairness"],
  },
];

export type ReviewActivityKind =
  | "approval"
  | "rejection"
  | "escalation"
  | "rework"
  | "hold"
  | "release";

export interface ReviewActivityEntry {
  id: string;
  kind: ReviewActivityKind;
  actor: string;
  subject: string;
  detail: string;
  timestamp: string;
  reviewId?: string;
}

export const recentReviewActivity: ReviewActivityEntry[] = [
  {
    id: "act-001",
    kind: "approval",
    actor: "R. Verma",
    subject: "Feature flag SDK · v1",
    detail: "Accepted with AI quick-confirm · confidence 91%",
    timestamp: "14:08",
    reviewId: "r-9301",
  },
  {
    id: "act-002",
    kind: "escalation",
    actor: "R. Verma",
    subject: "Auth modal redesign · v3",
    detail: "Escalated · spec ambiguity · 24h resolution SLA",
    timestamp: "13:42",
    reviewId: "r-3902",
  },
  {
    id: "act-003",
    kind: "rework",
    actor: "K. Singh",
    subject: "Stripe webhook handler · v1",
    detail: "Rework requested · 2 criteria below threshold",
    timestamp: "13:15",
    reviewId: "r-6710",
  },
  {
    id: "act-004",
    kind: "hold",
    actor: "J. Khan · Legal",
    subject: "PII redaction module",
    detail: "Governance hold placed · data sensitivity review",
    timestamp: "12:50",
    reviewId: "r-5520",
  },
  {
    id: "act-005",
    kind: "rejection",
    actor: "L. Mehta",
    subject: "Notification queue · v2",
    detail: "Rejected · scope failure · routed for reassignment",
    timestamp: "12:21",
  },
  {
    id: "act-006",
    kind: "approval",
    actor: "K. Singh",
    subject: "Analytics SQL schema · v1",
    detail: "Accepted · all criteria met · 1.4h review",
    timestamp: "11:58",
    reviewId: "r-8044",
  },
  {
    id: "act-007",
    kind: "release",
    actor: "R. Verma",
    subject: "CSS component library",
    detail: "Released back to pool · capacity rebalance",
    timestamp: "11:30",
  },
];
