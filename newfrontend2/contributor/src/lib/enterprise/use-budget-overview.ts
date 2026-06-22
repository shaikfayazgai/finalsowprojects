/**
 * Budget Intelligence overview — program-level plan vs commit vs forecast.
 *
 * Pure derivation from `enterpriseProjects`. Forecast extrapolates the
 * current burn rate (committed ÷ days elapsed) across the full program
 * duration. Variance = forecast − plan.
 */

"use client";

import * as React from "react";
import {
  enterpriseProjects,
  type EnterpriseProject,
} from "@/mocks/data/enterprise-v2-orchestration";

export type ProgramRiskTier = "on_track" | "watch" | "at_risk" | "overrun" | "completed";

export interface ProgramBudget {
  project: EnterpriseProject;
  planCents: number;
  committedCents: number;
  forecastCents: number;
  varianceCents: number;
  utilizationPct: number;
  /** Days elapsed since program started, clamped >= 1. */
  daysElapsed: number;
  /** Total scheduled program days (start → target), clamped >= 1. */
  daysTotal: number;
  /** Days remaining until target date — negative if past target. */
  daysRemaining: number;
  /** Burn rate in cents/day. */
  burnRateCentsPerDay: number;
  risk: ProgramRiskTier;
}

export interface BudgetOverview {
  programs: ProgramBudget[];
  totals: {
    planCents: number;
    committedCents: number;
    forecastCents: number;
    varianceCents: number;
    utilizationPct: number;
    burnRateCentsPerDay: number;
  };
  /** Programs flagged for watch — at_risk, overrun, or watch tier. */
  watchlist: ProgramBudget[];
  /** Weekly buckets for the burn chart — actual + forecast extrapolation. */
  chart: BurnChartPoint[];
}

export interface BurnChartPoint {
  weekIdx: number;
  label: string;
  /** Sum of planned spend up to this week (linear plan). */
  planCumCents: number;
  /** Sum of actual committed spend up to this week (forecasted past today). */
  actualCumCents: number;
  /** True for weeks past today — drawn dotted. */
  isForecast: boolean;
}

const WEEKS = 16;
const WEEK_MS = 7 * 86400000;

function dayMs(): number {
  return 86400000;
}

function riskTier(p: EnterpriseProject, utilization: number, variance: number): ProgramRiskTier {
  if (p.health === "completed") return "completed";
  if (variance > 0 || utilization > 100) return "overrun";
  if (utilization > 90 || p.health === "at_risk") return "at_risk";
  if (utilization > 75 || p.health === "watch") return "watch";
  return "on_track";
}

function deriveProgram(p: EnterpriseProject, now: number): ProgramBudget {
  const start = new Date(p.startedAt).getTime() || now;
  const end = new Date(p.targetDate).getTime() || now;
  const daysTotal = Math.max(1, Math.round((end - start) / dayMs()));
  const elapsedRaw = Math.round((now - start) / dayMs());
  const daysElapsed = Math.max(1, Math.min(daysTotal, elapsedRaw));
  const daysRemaining = Math.round((end - now) / dayMs());

  const planCents = p.budget;
  const committedCents = p.spent;
  const burnRateCentsPerDay = committedCents / daysElapsed;
  // Forecast = burn rate × full duration. For completed programs forecast equals committed.
  const forecastCents = p.health === "completed"
    ? committedCents
    : Math.round(burnRateCentsPerDay * daysTotal);
  const varianceCents = forecastCents - planCents;
  const utilizationPct = planCents > 0 ? (committedCents / planCents) * 100 : 0;
  const risk = riskTier(p, utilizationPct, varianceCents);

  return {
    project: p,
    planCents,
    committedCents,
    forecastCents,
    varianceCents,
    utilizationPct,
    daysElapsed,
    daysTotal,
    daysRemaining,
    burnRateCentsPerDay,
    risk,
  };
}

function buildChart(programs: ProgramBudget[], now: number): BurnChartPoint[] {
  const totalPlan = programs.reduce((a, p) => a + p.planCents, 0);
  const totalCommitted = programs.reduce((a, p) => a + p.committedCents, 0);
  const burnRate = programs.reduce((a, p) => a + p.burnRateCentsPerDay, 0);

  const out: BurnChartPoint[] = [];
  // Anchor the chart so this week sits at index = WEEKS - 4 (recent weeks visible + 4 forecast weeks ahead).
  const todayWeekIdx = WEEKS - 4;
  for (let i = 0; i < WEEKS; i++) {
    const offsetWeeks = i - todayWeekIdx;
    const ts = now + offsetWeeks * WEEK_MS;
    const planCumCents = (totalPlan * (i + 1)) / WEEKS;
    const isForecast = offsetWeeks > 0;
    const actualCumCents = isForecast
      ? totalCommitted + burnRate * offsetWeeks * 7
      : (totalCommitted * (i + 1)) / (todayWeekIdx + 1);
    out.push({
      weekIdx: i,
      label: new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" }),
      planCumCents: Math.round(planCumCents),
      actualCumCents: Math.round(actualCumCents),
      isForecast,
    });
  }
  return out;
}

export function useBudgetOverview(): BudgetOverview {
  return React.useMemo(() => {
    const now = Date.now();
    const programs = enterpriseProjects.map((p) => deriveProgram(p, now));

    const planCents = programs.reduce((a, p) => a + p.planCents, 0);
    const committedCents = programs.reduce((a, p) => a + p.committedCents, 0);
    const forecastCents = programs.reduce((a, p) => a + p.forecastCents, 0);
    const varianceCents = forecastCents - planCents;
    const utilizationPct = planCents > 0 ? (committedCents / planCents) * 100 : 0;
    const burnRateCentsPerDay = programs.reduce(
      (a, p) => a + p.burnRateCentsPerDay,
      0,
    );

    const watchlist = programs
      .filter((p) => p.risk === "watch" || p.risk === "at_risk" || p.risk === "overrun")
      .sort((a, b) => b.utilizationPct - a.utilizationPct);

    const chart = buildChart(programs, now);

    return {
      programs,
      totals: {
        planCents,
        committedCents,
        forecastCents,
        varianceCents,
        utilizationPct,
        burnRateCentsPerDay,
      },
      watchlist,
      chart,
    };
  }, []);
}
