"use client";

/**
 * Decomposition workspace — registry table (platform pattern).
 *
 *   · "Awaiting decomposition" callout up top — the primary action surface
 *   · Work plans in a solid registry table: gradient-pill tabs + search + paginate
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Boxes, ChevronRight, Loader2, RotateCcw, Search, AlertTriangle, X } from "lucide-react";
import { usePlanList } from "@/lib/hooks/use-decomposition-v2";
import { useSowList } from "@/lib/hooks/use-sow-v2";
import { Skeleton } from "@/components/meridian";
import type { PlanStatus, PlanSummary } from "@/lib/decomposition/types";
import type { SowSummary } from "@/lib/sow/types";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, primaryBtnClass, primaryStyle, secondaryBtnClass, type Tone } from "@/app/admin/_shell/aurora-ui";

const STATUS_LABEL: Record<PlanStatus, string> = {
  draft: "Ready",
  submitted: "Submitted to Glimmora",
  approved: "Approved",
  active: "In progress",
  archived: "Archived",
};

const STATUS_TONE: Record<PlanStatus, Tone> = {
  draft: "info",
  submitted: "warning",
  approved: "success",
  active: "ai",
  archived: "neutral",
};

type FilterKey = "all" | PlanStatus;

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "draft", label: "Ready" },
  { key: "active", label: "In progress" },
  { key: "approved", label: "Approved" },
];

const ROWS_PER_PAGE = 12;

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

function parseSummaryCount(summary: string | null, kind: "milestones" | "tasks"): number | null {
  if (!summary) return null;
  const re = new RegExp(`(\\d+)\\s+${kind}`, "i");
  const m = summary.match(re);
  return m ? Number(m[1]) : null;
}

function planStructure(plan: PlanSummary): string {
  const ms = parseSummaryCount(plan.summary, "milestones");
  const ts = parseSummaryCount(plan.summary, "tasks");
  if (ms != null && ts != null) return `${ms} milestones · ${ts} tasks`;
  return "—";
}

function sortPlans(items: PlanSummary[]): PlanSummary[] {
  return [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export default function DecompositionListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeStatus: FilterKey = (searchParams.get("status") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const { data: planData, isLoading: planLoading, error, refetch } = usePlanList({ limit: 200 });
  const { data: sowData } = useSowList({ limit: 200 });

  const allPlans: PlanSummary[] = planData?.items ?? [];
  const allSows: SowSummary[] = sowData?.items ?? [];
  const sowById = React.useMemo(() => new Map(allSows.map((s) => [s.id, s])), [allSows]);

  const [decomposingId, setDecomposingId] = React.useState<string | null>(null);

  const readyToDecompose = React.useMemo(() => {
    const planned = new Set(allPlans.map((p) => p.sowId));
    return allSows.filter((s) => s.status === "approved" && !planned.has(s.id));
  }, [allSows, allPlans]);

  // Manual decomposition — open the builder to define milestones + tasks by hand.
  // (AI decomposition will pre-fill this same builder once integrated.)
  const handleDecompose = (sow: SowSummary) => {
    setDecomposingId(sow.id);
    router.push(`/enterprise/decomposition/new?sowId=${encodeURIComponent(sow.id)}`);
  };

  const counts = React.useMemo(() => {
    const c: Record<PlanStatus, number> = { draft: 0, submitted: 0, approved: 0, active: 0, archived: 0 };
    for (const p of allPlans) c[p.status]++;
    return { all: allPlans.length, ...c };
  }, [allPlans]);

  const sorted = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    const rows = allPlans.filter((p) => {
      if (activeStatus !== "all" && p.status !== activeStatus) return false;
      if (needle) {
        const title = sowById.get(p.sowId)?.title ?? "";
        if (!title.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
    return sortPlans(rows);
  }, [allPlans, activeStatus, search, sowById]);

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
      router.replace(qs ? `/enterprise/decomposition?${qs}` : "/enterprise/decomposition", { scroll: false });
    },
    [router, searchParams],
  );

  const loading = planLoading && !planData;

  if (error) return <ErrorPanel message={(error as Error).message} onRetry={() => refetch()} />;

  return (
    <div className="space-y-4">
      {/* Primary action — approved SOWs that need a plan */}
      {!loading && readyToDecompose.length > 0 ? (
        <AwaitingSection sows={readyToDecompose} decomposingId={decomposingId} onDecompose={handleDecompose} />
      ) : null}

      {/* Work plans registry */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-3.5 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Filter by status" className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => {
              const active = activeStatus === tab.key;
              const count = tab.key === "all" ? counts.all : counts[tab.key as PlanStatus];
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
              placeholder="Search by SOW title…"
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
          <EmptyState
            isEmptyTenant={allPlans.length === 0 && readyToDecompose.length === 0}
            onClear={() => setParam({ status: null, q: null })}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Work plan</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Status</th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Structure</th>
                    <th className="px-3 py-2.5 text-right font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">Updated</th>
                    <th className="w-10 px-2 py-2.5" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((plan) => (
                    <PlanRow key={plan.id} plan={plan} sow={sowById.get(plan.sowId)} onOpen={() => router.push(`/enterprise/decomposition/${plan.id}`)} />
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

function AwaitingSection({
  sows,
  decomposingId,
  onDecompose,
}: {
  sows: SowSummary[];
  decomposingId: string | null;
  onDecompose: (sow: SowSummary) => void;
}) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle">
        <span className="grid place-items-center h-9 w-9 rounded-lg text-white shrink-0" style={GLASS_GRADIENT} aria-hidden>
          <Boxes className="h-4.5 w-4.5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">
            Awaiting decomposition
            <span className="ml-2 font-mono text-[12px] font-semibold text-text-tertiary tabular-nums">{sows.length}</span>
          </h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Approved SOWs ready to break into a work plan.</p>
        </div>
      </div>
      <ul className="divide-y divide-stroke-subtle">
        {sows.map((sow) => {
          const busy = decomposingId === sow.id;
          return (
            <li key={sow.id} className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3">
              <div className="min-w-0">
                <p className="font-body text-[13.5px] font-semibold text-foreground truncate">{sow.title}</p>
                <Link
                  href={`/enterprise/sow/${sow.id}`}
                  className="inline-flex items-center gap-1 mt-0.5 font-body text-[11.5px] font-medium text-text-link hover:underline underline-offset-2"
                >
                  View SOW
                  <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden />
                </Link>
              </div>
              <button
                type="button"
                onClick={() => onDecompose(sow)}
                disabled={busy || decomposingId !== null}
                style={primaryStyle}
                className={cn(primaryBtnClass, "h-9 px-4 shrink-0")}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden /> : <Boxes className="h-4 w-4" strokeWidth={2} aria-hidden />}
                {busy ? "Opening…" : "Decompose"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PlanRow({ plan, sow, onOpen }: { plan: PlanSummary; sow: SowSummary | undefined; onOpen: () => void }) {
  const title = sow?.title ?? `Plan ${plan.id.slice(0, 8)}`;
  const quiet = plan.status === "archived";
  const href = `/enterprise/decomposition/${plan.id}`;

  return (
    <tr
      onClick={onOpen}
      className={cn("group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors", quiet && "opacity-70")}
    >
      <td className="px-4 sm:px-5 py-3.5">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="font-body text-[13.5px] font-semibold text-foreground hover:text-text-link truncate block max-w-[320px]"
          title={title}
        >
          {title}
          <span className="ml-2 font-mono text-[10px] font-normal text-text-tertiary tabular-nums">v{plan.version}</span>
        </Link>
      </td>
      <td className="px-3 py-3.5">
        <Chip tone={STATUS_TONE[plan.status]}>{STATUS_LABEL[plan.status]}</Chip>
      </td>
      <td className="px-3 py-3.5 font-body text-[12.5px] text-text-secondary whitespace-nowrap">{planStructure(plan)}</td>
      <td className="px-3 py-3.5 text-right font-mono text-[12px] tabular-nums text-text-tertiary whitespace-nowrap" suppressHydrationWarning>
        {timeAgo(plan.updatedAt)}
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
      <Boxes className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      {isEmptyTenant ? (
        <>
          <p className="font-body text-[13px] font-semibold text-foreground">No work plans yet</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
            Approve a SOW first — approved SOWs appear here ready to decompose.
          </p>
          <Link href="/enterprise/sow?status=approved" className={cn(primaryBtnClass, "mt-4 px-5")} style={primaryStyle}>
            View approved SOWs
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
