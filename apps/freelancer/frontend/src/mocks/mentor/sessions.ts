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

export const MOCK_SESSIONS: MockSession[] = [];

export function getMockSession(id: string): MockSession | undefined {
  return MOCK_SESSIONS.find((s) => s.id === id);
}
