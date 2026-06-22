"use client";

/**
 * Billing invoices panel — underline tabs, search, scannable rows.
 * Used on the billing overview; full ledger lives at /billing/invoices.
 * Data fetched from the real backend via useEnterpriseInvoices.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Search, X } from "lucide-react";
import { useEnterpriseInvoices } from "@/lib/hooks/use-enterprise-billing";
import type { InvoiceStatus, InvoiceSummary } from "@/lib/billing/invoices-mock";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW, AURORA_ACCENT } from "@/app/admin/_shell/aurora";
import { Chip, GLASS_FIELD_STYLE, type Tone } from "@/app/admin/_shell/aurora-ui";

const ROWS_PER_PAGE = 8;
const PREVIEW_PER_GROUP = 4;

type FilterKey = "all" | InvoiceStatus;

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
];

function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  });
}

function rowMeta(inv: InvoiceSummary): string {
  return `${inv.id} · Issued ${fmtDate(inv.issuedAt)} · ${fmtINR(inv.amountMinor)}`;
}

function statusTone(status: InvoiceStatus): Tone {
  switch (status) {
    case "paid":
      return "success";
    case "overdue":
      return "error";
    case "pending":
      return "warning";
    default:
      return "neutral";
  }
}

function groupInvoices(items: InvoiceSummary[]) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
  );
  const overdue = sorted.filter((i) => i.status === "overdue");
  const pending = sorted.filter((i) => i.status === "pending");
  const paid = sorted.filter((i) => i.status === "paid");

  const groups: Array<{ key: string; label: string; rows: InvoiceSummary[] }> = [];
  if (overdue.length) groups.push({ key: "overdue", label: "Overdue", rows: overdue });
  if (pending.length) groups.push({ key: "pending", label: "Pending payment", rows: pending });
  if (paid.length) groups.push({ key: "paid", label: "Paid", rows: paid });
  return groups;
}

export function BillingInvoicesPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter: FilterKey =
    (searchParams.get("inv") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const { data, isLoading } = useEnterpriseInvoices();
  const invoices: InvoiceSummary[] = data?.items ?? [];

  const counts = React.useMemo(
    () => ({
      all: invoices.length,
      paid: invoices.filter((i) => i.status === "paid").length,
      pending: invoices.filter((i) => i.status === "pending").length,
      overdue: invoices.filter((i) => i.status === "overdue").length,
    }),
    [invoices],
  );

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      if (activeFilter !== "all" && inv.status !== activeFilter) return false;
      if (needle) {
        const hay = `${inv.id} ${inv.project}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [invoices, activeFilter, search]);

  const sorted = React.useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
      ),
    [filtered],
  );

  const grouped = activeFilter === "all" && !search.trim();
  const groups = grouped ? groupInvoices(sorted) : null;

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
      router.replace(qs ? `/enterprise/billing?${qs}` : "/enterprise/billing", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const listDescription =
    isLoading
      ? "Loading invoices…"
      : sorted.length === 0
        ? "No matches"
        : grouped
          ? `${sorted.length} invoice${sorted.length === 1 ? "" : "s"} · grouped by status`
          : `${sorted.length} invoice${sorted.length === 1 ? "" : "s"}`;

  return (
    <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
      <div className="px-5 pt-4 pb-0 border-b border-white/55">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
          <div className="min-w-0">
            <h2 className="font-display text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
              Invoices
            </h2>
            <p className="mt-1 font-body text-[12.5px] text-text-secondary">
              {listDescription}
              {counts.overdue > 0 && activeFilter === "all" && (
                <span className="text-error-text font-medium">
                  {" · "}
                  {counts.overdue} overdue
                </span>
              )}
            </p>
            <Link
              href="/enterprise/billing/invoices"
              className="mt-2 inline-block font-body text-[12px] font-semibold text-text-secondary hover:text-foreground underline-offset-2"
            >
              Full invoice ledger
            </Link>
          </div>
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
              placeholder="Search invoice, project…"
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

        <nav aria-label="Filter invoices" className="flex flex-wrap gap-x-1 -mb-px">
          {TABS.map((tab) => {
            const active = activeFilter === tab.key;
            const count = counts[tab.key];
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setParam({ inv: tab.key === "all" ? null : tab.key })}
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
                    tab.key === "overdue" && count > 0 && !active && "text-error-text",
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

      {isLoading ? (
        <PanelSkeleton />
      ) : sorted.length === 0 ? (
        <EmptyPanel onClear={() => setParam({ inv: null, q: null })} isEmpty={invoices.length === 0} />
      ) : groups ? (
        <div className="divide-y divide-white/60">
          {groups.map((group) => (
            <InvoiceGroup
              key={group.key}
              label={group.label}
              rows={group.rows}
              previewLimit={PREVIEW_PER_GROUP}
              filterHref={`/enterprise/billing?inv=${group.key === "overdue" ? "overdue" : group.key === "pending" ? "pending" : "paid"}`}
              urgent={group.key === "overdue"}
            />
          ))}
        </div>
      ) : (
        <>
          <ul className="divide-y divide-white/60">
            {pageRows.map((inv) => (
              <InvoiceRow key={inv.id} inv={inv} />
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
  );
}

function InvoiceGroup({
  label,
  rows,
  previewLimit,
  filterHref,
  urgent,
}: {
  label: string;
  rows: InvoiceSummary[];
  previewLimit: number;
  filterHref: string;
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
            urgent ? "text-error-text" : "text-text-tertiary",
          )}
        >
          {label}
          <span className="ml-1.5 font-mono tabular-nums text-foreground normal-case tracking-normal">
            {rows.length}
          </span>
        </p>
        {rows.length > previewLimit && (
          <Link href={filterHref} className="font-body text-[11.5px] font-medium text-text-secondary hover:text-foreground">
            View all
          </Link>
        )}
      </div>
      <ul className="divide-y divide-white/60 border-t border-white/55">
        {preview.map((inv) => (
          <li key={inv.id}>
            <InvoiceRow inv={inv} urgent={urgent} />
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

function InvoiceRow({ inv, urgent }: { inv: InvoiceSummary; urgent?: boolean }) {
  return (
    <Link
      href={`/enterprise/billing/invoices/${inv.id}`}
      className={cn(
        "flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px] transition-colors duration-fast hover:bg-white/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="font-body text-[13px] font-medium text-foreground truncate block">
          {inv.project}
        </span>
        <span
          className={cn(
            "font-body text-[11px] truncate block mt-0.5",
            urgent || inv.status === "overdue" ? "text-error-text font-medium" : "text-text-tertiary",
          )}
        >
          {rowMeta(inv)}
        </span>
      </span>
      <Chip tone={statusTone(inv.status)} className="shrink-0">
        {inv.status}
      </Chip>
    </Link>
  );
}

function PanelSkeleton() {
  return (
    <div className="divide-y divide-white/60">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-5 py-3">
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      ))}
    </div>
  );
}

function EmptyPanel({ onClear, isEmpty }: { onClear: () => void; isEmpty: boolean }) {
  return (
    <div className="px-5 py-14 text-center">
      <FileText className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      <p className="font-body text-[13px] font-semibold text-foreground">
        {isEmpty ? "No invoices yet" : "No invoices match"}
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

export function BillingInvoicesPanelSkeleton() {
  return (
    <div className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
      <div className="px-5 pt-4 pb-3 border-b border-white/55 space-y-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-full max-w-xs" />
      </div>
      <div className="divide-y divide-white/60">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-3">
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
