"use client";

/**
 * Mentor review queue — aligned with enterprise reviewer queue + SOW workspace UX.
 *
 * · One panel (no duplicate KPI band)
 * · Underline scope tabs with brand-subtle counts
 * · Grouped SLA preview on All; flat paginated list when filtered
 * · Scannable rows: title + meta (attention-queue pattern)
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ClipboardList,
  Filter,
  Search,
} from "lucide-react";
import type { MockReview, SlaTier } from "@/mocks/mentor";
import { fetchMentorReviews, MentorApiError } from "@/lib/api/mentor-api";
import { useActiveMentor } from "@/lib/hooks/use-active-mentor";
import {
  listPendingReviewSubmissions,
  decideReviewPipeline,
  reviewPipelineOverlay,
} from "@/lib/mentor/review-pipeline-overlay";
import { Skeleton } from "@/components/meridian";
import { Drawer } from "@/components/meridian/overlays";
import { mentorPrimaryBtn, mentorSecondaryBtn } from "@/app/mentor/_components/mentor-ui";
import { cn } from "@/lib/utils/cn";

const ROWS_PER_PAGE = 10;
const PREVIEW_PER_GROUP = 5;

type FilterKey = "all" | "sla_risk" | "round_2" | "two_stage";
type GroupMode = "flat" | "project" | "contributor";

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All pending" },
  { key: "sla_risk", label: "SLA risk" },
  { key: "round_2", label: "Round 2+" },
  { key: "two_stage", label: "Two-stage" },
];

const VIEW_CHIPS: Array<{ key: GroupMode; label: string }> = [
  { key: "flat", label: "Flat list" },
  { key: "project", label: "By project" },
  { key: "contributor", label: "By contributor" },
];

const ALL_SLA_TIERS: SlaTier[] = ["breached", "critical", "warning", "watch", "healthy"];
const SLA_ATTENTION: SlaTier[] = ["breached", "critical", "warning"];
const SLA_OVERDUE: SlaTier[] = ["breached", "critical"];

function fmtSlaDue(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return "Overdue";
  const h = Math.floor(ms / 3_600_000);
  if (h >= 24) return `${Math.floor(h / 24)}d left`;
  return `${h}h left`;
}

function fmtRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function isSlaRisk(item: MockReview): boolean {
  return SLA_ATTENTION.includes(item.slaTier);
}

function isRound2Plus(item: MockReview): boolean {
  return item.round >= 2;
}

function isTwoStage(item: MockReview): boolean {
  return item.stage === "two_stage";
}

function rowMeta(item: MockReview): { text: string; urgent: boolean } {
  const sla = fmtSlaDue(item.dueAt);
  const overdue = item.slaTier === "breached" || item.slaTier === "critical";
  const stage = item.stage === "two_stage" ? "Two-stg" : "Single";
  const flag = item.flag ? ` · ${item.flag.replace("_", " ")}` : "";

  if (overdue) {
    return {
      text: `${item.contributorName} · ${item.project} · R${item.round} · ${sla}${flag}`,
      urgent: true,
    };
  }

  return {
    text: [
      item.contributorName,
      item.project,
      `R${item.round}/${item.totalRounds}`,
      stage,
      `Submitted ${fmtRelative(item.submittedAt)}`,
      sla,
    ].join(" · ") + flag,
    urgent: item.slaTier === "warning",
  };
}

function sortQueue(items: MockReview[]): MockReview[] {
  return [...items].sort((a, b) => {
    const rank = (t: SlaTier) =>
      t === "breached" || t === "critical" ? 3 : t === "warning" ? 2 : t === "watch" ? 1 : 0;
    if (rank(a.slaTier) !== rank(b.slaTier)) return rank(b.slaTier) - rank(a.slaTier);
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
  });
}

function groupBySla(items: MockReview[]) {
  const sorted = sortQueue(items);
  const overdue = sorted.filter((i) => SLA_OVERDUE.includes(i.slaTier));
  const atRisk = sorted.filter(
    (i) => i.slaTier === "warning" && !SLA_OVERDUE.includes(i.slaTier),
  );
  const onTrack = sorted.filter((i) => !SLA_ATTENTION.includes(i.slaTier));

  const groups: Array<{ key: string; label: string; rows: MockReview[] }> = [];
  if (overdue.length) groups.push({ key: "overdue", label: "Overdue", rows: overdue });
  if (atRisk.length) groups.push({ key: "at_risk", label: "SLA risk", rows: atRisk });
  if (onTrack.length) groups.push({ key: "on_track", label: "On track", rows: onTrack });
  return groups;
}

function groupByMode(items: MockReview[], mode: GroupMode) {
  const groups = new Map<string, MockReview[]>();
  for (const r of sortQueue(items)) {
    const key = mode === "project" ? r.project : r.contributorName;
    groups.set(key, [...(groups.get(key) ?? []), r]);
  }
  return Array.from(groups.entries()).map(([label, rows]) => ({
    key: label,
    label,
    rows,
  }));
}

function defaultAdvancedFilters() {
  return {
    slaTiers: new Set<SlaTier>(ALL_SLA_TIERS),
    stages: new Set<"single" | "two_stage">(["single", "two_stage"]),
    roundFilter: "any" as const,
    flagFilters: { continuity: false, fresh: false, recent_paired: false },
  };
}

function advancedFilterCount(
  slaTiers: Set<SlaTier>,
  stages: Set<"single" | "two_stage">,
  roundFilter: "any" | "1" | "2plus",
  flagFilters: { continuity: boolean; fresh: boolean; recent_paired: boolean },
): number {
  const d = defaultAdvancedFilters();
  let n = 0;
  if (slaTiers.size !== d.slaTiers.size || ALL_SLA_TIERS.some((t) => !slaTiers.has(t))) n++;
  if (stages.size !== 2) n++;
  if (roundFilter !== "any") n++;
  if (flagFilters.continuity || flagFilters.fresh || flagFilters.recent_paired) n++;
  return n;
}

/**
 * Live submissions routed from the contributor portal in this browser session
 * (shared review-pipeline overlay). The mentor's decision here flows straight
 * back to the contributor's task — the real cross-portal handoff.
 */
function LiveSubmissionsPanel() {
  const { profile } = useActiveMentor();
  const mentorName = profile?.displayName ?? "Mentor";
  const [, bump] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const [reworkFor, setReworkFor] = React.useState<string | null>(null);
  const [comment, setComment] = React.useState("");

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => reviewPipelineOverlay.subscribe(() => bump((v) => v + 1)), []);

  const pending = listPendingReviewSubmissions();
  // Read the overlay only after mount — it's client-only localStorage, so
  // rendering it during SSR/first paint would cause a hydration mismatch.
  if (!mounted || pending.length === 0) return null;

  return (
    <section className="rounded-xl border border-brand-border/50 bg-brand-subtle/15 overflow-hidden">
      <header className="px-5 py-3 border-b border-brand-border/40">
        <p className="font-body text-[13px] font-semibold text-foreground">
          Live submissions · awaiting your decision
          <span className="ml-2 font-mono text-[11px] text-brand-emphasis">{pending.length}</span>
        </p>
        <p className="font-body text-[11.5px] text-text-tertiary mt-0.5">
          Real contributor submissions routed to you this session. Your decision flows straight back to the contributor.
        </p>
      </header>
      <ul className="divide-y divide-stroke-subtle">
        {pending.map((r) => (
          <li key={r.taskId} className="px-5 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-body text-[13px] font-medium text-foreground truncate">{r.title}</p>
                <p className="font-body text-[11.5px] text-text-tertiary" suppressHydrationWarning>
                  {r.contributorName} · Round {r.round} · submitted {fmtRelative(r.submittedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className={mentorSecondaryBtn}
                  onClick={() => { setReworkFor(reworkFor === r.taskId ? null : r.taskId); setComment(""); }}
                >
                  Request rework
                </button>
                <button
                  type="button"
                  className={mentorPrimaryBtn}
                  onClick={() => decideReviewPipeline(r.taskId, "approve", mentorName)}
                >
                  Accept
                </button>
              </div>
            </div>
            {reworkFor === r.taskId && (
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What does the contributor need to fix?"
                  className="flex-1 h-9 px-3 rounded-md border border-stroke bg-surface font-body text-[12.5px] text-foreground placeholder:text-text-disabled focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20"
                />
                <button
                  type="button"
                  className={mentorPrimaryBtn}
                  onClick={() => {
                    decideReviewPipeline(r.taskId, "revise", mentorName, comment.trim() || undefined);
                    setReworkFor(null);
                    setComment("");
                  }}
                >
                  Send rework
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MentorQueueWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter: FilterKey =
    (searchParams.get("filter") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const groupMode: GroupMode =
    (searchParams.get("group") as GroupMode | null) ?? "flat";

  const [items, setItems] = React.useState<MockReview[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const defaults = defaultAdvancedFilters();
  const [slaTiers, setSlaTiers] = React.useState(defaults.slaTiers);
  const [stages, setStages] = React.useState(defaults.stages);
  const [roundFilter, setRoundFilter] = React.useState<"any" | "1" | "2plus">(defaults.roundFilter);
  const [flagFilters, setFlagFilters] = React.useState(defaults.flagFilters);

  const extraFilters = advancedFilterCount(slaTiers, stages, roundFilter, flagFilters);

  const retriesRef = React.useRef(0);
  const mountedRef = React.useRef(true);
  React.useEffect(() => () => { mountedRef.current = false; }, []);

  const loadQueue = React.useCallback((signal?: AbortSignal) => {
    fetchMentorReviews(signal)
      .then((res) => {
        setItems(res.items);
        setError(null);
        retriesRef.current = 0;
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        const msg =
          err instanceof MentorApiError ? err.message : "Could not load queue.";
        // Transient auth race right after login (the session token isn't attached
        // to the proxy yet) → retry quietly a few times instead of flashing the
        // raw "Missing bearer token" backend error to the user.
        if (
          /bearer token|unauthor|401|403/i.test(msg) &&
          retriesRef.current < 4 &&
          mountedRef.current
        ) {
          retriesRef.current += 1;
          window.setTimeout(() => {
            if (mountedRef.current) loadQueue();
          }, 500);
          return;
        }
        setError(msg);
      });
  }, []);

  React.useEffect(() => {
    const c = new AbortController();
    loadQueue(c.signal);
    return () => c.abort();
  }, [loadQueue, searchParams.toString()]);

  React.useEffect(() => {
    const onRefresh = () => loadQueue();
    window.addEventListener("mentor-queue:refresh", onRefresh);
    return () => window.removeEventListener("mentor-queue:refresh", onRefresh);
  }, [loadQueue]);

  const list = items ?? [];

  const counts = React.useMemo(() => {
    let slaRisk = 0;
    let round2 = 0;
    let twoStage = 0;
    for (const item of list) {
      if (isSlaRisk(item)) slaRisk++;
      if (isRound2Plus(item)) round2++;
      if (isTwoStage(item)) twoStage++;
    }
    return { all: list.length, sla_risk: slaRisk, round_2: round2, two_stage: twoStage };
  }, [list]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return list.filter((item) => {
      if (activeFilter === "sla_risk" && !isSlaRisk(item)) return false;
      if (activeFilter === "round_2" && !isRound2Plus(item)) return false;
      if (activeFilter === "two_stage" && !isTwoStage(item)) return false;

      if (!slaTiers.has(item.slaTier)) return false;
      if (!stages.has(item.stage)) return false;
      if (roundFilter === "1" && item.round !== 1) return false;
      if (roundFilter === "2plus" && item.round < 2) return false;

      const anyFlag =
        flagFilters.continuity || flagFilters.fresh || flagFilters.recent_paired;
      if (anyFlag) {
        const match =
          (flagFilters.continuity && item.flag === "continuity") ||
          (flagFilters.fresh && item.flag === "fresh") ||
          (flagFilters.recent_paired && item.flag === "recent_paired");
        if (!match) return false;
      }

      if (needle) {
        const hay = `${item.taskTitle} ${item.contributorName} ${item.project} ${item.skills.join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [list, activeFilter, search, slaTiers, stages, roundFilter, flagFilters]);

  const sorted = React.useMemo(() => sortQueue(filtered), [filtered]);

  const slaGrouped =
    activeFilter === "all" &&
    groupMode === "flat" &&
    !search.trim() &&
    extraFilters === 0;

  const manualGrouped = groupMode !== "flat" && !search.trim();

  const groups = slaGrouped
    ? groupBySla(sorted)
    : manualGrouped
      ? groupByMode(sorted, groupMode)
      : null;

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = groups ? sorted : sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/mentor/queue?${qs}` : "/mentor/queue", { scroll: false });
    },
    [router, searchParams],
  );

  const slaRiskCount = counts.sla_risk;
  const allBreached = list.length > 0 && list.every((r) => r.slaTier === "breached");

  const listTitle =
    activeFilter === "all"
      ? "Pending reviews"
      : TABS.find((t) => t.key === activeFilter)?.label ?? "Pending reviews";

  const listDescription =
    items === null && !error
      ? "Loading reviews…"
      : sorted.length === 0
        ? "No matches"
        : groups
          ? `${sorted.length} review${sorted.length === 1 ? "" : "s"} · grouped by ${slaGrouped ? "SLA" : groupMode}`
          : `${sorted.length} review${sorted.length === 1 ? "" : "s"}`;

  const onResetAdvanced = () => {
    const d = defaultAdvancedFilters();
    setSlaTiers(d.slaTiers);
    setStages(d.stages);
    setRoundFilter(d.roundFilter);
    setFlagFilters(d.flagFilters);
  };

  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      <LiveSubmissionsPanel />
      {error && (
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{error}</p>
        </div>
      )}

      {allBreached && (
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            Your queue is over SLA. A senior mentor has been notified.
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
                {slaGrouped && slaRiskCount > 0 && (
                  <span className="text-warning-text font-medium">
                    {" · "}
                    {slaRiskCount} SLA at risk
                  </span>
                )}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[12px]">
                <Link
                  href="/mentor/history"
                  className="font-medium text-text-link hover:underline underline-offset-2"
                >
                  Decision history
                </Link>
                <Link
                  href="/mentor/history/metrics"
                  className="font-medium text-text-link hover:underline underline-offset-2"
                >
                  Personal metrics
                </Link>
              </div>
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
                placeholder="Search task, people…"
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

          <nav aria-label="Filter review queue" className="flex flex-wrap gap-x-1 -mb-px">
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
                      tab.key === "sla_risk" && count > 0 && !active && "text-warning-text",
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

          <div
            aria-label="List layout and filters"
            className="flex flex-wrap items-center gap-1.5 pb-3 border-t border-stroke-subtle pt-3"
          >
            <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mr-1">
              View
            </span>
            {VIEW_CHIPS.map((chip) => {
              const active = groupMode === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setParam({ group: chip.key === "flat" ? null : chip.key })}
                  className={cn(
                    "inline-flex items-center gap-1 h-7 px-2.5 rounded-md border font-body text-[12px] transition-colors duration-fast",
                    active
                      ? "bg-foreground text-surface border-foreground"
                      : "bg-surface text-text-secondary border-stroke hover:bg-bg-subtle",
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={cn(
                "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border font-body text-[12px] font-semibold transition-colors duration-fast ml-auto sm:ml-1",
                extraFilters > 0
                  ? "border-brand/40 bg-brand-subtle/30 text-brand"
                  : "bg-surface text-text-secondary border-stroke hover:bg-bg-subtle",
              )}
            >
              <Filter className="h-3 w-3" strokeWidth={2} aria-hidden />
              Advanced
              {extraFilters > 0 && (
                <span className="font-mono text-[10px] tabular-nums">({extraFilters})</span>
              )}
            </button>
          </div>
        </div>

        {items === null && !error ? (
          <QueueSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyPanel
            isEmptyQueue={list.length === 0 && !error}
            onClear={() => {
              setParam({ filter: null, q: null, group: null });
              onResetAdvanced();
            }}
          />
        ) : groups ? (
          <div className="divide-y divide-stroke-subtle">
            {groups.map((group) => (
              <QueueGroup
                key={group.key}
                label={group.label}
                rows={group.rows}
                previewLimit={PREVIEW_PER_GROUP}
                filterHref={`/mentor/queue?filter=${
                  group.key === "overdue" || group.key === "at_risk" ? "sla_risk" : "all"
                }`}
              />
            ))}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((item) => (
                <QueueRow key={item.id} item={item} />
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

      <Drawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Advanced filters"
        description="SLA tier, stage, round, and reviewer flags."
        size="sm"
        footer={
          <>
            <button type="button" onClick={onResetAdvanced} className={mentorSecondaryBtn}>
              Reset
            </button>
            <button type="button" onClick={() => setFiltersOpen(false)} className={mentorPrimaryBtn}>
              Done
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <FilterGroup label="SLA tier">
            {ALL_SLA_TIERS.map((t) => (
              <FilterCheckbox
                key={t}
                label={t === "breached" ? "Critical / Breached" : t.charAt(0).toUpperCase() + t.slice(1)}
                checked={slaTiers.has(t)}
                onChange={(v) => {
                  setSlaTiers((p) => {
                    const next = new Set(p);
                    if (v) next.add(t);
                    else next.delete(t);
                    return next;
                  });
                }}
              />
            ))}
          </FilterGroup>
          <FilterGroup label="Stage">
            <FilterCheckbox
              label="Single-stage"
              checked={stages.has("single")}
              onChange={(v) => {
                setStages((p) => {
                  const n = new Set(p);
                  if (v) n.add("single");
                  else n.delete("single");
                  return n;
                });
              }}
            />
            <FilterCheckbox
              label="Two-stage"
              checked={stages.has("two_stage")}
              onChange={(v) => {
                setStages((p) => {
                  const n = new Set(p);
                  if (v) n.add("two_stage");
                  else n.delete("two_stage");
                  return n;
                });
              }}
            />
          </FilterGroup>
          <FilterGroup label="Round">
            {(["any", "1", "2plus"] as const).map((r) => (
              <label
                key={r}
                className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer"
              >
                <input
                  type="radio"
                  name="round"
                  checked={roundFilter === r}
                  onChange={() => setRoundFilter(r)}
                  className="h-3.5 w-3.5 accent-brand"
                />
                {r === "any" ? "Any" : r === "1" ? "Round 1" : "Round 2+"}
              </label>
            ))}
          </FilterGroup>
          <FilterGroup label="Flags">
            <FilterCheckbox
              label='Continuity (my prior round)'
              checked={flagFilters.continuity}
              onChange={(v) => setFlagFilters((p) => ({ ...p, continuity: v }))}
            />
            <FilterCheckbox
              label='Fresh (new to me)'
              checked={flagFilters.fresh}
              onChange={(v) => setFlagFilters((p) => ({ ...p, fresh: v }))}
            />
            <FilterCheckbox
              label='Recent paired (caution)'
              checked={flagFilters.recent_paired}
              onChange={(v) => setFlagFilters((p) => ({ ...p, recent_paired: v }))}
            />
          </FilterGroup>
        </div>
      </Drawer>
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
  rows: MockReview[];
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
          <li key={item.id}>
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

function QueueRow({ item }: { item: MockReview }) {
  const meta = rowMeta(item);

  return (
    <Link
      href={`/mentor/queue/${item.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px]",
        "hover:bg-bg-subtle/50 transition-colors duration-fast",
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
  isEmptyQueue,
  onClear,
}: {
  isEmptyQueue: boolean;
  onClear: () => void;
}) {
  return (
    <div className="px-5 py-14 text-center">
      {isEmptyQueue ? (
        <>
          <ClipboardList className="h-6 w-6 text-success-text mx-auto mb-2" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] font-semibold text-foreground">Queue clear</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
            No reviews waiting for your decision.
          </p>
        </>
      ) : (
        <>
          <ClipboardList className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
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

export function QueuePageSkeleton() {
  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-4 border-b border-stroke-subtle space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-8 w-full max-w-xs ml-auto" />
        </div>
        <QueueSkeleton />
      </section>
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-brand rounded-sm"
      />
      {label}
    </label>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
