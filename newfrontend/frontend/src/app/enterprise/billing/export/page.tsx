"use client";

/**
 * Billing export — de-glassed solid form.
 * DASH_CARD sections: Time range / Scope / Format / ERP destination.
 * Gradient primary action, solid secondary Cancel.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileDown } from "lucide-react";
import { downloadBillingCsv, BillingApiError } from "@/lib/api/enterprise-billing";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { primaryBtnClass, primaryStyle, secondaryBtnClass } from "@/app/admin/_shell/aurora-ui";

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
          Enterprise · Finance · Export
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Export billing
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-secondary">
          Configure a time window, select data scopes, pick a format, then download.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Form column */}
        <div className="space-y-4">

          {/* Time range */}
          <section className={cn(DASH_CARD, "overflow-hidden")}>
            <SectionHeader title="Time range" />
            <div className="px-5 py-4 space-y-1">
              <RadioRow value="month" current={windowKey} onChange={setWindowKey} label="This month" />
              <RadioRow value="quarter" current={windowKey} onChange={setWindowKey} label="This quarter" />
              <RadioRow value="ytd" current={windowKey} onChange={setWindowKey} label="Year to date" />
            </div>
          </section>

          {/* Scope */}
          <section className={cn(DASH_CARD, "overflow-hidden")}>
            <SectionHeader title="Scope" />
            <div className="px-5 py-4 space-y-1">
              <CheckRow checked={scopeInvoices} onChange={setScopeInvoices} label="Invoices" />
              <CheckRow checked={scopePayouts} onChange={setScopePayouts} label="Payouts" />
              <CheckRow checked={scopePerTask} onChange={setScopePerTask} label="Per-task ledger" hint="Phase 2" disabled />
              <CheckRow checked={scopeAudit} onChange={setScopeAudit} label="Audit events" hint="Use /enterprise/audit export instead" disabled />
            </div>
          </section>

          {/* Format */}
          <section className={cn(DASH_CARD, "overflow-hidden")}>
            <SectionHeader title="Format" />
            <div className="px-5 py-4 space-y-1">
              <RadioRow value="csv" current={format} onChange={setFormat} label="CSV" />
              <RadioRow value="pdf" current={format} onChange={setFormat} label="PDF" hint="Phase 2" />
              <RadioRow value="json" current={format} onChange={setFormat} label="JSON" hint="Phase 2" />
            </div>
          </section>

          {/* ERP destination */}
          <section className={cn(DASH_CARD, "overflow-hidden")}>
            <SectionHeader title="ERP destination" />
            <div className="px-5 py-4 space-y-1">
              <RadioRow value="download" current={destination} onChange={setDestination} label="Download only" />
              <RadioRow value="erp" current={destination} onChange={setDestination} label="Push to ERP via configured integration" hint="Phase 2" />
            </div>
          </section>

        </div>

        {/* Actions + feedback column */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <section className={cn(DASH_CARD, "overflow-hidden")}>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-white shrink-0"
                  style={GLASS_GRADIENT}
                  aria-hidden
                >
                  <FileDown className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-display text-[14px] font-bold text-foreground tracking-[-0.01em]">
                    Ready to export
                  </p>
                  <p className="font-body text-[12px] text-text-tertiary mt-0.5">
                    {scopeInvoices && scopePayouts
                      ? "Invoices + Payouts"
                      : scopeInvoices
                        ? "Invoices only"
                        : scopePayouts
                          ? "Payouts only"
                          : "No scope selected"}{" "}
                    · {windowKey === "month" ? "This month" : windowKey === "quarter" ? "This quarter" : "Year to date"} · {format.toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onGenerate}
                disabled={running}
                className={cn(primaryBtnClass, "w-full h-10 text-[14px]")}
                style={primaryStyle}
              >
                <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
                {running ? "Generating…" : "Generate & download"}
              </button>

              <Link
                href="/enterprise/billing"
                className={cn(secondaryBtnClass, "w-full h-9 text-[13px] justify-center")}
              >
                Cancel
              </Link>
            </div>
          </section>

          {msg && (
            <div className="rounded-lg border border-[var(--color-success-border)] bg-[var(--color-success-subtle)] px-4 py-3">
              <p className="font-body text-[12.5px] text-[var(--color-success-text)] font-medium">
                Export complete
              </p>
              <p className="mt-0.5 font-body text-[12px] text-[var(--color-success-text)] opacity-80 leading-relaxed">
                {msg}
              </p>
            </div>
          )}

          {err && (
            <div className="rounded-lg border border-[var(--color-error-border)] bg-[var(--color-error-subtle)] px-4 py-3">
              <p className="font-body text-[12.5px] text-[var(--color-error-text)] font-medium">
                Error
              </p>
              <p className="mt-0.5 font-body text-[12px] text-[var(--color-error-text)] opacity-80 leading-relaxed">
                {err}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── primitives ── */

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-5 py-3 border-b border-stroke-subtle">
      <h2 className="font-display text-[13.5px] font-bold text-foreground tracking-[-0.01em]">
        {title}
      </h2>
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
  const active = value === current;
  return (
    <label
      className={cn(
        "flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors duration-fast cursor-pointer",
        active ? "bg-bg-subtle" : "hover:bg-bg-subtle/60",
      )}
    >
      <input
        type="radio"
        checked={active}
        onChange={() => onChange(value)}
        className="h-3.5 w-3.5 accent-[var(--c-violet-500)] shrink-0"
      />
      <span className="font-body text-[13px] text-foreground">{label}</span>
      {hint && (
        <span className="font-body text-[11px] text-text-tertiary italic ml-auto">
          {hint}
        </span>
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
        "flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors duration-fast",
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-bg-subtle/60 cursor-pointer",
        checked && !disabled ? "bg-bg-subtle" : "",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-3.5 w-3.5 accent-[var(--c-violet-500)] shrink-0"
      />
      <span className="font-body text-[13px] text-foreground">{label}</span>
      {hint && (
        <span className="font-body text-[11px] text-text-tertiary italic ml-auto">
          {hint}
        </span>
      )}
    </label>
  );
}
