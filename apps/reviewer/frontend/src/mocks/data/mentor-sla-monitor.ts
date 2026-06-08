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

export const slaOverviewKpis: SlaOverviewKpi[] = [];

/* ────────────────── Risk heatmap ────────────────── */

export const heatmapDimensions = [] as const;

export type HeatmapDimensionKey = (typeof heatmapDimensions)[number]["key"];

export const heatmapProjects = [] as const;

export type HeatmapProjectKey = (typeof heatmapProjects)[number]["key"];

export interface HeatmapCell {
  dimension: HeatmapDimensionKey;
  project: HeatmapProjectKey;
  level: RiskLevel;
  count: number;
  note?: string;
}

export const heatmapCells: HeatmapCell[] = [];

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

export const slaBreachRows: SlaBreachRow[] = [];

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

export const governanceRiskRows: GovernanceRiskRow[] = [];

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

export const mentorWorkloads: MentorWorkload[] = [];

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

export const contributorRiskProfiles: ContributorRiskProfile[] = [];

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

export const riskTimeline: RiskTimelineEntry[] = [];

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

export const aiRiskInsights: AiRiskInsight[] = [];

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
