"use client";

/**
 * Analytics index workspace — Phase 1 baseline with Workforce + Economic dashboards.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  fmtINR,
  getAnalyticsOverviewMock,
} from "@/lib/analytics/analytics-mock";
import { cn } from "@/lib/utils/cn";
import { ACCENT_TEXT } from "@/app/admin/_shell/aurora";
import { SectionCard } from "@/app/admin/_shell/aurora-ui";

export function AnalyticsWorkspace() {
  const overview = React.useMemo(() => getAnalyticsOverviewMock(), []);
  const { workforce: w, economic: e } = overview;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Insights · Analytics
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Analytics
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Phase 1 baseline — workforce intelligence and economic spend views for the last {overview.windowDays} days. Deeper cohort analysis and custom reports land in Phase 2.
        </p>
        <RecordLinks />
      </header>

      {w.skillGapTasks > 0 && (
        <ContextBanner title={`${w.skillGapTasks} tasks waiting on skill match (>48h)`}>
          <Link
            href="/enterprise/analytics/workforce"
            className="font-semibold text-warning-text underline underline-offset-2 hover:opacity-80"
          >
            Review workforce intelligence
          </Link>
        </ContextBanner>
      )}

      <SectionCard
        title="Cross-dashboard snapshot"
        description={`Rolling ${overview.windowDays}-day window · mock-backed until API ships`}
      >
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4 px-5 sm:px-6 py-5">
          <SummaryStat
            label="Contributors"
            value={String(w.totalContributors)}
            caption={`Top skill: ${w.topSkill}`}
          />
          <SummaryStat
            label="Acceptance rate"
            value={`${w.acceptanceRatePct}%`}
            caption={`${w.acceptanceTrendPt >= 0 ? "+" : ""}${w.acceptanceTrendPt}pt vs last quarter`}
            highlight={w.acceptanceRatePct >= 85}
          />
          <SummaryStat
            label="Total paid"
            value={fmtINR(e.totalPaidMinor)}
            caption={`${fmtINR(e.totalCommittedMinor)} committed`}
          />
          <SummaryStat
            label="Est. savings"
            value={`~${e.savingsVsSalariedPct}%`}
            caption="vs salaried baseline (rough)"
            highlight
          />
        </dl>
      </SectionCard>

      <SectionCard
        title="Dashboards"
        description="Two baseline views — drill into skills, throughput, spend, and ROI."
      >
        <ul className="divide-y divide-white/60">
          <DashboardRow
            href="/enterprise/analytics/workforce"
            icon={Users}
            title="Workforce intelligence"
            description="Skills inventory, skill gaps, weekly throughput, and acceptance rate across your contributor base."
            stats={[
              { label: "Avg weekly tasks", value: String(w.avgWeeklyThroughput) },
              { label: "Skill gaps", value: String(w.skillGapCount), alert: w.skillGapCount > 0 },
              {
                label: "Acceptance",
                value: `${w.acceptanceRatePct}%`,
                trend: w.acceptanceTrendPt,
              },
            ]}
          />
          <DashboardRow
            href="/enterprise/analytics/economic"
            icon={BadgeDollarSign}
            title="Economic"
            description="Committed and paid spend, cost per skill, cost per project, and savings vs salaried baseline."
            stats={[
              { label: "Paid (90d)", value: fmtINR(e.totalPaidMinor) },
              { label: "Platform fees", value: `${e.platformFeesPct}%` },
              { label: "Top project", value: e.topProject },
            ]}
          />
        </ul>
      </SectionCard>

      <SectionCard title="Phase 2 roadmap" description="Planned for a later release">
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-5 sm:px-6 py-5">
          {[
            { label: "Cohort analysis", detail: "Contributor segments and retention curves" },
            { label: "Report builder", detail: "Custom metrics and scheduled exports" },
            { label: "Scenario modeling", detail: "Spend forecasts and ROI what-if" },
          ].map((item) => (
            <li
              key={item.label}
              className="rounded-xl border border-dashed border-white/60 bg-white/40 px-4 py-3"
            >
              <p className="font-body text-[13px] font-semibold text-text-secondary">{item.label}</p>
              <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{item.detail}</p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function DashboardRow({
  href,
  icon: Icon,
  title,
  description,
  stats,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  stats: Array<{ label: string; value: string; alert?: boolean; trend?: number }>;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex flex-col lg:flex-row lg:items-center gap-4 px-5 sm:px-6 py-4 min-h-[88px]",
          "hover:bg-white/50 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(124,92,246,0.32)]",
        )}
      >
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
            "border-white/70 bg-white/50 text-text-secondary",
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-body text-[14px] font-semibold text-foreground">{title}</span>
            <span className="inline-flex items-center gap-1 font-body text-[11.5px] font-semibold text-text-secondary">
              Open
              <ArrowRight className="h-3 w-3" strokeWidth={2} aria-hidden />
            </span>
          </span>
          <span className="font-body text-[12.5px] text-text-secondary block mt-1 leading-snug max-w-xl">
            {description}
          </span>
        </span>

        <dl className="flex flex-wrap lg:flex-nowrap gap-x-6 gap-y-2 shrink-0">
          {stats.map((s) => (
            <div key={s.label} className="min-w-[88px]">
              <dt className="font-body text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary">
                {s.label}
              </dt>
              <dd
                className={cn(
                  "mt-0.5 font-body text-[13px] font-semibold tabular-nums flex items-center gap-1",
                  s.alert ? "text-error-text" : "text-foreground",
                )}
              >
                {s.value}
                {s.trend !== undefined && (
                  <span
                    className={cn(
                      "inline-flex items-center font-mono text-[10px]",
                      s.trend >= 0 ? "text-success-text" : "text-warning-text",
                    )}
                  >
                    {s.trend >= 0 ? (
                      <TrendingUp className="h-3 w-3" strokeWidth={2} aria-hidden />
                    ) : (
                      <TrendingDown className="h-3 w-3" strokeWidth={2} aria-hidden />
                    )}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>

        <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0 hidden lg:block" strokeWidth={2} aria-hidden />
      </Link>
    </li>
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
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/projects"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Projects
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/audit"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Audit log
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
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className="mt-1 font-display text-[20px] font-semibold tabular-nums tracking-tight text-foreground"
        style={highlight ? ACCENT_TEXT : undefined}
      >
        {value}
      </dd>
      {caption && (
        <dd className="mt-0.5 font-body text-[11px] text-text-tertiary">{caption}</dd>
      )}
    </div>
  );
}

function ContextBanner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-warning-border bg-warning-subtle/50 backdrop-blur px-4 py-3">
      <p className="font-body text-[13px] font-semibold flex items-center gap-1.5 text-foreground">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}
