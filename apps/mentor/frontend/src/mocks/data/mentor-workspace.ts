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

export const operationalKpis: OperationalKpi[] = [];

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

export const priorityReviewQueue: PriorityReviewRow[] = [];

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

export const governanceAlerts: GovernanceAlert[] = [];

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

export const aiInsights: AiInsight[] = [];

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

export const recentReviewActivity: ReviewActivityEntry[] = [];
