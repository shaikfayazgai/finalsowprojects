"use client";

/**
 * Invoices ledger — full-page registry pattern.
 * KPI strip (Invoiced / Paid / Pending / Overdue) + gradient-pill tabs +
 * solid search + TABLE (Invoice · Issued · Amount · Status) + pagination.
 * Overdue invoices sorted first.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, ChevronRight, FileText, Search, X } from "lucide-react";
import {
  listInvoicesMock,
  type InvoiceStatus,
  type InvoiceSummary,
} from "@/lib/billing/invoices-mock";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, type Tone } from "@/app/admin/_shell/aurora-ui";
import { Banknote, CheckCircle2, Clock, Receipt } from "lucide-react";

const ROWS_PER_PAGE = 20;

type FilterKey = "all" | InvoiceStatus;

const TABS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "overdue", label: "Overdue" },
  { key: "pending", label: "Pending" },
  { key: "paid", label: "Paid" },
];

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid: "Paid",
  overdue: "Overdue",
  pending: "Pending",
};

function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusTone(status: InvoiceStatus): Tone {
  return status === "paid" ? "success" : status === "overdue" ? "error" : "warning";
}

function statusRank(status: InvoiceStatus): number {
  return status === "overdue" ? 3 : status === "pending" ? 2 : 1;
}

export default function InvoicesListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter: FilterKey =
    (searchParams.get("status") as FilterKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  const all = React.useMemo(() => listInvoicesMock(), []);

  const counts = React.useMemo(() => {
    const c = { paid: 0, pending: 0, overdue: 0 } as Record<InvoiceStatus, number>;
    let totalMinor = 0;
    for (const inv of all) {
      c[inv.status]++;
      totalMinor += inv.amountMinor;
    }
    return { all: all.length, ...c, totalMinor };
  }, [all]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all.filter((inv) => {
      if (activeFilter !== "all" && inv.status !== activeFilter) return false;
      if (needle) {
        const hay = `${inv.id} ${inv.project}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [all, activeFilter, search]);

  /* overdue-first, then newest */
  const sorted = React.useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const r = statusRank(b.status) - statusRank(a.status);
        if (r !== 0) return r;
        return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime();
      }),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = sorted.slice((pageIdx - 1) * ROWS_PER_PAGE, pageIdx * ROWS_PER_PAGE);

  const setParam = React.useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(changes)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `/enterprise/billing/invoices?${qs}` : "/enterprise/billing/invoices", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* Back nav */}
      <Link
        href="/enterprise/billing"
        className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
        Billing
      </Link>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Finance · Invoices
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Invoices
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-secondary">
          Full billing ledger — filter, search, and open any tenant invoice.
        </p>
      </header>

      {/* KPI strip */}
      <section aria-label="Invoice summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total invoiced"
          value={fmtINR(counts.totalMinor)}
          icon={Banknote}
          hint={`${counts.all} invoice${counts.all === 1 ? "" : "s"}`}
        />
        <StatCard
          label="Paid"
          value={counts.paid}
          icon={CheckCircle2}
          hint="settled"
          hintTone="success"
        />
        <StatCard
          label="Pending"
          value={counts.pending}
          icon={Clock}
          hint="awaiting payment"
          hintTone={counts.pending > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Overdue"
          value={counts.overdue}
          icon={AlertTriangle}
          hint={counts.overdue > 0 ? "action required" : "none overdue"}
          hintTone={counts.overdue > 0 ? "error" : "neutral"}
        />
      </section>

      {/* Registry card */}
      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 pt-4 border-b border-stroke-subtle">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3">
            <div className="min-w-0">
              <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">
                Invoice ledger
              </h2>
              <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
                {sorted.length} invoice{sorted.length === 1 ? "" : "s"}
                {counts.overdue > 0 && activeFilter === "all" ? (
                  <span className="text-error-text font-medium"> · {counts.overdue} overdue</span>
                ) : null}
              </p>
            </div>
            <div className="relative w-full sm:w-64 shrink-0">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setParam({ q: e.target.value })}
                placeholder="Search by invoice ID or project…"
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

          {/* Gradient-pill tabs */}
          <nav aria-label="Filter invoices" className="flex flex-wrap gap-1.5 pb-4">
            {TABS.map((tab) => {
              const active = activeFilter === tab.key;
              const count = tab.key === "all" ? counts.all : counts[tab.key as InvoiceStatus];
              const warn = tab.key === "overdue" && count > 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setParam({ status: tab.key === "all" ? null : tab.key })}
                  aria-current={active ? "page" : undefined}
                  style={active ? GLASS_GRADIENT : undefined}
                  className={cn(
                    "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
                    active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums",
                      active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary",
                    )}
                  >
                    {count}
                  </span>
                  {warn && !active ? (
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-error-solid)] shrink-0" />
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>

        {sorted.length === 0 ? (
          <EmptyPanel onClear={() => setParam({ status: null, q: null })} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse" aria-label="Invoices">
                <thead>
                  <tr className="border-b border-stroke-subtle bg-bg-subtle/50">
                    <th className="px-4 sm:px-5 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Invoice
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Issued
                    </th>
                    <th className="px-3 py-2.5 text-right font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Amount
                    </th>
                    <th className="px-3 py-2.5 text-left font-body text-[10.5px] font-semibold uppercase tracking-[0.06em] text-text-tertiary">
                      Status
                    </th>
                    <th className="w-10 px-2 py-2.5" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((inv) => (
                    <InvoiceRow
                      key={inv.id}
                      inv={inv}
                      onOpen={() => router.push(`/enterprise/billing/invoices/${inv.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <footer className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-stroke-subtle">
                <p className="font-body text-[12px] text-text-tertiary tabular-nums">
                  {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
                  {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of {sorted.length}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={pageIdx === 1}
                    onClick={() =>
                      setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })
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
      </section>
    </div>
  );
}

function InvoiceRow({ inv, onOpen }: { inv: InvoiceSummary; onOpen: () => void }) {
  const overdue = inv.status === "overdue";
  const href = `/enterprise/billing/invoices/${inv.id}`;

  return (
    <tr
      onClick={onOpen}
      className="group border-b border-stroke-subtle last:border-0 cursor-pointer hover:bg-bg-subtle/60 transition-colors"
    >
      <td className="px-4 sm:px-5 py-3.5">
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="font-body text-[13.5px] font-semibold text-foreground hover:text-text-link truncate block max-w-[260px]"
          title={inv.project}
        >
          {inv.project}
        </Link>
        <span className="font-mono text-[11px] text-text-tertiary tabular-nums">{inv.id}</span>
      </td>
      <td className="px-3 py-3.5 font-body text-[12.5px] text-text-secondary tabular-nums whitespace-nowrap">
        {fmtDate(inv.issuedAt)}
      </td>
      <td
        className={cn(
          "px-3 py-3.5 font-mono text-[12.5px] tabular-nums text-right whitespace-nowrap",
          overdue ? "text-error-text font-semibold" : "text-foreground",
        )}
      >
        {fmtINR(inv.amountMinor)}
      </td>
      <td className="px-3 py-3.5">
        <Chip tone={statusTone(inv.status)} dot={false}>
          {STATUS_LABEL[inv.status]}
        </Chip>
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

function EmptyPanel({ onClear }: { onClear: () => void }) {
  return (
    <div className="px-5 py-14 text-center">
      <FileText className="h-6 w-6 text-text-tertiary mx-auto mb-2" strokeWidth={2} aria-hidden />
      <p className="font-body text-[13px] font-semibold text-foreground">
        No invoices match these filters
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-2 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground"
      >
        Clear filters
      </button>
    </div>
  );
}
