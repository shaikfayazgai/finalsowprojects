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

export const holdOpsRows: HoldOpsRow[] = [
  {
    id: "hold-5520",
    reviewId: "r-5520",
    task: {
      title: "PII redaction module",
      project: "Helios-Vault",
      portfolio: "Privacy",
      priority: "P0",
    },
    contributor: { code: "c5520", reliability: 79, priorRestrictions: 0 },
    category: "compliance_review",
    state: "under_review",
    governanceSeverity: "medium",
    policyRisk: "high",
    raisedBy: "J. Khan · Legal",
    raisedAt: "2026-05-22 09:00",
    ageHours: 30,
    owner: { name: "J. Khan · Legal officer", role: "Legal officer", tier: "legal", since: "2026-05-22 09:00" },
    expectedRelease: "2026-05-25",
    description:
      "Pseudonymization key-rotation classification under legal review. Awaiting external classifier confirmation of GDPR boundary impact.",
    restrictedActions: ["Accept", "Reject", "Request rework", "Reassign reviewer"],
    releaseConditions: [
      "External classifier (Verisign) response received",
      "Internal classification draft endorsed by Legal",
      "Data-residency boundary confirmed",
    ],
    releaseApprovalChain: [
      { tier: "legal", owner: "J. Khan", required: true, status: "pending", note: "Awaiting external classifier." },
      { tier: "compliance", owner: "M. Patel", required: true, status: "pending" },
      { tier: "audit", owner: "Audit committee", required: false, status: "skipped" },
    ],
    releaseDependencies: [
      { label: "Verisign classifier response", kind: "external", status: "pending", detail: "Submitted May 22; ETA May 25", expectedAt: "2026-05-25" },
      { label: "Internal classification draft", kind: "evidence", status: "satisfied", detail: "Draft v3 endorsed in-progress" },
      { label: "Legal sign-off", kind: "approval", status: "pending", detail: "Pending external response" },
    ],
    policyRefs: [
      { id: "p-gdpr-32", label: "GDPR §32 · technical safeguards", section: "§32", authority: "regulatory" },
      { id: "p-dc-3", label: "Data classification policy v3.1", section: "§4", authority: "internal" },
    ],
    auditRequirements: [
      { id: "ar-1", label: "External classifier response", status: "in_progress", required: true, evidence: "Verisign ticket #VS-42910" },
      { id: "ar-2", label: "Internal classification draft", status: "complete", required: true, evidence: "draft-v3.pdf · 240 KB" },
      { id: "ar-3", label: "Data-residency proof", status: "missing", required: true },
    ],
    complianceNotes: [
      {
        id: "cn-1",
        author: "J. Khan",
        role: "Legal officer",
        body: "Awaiting external classifier; ETA May 25. Will route to Compliance for final sign-off after release.",
        at: "May 23 09:00",
        tag: "policy",
      },
      {
        id: "cn-2",
        author: "M. Patel",
        role: "Compliance officer",
        body: "Will run compliance pass once Legal endorses.",
        at: "May 23 11:30",
        tag: "context",
      },
    ],
    priorRestrictions: [],
    operationalImpact: {
      summary: "Privacy milestone on hold; PII pseudonymization rollout paused.",
      tier: "medium",
      blocksDownstream: 1,
      affectedAreas: ["Privacy milestone", "Pseudonymization rollout"],
      estDelayHours: 36,
    },
    timeline: [
      { id: "ht-1", timestamp: "May 22 09:00", actor: "J. Khan · Legal", action: "Hold placed", detail: "Data sensitivity classification review", category: "governance" },
      { id: "ht-2", timestamp: "May 22 11:30", actor: "System", action: "Notifications sent", detail: "Reviewer, contributor, mentor notified", category: "system" },
      { id: "ht-3", timestamp: "May 23 09:00", actor: "J. Khan · Legal", action: "Status update", detail: "Awaiting external classifier response", category: "policy" },
    ],
    nextAction: "await_external",
    isOverdue: false,
    awaitingExternal: "Verisign classifier response · ETA May 25",
    ai: {
      summary:
        "Hold is bounded by a single external dependency. Internal evidence is ready. Release likely within 36h once classifier responds.",
      riskScore: 48,
      confidence: 91,
      recommendation: "Monitor · poll Legal every 24h · no mentor action required.",
      tags: ["legal-hold", "external-dependency"],
    },
  },
  {
    id: "hold-3208",
    reviewId: "r-3208",
    task: {
      title: "Customer export pipeline",
      project: "Helios-Vault",
      portfolio: "Privacy",
      priority: "P0",
    },
    contributor: { code: "c3208", reliability: 74, priorRestrictions: 1 },
    category: "compliance_review",
    state: "awaiting_signoff",
    governanceSeverity: "high",
    policyRisk: "high",
    raisedBy: "M. Patel · Compliance",
    raisedAt: "2026-05-21 14:00",
    ageHours: 50,
    owner: { name: "M. Patel · Compliance", role: "Compliance officer", tier: "compliance", since: "2026-05-21 14:00" },
    expectedRelease: "2026-05-27",
    description:
      "Export route ingests financial fields outside the original SOW scope. SOC2 evidence pack required before any release.",
    restrictedActions: ["Accept", "Reject", "Request rework"],
    releaseConditions: [
      "All 5 SOC2 artifacts collected",
      "Data-residency policy v2 verified",
      "Scope-amendment SOP completed",
      "Compliance officer sign-off",
    ],
    releaseApprovalChain: [
      { tier: "compliance", owner: "M. Patel", required: true, status: "pending", note: "3 of 5 SOC2 artifacts collected." },
      { tier: "audit", owner: "Audit committee", required: true, status: "pending" },
      { tier: "executive", owner: "C. Doshi · COO", required: false, status: "skipped" },
    ],
    releaseDependencies: [
      { label: "SOC2 artifacts (5)", kind: "evidence", status: "pending", detail: "3 of 5 collected" },
      { label: "Data residency verification", kind: "internal", status: "pending", detail: "EU edge routing review" },
      { label: "Scope amendment", kind: "approval", status: "pending", detail: "Contract amendment in legal review" },
    ],
    policyRefs: [
      { id: "p-soc2-cc67", label: "SOC2 CC6.7", authority: "regulatory" },
      { id: "p-res-2", label: "Data residency policy v2", authority: "internal" },
      { id: "p-amend", label: "Scope-amendment SOP", authority: "internal" },
    ],
    auditRequirements: [
      { id: "ar-10", label: "Control mapping (CC6.x)", status: "in_progress", required: true },
      { id: "ar-11", label: "Data flow diagram", status: "complete", required: true, evidence: "data-flow-v2.pdf" },
      { id: "ar-12", label: "Residency proof (EU)", status: "missing", required: true },
      { id: "ar-13", label: "Scope amendment doc", status: "missing", required: true },
      { id: "ar-14", label: "Customer notification template", status: "complete", required: false, evidence: "notice-v1.eml" },
    ],
    complianceNotes: [
      {
        id: "cn-3",
        author: "M. Patel",
        role: "Compliance officer",
        body: "3 of 5 SOC2 artifacts gathered. Need data-residency confirmation from infra.",
        at: "May 23 10:00",
        tag: "policy",
      },
      {
        id: "cn-4",
        author: "S. Iyer",
        role: "Enterprise admin",
        body: "Initiated scope-amendment with customer legal team.",
        at: "May 22 16:00",
        tag: "context",
      },
    ],
    priorRestrictions: [
      { id: "pr-1", kind: "Data residency review", at: "2026-03-12", resolution: "Released after policy update" },
    ],
    operationalImpact: {
      summary: "Helios-Vault export milestone paused; customer reporting at risk.",
      tier: "high",
      blocksDownstream: 3,
      affectedAreas: ["Export milestone", "Customer reporting", "Quarterly close"],
      estDelayHours: 96,
    },
    timeline: [
      { id: "ht-10", timestamp: "May 21 14:00", actor: "M. Patel · Compliance", action: "Hold placed", detail: "SOC2 evidence collection initiated", category: "governance" },
      { id: "ht-11", timestamp: "May 23 10:00", actor: "M. Patel · Compliance", action: "Evidence partial", detail: "3 of 5 SOC2 artifacts gathered", category: "policy" },
    ],
    nextAction: "submit_evidence",
    isOverdue: false,
    ai: {
      summary:
        "Two of five SOC2 artifacts outstanding. Data-residency proof is the primary blocker.",
      riskScore: 68,
      confidence: 84,
      recommendation: "Coordinate with infra to produce residency proof · accelerate scope amendment.",
      tags: ["soc2", "scope-creep"],
    },
  },
  {
    id: "hold-4480",
    reviewId: "r-4480",
    task: {
      title: "Auth tokens rotation script",
      project: "Acme-Helios",
      portfolio: "Security",
      priority: "P1",
    },
    contributor: { code: "c4480", reliability: 76, priorRestrictions: 0 },
    category: "policy_violation",
    state: "under_review",
    governanceSeverity: "high",
    policyRisk: "critical",
    raisedBy: "T. Rao · Security",
    raisedAt: "2026-05-23 08:00",
    ageHours: 10,
    owner: { name: "T. Rao · Security officer", role: "Security officer", tier: "security", since: "2026-05-23 08:00" },
    expectedRelease: "2026-05-24",
    description:
      "Token-issuance code path potentially exposes a privilege-escalation vector via shared signing secret. Security review must validate before release.",
    restrictedActions: ["Accept", "Reject", "Deploy"],
    releaseConditions: [
      "Static analysis report (clean)",
      "Penetration test results",
      "Security officer sign-off",
      "Per-issuer secret refactor verified",
    ],
    releaseApprovalChain: [
      { tier: "security", owner: "T. Rao", required: true, status: "pending", note: "Manual review in progress." },
      { tier: "compliance", owner: "M. Patel", required: false, status: "skipped" },
    ],
    releaseDependencies: [
      { label: "Pen test results", kind: "external", status: "pending", detail: "Scheduled May 24" },
      { label: "Per-issuer refactor", kind: "internal", status: "blocked", detail: "Requires contributor rework" },
      { label: "Security sign-off", kind: "approval", status: "pending", detail: "Pending T. Rao review" },
    ],
    policyRefs: [
      { id: "p-sec-4", label: "Security review SOP v4", authority: "internal" },
      { id: "p-tok", label: "Token issuance policy v3", authority: "internal" },
    ],
    auditRequirements: [
      { id: "ar-20", label: "Static analysis report", status: "complete", required: true, evidence: "static-analysis-v2.json" },
      { id: "ar-21", label: "Threat model", status: "complete", required: true, evidence: "threat-model.md" },
      { id: "ar-22", label: "Pen test results", status: "missing", required: true },
    ],
    complianceNotes: [
      {
        id: "cn-5",
        author: "T. Rao",
        role: "Security officer",
        body: "Static analysis clean · manual review continues · pen test scheduled.",
        at: "May 23 12:00",
        tag: "audit",
      },
    ],
    priorRestrictions: [],
    operationalImpact: {
      summary: "Acme token rotation rollout paused; affects 6 downstream services.",
      tier: "critical",
      blocksDownstream: 6,
      affectedAreas: ["Acme token rotation", "Service auth chain"],
      estDelayHours: 24,
    },
    timeline: [
      { id: "ht-20", timestamp: "May 23 08:00", actor: "T. Rao · Security", action: "Hold placed", detail: "Security review initiated", category: "governance" },
      { id: "ht-21", timestamp: "May 23 12:00", actor: "T. Rao · Security", action: "Static analysis run", detail: "Clean · manual review continues", category: "policy" },
    ],
    nextAction: "request_signoff",
    isOverdue: false,
    ai: {
      summary:
        "Shared-secret rotation window introduces a 12-second exposure where any process can mint a privileged token.",
      riskScore: 84,
      confidence: 79,
      recommendation: "Block · require per-issuer secret + audit trail before release.",
      tags: ["privilege-escalation", "secret-management"],
    },
  },
  {
    id: "hold-1142",
    reviewId: "r-1142",
    task: {
      title: "Refactor billing service",
      project: "Acme-Helios",
      portfolio: "Payments",
      priority: "P0",
    },
    contributor: { code: "c1142", reliability: 71, priorRestrictions: 3 },
    category: "fraud_risk",
    state: "under_review",
    governanceSeverity: "high",
    policyRisk: "critical",
    raisedBy: "AI v3.2 · Conduct review",
    raisedAt: "2026-05-23 09:42",
    ageHours: 8,
    owner: { name: "Conduct review · Rajesh V.", role: "Mentor (conduct chair)", tier: "policy_council", since: "2026-05-23 09:42" },
    expectedRelease: "2026-05-24",
    description:
      "Plagiarism finding (3 utility functions, 88% overlap). Conduct review escalated due to repeat-offender history.",
    restrictedActions: ["Accept", "Reassign", "Pay out"],
    releaseConditions: [
      "Conduct council ruling",
      "Contributor response on file",
      "AI plagiarism report acknowledged",
      "Repeat-failure pattern reviewed",
    ],
    releaseApprovalChain: [
      { tier: "policy_council", owner: "Rajesh V.", required: true, status: "pending", note: "Manual overlap inspection in progress." },
      { tier: "legal", owner: "J. Khan", required: false, status: "skipped" },
    ],
    releaseDependencies: [
      { label: "Contributor rebuttal", kind: "evidence", status: "satisfied", detail: "v1 submitted May 23 11:02" },
      { label: "Overlap manual inspection", kind: "internal", status: "pending", detail: "By R. Verma" },
      { label: "Conduct ruling", kind: "approval", status: "pending", detail: "Council decision" },
    ],
    policyRefs: [
      { id: "p-plag", label: "Plagiarism policy v2.1", authority: "internal" },
      { id: "p-conduct", label: "Conduct review SOP v3", authority: "internal" },
    ],
    auditRequirements: [
      { id: "ar-30", label: "AI plagiarism report", status: "complete", required: true, evidence: "plag-report-r-1142.pdf" },
      { id: "ar-31", label: "Contributor rebuttal", status: "complete", required: true, evidence: "rebuttal-v1.md" },
      { id: "ar-32", label: "Manual overlap analysis", status: "in_progress", required: true },
    ],
    complianceNotes: [
      {
        id: "cn-6",
        author: "Rajesh V.",
        role: "Mentor",
        body: "Reviewing matched functions against shared public examples to verify originality threshold.",
        at: "May 23 11:14",
        tag: "decision",
      },
    ],
    priorRestrictions: [
      { id: "pr-2", kind: "Quality dispute", at: "2026-05-10", resolution: "Upheld" },
      { id: "pr-3", kind: "Spec ambiguity", at: "2026-04-22", resolution: "In favor of reviewer" },
    ],
    operationalImpact: {
      summary: "Acme billing release v2 paused; conduct ruling may trigger legal follow-up.",
      tier: "critical",
      blocksDownstream: 4,
      affectedAreas: ["Acme billing v2", "Payments compliance audit", "Contributor reputation"],
      estDelayHours: 36,
    },
    timeline: [
      { id: "ht-30", timestamp: "May 23 09:42", actor: "AI v3.2", action: "Conduct hold raised", detail: "Plagiarism cluster + repeat offender", category: "ai" },
      { id: "ht-31", timestamp: "May 23 11:14", actor: "Rajesh V.", action: "Investigation opened", detail: "Manual overlap inspection", category: "human" },
    ],
    nextAction: "issue_release",
    isOverdue: false,
    ai: {
      summary:
        "Overlap exceeds platform threshold of 60% on 3 functions. Contributor's idiomatic-pattern defense is unsupported by the matched segments.",
      riskScore: 88,
      confidence: 84,
      recommendation: "Uphold plagiarism finding · escalate to conduct ruling.",
      tags: ["plagiarism", "repeat-offender"],
    },
  },
  {
    id: "hold-6620",
    reviewId: "r-6620",
    task: {
      title: "Notification queue v2",
      project: "Atlas-Insights",
      portfolio: "Platform",
      priority: "P1",
    },
    contributor: { code: "c6620", reliability: 53, priorRestrictions: 4 },
    category: "fraud_risk",
    state: "open",
    governanceSeverity: "high",
    policyRisk: "high",
    raisedBy: "AI v3.2",
    raisedAt: "2026-05-22 18:00",
    ageHours: 22,
    owner: { name: "Rajesh V.", role: "Mentor", tier: "policy_council", since: "2026-05-22 18:20" },
    expectedRelease: "2026-05-25",
    description:
      "Sustained rapid-resubmit pattern + reliability ▼ 15 over 7 days. AI flags possible automated submissions.",
    restrictedActions: ["Accept", "Pay out"],
    releaseConditions: [
      "Live contributor demo recorded",
      "Cadence anomaly cleared by AI v3.2 re-evaluation",
      "Conduct council acknowledgment",
    ],
    releaseApprovalChain: [
      { tier: "policy_council", owner: "Rajesh V.", required: true, status: "pending" },
      { tier: "audit", owner: "Audit committee", required: false, status: "skipped" },
    ],
    releaseDependencies: [
      { label: "Live contributor demo", kind: "external", status: "pending", detail: "Awaiting contributor scheduling" },
      { label: "AI re-evaluation", kind: "internal", status: "blocked", detail: "Requires demo data" },
    ],
    policyRefs: [
      { id: "p-conduct-2", label: "Conduct policy v2.4", authority: "internal" },
      { id: "p-auto", label: "Automation policy v1", authority: "internal" },
    ],
    auditRequirements: [
      { id: "ar-40", label: "AI cadence analysis", status: "complete", required: true, evidence: "cadence-analysis.json" },
      { id: "ar-41", label: "Contributor live demo", status: "missing", required: true },
    ],
    complianceNotes: [
      {
        id: "cn-7",
        author: "AI v3.2",
        role: "Model",
        body: "Cadence pattern matches automation signature with 88% similarity.",
        at: "May 22 18:00",
        tag: "audit",
      },
    ],
    priorRestrictions: [
      { id: "pr-4", kind: "Conduct review", at: "2026-04-30", resolution: "Verbal warning" },
      { id: "pr-5", kind: "Quality dispute", at: "2026-04-14", resolution: "Upheld" },
    ],
    operationalImpact: {
      summary: "Atlas pool trust impacted; broader contributor audit may follow.",
      tier: "high",
      blocksDownstream: 1,
      affectedAreas: ["Atlas-Insights pool", "Contributor reputation system"],
      estDelayHours: 12,
    },
    timeline: [
      { id: "ht-40", timestamp: "May 22 18:00", actor: "AI v3.2", action: "Fraud risk raised", detail: "Rapid-resubmit cluster", category: "ai" },
      { id: "ht-41", timestamp: "May 22 18:20", actor: "Rajesh V.", action: "Investigation opened", detail: "Manual cadence review", category: "human" },
    ],
    nextAction: "submit_evidence",
    isOverdue: false,
    ai: {
      summary:
        "Submission cadence matches automation signature. Manual confirmation via contributor demo recommended.",
      riskScore: 76,
      confidence: 82,
      recommendation: "Require live contributor demo · pause future submissions until verified.",
      tags: ["automation", "timing-anomaly"],
    },
  },
  {
    id: "hold-9810",
    reviewId: "r-9810",
    task: {
      title: "Internal payroll connector",
      project: "Stratum-Pay",
      portfolio: "Finance",
      priority: "P0",
    },
    contributor: { code: "c9810", reliability: 82, priorRestrictions: 0 },
    category: "audit_investigation",
    state: "awaiting_signoff",
    governanceSeverity: "high",
    policyRisk: "high",
    raisedBy: "Audit · L. Bhat",
    raisedAt: "2026-05-19 11:00",
    ageHours: 99,
    owner: { name: "L. Bhat · Audit lead", role: "Audit officer", tier: "audit", since: "2026-05-19 11:00" },
    expectedRelease: "2026-05-30",
    description:
      "Internal audit investigation into payroll-data handling. Connector pulls fields outside the audited scope.",
    restrictedActions: ["Accept", "Deploy", "Reassign"],
    releaseConditions: [
      "Audit evidence pack complete",
      "Audit committee sign-off",
      "Updated data access matrix",
    ],
    releaseApprovalChain: [
      { tier: "audit", owner: "L. Bhat", required: true, status: "pending", note: "Evidence pack 70% complete." },
      { tier: "compliance", owner: "M. Patel", required: true, status: "pending" },
      { tier: "executive", owner: "C. Doshi · COO", required: true, status: "pending" },
    ],
    releaseDependencies: [
      { label: "Evidence pack", kind: "evidence", status: "pending", detail: "7 of 10 items collected" },
      { label: "Data access matrix v2", kind: "internal", status: "pending", detail: "Drafted by infra" },
      { label: "Audit committee", kind: "approval", status: "pending", detail: "Next meeting May 28" },
    ],
    policyRefs: [
      { id: "p-aud-1", label: "Internal audit policy v3", authority: "internal" },
      { id: "p-access", label: "Data access matrix policy", authority: "internal" },
    ],
    auditRequirements: [
      { id: "ar-50", label: "Access log review", status: "complete", required: true },
      { id: "ar-51", label: "Field-level audit", status: "in_progress", required: true },
      { id: "ar-52", label: "Connector code review", status: "complete", required: true },
      { id: "ar-53", label: "Audit committee approval", status: "missing", required: true },
    ],
    complianceNotes: [
      {
        id: "cn-8",
        author: "L. Bhat",
        role: "Audit officer",
        body: "Field-level audit underway; expect completion by May 27.",
        at: "May 22 14:30",
        tag: "audit",
      },
    ],
    priorRestrictions: [],
    operationalImpact: {
      summary: "Stratum payroll rollout paused; finance ops dependent on this connector.",
      tier: "high",
      blocksDownstream: 2,
      affectedAreas: ["Stratum payroll", "Finance operations"],
      estDelayHours: 120,
    },
    timeline: [
      { id: "ht-50", timestamp: "May 19 11:00", actor: "L. Bhat · Audit", action: "Hold placed", detail: "Audit investigation opened", category: "governance" },
      { id: "ht-51", timestamp: "May 21 09:00", actor: "L. Bhat · Audit", action: "Evidence pack started", detail: "10-item checklist initiated", category: "policy" },
      { id: "ht-52", timestamp: "May 22 14:30", actor: "L. Bhat · Audit", action: "Progress update", detail: "70% evidence collected", category: "policy" },
    ],
    nextAction: "request_signoff",
    isOverdue: false,
    ai: {
      summary:
        "Connector accesses 3 fields outside the audited scope. Out-of-scope access pattern matches prior audit-investigation triggers.",
      riskScore: 70,
      confidence: 86,
      recommendation: "Block release until audit committee sign-off; freeze scope.",
      tags: ["audit-investigation", "out-of-scope-access"],
    },
  },
  {
    id: "hold-7702",
    reviewId: "r-7702",
    task: {
      title: "Enterprise SSO integration",
      project: "Acme-Helios",
      portfolio: "Identity",
      priority: "P1",
    },
    contributor: { code: "c7702", reliability: 85, priorRestrictions: 0 },
    category: "workflow_restriction",
    state: "open",
    governanceSeverity: "medium",
    policyRisk: "medium",
    raisedBy: "S. Iyer · Enterprise admin",
    raisedAt: "2026-05-22 16:40",
    ageHours: 30,
    owner: { name: "S. Iyer · Enterprise admin", role: "Enterprise admin", tier: "policy_council", since: "2026-05-22 16:40" },
    expectedRelease: "2026-05-26",
    description:
      "Customer contract amendment in progress; SSO scope expansion paused pending contract sign-off.",
    restrictedActions: ["Accept", "Deploy"],
    releaseConditions: [
      "Contract amendment signed",
      "Customer notification sent",
      "Enterprise admin sign-off",
    ],
    releaseApprovalChain: [
      { tier: "policy_council", owner: "S. Iyer", required: true, status: "pending", note: "Awaiting contract sign-off." },
    ],
    releaseDependencies: [
      { label: "Contract amendment", kind: "external", status: "pending", detail: "Customer legal team reviewing" },
      { label: "Customer notification", kind: "evidence", status: "satisfied", detail: "Drafted; pending send" },
    ],
    policyRefs: [
      { id: "p-contract", label: "Contract change SOP", authority: "contractual" },
    ],
    auditRequirements: [
      { id: "ar-60", label: "Amendment draft", status: "complete", required: true, evidence: "amendment-v1.pdf" },
      { id: "ar-61", label: "Customer counter-signature", status: "missing", required: true },
    ],
    complianceNotes: [
      {
        id: "cn-9",
        author: "S. Iyer",
        role: "Enterprise admin",
        body: "Customer counter-signature expected this week.",
        at: "May 23 09:30",
        tag: "context",
      },
    ],
    priorRestrictions: [],
    operationalImpact: {
      summary: "SSO rollout paused; affects 2 customer onboarding flows.",
      tier: "medium",
      blocksDownstream: 2,
      affectedAreas: ["SSO rollout", "Customer onboarding"],
      estDelayHours: 48,
    },
    timeline: [
      { id: "ht-60", timestamp: "May 22 16:40", actor: "S. Iyer", action: "Workflow restriction placed", detail: "Awaiting contract amendment", category: "governance" },
    ],
    nextAction: "await_external",
    isOverdue: false,
    awaitingExternal: "Customer counter-signature",
    ai: {
      summary:
        "Hold bounded by external counter-signature. Internal readiness is high.",
      riskScore: 36,
      confidence: 88,
      recommendation: "Monitor · poll customer legal weekly.",
      tags: ["contract-amendment"],
    },
  },
  {
    id: "hold-8120",
    reviewId: "r-8120",
    task: {
      title: "Pricing model rewrite",
      project: "Stratum-Pay",
      portfolio: "Pricing",
      priority: "P0",
    },
    contributor: { code: "c8120", reliability: 88, priorRestrictions: 0 },
    category: "executive_review",
    state: "under_review",
    governanceSeverity: "high",
    policyRisk: "high",
    raisedBy: "C. Doshi · COO",
    raisedAt: "2026-05-21 09:00",
    ageHours: 76,
    owner: { name: "C. Doshi · COO", role: "Executive", tier: "executive", since: "2026-05-21 09:00" },
    expectedRelease: "2026-05-28",
    description:
      "Executive governance review of pricing-model changes. Impact on enterprise tier exceeds variance threshold.",
    restrictedActions: ["Accept", "Deploy", "Communicate"],
    releaseConditions: [
      "Executive approval recorded",
      "Variance impact documented",
      "Customer communication plan signed off",
    ],
    releaseApprovalChain: [
      { tier: "executive", owner: "C. Doshi · COO", required: true, status: "pending" },
      { tier: "policy_council", owner: "Rajesh V.", required: true, status: "pending" },
      { tier: "legal", owner: "J. Khan", required: false, status: "skipped" },
    ],
    releaseDependencies: [
      { label: "Executive review meeting", kind: "approval", status: "pending", detail: "Scheduled May 27" },
      { label: "Variance impact memo", kind: "evidence", status: "satisfied", detail: "Submitted v1" },
      { label: "Customer comms plan", kind: "evidence", status: "pending", detail: "PMM drafting" },
    ],
    policyRefs: [
      { id: "p-exec", label: "Executive review policy v1", authority: "internal" },
    ],
    auditRequirements: [
      { id: "ar-70", label: "Variance impact memo", status: "complete", required: true, evidence: "variance-memo-v1.pdf" },
      { id: "ar-71", label: "Customer comms plan", status: "in_progress", required: true },
      { id: "ar-72", label: "Executive sign-off record", status: "missing", required: true },
    ],
    complianceNotes: [
      {
        id: "cn-10",
        author: "C. Doshi",
        role: "COO",
        body: "Reviewing variance against last 4 quarters · meeting set for May 27.",
        at: "May 22 17:00",
        tag: "decision",
      },
    ],
    priorRestrictions: [],
    operationalImpact: {
      summary: "Pricing-model rollout paused; affects Q3 GTM messaging.",
      tier: "high",
      blocksDownstream: 3,
      affectedAreas: ["Pricing rollout", "GTM messaging", "Sales enablement"],
      estDelayHours: 72,
    },
    timeline: [
      { id: "ht-70", timestamp: "May 21 09:00", actor: "C. Doshi", action: "Executive review opened", detail: "Variance exceeds threshold", category: "governance" },
      { id: "ht-71", timestamp: "May 22 17:00", actor: "C. Doshi", action: "Progress note", detail: "Meeting set for May 27", category: "policy" },
    ],
    nextAction: "request_signoff",
    isOverdue: false,
    ai: {
      summary:
        "Variance exceeds historical 4-quarter band by 18%. Customer comms plan is the critical-path dependency.",
      riskScore: 64,
      confidence: 80,
      recommendation: "Accelerate comms plan completion to unblock executive meeting.",
      tags: ["pricing", "executive-review"],
    },
  },
];

/* ────────────────── Priority buckets ────────────────── */

export type HoldPriorityBucketKey = HoldOpsCategory;

export interface HoldPriorityBucket {
  key: HoldPriorityBucketKey;
  label: string;
  caption: string;
  predicate: (r: HoldOpsRow) => boolean;
  tone: "danger" | "warn" | "info" | "neutral";
}

export const holdPriorityBuckets: HoldPriorityBucket[] = [
  {
    key: "compliance_review",
    label: "Compliance Review",
    caption: "Regulatory / SOC2 / GDPR review",
    predicate: (r) => r.category === "compliance_review",
    tone: "warn",
  },
  {
    key: "policy_violation",
    label: "Policy Violation",
    caption: "Internal policy breach holds",
    predicate: (r) => r.category === "policy_violation",
    tone: "danger",
  },
  {
    key: "audit_investigation",
    label: "Audit Investigation",
    caption: "Internal audit · evidence collection",
    predicate: (r) => r.category === "audit_investigation",
    tone: "warn",
  },
  {
    key: "fraud_risk",
    label: "Fraud Risk",
    caption: "Conduct · automation · plagiarism",
    predicate: (r) => r.category === "fraud_risk",
    tone: "danger",
  },
  {
    key: "workflow_restriction",
    label: "Workflow Restriction",
    caption: "Contract or operational restriction",
    predicate: (r) => r.category === "workflow_restriction",
    tone: "info",
  },
  {
    key: "executive_review",
    label: "Executive Review",
    caption: "Executive-tier governance review",
    predicate: (r) => r.category === "executive_review",
    tone: "neutral",
  },
];

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

export const holdAiAggregates: HoldAiAggregate[] = [
  {
    id: "hai-1",
    title: "Compliance anomaly cluster · Privacy holds",
    summary:
      "Two privacy holds (hold-5520, hold-3208) share residency-proof gaps. Consider grouped escalation to compliance.",
    recommendation: "Open a joint compliance ticket; share evidence between cases.",
    riskScore: 68,
    confidence: 84,
    affects: ["hold-5520", "hold-3208"],
    kind: "compliance_anomaly",
    generatedAt: "13:42",
  },
  {
    id: "hai-2",
    title: "Fraud cluster · automation + plagiarism",
    summary:
      "Two fraud holds (hold-1142, hold-6620) show overlapping contributor-risk fingerprints.",
    recommendation: "Escalate both to conduct council in a single agenda item.",
    riskScore: 84,
    confidence: 88,
    affects: ["hold-1142", "hold-6620"],
    kind: "fraud_cluster",
    generatedAt: "12:18",
  },
  {
    id: "hai-3",
    title: "Release risk · pen-test bottleneck",
    summary:
      "hold-4480 awaits pen-test results. Pen-test slots are full this week — release will slip 24h.",
    recommendation: "Pre-book pen-test slot or accept pre-approval contingent on results.",
    riskScore: 62,
    confidence: 81,
    affects: ["hold-4480"],
    kind: "release_risk",
    generatedAt: "11:10",
  },
  {
    id: "hai-4",
    title: "Reliability drift · c6620",
    summary:
      "Contributor reliability dropped 15 points in 7 days. Automation signals reinforce hold-6620.",
    recommendation: "Increase scrutiny on future submissions from c6620.",
    riskScore: 76,
    confidence: 82,
    affects: ["hold-6620"],
    kind: "reliability_drift",
    generatedAt: "10:42",
  },
  {
    id: "hai-5",
    title: "Operational risk · audit backlog",
    summary:
      "hold-9810 audit-evidence completion at 70%; audit committee meets May 28. Release likely slips beyond ETA.",
    recommendation: "Allocate audit-ops capacity to close evidence gap before May 27.",
    riskScore: 58,
    confidence: 79,
    affects: ["hold-9810"],
    kind: "operational_risk",
    generatedAt: "09:30",
  },
];

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
