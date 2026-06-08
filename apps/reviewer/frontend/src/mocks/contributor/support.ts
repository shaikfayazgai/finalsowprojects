/**
 * Mock support data — spec §5.O.
 *
 * FAQs grouped by category, tickets, safety cases, and grievances.
 */

export interface FaqGroup {
  id: string;
  title: string;
  entries: Array<{ q: string; a: string }>;
}

export interface MockTicketMessage {
  id: string;
  from: "you" | "support";
  body: string;
  at: string;
}

export interface MockTicket {
  id: string;
  category: "task" | "payout" | "credential" | "account" | "other";
  subject: string;
  body: string;
  status: "open" | "in_progress" | "waiting" | "resolved";
  createdAt: string;
  updatedAt: string;
  messages: MockTicketMessage[];
}

export interface MockCaseUpdate {
  id: string;
  at: string;
  from: "you" | "team" | "system";
  title: string;
  body: string;
}

export interface MockSafetyCase {
  id: string;
  type: "harassment" | "unsafe_task_content" | "discrimination" | "other";
  status: "submitted" | "in_progress" | "resolved";
  submittedAt: string;
  updatedAt: string;
  anonymous: boolean;
  summary: string;
  caseRef: string;
  story: string;
  incidentDate: string | null;
  involved: string | null;
  attachments: string[];
  updates: MockCaseUpdate[];
}

export type MockGrievanceType =
  | "unfair_rejection"
  | "payment_dispute"
  | "process_issue"
  | "other";

export interface MockGrievance {
  id: string;
  type: MockGrievanceType;
  status: "submitted" | "in_progress" | "resolved";
  submittedAt: string;
  updatedAt: string;
  caseRef: string;
  summary: string;
  story: string;
  incidentDate: string | null;
  relatedReference: string | null;
  desiredOutcome: string;
  attachments: string[];
  updates: MockCaseUpdate[];
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);

export const MOCK_FAQS: FaqGroup[] = [];

export const MOCK_TICKETS: MockTicket[] = [];

export const MOCK_SAFETY_CASES: MockSafetyCase[] = [];

export const MOCK_GRIEVANCES: MockGrievance[] = [];
