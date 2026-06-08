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

export const MOCK_SKILLS: MockSkill[] = [
  { id: "skill-react", name: "React", level: "L3", category: "engineering", tasksCompletedWithThisSkill: 8, evidenceCount: 3 },
  { id: "skill-ts", name: "TypeScript", level: "L3", category: "engineering", tasksCompletedWithThisSkill: 11, evidenceCount: 4 },
  { id: "skill-figma", name: "Figma", level: "L2", category: "design", tasksCompletedWithThisSkill: 5, evidenceCount: 2 },
  { id: "skill-a11y", name: "Accessibility", level: "L2", category: "design", tasksCompletedWithThisSkill: 4, evidenceCount: 1 },
  { id: "skill-postgres", name: "Postgres", level: "L2", category: "data", tasksCompletedWithThisSkill: 3, evidenceCount: 1 },
];

const PROFILES: Record<Persona, MockDigitalTwin> = {
  internal: {
    skillsDeclared: 5,
    tasksReinforcing: 14,
    tasksCompleted30d: 14,
    tasksInFlight: 1,
    tasksDeclined30d: 0,
    onTimePct: 89,
    firstTryAcceptPct: 71,
    withdrawals: 0,
    acceptanceRatePct: 92,
    weekDays: "Mon–Fri",
    weekHoursRange: "09:00–18:00 IST",
    hoursPerWeek: 38,
    updatedAt: "2026-04-24T12:15:00.000Z",
    totalSubmissions: 26,
    averageReviewScore: 4.5,
    totalHoursLogged: 88,
    reworkRatePct: 12,
    streakDays: 11,
    longestStreak: 24,
    performanceTrend: "improving",
    topSkills: [
      { skill: "React", tasksCompleted: 10, avgScore: 4.6 },
      { skill: "TypeScript", tasksCompleted: 9, avgScore: 4.4 },
      { skill: "Accessibility", tasksCompleted: 5, avgScore: 4.2 },
    ],
    monthlyActivity: [
      { month: "Nov", tasksCompleted: 3, hoursLogged: 12 },
      { month: "Dec", tasksCompleted: 4, hoursLogged: 16 },
      { month: "Jan", tasksCompleted: 4, hoursLogged: 14 },
      { month: "Feb", tasksCompleted: 5, hoursLogged: 19 },
      { month: "Mar", tasksCompleted: 4, hoursLogged: 17 },
      { month: "Apr", tasksCompleted: 6, hoursLogged: 27 },
    ],
    aiInsights: [
      "First submissions with attached examples see higher first-try acceptance.",
      "Short-cycle UI tasks match your strongest delivery window.",
      "Accessibility rubric tasks score above your platform average.",
    ],
  },
  freelancer: {
    skillsDeclared: 5,
    tasksReinforcing: 11,
    tasksCompleted30d: 9,
    tasksInFlight: 2,
    tasksDeclined30d: 1,
    onTimePct: 84,
    firstTryAcceptPct: 65,
    withdrawals: 1,
    acceptanceRatePct: 88,
    weekDays: "Flexible",
    weekHoursRange: "varies · IST",
    hoursPerWeek: 22,
    updatedAt: "2026-04-23T09:40:00.000Z",
    totalSubmissions: 22,
    averageReviewScore: 4.2,
    totalHoursLogged: 62,
    reworkRatePct: 16,
    streakDays: 6,
    longestStreak: 18,
    performanceTrend: "steady",
    topSkills: [
      { skill: "React", tasksCompleted: 8, avgScore: 4.3 },
      { skill: "Quality Review", tasksCompleted: 6, avgScore: 4.1 },
      { skill: "Prompting", tasksCompleted: 5, avgScore: 4.0 },
    ],
    monthlyActivity: [
      { month: "Nov", tasksCompleted: 2, hoursLogged: 8 },
      { month: "Dec", tasksCompleted: 3, hoursLogged: 11 },
      { month: "Jan", tasksCompleted: 3, hoursLogged: 10 },
      { month: "Feb", tasksCompleted: 4, hoursLogged: 14 },
      { month: "Mar", tasksCompleted: 3, hoursLogged: 12 },
      { month: "Apr", tasksCompleted: 5, hoursLogged: 18 },
    ],
    aiInsights: [
      "Declining tasks outside your declared skill band keeps acceptance rate stable.",
      "Batching similar annotation work reduces context-switch rework.",
      "Portfolio evidence on React tasks correlates with faster mentor sign-off.",
    ],
  },
  student: {
    skillsDeclared: 3,
    tasksReinforcing: 6,
    tasksCompleted30d: 5,
    tasksInFlight: 1,
    tasksDeclined30d: 0,
    onTimePct: 78,
    firstTryAcceptPct: 60,
    withdrawals: 0,
    acceptanceRatePct: 82,
    weekDays: "Mon–Sat",
    weekHoursRange: "17:00–22:00 IST",
    hoursPerWeek: 15,
    updatedAt: "2026-04-22T18:20:00.000Z",
    totalSubmissions: 12,
    averageReviewScore: 3.9,
    totalHoursLogged: 34,
    reworkRatePct: 22,
    streakDays: 4,
    longestStreak: 9,
    performanceTrend: "improving",
    topSkills: [
      { skill: "React", tasksCompleted: 4, avgScore: 3.8 },
      { skill: "Accessibility", tasksCompleted: 3, avgScore: 4.0 },
      { skill: "Figma", tasksCompleted: 2, avgScore: 3.7 },
    ],
    monthlyActivity: [
      { month: "Nov", tasksCompleted: 1, hoursLogged: 4 },
      { month: "Dec", tasksCompleted: 2, hoursLogged: 6 },
      { month: "Jan", tasksCompleted: 2, hoursLogged: 7 },
      { month: "Feb", tasksCompleted: 2, hoursLogged: 8 },
      { month: "Mar", tasksCompleted: 3, hoursLogged: 9 },
      { month: "Apr", tasksCompleted: 4, hoursLogged: 12 },
    ],
    aiInsights: [
      "Evening delivery windows align with your on-time completion pattern.",
      "Smaller task scopes show fewer rework cycles for you.",
      "Supervisor-approved skills match your highest-scoring submissions.",
    ],
  },
  women: {
    skillsDeclared: 4,
    tasksReinforcing: 8,
    tasksCompleted30d: 7,
    tasksInFlight: 1,
    tasksDeclined30d: 0,
    onTimePct: 92,
    firstTryAcceptPct: 75,
    withdrawals: 0,
    acceptanceRatePct: 94,
    weekDays: "Mon–Fri",
    weekHoursRange: "10:00–14:00 IST",
    hoursPerWeek: 18,
    updatedAt: "2026-04-24T08:05:00.000Z",
    totalSubmissions: 15,
    averageReviewScore: 4.4,
    totalHoursLogged: 48,
    reworkRatePct: 10,
    streakDays: 8,
    longestStreak: 15,
    performanceTrend: "steady",
    topSkills: [
      { skill: "Technical Writing", tasksCompleted: 5, avgScore: 4.5 },
      { skill: "React", tasksCompleted: 4, avgScore: 4.3 },
      { skill: "Documentation", tasksCompleted: 3, avgScore: 4.4 },
    ],
    monthlyActivity: [
      { month: "Nov", tasksCompleted: 2, hoursLogged: 6 },
      { month: "Dec", tasksCompleted: 2, hoursLogged: 7 },
      { month: "Jan", tasksCompleted: 3, hoursLogged: 8 },
      { month: "Feb", tasksCompleted: 3, hoursLogged: 9 },
      { month: "Mar", tasksCompleted: 3, hoursLogged: 10 },
      { month: "Apr", tasksCompleted: 4, hoursLogged: 14 },
    ],
    aiInsights: [
      "Mid-morning start times correlate with your highest review scores.",
      "Documentation tasks show your strongest first-try acceptance.",
      "Consistent weekly cadence supports your reliability band.",
    ],
  },
};

export function getMockTwin(persona: Persona): MockDigitalTwin {
  return PROFILES[persona];
}
