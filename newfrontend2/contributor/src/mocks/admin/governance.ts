/**
 * Admin · governance queue mock — spec doc 04 §5.H.
 */

import { MOCK_ADMINS } from "./personas";

/** Current T&S operator viewing the queue (demo session). */
export const CURRENT_GOVERNANCE_OPERATOR = MOCK_ADMINS["plat.tns"].displayName;

export type GovCaseType = "safety_report" | "dispute" | "mentor_escalation" | "grievance";
export type GovCaseStatus = "open" | "in_review" | "pending_legal" | "resolved_action" | "resolved_no_action" | "escalated";
export type GovSeverity = "low" | "medium" | "high";
export type GovSource = "contributor" | "mentor" | "enterprise" | "internal";

export interface MockGovCase {
  id: string;
  type: GovCaseType;
  severity: GovSeverity;
  source: GovSource;
  anonymous: boolean;
  openedAt: string;
  assignedTo?: string;       // admin role/persona name
  status: GovCaseStatus;
  // free-form report text (verbatim from reporter)
  report: {
    category: string;
    incidentDate?: string;
    description: string;
  };
  // auto-populated from audit
  context: {
    relatedSessionId?: string;
    sessionAt?: string;
    sessionDurationMin?: number;
    mentorId?: string;
    mentorName?: string;
    enterpriseId?: string;
    enterpriseName?: string;
    contributorIdentityRedacted: boolean;
  };
  internalNotes: { at: string; by: string; text: string }[];
  /** Investigation actions logged before case closure. */
  actionsTaken?: string[];
  resolution?: {
    decision: "resolved_action" | "resolved_no_action" | "escalated";
    summary: string;
    actions: string[];
    at: string;
    by: string;
  };
}

export const MOCK_GOV_CASES: MockGovCase[] = [
  {
    id: "GR-1042",
    type: "safety_report",
    severity: "high",
    source: "contributor",
    anonymous: true,
    openedAt: "2026-05-27T06:00:00Z",
    assignedTo: "Sneha Pillai",
    status: "open",
    report: {
      category: "Harassment",
      incidentDate: "2026-05-25",
      description: "During a mentorship session, the mentor made inappropriate comments about my appearance. I was uncomfortable for the rest of the session.",
    },
    context: {
      relatedSessionId: "ms-2092",
      sessionAt: "2026-05-25T14:00:00+05:30",
      sessionDurationMin: 30,
      mentorId: "m-rajesh",
      mentorName: "Rajesh Verma",
      contributorIdentityRedacted: true,
    },
    internalNotes: [],
  },
  {
    id: "GR-1041",
    type: "dispute",
    severity: "medium",
    source: "contributor",
    anonymous: false,
    openedAt: "2026-05-27T03:00:00Z",
    assignedTo: "Sneha Pillai",
    status: "in_review",
    report: {
      category: "Mentor decision dispute",
      description: "Mentor rejected my submission citing insufficient tests but tests were included as instructed. Asking for re-review by a different mentor.",
    },
    context: {
      relatedSessionId: "rv-8801",
      mentorId: "m-fatima",
      mentorName: "Fatima Nair",
      enterpriseId: "t-acme",
      enterpriseName: "Acme Corp",
      contributorIdentityRedacted: false,
    },
    internalNotes: [
      { at: "2026-05-27T04:30:00Z", by: "Sneha Pillai", text: "Pulled both submission versions. Tests present in v2; mentor may have missed them. Asking for second-pair review." },
    ],
  },
  {
    id: "GR-1040",
    type: "mentor_escalation",
    severity: "medium",
    source: "mentor",
    anonymous: false,
    openedAt: "2026-05-27T01:00:00Z",
    status: "open",
    report: {
      category: "Repeated low-quality submissions",
      description: "Contributor has missed acceptance criteria across three consecutive tasks. Escalating to determine fit + corrective coaching plan.",
    },
    context: {
      mentorId: "m-priya",
      mentorName: "Priya Iyer",
      enterpriseId: "t-acme",
      enterpriseName: "Acme Corp",
      contributorIdentityRedacted: false,
    },
    internalNotes: [],
  },
  {
    id: "GR-1039",
    type: "grievance",
    severity: "low",
    source: "contributor",
    anonymous: false,
    openedAt: "2026-05-26T08:00:00Z",
    status: "resolved_no_action",
    assignedTo: "Sneha Pillai",
    report: {
      category: "Payout delay",
      description: "Withdrawal of ₹4,200 has been pending for 5 days. No response on support ticket.",
    },
    context: {
      contributorIdentityRedacted: false,
    },
    internalNotes: [
      { at: "2026-05-26T09:00:00Z", by: "Sneha Pillai", text: "Coordinated with Payments. Razorpay UPI was degraded; payout reattempted and succeeded." },
    ],
    resolution: {
      decision: "resolved_no_action",
      summary: "Payout completed after rail recovery; contributor notified.",
      actions: [],
      at: "2026-05-26T10:00:00Z",
      by: "Sneha Pillai",
    },
  },
  {
    id: "GR-1038",
    type: "safety_report",
    severity: "high",
    source: "contributor",
    anonymous: false,
    openedAt: "2026-05-22T11:00:00Z",
    status: "escalated",
    assignedTo: "Sneha Pillai",
    report: {
      category: "Discriminatory language",
      description: "Mentor used disparaging language in a written review. I have a screenshot.",
    },
    context: {
      relatedSessionId: "rv-8773",
      mentorId: "m-marco",
      mentorName: "Marco Bianchi",
      enterpriseId: "t-helios",
      enterpriseName: "Helios Studios",
      contributorIdentityRedacted: false,
    },
    internalNotes: [
      { at: "2026-05-22T13:00:00Z", by: "Sneha Pillai", text: "Evidence reviewed. Pattern matches one prior complaint (closed; unsubstantiated). Forwarding to legal for next steps." },
    ],
  },
  {
    id: "GR-1037",
    type: "grievance",
    severity: "medium",
    source: "enterprise",
    anonymous: false,
    openedAt: "2026-05-28T02:00:00Z",
    status: "open",
    report: {
      category: "Reviewer bias concern",
      description: "Enterprise reviewer consistently rejects submissions from women contributors on our project. Requesting platform review of review patterns.",
    },
    context: {
      enterpriseId: "t-acme",
      enterpriseName: "Acme Corp",
      contributorIdentityRedacted: false,
    },
    internalNotes: [],
  },
  {
    id: "GR-1036",
    type: "dispute",
    severity: "low",
    source: "contributor",
    anonymous: false,
    openedAt: "2026-05-27T18:00:00Z",
    assignedTo: CURRENT_GOVERNANCE_OPERATOR,
    status: "pending_legal",
    report: {
      category: "IP attribution dispute",
      description: "Contributor claims prior art was used without credit in accepted deliverable. Seeking legal guidance on attribution policy.",
    },
    context: {
      enterpriseId: "t-helios",
      enterpriseName: "Helios Studios",
      contributorIdentityRedacted: false,
    },
    internalNotes: [
      { at: "2026-05-27T19:00:00Z", by: CURRENT_GOVERNANCE_OPERATOR, text: "Preliminary review complete. Escalating to legal for IP policy interpretation." },
    ],
  },
  {
    id: "GR-1035",
    type: "safety_report",
    severity: "high",
    source: "contributor",
    anonymous: true,
    openedAt: "2026-05-28T04:30:00Z",
    status: "open",
    report: {
      category: "Threatening language",
      incidentDate: "2026-05-27",
      description: "Received threatening messages in platform chat after declining extra unpaid work. Screenshot attached in ticket.",
    },
    context: {
      relatedSessionId: "ms-2101",
      sessionAt: "2026-05-27T16:00:00+05:30",
      mentorId: "m-alex",
      mentorName: "Alex Chen",
      contributorIdentityRedacted: true,
    },
    internalNotes: [],
  },
];

const THIRTY_DAYS_MS = 30 * 86_400_000;

export function computeGovSummary(cases: MockGovCase[], operator = CURRENT_GOVERNANCE_OPERATOR) {
  const openStatuses: GovCaseStatus[] = ["open", "in_review", "pending_legal"];
  const closedStatuses: GovCaseStatus[] = ["resolved_action", "resolved_no_action", "escalated"];
  const cutoff = Date.now() - THIRTY_DAYS_MS;

  return {
    openAssignedToMe: cases.filter(
      (c) => c.assignedTo === operator && openStatuses.includes(c.status),
    ).length,
    unassigned: cases.filter((c) => !c.assignedTo && openStatuses.includes(c.status)).length,
    allOpen: cases.filter((c) => openStatuses.includes(c.status)).length,
    closedLast30d: cases.filter(
      (c) => closedStatuses.includes(c.status) && new Date(c.openedAt).getTime() >= cutoff,
    ).length,
    highSeverityOpen: cases.filter(
      (c) => c.severity === "high" && openStatuses.includes(c.status),
    ).length,
  };
}

export const MOCK_GOV_SUMMARY = computeGovSummary(MOCK_GOV_CASES);
