"use client";

/**
 * Acceptance queue — aligned with SOW / projects workspace UX.
 *
 *   · One panel: underline tabs + search
 *   · Grouped preview on All (overdue · unclaimed · claimed)
 *   · Scannable rows: title + meta (contributor · version · SLA · claim)
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, ClipboardCheck, Search } from "lucide-react";
import { useReviewQueue } from "@/lib/hooks/use-enterprise-review";
import type { EnterpriseReviewQueueItem } from "@/lib/enterprise-review/types";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";

const ROWS_PER_PAGE = 10;
const PREVIEW_PER_GROUP = 5;

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

function slaStatus(acceptedAt: string): "ok" | "watch" | "breach" {
  const h = hoursSince(acceptedAt);
  if (h >= SLA_BREACH_H) return "breach";
  if (h >= SLA_WATCH_H) return "watch";
  return "ok";
}

function isMine(item: EnterpriseReviewQueueItem): boolean {
  const id = item.enterpriseReviewerId?.toLowerCase() ?? "";
  return id.includes("sandeep");
}

function isUnclaimed(item: EnterpriseReviewQueueItem): boolean {
  return !item.enterpriseReviewerId;
}

function rowMeta(item: EnterpriseReviewQueueItem): { text: string; urgent: boolean } {
  const sla = slaStatus(item.acceptedAt);
  const claim = item.enterpriseReviewerId ? "Claimed" : "Unclaimed";
  const mentor = `Mentor ${timeAgo(item.acceptedAt)}`;
  const artifacts = `${item.artifactCount} artifact${item.artifactCount === 1 ? "" : "s"}`;

  if (sla === "breach") {
    return {
      text: `${item.contributorName} · v${item.version} · Overdue · ${claim} · ${artifacts}`,
      urgent: true,
    };
  }

  return {
    text: [item.contributorName, `v${item.version}`, mentor, claim, artifacts].join(" · "),
    urgent: sla === "watch",
  };
}

function sortQueue(items: EnterpriseReviewQueueItem[]): EnterpriseReviewQueueItem[] {
  return [...items].sort((a, b) => {
    const sa = slaStatus(a.acceptedAt);
    const sb = slaStatus(b.acceptedAt);
    const rank = (s: ReturnType<typeof slaStatus>) =>
      s === "breach" ? 2 : s === "watch" ? 1 : 0;
    if (rank(sa) !== rank(sb)) return rank(sb) - rank(sa);
    if (isUnclaimed(a) !== isUnclaimed(b)) return isUnclaimed(a) ? -1 : 1;
    return new Date(a.acceptedAt).getTime() - new Date(b.acceptedAt).getTime();
  });
}

function groupQueue(items: EnterpriseReviewQueueItem[]) {
  const sorted = sortQueue(items);
  const overdue = sorted.filter((i) => slaStatus(i.acceptedAt) === "breach");
  const unclaimed = sorted.filter(
    (i) => isUnclaimed(i) && slaStatus(i.acceptedAt) !== "breach",
  );
  const claimed = sorted.filter((i) => !isUnclaimed(i) && slaStatus(i.acceptedAt) !== "breach");

  const groups: Array<{ key: string; label: string; rows: EnterpriseReviewQueueItem[] }> = [];
  if (overdue.length) groups.push({ key: "overdue", label: "Overdue", rows: overdue });
  if (unclaimed.length) groups.push({ key: "unclaimed", label: "Unclaimed", rows: unclaimed });
  if (claimed.length) groups.push({ key: "claimed", label: "Claimed", rows: claimed });
  return groups;
}

export default function EnterpriseReviewQueuePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter: FilterKey =
    (searchParams.get("filter") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const { data, isLoading, error } = useReviewQueue({
    limit: 200,
    includeClaimed: true,
  });

  const items = data?.items ?? [];

  const counts = React.useMemo(() => {
    let unclaimed = 0;
    let mine = 0;
    for (const item of items) {
      if (isUnclaimed(item)) unclaimed++;
      if (isMine(item)) mine++;
    }
    return { all: items.length, unclaimed, mine };
  }, [items]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (activeFilter === "unclaimed" && !isUnclaimed(item)) return false;
      if (activeFilter === "mine" && !isMine(item)) return false;
      if (needle) {
        const hay = `${item.taskTitle} ${item.contributorName} ${item.taskDefinitionId}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, activeFilter, search]);

  const sorted = React.useMemo(() => sortQueue(filtered), [filtered]);
  const showGrouped = activeFilter === "all" && !search.trim();
  const groups = showGrouped ? groupQueue(sorted) : null;

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = showGrouped
    ? sorted
    : sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      router.replace(`/enterprise/review?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const overdueCount = items.filter((i) => slaStatus(i.acceptedAt) === "breach").length;

  const listTitle =
    activeFilter === "all"
      ? "Pending acceptance"
      : TABS.find((t) => t.key === activeFilter)?.label ?? "Queue";

  const listDescription =
    sorted.length === 0
      ? "No matches"
      : showGrouped
        ? `${sorted.length} deliverable${sorted.length === 1 ? "" : "s"} · grouped by priority`
        : `${sorted.length} deliverable${sorted.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {error instanceof Error ? error.message : "Could not load acceptance queue."}
          </p>
        </div>
      )}

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
            <div className="min-w-0">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                {listTitle}
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                {listDescription}
                {showGrouped && overdueCount > 0 && (
                  <span className="text-warning-text font-medium">
                    {" · "}
                    {overdueCount} overdue
                  </span>
                )}
              </p>
              <Link
                href="/enterprise/review/history"
                className="mt-2 inline-block font-body text-[12px] font-medium text-text-link hover:underline underline-offset-2"
              >
                Decision history
              </Link>
            </div>
            <div className="relative w-full sm:w-52 shrink-0">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search task, contributor…"
                className={cn(
                  "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
                  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                )}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setParam({ q: null })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 font-body text-[10.5px] text-text-link"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <nav aria-label="Filter acceptance queue" className="flex flex-wrap gap-x-1 -mb-px">
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
                        ? "bg-brand-subtle text-brand-subtle-text"
                        : "text-text-tertiary",
                      tab.key === "unclaimed" && count > 0 && !active && "text-warning-text",
                    )}
                  >
                    {count}
                  </span>
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-x-2 bottom-0 h-0.5 bg-brand rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {isLoading ? (
          <QueueSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyPanel
            isEmptyTenant={items.length === 0 && !error}
            onClear={() => setParam({ filter: null, q: null })}
          />
        ) : groups ? (
          <div className="divide-y divide-stroke-subtle">
            {groups.map((group) => (
              <QueueGroup
                key={group.key}
                label={group.label}
                rows={group.rows}
                previewLimit={PREVIEW_PER_GROUP}
                filterHref={`/enterprise/review?filter=${
                  group.key === "overdue" ? "all" : group.key === "unclaimed" ? "unclaimed" : "mine"
                }`}
              />
            ))}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((item) => (
                <QueueRow key={item.submissionId} item={item} />
              ))}
            </ul>
            {totalPages > 1 && (
              <footer className="flex items-center justify-between px-5 py-3 border-t border-stroke-subtle">
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
                    className="font-body text-[12px] font-semibold text-text-link disabled:text-text-disabled"
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
                    className="font-body text-[12px] font-semibold text-text-link disabled:text-text-disabled"
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

function QueueGroup({
  label,
  rows,
  previewLimit,
  filterHref,
}: {
  label: string;
  rows: EnterpriseReviewQueueItem[];
  previewLimit: number;
  filterHref: string;
}) {
  const preview = rows.slice(0, previewLimit);
  const overflow = rows.length - preview.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-5 py-2.5">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
          {label}
          <span className="ml-1.5 font-mono tabular-nums text-foreground normal-case tracking-normal">
            {rows.length}
          </span>
        </p>
        {rows.length > previewLimit && (
          <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-link">
            View all
          </Link>
        )}
      </div>
      <ul className="divide-y divide-stroke-subtle border-t border-stroke-subtle">
        {preview.map((item) => (
          <li key={item.submissionId}>
            <QueueRow item={item} />
          </li>
        ))}
      </ul>
      {overflow > 0 && (
        <div className="px-5 py-2 border-t border-stroke-subtle">
          <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-link">
            + {overflow} more
          </Link>
        </div>
      )}
    </div>
  );
}

function QueueRow({ item }: { item: EnterpriseReviewQueueItem }) {
  const meta = rowMeta(item);

  return (
    <Link
      href={`/enterprise/review/${item.submissionId}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
      )}
    >
      <span className="font-body text-[13px] font-medium text-foreground truncate min-w-0">
        {item.taskTitle}
      </span>
      <span
        className={cn(
          "font-body text-[11px] shrink-0 text-right max-w-[55%] truncate",
          meta.urgent ? "text-warning-text font-medium" : "text-text-tertiary",
        )}
      >
        {meta.text}
      </span>
    </Link>
  );
}

function EmptyPanel({
  isEmptyTenant,
  onClear,
}: {
  isEmptyTenant: boolean;
  onClear: () => void;
}) {
  return (
    <div className="px-5 py-14 text-center">
      {isEmptyTenant ? (
        <>
          <CheckCircle2 className="h-6 w-6 text-success-text mx-auto mb-2" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] font-semibold text-foreground">Queue clear</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
            No deliverables awaiting enterprise acceptance.
          </p>
          <Link
            href="/enterprise/review/history"
            className="mt-4 inline-block font-body text-[12.5px] font-semibold text-text-link"
          >
            View decision history
          </Link>
        </>
      ) : (
        <>
          <ClipboardCheck className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] font-semibold text-foreground">No matches</p>
          <button
            type="button"
            onClick={onClear}
            className="mt-2 font-body text-[12.5px] font-semibold text-brand"
          >
            Clear filters
          </button>
        </>
      )}
    </div>
  );
}

function QueueSkeleton() {
  return (
    <div className="divide-y divide-stroke-subtle">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-5 py-3">
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      ))}
    </div>
  );
}
