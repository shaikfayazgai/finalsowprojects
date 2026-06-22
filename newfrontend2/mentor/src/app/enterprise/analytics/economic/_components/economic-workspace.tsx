"use client";

/**
 * Economic analytics workspace.
 *
 * Use-case: Enterprise operator reviews committed vs paid spend, understands
 * cost distribution by skill and project, and validates platform ROI against
 * salaried headcount.
 *
 * H1 visibility: Three headline KPIs surface immediately before any detail.
 * H6 recognition: Savings banner is the first signal after KPIs — operators
 *   recognise the ROI story without reading the bar charts.
 * H7 flexibility: Back link + cross-links let power users move fluidly.
 * H8 minimalist: Removed the extra "Phase 2 adds scenario modeling" note from
 *   the banner — it's wayfinding noise at this point in the flow.
 *
 * Layout: back → header → savings banner → KPI strip → cost-by-skill bars →
 *   cost-by-project bars.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { fmtINR, getEconomicMetricsMock } from "@/lib/analytics/analytics-mock";
import { AURORA_ACCENT, DASH_CARD } from "@/app/admin/_shell/aurora";
import { Banner, StatCard } from "@/app/admin/_shell/aurora-ui";

export function EconomicWorkspace() {
  const m = React.useMemo(() => getEconomicMetricsMock(), []);
  const totalCostBySkill = m.costBySkill.reduce((a, b) => a + b.amountMinor, 0);
  const maxByProject = Math.max(...m.costByProject.map((p) => p.amountMinor), 1);
  const paidPct = Math.round((m.totalPaidMinor / m.totalCommittedMinor) * 100);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Analytics · Economic
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Economic
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Committed and paid spend, cost breakdown by skill and project — last {m.windowDays} days.
        </p>
        <QuickLinks />
      </header>

      {/* Savings banner */}
      <Banner tone="success" icon={TrendingUp} title={`~${m.savingsVsSalariedPct}% estimated savings vs salaried baseline`}>
        Rough benchmark — Phase 2 adds scenario modeling and ROI drilldowns.
      </Banner>

      {/* KPI strip */}
      <section aria-label="Spend summary" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total committed" value={fmtINR(m.totalCommittedMinor)} hint={`${m.windowDays}-day window`} />
        <StatCard
          label="Total paid"
          value={fmtINR(m.totalPaidMinor)}
          hint={`${paidPct}% of committed`}
          hintTone="success"
        />
        <StatCard
          label="Platform fees"
          value={fmtINR(m.platformFeesMinor)}
          hint={`${m.platformFeesPct}% of gross`}
        />
      </section>

      {/* Cost by skill */}
      <section className={`${DASH_CARD} overflow-hidden`}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">
              Cost per skill
            </h2>
            <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
              Top {m.costBySkill.length} skill categories · {fmtINR(totalCostBySkill)} total
            </p>
          </div>
        </div>
        <ul className="divide-y divide-stroke-subtle">
          {m.costBySkill.map((s) => {
            const pct = (s.amountMinor / totalCostBySkill) * 100;
            return (
              <li
                key={s.skill}
                className="px-5 sm:px-6 py-3 min-h-[48px] flex items-center gap-4 hover:bg-bg-subtle/60 transition-colors duration-fast"
              >
                <span className="font-body text-[13px] font-medium text-foreground w-44 shrink-0 truncate">
                  {s.skill}
                </span>
                <div className="flex-1 h-2 rounded-full bg-foreground/[0.08] overflow-hidden min-w-[80px]">
                  <div
                    className="h-full rounded-full transition-all duration-fast"
                    style={{ width: `${pct}%`, backgroundImage: AURORA_ACCENT }}
                  />
                </div>
                <span className="font-mono text-[11.5px] text-text-secondary tabular-nums shrink-0 w-24 text-right">
                  {fmtINR(s.amountMinor)}
                </span>
                <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums shrink-0 w-10 text-right">
                  {Math.round(pct)}%
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Cost by project */}
      <section className={`${DASH_CARD} overflow-hidden`}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">
            Cost per project
          </h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Top 5 projects by spend</p>
        </div>
        <ul className="divide-y divide-stroke-subtle">
          {m.costByProject.map((p) => {
            const pct = (p.amountMinor / maxByProject) * 100;
            return (
              <li
                key={p.project}
                className="px-5 sm:px-6 py-3 min-h-[48px] flex items-center gap-4 hover:bg-bg-subtle/60 transition-colors duration-fast"
              >
                <span className="font-body text-[13px] font-medium text-foreground flex-1 min-w-0 truncate">
                  {p.project}
                </span>
                <div className="hidden sm:block w-36 h-2 rounded-full bg-foreground/[0.08] overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full transition-all duration-fast"
                    style={{ width: `${pct}%`, backgroundImage: AURORA_ACCENT }}
                  />
                </div>
                <span className="font-mono text-[12.5px] font-bold text-foreground tabular-nums shrink-0">
                  {fmtINR(p.amountMinor)}
                </span>
              </li>
            );
          })}
        </ul>
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
        href="/enterprise/billing"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Billing
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/enterprise/analytics/workforce"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Workforce dashboard
      </Link>
    </p>
  );
}
