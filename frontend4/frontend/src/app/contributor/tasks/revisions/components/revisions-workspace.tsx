"use client";

/**
 * Revisions workspace — enterprise list pattern (matches Submissions / Assigned).
 * Summary → single panel → search → scannable rows.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Search, X } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { Skeleton, StatusChip } from "@/components/meridian";
import { useRevisionsQueue } from "@/lib/hooks/use-contributor-tasks";
import type { RevisionRow } from "@/lib/api/contributor-mock";
import { cn } from "@/lib/utils/cn";
import {
  fmtRelative,
  fmtRevisionDue,
  revisionStatusChip,
  revisionStatusLabel,
} from "../lib/revision-ui-utils";

const ROWS_PER_PAGE = 15;

export function RevisionsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [searchDraft, setSearchDraft] = React.useState(search);
  React.useEffect(() => setSearchDraft(search), [search]);

  const { data: rows, isLoading, error, refetch } = useRevisionsQueue();
  const list = rows ?? [];
  const loading = isLoading && list.length === 0;

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (!("page" in changes)) next.delete("page");
      router.replace(`/contributor/tasks/revisions?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const stats = React.useMemo(() => {
    let ready = 0;
    let addressing = 0;
    let overdue = 0;
    for (const r of list) {
      if (r.readyToResubmit) ready++;
      else addressing++;
      if (fmtRevisionDue(r.task.dueAt).overdue) overdue++;
    }
    return { total: list.length, ready, addressing, overdue };
  }, [list]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((r) => {
      const hay = [
        r.task.title,
        r.task.externalKey ?? "",
        r.submission.reviewerName ?? "",
        r.task.mentor?.name ?? "",
        r.task.sow?.tenantName ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [list, search]);

  const sorted = React.useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (a.readyToResubmit !== b.readyToResubmit) {
          return a.readyToResubmit ? -1 : 1;
        }
        const aDue = fmtRevisionDue(a.task.dueAt);
        const bDue = fmtRevisionDue(b.task.dueAt);
        if (aDue.overdue !== bDue.overdue) return aDue.overdue ? -1 : 1;
        if (aDue.warn !== bDue.warn) return aDue.warn ? -1 : 1;
        const aPct =
          a.correctionsTotal > 0 ? a.correctionsAddressed / a.correctionsTotal : 0;
        const bPct =
          b.correctionsTotal > 0 ? b.correctionsAddressed / b.correctionsTotal : 0;
        return bPct - aPct;
      }),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const listDescription =
    sorted.length === 0
      ? search.trim()
        ? "No matches"
        : "No open revisions"
      : `${sorted.length} revision${sorted.length === 1 ? "" : "s"} · ready first, then resubmit-by urgency`;

  return (
    <div className="space-y-4 pb-12">
      {error ? (
        <ErrorPanel message={(error as Error).message} onRetry={() => refetch()} />
      ) : (
        <>
          {stats.overdue > 0 && (
            <ContextBanner
              title={`${stats.overdue} revision${stats.overdue === 1 ? "" : "s"} past resubmit-by`}
            >
              Resubmit-by dates reflect the agreed estimate for this correction round — address
              mentor feedback and resubmit before the window closes.
            </ContextBanner>
          )}

          {loading ? (
            <SummarySkeleton />
          ) : (
            <DashboardSection
              title="Revision summary"
              description="Mentor feedback waiting on your corrections"
            >
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
                <SummaryStat
                  label="Open revisions"
                  value={String(stats.total)}
                  highlight={stats.total > 0}
                />
                <SummaryStat
                  label="Ready to resubmit"
                  value={String(stats.ready)}
                  highlight={stats.ready > 0}
                />
                <SummaryStat
                  label="Still addressing"
                  value={String(stats.addressing)}
                  highlight={stats.addressing > 0}
                  alert={stats.addressing > 0 && stats.ready === 0}
                />
                <SummaryStat
                  label="Past resubmit-by"
                  value={String(stats.overdue)}
                  highlight={stats.overdue > 0}
                  alert={stats.overdue > 0}
                />
              </dl>
            </DashboardSection>
          )}

          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-stroke-subtle">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                    Correction queue
                  </h2>
                  <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                    {loading ? "Loading…" : listDescription}
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
                    aria-label="Search revisions"
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
            </div>

            {loading ? (
              <div className="p-5 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <EmptyState hasSearch={!!search.trim()} />
            ) : (
              <>
                <ul role="list" className="divide-y divide-stroke-subtle">
                  {pageRows.map((r) => (
                    <RevisionRow key={r.task.id} row={r} />
                  ))}
                </ul>
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-t border-stroke-subtle bg-bg-subtle">
                    <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
                      {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                      {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setParam({ page: pageIdx > 2 ? String(pageIdx - 1) : null })}
                        disabled={pageIdx === 1}
                        className="h-7 px-2.5 rounded-md font-body text-[12px] font-semibold text-text-link hover:bg-surface disabled:text-text-disabled disabled:hover:bg-transparent"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setParam({
                            page: pageIdx < totalPages - 1 ? String(pageIdx + 1) : null,
                          })
                        }
                        disabled={pageIdx >= totalPages}
                        className="h-7 px-2.5 rounded-md font-body text-[12px] font-semibold text-text-link hover:bg-surface disabled:text-text-disabled disabled:hover:bg-transparent"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function RevisionRow({ row }: { row: RevisionRow }) {
  const due = fmtRevisionDue(row.task.dueAt);
  const mentor = row.submission.reviewerName ?? row.task.mentor?.name ?? "Mentor";
  const feedbackAt = row.submission.decidedAt ?? row.submission.submittedAt;
  const pct =
    row.correctionsTotal > 0
      ? Math.round((row.correctionsAddressed / row.correctionsTotal) * 100)
      : 0;
  const href = `/contributor/tasks/revisions/${row.task.id}`;

  const rowTint = row.readyToResubmit
    ? "bg-success-subtle/10 hover:bg-success-subtle/20"
    : due.overdue
      ? "bg-error-subtle/10 hover:bg-error-subtle/20"
      : due.warn
        ? "bg-warning-subtle/5 hover:bg-warning-subtle/10"
        : "hover:bg-bg-subtle/60";

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-3 min-h-[60px]",
          "transition-colors duration-fast",
          rowTint,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-body text-[13px] font-medium text-foreground truncate">
              {row.task.title}
            </span>
            {row.task.externalKey && (
              <span className="font-mono text-[10px] text-text-tertiary tabular-nums shrink-0">
                {row.task.externalKey}
              </span>
            )}
            <span className="font-mono text-[10px] text-text-tertiary tabular-nums shrink-0">
              R{row.task.round}/{row.task.totalRounds}
            </span>
          </span>
          <span
            className={cn(
              "mt-0.5 block font-body text-[11px] truncate",
              due.overdue
                ? "text-error-text font-medium"
                : due.warn
                  ? "text-warning-text"
                  : "text-text-tertiary",
            )}
          >
            {mentor}
            {feedbackAt && (
              <>
                {" · Feedback "}
                {fmtRelative(feedbackAt)}
              </>
            )}
            {" · "}
            {due.text}
            {row.correctionsTotal > 0 && (
              <>
                {" · "}
                {row.correctionsAddressed}/{row.correctionsTotal} corrections
              </>
            )}
          </span>
          {row.correctionsTotal > 0 && (
            <span className="mt-1.5 flex items-center gap-2 max-w-xs">
              <span className="flex-1 h-1.5 rounded-full bg-bg-subtle overflow-hidden">
                <span
                  className={cn(
                    "block h-full rounded-full transition-all duration-fast",
                    row.readyToResubmit ? "bg-success-text" : "bg-brand",
                  )}
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              </span>
              <span className="font-mono text-[10px] text-text-tertiary tabular-nums shrink-0">
                {pct}%
              </span>
            </span>
          )}
        </span>

        <StatusChip status={revisionStatusChip(row.readyToResubmit)} size="sm">
          {revisionStatusLabel(row.readyToResubmit)}
        </StatusChip>
      </Link>
    </li>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="font-body text-[13px] font-semibold text-foreground">No matching revisions</p>
        <p className="mt-1 font-body text-[12px] text-text-tertiary">
          Try a different task title or mentor name.
        </p>
      </div>
    );
  }
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-body text-[13px] font-semibold text-foreground">No open revisions</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
        When a mentor returns work with required corrections, it appears here. Accepted tasks move
        to Completed; work still under first review stays in Submissions.
      </p>
      <Link
        href="/contributor/tasks/submissions"
        className="mt-4 inline-flex h-8 items-center px-3 rounded-md border border-stroke bg-surface font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover"
      >
        View submissions
      </Link>
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
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-[-0.02em]",
          alert ? "text-error-text" : highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ContextBanner({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-lg border border-warning-border bg-warning-subtle/40 px-4 py-3">
      <AlertTriangle className="h-4 w-4 text-warning-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
      <div>
        <p className="font-body text-[12.5px] font-semibold text-warning-text">{title}</p>
        <p className="mt-0.5 font-body text-[12px] text-text-secondary">{children}</p>
      </div>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex flex-wrap items-center gap-3">
      <p className="font-body text-[12.5px] text-error-text flex-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="h-8 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover"
      >
        Retry
      </button>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
      <Skeleton className="h-4 w-32 rounded mb-4" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    </div>
  );
}
