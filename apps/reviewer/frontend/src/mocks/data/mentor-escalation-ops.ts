/**
 * Mentor Workspace V2 — Escalated Reviews governance operations mock data.
 *
 * Rich shape supporting the governance ops center: priority categorization,
 * policy risk, operational impact, routing chain, contributor risk history,
 * governance notes, AI risk insight, audit timeline.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

import type { GovernanceEvent } from "./mentor-rework-escalation";
import type { RiskSeverity } from "./mentor-workspace";

export type EscalationOpsCategory =
  | "critical_governance"
  | "compliance_violation"
  | "policy_review"
  | "operational_blocker"
  | "contributor_fraud"
  | "sla_breach";

export type PolicyRiskLevel = "low" | "medium" | "high" | "critical";

export type EscalationOpsState =
  | "open"
  | "investigating"
  | "consulting"
  | "awaiting_ruling"
  | "blocked"
  | "resolved"
  | "closed";

export type GovernanceActionKey =
  | "investigate_evidence"
  | "request_consultation"
  | "route_to_compliance"
  | "issue_ruling"
  | "notify_contributor"
  | "release_block"
  | "escalate_higher"
  | "close_resolved";

export type EscalationOpsTier =
  | "reviewer_pool_lead"
  | "mentor"
  | "enterprise_admin"
  | "platform_admin"
  | "compliance_officer"
  | "legal_officer";

export interface RoutingHop {
  tier: EscalationOpsTier;
  owner: string;
  receivedAt: string;
  status: "received" | "in_review" | "passed" | "resolved";
  note?: string;
}

export interface GovernanceNote {
  id: string;
  author: string;
  role: string;
  body: string;
  at: string;
  tag?: "decision" | "context" | "policy" | "consult";
}

export interface PriorEscalationRef {
  id: string;
  type: string;
  resolution: string;
  at: string;
}

export interface EvidenceConcern {
  label: string;
  severity: RiskSeverity;
  detail: string;
}

export interface OperationalImpact {
  summary: string;
  tier: "low" | "medium" | "high" | "critical";
  blocksDownstream: number;
  affectedAreas: string[];
  estDelayHours: number;
}

export interface AiGovernanceInsight {
  summary: string;
  riskScore: number; // 0–100
  confidence: number; // 0–100
  recommendation?: string;
  tags: string[];
}

export interface ContributorRiskHistory {
  code: string;
  reliability: number;
  reliabilityTrend: number;
  priorEscalations: number;
  reworkCount7d: number;
  fraudSignals: string[];
}

export interface EscalationOpsRow {
  id: string;
  reviewId: string;
  task: {
    title: string;
    project: string;
    portfolio: string;
    priority: "P0" | "P1" | "P2";
  };
  contributor: ContributorRiskHistory;
  category: EscalationOpsCategory;
  state: EscalationOpsState;
  governanceSeverity: RiskSeverity;
  policyRisk: PolicyRiskLevel;
  raisedBy: string;
  raisedAt: string;
  ageHours: number;
  resolutionSlaHours: number;
  hoursRemaining: number;
  pausedReview: boolean;
  owner: { name: string; role: string; since: string };
  routingChain: RoutingHop[];
  description: string;
  evidence: { label: string; size?: string; status?: "ok" | "pending" | "missing" }[];
  evidenceConcerns: EvidenceConcern[];
  policyRefs: string[];
  governanceNotes: GovernanceNote[];
  priorEscalations: PriorEscalationRef[];
  operationalImpact: OperationalImpact;
  timeline: GovernanceEvent[];
  nextAction: GovernanceActionKey;
  isOverdue: boolean;
  isBlocked: boolean;
  ai: AiGovernanceInsight;
}

export const escalationCategoryLabel: Record<EscalationOpsCategory, string> = {
  critical_governance: "Critical Governance Risk",
  compliance_violation: "Compliance Violation",
  policy_review: "Policy Review Required",
  operational_blocker: "Operational Blocker",
  contributor_fraud: "Contributor Fraud Risk",
  sla_breach: "SLA Breach Escalation",
};

export const opsStateLabel: Record<EscalationOpsState, string> = {
  open: "Open",
  investigating: "Investigating",
  consulting: "Consulting",
  awaiting_ruling: "Awaiting ruling",
  blocked: "Blocked",
  resolved: "Resolved",
  closed: "Closed",
};

export const opsTierLabel: Record<EscalationOpsTier, string> = {
  reviewer_pool_lead: "Reviewer pool lead",
  mentor: "Mentor",
  enterprise_admin: "Enterprise admin",
  platform_admin: "Platform admin",
  compliance_officer: "Compliance officer",
  legal_officer: "Legal officer",
};

export const governanceActionLabel: Record<GovernanceActionKey, string> = {
  investigate_evidence: "Investigate evidence",
  request_consultation: "Request consultation",
  route_to_compliance: "Route to compliance",
  issue_ruling: "Issue ruling",
  notify_contributor: "Notify contributor",
  release_block: "Release block",
  escalate_higher: "Escalate higher",
  close_resolved: "Close · resolved",
};

export const escalationOpsRows: EscalationOpsRow[] = [];

/* ────────────────── Priority buckets ────────────────── */

export type PriorityBucketKey =
  | "critical_governance"
  | "compliance_violation"
  | "policy_review"
  | "operational_blocker"
  | "contributor_fraud"
  | "sla_breach";

export interface PriorityBucket {
  key: PriorityBucketKey;
  label: string;
  caption: string;
  predicate: (r: EscalationOpsRow) => boolean;
  tone: "danger" | "warn" | "info" | "neutral";
}

export const priorityBuckets: PriorityBucket[] = [];

/* ────────────────── Saved views ────────────────── */

export const opsSavedViews: {
  key: string;
  label: string;
  description: string;
  predicate: (r: EscalationOpsRow) => boolean;
}[] = [
  { key: "open_critical", label: "Open critical", description: "Active critical escalations", predicate: (r) => r.governanceSeverity === "high" && r.state !== "resolved" && r.state !== "closed" },
  { key: "mine", label: "Owned by me", description: "Escalations I own", predicate: (r) => r.owner.name.startsWith("You") },
  { key: "blocked", label: "Blocked", description: "Operationally blocked items", predicate: (r) => r.isBlocked },
  { key: "sla_at_risk", label: "SLA at risk", description: "≤ 12h remaining", predicate: (r) => r.state !== "resolved" && r.hoursRemaining <= 12 },
  { key: "resolved_7d", label: "Resolved · 7d", description: "Recent resolutions", predicate: (r) => r.state === "resolved" },
];

/* ────────────────── AI governance insights aggregate ────────────────── */

export interface AiGovernanceAggregate {
  id: string;
  title: string;
  summary: string;
  recommendation?: string;
  riskScore: number;
  confidence: number;
  affects: string[];
  kind: "anomaly_cluster" | "policy_gap" | "fraud_pattern" | "capacity_risk" | "summary";
  generatedAt: string;
}

export const aiGovernanceAggregates: AiGovernanceAggregate[] = [];

/* ────────────────── Helpers ────────────────── */

export function formatHoursLabel(h: number): string {
  if (h < 0) return `${Math.abs(h)}h overdue`;
  if (h < 24) return `${h}h left`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h left`;
}
