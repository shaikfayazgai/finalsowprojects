"use client";

/**
 * Submissions workspace — enterprise list pattern (matches Assigned).
 * This page IS the mentor-review queue; every row is submitted / under_review /
 * resubmitted. No redundant "Under review vs All" tabs — those showed the same data.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Search, X } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { Skeleton, StatusChip } from "@/components/meridian";
import { useSubmissionLane } from "@/lib/hooks/use-contributor-tasks";
import { ContributorApiError } from "@/lib/api/contributor-tasks";
import { fmtMentorReviewWindow } from "@/app/contributor/tasks/lib/task-list-utils";
import type { SubmissionSummary } from "@/lib/submissions/types";
import { cn } from "@/lib/utils/cn";
import {
  fmtRelative,
  isActiveReviewStatus,
  reviewerLabel,
  submissionStatusChip,
  submissionStatusLabel,
} from "../lib/submission-ui-utils";

const ROWS_PER_PAGE = 15;

export function SubmissionsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [searchDraft, setSearchDraft] = React.useState(search);
  React.useEffect(() => setSearchDraft(search), [search]);

  const { data: items = [], isLoading, error, refetch } = useSubmissionLane();
  const loading = isLoading && items.length === 0;

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      // Drop legacy tab param — tabs were removed (both views were identical).
      next.delete("tab");
      if (!("page" in changes)) next.delete("page");
      router.replace(`/contributor/tasks/submissions?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const stats = React.useMemo(() => {
    let awaitingPickUp = 0;
    let awaitingMentor = 0;
    let reviewWindowTight = 0;
    for (const s of items) {
      if (s.status === "submitted") awaitingPickUp++;
      if (!s.reviewerId && !s.reviewerName) awaitingMentor++;
      const sla = fmtMentorReviewWindow(s.submittedAt, s.status);
      if (isActiveReviewStatus(s.status) && (sla.overdue || sla.warn)) reviewWindowTight++;
    }
    return { total: items.length, awaitingPickUp, awaitingMentor, reviewWindowTight };
  }, [items]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((s) => {
      const hay = [
        s.taskTitle,
        s.reviewerName ?? "",
        s.reviewerId ?? "",
        submissionStatusLabel(s.status),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [items, search]);

  const sorted = React.useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const aSla = fmtMentorReviewWindow(a.submittedAt, a.status);
        const bSla = fmtMentorReviewWindow(b.submittedAt, b.status);
        if (aSla.overdue !== bSla.overdue) return aSla.overdue ? -1 : 1;
        if (aSla.warn !== bSla.warn) return aSla.warn ? -1 : 1;
        const aT = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const bT = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return bT - aT;
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
        : "Nothing in the mentor review queue"
      : `${sorted.length} in queue · sorted by review window urgency`;

  return (
    <div className="space-y-4 pb-12">
      {error ? (
        <ErrorPanel
          message={error instanceof ContributorApiError ? error.message : "Failed to load submissions"}
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {stats.reviewWindowTight > 0 && (
            <ContextBanner
              title={`${stats.reviewWindowTight} submission${stats.reviewWindowTight === 1 ? "" : "s"} in a tight review window`}
            >
              Mentors aim to respond within the review window shown on each row. Escalation paths
              open if the window passes without a decision.
            </ContextBanner>
          )}

          {loading ? (
            <SummarySkeleton />
          ) : (
            <DashboardSection
              title="Review queue"
              description="Work handed off — waiting on mentor decision"
            >
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
                <SummaryStat
                  label="In queue"
                  value={String(stats.total)}
                  highlight={stats.total > 0}
                />
                <SummaryStat
                  label="Awaiting pick-up"
                  value={String(stats.awaitingPickUp)}
                  highlight={stats.awaitingPickUp > 0}
                />
                <SummaryStat
                  label="Awaiting mentor"
                  value={String(stats.awaitingMentor)}
                  highlight={stats.awaitingMentor > 0}
                  alert={stats.awaitingMentor > 0}
                />
                <SummaryStat
                  label="Tight window"
                  value={String(stats.reviewWindowTight)}
                  highlight={stats.reviewWindowTight > 0}
                  alert={stats.reviewWindowTight > 0}
                />
              </dl>
            </DashboardSection>
          )}

          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-stroke-subtle">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                    Mentor review queue
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
                    aria-label="Search submissions"
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
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-md" />
                ))}
              </div>
            ) : sorted.length === 0 ? (
              <EmptyState hasSearch={!!search.trim()} />
            ) : (
              <>
                <ul role="list" className="divide-y divide-stroke-subtle">
                  {pageRows.map((s) => (
                    <SubmissionRow key={s.id} sub={s} />
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

function SubmissionRow({ sub }: { sub: SubmissionSummary }) {
  const sla = fmtMentorReviewWindow(sub.submittedAt, sub.status);
  const mentor = reviewerLabel(sub.reviewerName, sub.reviewerId);
  const href = `/contributor/tasks/submissions/${sub.id}`;

  const rowTint =
    sla.overdue && isActiveReviewStatus(sub.status)
      ? "bg-error-subtle/10 hover:bg-error-subtle/20"
      : sla.warn && isActiveReviewStatus(sub.status)
        ? "bg-warning-subtle/5 hover:bg-warning-subtle/10"
        : "hover:bg-bg-subtle/60";

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-3 min-h-[56px]",
          "transition-colors duration-fast",
          rowTint,
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="font-body text-[13px] font-medium text-foreground truncate">
              {sub.taskTitle}
            </span>
            <span className="font-mono text-[10px] text-text-tertiary tabular-nums shrink-0">
              v{sub.version}
            </span>
          </span>
          <span
            className={cn(
              "mt-0.5 block font-body text-[11px] truncate",
              sla.overdue && isActiveReviewStatus(sub.status)
                ? "text-error-text font-medium"
                : sla.warn && isActiveReviewStatus(sub.status)
                  ? "text-warning-text"
                  : "text-text-tertiary",
            )}
          >
            {mentor}
            {sub.submittedAt && (
              <>
                {" · Submitted "}
                {fmtRelative(sub.submittedAt)}
              </>
            )}
            {isActiveReviewStatus(sub.status) && (
              <>
                {" · "}
                {sla.text}
              </>
            )}
            {sub.artifactCount > 0 && (
              <>
                {" · "}
                {sub.artifactCount} file{sub.artifactCount === 1 ? "" : "s"}
              </>
            )}
          </span>
        </span>

        <StatusChip status={submissionStatusChip(sub.status)} size="sm">
          {submissionStatusLabel(sub.status)}
        </StatusChip>
      </Link>
    </li>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="font-body text-[13px] font-semibold text-foreground">No matching submissions</p>
        <p className="mt-1 font-body text-[12px] text-text-tertiary">
          Try a different task title or mentor name.
        </p>
      </div>
    );
  }
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-body text-[13px] font-semibold text-foreground">Nothing in the review queue</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
        When you submit work from a task workroom, it appears here while the mentor reviews it.
        Accepted work moves to Completed; revision requests move to Revisions.
      </p>
      <Link
        href="/contributor/tasks"
        className="mt-4 inline-flex h-8 items-center px-3 rounded-md bg-brand text-on-brand font-body text-[12px] font-semibold hover:bg-brand-hover"
      >
        Go to assigned tasks
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
