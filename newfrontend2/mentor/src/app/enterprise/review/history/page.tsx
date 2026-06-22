"use client";

/**
 * Enterprise acceptance history — outcome KPIs + date-grouped decision timeline.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2, Percent, RotateCcw } from "lucide-react";
import { useReviewHistory } from "@/lib/hooks/use-enterprise-review";
import type { EnterpriseReviewHistoryItem } from "@/lib/enterprise/mocks/reviews";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, TONE } from "@/app/admin/_shell/aurora-ui";

type Filter = "all" | "accept" | "rework";

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString("en-GB", { weekday: "long" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function groupByDay(rows: EnterpriseReviewHistoryItem[]) {
  const sorted = [...rows].sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime());
  const groups: Array<{ key: number; label: string; items: EnterpriseReviewHistoryItem[] }> = [];
  for (const row of sorted) {
    const key = startOfDay(new Date(row.decidedAt));
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(row);
    else groups.push({ key, label: dayLabel(row.decidedAt), items: [row] });
  }
  return groups;
}

export default function EnterpriseReviewHistoryPage() {
  const [filter, setFilter] = React.useState<Filter>("all");
  const { data, isLoading, error } = useReviewHistory({ limit: 100 });

  const items = React.useMemo(() => data?.items ?? [], [data]);
  const counts = React.useMemo(() => {
    const accept = items.filter((d) => d.decision === "accept").length;
    return { all: items.length, accept, rework: items.length - accept };
  }, [items]);
  const acceptanceRate = counts.all > 0 ? Math.round((counts.accept / counts.all) * 100) : 0;

  const rows = items.filter((d) => filter === "all" || d.decision === filter);
  const groups = React.useMemo(() => groupByDay(rows), [rows]);

  const TABS: Array<{ key: Filter; label: string; count: number }> = [
    { key: "all", label: "All", count: counts.all },
    { key: "accept", label: "Accepted", count: counts.accept },
    { key: "rework", label: "Rework", count: counts.rework },
  ];

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Link href="/enterprise/review" className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        Back to acceptance
      </Link>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">Delivery · Acceptance</p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">Decision history</h1>
        <p className="mt-2 font-body text-[13px] text-text-secondary max-w-2xl">Past enterprise acceptance decisions — accepted deliverables trigger billing eligibility.</p>
      </header>

      {error ? (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{error instanceof Error ? error.message : "Could not load history."}</p>
        </div>
      ) : null}

      {/* Outcome summary */}
      <section aria-label="Outcomes" className="grid grid-cols-3 gap-4">
        <StatCard label="Accepted" value={counts.accept} icon={CheckCircle2} />
        <StatCard label="Rework" value={counts.rework} icon={RotateCcw} hint={counts.rework > 0 ? "returned" : undefined} hintTone={counts.rework > 0 ? "warning" : "neutral"} />
        <StatCard label="Acceptance rate" value={`${acceptanceRate}%`} icon={Percent} hintTone={acceptanceRate >= 80 ? "success" : "neutral"} hint={counts.all > 0 ? `of ${counts.all}` : undefined} />
      </section>

      {/* Filter */}
      <nav aria-label="Filter decisions" className="flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const active = filter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setFilter(t.key)}
              aria-current={active ? "page" : undefined}
              style={active ? GLASS_GRADIENT : undefined}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
                active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
              )}
            >
              {t.label}
              <span className={cn("inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums", active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary")}>
                {t.count}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Timeline */}
      <div className={cn(DASH_CARD, "px-5 sm:px-6 py-5")}>
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="py-8 text-center font-body text-[13px] text-text-tertiary">No decisions match this filter.</p>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.key}>
                <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-3">{g.label}</p>
                <ol className="space-y-1">
                  {g.items.map((row, i) => (
                    <TimelineRow key={row.decisionId} row={row} last={i === g.items.length - 1} />
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineRow({ row, last }: { row: EnterpriseReviewHistoryItem; last: boolean }) {
  const accepted = row.decision === "accept";
  const tone = accepted ? "success" : "warning";

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <span className="grid place-items-center h-7 w-7 rounded-full" style={{ background: TONE[tone].soft, color: TONE[tone].text }} aria-hidden>
          {accepted ? <CheckCircle2 className="h-4 w-4" strokeWidth={2} /> : <RotateCcw className="h-4 w-4" strokeWidth={2} />}
        </span>
        {!last ? <span aria-hidden className="w-px flex-1 bg-stroke-subtle mt-1 min-h-[12px]" /> : null}
      </div>
      <Link
        href={`/enterprise/review/${row.submissionId}`}
        className="flex-1 min-w-0 pb-4 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm -mt-0.5"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-body text-[13.5px] font-semibold text-foreground truncate group-hover:text-text-link transition-colors">{row.taskTitle}</p>
          <Chip tone={tone} dot={false}>{accepted ? "Accepted" : "Rework"}</Chip>
        </div>
        <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">
          {row.contributorName} · {fmtTime(row.decidedAt)}
        </p>
        {!accepted && row.note ? (
          <p className="mt-1.5 font-body text-[12px] text-text-secondary leading-relaxed border-l-2 border-warning-border pl-2.5">{row.note}</p>
        ) : null}
      </Link>
    </li>
  );
}
