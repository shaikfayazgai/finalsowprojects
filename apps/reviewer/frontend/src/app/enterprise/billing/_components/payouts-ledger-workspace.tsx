"use client";

/**
 * Payouts ledger workspace — underline tabs, search, grouped rows, batch release.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Banknote,
  Download,
  Search,
} from "lucide-react";
import {
  useTenantPayouts,
  useDownloadBillingCsv,
  useReleasePendingBatch,
} from "@/lib/hooks/use-enterprise-billing";
import { BillingApiError } from "@/lib/api/enterprise-billing";
import type { PayoutDetail } from "@/lib/payouts/types";
import { DashboardSection } from "@/components/meridian/dashboard";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";

const ROWS_PER_PAGE = 12;
const PREVIEW_PER_GROUP = 5;

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

function statusPillCls(bucket: Exclude<FilterKey, "all">): string {
  switch (bucket) {
    case "eligible":
      return "bg-brand-subtle text-brand-subtle-text";
    case "pending":
      return "bg-warning-subtle text-warning-text";
    case "paid":
      return "bg-success-subtle text-success-text";
    case "reversed":
      return "bg-error-subtle text-error-text";
  }
}

function rowMeta(p: PayoutDetail, currency: string): string {
  const bucket = statusBucket(p);
  const parts = [
    p.id,
    p.taskDefinitionId,
    fmtDate(p.eligibleAt),
    fmtINRMinor(p.amountMinor, currency),
  ];
  if (bucket === "paid" && p.externalRef) parts.push(p.externalRef);
  if (bucket === "reversed" && p.failureReason) parts.push(p.failureReason);
  return parts.join(" · ");
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

function groupPayouts(items: PayoutDetail[]) {
  const sorted = sortPayouts(items);
  const eligible = sorted.filter((p) => statusBucket(p) === "eligible");
  const pending = sorted.filter((p) => statusBucket(p) === "pending");
  const paid = sorted.filter((p) => statusBucket(p) === "paid");
  const reversed = sorted.filter((p) => statusBucket(p) === "reversed");

  const groups: Array<{ key: FilterKey; label: string; rows: PayoutDetail[]; urgent?: boolean }> = [];
  if (eligible.length) groups.push({ key: "eligible", label: "Ready to release", rows: eligible, urgent: true });
  if (pending.length) groups.push({ key: "pending", label: "In flight", rows: pending });
  if (paid.length) groups.push({ key: "paid", label: "Paid", rows: paid });
  if (reversed.length) groups.push({ key: "reversed", label: "Reversed", rows: reversed });
  return groups;
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
      if (bucket === "paid" && p.sentAt && new Date(p.sentAt).getTime() >= thirty) {
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
      if (activeFilter !== "all" && statusBucket(p) !== activeFilter) return false;
      if (needle) {
        const hay = `${p.id} ${p.contributorId} ${p.taskDefinitionId} ${p.externalRef ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, activeFilter, search]);

  const sorted = React.useMemo(() => sortPayouts(filtered), [filtered]);
  const grouped = activeFilter === "all" && !search.trim();
  const groups = grouped ? groupPayouts(sorted) : null;

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = grouped
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
      const qs = next.toString();
      router.replace(qs ? `/enterprise/billing/payouts?${qs}` : "/enterprise/billing/payouts", {
        scroll: false,
      });
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

  const listDescription =
    sorted.length === 0
      ? "No matches"
      : grouped
        ? `${sorted.length} payout${sorted.length === 1 ? "" : "s"} · grouped by status`
        : `${sorted.length} payout${sorted.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Finance · Payouts
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Payouts ledger
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Contributor payouts for this tenant — release eligible batches or track in-flight transfers.
        </p>
        <RecordLinks />
      </header>

      {eligibleCount > 0 && (
        <ContextBanner tone="brand" title={`${eligibleCount} payout${eligibleCount === 1 ? "" : "s"} ready to release`}>
          {fmtINRMinor(totals.eligible, currency)} eligible — review below, then release the pending batch when ready.
        </ContextBanner>
      )}

      {pendingBatch.count > 0 && (
        <ContextBanner tone="neutral" title={`${pendingBatch.count} payout${pendingBatch.count === 1 ? "" : "s"} in flight`}>
          {fmtINRMinor(pendingBatch.total, currency)} processing — use Release pending batch when admin approval is complete.
        </ContextBanner>
      )}

      {(downloadMsg || downloadError) && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 font-body text-[12.5px]",
            downloadError
              ? "border-error-border bg-error-subtle text-error-text"
              : "border-success-border bg-success-subtle text-success-text",
          )}
        >
          {downloadError ?? downloadMsg}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {error instanceof BillingApiError ? error.message : "Failed to load payouts"}
          </p>
        </div>
      )}

      <DashboardSection title="Ledger summary" description="Amounts by payout state">
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
          <SummaryStat
            label="Eligible"
            value={isLoading ? null : fmtINRMinor(totals.eligible, currency)}
            highlight={totals.eligible > 0}
          />
          <SummaryStat
            label="In flight"
            value={isLoading ? null : fmtINRMinor(totals.pending, currency)}
          />
          <SummaryStat
            label="Paid (30d)"
            value={isLoading ? null : fmtINRMinor(totals.paid30d, currency)}
            positive
          />
          <SummaryStat
            label="Reversed"
            value={isLoading ? null : fmtINRMinor(totals.reversed, currency)}
            warn={totals.reversed > 0}
          />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 pt-4 pb-0 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
            <div className="min-w-0 flex-1">
              <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
                All payouts
              </h2>
              <p className="mt-1 font-body text-[12.5px] text-text-secondary">
                {listDescription}
                {eligibleCount > 0 && activeFilter === "all" && (
                  <span className="text-brand font-medium">
                    {" · "}
                    {eligibleCount} ready
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setConfirmRelease(true)}
                disabled={pendingBatch.count === 0 || isLoading || releaseBatch.isPending}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-md",
                  "bg-brand text-on-brand font-body text-[12px] font-semibold",
                  "hover:bg-brand-hover transition-colors duration-fast",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                Release batch
                {pendingBatch.count > 0 && (
                  <span className="font-mono text-[10px] tabular-nums px-1.5 py-0.5 rounded-full bg-surface/20">
                    {pendingBatch.count}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => void onExport()}
                disabled={download.isPending}
                className={cn(
                  "inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-stroke bg-surface",
                  "font-body text-[12px] font-semibold text-foreground",
                  "hover:bg-surface-hover transition-colors duration-fast",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {download.isPending ? "Exporting…" : "Export"}
              </button>
            </div>
            <div className="relative w-full sm:w-52 shrink-0 sm:ml-auto">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search payout, task…"
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

          <nav aria-label="Filter payouts" className="flex flex-wrap gap-x-1 -mb-px">
            {TABS.map((tab) => {
              const active = activeFilter === tab.key;
              const count = counts[tab.key];
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
                        ? "bg-brand-subtle text-brand-subtle-text"
                        : "text-text-tertiary",
                      tab.key === "eligible" && count > 0 && !active && "text-brand",
                      tab.key === "reversed" && count > 0 && !active && "text-error-text",
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

        {isLoading ? (
          <PanelSkeleton />
        ) : sorted.length === 0 ? (
          <EmptyPanel
            isEmpty={items.length === 0}
            onClear={() => setParam({ status: null, q: null })}
          />
        ) : groups ? (
          <div className="divide-y divide-stroke-subtle">
            {groups.map((group) => (
              <PayoutGroup
                key={group.key}
                label={group.label}
                rows={group.rows}
                previewLimit={PREVIEW_PER_GROUP}
                filterHref={`/enterprise/billing/payouts?status=${group.key}`}
                currency={currency}
                urgent={group.urgent}
              />
            ))}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-stroke-subtle">
              {pageRows.map((p) => (
                <PayoutRow key={p.id} payout={p} currency={currency} />
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

      {confirmRelease && (
        <ReleaseBatchDialog
          count={pendingBatch.count}
          totalLabel={fmtINRMinor(pendingBatch.total, currency)}
          pending={releaseBatch.isPending}
          onCancel={() => setConfirmRelease(false)}
          onConfirm={() => {
            releaseBatch.mutate(undefined, {
              onSuccess: () => setConfirmRelease(false),
            });
          }}
        />
      )}
    </div>
  );
}

function PayoutGroup({
  label,
  rows,
  previewLimit,
  filterHref,
  currency,
  urgent,
}: {
  label: string;
  rows: PayoutDetail[];
  previewLimit: number;
  filterHref: string;
  currency: string;
  urgent?: boolean;
}) {
  const preview = rows.slice(0, previewLimit);
  const overflow = rows.length - preview.length;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 px-5 py-2.5">
        <p
          className={cn(
            "font-body text-[11px] font-semibold uppercase tracking-[0.1em]",
            urgent ? "text-brand" : "text-text-tertiary",
          )}
        >
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
        {preview.map((p) => (
          <li key={p.id}>
            <PayoutRow payout={p} currency={currency} urgent={urgent} />
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

function PayoutRow({
  payout,
  currency,
  urgent,
}: {
  payout: PayoutDetail;
  currency: string;
  urgent?: boolean;
}) {
  const bucket = statusBucket(payout);
  const meta = rowMeta(payout, currency);

  return (
    <Link
      href={`/enterprise/billing/payouts/${payout.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="font-body text-[13px] font-medium text-foreground truncate block">
          {formatContributor(payout.contributorId)}
        </span>
        <span
          className={cn(
            "font-body text-[11px] truncate block mt-0.5",
            urgent ? "text-brand font-medium" : "text-text-tertiary",
          )}
        >
          {meta}
        </span>
      </span>
      <span
        className={cn(
          "shrink-0 inline-flex px-2 py-0.5 rounded-full font-body text-[10.5px] font-semibold",
          statusPillCls(bucket),
        )}
      >
        {bucketLabel(bucket)}
      </span>
    </Link>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 font-body text-[12px]">
      <Link
        href="/enterprise/billing/rate-cards"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Rate cards
      </Link>
      <span aria-hidden className="text-text-disabled mx-2">
        ·
      </span>
      <Link
        href="/enterprise/billing/invoices"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Invoices
      </Link>
    </p>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  positive,
  warn,
}: {
  label: string;
  value: React.ReactNode | null;
  highlight?: boolean;
  positive?: boolean;
  warn?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          warn ? "text-warning-text" : positive ? "text-success-text" : highlight ? "text-brand" : "text-foreground",
        )}
      >
        {value === null ? <Skeleton className="h-6 w-24 rounded inline-block" /> : value}
      </dd>
    </div>
  );
}

function ContextBanner({
  tone,
  title,
  children,
}: {
  tone: "brand" | "neutral";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "brand"
          ? "border-brand/30 bg-brand-subtle/20"
          : "border-stroke-subtle bg-bg-subtle/50",
      )}
    >
      <p className="font-body text-[13px] font-semibold text-foreground">{title}</p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function EmptyPanel({ isEmpty, onClear }: { isEmpty: boolean; onClear: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      <Banknote className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
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
          className="mt-2 font-body text-[12.5px] font-semibold text-brand"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="divide-y divide-stroke-subtle">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="px-5 py-3">
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      ))}
    </div>
  );
}

function ReleaseBatchDialog({
  count,
  totalLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  count: number;
  totalLabel: string;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="release-batch-title"
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl bg-surface shadow-lg border border-stroke-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-stroke-subtle">
          <h3
            id="release-batch-title"
            className="font-body text-[15px] font-semibold text-foreground"
          >
            Release pending batch?
          </h3>
        </header>
        <div className="px-5 py-4 font-body text-[13px] text-text-secondary leading-relaxed">
          Release{" "}
          <span className="font-mono text-foreground tabular-nums">{count}</span> in-flight
          payout{count === 1 ? "" : "s"} totaling{" "}
          <span className="font-mono text-foreground tabular-nums">{totalLabel}</span>. Funds
          go to contributor payout methods on file.
        </div>
        <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-stroke-subtle">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex items-center h-9 px-3.5 rounded-md border border-stroke bg-surface font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="inline-flex items-center h-9 px-3.5 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover disabled:opacity-50"
          >
            {pending ? "Releasing…" : "Confirm release"}
          </button>
        </footer>
      </div>
    </div>
  );
}
