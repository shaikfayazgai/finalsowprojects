"use client";

/**
 * SOW workspace — purpose-built list page.
 *
 * UX:
 *   · One panel (no duplicate KPI band + chip row)
 *   · Underline status tabs with counts inside the panel
 *   · Grouped preview when viewing All; flat paginated list when filtered
 *   · Scannable rows: title + single meta column (Attention-queue pattern)
 *   · URL-persistent status, search, page
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Search, AlertTriangle, RotateCcw, X } from "lucide-react";
import { Skeleton } from "@/components/meridian";
import { useSowList } from "@/lib/hooks/use-sow-v2";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { sowOverlay } from "@/lib/enterprise/mocks/sows";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import { STAGE_LABEL } from "@/lib/sow/approval-pipeline";
import type { SowStatus, SowStage, SowSummary } from "@/lib/sow/types";
import { canViewSowByConfidentiality } from "@/lib/sow/confidentiality-access";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW, AURORA_ACCENT } from "@/app/admin/_shell/aurora";
import { GLASS_FIELD_STYLE } from "@/app/admin/_shell/aurora-ui";

const STATUS_LABEL: Record<SowStatus, string> = {
  draft: "Draft",
  approval: "In approval",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};


type FilterKey = "all" | SowStatus;

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "approval", label: "In approval" },
  { key: "draft", label: "Draft" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const GROUP_ORDER: SowStatus[] = [
  "approval",
  "draft",
  "approved",
  "rejected",
  "withdrawn",
  "archived",
];

const PREVIEW_PER_GROUP = 5;
const ROWS_PER_PAGE = 10;

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function isStale(sow: SowSummary): boolean {
  return sow.status === "approval" && hoursSince(sow.updatedAt) > 48;
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function rowMeta(sow: SowSummary): { text: string; overdue: boolean } {
  const stale = isStale(sow);
  const stage = sow.stage ? STAGE_LABEL[sow.stage] : null;

  if (sow.status === "approval") {
    return {
      text: stale
        ? `Overdue · ${stage ?? "Approval"}`
        : [stage, timeAgo(sow.updatedAt)].filter(Boolean).join(" · "),
      overdue: stale,
    };
  }
  if (sow.status === "draft") return { text: `Draft · ${timeAgo(sow.updatedAt)}`, overdue: false };
  if (sow.status === "approved") return { text: `Approved · ${timeAgo(sow.updatedAt)}`, overdue: false };
  if (sow.status === "rejected") return { text: `Rejected · ${timeAgo(sow.updatedAt)}`, overdue: false };
  return { text: `${STATUS_LABEL[sow.status]} · ${timeAgo(sow.updatedAt)}`, overdue: false };
}

function sortSows(items: SowSummary[]): SowSummary[] {
  return [...items].sort((a, b) => {
    const aStale = isStale(a) ? 1 : 0;
    const bStale = isStale(b) ? 1 : 0;
    if (aStale !== bStale) return bStale - aStale;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function groupSows(items: SowSummary[]) {
  const buckets = new Map<SowStatus, SowSummary[]>();
  for (const s of GROUP_ORDER) buckets.set(s, []);
  for (const sow of sortSows(items)) buckets.get(sow.status)?.push(sow);
  return GROUP_ORDER.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    rows: buckets.get(status) ?? [],
  })).filter((g) => g.rows.length > 0);
}

export default function SowListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const overlayTick = useOverlayVersion(sowOverlay);
  const { roles, email, meLoading } = useEnterpriseAccess();

  const activeStatus: FilterKey =
    (searchParams.get("status") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const { data, isLoading, error, refetch } = useSowList({ limit: 200 });

  React.useEffect(() => {
    void refetch();
  }, [overlayTick, refetch]);

  const allSows = React.useMemo(() => {
    if (meLoading) return [];
    const items = data?.items ?? [];
    return items.filter((s) =>
      canViewSowByConfidentiality({
        confidentiality: s.confidentiality,
        roles,
        actorEmail: email,
        ownerId: s.ownerId,
      }),
    );
  }, [data?.items, meLoading, roles, email]);

  const counts = React.useMemo(() => {
    const c: Record<SowStatus, number> = {
      draft: 0,
      approval: 0,
      approved: 0,
      rejected: 0,
      withdrawn: 0,
      archived: 0,
    };
    for (const s of allSows) c[s.status]++;
    return { all: allSows.length, ...c };
  }, [allSows]);

  const staleCount = React.useMemo(
    () => allSows.filter(isStale).length,
    [allSows],
  );

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allSows.filter((s) => {
      if (activeStatus !== "all" && s.status !== activeStatus) return false;
      if (needle && !s.title.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [allSows, activeStatus, search]);

  const sorted = React.useMemo(() => sortSows(filtered), [filtered]);
  const showGrouped = activeStatus === "all" && !search.trim();
  const groups = showGrouped ? groupSows(sorted) : null;

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
      router.replace(`/enterprise/sow?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const loading = (isLoading && !data) || meLoading;

  const listTitle =
    activeStatus === "all"
      ? "Pipeline"
      : STATUS_LABEL[activeStatus as SowStatus];

  const listDescription =
    sorted.length === 0
      ? "No matches"
      : showGrouped
        ? `${sorted.length} SOW${sorted.length === 1 ? "" : "s"} · grouped by stage`
        : `${sorted.length} SOW${sorted.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-4">
      {error ? (
        <ErrorPanel message={error.message} onRetry={() => refetch()} />
      ) : (
        <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
          {/* Panel header */}
          <div className="px-5 pt-4 pb-0 border-b border-white/55">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
              <div className="min-w-0">
                <h2 className="font-display text-[15px] font-semibold text-foreground tracking-[-0.01em]">
                  {listTitle}
                </h2>
                <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                  {loading ? "Loading…" : listDescription}
                  {!loading && staleCount > 0 && activeStatus !== "approved" && (
                    <span className="text-warning-text font-medium">
                      {" · "}
                      {staleCount} overdue
                    </span>
                  )}
                </p>
              </div>
              <div className="relative w-full sm:w-60 shrink-0">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none"
                  strokeWidth={2}
                  aria-hidden
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setParam({ q: e.target.value })}
                  placeholder="Search by title…"
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

            <nav aria-label="Filter by status" className="flex flex-wrap gap-x-1 -mb-px">
              {TABS.map((tab) => {
                const active = activeStatus === tab.key;
                const count =
                  tab.key === "all"
                    ? counts.all
                    : counts[tab.key as SowStatus];
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() =>
                      setParam({ status: tab.key === "all" ? null : tab.key })
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

          {/* List body */}
          {loading ? (
            <ListSkeleton />
          ) : sorted.length === 0 ? (
            <EmptyPanel
              isEmptyTenant={allSows.length === 0}
              onClear={() => setParam({ status: null, q: null })}
            />
          ) : groups ? (
            <div className="divide-y divide-white/60">
              {groups.map((group) => (
                <SowGroup
                  key={group.status}
                  label={group.label}
                  rows={group.rows}
                  previewLimit={PREVIEW_PER_GROUP}
                  filterHref={`/enterprise/sow?status=${group.status}`}
                />
              ))}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-white/60">
                {pageRows.map((sow) => (
                  <SowRow key={sow.id} sow={sow} />
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
      )}
    </div>
  );
}

function SowGroup({
  label,
  rows,
  previewLimit,
  filterHref,
}: {
  label: string;
  rows: SowSummary[];
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
        <Link
          href={filterHref}
          className="font-body text-[11.5px] font-medium text-text-secondary hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <ul role="list">
        {preview.map((sow) => (
          <li key={sow.id} className="border-t border-white/55">
            <SowRow sow={sow} />
          </li>
        ))}
      </ul>
      {overflow > 0 && (
        <div className="px-5 py-2 border-t border-white/55">
          <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-secondary hover:text-foreground">
            + {overflow} more
          </Link>
        </div>
      )}
    </div>
  );
}

function SowRow({ sow }: { sow: SowSummary }) {
  const meta = rowMeta(sow);
  const quiet = sow.status === "withdrawn" || sow.status === "archived";

  return (
    <Link
      href={`/enterprise/sow/${sow.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px] transition-colors duration-fast hover:bg-white/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        quiet && "opacity-60",
      )}
    >
      <span className="font-body text-[13px] font-medium text-foreground truncate min-w-0">
        {sow.title}
        <span className="ml-2 font-mono text-[10px] text-text-tertiary tabular-nums">
          v{sow.activeVersion}
        </span>
      </span>
      <span
        className={cn(
          "font-body text-[11px] shrink-0 text-right max-w-[45%] truncate",
          meta.overdue ? "text-warning-text font-medium" : "text-text-tertiary",
        )}
      >
        {meta.text}
      </span>
    </Link>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-white/60">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="px-5 py-3">
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      ))}
    </div>
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
      <FileText className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      {isEmptyTenant ? (
        <>
          <p className="font-body text-[13px] font-semibold text-foreground">No SOWs yet</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">
            Create your first statement of work to start the pipeline.
          </p>
          <Link
            href="/enterprise/sow/intake"
            style={{ backgroundImage: AURORA_ACCENT, boxShadow: "0 14px 26px -10px rgba(108,76,230,0.6)" }}
            className="mt-4 inline-flex h-10 items-center px-5 rounded-2xl text-white font-body text-[13px] font-bold"
          >
            Create SOW
          </Link>
        </>
      ) : (
        <>
          <p className="font-body text-[13px] font-semibold text-foreground">No matches</p>
          <button
            type="button"
            onClick={onClear}
            className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground"
          >
            Clear filters
          </button>
        </>
      )}
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
      <AlertTriangle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
      <p className="font-body text-[12.5px] text-error-text flex-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1 h-7 px-2 rounded-lg border border-white/70 bg-white/55 backdrop-blur font-body text-[11px] font-semibold"
      >
        <RotateCcw className="h-3 w-3" aria-hidden />
        Retry
      </button>
    </div>
  );
}
