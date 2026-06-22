/**
 * Mentor Workspace V2 — Rework, Escalation, Governance Hold, Clarification
 * operational mock data.
 *
 * Powers /mentor/reviews/rework, /mentor/reviews/escalated,
 * /mentor/reviews/governance-holds, and /mentor/governance/audit.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

import type { RiskSeverity } from "./mentor-workspace";

export type WorkflowState =
  | "pending"
  | "rework"
  | "rework_requested"
  | "awaiting_contributor"
  | "revision_submitted"
  | "pending_validation"
  | "in_progress"
  | "ai_ready"
  | "overdue"
  | "escalated"
  | "escalation_routed"
  | "escalation_under_review"
  | "escalation_resolved"
  | "governance_hold"
  | "hold_released"
  | "blocked"
  | "clarification_pending"
  | "policy_review"
  | "closed";

export type CorrectionSeverity = "blocker" | "major" | "nit";
export type CorrectionStatus = "open" | "acknowledged" | "resolved" | "rejected";
export type EscalationCategory =
  | "spec_ambiguity"
  | "quality_dispute"
  | "contributor_conduct"
  | "reviewer_capacity"
  | "sla_breach"
  | "tooling_failure"
  | "policy_gap"
  | "compliance_concern";
export type EscalationTier =
  | "reviewer_pool_lead"
  | "mentor"
  | "enterprise_admin"
  | "platform_admin";
export type HoldKind = "legal" | "compliance" | "security" | "policy";

export interface GovernanceEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  category: "ai" | "human" | "system" | "policy" | "governance";
}

/* ────────────────── Anchored corrections ────────────────── */

export interface AnchoredCorrection {
  id: string;
  criterionId: string;
  criterionLabel: string;
  severity: CorrectionSeverity;
  required: boolean;
  description: string;
  internalNote?: string;
  evidenceRefs: string[];
  status: CorrectionStatus;
  contributorResponse?: string;
}

/* ────────────────── Clarifications ────────────────── */

export type ClarificationStatus = "pending" | "answered" | "resolved" | "expired";

export interface ClarificationMessage {
  id: string;
  author: string;
  authorRole: "mentor" | "reviewer" | "contributor";
  body: string;
  timestamp: string;
  attachments?: { label: string; size?: string }[];
}

export interface ClarificationThread {
  id: string;
  reviewId: string;
  raisedBy: string;
  status: ClarificationStatus;
  pauseSla: boolean;
  expectedBy: string;
  messages: ClarificationMessage[];
}

/* ────────────────── Rework ────────────────── */

export interface ReworkItem {
  id: string;
  reviewId: string;
  taskTitle: string;
  project: string;
  contributorCode: string;
  contributorReliability: number;
  round: number;
  totalRounds: number;
  state: WorkflowState;
  severity: RiskSeverity;
  raisedBy: string;
  raisedAt: string;
  dueAt: string;
  hoursRemaining: number;
  corrections: AnchoredCorrection[];
  whatWorked: string;
  contributorAck: { acknowledged: boolean; ackedAt?: string; note?: string };
  routingOnResubmit: "same_reviewer" | "fresh_reviewer";
  clarificationThreadId?: string;
  timeline: GovernanceEvent[];
}

/* ────────────────── Escalations ────────────────── */

export interface EscalationRoutingHop {
  tier: EscalationTier;
  owner: string;
  receivedAt: string;
  status: "received" | "in_review" | "passed" | "resolved";
  note?: string;
}

export interface EscalationItem {
  id: string;
  reviewId: string;
  taskTitle: string;
  project: string;
  contributorCode: string;
  type: EscalationCategory;
  rootCause: string;
  severity: RiskSeverity;
  state: WorkflowState;
  raisedBy: string;
  raisedAt: string;
  resolutionSlaHours: number;
  hoursRemaining: number;
  pausedReview: boolean;
  description: string;
  affectedAreas: string[];
  evidence: { label: string; size?: string }[];
  routing: {
    currentTier: EscalationTier;
    currentOwner: string;
    chain: EscalationRoutingHop[];
  };
  policyRefs: string[];
  timeline: GovernanceEvent[];
  proposedResolution?: string;
}

/* ────────────────── Holds ────────────────── */

export interface HoldItem {
  id: string;
  reviewId: string;
  taskTitle: string;
  project: string;
  kind: HoldKind;
  reason: string;
  heldBy: string;
  heldSince: string;
  expectedRelease: string;
  hoursActive: number;
  contributorCode: string;
  policyRefs: string[];
  restrictedActions: string[];
  state: WorkflowState;
  severity: RiskSeverity;
  timeline: GovernanceEvent[];
  awaitingExternal?: string;
}

/* ────────────────── State display map ────────────────── */

export const workflowStateLabel: Record<WorkflowState, string> = {
  pending: "Pending",
  rework: "Rework",
  rework_requested: "Rework requested",
  awaiting_contributor: "Awaiting contributor",
  revision_submitted: "Revision submitted",
  pending_validation: "Pending mentor validation",
  in_progress: "In progress",
  ai_ready: "AI ready",
  overdue: "Overdue",
  escalated: "Escalated",
  escalation_routed: "Routed",
  escalation_under_review: "Under review",
  escalation_resolved: "Resolved",
  governance_hold: "Governance hold",
  hold_released: "Hold released",
  blocked: "Blocked",
  clarification_pending: "Clarification pending",
  policy_review: "Policy review",
  closed: "Closed",
};

export const escalationCategoryLabel: Record<EscalationCategory, string> = {
  spec_ambiguity: "Spec ambiguity",
  quality_dispute: "Quality dispute",
  contributor_conduct: "Contributor conduct",
  reviewer_capacity: "Reviewer capacity",
  sla_breach: "SLA breach risk",
  tooling_failure: "Tooling failure",
  policy_gap: "Policy gap",
  compliance_concern: "Compliance concern",
};

export const tierLabel: Record<EscalationTier, string> = {
  reviewer_pool_lead: "Reviewer pool lead",
  mentor: "Mentor",
  enterprise_admin: "Enterprise admin",
  platform_admin: "Platform admin",
};

export const holdKindLabel: Record<HoldKind, string> = {
  legal: "Legal",
  compliance: "Compliance",
  security: "Security",
  policy: "Policy",
};

/* ────────────────── Mock collections ────────────────── */

export const reworkItems: ReworkItem[] = [
  {
    id: "rw-4821",
    reviewId: "r-4821",
    taskTitle: "Build accessible date picker component",
    project: "Acme-Helios · P0",
    contributorCode: "c4821",
    contributorReliability: 87,
    round: 2,
    totalRounds: 3,
    state: "awaiting_contributor",
    severity: "low",
    raisedBy: "R. Verma",
    raisedAt: "2026-05-22 11:15",
    dueAt: "2026-05-26 18:00",
    hoursRemaining: 26,
    corrections: [
      {
        id: "co-1",
        criterionId: "C5",
        criterionLabel: "Accessibility",
        severity: "major",
        required: true,
        description:
          "Keyboard navigation incomplete: focus trap missing in popover when modal opens. Spec §5.3 requires JAWS support — verification not provided.",
        internalNote: "Contributor referenced react-aria FocusScope — confirm implementation pattern in resubmission.",
        evidenceRefs: ["spec §5.3", "src/components/DatePicker.tsx:124-132", "axe report"],
        status: "acknowledged",
        contributorResponse:
          "Will wrap popover in <FocusScope contain restoreFocus> and add JAWS test note to the README.",
      },
      {
        id: "co-2",
        criterionId: "C3",
        criterionLabel: "Requirements adherence",
        severity: "major",
        required: true,
        description: "RTL layout offset on month dropdown — visual polish required, see Storybook 'rtl-layout' story.",
        evidenceRefs: ["storybook · rtl-layout", "spec §4.2"],
        status: "open",
      },
      {
        id: "co-3",
        criterionId: "C4",
        criterionLabel: "Testing",
        severity: "nit",
        required: false,
        description: "Add unit test that exercises focus trap on close (escape key returns focus to trigger).",
        evidenceRefs: ["spec §6.1"],
        status: "open",
      },
    ],
    whatWorked: "Strong component composition, idiomatic hooks usage, clean Storybook structure. v1 → v2 diff is tight.",
    contributorAck: {
      acknowledged: true,
      ackedAt: "2026-05-22 15:42",
      note: "Acknowledged. ETA Tuesday EOD for resubmission.",
    },
    routingOnResubmit: "fresh_reviewer",
    clarificationThreadId: "cl-1",
    timeline: [
      {
        id: "rw-tl-1",
        timestamp: "May 22 11:15",
        actor: "R. Verma",
        action: "Rework requested",
        detail: "Round 2 · 2 major + 1 nit · routing: fresh reviewer",
        category: "human",
      },
      {
        id: "rw-tl-2",
        timestamp: "May 22 11:18",
        actor: "System",
        action: "Notification sent",
        detail: "Contributor c4821 notified via email + in-app",
        category: "system",
      },
      {
        id: "rw-tl-3",
        timestamp: "May 22 15:42",
        actor: "c4821",
        action: "Acknowledged rework",
        detail: "Will resubmit Tuesday EOD",
        category: "human",
      },
      {
        id: "rw-tl-4",
        timestamp: "May 23 09:30",
        actor: "R. Verma",
        action: "Clarification requested",
        detail: "Asked about JAWS test strategy",
        category: "human",
      },
    ],
  },
  {
    id: "rw-1142",
    reviewId: "r-1142",
    taskTitle: "Refactor billing service",
    project: "Acme-Helios · P0",
    contributorCode: "c1142",
    contributorReliability: 71,
    round: 2,
    totalRounds: 3,
    state: "overdue",
    severity: "high",
    raisedBy: "K. Singh",
    raisedAt: "2026-05-18 16:00",
    dueAt: "2026-05-22 18:00",
    hoursRemaining: -22,
    corrections: [
      {
        id: "co-4",
        criterionId: "C3",
        criterionLabel: "Requirements adherence",
        severity: "blocker",
        required: true,
        description: "Idempotency missing on Stripe webhook retries. Spec §3.1 explicit requirement.",
        evidenceRefs: ["spec §3.1", "webhook tests"],
        status: "open",
      },
      {
        id: "co-5",
        criterionId: "C1",
        criterionLabel: "Code quality",
        severity: "major",
        required: true,
        description: "Three utility functions duplicate a public-repo source (plagiarism flag). Replace with attributed implementation.",
        evidenceRefs: ["AI plagiarism report"],
        status: "open",
      },
    ],
    whatWorked: "Service boundary is clean; tests cover happy-path well.",
    contributorAck: { acknowledged: false },
    routingOnResubmit: "same_reviewer",
    timeline: [
      {
        id: "rw-tl-10",
        timestamp: "May 18 16:00",
        actor: "K. Singh",
        action: "Rework requested",
        detail: "Round 2 · 1 blocker + 1 major",
        category: "human",
      },
      {
        id: "rw-tl-11",
        timestamp: "May 22 18:00",
        actor: "System",
        action: "SLA breached",
        detail: "Deadline passed without contributor acknowledgment",
        category: "system",
      },
    ],
  },
  {
    id: "rw-6710",
    reviewId: "r-6710",
    taskTitle: "Stripe webhook handler",
    project: "Acme-Helios · P1",
    contributorCode: "c6710",
    contributorReliability: 92,
    round: 1,
    totalRounds: 3,
    state: "revision_submitted",
    severity: "low",
    raisedBy: "L. Mehta",
    raisedAt: "2026-05-21 09:00",
    dueAt: "2026-05-24 18:00",
    hoursRemaining: 8,
    corrections: [
      {
        id: "co-7",
        criterionId: "C4",
        criterionLabel: "Testing",
        severity: "major",
        required: true,
        description: "Coverage at 62% — threshold is 80%. Cover retry + error paths.",
        evidenceRefs: ["coverage report"],
        status: "resolved",
        contributorResponse: "Added 14 new tests · coverage 86%.",
      },
    ],
    whatWorked: "Clean refactor of webhook adapter. Good error handling.",
    contributorAck: { acknowledged: true, ackedAt: "2026-05-21 10:14" },
    routingOnResubmit: "fresh_reviewer",
    timeline: [
      { id: "rw-tl-20", timestamp: "May 21 09:00", actor: "L. Mehta", action: "Rework requested", detail: "1 major · testing coverage", category: "human" },
      { id: "rw-tl-21", timestamp: "May 23 14:08", actor: "c6710", action: "Revision submitted", detail: "v2 uploaded · coverage now 86%", category: "human" },
    ],
  },
  {
    id: "rw-5520",
    reviewId: "r-5520",
    taskTitle: "PII redaction module",
    project: "Helios-Vault · P0",
    contributorCode: "c5520",
    contributorReliability: 79,
    round: 1,
    totalRounds: 3,
    state: "pending_validation",
    severity: "medium",
    raisedBy: "R. Verma",
    raisedAt: "2026-05-20 14:00",
    dueAt: "2026-05-24 18:00",
    hoursRemaining: 6,
    corrections: [
      {
        id: "co-9",
        criterionId: "C5",
        criterionLabel: "Compliance",
        severity: "major",
        required: true,
        description: "Pseudonymization key rotation not implemented per spec §7.2.",
        evidenceRefs: ["spec §7.2", "module/redactor.ts"],
        status: "resolved",
        contributorResponse: "Rotation implemented; rotates every 30 days; KMS-backed.",
      },
    ],
    whatWorked: "Strong test discipline; comprehensive edge-case coverage.",
    contributorAck: { acknowledged: true, ackedAt: "2026-05-20 16:30" },
    routingOnResubmit: "same_reviewer",
    timeline: [
      { id: "rw-tl-30", timestamp: "May 20 14:00", actor: "R. Verma", action: "Rework requested", detail: "1 major · compliance gap", category: "human" },
      { id: "rw-tl-31", timestamp: "May 23 11:50", actor: "c5520", action: "Revision submitted", detail: "v2 uploaded · KMS rotation added", category: "human" },
      { id: "rw-tl-32", timestamp: "May 23 12:50", actor: "J. Khan", action: "Governance hold placed", detail: "Pending legal review of data-sensitivity classification", category: "governance" },
    ],
  },
];

export const clarificationThreads: ClarificationThread[] = [
  {
    id: "cl-1",
    reviewId: "r-4821",
    raisedBy: "R. Verma",
    status: "answered",
    pauseSla: false,
    expectedBy: "2026-05-24 18:00",
    messages: [
      {
        id: "cl-1-1",
        author: "R. Verma",
        authorRole: "mentor",
        body: "Could you walk me through your JAWS testing strategy for v3? Spec §5.3 explicitly requires JAWS verification — happy to accept a recorded walkthrough.",
        timestamp: "2026-05-23 09:30",
      },
      {
        id: "cl-1-2",
        author: "c4821",
        authorRole: "contributor",
        body: "I will record a JAWS pass-through on the demo route and attach the recording. Tested locally on Win11 + JAWS 2024 — focus trap and live region announcements both work.",
        timestamp: "2026-05-23 11:14",
        attachments: [{ label: "jaws-walkthrough.mp4 (pending)", size: "—" }],
      },
      {
        id: "cl-1-3",
        author: "R. Verma",
        authorRole: "mentor",
        body: "Perfect. Attach with the v3 submission. No SLA pause needed.",
        timestamp: "2026-05-23 11:22",
      },
    ],
  },
];

export const escalationItems: EscalationItem[] = [
  {
    id: "esc-7821",
    reviewId: "r-3902",
    taskTitle: "Auth modal redesign",
    project: "BetaCo · P1",
    contributorCode: "c5102",
    type: "spec_ambiguity",
    rootCause: "Ambiguous specification",
    severity: "high",
    state: "escalation_under_review",
    raisedBy: "R. Verma",
    raisedAt: "2026-05-23 09:14",
    resolutionSlaHours: 24,
    hoursRemaining: 6,
    pausedReview: true,
    description:
      "Spec §4.2 conflicts with §4.7 on session timeout behavior after step-up auth. Contributor's interpretation differs from mine. Product-owner ruling required to unblock round 3 review.",
    affectedAreas: ["auth modal v3", "session-timeout policy", "downstream r-3902"],
    evidence: [
      { label: "Frozen submission snapshot · r-3902", size: "2.1 MB" },
      { label: "Spec doc · auth.pdf (annotated)", size: "1.4 MB" },
      { label: "Q&A thread excerpt", size: "12 KB" },
    ],
    routing: {
      currentTier: "mentor",
      currentOwner: "You · Rajesh V.",
      chain: [
        {
          tier: "reviewer_pool_lead",
          owner: "K. Singh",
          receivedAt: "2026-05-23 09:14",
          status: "passed",
          note: "Out of scope at reviewer-pool tier — spec authority needed.",
        },
        {
          tier: "mentor",
          owner: "You · Rajesh V.",
          receivedAt: "2026-05-23 10:02",
          status: "in_review",
          note: "Reviewing spec history with product owner.",
        },
      ],
    },
    policyRefs: ["Spec governance §2", "Step-up auth policy v1.4"],
    timeline: [
      { id: "et-1", timestamp: "May 23 09:14", actor: "R. Verma", action: "Escalation raised", detail: "Spec ambiguity · round 3 reached", category: "human" },
      { id: "et-2", timestamp: "May 23 09:14", actor: "System", action: "Review paused", detail: "SLA timer suspended", category: "system" },
      { id: "et-3", timestamp: "May 23 09:42", actor: "K. Singh", action: "Routed up", detail: "Beyond reviewer-pool authority — passed to mentor tier", category: "governance" },
      { id: "et-4", timestamp: "May 23 10:02", actor: "Mentor", action: "Claimed", detail: "Mentor R. acquired escalation lock", category: "human" },
      { id: "et-5", timestamp: "May 23 11:40", actor: "Mentor", action: "Product owner consulted", detail: "Awaiting spec authority response", category: "governance" },
    ],
    proposedResolution: "Resolve in favor of reviewer interpretation pending spec amendment.",
  },
  {
    id: "esc-7826",
    reviewId: "r-1142",
    taskTitle: "Refactor billing service",
    project: "Acme-Helios · P0",
    contributorCode: "c1142",
    type: "quality_dispute",
    rootCause: "Quality threshold unclear",
    severity: "high",
    state: "escalation_routed",
    raisedBy: "c1142",
    raisedAt: "2026-05-23 11:02",
    resolutionSlaHours: 24,
    hoursRemaining: 14,
    pausedReview: false,
    description:
      "Contributor disputes rejection rationale. Claims plagiarism finding overstates overlap; argues that the matched utility functions are common idiomatic patterns and not derivative work.",
    affectedAreas: ["r-1142 dispute", "contributor reliability score", "AI plagiarism calibration"],
    evidence: [
      { label: "AI plagiarism report · 88% match", size: "84 KB" },
      { label: "Contributor rebuttal · v1", size: "16 KB" },
    ],
    routing: {
      currentTier: "mentor",
      currentOwner: "You · Rajesh V.",
      chain: [
        { tier: "mentor", owner: "You · Rajesh V.", receivedAt: "2026-05-23 11:02", status: "received" },
      ],
    },
    policyRefs: ["Plagiarism policy v2.1"],
    timeline: [
      { id: "et-10", timestamp: "May 23 11:02", actor: "c1142", action: "Dispute raised", detail: "Contributor rebuts plagiarism finding", category: "human" },
      { id: "et-11", timestamp: "May 23 11:05", actor: "System", action: "Routed to mentor", detail: "Quality-dispute auto-routes mentor tier", category: "system" },
    ],
  },
  {
    id: "esc-7831",
    reviewId: "r-7715",
    taskTitle: "Search relevance ranker",
    project: "BetaCo · P0",
    contributorCode: "c7715",
    type: "reviewer_capacity",
    rootCause: "Reviewer capacity",
    severity: "medium",
    state: "escalation_resolved",
    raisedBy: "L. Mehta",
    raisedAt: "2026-05-22 16:00",
    resolutionSlaHours: 24,
    hoursRemaining: 0,
    pausedReview: false,
    description:
      "Reviewer pool at 110% capacity for BetaCo this week — reassignment required to keep SLA. Forwarded to enterprise admin for pool rebalancing.",
    affectedAreas: ["BetaCo review pool", "weekly throughput"],
    evidence: [],
    routing: {
      currentTier: "enterprise_admin",
      currentOwner: "S. Iyer · Enterprise admin",
      chain: [
        { tier: "reviewer_pool_lead", owner: "K. Singh", receivedAt: "2026-05-22 16:00", status: "passed" },
        { tier: "mentor", owner: "Rajesh V.", receivedAt: "2026-05-22 17:10", status: "passed" },
        { tier: "enterprise_admin", owner: "S. Iyer", receivedAt: "2026-05-22 18:00", status: "resolved", note: "Borrowed two reviewers from Helios pool for 5 business days." },
      ],
    },
    policyRefs: ["Capacity policy v1.0"],
    timeline: [
      { id: "et-20", timestamp: "May 22 16:00", actor: "L. Mehta", action: "Escalation raised", detail: "Reviewer capacity · BetaCo overload", category: "human" },
      { id: "et-21", timestamp: "May 22 17:10", actor: "Mentor", action: "Passed up", detail: "Capacity decision beyond mentor tier", category: "governance" },
      { id: "et-22", timestamp: "May 22 18:00", actor: "S. Iyer", action: "Resolved", detail: "Borrowed 2 reviewers from Helios pool", category: "governance" },
      { id: "et-23", timestamp: "May 22 18:02", actor: "System", action: "Resumed pool routing", detail: "Capacity restored; SLA timer resumed", category: "system" },
    ],
  },
];

export const holdItems: HoldItem[] = [
  {
    id: "hold-2210",
    reviewId: "r-5520",
    taskTitle: "PII redaction module",
    project: "Helios-Vault · P0",
    kind: "legal",
    reason: "Data sensitivity classification review — pseudonymization key rotation impacts GDPR scope.",
    heldBy: "J. Khan · Legal officer",
    heldSince: "2026-05-22 09:00",
    expectedRelease: "2026-05-25",
    hoursActive: 30,
    contributorCode: "c5520",
    policyRefs: ["GDPR §32 · technical safeguards", "Data classification policy v3.1"],
    restrictedActions: ["Accept", "Reject", "Request rework", "Reassign reviewer"],
    state: "governance_hold",
    severity: "medium",
    awaitingExternal: "External data-classifier response (Verisign)",
    timeline: [
      { id: "ht-1", timestamp: "May 22 09:00", actor: "J. Khan · Legal", action: "Hold placed", detail: "Data sensitivity classification under review", category: "governance" },
      { id: "ht-2", timestamp: "May 22 11:30", actor: "System", action: "Notifications sent", detail: "Reviewer, contributor, mentor notified", category: "system" },
      { id: "ht-3", timestamp: "May 23 09:00", actor: "J. Khan · Legal", action: "Status update", detail: "Awaiting external classifier response", category: "policy" },
    ],
  },
  {
    id: "hold-2218",
    reviewId: "r-3208",
    taskTitle: "Customer export pipeline",
    project: "Helios-Vault · P0",
    kind: "compliance",
    reason: "SOC2 evidence required — export route ingests financial fields outside SOW scope.",
    heldBy: "M. Patel · Compliance",
    heldSince: "2026-05-21 14:00",
    expectedRelease: "2026-05-27",
    hoursActive: 50,
    contributorCode: "c3208",
    policyRefs: ["SOC2 CC6.7", "Data residency policy v2"],
    restrictedActions: ["Accept", "Reject", "Request rework"],
    state: "governance_hold",
    severity: "high",
    timeline: [
      { id: "ht-10", timestamp: "May 21 14:00", actor: "M. Patel · Compliance", action: "Hold placed", detail: "SOC2 evidence collection in progress", category: "governance" },
      { id: "ht-11", timestamp: "May 23 10:00", actor: "M. Patel · Compliance", action: "Evidence partial", detail: "3 of 5 SOC2 artifacts gathered", category: "policy" },
    ],
  },
  {
    id: "hold-2220",
    reviewId: "r-4480",
    taskTitle: "Auth tokens rotation script",
    project: "Acme-Helios · P1",
    kind: "security",
    reason: "Security review of token-issuance code path. Possible privilege-escalation vector flagged.",
    heldBy: "T. Rao · Security",
    heldSince: "2026-05-23 08:00",
    expectedRelease: "2026-05-24",
    hoursActive: 10,
    contributorCode: "c4480",
    policyRefs: ["Security review SOP v4"],
    restrictedActions: ["Accept", "Reject"],
    state: "governance_hold",
    severity: "high",
    timeline: [
      { id: "ht-20", timestamp: "May 23 08:00", actor: "T. Rao · Security", action: "Hold placed", detail: "Security review initiated", category: "governance" },
      { id: "ht-21", timestamp: "May 23 12:00", actor: "T. Rao · Security", action: "Static analysis run", detail: "No vulnerabilities found; manual review continues", category: "policy" },
    ],
  },
];

/* ────────────────── Cross-workflow audit ────────────────── */

export const governanceAuditEvents: GovernanceEvent[] = [
  ...reworkItems.flatMap((r) => r.timeline.map((e) => ({ ...e, id: `${r.id}-${e.id}` }))),
  ...escalationItems.flatMap((e) => e.timeline.map((ev) => ({ ...ev, id: `${e.id}-${ev.id}` }))),
  ...holdItems.flatMap((h) => h.timeline.map((e) => ({ ...e, id: `${h.id}-${e.id}` }))),
].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
