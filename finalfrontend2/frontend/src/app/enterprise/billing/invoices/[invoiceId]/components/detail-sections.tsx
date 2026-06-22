"use client";

import type { InvoiceDetail, InvoiceLineItem, InvoiceStatus } from "@/lib/billing/invoices-mock";
import { cn } from "@/lib/utils/cn";
import type { Tone } from "@/app/admin/_shell/aurora-ui";

export function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function periodLabel(start: string, end: string): string {
  return `${fmtDate(start)} → ${fmtDate(end)}`;
}

export function statusTone(status: InvoiceStatus): Tone {
  switch (status) {
    case "paid":
      return "success";
    case "overdue":
      return "error";
    case "pending":
    default:
      return "warning";
  }
}

export function InvoiceFactsSection({ invoice }: { invoice: InvoiceDetail }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      <Fact label="Invoice ID" value={invoice.id} mono />
      <Fact label="Project" value={invoice.project} />
      <Fact label="Billing period" value={periodLabel(invoice.periodStart, invoice.periodEnd)} />
      <Fact label="Issued" value={fmtDate(invoice.issuedAt)} />
      <Fact label="Status" value={invoice.status} capitalize />
      <Fact
        label="Paid on"
        value={invoice.paidAt ? fmtDate(invoice.paidAt) : "— not yet paid"}
      />
    </dl>
  );
}

export function LineItemsSection({
  invoice,
  search,
}: {
  invoice: InvoiceDetail;
  search: string;
}) {
  const needle = search.trim().toLowerCase();
  const filtered = invoice.lineItems.filter((row) => {
    if (!needle) return true;
    const hay = `${row.task} ${row.role} ${row.skillLevel}`.toLowerCase();
    return hay.includes(needle);
  });

  if (filtered.length === 0) {
    return (
      <p className="font-body text-[13px] text-text-tertiary italic -mx-5 sm:-mx-6 px-5 sm:px-6">
        No line items match your search.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-white/60 -mx-5 sm:-mx-6">
      {filtered.map((row, i) => (
        <LineItemRow key={`${row.task}-${i}`} row={row} />
      ))}
    </ul>
  );
}

function LineItemRow({ row }: { row: InvoiceLineItem }) {
  return (
    <li className="px-5 sm:px-6 py-2.5 min-h-[44px] flex items-center justify-between gap-4">
      <span className="min-w-0 flex-1">
        <span className="font-body text-[13px] font-medium text-foreground truncate block">
          {row.task}
        </span>
        <span className="font-body text-[11px] text-text-tertiary truncate block mt-0.5">
          {row.role} · {row.skillLevel} · {row.hours}h @ {fmtINR(row.rateMinor)}/h
        </span>
      </span>
      <span className="font-mono text-[13px] font-semibold text-foreground tabular-nums shrink-0">
        {fmtINR(row.amountMinor)}
      </span>
    </li>
  );
}

export function TotalsSection({ invoice }: { invoice: InvoiceDetail }) {
  // Markup model: the enterprise sees the client price (which already includes
  // Glimmora's margin — never disclosed as a separate "platform fee" line) plus
  // 18% GST on top. invoice.totalMinor is the client price excl. GST.
  const GST_RATE = 0.18;
  const clientPriceMinor = invoice.totalMinor;
  const gstMinor = Math.round(clientPriceMinor * GST_RATE);
  return (
    <dl className="divide-y divide-white/60 -mx-5 sm:-mx-6">
      <TotalRow label="Amount" value={fmtINR(clientPriceMinor)} />
      <TotalRow label="GST (18%)" value={fmtINR(gstMinor)} />
      <TotalRow label="Total due" value={fmtINR(clientPriceMinor + gstMinor)} emphasis />
    </dl>
  );
}

export function PaymentSection({ invoice }: { invoice: InvoiceDetail }) {
  return (
    <dl className="grid grid-cols-1 gap-y-4">
      <div>
        <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
          Method
        </dt>
        <dd className="mt-1 font-body text-[13px] text-foreground leading-snug">
          {invoice.paymentMethod}
        </dd>
      </div>
      <div>
        <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
          Reference
        </dt>
        <dd className="mt-1 font-body text-[13px] text-foreground">
          {invoice.paymentReference ? (
            <span className="font-mono tabular-nums">{invoice.paymentReference}</span>
          ) : (
            <span className="text-text-tertiary italic">— not yet paid</span>
          )}
        </dd>
      </div>
    </dl>
  );
}

function Fact({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12.5px] tabular-nums",
          capitalize && "capitalize",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function TotalRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-2.5 min-h-[44px]">
      <dt
        className={cn(
          "font-body text-[12.5px]",
          emphasis ? "font-semibold text-foreground" : "text-text-secondary",
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "tabular-nums shrink-0",
          emphasis ? "font-display text-[15px] font-semibold text-foreground" : "font-mono text-[12.5px] text-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
