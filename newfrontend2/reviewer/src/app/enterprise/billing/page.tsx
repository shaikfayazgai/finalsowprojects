"use client";

/**
 * Billing overview — finance cockpit for the current period.
 *   Money KPIs (invoiced · paid · pending · payouts ready) →
 *   invoices panel → payout-pipeline section.
 */

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, ChevronRight, Download, FileText, Receipt, Wallet } from "lucide-react";
import { listInvoicesMock, type InvoiceSummary } from "@/lib/billing/invoices-mock";
import { listTenantPayouts, downloadBillingCsv, BillingApiError } from "@/lib/api/enterprise-billing";
import type { PayoutDetail, PayoutStatus } from "@/lib/payouts/types";
import { Skeleton } from "@/components/meridian";
import { BillingInvoicesPanel, BillingInvoicesPanelSkeleton } from "./_components/billing-invoices-panel";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, primaryBtnClass, primaryStyle, type Tone } from "@/app/admin/_shell/aurora-ui";

const PLATFORM_FEE_PCT = 0.15;

function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}
function thisPeriodLabel(): string {
  return new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
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

const BUCKET_META: Record<ReturnType<typeof payoutBucket>, { label: string; tone: Tone }> = {
  eligible: { label: "Ready", tone: "ai" },
  pending: { label: "In flight", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  reversed: { label: "Reversed", tone: "error" },
};

function Section({ title, description, action, children }: { title: string; description?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 font-body text-[12px] text-text-tertiary">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function BillingOverviewPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["enterprise-billing", "payouts"], queryFn: () => listTenantPayouts() });

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
    const attention = items.filter((p) => payoutBucket(p.status) === "eligible" || payoutBucket(p.status) === "pending").slice(0, 5);
    return { eligible, pending, eligibleMinor, attention };
  }, [data]);

  const overdueCount = invoices.filter((i) => i.status === "overdue").length;
  const overdueTotal = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amountMinor, 0);

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
      setDownloadError(e instanceof BillingApiError ? e.message : (e as Error).message);
    }
  };

  const money = (v: number) => (isLoading ? "—" : fmtINR(v));

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">Enterprise · Finance</p>
          <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">Billing</h1>
          <p className="mt-2 font-body text-[12.5px] text-text-tertiary">
            Current period: <span className="font-medium text-text-secondary">{thisPeriodLabel()}</span>
          </p>
          <RecordLinks />
        </div>
        <button type="button" onClick={() => void onExportCsv()} className={cn(primaryBtnClass, "shrink-0 px-5")} style={primaryStyle}>
          <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
          Export CSV
        </button>
      </header>

      {/* Alerts */}
      {overdueCount > 0 ? (
        <SlimAlert tone="error" title={`${overdueCount} overdue invoice${overdueCount === 1 ? "" : "s"}`} href="/enterprise/billing?inv=overdue" cta="View overdue">
          {fmtINR(overdueTotal)} outstanding — mark paid to keep contributor payouts on schedule.
        </SlimAlert>
      ) : null}
      {payoutSnapshot.eligible > 0 ? (
        <SlimAlert tone="ai" title={`${payoutSnapshot.eligible} payout${payoutSnapshot.eligible === 1 ? "" : "s"} ready to release`} href="/enterprise/billing/payouts?status=eligible" cta="Open payouts">
          {fmtINR(payoutSnapshot.eligibleMinor)} eligible this period.
        </SlimAlert>
      ) : null}

      {downloadMsg || downloadError ? (
        <div className={cn("rounded-lg border px-4 py-3 font-body text-[12.5px]", downloadError ? "border-error-border bg-error-subtle text-error-text" : "border-success-border bg-success-subtle text-success-text")}>
          {downloadError ?? downloadMsg}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{error instanceof BillingApiError ? error.message : "Failed to load payout data"}</p>
        </div>
      ) : null}

      {/* Money KPIs */}
      <section aria-label="Period summary" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Invoiced" value={money(totals.invoiced)} icon={Receipt} hint={thisPeriodLabel()} />
        <StatCard label="Paid" value={money(totals.paid)} icon={FileText} hint="received" hintTone="success" />
        <StatCard label="Pending" value={money(totals.pending)} icon={FileText} hint={!isLoading && totals.pending > 0 ? "awaiting payment" : undefined} hintTone={totals.pending > 0 ? "warning" : "neutral"} />
        <StatCard label="Payouts ready" value={isLoading ? "—" : String(payoutSnapshot.eligible)} icon={Wallet} hint={isLoading ? undefined : fmtINR(payoutSnapshot.eligibleMinor)} hintTone={payoutSnapshot.eligible > 0 ? "ai" : "neutral"} />
      </section>
      {!isLoading ? (
        <p className="-mt-1 font-body text-[11.5px] text-text-tertiary">
          Contributor payouts committed <span className="font-mono text-text-secondary">{fmtINR(totals.payouts)}</span> · platform fees <span className="font-mono text-text-secondary">{fmtINR(totals.platformFees)}</span> ({Math.round(PLATFORM_FEE_PCT * 100)}%) · {payoutSnapshot.pending} in flight
        </p>
      ) : null}

      <React.Suspense fallback={<BillingInvoicesPanelSkeleton />}>
        <BillingInvoicesPanel />
      </React.Suspense>

      {/* Payout pipeline */}
      <Section
        title="Payout pipeline"
        description={isLoading ? "Loading contributor payouts…" : `${payoutSnapshot.eligible} eligible · ${payoutSnapshot.pending} in flight`}
        action={
          <Link href="/enterprise/billing/payouts" className="inline-flex items-center gap-1 font-body text-[12.5px] font-semibold text-text-link hover:underline underline-offset-2 shrink-0">
            Payouts ledger
          </Link>
        }
      >
        {isLoading ? (
          <div className="px-5 sm:px-6 py-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full max-w-lg rounded" />
            ))}
          </div>
        ) : payoutSnapshot.attention.length === 0 ? (
          <p className="px-5 sm:px-6 py-8 font-body text-[13px] text-text-secondary text-center">
            No payouts awaiting action —{" "}
            <Link href="/enterprise/billing/payouts" className="text-text-link font-semibold hover:underline underline-offset-2">
              view full ledger
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-stroke-subtle">
            {payoutSnapshot.attention.map((p) => (
              <PayoutRow key={p.id} payout={p} />
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

function PayoutRow({ payout: p }: { payout: PayoutDetail }) {
  const bucket = payoutBucket(p.status);
  const meta = BUCKET_META[bucket];
  const name = p.contributorId.replace(/^u-/, "").replace(/^\w/, (c) => c.toUpperCase());

  return (
    <li>
      <Link href={`/enterprise/billing/payouts/${p.id}`} className="group flex items-center gap-4 px-5 sm:px-6 py-3 min-h-[48px] hover:bg-bg-subtle/60 transition-colors">
        <span className="font-body text-[13px] font-semibold text-foreground truncate min-w-0 flex-1">{name}</span>
        <span className="font-mono text-[12.5px] tabular-nums text-text-secondary shrink-0">{fmtINR(p.amountMinor)}</span>
        <Chip tone={meta.tone} dot={false}>{meta.label}</Chip>
        <ChevronRight className="h-4 w-4 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity shrink-0" strokeWidth={2} aria-hidden />
      </Link>
    </li>
  );
}

function SlimAlert({ tone, title, href, cta, children }: { tone: Tone; title: string; href: string; cta: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors" style={{ background: tone === "error" ? "var(--color-error-subtle)" : "var(--color-ai-surface)", borderColor: tone === "error" ? "var(--color-error-border)" : "var(--color-ai-border)" }}>
      {tone === "error" ? <AlertTriangle className="h-4 w-4 shrink-0 text-error-text" strokeWidth={2} aria-hidden /> : <Wallet className="h-4 w-4 shrink-0 text-[var(--color-ai-text)]" strokeWidth={2} aria-hidden />}
      <span className="min-w-0 flex-1 font-body text-[12.5px] text-text-secondary">
        <span className="font-semibold text-foreground">{title}</span> — {children}
      </span>
      <span className="hidden sm:inline font-body text-[12px] font-semibold text-text-secondary group-hover:text-foreground shrink-0">{cta}</span>
      <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-foreground shrink-0" strokeWidth={2} aria-hidden />
    </Link>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link href="/enterprise/billing/payouts" className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors">Payouts</Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link href="/enterprise/billing/rate-cards" className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors">Rate cards</Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link href="/enterprise/billing/invoices" className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors">All invoices</Link>
    </p>
  );
}
