"use client";

/**
 * Billing overview — finance workspace for the current period.
 *
 * Period summary (DashboardSection) + invoice workspace panel +
 * payout pipeline snapshot. Real payout totals from API; invoices mock-backed.
 */

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Download } from "lucide-react";
import {
  listInvoicesMock,
  type InvoiceSummary,
} from "@/lib/billing/invoices-mock";
import {
  listTenantPayouts,
  downloadBillingCsv,
  BillingApiError,
} from "@/lib/api/enterprise-billing";
import type { PayoutDetail, PayoutStatus } from "@/lib/payouts/types";
import { DashboardSection } from "@/components/meridian/dashboard";
import { Skeleton } from "@/components/meridian";
import {
  BillingInvoicesPanel,
  BillingInvoicesPanelSkeleton,
} from "./_components/billing-invoices-panel";
import { cn } from "@/lib/utils/cn";

const PLATFORM_FEE_PCT = 0.15;

function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

function thisPeriodLabel(): string {
  return new Date().toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
}

function payoutBucket(status: PayoutStatus): "eligible" | "pending" | "paid" | "reversed" {
  switch (status) {
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

function payoutMeta(p: PayoutDetail): string {
  const bucket = payoutBucket(p.status);
  const labels: Record<string, string> = {
    eligible: "Eligible for release",
    pending: "In flight",
    paid: "Paid",
    reversed: "Reversed",
  };
  return `${p.id} · ${labels[bucket]} · ${fmtINR(p.amountMinor)}`;
}

export default function BillingOverviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["enterprise-billing", "payouts"],
    queryFn: () => listTenantPayouts(),
  });

  const [invoices, setInvoices] = React.useState<InvoiceSummary[]>(() => listInvoicesMock());
  const [downloadMsg, setDownloadMsg] = React.useState<string | null>(null);
  const [downloadError, setDownloadError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const refresh = () => setInvoices(listInvoicesMock());
    window.addEventListener("glimmora:invoice-payment", refresh);
    return () => window.removeEventListener("glimmora:invoice-payment", refresh);
  }, []);

  const totals = React.useMemo(() => {
    const acc = { invoiced: 0, paid: 0, pending: 0, payouts: 0 };
    for (const p of data?.items ?? []) {
      acc.payouts += p.amountMinor;
      const grossed = Math.round(p.amountMinor / (1 - PLATFORM_FEE_PCT));
      acc.invoiced += grossed;
      if (p.status === "sent") acc.paid += grossed;
      else acc.pending += grossed;
    }
    const platformFees = Math.round(acc.invoiced * PLATFORM_FEE_PCT);
    return { ...acc, platformFees };
  }, [data]);

  const payoutSnapshot = React.useMemo(() => {
    const items = data?.items ?? [];
    let eligible = 0;
    let pending = 0;
    let eligibleMinor = 0;
    for (const p of items) {
      const b = payoutBucket(p.status);
      if (b === "eligible") {
        eligible++;
        eligibleMinor += p.amountMinor;
      } else if (b === "pending") pending++;
    }
    const attention = items
      .filter((p) => payoutBucket(p.status) === "eligible" || payoutBucket(p.status) === "pending")
      .slice(0, 4);
    return { eligible, pending, eligibleMinor, attention };
  }, [data]);

  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const overdueTotal = invoices
    .filter((i) => i.status === "overdue")
    .reduce((s, i) => s + i.amountMinor, 0);

  const onExportCsv = async () => {
    setDownloadMsg(null);
    setDownloadError(null);
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const to = now.toISOString();
    try {
      const r = await downloadBillingCsv({ kind: "billing", from, to });
      setDownloadMsg(`Downloaded ${r.filename} · ${r.rowCount} rows`);
    } catch (e) {
      setDownloadError(
        e instanceof BillingApiError ? e.message : (e as Error).message,
      );
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Finance
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Billing
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
          Current period:{" "}
          <span className="font-medium text-text-secondary">{thisPeriodLabel()}</span>
        </p>
        <RecordLinks />
      </header>

      {overdueCount > 0 && (
        <ContextBanner tone="error" title={`${overdueCount} overdue invoice${overdueCount === 1 ? "" : "s"}`}>
          {fmtINR(overdueTotal)} outstanding — review and mark paid to keep contributor payouts on schedule.
          <Link
            href="/enterprise/billing?inv=overdue"
            className="ml-1 font-semibold text-error-text underline underline-offset-2"
          >
            View overdue
          </Link>
        </ContextBanner>
      )}

      {payoutSnapshot.eligible > 0 && (
        <ContextBanner tone="brand" title={`${payoutSnapshot.eligible} payout${payoutSnapshot.eligible === 1 ? "" : "s"} ready to release`}>
          {fmtINR(payoutSnapshot.eligibleMinor)} eligible this period.
          <Link
            href="/enterprise/billing/payouts?status=eligible"
            className="ml-1 font-semibold text-brand underline underline-offset-2"
          >
            Open payouts
          </Link>
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
            {error instanceof BillingApiError ? error.message : "Failed to load payout data"}
          </p>
        </div>
      )}

      <DashboardSection
        title="Period summary"
        description={`Invoicing and payout totals for ${thisPeriodLabel()}`}
        actions={
          <button
            type="button"
            onClick={() => void onExportCsv()}
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-md",
              "bg-brand text-on-brand font-body text-[12px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
            )}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Export CSV
          </button>
        }
      >
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
          <PeriodStat label="Invoiced" value={isLoading ? null : fmtINR(totals.invoiced)} />
          <PeriodStat label="Paid" value={isLoading ? null : fmtINR(totals.paid)} highlight />
          <PeriodStat label="Pending" value={isLoading ? null : fmtINR(totals.pending)} />
          <PeriodStat
            label="Contributor payouts"
            value={isLoading ? null : fmtINR(totals.payouts)}
            caption="committed"
          />
          <PeriodStat
            label="Platform fees"
            value={isLoading ? null : fmtINR(totals.platformFees)}
            caption={`${Math.round(PLATFORM_FEE_PCT * 100)}% of invoiced`}
          />
          <PeriodStat
            label="Payouts in flight"
            value={isLoading ? null : String(payoutSnapshot.pending)}
            caption="requested or processing"
          />
        </dl>
      </DashboardSection>

      <React.Suspense fallback={<BillingInvoicesPanelSkeleton />}>
        <BillingInvoicesPanel />
      </React.Suspense>

      <DashboardSection
        title="Payout pipeline"
        description={
          isLoading
            ? "Loading contributor payouts…"
            : `${payoutSnapshot.eligible} eligible · ${payoutSnapshot.pending} in flight`
        }
        viewAllHref="/enterprise/billing/payouts"
        viewAllLabel="Payouts ledger"
      >
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full max-w-lg rounded" />
            ))}
          </div>
        ) : payoutSnapshot.attention.length === 0 ? (
          <p className="font-body text-[13px] text-text-secondary">
            No payouts awaiting action —{" "}
            <Link href="/enterprise/billing/payouts" className="text-text-link font-medium hover:underline">
              view full ledger
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-stroke-subtle -mx-5">
            {payoutSnapshot.attention.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/enterprise/billing/payouts/${p.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-2.5 min-h-[44px] hover:bg-bg-subtle/50 transition-colors duration-fast"
                >
                  <span className="font-body text-[13px] font-medium text-foreground truncate min-w-0">
                    {p.contributorId.replace(/^u-/, "").replace(/^\w/, (c) => c.toUpperCase())}
                  </span>
                  <span className="font-body text-[11px] text-text-tertiary shrink-0 truncate max-w-[55%] text-right">
                    {payoutMeta(p)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/billing/payouts"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Payouts
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/billing/rate-cards"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Rate cards
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/billing/invoices"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        All invoices
      </Link>
    </p>
  );
}

function PeriodStat({
  label,
  value,
  caption,
  highlight,
}: {
  label: string;
  value: React.ReactNode | null;
  caption?: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          highlight ? "text-success-text" : "text-foreground",
        )}
      >
        {value === null ? <Skeleton className="h-6 w-24 rounded inline-block" /> : value}
      </dd>
      {caption && (
        <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{caption}</p>
      )}
    </div>
  );
}

function ContextBanner({
  tone,
  title,
  children,
}: {
  tone: "error" | "brand";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "error"
          ? "border-error-border bg-error-subtle"
          : "border-brand/30 bg-brand-subtle/20",
      )}
    >
      <p
        className={cn(
          "font-body text-[13px] font-semibold flex items-center gap-1.5",
          tone === "error" ? "text-error-text" : "text-foreground",
        )}
      >
        {tone === "error" && (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        )}
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}
