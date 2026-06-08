"use client";

/**
 * QA reviewer personal metrics — observations of your own work (not peer comparison).
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Info } from "lucide-react";
import type { MOCK_REVIEWER_METRICS } from "@/mocks/reviewer";
import { DashboardSection } from "@/components/meridian/dashboard";
import { ReviewerMetricsSkeleton } from "@/components/enterprise/page-skeletons";
import { cn } from "@/lib/utils/cn";

export default function ReviewerMetricsPage() {
  const [m, setM] = React.useState<typeof MOCK_REVIEWER_METRICS | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    // No mock metrics — these reflect only the reviewer's real QA decisions.
    // Until a real metrics endpoint is wired here, show an empty state.
    setM(null);
    setReady(true);
  }, []);

  if (ready && !m) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div className="rounded-xl border border-stroke-subtle bg-surface px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-text-secondary flex-1">
            No metrics yet — your QA review activity will appear here as you complete reviews.
          </p>
        </div>
      </div>
    );
  }

  if (!m) {
    return <ReviewerMetricsSkeleton />;
  }

  const totalDecisions =
    m.decisionsByKind.accept + m.decisionsByKind.rework + m.decisionsByKind.reject;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          QA Review · Metrics
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          My metrics
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Last {m.periodDays} days · observations of your own QA review work.
        </p>
        <p className="mt-2 font-body text-[12px]">
          <Link
            href="/enterprise/reviewer/history"
            className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
          >
            Decision history
          </Link>
        </p>
      </header>

      <DashboardSection
        title="Activity summary"
        description={`${m.reviewCount} reviews in the last ${m.periodDays} days`}
      >
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <Stat label="Reviews completed" value={String(m.reviewCount)} />
          <Stat label="Avg review time" value={`${m.avgTimeMin} min`} />
          <Stat label="SLA hit rate" value={`${m.slaHitPct}%`} highlight={m.slaHitPct >= 90} />
          <Stat label="Accept rate" value={`${m.acceptPct}%`} />
        </dl>
      </DashboardSection>

      <DashboardSection
        title="Decision mix"
        description={`${totalDecisions} total decisions in period`}
      >
        <div className="space-y-3">
          <DecisionBar
            label="Accept"
            count={m.decisionsByKind.accept}
            total={totalDecisions}
            tone="brand"
          />
          <DecisionBar
            label="Rework"
            count={m.decisionsByKind.rework}
            total={totalDecisions}
            tone="warning"
          />
          <DecisionBar
            label="Reject"
            count={m.decisionsByKind.reject}
            total={totalDecisions}
            tone="error"
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Mentor agreement"
        description="When your decision matched the mentor's recommendation"
      >
        <div className="space-y-2">
          <p className="font-body text-[13px] text-foreground">
            <span className="font-display text-[28px] font-semibold tabular-nums tracking-tight">
              {m.agreementWithMentorPct}%
            </span>
            <span className="text-text-secondary ml-2">agreement rate</span>
          </p>
          <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
            Override delta is tracked for governance — this is not a performance score and is not
            compared to peers.
          </p>
        </div>
      </DashboardSection>

      <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/50 px-4 py-3 flex items-start gap-2.5">
        <Info className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
        <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
          These are observations of your own work — not performance scores or peer comparisons.
        </p>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/reviewer"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to QA review
    </Link>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          highlight ? "text-success-text" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function DecisionBar({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: "brand" | "warning" | "error";
}) {
  const pct = total === 0 ? 0 : (count / total) * 100;
  const barCls =
    tone === "error"
      ? "bg-error-text"
      : tone === "warning"
        ? "bg-warning-text"
        : "bg-brand";

  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-[13px] text-foreground w-[4.5rem] shrink-0">{label}</span>
      <span className="font-mono text-[11.5px] tabular-nums text-text-tertiary w-8 shrink-0 text-right">
        {count}
      </span>
      <div className="flex-1 h-2 rounded-full bg-bg-subtle overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", barCls)} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-[10.5px] tabular-nums text-text-tertiary w-10 shrink-0 text-right">
        {Math.round(pct)}%
      </span>
    </div>
  );
}
