"use client";

/**
 * Payouts ledger workspace — registry pattern.
 *   KPI strip (Eligible / In flight / Paid-30d / Reversed)
 *   → eligible alert → DASH_CARD { gradient-pill tabs + solid search + table + pagination }
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  ChevronRight,
  Download,
  Search,
  Send,
  X,
} from "lucide-react";
import {
  useTenantPayouts,
  useDownloadBillingCsv,
  useReleasePendingBatch,
} from "@/lib/hooks/use-enterprise-billing";
import { BillingApiError } from "@/lib/api/enterprise-billing";
import type { PayoutDetail } from "@/lib/payouts/types";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  Chip,
  StatCard,
  AdminModal,
  type Tone,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
} from "@/app/admin/_shell/aurora-ui";

const ROWS_PER_PAGE = 12;

type FilterKey = "all" | "eligible" | "pending" | "paid" | "reversed";

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "eligible", label: "Eligible" },
  { key: "pending", label: "In flight" },
  { key: "paid", label: "Paid" },
  { key: "reversed", label: "Reversed" },
];

function fmtINRMinor(minor: number, currency: string): string {
  const symbol =
    currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatContributor(id: string): string {
  const slug = id.replace(/^u-/, "");
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function statusBucket(p: PayoutDetail): Exclude<FilterKey, "all"> {
  switch (p.status) {
    case "eligible":
      return "eligible";
    case "requested":
    case "processing":
    case "on_hold":
      return "pending";
    case "sent":
      return "paid";
    case "failed":
      return "reversed";
  }
}

function bucketLabel(bucket: Exclude<FilterKey, "all">): string {
  switch (bucket) {
    case "eligible":
      return "Eligible";
    case "pending":
      return "In flight";
    case "paid":
      return "Paid";
    case "reversed":
      return "Reversed";
  }
}

function bucketTone(bucket: Exclude<FilterKey, "all">): Tone {
  switch (bucket) {
    case "eligible":
      return "ai";
    case "pending":
      return "warning";
    case "paid":
      return "success";
    case "reversed":
      return "error";
    default:
      return "neutral";
  }
}

function sortPayouts(items: PayoutDetail[]): PayoutDetail[] {
  const rank = (p: PayoutDetail) => {
    const b = statusBucket(p);
    if (b === "eligible") return 4;
    if (b === "pending") return 3;
    if (b === "reversed") return 2;
    return 1;
  };
  return [...items].sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(b) - rank(a);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export function PayoutsLedgerWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter: FilterKey =
    (searchParams.get("status") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const { data, isLoading, error } = useTenantPayouts({});
  const download = useDownloadBillingCsv();
  const releaseBatch = useReleasePendingBatch();

  const [downloadMsg, setDownloadMsg] = React.useState<string | null>(null);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);
  const [confirmRelease, setConfirmRelease] = React.useState(false);

  const items = data?.items ?? [];
  const currency = items[0]?.currency ?? "INR";

  const totals = React.useMemo(() => {
    const t = { eligible: 0, pending: 0, paid30d: 0, reversed: 0 };
    const thirty = Date.now() - 30 * 24 * 3_600_000;
    for (const p of items) {
      const bucket = statusBucket(p);
      if (bucket === "eligible") t.eligible += p.amountMinor;
      if (bucket === "pending") t.pending += p.amountMinor;
      if (bucket === "reversed") t.reversed += p.amountMinor;
      if (
        bucket === "paid" &&
        p.sentAt &&
        new Date(p.sentAt).getTime() >= thirty
      ) {
        t.paid30d += p.amountMinor;
      }
    }
    return t;
  }, [items]);

  const counts = React.useMemo(() => {
    const c = { eligible: 0, pending: 0, paid: 0, reversed: 0 };
    for (const p of items) c[statusBucket(p)]++;
    return { all: items.length, ...c };
  }, [items]);

  const pendingBatch = React.useMemo(() => {
    const ps = items.filter((p) => statusBucket(p) === "pending");
    return {
      count: ps.length,
      total: ps.reduce((a, p) => a + p.amountMinor, 0),
    };
  }, [items]);

  const eligibleCount = counts.eligible;

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((p) => {
      if (activeFilter !== "all" && statusBucket(p) !== activeFilter)
        return false;
      if (needle) {
        const hay =
          `${p.id} ${p.contributorId} ${p.taskDefinitionId} ${p.externalRef ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, activeFilter, search]);

  const sorted = React.useMemo(() => sortPayouts(filtered), [filtered]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = sorted.slice(
    (pageIdx - 1) * ROWS_PER_PAGE,
    pageIdx * ROWS_PER_PAGE,
  );

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(
        qs
          ? `/enterprise/billing/payouts?${qs}`
          : "/enterprise/billing/payouts",
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const onExport = async () => {
    setDownloadMsg(null);
    setDownloadError(null);
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const to = now.toISOString();
    try {
      const r = await download.mutateAsync({ kind: "payouts", from, to });
      setDownloadMsg(`Downloaded ${r.filename} · ${r.rowCount} rows`);
    } catch (e) {
      setDownloadError(
        e instanceof BillingApiError ? e.message : (e as Error).message,
      );
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* Page header */}
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Finance · Payouts
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Payouts ledger
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Contributor payouts for this tenant — release eligible batches or
          track in-flight transfers.
        </p>
        <p className="mt-2 font-body text-[12px] flex flex-wrap items-center gap-x-2">
          <Link
            href="/enterprise/billing/rate-cards"
            className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
          >
            Rate cards
          </Link>
          <span aria-hidden className="text-text-disabled">·</span>
          <Link
            href="/enterprise/billing/invoices"
            className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
          >
            Invoices
          </Link>
        </p>
      </header>

      {/* KPI strip */}
      <section aria-label="Payout totals" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Eligible"
          value={isLoading ? "—" : fmtINRMinor(totals.eligible, currency)}
          icon={Banknote}
          hint={
            isLoading
              ? undefined
              : counts.eligible > 0
              ? `${counts.eligible} payout${counts.eligible === 1 ? "" : "s"} ready`
              : "none ready"
          }
          hintTone={counts.eligible > 0 ? "ai" : "neutral"}
        />
        <StatCard
          label="In flight"
          value={isLoading ? "—" : fmtINRMinor(totals.pending, currency)}
          icon={Send}
          hint={
            isLoading
              ? undefined
              : counts.pending > 0
              ? `${counts.pending} processing`
              : "none in flight"
          }
          hintTone={counts.pending > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Paid (30d)"
          value={isLoading ? "—" : fmtINRMinor(totals.paid30d, currency)}
          icon={ChevronRight}
          hint={isLoading ? undefined : `${counts.paid} total paid`}
          hintTone="success"
        />
        <StatCard
          label="Reversed"
          value={isLoading ? "—" : fmtINRMinor(totals.reversed, currency)}
          icon={AlertCircle}
          hint={
            isLoading
              ? undefined
              : counts.reversed > 0
              ? `${counts.reversed} failed`
              : "none reversed"
          }
          hintTone={counts.reversed > 0 ? "error" : "neutral"}
        />
      </section>

      {/* Eligible-to-release urgent alert */}
      {!isLoading && eligibleCount > 0 && (
        <button
          type="button"
          onClick={() => setParam({ status: "eligible" })}
          className="w-full flex items-center gap-3 rounded-lg border border-[var(--color-ai-border)] bg-[var(--color-ai-surface)]/60 px-4 py-3 text-left hover:bg-[var(--color-ai-surface)] transition-colors group"
        >
          <AlertTriangle
            className="h-4 w-4 shrink-0 text-[var(--color-ai-text)]"
            strokeWidth={2}
            aria-hidden
          />
          <span className="min-w-0 flex-1 font-body text-[13px] text-text-secondary">
            <span className="font-semibold text-foreground">
              {eligibleCount} payout{eligibleCount === 1 ? "" : "s"} ready to
              release
            </span>{" "}
            —{" "}
            {fmtINRMinor(totals.eligible, currency)} eligible. Review then
            release the pending batch.
          </span>
          <ChevronRight
            className="h-4 w-4 text-text-tertiary group-hover:text-foreground shrink-0"
            strokeWidth={2}
            aria-hidden
          />
        </button>
      )}

      {/* Error / download feedback */}
      {error && (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle
            className="h-4 w-4 text-error-text shrink-0 mt-0.5"
            strokeWidth={2}
            aria-hidden
          />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {error instanceof BillingApiError
              ? error.message
              : "Failed to load payouts"}
          </p>
        </div>
      )}
      {(downloadMsg || downloadError) && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 font-body text-[12.5px]",
            downloadError
              ? "border-error-border bg-error-subtle text-error-text"
              : "border-success-border bg-success-subtle text-success-text",
          )}
        >
          {downloadError ?? downloadMsg}
        </div>
      )}

      {/* Registry table card */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-4 sm:px-5 py-3.5 border-b border-stroke-subtle sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Filter payouts" className="flex flex-wrap gap-1.5">
            {TABS.map((tab) => {
              const active = activeFilter === tab.key;
              const count = counts[tab.key];
              const warnDot =
                (tab.key === "eligible" && count > 0) ||
                (tab.key === "reversed" && count > 0);
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setParam({ status: tab.key === "all" ? null : tab.key })
                  }
                  aria-current={active ? "page" : undefined}
                  style={active ? GLASS_GRADIENT : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
                    active
                      ? "text-white"
                      : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums",
                      active
                        ? "bg-white/25 text-white"
                        : "bg-bg-subtle text-text-tertiary",
                    )}
                  >
                    {count}
                  </span>
                  {warnDot && !active ? (
                    <span
                      aria-hidden
                      className={cn(
                        "h-1.5 w-1.5 rounded-full shrink-0",
                        tab.key === "reversed"
                          ? "bg-[var(--color-error-solid)]"
                          : "bg-[var(--c-violet-500)]",
                      )}
                    />
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmRelease(true)}
              disabled={
                pendingBatch.count === 0 || isLoading || releaseBatch.isPending
              }
              className={cn(primaryBtnClass, "h-8 px-3 text-[12px]")}
              style={primaryStyle}
            >
              <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Release batch
              {pendingBatch.count > 0 && (
                <span className="font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full bg-white/25 text-white">
                  {pendingBatch.count}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => void onExport()}
              disabled={download.isPending}
              className={cn(secondaryBtnClass, "h-8 px-3 text-[12px]")}
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {download.isPending ? "Exporting…" : "Export"}
            </button>
            <div className="relative w-full sm:w-52 shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search payout, task…"
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-surface border border-stroke-subtle font-body text-[12.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
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
        </div>

        {/* Table body */}
        {isLoading ? (
          <TableSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyPanel
            isEmpty={items.length === 0}
            onClear={() => setParam({ status: null, q: null })}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Contributor
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Task
                    </th>
                    <th className="px-3 py-2.5 text-right font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Amount
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Eligible
                    </th>
                    <th className="w-10 px-2 py-2.5" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((p) => (
                    <PayoutRow key={p.id} payout={p} currency={currency} />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of{" "}
                  {sorted.length}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() =>
                      setParam({
                        page: pageIdx > 1 ? String(pageIdx - 1) : null,
                      })
                    }
                    className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground disabled:text-text-disabled"
                  >
                    Previous
                  </button>
                  <span className="font-mono text-[11px] text-text-tertiary">
                    {pageIdx}/{totalPages}
                  </span>
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
            )}
          </>
        )}
      </div>

      {/* Release batch modal */}
      <AdminModal
        open={confirmRelease}
        onClose={() => setConfirmRelease(false)}
        icon={Send}
        tone="ai"
        title="Release pending batch?"
        description={`Release ${pendingBatch.count} in-flight payout${pendingBatch.count === 1 ? "" : "s"} totaling ${fmtINRMinor(pendingBatch.total, currency)}. Funds go to contributor payout methods on file.`}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setConfirmRelease(false)}
              disabled={releaseBatch.isPending}
              className={cn(secondaryBtnClass, "h-9 px-3.5 text-[13px]")}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                releaseBatch.mutate(undefined, {
                  onSuccess: () => setConfirmRelease(false),
                });
              }}
              disabled={releaseBatch.isPending}
              className={cn(primaryBtnClass, "h-9 px-3.5 text-[13px]")}
              style={primaryStyle}
            >
              {releaseBatch.isPending ? "Releasing…" : "Confirm release"}
            </button>
          </div>
        }
      >
        <></>
      </AdminModal>
    </div>
  );
}

function PayoutRow({
  payout,
  currency,
}: {
  payout: PayoutDetail;
  currency: string;
}) {
  const bucket = statusBucket(payout);
  const href = `/enterprise/billing/payouts/${payout.id}`;

  return (
    <tr
      onClick={() => (window.location.href = href)}
      className="group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors"
    >
      <td className="px-4 sm:px-5 py-3.5">
        <span className="font-body text-[13.5px] font-semibold text-foreground block">
          {formatContributor(payout.contributorId)}
        </span>
        <span className="font-mono text-[11px] text-text-tertiary tabular-nums">
          {payout.id}
        </span>
      </td>
      <td className="px-3 py-3.5 font-mono text-[12px] text-text-secondary tabular-nums truncate max-w-[160px]">
        {payout.taskDefinitionId}
      </td>
      <td className="px-3 py-3.5 font-mono text-[13px] tabular-nums text-right whitespace-nowrap text-foreground font-semibold">
        {fmtINRMinor(payout.amountMinor, currency)}
      </td>
      <td className="px-3 py-3.5">
        <Chip tone={bucketTone(bucket)} dot={false}>
          {bucketLabel(bucket)}
        </Chip>
      </td>
      <td className="px-3 py-3.5 font-body text-[12.5px] text-text-secondary tabular-nums whitespace-nowrap">
        {fmtDate(payout.eligibleAt)}
      </td>
      <td className="px-2 py-3.5 align-middle">
        <ChevronRight
          className="h-4 w-4 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity"
          strokeWidth={2}
          aria-hidden
        />
      </td>
    </tr>
  );
}

function TableSkeleton() {
  return (
    <div className="divide-y divide-stroke-subtle">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-4 px-5 py-3.5"
        >
          <Skeleton className="h-4 w-48 max-w-[35%]" />
          <div className="flex items-center gap-6">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-[22px] w-16 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyPanel({
  isEmpty,
  onClear,
}: {
  isEmpty: boolean;
  onClear: () => void;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <Banknote
        className="h-6 w-6 text-text-tertiary mx-auto mb-2"
        strokeWidth={2}
        aria-hidden
      />
      <p className="font-body text-[13px] font-semibold text-foreground">
        {isEmpty ? "No payouts yet" : "No matches"}
      </p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
        {isEmpty
          ? "Payouts appear after deliverables are accepted and become eligible."
          : "Try a different filter or search term."}
      </p>
      {!isEmpty && (
        <button
          type="button"
          onClick={onClear}
          className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
