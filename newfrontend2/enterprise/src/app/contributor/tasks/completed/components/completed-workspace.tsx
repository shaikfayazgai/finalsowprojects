"use client";

/**
 * Completed workspace — enterprise list pattern (matches Submissions / Revisions).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Award, Search, X } from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { Skeleton, StatusChip } from "@/components/meridian";
import { useCompletedTasks } from "@/lib/hooks/use-contributor-tasks";
import type { CompletedRow } from "@/lib/api/contributor-mock";
import { cn } from "@/lib/utils/cn";
import {
  fmtAcceptedDate,
  fmtINR,
  fmtRelative,
  payoutStatusChip,
  payoutStatusLabel,
} from "../lib/completed-ui-utils";

const ROWS_PER_PAGE = 15;

export function CompletedWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [searchDraft, setSearchDraft] = React.useState(search);
  React.useEffect(() => setSearchDraft(search), [search]);

  const { data, isLoading, error, refetch } = useCompletedTasks();
  const list = data?.items ?? [];
  const totalEarnedMinor = data?.totalEarnedMinor ?? 0;
  const loading = isLoading && list.length === 0;

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (!("page" in changes)) next.delete("page");
      router.replace(`/contributor/tasks/completed?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const stats = React.useMemo(() => {
    let paid = 0;
    let pending = 0;
    let withCredential = 0;
    for (const r of list) {
      if (r.payoutStatus === "paid") paid++;
      else pending++;
      if (r.credentialId) withCredential++;
    }
    return {
      total: list.length,
      totalEarnedMinor,
      paid,
      pending,
      withCredential,
    };
  }, [list, totalEarnedMinor]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((r) => {
      const hay = [
        r.task.title,
        r.task.externalKey ?? "",
        r.task.sow?.tenantName ?? "",
        r.task.sow?.title ?? "",
        r.task.mentor?.name ?? "",
        payoutStatusLabel(r.payoutStatus),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [list, search]);

  const sorted = React.useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const aT = a.task.decidedAt ? new Date(a.task.decidedAt).getTime() : 0;
        const bT = b.task.decidedAt ? new Date(b.task.decidedAt).getTime() : 0;
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
        : "No completed tasks yet"
      : `${sorted.length} accepted · newest first`;

  return (
    <div className="space-y-4 pb-12">
      {error ? (
        <ErrorPanel message={(error as Error).message} onRetry={() => refetch()} />
      ) : (
        <>
          {loading ? (
            <SummarySkeleton />
          ) : (
            <DashboardSection
              title="Earnings summary"
              description="Accepted work and payout status across your portfolio"
            >
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
                <SummaryStat
                  label="Accepted"
                  value={String(stats.total)}
                  highlight={stats.total > 0}
                />
                <SummaryStat
                  label="Total earned"
                  value={fmtINR(stats.totalEarnedMinor)}
                  highlight={stats.totalEarnedMinor > 0}
                />
                <SummaryStat
                  label="Paid out"
                  value={String(stats.paid)}
                  highlight={stats.paid > 0}
                />
                <SummaryStat
                  label="Credentials"
                  value={String(stats.withCredential)}
                  highlight={stats.withCredential > 0}
                />
              </dl>
              {stats.pending > 0 && (
                <p className="mt-4 pt-4 border-t border-stroke-subtle font-body text-[11.5px] text-text-secondary">
                  {stats.pending} task{stats.pending === 1 ? "" : "s"} with payout still processing
                  or eligible — amounts appear once transfer completes.
                </p>
              )}
            </DashboardSection>
          )}

          <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-stroke-subtle">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                    Accepted tasks
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
                    aria-label="Search completed tasks"
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
                    <CompletedRow key={r.task.id} row={r} />
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

function CompletedRow({ row }: { row: CompletedRow }) {
  const href = `/contributor/tasks/completed/${row.task.id}`;
  const acceptedAt = row.task.decidedAt;

  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-3 min-h-[60px]",
          "transition-colors duration-fast hover:bg-bg-subtle/60",
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
            {row.credentialId && (
              <span
                className="inline-flex items-center gap-0.5 text-brand shrink-0"
                title="Credential issued"
                aria-label="Credential issued"
              >
                <Award className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </span>
            )}
          </span>
          <span className="mt-0.5 block font-body text-[11px] text-text-tertiary truncate">
            {row.task.sow?.tenantName ?? "—"}
            {row.task.mentor?.name && (
              <>
                {" · "}
                {row.task.mentor.name}
              </>
            )}
            {acceptedAt && (
              <>
                {" · Accepted "}
                {fmtRelative(acceptedAt)}
              </>
            )}
            {" · "}
            <span className="font-medium text-foreground tabular-nums">
              {fmtINR(row.payoutMinor)}
            </span>
          </span>
        </span>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden sm:block font-mono text-[11px] text-text-tertiary tabular-nums">
            {fmtAcceptedDate(acceptedAt)}
          </span>
          <StatusChip status={payoutStatusChip(row.payoutStatus)} size="sm">
            {payoutStatusLabel(row.payoutStatus)}
          </StatusChip>
        </div>
      </Link>
    </li>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="font-body text-[13px] font-semibold text-foreground">No matching tasks</p>
        <p className="mt-1 font-body text-[12px] text-text-tertiary">
          Try a different task title or project name.
        </p>
      </div>
    );
  }
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-body text-[13px] font-semibold text-foreground">No completed tasks yet</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
        Once a mentor accepts your work, it appears here with payout and credential status.
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
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-[-0.02em]",
          highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
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
