"use client";

/**
 * Assigned tasks workspace — enterprise/admin list pattern.
 *
 * Editorial header lives in layout.tsx. This file is the operational queue:
 * summary dl → single panel → underline tabs → scannable rows.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  ClipboardList,
  RotateCcw,
  Search,
  Send,
  X,
} from "lucide-react";
import { Skeleton, StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useMyTasks } from "@/lib/hooks/use-contributor-tasks";
import {
  ContributorApiError,
  type ContributorTaskSummary,
} from "@/lib/api/contributor-tasks";
import {
  deriveContributorStatus,
  statusPriority,
} from "@/components/contributor/task-status-badge";
import { TaskAcceptDeclineModal } from "@/components/contributor/task-accept-decline-modal";
import {
  ASSIGNED_BUCKET_LABEL,
  ASSIGNED_BUCKET_ORDER,
  assignedBucketOf,
  countWorkLanes,
  deadlineMs,
  fmtPayout,
  isAssignedLaneTask,
  isRevisionLaneTask,
  rowMeta,
  statusChipForLabel,
  type AssignedBucketKey,
} from "@/app/contributor/tasks/lib/task-list-utils";
import { cn } from "@/lib/utils/cn";

const PREVIEW_PER_GROUP = 5;
const ROWS_PER_PAGE = 10;

const VIEW_TABS: Array<{ key: AssignedBucketKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "ready", label: "Ready" },
  { key: "in_progress", label: "In progress" },
];

const VALID_VIEWS = new Set<AssignedBucketKey>(["all", "ready", "in_progress"]);

const STATUS_LABEL: Record<string, string> = {
  assigned: "New — accept to start",
  in_progress: "In progress",
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  feedback_requested: "Revision",
  resubmitted: "Resubmitted",
};

function sortTasks(items: ContributorTaskSummary[]): ContributorTaskSummary[] {
  return [...items].sort((a, b) => {
    const aPrio = statusPriority(deriveContributorStatus(a.status, a.latestSubmission?.status));
    const bPrio = statusPriority(deriveContributorStatus(b.status, b.latestSubmission?.status));
    if (aPrio !== bPrio) return aPrio - bPrio;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function groupTasks(items: ContributorTaskSummary[]) {
  const buckets = new Map<Exclude<AssignedBucketKey, "all">, ContributorTaskSummary[]>();
  for (const key of ASSIGNED_BUCKET_ORDER) buckets.set(key, []);
  for (const t of sortTasks(items)) {
    buckets.get(assignedBucketOf(t))?.push(t);
  }
  return ASSIGNED_BUCKET_ORDER.map((key) => ({
    key,
    label: ASSIGNED_BUCKET_LABEL[key],
    rows: buckets.get(key) ?? [],
  })).filter((g) => g.rows.length > 0);
}

export function AssignedTasksWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawView = searchParams.get("view");
  const activeView: AssignedBucketKey =
    rawView && VALID_VIEWS.has(rawView as AssignedBucketKey)
      ? (rawView as AssignedBucketKey)
      : "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [searchDraft, setSearchDraft] = React.useState(search);
  const [modal, setModal] = React.useState<{ taskId: string; mode: "accept" | "decline" } | null>(
    null,
  );

  React.useEffect(() => setSearchDraft(search), [search]);

  const { data, isLoading, error, refetch } = useMyTasks({ limit: 100 });
  const allItems = data?.items ?? [];
  const loading = isLoading && !data;

  const assignedItems = React.useMemo(
    // A revision is still assigned work that needs the contributor's action, so it
    // belongs in the Assigned list (with a "Revision" badge) — not just "Elsewhere".
    () => allItems.filter((t) => isAssignedLaneTask(t) || isRevisionLaneTask(t)),
    [allItems],
  );

  const laneCounts = React.useMemo(() => countWorkLanes(allItems), [allItems]);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (!("page" in changes)) next.delete("page");
      router.replace(`/contributor/tasks?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const counts = React.useMemo(() => {
    const c: Record<AssignedBucketKey, number> = {
      all: laneCounts.assigned,
      ready: laneCounts.ready,
      in_progress: laneCounts.inProgress,
    };
    return c;
  }, [laneCounts]);

  const overdueCount = React.useMemo(
    () =>
      assignedItems.filter((t) => {
        const dl = deadlineMs(t);
        return dl !== null && dl < Date.now();
      }).length,
    [assignedItems],
  );

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return assignedItems.filter((t) => {
      if (activeView !== "all" && assignedBucketOf(t) !== activeView) return false;
      if (needle) {
        const hay = [
          t.title,
          t.externalKey ?? "",
          t.sow?.tenantName ?? "",
          t.sow?.title ?? "",
          ...t.requiredSkills,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [assignedItems, activeView, search]);

  const sorted = React.useMemo(() => sortTasks(filtered), [filtered]);
  const showGrouped = activeView === "all" && !search.trim();
  const hasListFilters = activeView !== "all" || !!search.trim();
  const groups = showGrouped ? groupTasks(sorted) : null;

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = showGrouped
    ? sorted
    : sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const capacityPct = Math.min(100, Math.round((laneCounts.assigned / 5) * 100));

  const listTitle =
    activeView === "all"
      ? "Workload"
      : VIEW_TABS.find((t) => t.key === activeView)?.label ?? "Tasks";

  const listDescription =
    sorted.length === 0
      ? "No matches"
      : showGrouped
        ? `${sorted.length} task${sorted.length === 1 ? "" : "s"} · grouped by priority`
        : `${sorted.length} task${sorted.length === 1 ? "" : "s"} · priority order`;

  return (
    <div className="space-y-4 pb-12">
      {error ? (
        <ErrorPanel
          message={error instanceof ContributorApiError ? error.message : "Failed to load tasks"}
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {overdueCount > 0 && (
            <ContextBanner title={`${overdueCount} task${overdueCount === 1 ? "" : "s"} past submit-by`}>
              Submit-by dates come from the agreed estimate at assignment — not hours logged in the portal.
            </ContextBanner>
          )}

          {loading ? (
            <SummarySkeleton />
          ) : (
            <DashboardSection
              title="Assigned summary"
              description="Work that needs your action — review and in-progress tasks only"
            >
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
                <SummaryStat
                  label="Assigned"
                  value={String(laneCounts.assigned)}
                  highlight={laneCounts.assigned > 0}
                />
                <SummaryStat
                  label="Ready to start"
                  value={String(laneCounts.ready)}
                  highlight={laneCounts.ready > 0}
                />
                <SummaryStat
                  label="In progress"
                  value={String(laneCounts.inProgress)}
                  highlight={laneCounts.inProgress > 0}
                />
                <SummaryStat
                  label="Capacity"
                  value={`${capacityPct}%`}
                  highlight={capacityPct > 0}
                  alert={capacityPct > 90}
                />
              </dl>
              {laneCounts.submissions > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 border-t border-stroke-subtle">
                  <span className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
                    Elsewhere
                  </span>
                  <Link
                    href="/contributor/tasks/submissions"
                    className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-link hover:opacity-80"
                  >
                    <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                    {laneCounts.submissions} in review
                  </Link>
                </div>
              )}
            </DashboardSection>
          )}

          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
                <div className="min-w-0">
                  <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                    {listTitle}
                  </h2>
                  <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                    {loading ? "Loading…" : listDescription}
                    {!loading && overdueCount > 0 && (
                      <span className="text-warning-text font-medium">
                        {" · "}
                        {overdueCount} overdue
                      </span>
                    )}
                  </p>
                </div>

                <div className="relative w-full sm:w-52 shrink-0">
                  <Search
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={searchDraft}
                    onChange={(e) => {
                      setSearchDraft(e.target.value);
                      setParam({ q: e.target.value.trim() || null });
                    }}
                    placeholder="Search tasks…"
                    className={cn(
                      "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
                      "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                      "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                    )}
                  />
                  {searchDraft && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchDraft("");
                        setParam({ q: null });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>

              <nav aria-label="Filter by workload" className="flex flex-wrap gap-x-1 -mb-px">
                {VIEW_TABS.map((tab) => {
                  const active = activeView === tab.key;
                  const count = counts[tab.key];
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setParam({ view: tab.key === "all" ? null : tab.key })}
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
                          tab.key === "ready" && count > 0 && !active && "text-brand font-semibold",
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

            {loading ? (
              <ListSkeleton />
            ) : sorted.length === 0 ? (
              <EmptyPanel
                isEmptyQueue={assignedItems.length === 0}
                showClear={hasListFilters}
                onClear={() => {
                  setSearchDraft("");
                  setParam({ view: null, q: null, page: null });
                }}
              />
            ) : groups ? (
              <div className="divide-y divide-stroke-subtle">
                {groups.map((group) => (
                  <TaskGroup
                    key={group.key}
                    label={group.label}
                    rows={group.rows}
                    previewLimit={PREVIEW_PER_GROUP}
                    filterHref={`/contributor/tasks?view=${group.key}`}
                    onAccept={(id) => setModal({ taskId: id, mode: "accept" })}
                    onDecline={(id) => setModal({ taskId: id, mode: "decline" })}
                  />
                ))}
              </div>
            ) : (
              <>
                <ul className="divide-y divide-stroke-subtle">
                  {pageRows.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      onAccept={() => setModal({ taskId: t.id, mode: "accept" })}
                      onDecline={() => setModal({ taskId: t.id, mode: "decline" })}
                    />
                  ))}
                </ul>
                {totalPages > 1 && (
                  <footer className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-stroke-subtle">
                    <p className="font-body text-[11.5px] text-text-tertiary tabular-nums">
                      {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                      {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={pageIdx === 1}
                        onClick={() => setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })}
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
        </>
      )}

      {modal &&
        (() => {
          const t = allItems.find((x) => x.id === modal.taskId);
          return t ? (
            <TaskAcceptDeclineModal
              task={t}
              mode={modal.mode}
              open
              onClose={() => setModal(null)}
            />
          ) : null;
        })()}
    </div>
  );
}

function TaskGroup({
  label,
  rows,
  previewLimit,
  filterHref,
  onAccept,
  onDecline,
}: {
  label: string;
  rows: ContributorTaskSummary[];
  previewLimit: number;
  filterHref: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
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
        <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-link">
          View all
        </Link>
      </div>
      <ul role="list" className="divide-y divide-stroke-subtle">
        {preview.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            onAccept={() => onAccept(t.id)}
            onDecline={() => onDecline(t.id)}
          />
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

function TaskRow({
  task,
  onAccept,
  onDecline,
}: {
  task: ContributorTaskSummary;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const label = deriveContributorStatus(task.status, task.latestSubmission?.status);
  const meta = rowMeta(task);
  const needsAccept = task.status === "matched" && !task.acceptedAt;
  const price = fmtPayout(task);
  const workroomHref = `/contributor/tasks/${task.id}`;

  const rowTint =
    meta.overdue
      ? "bg-error-subtle/10 hover:bg-error-subtle/20"
      : task.status === "blocked"
        ? "bg-warning-subtle/5 hover:bg-warning-subtle/10"
        : "hover:bg-bg-subtle/60";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-3 min-h-[52px]",
        "transition-colors duration-fast",
        rowTint,
      )}
    >
        <Link
          href={workroomHref}
          className={cn(
            "min-w-0 flex-1",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus rounded-sm",
          )}
        >
          <span className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-body text-[13px] font-medium text-foreground truncate">
              {task.title}
            </span>
            {task.externalKey && (
              <span className="font-mono text-[10px] text-text-tertiary tabular-nums shrink-0">
                {task.externalKey}
              </span>
            )}
          </span>
          <span
            className={cn(
              "mt-0.5 block font-body text-[11px] truncate",
              meta.overdue ? "text-warning-text font-medium" : "text-text-tertiary",
            )}
          >
            {meta.text}
            {needsAccept && " · Review pricing, then accept"}
          </span>
          {needsAccept && price && (
            <span className="mt-1 block font-body text-[11.5px] font-medium text-foreground">
              Estimated payout: {price}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          {needsAccept && (
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                type="button"
                onClick={onAccept}
                className="h-7 px-2.5 rounded-md bg-brand text-on-brand font-body text-[11px] font-semibold hover:bg-brand-hover"
              >
                Accept &amp; start
              </button>
              <button
                type="button"
                onClick={onDecline}
                className="h-7 px-2.5 rounded-md border border-stroke font-body text-[11px] font-semibold text-text-secondary hover:text-error-text"
              >
                Decline
              </button>
            </div>
          )}
          <StatusChip status={statusChipForLabel(label)} size="sm">
            {STATUS_LABEL[label] ?? label}
          </StatusChip>
        </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  alert,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          alert ? "text-error-text" : highlight ? "text-brand" : "text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ContextBanner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-warning-border/40 bg-warning-subtle/30 px-4 py-3">
      <p className="font-body text-[12.5px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function ListSkeleton() {
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

function SummarySkeleton() {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

function EmptyPanel({
  isEmptyQueue,
  showClear,
  onClear,
}: {
  isEmptyQueue: boolean;
  showClear: boolean;
  onClear: () => void;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <ClipboardList className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      {isEmptyQueue ? (
        <>
          <p className="font-body text-[13px] font-semibold text-foreground">No tasks assigned yet</p>
          <p className="mt-1 font-body text-[12px] text-text-tertiary">
            When a project lead assigns you to a task, it will appear here.
          </p>
        </>
      ) : (
        <>
          <p className="font-body text-[13px] font-semibold text-foreground">No matches</p>
          {showClear && (
            <button
              type="button"
              onClick={onClear}
              className="mt-2 font-body text-[12.5px] font-semibold text-brand"
            >
              Clear filters
            </button>
          )}
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
        className="inline-flex items-center gap-1 h-7 px-2 rounded-md border border-stroke bg-surface font-body text-[11px] font-semibold"
      >
        <RotateCcw className="h-3 w-3" aria-hidden />
        Retry
      </button>
    </div>
  );
}
