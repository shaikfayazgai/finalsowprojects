"use client";

/**
 * QA review queue — registry table (platform pattern), tailored to review.
 *   KPIs (pending · SLA risk · overdue · round 2+) → overdue alert →
 *   table: submission · contributor · round · criteria progress · SLA.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, ClipboardCheck, Clock, Layers, Search, X } from "lucide-react";
import type { MockReviewerItem, SlaTier } from "@/mocks/reviewer";
import { fetchReviewerQueue, ReviewerApiError } from "@/lib/api/reviewer-mock";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, type Tone } from "@/app/admin/_shell/aurora-ui";

const ROWS_PER_PAGE = 12;

type FilterKey = "all" | "sla_risk" | "round_2";

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All pending" },
  { key: "sla_risk", label: "SLA risk" },
  { key: "round_2", label: "Round 2+" },
];

const SLA_ATTENTION: SlaTier[] = ["breached", "critical", "warning"];
const SLA_OVERDUE: SlaTier[] = ["breached", "critical"];

function fmtSlaDue(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "Overdue";
  const h = Math.floor(ms / 3_600_000);
  if (h >= 24) return `${Math.floor(h / 24)}d left`;
  return `${h}h left`;
}

function slaChip(item: MockReviewerItem): { label: string; tone: Tone } {
  if (SLA_OVERDUE.includes(item.slaTier)) return { label: "Overdue", tone: "error" };
  const label = fmtSlaDue(item.dueAt);
  if (item.slaTier === "warning") return { label, tone: "warning" };
  if (item.slaTier === "watch") return { label, tone: "info" };
  return { label, tone: "success" };
}

function isSlaRisk(item: MockReviewerItem): boolean {
  return SLA_ATTENTION.includes(item.slaTier);
}
function isRound2Plus(item: MockReviewerItem): boolean {
  return item.round >= 2;
}

function sortQueue(items: MockReviewerItem[]): MockReviewerItem[] {
  const rank = (t: SlaTier) => (t === "breached" || t === "critical" ? 3 : t === "warning" ? 2 : t === "watch" ? 1 : 0);
  return [...items].sort((a, b) => {
    if (rank(a.slaTier) !== rank(b.slaTier)) return rank(b.slaTier) - rank(a.slaTier);
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

export function ReviewerQueueWorkspace({
  basePath = "/enterprise/reviewer",
}: {
  basePath?: string;
  showGroupedPreview?: boolean;
  listTitle?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter: FilterKey = (searchParams.get("filter") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [items, setItems] = React.useState<MockReviewerItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const c = new AbortController();
    fetchReviewerQueue(c.signal)
      .then((res) => setItems(res.items))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(err instanceof ReviewerApiError ? err.message : "Could not load review queue.");
      });
    return () => c.abort();
  }, []);

  const list = items ?? [];

  const stats = React.useMemo(() => {
    let slaRisk = 0;
    let overdue = 0;
    let round2 = 0;
    for (const item of list) {
      if (isSlaRisk(item)) slaRisk++;
      if (SLA_OVERDUE.includes(item.slaTier)) overdue++;
      if (isRound2Plus(item)) round2++;
    }
    return { all: list.length, sla_risk: slaRisk, overdue, round_2: round2 };
  }, [list]);

  const sorted = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = list.filter((item) => {
      if (activeFilter === "sla_risk" && !isSlaRisk(item)) return false;
      if (activeFilter === "round_2" && !isRound2Plus(item)) return false;
      if (needle && !`${item.taskTitle} ${item.contributorName} ${item.project} ${item.mentorName}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    return sortQueue(rows);
  }, [list, activeFilter, search]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [router, searchParams, basePath],
  );

  const loading = items === null && !error;
  const tabCount = (k: FilterKey) => stats[k];

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
        </div>
      ) : null}

      {/* Overview */}
      <section aria-label="Review load" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending" value={stats.all} icon={ClipboardCheck} />
        <StatCard label="SLA risk" value={stats.sla_risk} icon={AlertTriangle} hint={stats.sla_risk > 0 ? "approaching deadline" : undefined} hintTone={stats.sla_risk > 0 ? "warning" : "neutral"} />
        <StatCard label="Overdue" value={stats.overdue} icon={Clock} hint={stats.overdue > 0 ? "SLA breached" : undefined} hintTone={stats.overdue > 0 ? "error" : "neutral"} />
        <StatCard label="Round 2+" value={stats.round_2} icon={Layers} hint={stats.round_2 > 0 ? "resubmissions" : undefined} hintTone="neutral" />
      </section>

      {/* Overdue alert */}
      {!loading && stats.overdue > 0 && activeFilter === "all" ? (
        <button
          type="button"
          onClick={() => setParam({ filter: "sla_risk" })}
          className="w-full flex items-center gap-3 rounded-lg border border-error-border bg-error-subtle/50 px-4 py-3 text-left hover:bg-error-subtle/70 transition-colors group"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-error-text" strokeWidth={2} aria-hidden />
          <span className="min-w-0 flex-1 font-body text-[13px] text-text-secondary">
            <span className="font-semibold text-foreground">
              {stats.overdue} review{stats.overdue === 1 ? "" : "s"} overdue
            </span>{" "}
            — past the SLA deadline.
          </span>
          <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-foreground shrink-0" strokeWidth={2} aria-hidden />
        </button>
      ) : null}

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-3.5 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Filter review queue" className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => {
              const active = activeFilter === tab.key;
              const count = tabCount(tab.key);
              const warn = tab.key === "sla_risk" && count > 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ filter: tab.key === "all" ? null : tab.key })}
                  aria-current={active ? "page" : undefined}
                  style={active ? GLASS_GRADIENT : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
                    active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
                  )}
                >
                  {tab.label}
                  <span className={cn("inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums", active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary")}>
                    {count}
                  </span>
                  {warn && !active ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning-solid)] shrink-0" /> : null}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/enterprise/reviewer/metrics" className="font-body text-[12.5px] font-semibold text-text-link hover:underline underline-offset-2 whitespace-nowrap">
              Metrics
            </Link>
            <Link href="/enterprise/reviewer/history" className="font-body text-[12.5px] font-semibold text-text-link hover:underline underline-offset-2 whitespace-nowrap">
              History
            </Link>
            <div className="relative w-full sm:w-48 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search task, people…"
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
              />
              {search ? (
                <button type="button" onClick={() => setParam({ q: null })} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground">
                  <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {loading ? (
          <QueueSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState isEmptyTenant={list.length === 0 && !error} onClear={() => setParam({ filter: null, q: null })} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Submission</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Contributor</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Round</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Criteria</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">SLA</th>
                    <th className="w-10 px-2 py-2.5" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((item) => (
                    <QueueRow key={item.id} item={item} onOpen={() => router.push(`/enterprise/reviewer/queue/${item.id}`)} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–{Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-3">
                  <button type="button" disabled={pageIdx === 1} onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })} className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled">
                    Previous
                  </button>
                  <span className="font-mono text-[11px] text-text-tertiary">{pageIdx}/{totalPages}</span>
                  <button type="button" disabled={pageIdx >= totalPages} onClick={() => setParam({ page: String(pageIdx + 1) })} className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled">
                    Next
                  </button>
                </div>
              </footer>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function QueueRow({ item, onOpen }: { item: MockReviewerItem; onOpen: () => void }) {
  const sla = slaChip(item);
  const total = item.criteria.length;
  const done = item.criteriaValidatedCount;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const href = `/enterprise/reviewer/queue/${item.id}`;

  return (
    <tr onClick={onOpen} className="group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors">
      <td className="px-4 sm:px-5 py-3.5">
        <Link href={href} onClick={(e) => e.stopPropagation()} className="font-body text-[13.5px] font-semibold text-foreground hover:text-text-link truncate block max-w-[280px]" title={item.taskTitle}>
          {item.taskTitle}
        </Link>
        <span className="font-body text-[11px] text-text-tertiary truncate block max-w-[280px]">{item.project}</span>
      </td>
      <td className="px-3 py-3.5 font-body text-[12.5px] text-text-secondary truncate max-w-[130px]">{item.contributorName}</td>
      <td className="px-3 py-3.5">
        {item.round >= 2 ? (
          <Chip tone="warning" dot={false}>R{item.round}</Chip>
        ) : (
          <span className="font-mono text-[12px] tabular-nums text-text-tertiary">R{item.round}/{item.totalRounds}</span>
        )}
      </td>
      <td className="px-3 py-3.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-12 rounded-full bg-foreground/[0.08] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "var(--color-success-solid)" : "var(--color-info-text)" }} aria-hidden />
          </div>
          <span className="font-mono text-[11px] tabular-nums text-text-tertiary">{done}/{total}</span>
        </div>
      </td>
      <td className="px-3 py-3.5">
        <Chip tone={sla.tone}>{sla.label}</Chip>
      </td>
      <td className="px-2 py-3.5 align-middle">
        <ChevronRight className="h-4 w-4 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} aria-hidden />
      </td>
    </tr>
  );
}

function QueueSkeleton() {
  return (
    <div className="divide-y divide-stroke-subtle">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
          <Skeleton className="h-4 w-64 max-w-[40%]" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-[22px] w-10 rounded-full" />
            <Skeleton className="h-2 w-12 rounded-full" />
            <Skeleton className="h-[22px] w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ isEmptyTenant, onClear }: { isEmptyTenant: boolean; onClear: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      {isEmptyTenant ? (
        <>
          <CheckCircle2 className="h-6 w-6 text-success-text mx-auto mb-2" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] font-semibold text-foreground">Queue clear</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">No submissions awaiting QA review.</p>
        </>
      ) : (
        <>
          <ClipboardCheck className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] font-semibold text-foreground">No matches</p>
          <button type="button" onClick={onClear} className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground">
            Clear filters
          </button>
        </>
      )}
    </div>
  );
}
