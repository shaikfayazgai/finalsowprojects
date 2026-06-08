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

export const MOCK_FAQS: FaqGroup[] = [
  {
    id: "getting-started",
    title: "Getting started",
    entries: [
      { q: "How do I find tasks?", a: "Tasks are matched to you based on your declared skills and availability. Open Assigned to see your current queue." },
      { q: "Can I bid on tasks?", a: "No — the platform assigns tasks; you accept or decline." },
    ],
  },
  {
    id: "tasks-and-submissions",
    title: "Tasks & submissions",
    entries: [
      { q: "What happens when I submit?", a: "Your work is sent to your mentor. Expect a response within 24h. You'll be notified when accepted or when revisions are needed." },
      { q: "Can I withdraw a submission?", a: "Yes — open the submission and click Withdraw. You can edit and resubmit." },
    ],
  },
  {
    id: "payouts",
    title: "Payouts",
    entries: [
      { q: "When do I get paid?", a: "Payout becomes eligible the moment your submission is accepted." },
      { q: "What's the minimum withdrawal?", a: "₹500." },
    ],
  },
  {
    id: "credentials",
    title: "Credentials",
    entries: [
      { q: "How are credentials issued?", a: "Each accepted task earns a credential tied to the primary skill demonstrated." },
      { q: "Can I share credentials publicly?", a: "Yes — every credential has a public share link you control." },
    ],
  },
  {
    id: "account-and-privacy",
    title: "Account & privacy",
    entries: [
      { q: "Can I delete my account?", a: "Yes — there's a 30-day grace period during which you can cancel deletion by logging in." },
    ],
  },
];

export const MOCK_TICKETS: MockTicket[] = [];

export const MOCK_SAFETY_CASES: MockSafetyCase[] = [];

export const MOCK_GRIEVANCES: MockGrievance[] = [];
