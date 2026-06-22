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

export const MOCK_ESCALATIONS: MockEscalation[] = [
  {
    id: "esc-001",
    type: "dispute",
    severity: "medium",
    status: "open",
    openedAt: minutesAgo(18),
    taskTitle: "Auth modal",
    contributorId: "contrib-kavi",
    contributorName: "Kavi Senthil",
    project: "Helios Q3",
    originalMentorName: "Rajesh Verma",
    originalDecisionId: "dec-archived-1",
    originalDecision: "reject",
    originalDecisionAt: daysAgo(2),
    rejectReason: "Doesn't meet criteria — only 2 of 6 addressed.",
    contributorDispute:
      "I addressed criteria 3, 5, and 6 in the supplementary notes. The mentor may have missed them. Asking for re-review.",
  },
  {
    id: "esc-002",
    type: "sla_breach",
    severity: "high",
    status: "resolved",
    openedAt: daysAgo(2),
    resolvedAt: daysAgo(1),
    assignedTo: "Priya Iyer",
    taskTitle: "CSV export",
    contributorId: "contrib-yusuf",
    contributorName: "Yusuf Okeke",
    project: "Reporting V2",
    originalMentorName: "Rajesh Verma",
    originalDecision: "rework",
    originalDecisionAt: daysAgo(3),
    rejectReason: undefined,
  },
];

export function getMockEscalation(id: string): MockEscalation | undefined {
  return MOCK_ESCALATIONS.find((e) => e.id === id);
}

export const MOCK_ESCALATION_METRICS = {
  openCount: 1,
  resolvedLast30: 12,
  avgResolveHours: 5,
};
