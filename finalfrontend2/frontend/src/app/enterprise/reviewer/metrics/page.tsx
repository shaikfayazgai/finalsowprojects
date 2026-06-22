"use client";

/**
 * QA reviewer personal metrics — observations of your own work (not peer comparison).
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, Info } from "lucide-react";
import { fetchReviewerHistory, ReviewerApiError } from "@/lib/api/reviewer-real";
import type { ReviewerMetrics } from "@/lib/api/reviewer-real";
import { ReviewerMetricsSkeleton } from "@/components/enterprise/page-skeletons";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import { SectionCard } from "@/app/admin/_shell/aurora-ui";

export default function ReviewerMetricsPage() {
  const [m, setM] = React.useState<ReviewerMetrics | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    fetchReviewerHistory(c.signal)
      .then((res) => setM(res.metrics))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof ReviewerApiError ? err.message : "Could not load metrics.");
      });
    return () => c.abort();
  }, []);

  if (error) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div
          className="rounded-2xl border px-4 py-3 flex items-start gap-2.5 backdrop-blur"
          style={{ background: "var(--color-error-subtle)", borderColor: "var(--color-error-border)" }}
        >
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
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
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
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

      <SectionCard
        title="Activity summary"
        description={`${m.reviewCount} reviews in the last ${m.periodDays} days`}
      >
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 px-5 sm:px-6 py-5">
          <Stat label="Reviews completed" value={String(m.reviewCount)} />
          <Stat label="Avg review time" value={`${m.avgTimeMin} min`} />
          <Stat label="SLA hit rate" value={`${m.slaHitPct}%`} highlight={m.slaHitPct >= 90} />
          <Stat label="Accept rate" value={`${m.acceptPct}%`} />
        </dl>
      </SectionCard>

      <SectionCard
        title="Decision mix"
        description={`${totalDecisions} total decisions in period`}
      >
        <div className="space-y-3 px-5 sm:px-6 py-5">
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
      </SectionCard>

      <SectionCard
        title="Mentor agreement"
        description="When your decision matched the mentor's recommendation"
      >
        <div className="space-y-2 px-5 sm:px-6 py-5">
          <p className="font-body text-[13px] text-foreground">
            <span className="font-display text-[28px] font-semibold tabular-nums tracking-tight text-foreground">
              {m.agreementWithMentorPct}%
            </span>
            <span className="text-text-secondary ml-2">agreement rate</span>
          </p>
          <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
            Override delta is tracked for governance — this is not a performance score and is not
            compared to peers.
          </p>
        </div>
      </SectionCard>

      <div className={cn(GLASS_CARD, "px-4 py-3 flex items-start gap-2.5")} style={GLASS_SHADOW}>
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
          "mt-1 font-display text-[22px] font-semibold tabular-nums tracking-tight",
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
  const barColor =
    tone === "error"
      ? "var(--color-error-solid)"
      : tone === "warning"
        ? "var(--color-warning-solid)"
        : "var(--c-violet-500)";

  return (
    <div className="flex items-center gap-3">
      <span className="font-body text-[13px] text-foreground w-[4.5rem] shrink-0">{label}</span>
      <span className="font-mono text-[11.5px] tabular-nums text-text-tertiary w-8 shrink-0 text-right">
        {count}
      </span>
      <div className="flex-1 h-2 rounded-full bg-foreground/[0.08] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span className="font-mono text-[10.5px] tabular-nums text-text-tertiary w-10 shrink-0 text-right">
        {Math.round(pct)}%
      </span>
    </div>
  );
}
