"use client";

/**
 * Analytics overview workspace.
 *
 * Use-case: Enterprise operator lands here to get a cross-portal signal — are
 * my projects well-staffed? Is spend on track? — and drills into the dedicated
 * dashboard that needs attention.
 *
 * H1 visibility: KPI strip surfaces the four headline numbers immediately.
 * H6 recognition: Dashboard cards show live mini-stats so operators recognise
 *   which board to enter without reading descriptions.
 * H7 flexibility: Roadmap section communicates what isn't here yet, preventing
 *   wasted clicks.
 * H8 minimalist: Removed the redundant "Phase 1 baseline" description;
 *   roadmap section kept as wayfinding, not filler.
 *
 * Layout: header → KPI strip (StatCards) → alert banner (conditional) →
 *   dashboard entry cards (DASH_CARD, two interactive tiles) →
 *   roadmap panel (dashed chips).
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BadgeDollarSign,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  fmtINR,
  getAnalyticsOverviewMock,
} from "@/lib/analytics/analytics-mock";
import { cn } from "@/lib/utils/cn";
import { AURORA_ACCENT, DASH_CARD, DASH_CARD_INTERACTIVE, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Banner, StatCard } from "@/app/admin/_shell/aurora-ui";

export function AnalyticsWorkspace() {
  const overview = React.useMemo(() => getAnalyticsOverviewMock(), []);
  const { workforce: w, economic: e } = overview;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Analytics
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Analytics
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Rolling {overview.windowDays}-day window · workforce intelligence and economic spend views.
        </p>
        <QuickLinks />
      </header>

      {/* KPI strip */}
      <section aria-label="Analytics overview" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active contributors"
          value={w.totalContributors}
          icon={Users}
          hint={`Top skill: ${w.topSkill}`}
        />
        <StatCard
          label="Acceptance rate"
          value={`${w.acceptanceRatePct}%`}
          icon={w.acceptanceTrendPt >= 0 ? TrendingUp : TrendingDown}
          hint={`${w.acceptanceTrendPt >= 0 ? "+" : ""}${w.acceptanceTrendPt}pt vs last quarter`}
          hintTone={w.acceptanceTrendPt >= 0 ? "success" : "warning"}
        />
        <StatCard
          label="Total paid (90d)"
          value={fmtINR(e.totalPaidMinor)}
          icon={BadgeDollarSign}
          hint={`${fmtINR(e.totalCommittedMinor)} committed`}
        />
        <StatCard
          label="Est. savings"
          value={`~${e.savingsVsSalariedPct}%`}
          hint="vs salaried baseline"
          hintTone="success"
        />
      </section>

      {/* Skill gap alert */}
      {w.skillGapTasks > 0 && (
        <Banner tone="warning" icon={AlertTriangle} title={`${w.skillGapTasks} tasks waiting on skill match (>48h)`}>
          <Link
            href="/enterprise/analytics/workforce"
            className="font-semibold underline underline-offset-2 hover:opacity-80"
          >
            Review workforce intelligence →
          </Link>
        </Banner>
      )}

      {/* Dashboard entry tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DashboardTile
          href="/enterprise/analytics/workforce"
          icon={Users}
          title="Workforce intelligence"
          description="Skills inventory, skill gaps, weekly throughput, and acceptance rate."
          stats={[
            { label: "Avg weekly tasks", value: String(w.avgWeeklyThroughput) },
            { label: "Skill gaps", value: String(w.skillGapCount), tone: w.skillGapCount > 0 ? "error" : undefined },
            { label: "Acceptance", value: `${w.acceptanceRatePct}%`, tone: "success" },
          ]}
        />
        <DashboardTile
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
      </div>

      {/* Phase 2 roadmap */}
      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">Phase 2 roadmap</h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Planned for a later release</p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-5 sm:px-6 py-5">
          {[
            { label: "Cohort analysis", detail: "Contributor segments and retention curves" },
            { label: "Report builder", detail: "Custom metrics and scheduled exports" },
            { label: "Scenario modeling", detail: "Spend forecasts and ROI what-if" },
          ].map((item) => (
            <li
              key={item.label}
              className="rounded-lg border border-dashed border-stroke-subtle bg-bg-subtle/60 px-4 py-3"
            >
              <p className="font-body text-[13px] font-semibold text-text-secondary">{item.label}</p>
              <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{item.detail}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ─── Dashboard entry tile ─── */

function DashboardTile({
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
  stats: Array<{ label: string; value: string; tone?: "error" | "success" | "warning" }>;
}) {
  return (
    <Link
      href={href}
      className={cn(
        DASH_CARD_INTERACTIVE,
        "group flex flex-col gap-4 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]",
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
          style={GLASS_GRADIENT}
        >
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground flex items-center gap-1.5">
            {title}
            <ArrowRight
              className="h-3.5 w-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity duration-fast -translate-x-1 group-hover:translate-x-0 transition-transform"
              strokeWidth={2}
              aria-hidden
            />
          </p>
          <p className="mt-0.5 font-body text-[12px] text-text-secondary leading-snug">{description}</p>
        </div>
      </div>

      {/* Mini KPI row */}
      <dl className="flex flex-wrap gap-x-6 gap-y-2 pt-1 border-t border-stroke-subtle">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="font-body text-[10px] font-bold uppercase tracking-[0.08em] text-text-tertiary">{s.label}</dt>
            <dd
              className={cn(
                "mt-0.5 font-display text-[15px] font-bold tabular-nums leading-none",
                s.tone === "error"
                  ? "text-error-text"
                  : s.tone === "success"
                  ? "text-success-text"
                  : s.tone === "warning"
                  ? "text-warning-text"
                  : "text-foreground",
              )}
            >
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </Link>
  );
}

/* ─── Quick links ─── */

function QuickLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      {[
        { href: "/enterprise/billing", label: "Billing" },
        { href: "/enterprise/projects", label: "Projects" },
        { href: "/enterprise/audit", label: "Audit log" },
      ].map((l, i, arr) => (
        <React.Fragment key={l.href}>
          <Link
            href={l.href}
            className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
          >
            {l.label}
          </Link>
          {i < arr.length - 1 && (
            <span aria-hidden className="text-text-disabled">·</span>
          )}
        </React.Fragment>
      ))}
    </p>
  );
}
