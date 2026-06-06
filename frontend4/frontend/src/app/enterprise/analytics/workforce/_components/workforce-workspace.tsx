"use client";

/**
 * Workforce intelligence workspace — skills, gaps, throughput, acceptance.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getWorkforceMetricsMock } from "@/lib/analytics/analytics-mock";
import { DashboardSection } from "@/components/meridian/dashboard";
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
          Enterprise · Insights · Analytics · Workforce
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Workforce intelligence
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Skills coverage, matching bottlenecks, and delivery throughput — last {m.windowDays} days.
        </p>
        <RecordLinks />
      </header>

      {gapTasks > 0 && (
        <ContextBanner title={`${gapTasks} tasks unmatched beyond 48h`}>
          Skill gaps below may delay project delivery — consider expanding contributor pool or adjusting task requirements.
        </ContextBanner>
      )}

      <DashboardSection title="Workforce summary" description={`${m.totalContributors} active contributors in window`}>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Contributors" value={String(m.totalContributors)} />
          <SummaryStat
            label="Acceptance rate"
            value={`${m.acceptanceRatePct}%`}
            caption={`${m.acceptanceTrendPt >= 0 ? "+" : ""}${m.acceptanceTrendPt}pt vs last quarter`}
            highlight={m.acceptanceRatePct >= 85}
          />
          <SummaryStat label="Avg weekly tasks" value={String(avgWeekly)} />
          <SummaryStat
            label="Skill gap tasks"
            value={String(gapTasks)}
            alert={gapTasks > 0}
          />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em] pb-4">
            Skills inventory
          </h2>
          <p className="-mt-2 pb-4 font-body text-[12.5px] text-text-secondary">
            Top {m.topSkills.length} skills by contributor count
          </p>
        </div>
        <ul className="divide-y divide-stroke-subtle">
          {m.topSkills.map((s) => {
            const pct = (s.contributors / maxContributors) * 100;
            return (
              <li key={s.skill} className="px-5 py-2.5 min-h-[44px] flex items-center gap-4">
                <span className="font-body text-[13px] font-medium text-foreground w-28 shrink-0 truncate">
                  {s.skill}
                </span>
                <div className="flex-1 h-2 rounded-full bg-bg-subtle overflow-hidden min-w-[80px]">
                  <div
                    className="h-full rounded-full bg-brand transition-all duration-fast"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono text-[11.5px] text-text-secondary tabular-nums shrink-0 w-24 text-right">
                  {s.contributors} people
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <DashboardSection
        title="Skill gaps"
        description="Tasks waiting more than 48h to match a contributor"
      >
        {m.skillGaps.length === 0 ? (
          <p className="font-body text-[13px] text-text-tertiary italic -mx-5 px-5">
            No unmatched tasks beyond the 48h window.
          </p>
        ) : (
          <ul className="divide-y divide-stroke-subtle -mx-5">
            {m.skillGaps.map((g, i) => (
              <li
                key={`${g.skill}-${g.level}-${i}`}
                className="flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px] bg-warning-subtle/10"
              >
                <span className="min-w-0 flex-1">
                  <span className="font-body text-[13px] font-medium text-foreground">{g.skill}</span>
                  <span className="font-mono text-[11px] text-text-tertiary ml-2">{g.level}</span>
                </span>
                <span className="font-mono text-[12px] font-semibold text-warning-text tabular-nums shrink-0">
                  {g.waitingTaskCount} task{g.waitingTaskCount === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-4 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Throughput by week
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Tasks completed · {m.throughput.length} weeks in window
          </p>
        </div>
        <div className="px-5 py-5">
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
                      className="w-full rounded-t-md bg-brand/90 group-hover:bg-brand transition-colors duration-fast"
                      style={{ height: `${Math.max(pct, 4)}%` }}
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

      <DashboardSection title="Acceptance rate" description="First-pass acceptance across all submissions">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 -mx-5 px-5">
          <p className="font-body text-[28px] font-semibold text-foreground tabular-nums">
            {m.acceptanceRatePct}%
          </p>
          <p className="font-body text-[13px] text-text-secondary flex items-center gap-1.5">
            Trend vs last quarter:
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-mono font-semibold tabular-nums",
                m.acceptanceTrendPt >= 0 ? "text-success-text" : "text-warning-text",
              )}
            >
              {m.acceptanceTrendPt >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              )}
              {m.acceptanceTrendPt > 0 ? "+" : ""}
              {m.acceptanceTrendPt}pt
            </span>
          </p>
        </div>
      </DashboardSection>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/analytics"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to analytics
    </Link>
  );
}

function RecordLinks() {
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

function SummaryStat({
  label,
  value,
  caption,
  highlight,
  alert,
}: {
  label: string;
  value: string;
  caption?: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          alert ? "text-error-text" : highlight ? "text-brand" : "text-foreground",
        )}
      >
        {value}
      </dd>
      {caption && <dd className="mt-0.5 font-body text-[11px] text-text-tertiary">{caption}</dd>}
    </div>
  );
}

function ContextBanner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-warning-border bg-warning-subtle/50 px-4 py-3">
      <p className="font-body text-[13px] font-semibold flex items-center gap-1.5 text-foreground">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}
