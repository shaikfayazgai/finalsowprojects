"use client";

/**
 * QA decision history — outcome KPIs + filter pills + date-grouped decision timeline.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle, CheckCircle2, ClipboardList, GitBranch, RotateCcw, Search, X, XCircle } from "lucide-react";
import type { MockReviewerDecision } from "@/mocks/reviewer";
import { fetchReviewerHistory, ReviewerApiError } from "@/lib/api/reviewer-mock";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, TONE, type Tone } from "@/app/admin/_shell/aurora-ui";

type FilterKey = "all" | "accept" | "rework" | "reject" | "disagreed";

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "accept", label: "Accepted" },
  { key: "rework", label: "Rework" },
  { key: "reject", label: "Rejected" },
  { key: "disagreed", label: "Overrode mentor" },
];

const OUTCOME: Record<MockReviewerDecision["decision"], { label: string; tone: Tone; icon: typeof CheckCircle2 }> = {
  accept: { label: "Accepted", tone: "success", icon: CheckCircle2 },
  rework: { label: "Rework", tone: "warning", icon: RotateCcw },
  reject: { label: "Rejected", tone: "error", icon: XCircle },
};

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

function groupByDay(rows: MockReviewerDecision[]) {
  const sorted = [...rows].sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime());
  const groups: Array<{ key: number; label: string; items: MockReviewerDecision[] }> = [];
  for (const row of sorted) {
    const key = startOfDay(new Date(row.decidedAt));
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(row);
    else groups.push({ key, label: dayLabel(row.decidedAt), items: [row] });
  }
  return groups;
}

export function ReviewerHistoryWorkspace() {
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [search, setSearch] = React.useState("");
  const [items, setItems] = React.useState<MockReviewerDecision[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    fetchReviewerHistory(c.signal)
      .then((res) => setItems(res.items))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof ReviewerApiError ? err.message : "Could not load history.");
      });
    return () => c.abort();
  }, []);

  const list = items ?? [];
  const counts = React.useMemo(
    () => ({
      all: list.length,
      accept: list.filter((d) => d.decision === "accept").length,
      rework: list.filter((d) => d.decision === "rework").length,
      reject: list.filter((d) => d.decision === "reject").length,
      disagreed: list.filter((d) => !d.agreedWithMentor).length,
    }),
    [list],
  );

  const rows = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return list.filter((d) => {
      if (filter === "disagreed" && d.agreedWithMentor) return false;
      if (filter !== "all" && filter !== "disagreed" && d.decision !== filter) return false;
      if (needle && !`${d.taskTitle} ${d.contributorName} ${d.mentorName} ${d.project}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [list, filter, search]);

  const groups = React.useMemo(() => groupByDay(rows), [rows]);
  const loading = items === null && !error;

  return (
    <div className="space-y-5">
      <Link href="/enterprise/reviewer" className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm">
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        Back to QA review
      </Link>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">QA Review · History</p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">Decision history</h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Your past second-stage QA decisions.{" "}
          <Link href="/enterprise/reviewer/metrics" className="font-semibold text-text-link hover:underline underline-offset-2">
            My metrics
          </Link>
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
        </div>
      ) : null}

      {/* Outcome summary */}
      <section aria-label="Outcomes" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Accepted" value={counts.accept} icon={CheckCircle2} />
        <StatCard label="Rework" value={counts.rework} icon={RotateCcw} hintTone="warning" hint={counts.rework > 0 ? "returned" : undefined} />
        <StatCard label="Rejected" value={counts.reject} icon={XCircle} hintTone="error" hint={counts.reject > 0 ? "closed" : undefined} />
        <StatCard label="Overrode mentor" value={counts.disagreed} icon={GitBranch} hintTone={counts.disagreed > 0 ? "warning" : "neutral"} hint={counts.all > 0 ? `of ${counts.all}` : undefined} />
      </section>

      {/* Filter + search */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Filter decisions" className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = filter === t.key;
            const count = counts[t.key];
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
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
        <div className="relative w-full lg:w-60 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task, people…"
            className="w-full h-9 pl-9 pr-8 rounded-lg bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
          />
          {search ? (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground">
              <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      {/* Timeline */}
      <div className={cn(DASH_CARD, "px-5 sm:px-6 py-5")}>
        {loading ? (
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
          <div className="py-8 text-center">
            <ClipboardList className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
            <p className="font-body text-[13px] font-semibold text-foreground">{list.length === 0 ? "No decisions yet" : "No matches"}</p>
            <p className="mt-1 font-body text-[12px] text-text-tertiary">{list.length === 0 ? "Completed QA reviews will appear here." : "Try a different filter or search."}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groups.map((g) => (
              <div key={g.key}>
                <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-3">{g.label}</p>
                <ol className="space-y-1">
                  {g.items.map((d, i) => (
                    <TimelineRow key={d.id} decision={d} last={i === g.items.length - 1} />
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

function TimelineRow({ decision: d, last }: { decision: MockReviewerDecision; last: boolean }) {
  const out = OUTCOME[d.decision];
  const Icon = out.icon;

  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <span className="grid place-items-center h-7 w-7 rounded-full" style={{ background: TONE[out.tone].soft, color: TONE[out.tone].text }} aria-hidden>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        {!last ? <span aria-hidden className="w-px flex-1 bg-stroke-subtle mt-1 min-h-[12px]" /> : null}
      </div>
      <div className="flex-1 min-w-0 pb-4 -mt-0.5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-body text-[13.5px] font-semibold text-foreground truncate">{d.taskTitle}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            {!d.agreedWithMentor ? (
              <Chip tone="warning" dot={false}>Override</Chip>
            ) : null}
            <Chip tone={out.tone} dot={false}>{out.label}</Chip>
          </div>
        </div>
        <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary truncate">
          {d.contributorName} · {d.project} · mentor {d.mentorName} · {fmtTime(d.decidedAt)}
        </p>
        {d.comment ? (
          <p className={cn("mt-1.5 font-body text-[12px] text-text-secondary leading-relaxed border-l-2 pl-2.5", d.decision === "accept" ? "border-stroke-strong" : `border-${out.tone}-border`)} style={{ borderColor: TONE[out.tone].border }}>
            &ldquo;{d.comment}&rdquo;
          </p>
        ) : null}
      </div>
    </li>
  );
}
