"use client";

/**
 * QA decision history — workspace panel with underline tabs, search, scannable rows.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle, ClipboardList, Search, X } from "lucide-react";
import type { MockReviewerDecision } from "@/mocks/reviewer";
import { fetchReviewerHistory, ReviewerApiError } from "@/lib/api/reviewer-real";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW, AURORA_ACCENT } from "@/app/admin/_shell/aurora";
import { Chip, GLASS_FIELD_STYLE, type Tone } from "@/app/admin/_shell/aurora-ui";

const ROWS_PER_PAGE = 10;

type FilterKey = "all" | "accept" | "rework" | "reject" | "disagreed";

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "accept", label: "Accepted" },
  { key: "rework", label: "Rework" },
  { key: "reject", label: "Rejected" },
  { key: "disagreed", label: "Disagreed" },
];

const DECISION_PILL: Record<
  MockReviewerDecision["decision"],
  { label: string; tone: Tone }
> = {
  accept: { label: "Accepted", tone: "success" },
  rework: { label: "Rework", tone: "warning" },
  reject: { label: "Rejected", tone: "error" },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function rowMeta(d: MockReviewerDecision): string {
  const parts = [d.contributorName, d.project, d.mentorName, fmtDate(d.decidedAt)];
  if (!d.agreedWithMentor) parts.push("overrode mentor");
  return parts.join(" · ");
}

export function ReviewerHistoryWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter: FilterKey =
    (searchParams.get("filter") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

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

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return list.filter((d) => {
      if (activeFilter === "disagreed" && d.agreedWithMentor) return false;
      if (activeFilter !== "all" && activeFilter !== "disagreed" && d.decision !== activeFilter) {
        return false;
      }
      if (needle) {
        const hay = `${d.taskTitle} ${d.contributorName} ${d.mentorName} ${d.project}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [list, activeFilter, search]);

  const sorted = React.useMemo(
    () => [...filtered].sort((a, b) => new Date(b.decidedAt).getTime() - new Date(a.decidedAt).getTime()),
    [filtered],
  );

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
      router.replace(qs ? `/enterprise/reviewer/history?${qs}` : "/enterprise/reviewer/history", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const listDescription =
    items === null && !error
      ? "Loading decisions…"
      : sorted.length === 0
        ? "No matches"
        : `${sorted.length} decision${sorted.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-4">
      <BackLink />

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          QA Review · History
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Decision history
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Your past second-stage QA decisions, ordered by recency.
        </p>
        <p className="mt-2 font-body text-[12px]">
          <Link
            href="/enterprise/reviewer/metrics"
            className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
          >
            My metrics
          </Link>
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
        </div>
      )}

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 pt-4 pb-0 border-b border-white/55">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
            <div className="min-w-0">
              <h2 className="font-display text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                Past decisions
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">{listDescription}</p>
            </div>
            <div className="relative w-full sm:w-52 shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search task, people…"
                style={GLASS_FIELD_STYLE}
                className="w-full h-9 pl-9 pr-8 rounded-xl backdrop-blur-md font-body text-[12.5px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setParam({ q: null })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              )}
            </div>
          </div>

          <nav aria-label="Filter decision history" className="flex flex-wrap gap-x-1 -mb-px">
            {TABS.map((tab) => {
              const active = activeFilter === tab.key;
              const count = counts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setParam({ filter: tab.key === "all" ? null : tab.key })
                  }
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                    "font-body text-[13px] font-medium whitespace-nowrap",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                    active ? "text-foreground" : "text-text-secondary",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full",
                      active
                        ? "bg-white/70 text-foreground"
                        : "text-text-tertiary",
                      tab.key === "disagreed" && count > 0 && !active && "text-warning-text",
                    )}
                  >
                    {count}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      style={{ backgroundImage: AURORA_ACCENT }}
                      className="absolute inset-x-2 bottom-0 h-0.5 rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {items === null && !error ? (
          <HistorySkeleton />
        ) : sorted.length === 0 ? (
          <EmptyPanel
            isEmpty={list.length === 0}
            onClear={() => setParam({ filter: null, q: null })}
          />
        ) : (
          <>
            <ul className="divide-y divide-white/60">
              {pageRows.map((d) => (
                <HistoryRow key={d.id} decision={d} />
              ))}
            </ul>
            {totalPages > 1 && (
              <footer className="flex items-center justify-between px-5 py-3 border-t border-white/55">
                <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() =>
                      setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })
                    }
                    className="font-body text-[12px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[10px] text-text-tertiary">
                    {pageIdx}/{totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={pageIdx >= totalPages}
                    onClick={() => setParam({ page: String(pageIdx + 1) })}
                    className="font-body text-[12px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
                    Next
                  </button>
                </div>
              </footer>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function HistoryRow({ decision: d }: { decision: MockReviewerDecision }) {
  const pill = DECISION_PILL[d.decision];
  const meta = rowMeta(d);

  return (
    <li className="px-5 py-2.5 min-h-[44px] flex items-center justify-between gap-4 transition-colors duration-fast hover:bg-white/50">
      <div className="min-w-0 flex-1">
        <p className="font-body text-[13px] font-medium text-foreground truncate">{d.taskTitle}</p>
        <p
          className={cn(
            "font-body text-[11px] truncate mt-0.5",
            !d.agreedWithMentor ? "text-warning-text font-medium" : "text-text-tertiary",
          )}
        >
          {meta}
        </p>
        {d.comment ? (
          <p className="font-body text-[11.5px] text-text-secondary mt-1 line-clamp-2 italic">
            &ldquo;{d.comment}&rdquo;
          </p>
        ) : null}
      </div>
      <Chip tone={pill.tone} className="shrink-0">
        {pill.label}
      </Chip>
    </li>
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

function EmptyPanel({ isEmpty, onClear }: { isEmpty: boolean; onClear: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      <ClipboardList className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      <p className="font-body text-[13px] font-semibold text-foreground">
        {isEmpty ? "No decisions yet" : "No matches"}
      </p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
        {isEmpty
          ? "Completed QA reviews will appear here."
          : "Try a different filter or search term."}
      </p>
      {!isEmpty && (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="divide-y divide-white/60">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-5 py-3 space-y-2">
          <Skeleton className="h-4 w-full max-w-md" />
          <Skeleton className="h-3 w-2/3 max-w-sm" />
        </div>
      ))}
    </div>
  );
}
