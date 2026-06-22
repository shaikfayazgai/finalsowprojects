"use client";

/**
 * Earnings workspace — enterprise overview (matches Completed / Submissions pattern).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CreditCard,
  Download,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { Skeleton, StatusChip } from "@/components/meridian";
import { useMyPayoutMethods, useMyPayouts } from "@/lib/hooks/use-contributor-payouts";
import { earningsSummaryFromPayouts } from "@/lib/enterprise/mocks/demo-payout-bridge";
import type { PayoutDetail } from "@/lib/payouts/types";
import { cn } from "@/lib/utils/cn";
import { EarningsOverviewSkeleton } from "./overview-skeleton";
import {
  fmtINR,
  isAttentionStatus,
  MIN_WITHDRAWAL_MINOR,
  payoutActivityDate,
  payoutMetaLine,
  payoutStatusChip,
  payoutStatusLabel,
  payoutTaskTitle,
} from "../lib/earnings-ui-utils";

const ROWS_PER_PAGE = 12;

export function EarningsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const [searchDraft, setSearchDraft] = React.useState(search);
  React.useEffect(() => setSearchDraft(search), [search]);

  const { data: payoutsData, isLoading: payoutsLoading, error: payoutsError, refetch } =
    useMyPayouts();
  const { data: methodsData, isLoading: methodsLoading } = useMyPayoutMethods();

  const items = payoutsData?.items ?? [];
  const methods = methodsData?.items ?? [];
  const summary = React.useMemo(() => earningsSummaryFromPayouts(items), [items]);
  const loading = (payoutsLoading || methodsLoading) && items.length === 0;

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (!("page" in changes)) next.delete("page");
      router.replace(`/contributor/earnings?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const weekAgo = Date.now() - 7 * 86_400_000;
  const monthAgo = Date.now() - 30 * 86_400_000;

  const stats = React.useMemo(() => {
    const thisWeekMinor = items
      .filter((p) => p.status === "sent" && p.sentAt && new Date(p.sentAt).getTime() >= weekAgo)
      .reduce((s, p) => s + p.amountMinor, 0);
    const thisMonthMinor = items
      .filter((p) => p.status === "sent" && p.sentAt && new Date(p.sentAt).getTime() >= monthAgo)
      .reduce((s, p) => s + p.amountMinor, 0);
    const eligibleCount = items.filter((p) => p.status === "eligible" || p.status === "failed").length;
    const inTransitCount = items.filter(
      (p) => p.status === "requested" || p.status === "processing" || p.status === "on_hold",
    ).length;
    const attentionCount = items.filter((p) => isAttentionStatus(p.status)).length;

    return {
      withdrawableMinor: summary.withdrawableMinor,
      pendingMinor: summary.pendingMinor,
      paidMinor: summary.paidMinor,
      thisWeekMinor,
      thisMonthMinor,
      eligibleCount,
      inTransitCount,
      attentionCount,
      total: items.length,
    };
  }, [items, summary, weekAgo, monthAgo]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((p) => {
      const hay = [
        payoutTaskTitle(p),
        p.taskDefinitionId,
        p.externalRef ?? "",
        payoutStatusLabel(p.status),
        p.failureReason ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [items, search]);

  const sorted = React.useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const aT = payoutActivityDate(a) ? new Date(payoutActivityDate(a)!).getTime() : 0;
        const bT = payoutActivityDate(b) ? new Date(payoutActivityDate(b)!).getTime() : 0;
        return bT - aT;
      }),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const hasMethod = methods.length > 0;
  const defaultMethod = methods.find((m) => m.isDefault) ?? methods[0];
  const methodLabel = defaultMethod?.nickname ?? "No payout method";
  const methodVerified = !!defaultMethod?.verifiedAt;
  const canWithdraw = hasMethod && stats.withdrawableMinor >= MIN_WITHDRAWAL_MINOR;

  const listDescription =
    sorted.length === 0
      ? search.trim()
        ? "No matches"
        : "No payout activity yet"
      : `${sorted.length} payout${sorted.length === 1 ? "" : "s"} · newest first`;

  if (loading) {
    if (payoutsError) {
      return (
        <div className="space-y-4 pb-12">
          <ErrorPanel message={(payoutsError as Error).message} onRetry={() => void refetch()} />
        </div>
      );
    }
    return <EarningsOverviewSkeleton />;
  }

  return (
    <div className="space-y-4 pb-12">
      {payoutsError ? (
        <ErrorPanel message={(payoutsError as Error).message} onRetry={() => void refetch()} />
      ) : null}

      <DashboardSection
        title="Balance overview"
        description="Withdraw when enterprise releases milestone pay to your account"
        actions={
          <Link
            href="/contributor/earnings/export"
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-md",
              "bg-surface border border-stroke shadow-xs",
              "font-body text-[12px] font-semibold text-foreground",
              "hover:bg-surface-hover transition-colors duration-fast",
            )}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Export
          </Link>
        }
      >
        <div className="flex flex-wrap items-end justify-between gap-5 pb-6 mb-6 border-b border-stroke-subtle">
          <div className="min-w-0">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
              Withdrawable balance
            </p>
            <p className="mt-1.5 font-display text-[34px] sm:text-[38px] font-semibold text-foreground tracking-[-0.025em] leading-none tabular-nums">
              {fmtINR(stats.withdrawableMinor)}
            </p>
            {!hasMethod ? (
              <p className="mt-2.5 inline-flex items-center gap-1.5 font-body text-[12px] text-warning-text">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                Add a payout method to enable withdrawal.
              </p>
            ) : hasMethod && stats.withdrawableMinor > 0 && stats.withdrawableMinor < MIN_WITHDRAWAL_MINOR ? (
              <p className="mt-2.5 font-body text-[12px] text-text-secondary">
                Minimum {fmtINR(MIN_WITHDRAWAL_MINOR)} required to withdraw.
              </p>
            ) : stats.withdrawableMinor === 0 && stats.eligibleCount === 0 ? (
              <p className="mt-2.5 font-body text-[12px] text-text-secondary">
                Payouts appear here after enterprise releases milestone pay.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col items-stretch sm:items-end gap-2.5 w-full sm:w-auto">
            {!hasMethod ? (
              <Link
                href="/contributor/earnings/payout-method/new"
                className={cn(
                  "inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md shadow-xs",
                  "bg-brand text-on-brand font-body text-[13px] font-semibold",
                  "hover:bg-brand-hover transition-colors duration-fast",
                )}
              >
                <CreditCard className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                Set up payout method
              </Link>
            ) : (
              <Link
                href={canWithdraw ? "/contributor/earnings/withdraw" : "#"}
                aria-disabled={!canWithdraw}
                className={cn(
                  "inline-flex items-center justify-center h-9 px-4 rounded-md shadow-xs",
                  "font-body text-[13px] font-semibold transition-colors duration-fast",
                  canWithdraw
                    ? "bg-brand text-on-brand hover:bg-brand-hover"
                    : "bg-bg-subtle text-text-disabled cursor-not-allowed pointer-events-none",
                )}
              >
                Withdraw funds
              </Link>
            )}

            <Link
              href="/contributor/earnings/payout-method"
              className="inline-flex items-center justify-center sm:justify-end gap-1.5 font-body text-[11.5px] font-semibold text-text-link hover:underline"
            >
              {methodVerified ? (
                <ShieldCheck className="h-3.5 w-3.5 text-success-text shrink-0" strokeWidth={2} aria-hidden />
              ) : (
                <CreditCard className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              )}
              {methodLabel}
              <ArrowRight className="h-3 w-3" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat
            label="This week"
            value={fmtINR(stats.thisWeekMinor)}
            highlight={stats.thisWeekMinor > 0}
          />
          <SummaryStat
            label="This month"
            value={fmtINR(stats.thisMonthMinor)}
            highlight={stats.thisMonthMinor > 0}
          />
          <SummaryStat
            label="All time paid"
            value={fmtINR(stats.paidMinor)}
            highlight={stats.paidMinor > 0}
          />
          <SummaryStat
            label="In transit"
            value={fmtINR(stats.pendingMinor)}
            highlight={stats.pendingMinor > 0}
          />
        </dl>

        {(stats.eligibleCount > 0 || stats.attentionCount > 0) && (
          <p className="mt-4 pt-4 border-t border-stroke-subtle font-body text-[11.5px] text-text-secondary">
            {stats.eligibleCount > 0 && (
              <>
                {stats.eligibleCount} payout{stats.eligibleCount === 1 ? "" : "s"} ready to withdraw
              </>
            )}
            {stats.eligibleCount > 0 && stats.attentionCount > 0 && " · "}
            {stats.attentionCount > 0 && (
              <>
                {stats.attentionCount} need{stats.attentionCount === 1 ? "s" : ""} attention
                {stats.attentionCount === 1 ? "" : ""}
              </>
            )}
          </p>
        )}
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                  Payout activity
                </h2>
                <Link
                  href="/contributor/earnings/history"
                  className="inline-flex items-center gap-0.5 font-body text-[11.5px] font-semibold text-text-link hover:underline"
                >
                  Full history
                  <ArrowRight className="h-3 w-3" strokeWidth={2} aria-hidden />
                </Link>
              </div>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">{listDescription}</p>
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
                placeholder="Search payouts…"
                aria-label="Search payout activity"
                className={cn(
                  "w-full h-8 pl-8 pr-8 rounded-md border border-stroke bg-surface",
                  "font-body text-[12.5px] text-foreground placeholder:text-text-disabled",
                  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                )}
              />
              {searchDraft ? (
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
              ) : null}
            </div>
          </div>
        </div>

        {sorted.length === 0 ? (
          <EmptyState hasSearch={!!search.trim()} />
        ) : (
          <>
            <ul role="list" className="divide-y divide-stroke-subtle">
              {pageRows.map((p) => (
                <PayoutRow key={p.id} payout={p} />
              ))}
            </ul>
            {totalPages > 1 ? (
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
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}

function PayoutRow({ payout }: { payout: PayoutDetail }) {
  const attention = isAttentionStatus(payout.status);
  const amountTone =
    payout.status === "sent"
      ? "text-success-text"
      : payout.status === "failed"
        ? "text-error-text"
        : "text-foreground";

  return (
    <li>
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-5 py-3 min-h-[60px]",
          attention && "bg-warning-subtle/30",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="font-body text-[13px] font-medium text-foreground truncate block">
            {payoutTaskTitle(payout)}
          </span>
          <span className="mt-0.5 block font-body text-[11px] text-text-tertiary truncate">
            {payoutMetaLine(payout)}
          </span>
        </span>

        <div className="flex items-center gap-2.5 shrink-0">
          <span
            className={cn(
              "font-mono text-[12px] font-semibold tabular-nums",
              amountTone,
            )}
          >
            {fmtINR(payout.amountMinor)}
          </span>
          <StatusChip status={payoutStatusChip(payout.status)} size="sm">
            {payoutStatusLabel(payout.status)}
          </StatusChip>
        </div>
      </div>
    </li>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="font-body text-[13px] font-semibold text-foreground">No matching payouts</p>
        <p className="mt-1 font-body text-[12px] text-text-tertiary">
          Try a task title, reference, or status.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-12 text-center">
      <p className="font-body text-[13px] font-semibold text-foreground">No payout activity yet</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-md mx-auto">
        Once enterprise releases milestone pay for accepted work, payouts appear here with
        withdraw and transfer status.
      </p>
      <Link
        href="/contributor/tasks/completed"
        className="mt-4 inline-flex h-8 items-center px-3 rounded-md bg-brand text-on-brand font-body text-[12px] font-semibold hover:bg-brand-hover"
      >
        View completed work
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
      <AlertCircle className="h-4 w-4 text-error-text shrink-0" strokeWidth={2} aria-hidden />
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
