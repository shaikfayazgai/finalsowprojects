/**
 * Escalations — spec doc 03 §5.F.
 *
 * Disputes, SLA breaches, conflicts that need senior/lead judgement.
 */

export type EscalationType = "dispute" | "sla_breach" | "conflict" | "plagiarism";
export type EscalationSeverity = "low" | "medium" | "high" | "critical";
export type EscalationStatus = "open" | "assigned" | "in_review" | "resolved" | "escalated_further";

export interface MockEscalation {
  id: string;
  type: EscalationType;
  severity: EscalationSeverity;
  status: EscalationStatus;
  openedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  taskTitle: string;
  contributorName: string;
  contributorId: string;
  project: string;
  originalMentorName: string;
  originalDecisionId?: string;
  originalDecision: "reject" | "rework" | "accept" | "withdrawn";
  originalDecisionAt: string;
  rejectReason?: string;
  contributorDispute?: string;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const MOCK_ESCALATIONS: MockEscalation[] = [];

export function getMockEscalation(id: string): MockEscalation | undefined {
  return MOCK_ESCALATIONS.find((e) => e.id === id);
}

export const MOCK_ESCALATION_METRICS = {
  openCount: 0,
  resolvedLast30: 0,
  avgResolveHours: 0,
};
