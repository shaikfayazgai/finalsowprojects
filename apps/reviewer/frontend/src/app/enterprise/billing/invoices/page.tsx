"use client";

/**
 * Invoices list — spec doc 02 §5.G.2.
 *
 * Filter chips (status) + search + table (ID / Project / Issued / Period /
 * Amount / Status). Invoice data is mock-backed until an /api/invoices
 * endpoint ships.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { InvoiceStatus, InvoiceSummary } from "@/lib/billing/invoices-mock";
import { cn } from "@/lib/utils/cn";

const ROWS_PER_PAGE = 20;

type ChipKey = "all" | InvoiceStatus;

const CHIPS: Array<{ key: ChipKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Pending" },
  { key: "overdue", label: "Overdue" },
];

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

function periodLabel(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  return `${s.toLocaleDateString("en-GB", { month: "short", day: "numeric" })} – ${e.toLocaleDateString(
    undefined,
    { month: "short", day: "numeric" },
  )}`;
}

export default function InvoicesListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeChip: ChipKey =
    (searchParams.get("status") as ChipKey | null) ?? "all";
  const search = searchParams.get("q") ?? "";
  const page = Number(searchParams.get("page") ?? "1");

  // No invoices API yet — render the empty state until the endpoint ships.
  const all = React.useMemo<InvoiceSummary[]>(() => [], []);

  const counts = React.useMemo(() => {
    const c = { paid: 0, pending: 0, overdue: 0 } as Record<
      InvoiceStatus,
      number
    >;
    for (const inv of all) c[inv.status]++;
    return { all: all.length, ...c };
  }, [all]);

  const filtered = React.useMemo(() => {
    const needle = search.trim().toLowerCase();
    return all.filter((inv) => {
      if (activeChip !== "all" && inv.status !== activeChip) return false;
      if (needle) {
        const hay = `${inv.id} ${inv.project}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [all, activeChip, search]);

  const sorted = React.useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime(),
      ),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const pageIdx = Math.max(1, Math.min(page, totalPages));
  const pageRows = sorted.slice(
    (pageIdx - 1) * ROWS_PER_PAGE,
    pageIdx * ROWS_PER_PAGE,
  );

  const setParam = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (Object.keys(changes).some((k) => k !== "page")) next.delete("page");
    router.replace(`/enterprise/billing/invoices?${next.toString()}`, {
      scroll: false,
    });
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/enterprise/billing"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          <span>Billing</span>
        </Link>
        <span aria-hidden className="opacity-60">
          /
        </span>
        <span className="text-text-secondary">Invoices</span>
      </nav>

      <header>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
          Enterprise · Billing
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Invoices
        </h1>
        <p className="mt-1.5 font-body text-[13px] text-text-secondary">
          Filter, search, and open any tenant invoice.
        </p>
      </header>

      {/* Filter chips + search (same row) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
      <nav
        aria-label="Invoice status"
        className="flex flex-wrap items-center gap-1.5"
      >
        {CHIPS.map((chip) => {
          const count =
            chip.key === "all"
              ? counts.all
              : counts[chip.key as InvoiceStatus];
          const active = activeChip === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() =>
                setParam({ status: chip.key === "all" ? null : chip.key })
              }
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3 rounded-full",
                "font-body text-[12.5px] font-semibold whitespace-nowrap",
                "transition-colors duration-fast ease-standard",
                active
                  ? "bg-brand text-on-brand"
                  : "bg-surface text-text-secondary border border-stroke hover:bg-surface-hover hover:text-foreground",
              )}
            >
              <span>{chip.label}</span>
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[18px] h-[16px] px-1 rounded-full",
                  "font-mono text-[10.5px] tabular-nums",
                  active
                    ? "bg-surface text-foreground"
                    : "bg-bg-subtle text-text-tertiary",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="ml-auto w-full sm:w-64">
        <input
          type="search"
          value={search}
          onChange={(e) => setParam({ q: e.target.value })}
          placeholder="Search by invoice ID or project…"
          className={cn(
            "w-full h-9 px-3 rounded-md shadow-xs",
            "bg-surface border border-stroke",
            "font-body text-[13px] text-foreground placeholder:text-text-disabled",
            "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
          )}
        />
      </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-stroke bg-surface shadow-xs px-4 py-10 text-center">
          <p className="font-body text-[13px] font-semibold text-foreground">
            No invoices match these filters
          </p>
          <button
            type="button"
            onClick={() => setParam({ status: null, q: null })}
            className="mt-2 font-body text-[12.5px] text-text-link hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-stroke bg-surface shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Invoices">
              <thead className="bg-bg-subtle">
                <tr>
                  <Th>Invoice</Th>
                  <Th>Project</Th>
                  <Th>Issued</Th>
                  <Th>Period</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((inv) => (
                  <InvoiceRow key={inv.id} inv={inv} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-stroke-subtle">
            <p className="font-body text-[12px] text-text-tertiary">
              {(pageIdx - 1) * ROWS_PER_PAGE + 1}–
              {Math.min(pageIdx * ROWS_PER_PAGE, sorted.length)} of{" "}
              {sorted.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  setParam({ page: pageIdx > 1 ? String(pageIdx - 1) : null })
                }
                disabled={pageIdx === 1}
                className="h-7 px-2.5 rounded-md font-body text-[12px] font-semibold text-text-link hover:bg-bg-subtle disabled:text-text-disabled disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums px-1">
                Page {pageIdx} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setParam({ page: String(pageIdx + 1) })}
                disabled={pageIdx >= totalPages}
                className="h-7 px-2.5 rounded-md font-body text-[12px] font-semibold text-text-link hover:bg-bg-subtle disabled:text-text-disabled disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary",
        "px-4 py-2.5",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

function InvoiceRow({ inv }: { inv: InvoiceSummary }) {
  const router = useRouter();
  const href = `/enterprise/billing/invoices/${inv.id}`;
  const go = () => router.push(href);
  return (
    <tr
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      }}
      aria-label={`Open invoice ${inv.id}`}
      className={cn(
        "cursor-pointer border-t border-stroke-subtle hover:bg-bg-subtle transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
      )}
    >
      <td className="px-4 py-2.5 whitespace-nowrap">
        <span className="font-mono text-[12px] font-medium text-foreground">
          {inv.id}
        </span>
      </td>
      <td className="px-4 py-2.5 max-w-0">
        <span className="font-body text-[12.5px] text-foreground truncate block">
          {inv.project}
        </span>
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-text-tertiary tabular-nums">
        {fmtDate(inv.issuedAt)}
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap font-mono text-[11px] text-text-tertiary tabular-nums">
        {periodLabel(inv.periodStart, inv.periodEnd)}
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap text-right font-mono text-[12px] text-foreground tabular-nums">
        {fmtINR(inv.amountMinor)}
      </td>
      <td className="px-4 py-2.5 whitespace-nowrap">
        <StatusChip status={inv.status} />
      </td>
    </tr>
  );
}

function StatusChip({ status }: { status: InvoiceStatus }) {
  const tone =
    status === "paid"
      ? { bg: "bg-success-subtle", text: "text-success-text" }
      : status === "overdue"
        ? { bg: "bg-error-subtle", text: "text-error-text" }
        : { bg: "bg-warning-subtle", text: "text-warning-text" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full",
        "font-body text-[10.5px] font-semibold whitespace-nowrap",
        tone.bg,
        tone.text,
      )}
    >
      {status}
    </span>
  );
}
