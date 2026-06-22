"use client";

/**
 * Economic analytics workspace — spend, cost breakdown, savings.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { fmtINR, getEconomicMetricsMock } from "@/lib/analytics/analytics-mock";
import { ACCENT_TEXT, AURORA_ACCENT } from "@/app/admin/_shell/aurora";
import { SectionCard } from "@/app/admin/_shell/aurora-ui";

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
          Enterprise · Insights · Analytics · Economic
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Economic
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Committed and paid spend, cost breakdown by skill and project, and estimated savings vs traditional headcount — last {m.windowDays} days.
        </p>
        <RecordLinks />
      </header>

      <div className="rounded-2xl border border-success-border/40 bg-success-subtle/20 backdrop-blur px-4 py-3">
        <p className="font-body text-[13px] font-semibold text-foreground flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5 text-success-text shrink-0" strokeWidth={2} aria-hidden />
          ~{m.savingsVsSalariedPct}% estimated savings vs salaried baseline
        </p>
        <p className="mt-1 font-body text-[12.5px] text-text-secondary">
          Rough benchmark — Phase 2 adds scenario modeling and ROI drilldowns.
        </p>
      </div>

      <SectionCard title="Spend summary" description={`${paidPct}% of committed spend paid out`}>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4 px-5 sm:px-6 py-5">
          <SummaryStat label="Total committed" value={fmtINR(m.totalCommittedMinor)} />
          <SummaryStat label="Total paid" value={fmtINR(m.totalPaidMinor)} highlight />
          <SummaryStat
            label="Platform fees"
            value={fmtINR(m.platformFeesMinor)}
            caption={`${m.platformFeesPct}% of gross`}
          />
        </dl>
      </SectionCard>

      <SectionCard
        title="Cost per skill"
        description={`Top ${m.costBySkill.length} skill categories · ${fmtINR(totalCostBySkill)} total`}
      >
        <ul className="divide-y divide-white/60">
          {m.costBySkill.map((s) => {
            const pct = (s.amountMinor / totalCostBySkill) * 100;
            return (
              <li key={s.skill} className="px-5 sm:px-6 py-2.5 min-h-[44px] flex items-center gap-4 hover:bg-white/50 transition-colors duration-fast">
                <span className="font-body text-[13px] font-medium text-foreground w-40 shrink-0 truncate">
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
      </SectionCard>

      <SectionCard title="Cost per project" description="Top 5 projects by spend">
        <ul className="divide-y divide-white/60">
          {m.costByProject.map((p) => {
            const pct = (p.amountMinor / maxByProject) * 100;
            return (
              <li
                key={p.project}
                className="px-5 sm:px-6 py-2.5 min-h-[44px] flex items-center gap-4 hover:bg-white/50 transition-colors duration-fast"
              >
                <span className="font-body text-[13px] font-medium text-foreground flex-1 min-w-0 truncate">
                  {p.project}
                </span>
                <div className="hidden sm:block w-32 h-2 rounded-full bg-foreground/[0.08] overflow-hidden shrink-0">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundImage: AURORA_ACCENT }}
                  />
                </div>
                <span className="font-mono text-[12px] text-foreground tabular-nums shrink-0 font-semibold">
                  {fmtINR(p.amountMinor)}
                </span>
              </li>
            );
          })}
        </ul>
      </SectionCard>
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

function SummaryStat({
  label,
  value,
  caption,
  highlight,
}: {
  label: string;
  value: string;
  caption?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd
        className="mt-1 font-display text-[20px] font-semibold tabular-nums tracking-tight text-foreground"
        style={highlight ? ACCENT_TEXT : undefined}
      >
        {value}
      </dd>
      {caption && <dd className="mt-0.5 font-body text-[11px] text-text-tertiary">{caption}</dd>}
    </div>
  );
}
