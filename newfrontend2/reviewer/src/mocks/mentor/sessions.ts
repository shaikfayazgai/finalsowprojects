/**
 * Mentorship sessions — spec doc 03 §5.G.
 */

export type SessionStatus = "scheduled" | "in_progress" | "note_saved" | "closed" | "no_show";

export interface MockSession {
  id: string;
  mentorId: string;
  contributorId: string;
  contributorName: string;
  contributorTitle: string;
  contributorCountry: string;
  contributorTrack?: "internal" | "freelancer" | "student" | "women";
  scheduledAt: string; // ISO
  durationMin: number;
  focus: string;
  externalLink: string;
  status: SessionStatus;
  note?: string;
  contributorGoals?: string;
  recentWork: Array<{ title: string; decidedAt: string; decision: "accept" | "rework" | "reject" }>;
  suggestedTopics: string[];
  tasksLast30: number;
  firstTryLast30: number;
  acceptanceRatePct: number;
}

const today = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const tomorrow = (h: number, m: number) => {
  const d = new Date(Date.now() + 86_400_000);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export const MOCK_SESSIONS: MockSession[] = [
  {
    id: "sess-001",
    mentorId: "mentor-priya",
    contributorId: "contrib-sneha",
    contributorName: "Sneha Menon",
    contributorTitle: "Designer · L3",
    contributorCountry: "India",
    contributorTrack: "women",
    scheduledAt: today(14, 0),
    durationMin: 30,
    focus: "Date Picker follow-up",
    externalLink: "https://meet.google.com/abc-xxxx-zyy",
    status: "scheduled",
    contributorGoals: "Move from L3 to L4 in accessibility this quarter.",
    recentWork: [
      { title: "Date Picker · FocusScope",  decidedAt: daysAgo(0),  decision: "accept" },
      { title: "Date Picker · Round 1",     decidedAt: daysAgo(2),  decision: "rework" },
      { title: "Auth modal",                 decidedAt: daysAgo(8),  decision: "accept" },
      { title: "Search shortcuts",           decidedAt: daysAgo(18), decision: "accept" },
    ],
    suggestedTopics: [
      "Recurring strength: aria-live region usage — call it out.",
      "Pattern from round 1: mobile testing gap — coach on test matrix.",
      "Skill progression: 14 acceptances in accessibility — eligible to claim L4?",
      "Mentorship opt-ins: short-session preference active.",
    ],
    tasksLast30: 4,
    firstTryLast30: 3,
    acceptanceRatePct: 92,
  },
  {
    id: "sess-002",
    mentorId: "mentor-priya",
    contributorId: "contrib-kavi",
    contributorName: "Kavi Senthil",
    contributorTitle: "Engineer · L3",
    contributorCountry: "India",
    contributorTrack: "freelancer",
    scheduledAt: today(15, 30),
    durationMin: 30,
    focus: "Quarterly check-in",
    externalLink: "https://meet.google.com/def-yyyy-www",
    status: "scheduled",
    recentWork: [
      { title: "Auth modal", decidedAt: daysAgo(8), decision: "accept" },
    ],
    suggestedTopics: [
      "Review consistency: aim for more first-try acceptance next month.",
      "Quarterly goal-setting prompt.",
    ],
    tasksLast30: 3,
    firstTryLast30: 2,
    acceptanceRatePct: 88,
  },
  {
    id: "sess-003",
    mentorId: "mentor-priya",
    contributorId: "contrib-yusuf",
    contributorName: "Yusuf Okeke",
    contributorTitle: "Engineer · L4",
    contributorCountry: "Nigeria",
    contributorTrack: "freelancer",
    scheduledAt: today(17, 0),
    durationMin: 45,
    focus: "Backend ladder review",
    externalLink: "https://meet.google.com/ghi-zzzz-aaa",
    status: "scheduled",
    recentWork: [
      { title: "Audit log query helper", decidedAt: daysAgo(4), decision: "accept" },
      { title: "Schema migration v3",     decidedAt: daysAgo(11), decision: "accept" },
    ],
    suggestedTopics: [
      "Promotion criteria walk-through.",
      "Audit-log domain — frame mentorship goals.",
    ],
    tasksLast30: 5,
    firstTryLast30: 4,
    acceptanceRatePct: 95,
  },
  {
    id: "sess-004",
    mentorId: "mentor-priya",
    contributorId: "contrib-sneha",
    contributorName: "Sneha Menon",
    contributorTitle: "Designer · L3",
    contributorCountry: "India",
    contributorTrack: "women",
    scheduledAt: tomorrow(10, 0),
    durationMin: 30,
    focus: "Pattern library walkthrough",
    externalLink: "https://meet.google.com/jkl-aaaa-bbb",
    status: "scheduled",
    recentWork: [],
    suggestedTopics: ["New-pattern adoption strategy."],
    tasksLast30: 4,
    firstTryLast30: 3,
    acceptanceRatePct: 92,
  },
  {
    id: "sess-005",
    mentorId: "mentor-priya",
    contributorId: "contrib-anita",
    contributorName: "Anita Rao",
    contributorTitle: "Designer · L2",
    contributorCountry: "India",
    contributorTrack: "freelancer",
    scheduledAt: tomorrow(14, 0),
    durationMin: 30,
    focus: "Onboarding follow-up",
    externalLink: "https://meet.google.com/mno-cccc-ddd",
    status: "scheduled",
    recentWork: [],
    suggestedTopics: ["First-week reflection prompts."],
    tasksLast30: 1,
    firstTryLast30: 1,
    acceptanceRatePct: 100,
  },
  // Held this week
  {
    id: "sess-h-001",
    mentorId: "mentor-priya",
    contributorId: "contrib-anita",
    contributorName: "Anita Rao",
    contributorTitle: "Designer · L2",
    contributorCountry: "India",
    contributorTrack: "freelancer",
    scheduledAt: daysAgo(2),
    durationMin: 30,
    focus: "Onboarding kickoff",
    externalLink: "https://meet.google.com/old-aaa-001",
    status: "closed",
    note: "Walked through the assignment expectations and the readiness bar. Anita asked about credential issuance — covered timing.",
    recentWork: [],
    suggestedTopics: [],
    tasksLast30: 1,
    firstTryLast30: 1,
    acceptanceRatePct: 100,
  },
];

export function getMockSession(id: string): MockSession | undefined {
  return MOCK_SESSIONS.find((s) => s.id === id);
}
