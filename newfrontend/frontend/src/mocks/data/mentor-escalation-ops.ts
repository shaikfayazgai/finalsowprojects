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

export const escalationOpsRows: EscalationOpsRow[] = [
  {
    id: "esc-7821",
    reviewId: "r-3902",
    task: {
      title: "Auth modal redesign",
      project: "BetaCo",
      portfolio: "Identity",
      priority: "P1",
    },
    contributor: {
      code: "c5102",
      reliability: 64,
      reliabilityTrend: -4,
      priorEscalations: 2,
      reworkCount7d: 3,
      fraudSignals: [],
    },
    category: "policy_review",
    state: "awaiting_ruling",
    governanceSeverity: "high",
    policyRisk: "high",
    raisedBy: "R. Verma",
    raisedAt: "2026-05-23 09:14",
    ageHours: 5,
    resolutionSlaHours: 24,
    hoursRemaining: 6,
    pausedReview: true,
    owner: { name: "You · Rajesh V.", role: "Mentor", since: "2026-05-23 10:02" },
    routingChain: [
      {
        tier: "reviewer_pool_lead",
        owner: "K. Singh",
        receivedAt: "2026-05-23 09:14",
        status: "passed",
        note: "Spec authority needed; beyond reviewer-pool scope.",
      },
      {
        tier: "mentor",
        owner: "Rajesh V.",
        receivedAt: "2026-05-23 10:02",
        status: "in_review",
        note: "Consulting product owner on §4.2 vs §4.7.",
      },
    ],
    description:
      "Spec §4.2 conflicts with §4.7 on session-timeout behavior after step-up auth. Contributor's interpretation differs from reviewer's. Product owner ruling required before round-3 acceptance.",
    evidence: [
      { label: "Frozen submission snapshot · r-3902", size: "2.1 MB", status: "ok" },
      { label: "Spec annotated · auth.pdf", size: "1.4 MB", status: "ok" },
      { label: "Contributor Q&A thread", size: "12 KB", status: "ok" },
      { label: "Product owner statement", size: "—", status: "pending" },
    ],
    evidenceConcerns: [
      {
        label: "Spec inconsistency",
        severity: "high",
        detail: "§4.2 and §4.7 prescribe different post-step-up timeout behaviors.",
      },
      {
        label: "Round-3 risk",
        severity: "medium",
        detail: "Third consecutive rework round; auto-escalation already triggered.",
      },
    ],
    policyRefs: ["Spec governance §2", "Step-up auth policy v1.4"],
    governanceNotes: [
      {
        id: "gn-1",
        author: "R. Verma",
        role: "Mentor",
        body: "Spec sections clash. Product owner must rule before any decision lands.",
        at: "May 23 10:02",
        tag: "context",
      },
      {
        id: "gn-2",
        author: "K. Singh",
        role: "Pool lead",
        body: "Out of scope at pool tier — passing up.",
        at: "May 23 09:42",
        tag: "decision",
      },
    ],
    priorEscalations: [
      {
        id: "esc-7019",
        type: "Quality dispute",
        resolution: "Reassigned to fresh reviewer",
        at: "2026-04-12",
      },
    ],
    operationalImpact: {
      summary: "Blocks BetaCo auth release v3 + dependent SDK upgrade rollout.",
      tier: "high",
      blocksDownstream: 2,
      affectedAreas: ["BetaCo auth release", "Client SDK v8.2", "Step-up auth rollout"],
      estDelayHours: 18,
    },
    timeline: [
      { id: "etl-1", timestamp: "May 23 09:14", actor: "R. Verma", action: "Escalation raised", detail: "Spec ambiguity · round 3 reached", category: "human" },
      { id: "etl-2", timestamp: "May 23 09:14", actor: "System", action: "Review paused", detail: "SLA timer suspended", category: "system" },
      { id: "etl-3", timestamp: "May 23 09:42", actor: "K. Singh", action: "Routed up", detail: "Passed to mentor tier", category: "governance" },
      { id: "etl-4", timestamp: "May 23 10:02", actor: "Rajesh V.", action: "Claimed", detail: "Mentor lock acquired", category: "human" },
      { id: "etl-5", timestamp: "May 23 11:40", actor: "Rajesh V.", action: "Product owner consulted", detail: "Awaiting spec authority response", category: "governance" },
    ],
    nextAction: "issue_ruling",
    isOverdue: false,
    isBlocked: false,
    ai: {
      summary:
        "Two spec sections prescribe conflicting behaviors. The contributor's interpretation matches §4.7 (latest revision); reviewer cites §4.2 (older). Recommend ruling in favor of latest revision pending product owner confirmation.",
      riskScore: 64,
      confidence: 81,
      recommendation: "Resolve in favor of newer spec section; document policy amendment.",
      tags: ["spec-ambiguity", "policy-gap"],
    },
  },
  {
    id: "esc-7826",
    reviewId: "r-1142",
    task: {
      title: "Refactor billing service",
      project: "Acme-Helios",
      portfolio: "Payments",
      priority: "P0",
    },
    contributor: {
      code: "c1142",
      reliability: 71,
      reliabilityTrend: -8,
      priorEscalations: 3,
      reworkCount7d: 3,
      fraudSignals: ["plagiarism-pattern"],
    },
    category: "contributor_fraud",
    state: "investigating",
    governanceSeverity: "high",
    policyRisk: "critical",
    raisedBy: "c1142",
    raisedAt: "2026-05-23 11:02",
    ageHours: 3,
    resolutionSlaHours: 24,
    hoursRemaining: 14,
    pausedReview: false,
    owner: { name: "You · Rajesh V.", role: "Mentor", since: "2026-05-23 11:05" },
    routingChain: [
      { tier: "mentor", owner: "Rajesh V.", receivedAt: "2026-05-23 11:02", status: "in_review" },
    ],
    description:
      "Contributor disputes rejection rationale and plagiarism finding. Claims the 88% utility-function overlap reflects common idiomatic patterns, not derivative work. Conduct investigation needed.",
    evidence: [
      { label: "AI plagiarism report · 88% match", size: "84 KB", status: "ok" },
      { label: "Contributor rebuttal · v1", size: "16 KB", status: "ok" },
      { label: "Source-code overlap excerpt", size: "8 KB", status: "ok" },
    ],
    evidenceConcerns: [
      {
        label: "Plagiarism pattern",
        severity: "high",
        detail: "Three utility functions match a single public repository at 88%.",
      },
      {
        label: "Repeat-failure history",
        severity: "medium",
        detail: "Contributor c1142 has 3 rework rounds and 3 prior escalations in 30 days.",
      },
    ],
    policyRefs: ["Plagiarism policy v2.1", "Conduct review SOP v3"],
    governanceNotes: [
      {
        id: "gn-3",
        author: "c1142",
        role: "Contributor",
        body: "I dispute the finding. Common idioms shouldn't trigger a plagiarism flag.",
        at: "May 23 11:02",
        tag: "context",
      },
      {
        id: "gn-4",
        author: "R. Verma",
        role: "Mentor",
        body: "Will review the matched functions against shared public examples to verify originality threshold.",
        at: "May 23 11:14",
        tag: "consult",
      },
    ],
    priorEscalations: [
      {
        id: "esc-6601",
        type: "Quality dispute",
        resolution: "Upheld original ruling",
        at: "2026-05-10",
      },
      {
        id: "esc-6420",
        type: "Spec ambiguity",
        resolution: "Resolved in favor of reviewer",
        at: "2026-04-22",
      },
    ],
    operationalImpact: {
      summary: "Acme billing release v2 paused; legal review may follow if conduct finding holds.",
      tier: "critical",
      blocksDownstream: 4,
      affectedAreas: ["Acme billing v2", "Payments compliance audit", "Contributor reputation"],
      estDelayHours: 36,
    },
    timeline: [
      { id: "etl-10", timestamp: "May 23 11:02", actor: "c1142", action: "Dispute raised", detail: "Contributor rebuts plagiarism finding", category: "human" },
      { id: "etl-11", timestamp: "May 23 11:05", actor: "System", action: "Routed to mentor", detail: "Quality-dispute auto-routes mentor tier", category: "system" },
      { id: "etl-12", timestamp: "May 23 11:14", actor: "Rajesh V.", action: "Investigation opened", detail: "Manual overlap inspection", category: "governance" },
    ],
    nextAction: "investigate_evidence",
    isOverdue: false,
    isBlocked: false,
    ai: {
      summary:
        "Plagiarism overlap (88%) on 3 functions exceeds the platform threshold of 60%. Contributor's idiomatic-pattern defense is unsupported by the matched code segments. Recommend conduct ruling, not waiver.",
      riskScore: 88,
      confidence: 84,
      recommendation: "Uphold plagiarism finding · escalate to conduct review.",
      tags: ["plagiarism", "repeat-offender"],
    },
  },
  {
    id: "esc-7901",
    reviewId: "r-3208",
    task: {
      title: "Customer export pipeline",
      project: "Helios-Vault",
      portfolio: "Privacy",
      priority: "P0",
    },
    contributor: {
      code: "c3208",
      reliability: 74,
      reliabilityTrend: 1,
      priorEscalations: 0,
      reworkCount7d: 1,
      fraudSignals: [],
    },
    category: "compliance_violation",
    state: "consulting",
    governanceSeverity: "high",
    policyRisk: "high",
    raisedBy: "M. Patel",
    raisedAt: "2026-05-21 14:00",
    ageHours: 50,
    resolutionSlaHours: 144,
    hoursRemaining: 94,
    pausedReview: true,
    owner: { name: "M. Patel · Compliance", role: "Compliance officer", since: "2026-05-21 14:00" },
    routingChain: [
      { tier: "mentor", owner: "Rajesh V.", receivedAt: "2026-05-21 13:30", status: "passed", note: "SOC2 scope; passed to compliance." },
      { tier: "compliance_officer", owner: "M. Patel", receivedAt: "2026-05-21 14:00", status: "in_review", note: "Evidence gathering in progress." },
    ],
    description:
      "Export route ingests financial fields outside the original SOW scope. SOC2 evidence pack required before any data flows to staging.",
    evidence: [
      { label: "Original SOW · scope diff", size: "240 KB", status: "ok" },
      { label: "SOC2 control mapping", size: "—", status: "pending" },
      { label: "Data residency analysis", size: "—", status: "pending" },
    ],
    evidenceConcerns: [
      {
        label: "Out-of-scope data export",
        severity: "high",
        detail: "Financial fields not in SOW Annex A · scope expansion requires amendment.",
      },
      {
        label: "Residency boundary",
        severity: "medium",
        detail: "Export endpoint resolves through US edge; EU customer data must remain in EU.",
      },
    ],
    policyRefs: ["SOC2 CC6.7", "Data residency policy v2", "Scope-amendment SOP"],
    governanceNotes: [
      {
        id: "gn-5",
        author: "M. Patel",
        role: "Compliance officer",
        body: "Three of five SOC2 artifacts gathered. Need data-residency confirmation from infra.",
        at: "May 23 10:00",
        tag: "policy",
      },
    ],
    priorEscalations: [],
    operationalImpact: {
      summary: "Helios-Vault export milestone paused. Customer reporting downstream at risk.",
      tier: "high",
      blocksDownstream: 3,
      affectedAreas: ["Helios export milestone", "Customer reporting", "Quarterly close"],
      estDelayHours: 96,
    },
    timeline: [
      { id: "etl-20", timestamp: "May 21 14:00", actor: "M. Patel", action: "Hold placed", detail: "SOC2 evidence collection initiated", category: "governance" },
      { id: "etl-21", timestamp: "May 22 09:00", actor: "M. Patel", action: "Evidence partial", detail: "1 of 5 SOC2 artifacts collected", category: "policy" },
      { id: "etl-22", timestamp: "May 23 10:00", actor: "M. Patel", action: "Evidence partial", detail: "3 of 5 SOC2 artifacts collected", category: "policy" },
    ],
    nextAction: "route_to_compliance",
    isOverdue: false,
    isBlocked: true,
    ai: {
      summary:
        "Scope diff between SOW Annex A and implementation reveals 3 financial fields that were not authorized. Data residency endpoint resolves outside EU — affects 2 customer records.",
      riskScore: 72,
      confidence: 78,
      recommendation: "Block release · request scope amendment · enforce residency routing.",
      tags: ["soc2", "scope-creep"],
    },
  },
  {
    id: "esc-7910",
    reviewId: "r-4480",
    task: {
      title: "Auth tokens rotation script",
      project: "Acme-Helios",
      portfolio: "Security",
      priority: "P1",
    },
    contributor: {
      code: "c4480",
      reliability: 76,
      reliabilityTrend: 0,
      priorEscalations: 1,
      reworkCount7d: 1,
      fraudSignals: [],
    },
    category: "critical_governance",
    state: "investigating",
    governanceSeverity: "high",
    policyRisk: "critical",
    raisedBy: "T. Rao",
    raisedAt: "2026-05-23 08:00",
    ageHours: 6,
    resolutionSlaHours: 24,
    hoursRemaining: 18,
    pausedReview: true,
    owner: { name: "T. Rao · Security", role: "Security officer", since: "2026-05-23 08:00" },
    routingChain: [
      { tier: "mentor", owner: "Rajesh V.", receivedAt: "2026-05-23 07:30", status: "passed", note: "Security-sensitive · escalated to security review." },
      { tier: "platform_admin", owner: "T. Rao", receivedAt: "2026-05-23 08:00", status: "in_review", note: "Possible privilege escalation vector under review." },
    ],
    description:
      "Token-issuance code path possibly exposes a privilege-escalation vector via shared signing secret. Security review must approve before release.",
    evidence: [
      { label: "Static analysis report", size: "320 KB", status: "ok" },
      { label: "Token flow diagram", size: "180 KB", status: "ok" },
      { label: "Penetration test results", size: "—", status: "pending" },
    ],
    evidenceConcerns: [
      {
        label: "Privilege escalation vector",
        severity: "high",
        detail: "Shared signing secret allows any caller to mint a token in the rotation window.",
      },
    ],
    policyRefs: ["Security review SOP v4", "Token issuance policy v3"],
    governanceNotes: [
      {
        id: "gn-6",
        author: "T. Rao",
        role: "Security officer",
        body: "Static analysis clean · manual review in progress · pen test scheduled.",
        at: "May 23 12:00",
        tag: "policy",
      },
    ],
    priorEscalations: [
      { id: "esc-6118", type: "Spec gap", resolution: "Spec amended", at: "2026-03-04" },
    ],
    operationalImpact: {
      summary: "Acme token rotation rollout paused; affects 6 downstream services.",
      tier: "critical",
      blocksDownstream: 6,
      affectedAreas: ["Acme token rotation", "Service auth chain"],
      estDelayHours: 24,
    },
    timeline: [
      { id: "etl-30", timestamp: "May 23 08:00", actor: "T. Rao", action: "Security review initiated", detail: "Hold placed", category: "governance" },
      { id: "etl-31", timestamp: "May 23 12:00", actor: "T. Rao", action: "Static analysis run", detail: "0 vulnerabilities · manual review ongoing", category: "policy" },
    ],
    nextAction: "request_consultation",
    isOverdue: false,
    isBlocked: true,
    ai: {
      summary:
        "Shared secret rotation window introduces a 12-second exposure where any process can mint a privileged token. Recommend reroll mechanism + per-issuer secret.",
      riskScore: 84,
      confidence: 79,
      recommendation: "Block · require per-issuer secret + audit trail before release.",
      tags: ["privilege-escalation", "secret-management"],
    },
  },
  {
    id: "esc-7935",
    reviewId: "r-7715",
    task: {
      title: "Search relevance ranker",
      project: "BetaCo",
      portfolio: "Discovery",
      priority: "P0",
    },
    contributor: {
      code: "c7715",
      reliability: 58,
      reliabilityTrend: -12,
      priorEscalations: 2,
      reworkCount7d: 4,
      fraudSignals: ["timing-anomaly"],
    },
    category: "sla_breach",
    state: "open",
    governanceSeverity: "high",
    policyRisk: "medium",
    raisedBy: "System",
    raisedAt: "2026-05-23 14:34",
    ageHours: 0,
    resolutionSlaHours: 12,
    hoursRemaining: 12,
    pausedReview: false,
    owner: { name: "Reviewer pool · K. Singh", role: "Pool lead", since: "2026-05-23 14:34" },
    routingChain: [
      { tier: "reviewer_pool_lead", owner: "K. Singh", receivedAt: "2026-05-23 14:34", status: "received" },
    ],
    description:
      "SLA breach risk auto-detected on r-7715 (round 2). Reviewer load + low confidence indicate the item will breach without rebalancing.",
    evidence: [
      { label: "SLA breach forecast", size: "12 KB", status: "ok" },
      { label: "Reviewer capacity snapshot", size: "8 KB", status: "ok" },
    ],
    evidenceConcerns: [
      {
        label: "Reviewer capacity",
        severity: "medium",
        detail: "Assigned reviewer L. Mehta at 120% capacity.",
      },
    ],
    policyRefs: ["Capacity policy v1.0"],
    governanceNotes: [],
    priorEscalations: [],
    operationalImpact: {
      summary: "Item breaches in 1h; pool throughput at risk.",
      tier: "medium",
      blocksDownstream: 0,
      affectedAreas: ["BetaCo pool throughput"],
      estDelayHours: 4,
    },
    timeline: [
      { id: "etl-40", timestamp: "May 23 14:34", actor: "System", action: "SLA breach forecast triggered", detail: "Auto-escalated to pool lead", category: "system" },
    ],
    nextAction: "request_consultation",
    isOverdue: false,
    isBlocked: false,
    ai: {
      summary:
        "Current reviewer over capacity; item will breach within 1h. Reassignment recommended.",
      riskScore: 58,
      confidence: 86,
      recommendation: "Reassign to next available reviewer in pool.",
      tags: ["capacity", "auto-escalation"],
    },
  },
  {
    id: "esc-7950",
    reviewId: "r-6620",
    task: {
      title: "Notification queue v2",
      project: "Atlas-Insights",
      portfolio: "Platform",
      priority: "P1",
    },
    contributor: {
      code: "c6620",
      reliability: 53,
      reliabilityTrend: -15,
      priorEscalations: 4,
      reworkCount7d: 5,
      fraudSignals: ["timing-anomaly", "rapid-resubmit"],
    },
    category: "contributor_fraud",
    state: "investigating",
    governanceSeverity: "high",
    policyRisk: "high",
    raisedBy: "AI v3.2",
    raisedAt: "2026-05-22 18:00",
    ageHours: 22,
    resolutionSlaHours: 48,
    hoursRemaining: 26,
    pausedReview: true,
    owner: { name: "You · Rajesh V.", role: "Mentor", since: "2026-05-22 18:20" },
    routingChain: [
      { tier: "mentor", owner: "Rajesh V.", receivedAt: "2026-05-22 18:20", status: "in_review" },
    ],
    description:
      "Sustained rapid-resubmit pattern + reliability ▼ 15 over 7 days. AI flags possible automated submissions.",
    evidence: [
      { label: "AI timing analysis", size: "60 KB", status: "ok" },
      { label: "Submission cadence chart", size: "44 KB", status: "ok" },
    ],
    evidenceConcerns: [
      {
        label: "Rapid-resubmit cluster",
        severity: "high",
        detail: "5 submissions in 36h with <8 minutes between feedback and resubmission.",
      },
      {
        label: "Reliability decline",
        severity: "medium",
        detail: "Reliability score ▼ 15 across 7 days.",
      },
    ],
    policyRefs: ["Conduct policy v2.4", "Automation policy v1"],
    governanceNotes: [
      {
        id: "gn-7",
        author: "AI v3.2",
        role: "Model",
        body: "Cadence pattern matches an automation signature with 88% similarity.",
        at: "May 22 18:00",
        tag: "consult",
      },
    ],
    priorEscalations: [
      { id: "esc-6109", type: "Conduct review", resolution: "Verbal warning", at: "2026-04-30" },
      { id: "esc-5921", type: "Quality dispute", resolution: "Upheld", at: "2026-04-14" },
    ],
    operationalImpact: {
      summary: "Cross-team trust on Atlas pool affected; broader contributor audit may follow.",
      tier: "high",
      blocksDownstream: 1,
      affectedAreas: ["Atlas-Insights pool", "Contributor reputation system"],
      estDelayHours: 12,
    },
    timeline: [
      { id: "etl-50", timestamp: "May 22 18:00", actor: "AI v3.2", action: "Risk flag raised", detail: "Rapid-resubmit cluster · automation signature", category: "ai" },
      { id: "etl-51", timestamp: "May 22 18:20", actor: "Rajesh V.", action: "Investigation opened", detail: "Manual cadence review", category: "human" },
    ],
    nextAction: "investigate_evidence",
    isOverdue: false,
    isBlocked: false,
    ai: {
      summary:
        "Submission cadence matches automation signature. Manual confirmation recommended via contributor interview + recorded demo.",
      riskScore: 76,
      confidence: 82,
      recommendation: "Request live contributor demo · pause future submissions until verified.",
      tags: ["automation", "timing-anomaly"],
    },
  },
  {
    id: "esc-7960",
    reviewId: "r-5520",
    task: {
      title: "PII redaction module",
      project: "Helios-Vault",
      portfolio: "Privacy",
      priority: "P0",
    },
    contributor: {
      code: "c5520",
      reliability: 79,
      reliabilityTrend: 2,
      priorEscalations: 0,
      reworkCount7d: 1,
      fraudSignals: [],
    },
    category: "operational_blocker",
    state: "blocked",
    governanceSeverity: "medium",
    policyRisk: "medium",
    raisedBy: "System",
    raisedAt: "2026-05-22 09:00",
    ageHours: 30,
    resolutionSlaHours: 72,
    hoursRemaining: 30,
    pausedReview: true,
    owner: { name: "J. Khan · Legal", role: "Legal officer", since: "2026-05-22 09:00" },
    routingChain: [
      { tier: "legal_officer", owner: "J. Khan", receivedAt: "2026-05-22 09:00", status: "in_review" },
    ],
    description:
      "Active legal hold preventing decision on r-5520. Pseudonymization key-rotation classification under legal review.",
    evidence: [
      { label: "External classifier response (Verisign)", size: "—", status: "pending" },
      { label: "Internal classification draft", size: "120 KB", status: "ok" },
    ],
    evidenceConcerns: [
      {
        label: "External dependency",
        severity: "medium",
        detail: "Awaiting external classifier response (Verisign); ETA May 25.",
      },
    ],
    policyRefs: ["GDPR §32 · technical safeguards", "Data classification policy v3.1"],
    governanceNotes: [
      {
        id: "gn-8",
        author: "J. Khan",
        role: "Legal officer",
        body: "Classifier expected to respond by May 25 EOD.",
        at: "May 23 09:00",
        tag: "policy",
      },
    ],
    priorEscalations: [],
    operationalImpact: {
      summary: "Privacy milestone on hold; pseudonymization rollout paused.",
      tier: "medium",
      blocksDownstream: 1,
      affectedAreas: ["Privacy milestone", "PII pseudonymization rollout"],
      estDelayHours: 36,
    },
    timeline: [
      { id: "etl-60", timestamp: "May 22 09:00", actor: "J. Khan", action: "Legal hold placed", detail: "Data sensitivity classification review", category: "governance" },
      { id: "etl-61", timestamp: "May 23 09:00", actor: "J. Khan", action: "Status update", detail: "Awaiting external classifier", category: "policy" },
    ],
    nextAction: "release_block",
    isOverdue: false,
    isBlocked: true,
    ai: {
      summary:
        "Hold is bounded by external dependency. No mentor action needed beyond status check.",
      riskScore: 48,
      confidence: 91,
      recommendation: "Monitor · poll legal team status every 24h.",
      tags: ["legal-hold", "external-dependency"],
    },
  },
  {
    id: "esc-7831",
    reviewId: "r-7715",
    task: {
      title: "Search relevance ranker",
      project: "BetaCo",
      portfolio: "Discovery",
      priority: "P0",
    },
    contributor: {
      code: "c7715",
      reliability: 58,
      reliabilityTrend: -12,
      priorEscalations: 2,
      reworkCount7d: 4,
      fraudSignals: [],
    },
    category: "operational_blocker",
    state: "resolved",
    governanceSeverity: "medium",
    policyRisk: "low",
    raisedBy: "L. Mehta",
    raisedAt: "2026-05-22 16:00",
    ageHours: 24,
    resolutionSlaHours: 24,
    hoursRemaining: 0,
    pausedReview: false,
    owner: { name: "S. Iyer · Enterprise admin", role: "Enterprise admin", since: "2026-05-22 18:00" },
    routingChain: [
      { tier: "reviewer_pool_lead", owner: "K. Singh", receivedAt: "2026-05-22 16:00", status: "passed" },
      { tier: "mentor", owner: "Rajesh V.", receivedAt: "2026-05-22 17:10", status: "passed" },
      { tier: "enterprise_admin", owner: "S. Iyer", receivedAt: "2026-05-22 18:00", status: "resolved", note: "Borrowed 2 reviewers from Helios pool for 5 business days." },
    ],
    description:
      "Reviewer pool at 110% capacity for BetaCo. Resolved by borrowing capacity from Helios pool.",
    evidence: [],
    evidenceConcerns: [],
    policyRefs: ["Capacity policy v1.0"],
    governanceNotes: [],
    priorEscalations: [],
    operationalImpact: {
      summary: "Resolved · 2 reviewers borrowed from Helios pool for 5 business days.",
      tier: "medium",
      blocksDownstream: 0,
      affectedAreas: ["BetaCo pool"],
      estDelayHours: 0,
    },
    timeline: [
      { id: "etl-70", timestamp: "May 22 16:00", actor: "L. Mehta", action: "Escalation raised", detail: "Capacity overload", category: "human" },
      { id: "etl-71", timestamp: "May 22 17:10", actor: "Mentor", action: "Passed up", detail: "Beyond mentor tier", category: "governance" },
      { id: "etl-72", timestamp: "May 22 18:00", actor: "S. Iyer", action: "Resolved", detail: "Borrowed 2 reviewers from Helios pool", category: "governance" },
    ],
    nextAction: "close_resolved",
    isOverdue: false,
    isBlocked: false,
    ai: {
      summary: "Resolution effective. Capacity restored.",
      riskScore: 20,
      confidence: 96,
      recommendation: "Close resolved · monitor pool throughput next 48h.",
      tags: ["resolved"],
    },
  },
];

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

export const priorityBuckets: PriorityBucket[] = [
  {
    key: "critical_governance",
    label: "Critical Governance",
    caption: "Highest-stakes policy risk",
    predicate: (r) => r.category === "critical_governance",
    tone: "danger",
  },
  {
    key: "compliance_violation",
    label: "Compliance Violations",
    caption: "SOC2 · GDPR · regulatory",
    predicate: (r) => r.category === "compliance_violation",
    tone: "danger",
  },
  {
    key: "policy_review",
    label: "Policy Review",
    caption: "Spec, conduct, or policy ambiguity",
    predicate: (r) => r.category === "policy_review",
    tone: "warn",
  },
  {
    key: "operational_blocker",
    label: "Operational Blockers",
    caption: "Held, blocked, or paused",
    predicate: (r) => r.category === "operational_blocker",
    tone: "neutral",
  },
  {
    key: "contributor_fraud",
    label: "Contributor Fraud",
    caption: "Plagiarism · automation · conduct",
    predicate: (r) => r.category === "contributor_fraud",
    tone: "danger",
  },
  {
    key: "sla_breach",
    label: "SLA Breach Escalations",
    caption: "Capacity, breach forecast, overdue",
    predicate: (r) => r.category === "sla_breach",
    tone: "warn",
  },
];

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

export const aiGovernanceAggregates: AiGovernanceAggregate[] = [
  {
    id: "gai-1",
    title: "Plagiarism cluster · Acme billing surface",
    summary:
      "Three submissions in 72h overlap 80%+ with a public repo on the same utility set. Concentrated on c1142.",
    recommendation: "Refer to governance audit; consider conduct escalation.",
    riskScore: 88,
    confidence: 86,
    affects: ["esc-7826", "esc-7950"],
    kind: "fraud_pattern",
    generatedAt: "14:02",
  },
  {
    id: "gai-2",
    title: "Rapid-resubmit automation signature",
    summary:
      "Two contributors (c1142, c6620) show submission cadence matching automation signatures.",
    recommendation: "Require live contributor demos for next submission.",
    riskScore: 76,
    confidence: 82,
    affects: ["esc-7826", "esc-7950"],
    kind: "anomaly_cluster",
    generatedAt: "13:14",
  },
  {
    id: "gai-3",
    title: "Spec governance gap · BetaCo auth",
    summary:
      "Spec §4.2 vs §4.7 has caused 2 escalations in 30 days. Policy amendment may close the loop.",
    recommendation: "Refer to spec governance · propose amendment v1.5.",
    riskScore: 58,
    confidence: 81,
    affects: ["esc-7821"],
    kind: "policy_gap",
    generatedAt: "11:42",
  },
  {
    id: "gai-4",
    title: "Capacity-driven SLA risk · BetaCo pool",
    summary:
      "BetaCo pool at 110% capacity sustained for 3 days; SLA breach forecast >40% this week.",
    recommendation: "Rebalance from Helios or pause non-P0 intake 24h.",
    riskScore: 62,
    confidence: 88,
    affects: ["esc-7935", "esc-7831"],
    kind: "capacity_risk",
    generatedAt: "10:30",
  },
  {
    id: "gai-5",
    title: "Weekly governance summary",
    summary:
      "Escalation rate +18% w/w. Two repeat-offender contributors drive 60% of escalation volume.",
    recommendation: "Prioritize governance triage on c1142 and c6620.",
    riskScore: 64,
    confidence: 85,
    affects: ["mentor pool", "governance backlog"],
    kind: "summary",
    generatedAt: "09:00",
  },
];

/* ────────────────── Helpers ────────────────── */

export function formatHoursLabel(h: number): string {
  if (h < 0) return `${Math.abs(h)}h overdue`;
  if (h < 24) return `${h}h left`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h left`;
}
