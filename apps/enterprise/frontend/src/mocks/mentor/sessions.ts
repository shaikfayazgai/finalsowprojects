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

export const MOCK_SESSIONS: MockSession[] = [];

export function getMockSession(id: string): MockSession | undefined {
  return MOCK_SESSIONS.find((s) => s.id === id);
}
