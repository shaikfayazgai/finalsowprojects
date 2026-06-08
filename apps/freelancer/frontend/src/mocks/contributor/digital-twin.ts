/**
 * Mock digital twin + skills — spec §5.K.3 / §5.K.5.
 */

import type { Persona } from "./personas";

export interface MockSkill {
  id: string;
  name: string;
  level: "L1" | "L2" | "L3" | "L4";
  category: "engineering" | "design" | "data" | "ops" | "writing";
  tasksCompletedWithThisSkill: number;
  evidenceCount: number;
}

export interface MockTwinTopSkill {
  skill: string;
  tasksCompleted: number;
  avgScore: number;
}

export interface MockTwinMonth {
  month: string;
  tasksCompleted: number;
  hoursLogged: number;
}

export interface MockDigitalTwin {
  skillsDeclared: number;
  tasksReinforcing: number;

  /** Last 30 days. */
  tasksCompleted30d: number;
  tasksInFlight: number;
  tasksDeclined30d: number;

  /** Reliability counters. */
  onTimePct: number;
  firstTryAcceptPct: number;
  withdrawals: number;
  acceptanceRatePct: number;

  /** Availability. */
  weekDays: "Mon–Fri" | "Mon–Sat" | "Flexible";
  weekHoursRange: string;
  hoursPerWeek: number;

  /** Detail page — delivery record. */
  updatedAt: string;
  totalSubmissions: number;
  averageReviewScore: number;
  totalHoursLogged: number;
  reworkRatePct: number;
  streakDays: number;
  longestStreak: number;
  performanceTrend: "improving" | "steady" | "cooling";
  topSkills: MockTwinTopSkill[];
  monthlyActivity: MockTwinMonth[];
  aiInsights: string[];
}

export const MOCK_SKILLS: MockSkill[] = [];

const EMPTY_TWIN: MockDigitalTwin = {
  skillsDeclared: 0,
  tasksReinforcing: 0,
  tasksCompleted30d: 0,
  tasksInFlight: 0,
  tasksDeclined30d: 0,
  onTimePct: 0,
  firstTryAcceptPct: 0,
  withdrawals: 0,
  acceptanceRatePct: 0,
  weekDays: "Flexible",
  weekHoursRange: "",
  hoursPerWeek: 0,
  updatedAt: "",
  totalSubmissions: 0,
  averageReviewScore: 0,
  totalHoursLogged: 0,
  reworkRatePct: 0,
  streakDays: 0,
  longestStreak: 0,
  performanceTrend: "steady",
  topSkills: [],
  monthlyActivity: [],
  aiInsights: [],
};

const PROFILES: Record<Persona, MockDigitalTwin> = {
  internal: EMPTY_TWIN,
  freelancer: EMPTY_TWIN,
  student: EMPTY_TWIN,
  women: EMPTY_TWIN,
};

export function getMockTwin(persona: Persona): MockDigitalTwin {
  return PROFILES[persona];
}
