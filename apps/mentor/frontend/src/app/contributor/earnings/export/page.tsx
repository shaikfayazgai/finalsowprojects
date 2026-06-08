"use client";

/**
 * Export earnings — spec doc 01 §5.L.7.
 * Time range radio + format radio (CSV / PDF) + Include checkboxes.
 * Mock: 'Generate file' shows a success message with a fake filename.
 */

import * as React from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Range = "30d" | "fy" | "ly" | "all";
type Format = "csv" | "pdf";

const RANGES: { value: Range; label: string }[] = [
  { value: "30d", label: "Last 30 days" },
  { value: "fy", label: "This fiscal year" },
  { value: "ly", label: "Last fiscal year" },
  { value: "all", label: "All time" },
];

export default function ExportEarningsPage() {
  const [range, setRange] = React.useState<Range>("30d");
  const [format, setFormat] = React.useState<Format>("csv");
  const [includePaid, setIncludePaid] = React.useState(true);
  const [includePending, setIncludePending] = React.useState(true);
  const [includeFailed, setIncludeFailed] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [resultMsg, setResultMsg] = React.useState<string | null>(null);

  const onGenerate = async () => {
    setResultMsg(null);
    setGenerating(true);
    await new Promise((r) => setTimeout(r, 800));
    setGenerating(false);
    const ts = new Date().toISOString().slice(0, 10);
    setResultMsg(`earnings-${range}-${ts}.${format}`);
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Export earnings
        </h1>
      </header>

      <section className="rounded-lg border border-stroke bg-surface shadow-xs">
        <div className="p-4 space-y-4">
          <Field label="Time range">
            <div className="grid grid-cols-2 gap-1.5">
              {RANGES.map((r) => (
                <label key={r.value} className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="range"
                    checked={range === r.value}
                    onChange={() => setRange(r.value)}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  {r.label}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Format">
            <div className="flex items-center gap-4">
              {(["csv", "pdf"] as Format[]).map((f) => (
                <label key={f} className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    checked={format === f}
                    onChange={() => setFormat(f)}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  {f === "csv" ? "CSV (spreadsheet)" : "PDF (statement)"}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Include">
            <div className="space-y-1.5">
              <Check label="Paid payouts" checked={includePaid} onChange={setIncludePaid} />
              <Check label="Pending / eligible" checked={includePending} onChange={setIncludePending} />
              <Check label="Failed / reversed" checked={includeFailed} onChange={setIncludeFailed} />
            </div>
          </Field>

          {resultMsg && (
            <div className="rounded-md border border-success-border bg-success-subtle px-3 py-2 flex items-center justify-between gap-3">
              <p className="font-body text-[12px] text-success-text">
                Ready: <span className="font-mono text-[11.5px]">{resultMsg}</span>
              </p>
              <button
                type="button"
                onClick={() => setResultMsg(null)}
                className="font-body text-[11.5px] font-semibold text-success-text hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
        <footer className="flex items-center justify-end gap-2 px-4 py-3 border-t border-stroke-subtle bg-bg-subtle">
          <Link
            href="/contributor/earnings"
            className="inline-flex items-center h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating || (!includePaid && !includePending && !includeFailed)}
            className={cn(
              "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
              "bg-brand text-on-brand",
              "font-body text-[13px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            {generating ? "Generating…" : "Generate file"}
          </button>
        </footer>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-brand rounded-sm"
      />
      {label}
    </label>
  );
}
