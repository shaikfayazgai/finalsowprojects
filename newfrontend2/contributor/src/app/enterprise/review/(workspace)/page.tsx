"use client";

/**
 * Acceptance queue — registry table (platform pattern).
 *   KPIs (pending · overdue · due soon · unclaimed) → overdue alert → table.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, ClipboardCheck, Clock, Inbox, Search, X } from "lucide-react";
import { useReviewQueue } from "@/lib/hooks/use-enterprise-review";
import type { EnterpriseReviewQueueItem } from "@/lib/enterprise-review/types";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, type Tone } from "@/app/admin/_shell/aurora-ui";

const ROWS_PER_PAGE = 12;
const SLA_BREACH_H = 48;
const SLA_WATCH_H = 24;

type FilterKey = "all" | "unclaimed" | "mine";

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All pending" },
  { key: "unclaimed", label: "Unclaimed" },
  { key: "mine", label: "My queue" },
];

function hoursSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000));
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type Sla = "ok" | "watch" | "breach";
function slaStatus(acceptedAt: string): Sla {
  const h = hoursSince(acceptedAt);
  if (h >= SLA_BREACH_H) return "breach";
  if (h >= SLA_WATCH_H) return "watch";
  return "ok";
}
function slaInfo(acceptedAt: string): { label: string; tone: Tone } {
  const h = hoursSince(acceptedAt);
  if (h >= SLA_BREACH_H) return { label: "Overdue", tone: "error" };
  const left = SLA_BREACH_H - h;
  return { label: `${left}h left`, tone: h >= SLA_WATCH_H ? "warning" : "success" };
}

function isMine(item: EnterpriseReviewQueueItem): boolean {
  return (item.enterpriseReviewerId?.toLowerCase() ?? "").includes("sandeep");
}
function isUnclaimed(item: EnterpriseReviewQueueItem): boolean {
  return !item.enterpriseReviewerId;
}

function sortQueue(items: EnterpriseReviewQueueItem[]): EnterpriseReviewQueueItem[] {
  const rank = (s: Sla) => (s === "breach" ? 2 : s === "watch" ? 1 : 0);
  return [...items].sort((a, b) => {
    const ra = rank(slaStatus(a.acceptedAt));
    const rb = rank(slaStatus(b.acceptedAt));
    if (ra !== rb) return rb - ra;
    if (isUnclaimed(a) !== isUnclaimed(b)) return isUnclaimed(a) ? -1 : 1;
    return new Date(a.acceptedAt).getTime() - new Date(b.acceptedAt).getTime();
  });
}

export default function EnterpriseReviewQueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter: FilterKey = (searchParams.get("filter") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const { data, isLoading, error } = useReviewQueue({ limit: 200, includeClaimed: true });
  const items = React.useMemo(() => data?.items ?? [], [data]);

  const stats = React.useMemo(() => {
    let unclaimed = 0;
    let overdue = 0;
    let dueSoon = 0;
    let mine = 0;
    for (const item of items) {
      if (isUnclaimed(item)) unclaimed++;
      if (isMine(item)) mine++;
      const s = slaStatus(item.acceptedAt);
      if (s === "breach") overdue++;
      else if (s === "watch") dueSoon++;
    }
    return { all: items.length, unclaimed, overdue, dueSoon, mine };
  }, [items]);

  const sorted = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = items.filter((item) => {
      if (activeFilter === "unclaimed" && !isUnclaimed(item)) return false;
      if (activeFilter === "mine" && !isMine(item)) return false;
      if (needle && !`${item.taskTitle} ${item.contributorName} ${item.taskDefinitionId}`.toLowerCase().includes(needle)) return false;
      return true;
    });
    return sortQueue(rows);
  }, [items, activeFilter, search]);

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
      router.replace(qs ? `/enterprise/review?${qs}` : "/enterprise/review", { scroll: false });
    },
    [router, searchParams],
  );

  const tabCount = (k: FilterKey) => (k === "all" ? stats.all : k === "unclaimed" ? stats.unclaimed : stats.mine);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{error instanceof Error ? error.message : "Could not load acceptance queue."}</p>
        </div>
      ) : null}

      {/* Overview */}
      <section aria-label="Acceptance load" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pending" value={stats.all} icon={ClipboardCheck} />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} hint={stats.overdue > 0 ? "SLA breached" : undefined} hintTone={stats.overdue > 0 ? "error" : "neutral"} />
        <StatCard label="Due soon" value={stats.dueSoon} icon={Clock} hint={stats.dueSoon > 0 ? "within 24h" : undefined} hintTone={stats.dueSoon > 0 ? "warning" : "neutral"} />
        <StatCard label="Unclaimed" value={stats.unclaimed} icon={Inbox} hint={stats.unclaimed > 0 ? "need an owner" : undefined} hintTone={stats.unclaimed > 0 ? "warning" : "neutral"} />
      </section>

      {/* Overdue alert */}
      {!isLoading && stats.overdue > 0 && activeFilter !== "mine" ? (
        <button
          type="button"
          onClick={() => setParam({ filter: null, q: null })}
          className="w-full flex items-center gap-3 rounded-lg border border-error-border bg-error-subtle/50 px-4 py-3 text-left hover:bg-error-subtle/70 transition-colors group"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-error-text" strokeWidth={2} aria-hidden />
          <span className="min-w-0 flex-1 font-body text-[13px] text-text-secondary">
            <span className="font-semibold text-foreground">
              {stats.overdue} deliverable{stats.overdue === 1 ? "" : "s"} overdue
            </span>{" "}
            — past the 48h acceptance SLA.
          </span>
          <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-foreground shrink-0" strokeWidth={2} aria-hidden />
        </button>
      ) : null}

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-3.5 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Filter acceptance queue" className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => {
              const active = activeFilter === tab.key;
              const count = tabCount(tab.key);
              const warn = tab.key === "unclaimed" && count > 0;
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
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums",
                      active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary",
                    )}
                  >
                    {count}
                  </span>
                  {warn && !active ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning-solid)] shrink-0" /> : null}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/enterprise/review/history" className="font-body text-[12.5px] font-semibold text-text-link hover:underline underline-offset-2 whitespace-nowrap">
              History
            </Link>
            <div className="relative w-full sm:w-52 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search task, contributor…"
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

        {isLoading ? (
          <QueueSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState isEmptyTenant={items.length === 0 && !error} onClear={() => setParam({ filter: null, q: null })} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Deliverable</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Contributor</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">SLA</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Status</th>
                    <th className="w-10 px-2 py-2.5" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((item) => (
                    <QueueRow key={item.submissionId} item={item} onOpen={() => router.push(`/enterprise/review/${item.submissionId}`)} />
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

function QueueRow({ item, onOpen }: { item: EnterpriseReviewQueueItem; onOpen: () => void }) {
  const sla = slaInfo(item.acceptedAt);
  const claimed = !isUnclaimed(item);
  const href = `/enterprise/review/${item.submissionId}`;

  return (
    <tr onClick={onOpen} className="group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors">
      <td className="px-4 sm:px-5 py-3.5">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="font-body text-[13.5px] font-semibold text-foreground hover:text-text-link truncate block max-w-[300px]"
          title={item.taskTitle}
        >
          {item.taskTitle}
          <span className="ml-2 font-mono text-[10px] font-normal text-text-tertiary tabular-nums">v{item.version}</span>
        </Link>
        <span className="font-body text-[11px] text-text-tertiary">
          {item.artifactCount} artifact{item.artifactCount === 1 ? "" : "s"} · mentor approved {timeAgo(item.acceptedAt)}
        </span>
      </td>
      <td className="px-3 py-3.5 font-body text-[12.5px] text-text-secondary truncate max-w-[140px]">{item.contributorName}</td>
      <td className="px-3 py-3.5">
        <Chip tone={sla.tone}>{sla.label}</Chip>
      </td>
      <td className="px-3 py-3.5">
        {claimed ? (
          <Chip tone="info" dot={false}>Claimed</Chip>
        ) : (
          <Chip tone="warning" dot={false}>Unclaimed</Chip>
        )}
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
          <Skeleton className="h-4 w-64 max-w-[45%]" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-[22px] w-16 rounded-full" />
            <Skeleton className="h-[22px] w-20 rounded-full" />
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
          <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">No deliverables awaiting enterprise acceptance.</p>
          <Link href="/enterprise/review/history" className="mt-4 inline-block font-body text-[12.5px] font-semibold text-text-link hover:underline underline-offset-2">
            View decision history
          </Link>
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
