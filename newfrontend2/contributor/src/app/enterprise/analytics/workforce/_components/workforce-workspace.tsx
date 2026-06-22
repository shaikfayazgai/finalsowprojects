"use client";

/**
 * Workforce intelligence analytics workspace.
 *
 * Use-case: Enterprise operator needs to answer two questions before their
 * Monday standup: (1) Is my contributor base able to cover upcoming skill
 * requirements? (2) Are throughput and acceptance trending well?
 *
 * H1 visibility: Four KPI cards surface the most actionable numbers first —
 *   contributors, acceptance, avg tasks, and gap count (red if non-zero).
 * H6 recognition: Skill bars are sorted descending — operators see their top
 *   skills at a glance without reading numbers.
 * H7 flexibility: Skill gaps section is shown first if non-zero (contextual
 *   priority), throughput chart for trend-chasers below.
 * H8 minimalist: Acceptance rate merged into KPI strip; removed the separate
 *   "Acceptance rate" section which just repeated a number already in KPIs.
 *
 * Layout: back → header → KPI strip → gap alert (conditional) → skill gaps
 *   table (conditional) → skills inventory bars → throughput bar chart.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { getWorkforceMetricsMock } from "@/lib/analytics/analytics-mock";
import { AURORA_ACCENT, DASH_CARD } from "@/app/admin/_shell/aurora";
import { Banner, Chip, StatCard } from "@/app/admin/_shell/aurora-ui";
import { cn } from "@/lib/utils/cn";

function fmtWeek(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  });
}

export function WorkforceWorkspace() {
  const m = React.useMemo(() => getWorkforceMetricsMock(), []);
  const maxContributors = Math.max(...m.topSkills.map((s) => s.contributors), 1);
  const maxThroughput = Math.max(...m.throughput.map((b) => b.tasksCompleted), 1);
  const gapTasks = m.skillGaps.reduce((a, g) => a + g.waitingTaskCount, 0);
  const avgWeekly = Math.round(
    m.throughput.reduce((a, b) => a + b.tasksCompleted, 0) / m.throughput.length,
  );

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Analytics · Workforce
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Workforce intelligence
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Skills coverage, matching bottlenecks, and delivery throughput — last {m.windowDays} days.
        </p>
        <QuickLinks />
      </header>

      {/* KPI strip */}
      <section aria-label="Workforce summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active contributors" value={m.totalContributors} icon={Users} hint={`${m.windowDays}-day window`} />
        <StatCard
          label="Acceptance rate"
          value={`${m.acceptanceRatePct}%`}
          icon={m.acceptanceTrendPt >= 0 ? TrendingUp : TrendingDown}
          hint={`${m.acceptanceTrendPt >= 0 ? "+" : ""}${m.acceptanceTrendPt}pt vs last quarter`}
          hintTone={m.acceptanceTrendPt >= 0 ? "success" : "warning"}
        />
        <StatCard
          label="Avg weekly tasks"
          value={avgWeekly}
          icon={Zap}
          hint="tasks completed / week"
        />
        <StatCard
          label="Skill gap tasks"
          value={gapTasks}
          icon={gapTasks > 0 ? AlertTriangle : CheckCircle2}
          hint={gapTasks > 0 ? `${m.skillGaps.length} skill${m.skillGaps.length === 1 ? "" : "s"} short` : "No unmatched tasks"}
          hintTone={gapTasks > 0 ? "error" : "success"}
        />
      </section>

      {/* Skill gap alert */}
      {gapTasks > 0 && (
        <Banner tone="warning" icon={AlertTriangle} title={`${gapTasks} tasks unmatched beyond 48h`}>
          Skill gaps below may delay project delivery — consider expanding the contributor pool or adjusting task requirements.
        </Banner>
      )}

      {/* Skill gaps detail */}
      {m.skillGaps.length > 0 && (
        <section className={`${DASH_CARD} overflow-hidden`}>
          <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
            <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">Skill gaps</h2>
            <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
              Tasks waiting more than 48h to match a contributor
            </p>
          </div>
          <table className="w-full min-w-[420px]">
            <thead>
              <tr className="border-b border-stroke-subtle">
                <th className="px-5 sm:px-6 py-2.5 text-left font-body text-[10.5px] font-bold uppercase tracking-[0.08em] text-text-tertiary">
                  Skill
                </th>
                <th className="px-5 sm:px-6 py-2.5 text-left font-body text-[10.5px] font-bold uppercase tracking-[0.08em] text-text-tertiary">
                  Level
                </th>
                <th className="px-5 sm:px-6 py-2.5 text-right font-body text-[10.5px] font-bold uppercase tracking-[0.08em] text-text-tertiary">
                  Waiting tasks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke-subtle">
              {m.skillGaps.map((g, i) => (
                <tr
                  key={`${g.skill}-${g.level}-${i}`}
                  className="hover:bg-bg-subtle/60 transition-colors duration-fast"
                >
                  <td className="px-5 sm:px-6 py-3 font-body text-[13px] font-medium text-foreground">
                    {g.skill}
                  </td>
                  <td className="px-5 sm:px-6 py-3">
                    <Chip tone="neutral">{g.level}</Chip>
                  </td>
                  <td className="px-5 sm:px-6 py-3 text-right font-mono text-[12.5px] font-bold text-warning-text tabular-nums">
                    {g.waitingTaskCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Skills inventory */}
      <section className={`${DASH_CARD} overflow-hidden`}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">Skills inventory</h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
            Top {m.topSkills.length} skills by contributor count
          </p>
        </div>
        <ul className="divide-y divide-stroke-subtle">
          {m.topSkills.map((s) => {
            const pct = (s.contributors / maxContributors) * 100;
            return (
              <li
                key={s.skill}
                className="px-5 sm:px-6 py-3 min-h-[48px] flex items-center gap-4 hover:bg-bg-subtle/60 transition-colors duration-fast"
              >
                <span className="font-body text-[13px] font-medium text-foreground w-28 shrink-0 truncate">
                  {s.skill}
                </span>
                <div className="flex-1 h-2 rounded-full bg-foreground/[0.08] overflow-hidden min-w-[80px]">
                  <div
                    className="h-full rounded-full transition-all duration-fast"
                    style={{ width: `${pct}%`, backgroundImage: AURORA_ACCENT }}
                  />
                </div>
                <span className="font-mono text-[11.5px] text-text-secondary tabular-nums shrink-0 w-20 text-right">
                  {s.contributors} people
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Throughput chart */}
      <section className={`${DASH_CARD} overflow-hidden`}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle flex items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">Throughput by week</h2>
            <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
              Tasks completed · {m.throughput.length} weeks in window
            </p>
          </div>
          <p className="font-body text-[12px] text-text-tertiary shrink-0">
            Avg{" "}
            <span className="font-display text-[16px] font-bold text-foreground tabular-nums ml-0.5">
              {avgWeekly}
            </span>{" "}
            / wk
          </p>
        </div>
        <div className="px-5 sm:px-6 py-5">
          <div
            className="flex items-end gap-1 h-36"
            role="img"
            aria-label={`Weekly throughput from ${fmtWeek(m.throughput[0]?.weekStart ?? "")} to ${fmtWeek(m.throughput[m.throughput.length - 1]?.weekStart ?? "")}`}
          >
            {m.throughput.map((b) => {
              const pct = (b.tasksCompleted / maxThroughput) * 100;
              return (
                <div key={b.weekStart} className="flex-1 flex flex-col items-stretch min-w-0 group">
                  <div className="flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-md opacity-80 group-hover:opacity-100 transition-opacity duration-fast"
                      style={{ height: `${Math.max(pct, 4)}%`, backgroundImage: AURORA_ACCENT }}
                      title={`${fmtWeek(b.weekStart)}: ${b.tasksCompleted} tasks`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-1">
            {m.throughput.map((b) => (
              <span
                key={b.weekStart}
                className="flex-1 text-center font-mono text-[9px] text-text-tertiary tabular-nums truncate"
              >
                {fmtWeek(b.weekStart)}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─── Utilities ─── */

function BackLink() {
  return (
    <Link
      href="/enterprise/analytics"
      className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Back to analytics
    </Link>
  );
}

function QuickLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/analytics/economic"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Economic dashboard
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/enterprise/projects"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Projects
      </Link>
    </p>
  );
}
