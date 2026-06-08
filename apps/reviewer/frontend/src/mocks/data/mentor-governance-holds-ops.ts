/**
 * Mentor Workspace V2 — Governance Holds operations mock data.
 *
 * Enterprise compliance enforcement layer: hold category, release approval
 * chain, audit requirements, restricted actions, policy references, AI
 * compliance insights, governance timeline.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

import type { GovernanceEvent } from "./mentor-rework-escalation";
import type { PolicyRiskLevel } from "./mentor-escalation-ops";
import type { RiskSeverity } from "./mentor-workspace";

export type HoldOpsCategory =
  | "compliance_review"
  | "policy_violation"
  | "audit_investigation"
  | "fraud_risk"
  | "workflow_restriction"
  | "executive_review";

export type HoldOpsState =
  | "open"
  | "under_review"
  | "awaiting_signoff"
  | "partial_release"
  | "ready_to_release"
  | "released"
  | "rejected";

export type HoldOpsTier =
  | "legal"
  | "compliance"
  | "security"
  | "audit"
  | "policy_council"
  | "executive";

export type ReleaseActionKey =
  | "request_signoff"
  | "submit_evidence"
  | "consult_legal"
  | "await_external"
  | "issue_release"
  | "reject_request"
  | "extend_hold";

export interface ReleaseApprovalStep {
  tier: HoldOpsTier;
  owner: string;
  required: boolean;
  status: "pending" | "approved" | "rejected" | "skipped";
  signedAt?: string;
  note?: string;
}

export type DependencyKind = "internal" | "external" | "evidence" | "approval";

export interface ReleaseDependency {
  label: string;
  kind: DependencyKind;
  status: "satisfied" | "pending" | "blocked";
  detail: string;
  expectedAt?: string;
}

export interface ComplianceNote {
  id: string;
  author: string;
  role: string;
  body: string;
  at: string;
  tag: "decision" | "context" | "policy" | "audit";
}

export interface AuditRequirement {
  id: string;
  label: string;
  status: "complete" | "in_progress" | "missing";
  required: boolean;
  evidence?: string;
}

export interface PolicyReference {
  id: string;
  label: string;
  section?: string;
  authority: "internal" | "regulatory" | "contractual";
}

export interface PriorRestriction {
  id: string;
  kind: string;
  at: string;
  resolution: string;
}

export interface HoldAiInsight {
  summary: string;
  riskScore: number;
  confidence: number;
  recommendation?: string;
  tags: string[];
}

export interface HoldOpsRow {
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
    priorRestrictions: number;
  };
  category: HoldOpsCategory;
  state: HoldOpsState;
  governanceSeverity: RiskSeverity;
  policyRisk: PolicyRiskLevel;
  raisedBy: string;
  raisedAt: string;
  ageHours: number;
  owner: { name: string; role: string; tier: HoldOpsTier; since: string };
  expectedRelease?: string;
  description: string;
  restrictedActions: string[];
  releaseConditions: string[];
  releaseApprovalChain: ReleaseApprovalStep[];
  releaseDependencies: ReleaseDependency[];
  policyRefs: PolicyReference[];
  auditRequirements: AuditRequirement[];
  complianceNotes: ComplianceNote[];
  priorRestrictions: PriorRestriction[];
  operationalImpact: {
    summary: string;
    tier: "low" | "medium" | "high" | "critical";
    blocksDownstream: number;
    affectedAreas: string[];
    estDelayHours: number;
  };
  timeline: GovernanceEvent[];
  nextAction: ReleaseActionKey;
  isOverdue: boolean;
  awaitingExternal?: string;
  ai: HoldAiInsight;
}

export const holdCategoryLabel: Record<HoldOpsCategory, string> = {
  compliance_review: "Compliance Review",
  policy_violation: "Policy Violation Hold",
  audit_investigation: "Audit Investigation",
  fraud_risk: "Fraud Risk Hold",
  workflow_restriction: "Workflow Restriction",
  executive_review: "Executive Governance Review",
};

export const holdStateLabel: Record<HoldOpsState, string> = {
  open: "Open",
  under_review: "Under review",
  awaiting_signoff: "Awaiting sign-off",
  partial_release: "Partial release",
  ready_to_release: "Ready to release",
  released: "Released",
  rejected: "Rejected",
};

export const holdTierLabel: Record<HoldOpsTier, string> = {
  legal: "Legal",
  compliance: "Compliance",
  security: "Security",
  audit: "Audit",
  policy_council: "Policy council",
  executive: "Executive",
};

export const releaseActionLabel: Record<ReleaseActionKey, string> = {
  request_signoff: "Request sign-off",
  submit_evidence: "Submit evidence",
  consult_legal: "Consult legal",
  await_external: "Await external",
  issue_release: "Issue release",
  reject_request: "Reject release",
  extend_hold: "Extend hold",
};

export const holdOpsRows: HoldOpsRow[] = [];

/* ────────────────── Priority buckets ────────────────── */

export type HoldPriorityBucketKey = HoldOpsCategory;

export interface HoldPriorityBucket {
  key: HoldPriorityBucketKey;
  label: string;
  caption: string;
  predicate: (r: HoldOpsRow) => boolean;
  tone: "danger" | "warn" | "info" | "neutral";
}

export const holdPriorityBuckets: HoldPriorityBucket[] = [];

/* ────────────────── Saved views ────────────────── */

export const holdOpsSavedViews: {
  key: string;
  label: string;
  description: string;
  predicate: (r: HoldOpsRow) => boolean;
}[] = [
  {
    key: "ready_release",
    label: "Ready to release",
    description: "All conditions satisfied",
    predicate: (r) => r.state === "ready_to_release",
  },
  {
    key: "awaiting_signoff",
    label: "Awaiting sign-off",
    description: "Pending approval steps",
    predicate: (r) => r.state === "awaiting_signoff",
  },
  {
    key: "external_dep",
    label: "External dependency",
    description: "Blocked on external party",
    predicate: (r) => r.releaseDependencies.some((d) => d.kind === "external" && d.status === "pending"),
  },
  {
    key: "critical_policy",
    label: "Critical policy risk",
    description: "Critical / high policy risk",
    predicate: (r) => r.policyRisk === "critical" || r.policyRisk === "high",
  },
  {
    key: "long_running",
    label: "Long-running",
    description: "On hold > 48h",
    predicate: (r) => r.ageHours > 48,
  },
];

/* ────────────────── AI hold insights ────────────────── */

export interface HoldAiAggregate {
  id: string;
  title: string;
  summary: string;
  recommendation?: string;
  riskScore: number;
  confidence: number;
  affects: string[];
  kind: "compliance_anomaly" | "fraud_cluster" | "operational_risk" | "reliability_drift" | "release_risk";
  generatedAt: string;
}

export const holdAiAggregates: HoldAiAggregate[] = [];

/* ────────────────── Helpers ────────────────── */

export function formatHoldHours(h: number): string {
  if (h < 24) return `${h}h on hold`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h on hold`;
}

export function approvalPct(steps: ReleaseApprovalStep[]): number {
  const req = steps.filter((s) => s.required);
  if (req.length === 0) return 100;
  const done = req.filter((s) => s.status === "approved").length;
  return Math.round((done / req.length) * 100);
}
