/**
 * Derive earnings totals and recent contributions from the live
 * contributor task store. Used by Progress header + Earnings Panel so
 * approving a task in the demo ripples to the contributor's earnings
 * snapshot immediately.
 *
 * Falls back to static `contributorProgress` totals for fields that
 * aren't yet trackable from task data (lifetime, year-to-date carrying
 * historical mock data we don't want to lose for demo realism).
 */

"use client";

import * as React from "react";
import {
  useContributorTasksStore,
  type Task,
} from "@/lib/stores/contributor-tasks-store";
import {
  contributorProgress,
  type ContributionEarning,
  type EarningsTotals,
} from "@/mocks/data/contributor-progress";

const cents = (dollars: number) => Math.round(dollars * 100);

function payoutCentsFromTask(t: Task): number {
  const value = Number(t.payoutAmount.replace(/[^0-9]/g, "")) || 0;
  return cents(value);
}

function bonusForTask(t: Task): { label: string; amount: number } | undefined {
  if (t.firstTryAccept) return { label: "First-try accept", amount: cents(40) };
  if (t.credential) return { label: t.credential.name, amount: cents(40) };
  return undefined;
}

function payoutMonth(t: Task): string {
  const raw = t.acceptedAt ?? t.lastActivityAt;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return "2026-05";
}

export interface DerivedEarnings {
  totals: EarningsTotals;
  recentContributions: ContributionEarning[];
  thisMonthDelta: number;
}

export function useDerivedEarnings(): DerivedEarnings {
  const tasksById = useContributorTasksStore((s) => s.tasksById);

  return React.useMemo(() => {
    const completed = Object.values(tasksById).filter(
      (t) => t.state === "completed" || t.state === "approved",
    );

    const now = new Date();
    const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastYM = (() => {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    })();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const quarterStart = new Date(now.getFullYear(), currentQuarter * 3, 1);

    let lifetime = 0;
    let thisYear = 0;
    let thisQuarter = 0;
    let thisMonth = 0;
    let lastMonth = 0;

    for (const t of completed) {
      const c = payoutCentsFromTask(t);
      const bonus = bonusForTask(t)?.amount ?? 0;
      const total = c + bonus;
      lifetime += total;
      const dateRaw = t.acceptedAt ?? t.lastActivityAt;
      const d = new Date(dateRaw);
      if (!isNaN(d.getTime())) {
        if (d.getFullYear() === now.getFullYear()) thisYear += total;
        if (d >= quarterStart) thisQuarter += total;
        const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (ym === currentYM) thisMonth += total;
        if (ym === lastYM) lastMonth += total;
      }
    }

    // Pending = total payout for completed tasks whose acceptedAt is in
    // the current pay window (last 30 days, approximation).
    const pending = completed
      .filter((t) => {
        const d = new Date(t.acceptedAt ?? t.lastActivityAt);
        if (isNaN(d.getTime())) return false;
        const diffDays = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays <= 15;
      })
      .reduce((acc, t) => acc + payoutCentsFromTask(t) + (bonusForTask(t)?.amount ?? 0), 0);

    // Merge with historical mock totals so the lifetime number is rich
    // for demo even if the live store only has a handful of completions.
    const seededLifetime = contributorProgress.earnings.lifetime;
    const finalLifetime = Math.max(lifetime, seededLifetime);

    const totals: EarningsTotals = {
      lifetime: finalLifetime,
      thisYear: thisYear || contributorProgress.earnings.thisYear,
      thisQuarter: thisQuarter || contributorProgress.earnings.thisQuarter,
      thisMonth: thisMonth || contributorProgress.earnings.thisMonth,
      pending: pending || contributorProgress.earnings.pending,
      nextPayoutAmount: pending || contributorProgress.earnings.nextPayoutAmount,
      nextPayoutDate: contributorProgress.earnings.nextPayoutDate,
      currency: contributorProgress.earnings.currency,
    };

    const recentContributions: ContributionEarning[] = completed
      .slice()
      .sort((a, b) => {
        const da = new Date(a.acceptedAt ?? a.lastActivityAt).getTime();
        const db = new Date(b.acceptedAt ?? b.lastActivityAt).getTime();
        return db - da;
      })
      .slice(0, 8)
      .map((t) => ({
        id: `ce-${t.id}`,
        taskTitle: t.title,
        project: t.project,
        acceptedAt: t.acceptedAt ?? t.lastActivityAt,
        amount: payoutCentsFromTask(t),
        payoutStatus: t.payoutReference ? "paid" : "pending",
        bonus: bonusForTask(t),
      }));

    const thisMonthDelta = lastMonth > 0
      ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      : 0;

    return { totals, recentContributions, thisMonthDelta };
  }, [tasksById]);
}

/* Re-export for convenience */
export { payoutMonth };
