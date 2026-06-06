/**
 * Mentor Workspace V2 — SLA & Risk Monitor mock data.
 * Operational intelligence layer: KPIs, heatmap matrix, breach rows,
 * mentor workload, contributor watchlist, AI anomalies, timeline.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

import type {
  RiskSeverity,
  SlaTier,
} from "./mentor-workspace";

export type RiskLevel = 0 | 1 | 2 | 3 | 4; // 0 ok · 1 watch · 2 warn · 3 critical · 4 breach

export interface SlaOverviewKpi {
  key: string;
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "flat";
  deltaTone?: "positive" | "negative" | "neutral";
  caption?: string;
  emphasis?: "critical" | "warning" | "default";
}

export const slaOverviewKpis: SlaOverviewKpi[] = [
  {
    key: "active_breaches",
    label: "Active SLA Breaches",
    value: "4",
    delta: "+2",
    deltaDirection: "up",
    deltaTone: "negative",
    caption: "2 critical · 2 expired",
    emphasis: "critical",
  },
  {
    key: "approaching",
    label: "Approaching SLA Risks",
    value: "11",
    delta: "+3",
    deltaDirection: "up",
    deltaTone: "negative",
    caption: "≤ 6h to breach",
    emphasis: "warning",
  },
  {
    key: "escalated",
    label: "Escalated Reviews",
    value: "5",
    delta: "+1",
    deltaDirection: "up",
    deltaTone: "negative",
    caption: "3 awaiting ruling",
    emphasis: "warning",
  },
  {
    key: "holds",
    label: "Governance Holds",
    value: "3",
    delta: "0",
    deltaDirection: "flat",
    deltaTone: "neutral",
    caption: "Legal · SOC2 · Security",
  },
  {
    key: "blocked",
    label: "Blocked Workflows",
    value: "2",
    delta: "-1",
    deltaDirection: "down",
    deltaTone: "positive",
    caption: "upstream dependencies",
  },
  {
    key: "avg_delay",
    label: "Avg Resolution Delay",
    value: "+1.2h",
    delta: "+18%",
    deltaDirection: "up",
    deltaTone: "negative",
    caption: "vs 7-day baseline",
    emphasis: "warning",
  },
];

/* ────────────────── Risk heatmap ────────────────── */

export const heatmapDimensions = [
  { key: "congestion", label: "Review Congestion" },
  { key: "mentor_overload", label: "Mentor Overload" },
  { key: "escalation_cluster", label: "Escalation Cluster" },
  { key: "contributor_quality", label: "Contributor Quality" },
  { key: "governance_bottleneck", label: "Governance Bottleneck" },
] as const;

export type HeatmapDimensionKey = (typeof heatmapDimensions)[number]["key"];

export const heatmapProjects = [
  { key: "acme_helios", label: "Acme-Helios", priority: "P0" },
  { key: "helios_vault", label: "Helios-Vault", priority: "P0" },
  { key: "betaco", label: "BetaCo", priority: "P1" },
  { key: "atlas", label: "Atlas-Insights", priority: "P1" },
  { key: "stratum", label: "Stratum-Pay", priority: "P2" },
] as const;

export type HeatmapProjectKey = (typeof heatmapProjects)[number]["key"];

export interface HeatmapCell {
  dimension: HeatmapDimensionKey;
  project: HeatmapProjectKey;
  level: RiskLevel;
  count: number;
  note?: string;
}

export const heatmapCells: HeatmapCell[] = [
  // Acme-Helios
  { dimension: "congestion",            project: "acme_helios", level: 3, count: 14, note: "P0 intake ▲ 28%" },
  { dimension: "mentor_overload",       project: "acme_helios", level: 2, count: 2,  note: "two mentors > 90% capacity" },
  { dimension: "escalation_cluster",    project: "acme_helios", level: 3, count: 3,  note: "billing service round-3 disputes" },
  { dimension: "contributor_quality",   project: "acme_helios", level: 2, count: 4,  note: "c1142 reliability ▼ 12 q" },
  { dimension: "governance_bottleneck", project: "acme_helios", level: 1, count: 1 },
  // Helios-Vault
  { dimension: "congestion",            project: "helios_vault", level: 2, count: 8 },
  { dimension: "mentor_overload",       project: "helios_vault", level: 1, count: 1 },
  { dimension: "escalation_cluster",    project: "helios_vault", level: 2, count: 1 },
  { dimension: "contributor_quality",   project: "helios_vault", level: 1, count: 2 },
  { dimension: "governance_bottleneck", project: "helios_vault", level: 4, count: 2, note: "Legal hold + SOC2 hold" },
  // BetaCo
  { dimension: "congestion",            project: "betaco", level: 4, count: 18, note: "pool 110% capacity" },
  { dimension: "mentor_overload",       project: "betaco", level: 3, count: 3 },
  { dimension: "escalation_cluster",    project: "betaco", level: 3, count: 2,  note: "spec ambiguity + dispute" },
  { dimension: "contributor_quality",   project: "betaco", level: 3, count: 6,  note: "search ranker reliability ▼" },
  { dimension: "governance_bottleneck", project: "betaco", level: 1, count: 0 },
  // Atlas
  { dimension: "congestion",            project: "atlas", level: 1, count: 5 },
  { dimension: "mentor_overload",       project: "atlas", level: 0, count: 0 },
  { dimension: "escalation_cluster",    project: "atlas", level: 0, count: 0 },
  { dimension: "contributor_quality",   project: "atlas", level: 1, count: 1 },
  { dimension: "governance_bottleneck", project: "atlas", level: 0, count: 0 },
  // Stratum
  { dimension: "congestion",            project: "stratum", level: 1, count: 4 },
  { dimension: "mentor_overload",       project: "stratum", level: 0, count: 0 },
  { dimension: "escalation_cluster",    project: "stratum", level: 1, count: 1 },
  { dimension: "contributor_quality",   project: "stratum", level: 2, count: 3, note: "two new contributors onboarding" },
  { dimension: "governance_bottleneck", project: "stratum", level: 0, count: 0 },
];

/* ────────────────── SLA breach table ────────────────── */

export type EscalationStatus = "none" | "raised" | "under_review" | "resolved";

export interface SlaBreachRow {
  id: string;
  reviewId: string;
  task: string;
  project: string;
  state: "rework_requested" | "in_progress" | "escalated" | "governance_hold" | "awaiting_contributor";
  slaTier: SlaTier;
  slaRemainingHours: number;
  assignedMentor: string;
  contributorCode: string;
  escalation: EscalationStatus;
  governanceSeverity: RiskSeverity;
  recommendedAction: "claim_now" | "reassign" | "release_to_pool" | "escalate" | "request_extension" | "release_hold";
}

export const slaBreachRows: SlaBreachRow[] = [
  {
    id: "br-1142",
    reviewId: "r-1142",
    task: "Refactor billing service",
    project: "Acme-Helios",
    state: "escalated",
    slaTier: "breached",
    slaRemainingHours: -8,
    assignedMentor: "R. Verma",
    contributorCode: "c1142",
    escalation: "under_review",
    governanceSeverity: "high",
    recommendedAction: "escalate",
  },
  {
    id: "br-4821",
    reviewId: "r-4821",
    task: "Build accessible date picker",
    project: "Acme-Helios",
    state: "in_progress",
    slaTier: "critical",
    slaRemainingHours: 2,
    assignedMentor: "R. Verma",
    contributorCode: "c4821",
    escalation: "none",
    governanceSeverity: "low",
    recommendedAction: "claim_now",
  },
  {
    id: "br-3902",
    reviewId: "r-3902",
    task: "Auth modal redesign",
    project: "BetaCo",
    state: "escalated",
    slaTier: "critical",
    slaRemainingHours: 3,
    assignedMentor: "K. Singh",
    contributorCode: "c5102",
    escalation: "under_review",
    governanceSeverity: "high",
    recommendedAction: "escalate",
  },
  {
    id: "br-7715",
    reviewId: "r-7715",
    task: "Search relevance ranker",
    project: "BetaCo",
    state: "in_progress",
    slaTier: "critical",
    slaRemainingHours: 1,
    assignedMentor: "L. Mehta",
    contributorCode: "c7715",
    escalation: "raised",
    governanceSeverity: "high",
    recommendedAction: "reassign",
  },
  {
    id: "br-5520",
    reviewId: "r-5520",
    task: "PII redaction module",
    project: "Helios-Vault",
    state: "governance_hold",
    slaTier: "warning",
    slaRemainingHours: 12,
    assignedMentor: "R. Verma",
    contributorCode: "c5520",
    escalation: "none",
    governanceSeverity: "medium",
    recommendedAction: "release_hold",
  },
  {
    id: "br-3208",
    reviewId: "r-3208",
    task: "Customer export pipeline",
    project: "Helios-Vault",
    state: "governance_hold",
    slaTier: "warning",
    slaRemainingHours: 9,
    assignedMentor: "K. Singh",
    contributorCode: "c3208",
    escalation: "none",
    governanceSeverity: "high",
    recommendedAction: "release_hold",
  },
  {
    id: "br-6710",
    reviewId: "r-6710",
    task: "Stripe webhook handler",
    project: "Acme-Helios",
    state: "rework_requested",
    slaTier: "warning",
    slaRemainingHours: 8,
    assignedMentor: "L. Mehta",
    contributorCode: "c6710",
    escalation: "none",
    governanceSeverity: "low",
    recommendedAction: "request_extension",
  },
  {
    id: "br-4480",
    reviewId: "r-4480",
    task: "Auth tokens rotation script",
    project: "Acme-Helios",
    state: "governance_hold",
    slaTier: "watch",
    slaRemainingHours: 16,
    assignedMentor: "R. Verma",
    contributorCode: "c4480",
    escalation: "none",
    governanceSeverity: "high",
    recommendedAction: "release_hold",
  },
];

/* ────────────────── Governance risk panel ────────────────── */

export interface GovernanceRiskRow {
  id: string;
  label: string;
  count: number;
  trend: "up" | "down" | "flat";
  trendValue: string;
  severity: RiskSeverity;
  detail: string;
}

export const governanceRiskRows: GovernanceRiskRow[] = [
  {
    id: "policy",
    label: "Policy violations",
    count: 6,
    trend: "up",
    trendValue: "+2",
    severity: "high",
    detail: "2 reviewer-continuity caps · 3 evidence-completeness · 1 disclosure",
  },
  {
    id: "blocked",
    label: "Blocked reviews",
    count: 2,
    trend: "down",
    trendValue: "-1",
    severity: "medium",
    detail: "Helios-Vault Phase 3 awaiting client sign-off",
  },
  {
    id: "repeat_fail",
    label: "Repeated contributor failures",
    count: 3,
    trend: "up",
    trendValue: "+1",
    severity: "high",
    detail: "c1142 · c7715 · c5102 — 2+ rework rounds in 7 days",
  },
  {
    id: "patterns",
    label: "Suspicious operational patterns",
    count: 4,
    trend: "flat",
    trendValue: "0",
    severity: "medium",
    detail: "Two timing-anomaly clusters · one continuity-bias warning",
  },
  {
    id: "backlog",
    label: "Governance review backlog",
    count: 7,
    trend: "up",
    trendValue: "+3",
    severity: "medium",
    detail: "Audit triage queue · oldest 4d",
  },
];

/* ────────────────── Mentor workload ────────────────── */

export interface MentorWorkload {
  name: string;
  initials: string;
  capacity: number;
  load: number;
  activeReviews: number;
  openEscalations: number;
  weeklyThroughput: number;
  weeklyTrend: number;
  slaPressure: "ok" | "warn" | "critical";
  status: "online" | "away" | "pto";
  statusNote?: string;
}

export const mentorWorkloads: MentorWorkload[] = [
  {
    name: "Rajesh Verma",
    initials: "RV",
    capacity: 25,
    load: 23,
    activeReviews: 8,
    openEscalations: 3,
    weeklyThroughput: 18,
    weeklyTrend: 4,
    slaPressure: "warn",
    status: "online",
  },
  {
    name: "Kavya Singh",
    initials: "KS",
    capacity: 25,
    load: 14,
    activeReviews: 5,
    openEscalations: 1,
    weeklyThroughput: 16,
    weeklyTrend: 2,
    slaPressure: "ok",
    status: "online",
  },
  {
    name: "Lakshmi Mehta",
    initials: "LM",
    capacity: 20,
    load: 24,
    activeReviews: 11,
    openEscalations: 2,
    weeklyThroughput: 22,
    weeklyTrend: 6,
    slaPressure: "critical",
    status: "online",
  },
  {
    name: "Arjun Iyer",
    initials: "AI",
    capacity: 25,
    load: 0,
    activeReviews: 0,
    openEscalations: 0,
    weeklyThroughput: 0,
    weeklyTrend: 0,
    slaPressure: "ok",
    status: "pto",
    statusNote: "PTO until May 25",
  },
  {
    name: "Priya Nair",
    initials: "PN",
    capacity: 25,
    load: 17,
    activeReviews: 7,
    openEscalations: 0,
    weeklyThroughput: 19,
    weeklyTrend: -1,
    slaPressure: "ok",
    status: "away",
    statusNote: "Mentoring · back 14:00",
  },
];

/* ────────────────── Contributor risk ────────────────── */

export interface ContributorRiskProfile {
  code: string;
  reliability: number;
  trend: number;
  reworkCount7d: number;
  escalationCount7d: number;
  patterns: string[];
  watchReason: string;
  segment: "watchlist" | "decline" | "escalation_heavy" | "new";
  primaryProject: string;
}

export const contributorRiskProfiles: ContributorRiskProfile[] = [
  {
    code: "c1142",
    reliability: 71,
    trend: -8,
    reworkCount7d: 3,
    escalationCount7d: 1,
    patterns: ["plagiarism flag", "round-3 risk"],
    watchReason: "Repeated round-3 risk on Acme billing surface",
    segment: "decline",
    primaryProject: "Acme-Helios",
  },
  {
    code: "c7715",
    reliability: 58,
    trend: -12,
    reworkCount7d: 4,
    escalationCount7d: 2,
    patterns: ["low coverage", "timing anomaly"],
    watchReason: "Reliability declining; coverage gaps repeating",
    segment: "escalation_heavy",
    primaryProject: "BetaCo",
  },
  {
    code: "c5102",
    reliability: 64,
    trend: -4,
    reworkCount7d: 3,
    escalationCount7d: 2,
    patterns: ["spec misinterpretation"],
    watchReason: "Spec disputes on consecutive rounds",
    segment: "escalation_heavy",
    primaryProject: "BetaCo",
  },
  {
    code: "c4821",
    reliability: 87,
    trend: 4,
    reworkCount7d: 1,
    escalationCount7d: 0,
    patterns: ["A11y verification gap"],
    watchReason: "A11y coaching track · trending up",
    segment: "watchlist",
    primaryProject: "Acme-Helios",
  },
  {
    code: "c6710",
    reliability: 92,
    trend: 1,
    reworkCount7d: 1,
    escalationCount7d: 0,
    patterns: [],
    watchReason: "High performer; nothing flagged",
    segment: "watchlist",
    primaryProject: "Acme-Helios",
  },
  {
    code: "c5520",
    reliability: 79,
    trend: 2,
    reworkCount7d: 1,
    escalationCount7d: 0,
    patterns: ["compliance gap closed"],
    watchReason: "Resolved compliance gap last cycle",
    segment: "watchlist",
    primaryProject: "Helios-Vault",
  },
  {
    code: "c9301",
    reliability: 88,
    trend: 0,
    reworkCount7d: 0,
    escalationCount7d: 0,
    patterns: [],
    watchReason: "New contributor · still building history",
    segment: "new",
    primaryProject: "Acme-Helios",
  },
  {
    code: "c8044",
    reliability: 81,
    trend: 3,
    reworkCount7d: 0,
    escalationCount7d: 0,
    patterns: [],
    watchReason: "Steady; no flags",
    segment: "new",
    primaryProject: "BetaCo",
  },
];

/* ────────────────── Operational timeline ────────────────── */

export type RiskEventKind =
  | "sla_breach"
  | "escalation"
  | "hold_placed"
  | "hold_released"
  | "policy_violation"
  | "blocked_workflow"
  | "anomaly_detected"
  | "rebalanced";

export interface RiskTimelineEntry {
  id: string;
  kind: RiskEventKind;
  timestamp: string;
  subject: string;
  detail: string;
  severity: RiskSeverity;
}

export const riskTimeline: RiskTimelineEntry[] = [
  { id: "tl-1", kind: "sla_breach", timestamp: "14:34", subject: "Refactor billing service · r-1142", detail: "Breached 8h ago · auto-escalating now", severity: "high" },
  { id: "tl-2", kind: "anomaly_detected", timestamp: "14:08", subject: "Search relevance ranker · r-7715", detail: "AI conf dropped from 78% → 54% on resubmit", severity: "medium" },
  { id: "tl-3", kind: "escalation", timestamp: "13:42", subject: "Auth modal redesign · r-3902", detail: "Spec ambiguity escalation · 24h SLA", severity: "high" },
  { id: "tl-4", kind: "hold_placed", timestamp: "12:50", subject: "PII redaction module · r-5520", detail: "Legal hold · J. Khan · data sensitivity review", severity: "medium" },
  { id: "tl-5", kind: "rebalanced", timestamp: "12:00", subject: "BetaCo review pool", detail: "Borrowed 2 reviewers from Helios pool for 5 days", severity: "low" },
  { id: "tl-6", kind: "policy_violation", timestamp: "11:30", subject: "Reviewer continuity cap exceeded", detail: "c5102 assigned 3 consecutive rounds to R. Verma", severity: "low" },
  { id: "tl-7", kind: "anomaly_detected", timestamp: "11:14", subject: "Timing anomaly · c4821", detail: "v2 submitted 4 min after v1 feedback", severity: "medium" },
  { id: "tl-8", kind: "blocked_workflow", timestamp: "10:40", subject: "Helios-Vault Phase 3", detail: "Upstream sign-off pending · 14h on hold", severity: "medium" },
  { id: "tl-9", kind: "sla_breach", timestamp: "09:18", subject: "Notification queue · r-6620", detail: "Breached · auto-released to pool", severity: "high" },
  { id: "tl-10", kind: "hold_released", timestamp: "08:50", subject: "Helios Phase 2 · r-2114", detail: "Compliance review complete; back to pool", severity: "low" },
];

/* ────────────────── AI risk insights ────────────────── */

export type AiRiskKind =
  | "anomaly"
  | "confidence_drift"
  | "submission_pattern"
  | "slowdown_forecast"
  | "governance_summary";

export interface AiRiskInsight {
  id: string;
  kind: AiRiskKind;
  title: string;
  summary: string;
  confidence?: number;
  affects: string[];
  recommendation?: string;
  modelVersion: string;
  generatedAt: string;
}

export const aiRiskInsights: AiRiskInsight[] = [
  {
    id: "air-1",
    kind: "anomaly",
    title: "Plagiarism cluster · Acme-Helios billing surface",
    summary:
      "Three submissions in the last 72h overlap 80%+ with a single public repository on the same utility set. Pattern is concentrated on contributor c1142.",
    confidence: 88,
    affects: ["r-1142", "r-3902"],
    recommendation: "Refer to governance audit; consider conduct escalation.",
    modelVersion: "v3.2",
    generatedAt: "14:02",
  },
  {
    id: "air-2",
    kind: "confidence_drift",
    title: "AI confidence degrading on BetaCo reviews",
    summary:
      "Average AI confidence on BetaCo submissions has dropped from 81% → 64% in the last 7 days. Coverage gaps cluster around evidence-completeness criteria.",
    confidence: 76,
    affects: ["BetaCo pool", "r-7715", "r-3902"],
    recommendation: "Investigate spec-evidence linkage; consider model retraining sample.",
    modelVersion: "v3.2",
    generatedAt: "13:45",
  },
  {
    id: "air-3",
    kind: "submission_pattern",
    title: "Fast-resubmit pattern detected",
    summary:
      "Five contributors are resubmitting under 10 minutes after rework feedback (median is 6h). May indicate superficial revisions.",
    confidence: 81,
    affects: ["c1142", "c4821", "c7715"],
    recommendation: "Tag with timing-anomaly flag; require explicit revision summary.",
    modelVersion: "v3.2",
    generatedAt: "12:14",
  },
  {
    id: "air-4",
    kind: "slowdown_forecast",
    title: "Capacity exceeded by Tuesday at current intake",
    summary:
      "At current intake (+18% week-on-week) and 23% review-time degradation, your pool exceeds capacity by Tuesday EOD. Two reviewers are at >90% load.",
    confidence: 92,
    affects: ["My pool"],
    recommendation: "Add reviewer · pause non-P0 intake 24h · rebalance from Helios pool.",
    modelVersion: "v3.2",
    generatedAt: "11:30",
  },
  {
    id: "air-5",
    kind: "governance_summary",
    title: "Governance risk · weekly summary",
    summary:
      "Escalation rate +18% w/w. Two repeat-offender contributors driving 60% of escalation volume. Three holds active longer than 24h.",
    confidence: 85,
    affects: ["mentor pool", "governance backlog"],
    recommendation: "Prioritize governance triage; raise audit visibility on c1142 and c7715.",
    modelVersion: "v3.2",
    generatedAt: "09:00",
  },
];

/* ────────────────── Heatmap helpers ────────────────── */

export function levelToTone(level: RiskLevel): {
  bg: string;
  border: string;
  text: string;
  label: string;
} {
  switch (level) {
    case 4:
      return { bg: "bg-red-600",     border: "border-red-700",     text: "text-white",        label: "Breach" };
    case 3:
      return { bg: "bg-red-500/85",  border: "border-red-500",     text: "text-white",        label: "Critical" };
    case 2:
      return { bg: "bg-gold-400/85", border: "border-gold-400",    text: "text-brown-950",    label: "Warning" };
    case 1:
      return { bg: "bg-teal-100",    border: "border-teal-300",    text: "text-teal-800",     label: "Watch" };
    case 0:
    default:
      return { bg: "bg-gray-50",     border: "border-gray-200",    text: "text-gray-500",     label: "OK" };
  }
}
