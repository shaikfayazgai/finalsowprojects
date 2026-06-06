/**
 * Spec-shaped analytics mock — used until an /api/analytics endpoint
 * ships. Window: last 90 days.
 */

export interface SkillRow {
  skill: string;
  contributors: number;
}

export interface SkillGapRow {
  skill: string;
  level: string;
  waitingTaskCount: number;
}

export interface ThroughputBin {
  weekStart: string;
  tasksCompleted: number;
}

export interface WorkforceMetrics {
  windowDays: number;
  totalContributors: number;
  acceptanceRatePct: number; // 0..100
  acceptanceTrendPt: number; // points vs last quarter
  topSkills: SkillRow[];
  skillGaps: SkillGapRow[];
  throughput: ThroughputBin[];
}

export interface CostBySkill {
  skill: string;
  amountMinor: number;
}

export interface CostByProject {
  project: string;
  amountMinor: number;
}

export interface EconomicMetrics {
  windowDays: number;
  totalCommittedMinor: number;
  totalPaidMinor: number;
  platformFeesMinor: number;
  platformFeesPct: number;
  costBySkill: CostBySkill[];
  costByProject: CostByProject[];
  savingsVsSalariedPct: number;
}

export function getWorkforceMetricsMock(): WorkforceMetrics {
  return {
    windowDays: 90,
    totalContributors: 132,
    acceptanceRatePct: 87,
    acceptanceTrendPt: 3,
    topSkills: [
      { skill: "React", contributors: 48 },
      { skill: "Python", contributors: 36 },
      { skill: "Figma", contributors: 28 },
      { skill: "TypeScript", contributors: 26 },
      { skill: "SQL", contributors: 22 },
      { skill: "Node.js", contributors: 19 },
      { skill: "AWS", contributors: 16 },
      { skill: "Tailwind", contributors: 14 },
      { skill: "PostgreSQL", contributors: 12 },
      { skill: "Next.js", contributors: 11 },
    ],
    skillGaps: [
      { skill: "Snowflake", level: "L3", waitingTaskCount: 8 },
      { skill: "Rust", level: "L2", waitingTaskCount: 3 },
      { skill: "Kotlin", level: "L3", waitingTaskCount: 2 },
      { skill: "Solidity", level: "L2", waitingTaskCount: 1 },
    ],
    throughput: [
      { weekStart: "2026-03-02", tasksCompleted: 14 },
      { weekStart: "2026-03-09", tasksCompleted: 17 },
      { weekStart: "2026-03-16", tasksCompleted: 21 },
      { weekStart: "2026-03-23", tasksCompleted: 18 },
      { weekStart: "2026-03-30", tasksCompleted: 24 },
      { weekStart: "2026-04-06", tasksCompleted: 22 },
      { weekStart: "2026-04-13", tasksCompleted: 26 },
      { weekStart: "2026-04-20", tasksCompleted: 28 },
      { weekStart: "2026-04-27", tasksCompleted: 24 },
      { weekStart: "2026-05-04", tasksCompleted: 30 },
      { weekStart: "2026-05-11", tasksCompleted: 32 },
      { weekStart: "2026-05-18", tasksCompleted: 27 },
    ],
  };
}

export function getEconomicMetricsMock(): EconomicMetrics {
  return {
    windowDays: 90,
    totalCommittedMinor: 484_000_000,
    totalPaidMinor: 428_000_000,
    platformFeesMinor: 60_600_000,
    platformFeesPct: 15,
    costBySkill: [
      { skill: "Backend (Python/Node)", amountMinor: 142_000_000 },
      { skill: "Frontend (React/TS)", amountMinor: 124_000_000 },
      { skill: "Design (Figma)", amountMinor: 78_000_000 },
      { skill: "Data (SQL/dbt)", amountMinor: 56_000_000 },
      { skill: "DevOps (AWS/K8s)", amountMinor: 42_000_000 },
      { skill: "QA / Test", amountMinor: 22_000_000 },
      { skill: "PM", amountMinor: 14_000_000 },
      { skill: "Other", amountMinor: 6_000_000 },
    ],
    costByProject: [
      { project: "Reporting V2", amountMinor: 144_000_000 },
      { project: "Helios Q3", amountMinor: 128_000_000 },
      { project: "Auth modernize", amountMinor: 64_000_000 },
      { project: "Pricing refresh", amountMinor: 38_000_000 },
      { project: "Onboarding revamp", amountMinor: 32_000_000 },
    ],
    savingsVsSalariedPct: 34,
  };
}

export interface AnalyticsOverview {
  windowDays: number;
  workforce: {
    totalContributors: number;
    acceptanceRatePct: number;
    acceptanceTrendPt: number;
    skillGapTasks: number;
    skillGapCount: number;
    avgWeeklyThroughput: number;
    topSkill: string;
  };
  economic: {
    totalCommittedMinor: number;
    totalPaidMinor: number;
    platformFeesMinor: number;
    platformFeesPct: number;
    savingsVsSalariedPct: number;
    topProject: string;
  };
}

export function getAnalyticsOverviewMock(): AnalyticsOverview {
  const w = getWorkforceMetricsMock();
  const e = getEconomicMetricsMock();
  const throughputSum = w.throughput.reduce((a, b) => a + b.tasksCompleted, 0);
  const avgWeekly =
    w.throughput.length > 0 ? Math.round(throughputSum / w.throughput.length) : 0;

  return {
    windowDays: w.windowDays,
    workforce: {
      totalContributors: w.totalContributors,
      acceptanceRatePct: w.acceptanceRatePct,
      acceptanceTrendPt: w.acceptanceTrendPt,
      skillGapTasks: w.skillGaps.reduce((a, g) => a + g.waitingTaskCount, 0),
      skillGapCount: w.skillGaps.length,
      avgWeeklyThroughput: avgWeekly,
      topSkill: w.topSkills[0]?.skill ?? "—",
    },
    economic: {
      totalCommittedMinor: e.totalCommittedMinor,
      totalPaidMinor: e.totalPaidMinor,
      platformFeesMinor: e.platformFeesMinor,
      platformFeesPct: e.platformFeesPct,
      savingsVsSalariedPct: e.savingsVsSalariedPct,
      topProject: e.costByProject[0]?.project ?? "—",
    },
  };
}

export function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}
