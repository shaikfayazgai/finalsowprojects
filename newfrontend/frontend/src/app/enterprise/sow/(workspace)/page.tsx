"use client";

/**
 * SOW workspace — registry table (platform pattern).
 *
 * Solid card → gradient-pill status tabs + search → table → pagination.
 * Matches the platform admin list pages (tenants / commercial gate).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ChevronRight, RotateCcw, Search, X } from "lucide-react";
import { Skeleton } from "@/components/meridian";
import { useSowList } from "@/lib/hooks/use-sow-v2";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { sowOverlay } from "@/lib/enterprise/mocks/sows";
import { useOverlayVersion } from "@/lib/enterprise/mocks/overlay";
import { STAGE_LABEL } from "@/lib/sow/approval-pipeline";
import type { SowStatus, SowSummary } from "@/lib/sow/types";
import { canViewSowByConfidentiality } from "@/lib/sow/confidentiality-access";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, primaryBtnClass, primaryStyle, secondaryBtnClass, type Tone } from "@/app/admin/_shell/aurora-ui";

const STATUS_LABEL: Record<SowStatus, string> = {
  draft: "Draft",
  approval: "In approval",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

const STATUS_TONE: Record<SowStatus, Tone> = {
  draft: "neutral",
  approval: "info",
  approved: "success",
  rejected: "error",
  withdrawn: "neutral",
  archived: "neutral",
};

type FilterKey = "all" | SowStatus;

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "approval", label: "In approval" },
  { key: "draft", label: "Draft" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const ROWS_PER_PAGE = 12;

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

function sortSows(items: SowSummary[]): SowSummary[] {
  return [...items].sort((a, b) => {
    const aStale = isStale(a) ? 1 : 0;
    const bStale = isStale(b) ? 1 : 0;
    if (aStale !== bStale) return bStale - aStale;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export default function SowListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const overlayTick = useOverlayVersion(sowOverlay);
  const { roles, email, meLoading } = useEnterpriseAccess();

  const activeStatus: FilterKey = (searchParams.get("status") as FilterKey | null) ?? "all";
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
      canViewSowByConfidentiality({ confidentiality: s.confidentiality, roles, actorEmail: email, ownerId: s.ownerId }),
    );
  }, [data?.items, meLoading, roles, email]);

  const counts = React.useMemo(() => {
    const c: Record<SowStatus, number> = { draft: 0, approval: 0, approved: 0, rejected: 0, withdrawn: 0, archived: 0 };
    for (const s of allSows) c[s.status]++;
    return { all: allSows.length, ...c };
  }, [allSows]);

  const staleCount = React.useMemo(() => allSows.filter(isStale).length, [allSows]);

  const sorted = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = allSows.filter((s) => {
      if (activeStatus !== "all" && s.status !== activeStatus) return false;
      if (needle && !s.title.toLowerCase().includes(needle)) return false;
      return true;
    });
    return sortSows(rows);
  }, [allSows, activeStatus, search]);

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
      router.replace(qs ? `/enterprise/sow?${qs}` : "/enterprise/sow", { scroll: false });
    },
    [router, searchParams],
  );

  const loading = (isLoading && !data) || meLoading;

  if (error) return <ErrorPanel message={error.message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      {!loading && staleCount > 0 && activeStatus !== "approval" ? (
        <button
          type="button"
          onClick={() => setParam({ status: "approval" })}
          className="w-full flex items-center gap-3 rounded-lg border border-warning-border bg-warning-subtle/50 px-4 py-3 text-left hover:bg-warning-subtle/70 transition-colors group"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning-text" strokeWidth={2} aria-hidden />
          <span className="min-w-0 flex-1 font-body text-[13px] text-text-secondary">
            <span className="font-semibold text-foreground">
              {staleCount} SOW{staleCount === 1 ? "" : "s"} overdue
            </span>{" "}
            in approval — waiting 48+ hours.
          </span>
          <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-foreground shrink-0" strokeWidth={2} aria-hidden />
        </button>
      ) : null}

      <div className={cn(DASH_CARD, "overflow-hidden")}>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-3.5 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => {
              const active = activeStatus === tab.key;
              const count = tab.key === "all" ? counts.all : counts[tab.key as SowStatus];
              const warn = tab.key === "approval" && staleCount > 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ status: tab.key === "all" ? null : tab.key })}
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

          <div className="relative w-full sm:w-60 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setParam({ q: e.target.value })}
              placeholder="Search by title…"
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setParam({ q: null })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        {loading ? (
          <ListSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyState isEmptyTenant={counts.all === 0} onClear={() => setParam({ status: null, q: null })} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">SOW</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Status</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Stage</th>
                    <th className="px-3 py-2.5 text-right font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Updated</th>
                    <th className="w-10 px-2 py-2.5" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((sow) => (
                    <SowRow key={sow.id} sow={sow} />
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
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })}
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[11px] text-text-tertiary">{pageIdx}/{totalPages}</span>
                  <button
                    type="button"
                    disabled={pageIdx >= totalPages}
                    onClick={() => setParam({ page: String(pageIdx + 1) })}
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
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

function SowRow({ sow }: { sow: SowSummary }) {
  const router = useRouter();
  const stale = isStale(sow);
  const stage = sow.stage ? STAGE_LABEL[sow.stage] : null;
  const href = `/enterprise/sow/${sow.id}`;
  const quiet = sow.status === "withdrawn" || sow.status === "archived";

  return (
    <tr
      onClick={() => router.push(href)}
      className={cn("group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors", quiet && "opacity-70")}
    >
      <td className="px-4 sm:px-5 py-3.5">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="font-body text-[13.5px] font-semibold text-foreground hover:text-text-link truncate block max-w-[320px]"
          title={`${sow.title} · v${sow.activeVersion}`}
        >
          {sow.title}
          <span className="ml-2 font-mono text-[10px] font-normal text-text-tertiary tabular-nums">v{sow.activeVersion}</span>
        </Link>
      </td>
      <td className="px-3 py-3.5">
        <Chip tone={stale ? "warning" : STATUS_TONE[sow.status]}>{stale ? "Overdue" : STATUS_LABEL[sow.status]}</Chip>
      </td>
      <td className="px-3 py-3.5 font-body text-[12.5px] text-text-secondary truncate max-w-[160px]">{stage ?? "—"}</td>
      <td className="px-3 py-3.5 text-right font-mono text-[12px] tabular-nums text-text-tertiary whitespace-nowrap" suppressHydrationWarning>
        {timeAgo(sow.updatedAt)}
      </td>
      <td className="px-2 py-3.5 align-middle">
        <ChevronRight className="h-4 w-4 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity" strokeWidth={2} aria-hidden />
      </td>
    </tr>
  );
}

function ListSkeleton() {
  return (
    <div className="divide-y divide-stroke-subtle">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 px-5 py-3.5">
          <Skeleton className="h-4 w-64 max-w-[50%]" />
          <Skeleton className="h-[22px] w-20 rounded-full" />
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
          <p className="font-body text-[13px] font-semibold text-foreground">No SOWs yet</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">Create your first statement of work to start the pipeline.</p>
          <Link href="/enterprise/sow/create" className={cn(primaryBtnClass, "mt-4 px-5")} style={primaryStyle}>
            Create SOW
          </Link>
        </>
      ) : (
        <>
          <p className="font-body text-[13px] font-semibold text-foreground">No matches</p>
          <button type="button" onClick={onClear} className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground">
            Clear filters
          </button>
        </>
      )}
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
      <AlertTriangle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
      <p className="font-body text-[12.5px] text-error-text flex-1">{message}</p>
      <button type="button" onClick={onRetry} className={cn(secondaryBtnClass, "h-8 px-3 text-[12px]")}>
        <RotateCcw className="h-3.5 w-3.5" aria-hidden />
        Retry
      </button>
    </div>
  );
}
