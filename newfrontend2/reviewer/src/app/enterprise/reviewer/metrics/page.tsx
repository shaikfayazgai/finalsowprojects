"use client";

/**
 * QA reviewer personal metrics — dashboard of your own QA work (not peer comparison).
 *   KPI strip → decision-mix stacked bar → governance note.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, ClipboardCheck, Handshake, Info, Target, Timer } from "lucide-react";
import { fetchReviewerHistory, ReviewerApiError } from "@/lib/api/reviewer-mock";
import type { MOCK_REVIEWER_METRICS } from "@/mocks/reviewer";
import { ReviewerMetricsSkeleton } from "@/components/enterprise/page-skeletons";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "@/app/admin/_shell/aurora";
import { StatCard, type Tone } from "@/app/admin/_shell/aurora-ui";

const MIX: Array<{ key: "accept" | "rework" | "reject"; label: string; color: string }> = [
  { key: "accept", label: "Accept", color: "var(--c-violet-500)" },
  { key: "rework", label: "Rework", color: "var(--color-warning-solid)" },
  { key: "reject", label: "Reject", color: "var(--color-error-solid)" },
];

export default function ReviewerMetricsPage() {
  const [m, setM] = React.useState<typeof MOCK_REVIEWER_METRICS | null>(null);
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
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!m) return <ReviewerMetricsSkeleton />;

  const total = m.decisionsByKind.accept + m.decisionsByKind.rework + m.decisionsByKind.reject;
  const slaTone: Tone = m.slaHitPct >= 90 ? "success" : m.slaHitPct >= 75 ? "warning" : "error";

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">QA Review · Metrics</p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">My metrics</h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Last {m.periodDays} days · observations of your own QA review work.{" "}
          <Link href="/enterprise/reviewer/history" className="font-semibold text-text-link hover:underline underline-offset-2">
            Decision history
          </Link>
        </p>
      </header>

      {/* Headline KPIs */}
      <section aria-label="Review metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Reviews completed" value={m.reviewCount} icon={ClipboardCheck} hint={`in ${m.periodDays} days`} />
        <StatCard label="Avg review time" value={`${m.avgTimeMin}m`} icon={Timer} hint="per review" />
        <StatCard label="SLA hit rate" value={`${m.slaHitPct}%`} icon={Target} hint={m.slaHitPct >= 90 ? "on target" : "below 90% target"} hintTone={slaTone} />
        <StatCard label="Mentor agreement" value={`${m.agreementWithMentorPct}%`} icon={Handshake} hint="matched the mentor" />
      </section>

      {/* Decision mix */}
      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle flex items-baseline justify-between gap-3">
          <div>
            <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">Decision mix</h2>
            <p className="mt-0.5 font-body text-[12px] text-text-tertiary">How your {total} decisions broke down this period</p>
          </div>
          <p className="font-body text-[12px] text-text-tertiary shrink-0">
            Accept rate <span className="font-display text-[16px] font-bold text-foreground tabular-nums ml-1">{m.acceptPct}%</span>
          </p>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-4">
          {/* Stacked proportion bar */}
          <div className="h-3 rounded-full overflow-hidden flex bg-foreground/[0.06]" role="img" aria-label="Decision mix proportions">
            {MIX.map((seg) => {
              const count = m.decisionsByKind[seg.key];
              const pct = total === 0 ? 0 : (count / total) * 100;
              return pct > 0 ? <div key={seg.key} style={{ width: `${pct}%`, background: seg.color }} className="h-full first:rounded-l-full last:rounded-r-full" /> : null;
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-7 gap-y-2.5">
            {MIX.map((seg) => {
              const count = m.decisionsByKind[seg.key];
              const pct = total === 0 ? 0 : Math.round((count / total) * 100);
              return (
                <div key={seg.key} className="flex items-center gap-2">
                  <span aria-hidden className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                  <span className="font-body text-[13px] font-medium text-foreground">{seg.label}</span>
                  <span className="font-mono text-[12px] tabular-nums text-foreground font-semibold">{count}</span>
                  <span className="font-mono text-[11px] tabular-nums text-text-tertiary">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Governance note */}
      <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-4 py-3 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
        <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
          These are observations of your own work — not performance scores or peer comparisons. Override delta from the mentor is tracked for governance only.
        </p>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/enterprise/reviewer" className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm">
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Back to QA review
    </Link>
  );
}
