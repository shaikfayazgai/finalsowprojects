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

export const MOCK_TICKETS: MockTicket[] = [
  {
    id: "ticket-1042",
    category: "payout",
    subject: "Withdrawal stuck in pending",
    body: "I requested a withdrawal 3 days ago but it's still pending. Reference TRX-W-9482.",
    status: "in_progress",
    createdAt: hoursAgo(72),
    updatedAt: hoursAgo(12),
    messages: [
      { id: "m1", from: "you", body: "I requested a withdrawal 3 days ago but it's still pending. Reference TRX-W-9482.", at: hoursAgo(72) },
      { id: "m2", from: "support", body: "Looking into this with the payout rail. Will update within 24h.", at: hoursAgo(60) },
      { id: "m3", from: "support", body: "Rail confirmed processing; expected by tomorrow.", at: hoursAgo(12) },
    ],
  },
  {
    id: "ticket-1018",
    category: "task",
    subject: "Mentor unreachable",
    body: "I requested clarification on Date Picker 2 days ago and no reply.",
    status: "resolved",
    createdAt: hoursAgo(15 * 24),
    updatedAt: hoursAgo(10 * 24),
    messages: [
      { id: "m1", from: "you", body: "I requested clarification 2 days ago and no reply.", at: hoursAgo(15 * 24) },
      { id: "m2", from: "support", body: "Reassigned to a backup mentor; they'll reach out today.", at: hoursAgo(14 * 24) },
      { id: "m3", from: "support", body: "Closing this — your mentor replied. Let us know if anything else comes up.", at: hoursAgo(10 * 24) },
    ],
  },
];

export const MOCK_SAFETY_CASES: MockSafetyCase[] = [
  {
    id: "case-sr-1042",
    type: "harassment",
    status: "in_progress",
    submittedAt: hoursAgo(8),
    updatedAt: hoursAgo(2),
    anonymous: false,
    summary: "Inappropriate comment from a reviewer in a Q&A thread.",
    caseRef: "SR-1042",
    story:
      "During a Q&A thread on the Date Picker task, a reviewer left a comment that felt personal and inappropriate. I asked them to stay on technical feedback only.",
    incidentDate: daysAgo(1).slice(0, 10),
    involved: "Reviewer (display name withheld until investigation)",
    attachments: ["qa-thread-screenshot.png"],
    updates: [
      {
        id: "u1",
        at: hoursAgo(8),
        from: "system",
        title: "Report received",
        body: "Your safety report was logged. A trained investigator will respond within 24 hours.",
      },
      {
        id: "u2",
        at: hoursAgo(5),
        from: "team",
        title: "Investigator assigned",
        body: "Case assigned to the Trust & Safety team. We are reviewing the Q&A thread and will contact you if we need more detail.",
      },
      {
        id: "u3",
        at: hoursAgo(2),
        from: "team",
        title: "Evidence preserved",
        body: "Thread snapshot secured. The reviewer has been temporarily restricted from direct messaging while we review.",
      },
    ],
  },
];

export const MOCK_GRIEVANCES: MockGrievance[] = [
  {
    id: "grievance-gr-882",
    type: "unfair_rejection",
    status: "submitted",
    submittedAt: hoursAgo(30),
    updatedAt: hoursAgo(30),
    caseRef: "GR-882",
    summary: "Final-round rejection without citing the rubric items I addressed.",
    story:
      "Task UI-Modal-008 was rejected on round 3 even though I addressed every correction from round 2. The mentor feedback referenced issues I had already fixed in my resubmission.",
    incidentDate: daysAgo(2).slice(0, 10),
    relatedReference: "task-ui-modal-008",
    desiredOutcome:
      "Independent re-review of round 3 against the published rubric, or escalation to a senior mentor.",
    attachments: ["rubric-checklist.pdf", "round-2-feedback.png"],
    updates: [
      {
        id: "u1",
        at: hoursAgo(30),
        from: "system",
        title: "Grievance logged",
        body: "Your case is queued for the independent grievance panel. Expected first response within 5 business days.",
      },
    ],
  },
];
