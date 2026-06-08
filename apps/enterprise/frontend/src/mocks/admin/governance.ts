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

export const MOCK_GOV_CASES: MockGovCase[] = [];

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
