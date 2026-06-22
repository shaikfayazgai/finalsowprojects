"use client";

/**
 * Invoice detail — scorecard cockpit + tabbed sections.
 *   Header → money scorecard (total · subtotal · GST · line items) →
 *   tabbed sections (line items · payment · details · documents).
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, AlertCircle, AlertTriangle, CheckCircle2, Download, FileText, ListChecks, Receipt, Search, Shield, Sigma, X } from "lucide-react";
import { getInvoiceMock, type InvoiceDetail } from "@/lib/billing/invoices-mock";
import { fmtINR, fmtDate, InvoiceFactsSection, LineItemsSection, PaymentSection, statusTone } from "./components/detail-sections";
import { MarkAsPaidModal } from "./components/mark-as-paid-modal";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, primaryBtnClass, primaryStyle, secondaryBtnClass, TONE, type Tone } from "@/app/admin/_shell/aurora-ui";

const GST_RATE = 0.18;
type TabKey = "lines" | "payment" | "details" | "documents";

const STATUS_LABEL: Record<string, string> = { paid: "Paid", overdue: "Overdue", pending: "Pending" };

function TabPill({ label, count, active, onClick }: { label: string; count?: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={active ? GLASS_GRADIENT : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
        active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
      )}
    >
      {label}
      {count != null ? (
        <span className={cn("inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums", active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary")}>
          {count}
        </span>
      ) : null}
    </button>
  );
}

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceId = params?.invoiceId ?? "";
  const [overlayVersion, setOverlayVersion] = React.useState(0);
  const [lineSearch, setLineSearch] = React.useState("");
  const [payOpen, setPayOpen] = React.useState(false);
  const [tab, setTab] = React.useState<TabKey>("lines");

  const invoice: InvoiceDetail | undefined = React.useMemo(() => (invoiceId ? getInvoiceMock(invoiceId) : undefined), [invoiceId, overlayVersion]);

  React.useEffect(() => {
    const onChange = () => setOverlayVersion((n) => n + 1);
    window.addEventListener("glimmora:invoice-payment", onChange);
    return () => window.removeEventListener("glimmora:invoice-payment", onChange);
  }, []);

  if (!invoice) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            Invoice not found
            {invoiceId ? <span className="block mt-1 font-mono text-[11px] opacity-80">{invoiceId}</span> : null}
          </p>
        </div>
      </div>
    );
  }

  const clientPrice = invoice.totalMinor;
  const gst = Math.round(clientPrice * GST_RATE);
  const totalDue = clientPrice + gst;
  const matchedLines = invoice.lineItems.filter((row) => {
    const needle = lineSearch.trim().toLowerCase();
    if (!needle) return true;
    return `${row.task} ${row.role} ${row.skillLevel}`.toLowerCase().includes(needle);
  });

  const alert: { tone: Tone; title: string; body: React.ReactNode } | null =
    invoice.status === "overdue"
      ? { tone: "error", title: "Overdue — payment required", body: "This invoice is past due. Mark as paid once the transfer completes to keep contributor payouts on schedule." }
      : invoice.status === "pending"
        ? { tone: "ai", title: "Awaiting payment", body: "Payment is expected for this billing period. Record payment when the transfer clears." }
        : invoice.paymentReference
          ? { tone: "success", title: "Paid in full", body: <>Recorded with reference <span className="font-mono tabular-nums">{invoice.paymentReference}</span>{invoice.paidAt ? ` on ${fmtDate(invoice.paidAt)}` : ""}.</> }
          : null;

  const TABS: Array<{ key: TabKey; label: string; count?: React.ReactNode }> = [
    { key: "lines", label: "Line items", count: invoice.lineItems.length },
    { key: "payment", label: "Payment" },
    { key: "details", label: "Details" },
    { key: "documents", label: "Documents" },
  ];

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      {/* Identity header */}
      <header className={cn(DASH_CARD, "p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between")}>
        <div className="flex items-start gap-4 min-w-0">
          <span className="grid place-items-center h-12 w-12 rounded-lg text-white shrink-0" style={GLASS_GRADIENT} aria-hidden>
            <Receipt className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">Finance · Invoice · {invoice.id}</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none truncate">{invoice.project}</h1>
              <Chip tone={statusTone(invoice.status)}>{STATUS_LABEL[invoice.status] ?? invoice.status}{invoice.paidAt ? ` · ${fmtDate(invoice.paidAt)}` : ""}</Chip>
            </div>
            <p className="mt-2 font-body text-[12px] text-text-tertiary tabular-nums">
              {fmtDate(invoice.periodStart)} – {fmtDate(invoice.periodEnd)}
            </p>
            <RecordLinks />
          </div>
        </div>

        {invoice.status !== "paid" ? (
          <button type="button" onClick={() => setPayOpen(true)} className={cn(primaryBtnClass, "shrink-0 px-5")} style={primaryStyle}>
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            Mark as paid
          </button>
        ) : null}
      </header>

      {/* Alert */}
      {alert ? (
        <div className="rounded-lg border px-4 py-3 flex items-start gap-2.5" style={{ background: TONE[alert.tone].soft, borderColor: TONE[alert.tone].border }}>
          {invoice.status === "overdue" ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-error-text" strokeWidth={2} aria-hidden /> : invoice.status === "paid" ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.success.text }} aria-hidden /> : <Receipt className="h-4 w-4 shrink-0 mt-0.5 text-[var(--color-ai-text)]" strokeWidth={2} aria-hidden />}
          <p className="font-body text-[12.5px] text-text-secondary">
            <span className="font-semibold text-foreground">{alert.title}</span> — {alert.body}
          </p>
        </div>
      ) : null}

      {/* Money scorecard */}
      <section aria-label="Invoice totals" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total due" value={fmtINR(totalDue)} icon={Receipt} hint="incl. GST" hintTone={invoice.status === "paid" ? "success" : invoice.status === "overdue" ? "error" : "warning"} />
        <StatCard label="Subtotal" value={fmtINR(clientPrice)} icon={Sigma} hint="before GST" />
        <StatCard label="GST" value={fmtINR(gst)} icon={FileText} hint="18%" />
        <StatCard label="Line items" value={invoice.lineItems.length} icon={ListChecks} hint="tasks billed" />
      </section>

      {/* Tabbed sections */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="border-b border-stroke-subtle px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <nav aria-label="Invoice sections" className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <TabPill key={t.key} label={t.label} count={t.count} active={tab === t.key} onClick={() => setTab(t.key)} />
            ))}
          </nav>
          {tab === "lines" && invoice.lineItems.length > 3 ? (
            <div className="relative w-44">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" strokeWidth={2} aria-hidden />
              <input
                type="search"
                value={lineSearch}
                onChange={(e) => setLineSearch(e.target.value)}
                placeholder="Filter items…"
                className="w-full h-8 pl-9 pr-2 rounded-lg bg-surface border border-stroke-subtle font-body text-[12px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]"
              />
            </div>
          ) : null}
        </div>

        <div className="px-5 sm:px-6 py-5">
          {tab === "lines" ? (
            <>
              {lineSearch.trim() ? <p className="mb-3 font-body text-[11.5px] text-text-tertiary">{matchedLines.length} of {invoice.lineItems.length} items</p> : null}
              <LineItemsSection invoice={invoice} search={lineSearch} />
            </>
          ) : null}
          {tab === "payment" ? <PaymentSection invoice={invoice} /> : null}
          {tab === "details" ? <InvoiceFactsSection invoice={invoice} /> : null}
          {tab === "documents" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StubAction icon={<FileText className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}>PDF</StubAction>
                <StubAction icon={<Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}>CSV</StubAction>
                <StubAction icon={<Shield className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}>Audit trail</StubAction>
              </div>
              <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
                Document exports and audit history will attach here when the invoices API ships. Line items reflect the current mock ledger.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <MarkAsPaidModal open={payOpen} onClose={() => setPayOpen(false)} invoiceId={invoice.id} totalLabel={fmtINR(invoice.totalMinor)} defaultMethod={invoice.paymentMethod} />
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/enterprise/billing/invoices" className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm">
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Back to invoices
    </Link>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link href="/enterprise/billing" className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors">Billing overview</Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link href="/enterprise/billing/payouts" className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors">Payouts</Link>
    </p>
  );
}

function StubAction({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button type="button" disabled title="Phase 2" className={cn(secondaryBtnClass, "h-8 px-2.5 text-[12px] opacity-60 cursor-not-allowed")}>
      {icon}
      {children}
    </button>
  );
}
