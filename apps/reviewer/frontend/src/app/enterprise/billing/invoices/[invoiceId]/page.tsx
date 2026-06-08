"use client";

/**
 * Invoice detail — single-column record view.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Search,
  Shield,
} from "lucide-react";
import type { InvoiceDetail } from "@/lib/billing/invoices-mock";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  fmtINR,
  fmtDate,
  InvoiceFactsSection,
  LineItemsSection,
  PaymentSection,
  statusPillCls,
  TotalsSection,
} from "./components/detail-sections";
import { MarkAsPaidModal } from "./components/mark-as-paid-modal";
import { cn } from "@/lib/utils/cn";

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params?.invoiceId ?? "";
  const [overlayVersion, setOverlayVersion] = React.useState(0);
  const [lineSearch, setLineSearch] = React.useState("");
  const [payOpen, setPayOpen] = React.useState(false);

  // No invoices API yet — without a real fetch there is no invoice to show, so
  // the not-found state below renders until the endpoint ships.
  const invoice = React.useMemo<InvoiceDetail | undefined>(
    () => undefined,
    [invoiceId, overlayVersion],
  );

  React.useEffect(() => {
    const onChange = () => setOverlayVersion((n) => n + 1);
    window.addEventListener("glimmora:invoice-payment", onChange);
    return () => window.removeEventListener("glimmora:invoice-payment", onChange);
  }, []);

  if (!invoice) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            Invoice not found
            {invoiceId ? (
              <span className="block mt-1 font-mono text-[11px] opacity-80">{invoiceId}</span>
            ) : null}
          </p>
        </div>
      </div>
    );
  }

  const matchedLines = invoice.lineItems.filter((row) => {
    const needle = lineSearch.trim().toLowerCase();
    if (!needle) return true;
    return `${row.task} ${row.role} ${row.skillLevel}`.toLowerCase().includes(needle);
  });

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Finance · Invoice · {invoice.id}
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight tabular-nums">
            {fmtINR(invoice.amountMinor)}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
            <span
              className={cn(
                "inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold capitalize",
                statusPillCls(invoice.status),
              )}
            >
              {invoice.status}
              {invoice.paidAt ? ` · ${fmtDate(invoice.paidAt)}` : ""}
            </span>
            <span aria-hidden>·</span>
            <span className="font-medium text-text-secondary">{invoice.project}</span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {fmtDate(invoice.periodStart)} – {fmtDate(invoice.periodEnd)}
            </span>
          </div>
          <RecordLinks />
        </div>

        {invoice.status !== "paid" && (
          <button
            type="button"
            onClick={() => setPayOpen(true)}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shrink-0",
              "bg-brand text-on-brand font-body text-[13px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast shadow-sm",
            )}
          >
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            Mark as paid
          </button>
        )}
      </header>

      {invoice.status === "overdue" && (
        <ContextBanner tone="error" title="Overdue — payment required">
          This invoice is past due. Mark as paid once transfer completes to keep contributor payouts
          on schedule.
        </ContextBanner>
      )}

      {invoice.status === "pending" && (
        <ContextBanner tone="brand" title="Awaiting payment">
          Payment is expected for this billing period. Record payment when the transfer clears.
        </ContextBanner>
      )}

      {invoice.status === "paid" && (
        <ContextBanner tone="neutral" title="Paid in full">
          {invoice.paymentReference ? (
            <>
              Recorded with reference{" "}
              <span className="font-mono tabular-nums">{invoice.paymentReference}</span>
              {invoice.paidAt ? ` on ${fmtDate(invoice.paidAt)}` : ""}.
            </>
          ) : (
            "This invoice has been settled for the billing period."
          )}
        </ContextBanner>
      )}

      <DashboardSection title="Invoice details" description="Project and billing period">
        <InvoiceFactsSection invoice={invoice} />
      </DashboardSection>

      <DashboardSection
        title="Line items"
        description={
          lineSearch.trim()
            ? `${matchedLines.length} of ${invoice.lineItems.length} items`
            : `${invoice.lineItems.length} task${invoice.lineItems.length === 1 ? "" : "s"} billed`
        }
        actions={
          invoice.lineItems.length > 3 ? (
            <div className="relative w-44">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none"
                strokeWidth={2}
                aria-hidden
              />
              <input
                type="search"
                value={lineSearch}
                onChange={(e) => setLineSearch(e.target.value)}
                placeholder="Filter items…"
                className={cn(
                  "w-full h-8 pl-8 pr-2 rounded-md border border-stroke bg-surface",
                  "font-body text-[12px] text-foreground placeholder:text-text-disabled",
                  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                )}
              />
            </div>
          ) : undefined
        }
      >
        <LineItemsSection invoice={invoice} search={lineSearch} />
      </DashboardSection>

      <DashboardSection title="Totals" description="Amount due for this period">
        <TotalsSection invoice={invoice} />
      </DashboardSection>

      <DashboardSection
        title="Payment"
        description={
          invoice.status === "paid" ? "Settlement recorded" : "Expected payment method"
        }
      >
        <PaymentSection invoice={invoice} />
      </DashboardSection>

      <DashboardSection
        title="Documents & audit"
        description="Export and compliance artifacts"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StubAction icon={<FileText className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}>
              PDF
            </StubAction>
            <StubAction icon={<Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}>
              CSV
            </StubAction>
            <StubAction icon={<Shield className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}>
              Audit trail
            </StubAction>
          </div>
        }
      >
        <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
          Document exports and audit history will attach here when the invoices API ships. Line
          items above reflect the current mock ledger.
        </p>
      </DashboardSection>

      <MarkAsPaidModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        invoiceId={invoice.id}
        totalLabel={fmtINR(invoice.totalMinor)}
        defaultMethod={invoice.paymentMethod}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/billing/invoices"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to invoices
    </Link>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/billing"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Billing overview
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
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
    </p>
  );
}

function ContextBanner({
  tone,
  title,
  children,
}: {
  tone: "error" | "brand" | "neutral";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "error"
          ? "border-error-border bg-error-subtle/80"
          : tone === "brand"
            ? "border-brand/30 bg-brand-subtle/20"
            : "border-stroke-subtle bg-bg-subtle/50",
      )}
    >
      <p
        className={cn(
          "font-body text-[13px] font-semibold text-foreground flex items-center gap-1.5",
          tone === "error" && "text-error-text",
        )}
      >
        {tone === "error" && (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-error-text" strokeWidth={2} aria-hidden />
        )}
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function StubAction({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled
      title="Phase 2"
      className={cn(
        "inline-flex items-center gap-1 h-8 px-2.5 rounded-md",
        "bg-surface border border-stroke",
        "font-body text-[12px] font-semibold text-text-tertiary",
        "opacity-60 cursor-not-allowed",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
