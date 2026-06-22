"use client";

/**
 * Decomposition workspace — aligned with SOW list UX.
 *
 *   · One panel: underline tabs + search
 *   · Grouped preview on All; flat paginated list when filtered
 *   · Approved SOWs awaiting a plan surface at the top of All
 *   · Scannable rows: title + meta (Attention-queue pattern)
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Boxes, Search, AlertTriangle, RotateCcw, Loader2, X } from "lucide-react";
import { usePlanList, useCreatePlan } from "@/lib/hooks/use-decomposition-v2";
import { useSowList } from "@/lib/hooks/use-sow-v2";
import { Skeleton } from "@/components/meridian";
import type { PlanStatus, PlanSummary, PlanStructureInput } from "@/lib/decomposition/types";
import type { SowSummary } from "@/lib/sow/types";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW, AURORA_ACCENT } from "@/app/admin/_shell/aurora";
import { GLASS_FIELD_STYLE, primaryBtnClass, primaryStyle } from "@/app/admin/_shell/aurora-ui";

function starterStructure(): PlanStructureInput {
  return {
    milestones: [
      { name: "Discovery & setup", order: 1 },
      { name: "Build", order: 2 },
      { name: "Launch", order: 3 },
    ],
    tasks: [
      { title: "Kickoff + requirements", milestoneKey: "Discovery & setup", requiredSkills: ["product"], estimatedHours: 16, order: 1 },
      { title: "Technical design", milestoneKey: "Discovery & setup", requiredSkills: ["architecture"], estimatedHours: 20, order: 2 },
      { title: "Core implementation", milestoneKey: "Build", requiredSkills: ["engineering"], estimatedHours: 40, order: 3 },
      { title: "QA + hardening", milestoneKey: "Build", requiredSkills: ["qa"], estimatedHours: 24, order: 4 },
      { title: "Launch + handover", milestoneKey: "Launch", requiredSkills: ["sre"], estimatedHours: 16, order: 5 },
    ],
    dependencies: [],
  };
}

const STATUS_LABEL: Record<PlanStatus, string> = {
  draft: "Ready",
  approved: "Approved",
  active: "In progress",
  archived: "Archived",
};

type FilterKey = "all" | PlanStatus;

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "draft", label: "Ready" },
  { key: "active", label: "In progress" },
  { key: "approved", label: "Approved" },
];

const GROUP_ORDER: PlanStatus[] = ["draft", "active", "approved", "archived"];

const PREVIEW_PER_GROUP = 5;
const ROWS_PER_PAGE = 10;

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

function planMeta(plan: PlanSummary): string {
  const ms = parseSummaryCount(plan.summary, "milestones");
  const ts = parseSummaryCount(plan.summary, "tasks");
  const parts = [STATUS_LABEL[plan.status]];
  if (ms != null && ts != null) parts.push(`${ms} milestones · ${ts} tasks`);
  parts.push(timeAgo(plan.updatedAt));
  return parts.join(" · ");
}

function sortPlans(items: PlanSummary[]): PlanSummary[] {
  return [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

function groupPlans(items: PlanSummary[]) {
  const buckets = new Map<PlanStatus, PlanSummary[]>();
  for (const s of GROUP_ORDER) buckets.set(s, []);
  for (const p of sortPlans(items)) buckets.get(p.status)?.push(p);
  return GROUP_ORDER.map((status) => ({
    status,
    label: STATUS_LABEL[status],
    rows: buckets.get(status) ?? [],
  })).filter((g) => g.rows.length > 0);
}

export default function DecompositionListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeStatus: FilterKey =
    (searchParams.get("status") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const { data: planData, isLoading: planLoading, error, refetch } = usePlanList({ limit: 200 });
  const { data: sowData } = useSowList({ limit: 200 });

  const allPlans: PlanSummary[] = planData?.items ?? [];
  const allSows: SowSummary[] = sowData?.items ?? [];
  const sowById = React.useMemo(
    () => new Map(allSows.map((s) => [s.id, s])),
    [allSows],
  );

  const createPlan = useCreatePlan();
  const [decomposingId, setDecomposingId] = React.useState<string | null>(null);

  const readyToDecompose = React.useMemo(() => {
    const planned = new Set(allPlans.map((p) => p.sowId));
    return allSows.filter((s) => s.status === "approved" && !planned.has(s.id));
  }, [allSows, allPlans]);

  const handleDecompose = async (sow: SowSummary) => {
    setDecomposingId(sow.id);
    try {
      const structure = starterStructure();
      const plan = await createPlan.mutateAsync({
        sowId: sow.id,
        summary: `${structure.milestones.length} milestones · ${structure.tasks.length} tasks (draft)`,
        structure,
      });
      router.push(`/enterprise/decomposition/${plan.id}`);
    } catch {
      setDecomposingId(null);
    }
  };

  const counts = React.useMemo(() => {
    const c: Record<PlanStatus, number> = { draft: 0, approved: 0, active: 0, archived: 0 };
    for (const p of allPlans) c[p.status]++;
    return { all: allPlans.length, ...c };
  }, [allPlans]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return allPlans.filter((p) => {
      if (activeStatus !== "all" && p.status !== activeStatus) return false;
      if (needle) {
        const title = sowById.get(p.sowId)?.title ?? "";
        if (!title.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [allPlans, activeStatus, search, sowById]);

  const filteredAwaiting = React.useMemo(() => {
    if (activeStatus !== "all" || search.trim()) return [];
    const needle = search.trim().toLowerCase();
    return readyToDecompose.filter((s) =>
      !needle || s.title.toLowerCase().includes(needle),
    );
  }, [readyToDecompose, activeStatus, search]);

  const sorted = React.useMemo(() => sortPlans(filtered), [filtered]);
  const showGrouped = activeStatus === "all" && !search.trim();
  const groups = showGrouped ? groupPlans(sorted) : null;

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
      router.replace(`/enterprise/decomposition?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const loading = planLoading && !planData;
  const totalVisible = sorted.length + (showGrouped ? filteredAwaiting.length : 0);

  const listTitle =
    activeStatus === "all" ? "Work plans" : STATUS_LABEL[activeStatus as PlanStatus];

  const listDescription = loading
    ? "Loading…"
    : totalVisible === 0
      ? "No matches"
      : showGrouped
        ? `${totalVisible} item${totalVisible === 1 ? "" : "s"} · grouped by stage`
        : `${sorted.length} plan${sorted.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-4">
      {error ? (
        <ErrorPanel message={(error as Error).message} onRetry={() => refetch()} />
      ) : (
        <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
          <div className="px-5 pt-4 pb-0 border-b border-white/55">
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
              <div className="min-w-0">
                <h2 className="font-display text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                  {listTitle}
                </h2>
                <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                  {listDescription}
                  {!loading && showGrouped && filteredAwaiting.length > 0 && (
                    <span className="text-text-secondary font-medium">
                      {" · "}
                      {filteredAwaiting.length} awaiting decomposition
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
                  placeholder="Search by SOW title…"
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
                  tab.key === "all" ? counts.all : counts[tab.key as PlanStatus];
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

          {loading ? (
            <ListSkeleton />
          ) : totalVisible === 0 ? (
            <EmptyPanel
              isEmptyTenant={allPlans.length === 0 && readyToDecompose.length === 0}
              onClear={() => setParam({ status: null, q: null })}
            />
          ) : showGrouped ? (
            <div className="divide-y divide-white/60">
              {filteredAwaiting.length > 0 && (
                <AwaitingGroup
                  sows={filteredAwaiting}
                  decomposingId={decomposingId}
                  onDecompose={handleDecompose}
                />
              )}
              {groups?.map((group) => (
                <PlanGroup
                  key={group.status}
                  label={group.label}
                  rows={group.rows}
                  sowById={sowById}
                  previewLimit={PREVIEW_PER_GROUP}
                  filterHref={`/enterprise/decomposition?status=${group.status}`}
                />
              ))}
            </div>
          ) : (
            <>
              <ul className="divide-y divide-white/60">
                {pageRows.map((plan) => (
                  <PlanRow key={plan.id} plan={plan} sow={sowById.get(plan.sowId)} />
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

function AwaitingGroup({
  sows,
  decomposingId,
  onDecompose,
}: {
  sows: SowSummary[];
  decomposingId: string | null;
  onDecompose: (sow: SowSummary) => void;
}) {
  return (
    <div>
      <div className="px-5 py-2.5">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
          Awaiting decomposition
          <span className="ml-1.5 font-mono tabular-nums text-foreground normal-case tracking-normal">
            {sows.length}
          </span>
        </p>
      </div>
      <ul role="list" className="divide-y divide-white/60 border-t border-white/55">
        {sows.map((sow) => {
          const busy = decomposingId === sow.id;
          return (
            <li
              key={sow.id}
              className="flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px] transition-colors duration-fast hover:bg-white/50"
            >
              <Link
                href={`/enterprise/sow/${sow.id}`}
                className="min-w-0 flex-1 font-body text-[13px] font-medium text-foreground truncate hover:underline underline-offset-2"
                title={sow.title}
              >
                {sow.title}
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-body text-[11px] text-text-tertiary hidden sm:inline">
                  Approved · ready to decompose
                </span>
                <button
                  type="button"
                  onClick={() => onDecompose(sow)}
                  disabled={busy || decomposingId !== null}
                  style={primaryStyle}
                  className={cn(
                    primaryBtnClass,
                    "h-8 px-3 text-[12px]",
                  )}
                >
                  {busy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} aria-hidden />
                  ) : (
                    <Boxes className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  )}
                  {busy ? "Creating…" : "Decompose"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PlanGroup({
  label,
  rows,
  sowById,
  previewLimit,
  filterHref,
}: {
  label: string;
  rows: PlanSummary[];
  sowById: Map<string, SowSummary>;
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
        <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-secondary hover:text-foreground">
          View all
        </Link>
      </div>
      <ul role="list" className="divide-y divide-white/60 border-t border-white/55">
        {preview.map((plan) => (
          <li key={plan.id}>
            <PlanRow plan={plan} sow={sowById.get(plan.sowId)} />
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

function PlanRow({ plan, sow }: { plan: PlanSummary; sow: SowSummary | undefined }) {
  const title = sow?.title ?? `Plan ${plan.id.slice(0, 8)}`;
  const quiet = plan.status === "archived";

  return (
    <Link
      href={`/enterprise/decomposition/${plan.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px] transition-colors duration-fast hover:bg-white/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        quiet && "opacity-60",
      )}
    >
      <span className="font-body text-[13px] font-medium text-foreground truncate min-w-0">
        {title}
        <span className="ml-2 font-mono text-[10px] text-text-tertiary tabular-nums">
          v{plan.version}
        </span>
      </span>
      <span className="font-body text-[11px] shrink-0 text-right max-w-[50%] truncate text-text-tertiary">
        {planMeta(plan)}
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
      <Boxes className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      {isEmptyTenant ? (
        <>
          <p className="font-body text-[13px] font-semibold text-foreground">
            No decomposition plans yet
          </p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
            Approve a SOW first — approved SOWs appear here ready to decompose.
          </p>
          <Link
            href="/enterprise/sow?status=approved"
            style={{ backgroundImage: AURORA_ACCENT, boxShadow: "0 14px 26px -10px rgba(108,76,230,0.6)" }}
            className="mt-4 inline-flex h-10 items-center px-5 rounded-2xl text-white font-body text-[13px] font-bold"
          >
            View approved SOWs
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
