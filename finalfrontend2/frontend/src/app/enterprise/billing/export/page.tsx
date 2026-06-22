"use client";

/**
 * Billing export — spec doc 02 §5.G.9.
 *
 * Dedicated export page: time range + scope checkboxes + format radios +
 * ERP destination. Wires to the existing /api/billing/export endpoint
 * (currently kind=invoices|payouts). Per-task ledger and audit-event
 * scopes are Phase 2.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { downloadBillingCsv, BillingApiError } from "@/lib/api/enterprise-billing";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import { primaryBtnClass, primaryStyle, ghostBtnClass } from "@/app/admin/_shell/aurora-ui";

type Window = "month" | "quarter" | "ytd";

function windowRange(w: Window): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString();
  let from: Date;
  if (w === "month") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (w === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    from = new Date(now.getFullYear(), q * 3, 1);
  } else {
    from = new Date(now.getFullYear(), 0, 1);
  }
  return { from: from.toISOString(), to };
}

export default function BillingExportPage() {
  const [windowKey, setWindowKey] = React.useState<Window>("month");
  const [scopeInvoices, setScopeInvoices] = React.useState(true);
  const [scopePayouts, setScopePayouts] = React.useState(true);
  const [scopePerTask, setScopePerTask] = React.useState(false);
  const [scopeAudit, setScopeAudit] = React.useState(false);
  const [format, setFormat] = React.useState<"csv" | "pdf" | "json">("csv");
  const [destination, setDestination] = React.useState<"download" | "erp">("download");

  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);

  const onGenerate = async () => {
    setMsg(null);
    setErr(null);
    if (destination === "erp") {
      setErr("ERP push is configured under Settings → Integrations. Phase 2.");
      return;
    }
    if (format !== "csv") {
      setErr("Only CSV is available in Phase 1. PDF and JSON arrive in Phase 2.");
      return;
    }
    if (!scopeInvoices && !scopePayouts) {
      setErr("Select at least one scope (Invoices or Payouts).");
      return;
    }
    const { from, to } = windowRange(windowKey);
    setRunning(true);
    try {
      const results: string[] = [];
      if (scopeInvoices) {
        const r = await downloadBillingCsv({ kind: "billing", from, to });
        results.push(`Invoices: ${r.filename} · ${r.rowCount} rows`);
      }
      if (scopePayouts) {
        const r = await downloadBillingCsv({ kind: "payouts", from, to });
        results.push(`Payouts: ${r.filename} · ${r.rowCount} rows`);
      }
      setMsg(results.join(" · "));
    } catch (e) {
      setErr(e instanceof BillingApiError ? e.message : (e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/enterprise/billing"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:text-foreground hover:bg-white/50 transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          <span>Billing</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">Export</span>
      </nav>

      <header>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
          Enterprise · Billing
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Export billing
        </h1>
      </header>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <header className="px-4 py-2.5 border-b border-white/55">
          <h2 className="font-display text-[12.5px] font-semibold text-foreground">
            Time range
          </h2>
        </header>
        <div className="p-4 space-y-1.5">
          <RadioRow value="month" current={windowKey} onChange={setWindowKey} label="This month" />
          <RadioRow value="quarter" current={windowKey} onChange={setWindowKey} label="This quarter" />
          <RadioRow value="ytd" current={windowKey} onChange={setWindowKey} label="Year to date" />
        </div>
      </section>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <header className="px-4 py-2.5 border-b border-white/55">
          <h2 className="font-display text-[12.5px] font-semibold text-foreground">
            Scope
          </h2>
        </header>
        <div className="p-4 space-y-1.5">
          <CheckRow checked={scopeInvoices} onChange={setScopeInvoices} label="Invoices" />
          <CheckRow checked={scopePayouts} onChange={setScopePayouts} label="Payouts" />
          <CheckRow checked={scopePerTask} onChange={setScopePerTask} label="Per-task ledger" hint="Phase 2" disabled />
          <CheckRow checked={scopeAudit} onChange={setScopeAudit} label="Audit events" hint="Use /enterprise/audit export instead" disabled />
        </div>
      </section>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <header className="px-4 py-2.5 border-b border-white/55">
          <h2 className="font-display text-[12.5px] font-semibold text-foreground">
            Format
          </h2>
        </header>
        <div className="p-4 space-y-1.5">
          <RadioRow value="csv" current={format} onChange={setFormat} label="CSV" />
          <RadioRow value="pdf" current={format} onChange={setFormat} label="PDF" hint="Phase 2" />
          <RadioRow value="json" current={format} onChange={setFormat} label="JSON" hint="Phase 2" />
        </div>
      </section>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <header className="px-4 py-2.5 border-b border-white/55">
          <h2 className="font-display text-[12.5px] font-semibold text-foreground">
            ERP destination
          </h2>
        </header>
        <div className="p-4 space-y-1.5">
          <RadioRow value="download" current={destination} onChange={setDestination} label="Download only" />
          <RadioRow value="erp" current={destination} onChange={setDestination} label="Push to ERP via configured integration" hint="Phase 2" />
        </div>
      </section>

      {msg && (
        <div className="rounded-xl bg-success-subtle border border-success-border px-3 py-2 font-body text-[12px] text-success-text backdrop-blur">
          {msg}
        </div>
      )}
      {err && (
        <div className="rounded-xl bg-error-subtle border border-error-border px-3 py-2 font-body text-[12px] text-error-text backdrop-blur">
          {err}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/enterprise/billing"
          className={cn(ghostBtnClass, "h-9")}
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={onGenerate}
          disabled={running}
          className={cn(primaryBtnClass, "h-9")}
          style={primaryStyle}
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          {running ? "Generating…" : "Generate"}
        </button>
      </div>
    </div>
  );
}

function RadioRow<T extends string>({
  value,
  current,
  onChange,
  label,
  hint,
}: {
  value: T;
  current: T;
  onChange: (v: T) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/50 transition-colors duration-fast cursor-pointer">
      <input
        type="radio"
        checked={value === current}
        onChange={() => onChange(value)}
        className="h-3.5 w-3.5 accent-[var(--c-violet-500)]"
      />
      <span className="font-body text-[13px] text-foreground">{label}</span>
      {hint && (
        <span className="font-body text-[11px] text-text-tertiary italic">· {hint}</span>
      )}
    </label>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-lg transition-colors duration-fast",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/50 cursor-pointer",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-3.5 w-3.5 accent-[var(--c-violet-500)]"
      />
      <span className="font-body text-[13px] text-foreground">{label}</span>
      {hint && (
        <span className="font-body text-[11px] text-text-tertiary italic">· {hint}</span>
      )}
    </label>
  );
}
