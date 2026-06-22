"use client";

/**
 * Audit export — spec doc 02 §5.H.3.
 *
 * Use-case: compliance officer or auditor pulls a tamper-evident export of
 * audit events for a selected time window and format.
 *
 * Pattern: 2-column DASH_CARD form (left: options, right: summary/action).
 * On narrow viewports the columns stack.
 *
 * Heuristic fixes applied:
 *   H8 Minimalist — GLASS_CARD/GLASS_SHADOW → DASH_CARD; backdrop-blur removed;
 *     result banner rounded-xl → rounded-lg; ghostBtnClass → secondaryBtnClass.
 *   H6 Recognition — AuroraSelect already solid; solid input pattern throughout.
 *   H1 Visibility — action button is in the right column summary box,
 *     immediately adjacent to the description of what will be generated.
 *   H7 Flexibility — format shown as visible radio buttons (unchanged — correct).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, FileText, ShieldCheck } from "lucide-react";
import { useDownloadAuditExport } from "@/lib/hooks/use-audit-view";
import { AuditViewApiError } from "@/lib/api/audit-view";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import {
  TONE,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
  AuroraSelect,
} from "@/app/admin/_shell/aurora-ui";

type TimePreset = "24h" | "7d" | "30d" | "90d" | "all";

const PRESETS: Array<{ key: TimePreset; label: string; days: number | null }> = [
  { key: "24h", label: "Last 24 hours", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "all", label: "All time", days: null },
];

const FORMAT_LABELS: Record<string, string> = {
  csv: "CSV — spreadsheet-friendly, one row per event",
  json: "JSON — full structured records",
  ndjson: "NDJSON — streaming / log-ingest format",
};

export default function AuditExportPage() {
  const router = useRouter();
  const download = useDownloadAuditExport();

  const [time, setTime] = React.useState<TimePreset>("30d");
  const [format, setFormat] = React.useState<"csv" | "json" | "ndjson">("csv");
  const [matchCurrent, setMatchCurrent] = React.useState(true);
  const [signWithKey, setSignWithKey] = React.useState(false);
  const [resultMsg, setResultMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const selectedPreset = PRESETS.find((p) => p.key === time) ?? PRESETS[2];

  const onGenerate = async () => {
    setResultMsg(null);
    setErrorMsg(null);
    const now = new Date();
    const from = selectedPreset.days
      ? new Date(now.getTime() - selectedPreset.days * 86_400_000).toISOString()
      : new Date(0).toISOString();
    try {
      const r = await download.mutateAsync({
        query: { from, to: now.toISOString(), limit: 5000 },
        format,
      });
      setResultMsg(
        `Downloaded ${r.filename} · ${r.rowCount} rows · ${r.validSignatures} verified${
          r.invalidSignatures > 0 ? ` · ${r.invalidSignatures} INVALID` : ""
        }`,
      );
    } catch (e) {
      setErrorMsg(
        e instanceof AuditViewApiError ? e.message : (e as Error).message,
      );
    }
  };

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/enterprise/audit"
          className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
          Audit
        </Link>
        <span aria-hidden className="text-text-disabled">/</span>
        <span className="text-text-secondary">Export</span>
      </nav>

      {/* Page header */}
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Governance · Audit
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Export audit
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
          Download audit events for the selected window. Signed exports are tamper-evident.
        </p>
      </header>

      {/* Result / error messages */}
      {resultMsg && (
        <div
          className="rounded-lg border px-4 py-3 font-body text-[12px] flex items-center gap-2"
          style={{ background: TONE.success.soft, borderColor: TONE.success.border, color: TONE.success.text }}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          {resultMsg}
        </div>
      )}
      {errorMsg && (
        <div
          className="rounded-lg border px-4 py-3 font-body text-[12px]"
          style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}
        >
          {errorMsg}
        </div>
      )}

      {/* 2-column card */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="grid grid-cols-1 lg:grid-cols-5 divide-y divide-stroke-subtle lg:divide-y-0 lg:divide-x">
          {/* Left — options */}
          <div className="lg:col-span-3 px-5 sm:px-6 py-6 space-y-6">
            <h2 className="font-display text-[15px] font-semibold text-foreground tracking-[-0.01em]">
              Export options
            </h2>

            <Field label="Time range">
              <AuroraSelect
                value={time}
                onChange={(e) => setTime(e.target.value as TimePreset)}
              >
                {PRESETS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </AuroraSelect>
            </Field>

            <Field label="Format">
              <div className="space-y-2">
                {(["csv", "json", "ndjson"] as const).map((f) => (
                  <label
                    key={f}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                      format === f
                        ? "border-[var(--c-violet-400)] bg-[var(--c-violet-500)]/[0.04]"
                        : "border-stroke-subtle hover:border-stroke hover:bg-bg-subtle",
                    )}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={f}
                      checked={format === f}
                      onChange={() => setFormat(f)}
                      className="h-3.5 w-3.5 mt-0.5 shrink-0 accent-[var(--c-violet-500)]"
                    />
                    <div className="min-w-0">
                      <span className="font-body text-[13px] font-semibold text-foreground uppercase">
                        {f}
                      </span>
                      <span className="block font-body text-[11.5px] text-text-tertiary mt-0.5">
                        {FORMAT_LABELS[f]}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </Field>

            <Field label="Filters">
              <label className="inline-flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={matchCurrent}
                  onChange={(e) => setMatchCurrent(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--c-violet-500)]"
                />
                Match the current view's filters
              </label>
              <p className="mt-1 font-body text-[11px] text-text-tertiary">
                Persistence of saved filters lands in Phase 2.
              </p>
            </Field>

            <Field label="Tamper-evidence">
              <label className="inline-flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={signWithKey}
                  onChange={(e) => setSignWithKey(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[var(--c-violet-500)]"
                />
                Sign with tenant key (for legal evidence)
              </label>
              <p className="mt-1 font-body text-[11px] text-text-tertiary">
                Phase 1 always includes per-event signatures; the tenant-level
                wrapper signature ships in Phase 2.
              </p>
            </Field>
          </div>

          {/* Right — summary + action */}
          <div className="lg:col-span-2 px-5 sm:px-6 py-6 bg-bg-subtle/50 flex flex-col gap-5">
            <h2 className="font-display text-[15px] font-semibold text-foreground tracking-[-0.01em]">
              Export summary
            </h2>

            <div className="flex-1 space-y-4">
              <SummaryRow
                icon={<FileText className="h-3.5 w-3.5" strokeWidth={2} />}
                label="Time window"
                value={selectedPreset.label}
              />
              <SummaryRow
                icon={<Download className="h-3.5 w-3.5" strokeWidth={2} />}
                label="Format"
                value={format.toUpperCase()}
              />
              <SummaryRow
                icon={<ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />}
                label="Signatures"
                value="Per-event HMAC included"
              />
              {matchCurrent && (
                <SummaryRow
                  icon={null}
                  label="Filters"
                  value="Matching current view"
                />
              )}
            </div>

            <div className="border-t border-stroke-subtle pt-4 space-y-2">
              <button
                type="button"
                onClick={onGenerate}
                disabled={download.isPending}
                className={cn(primaryBtnClass, "w-full justify-center")}
                style={primaryStyle}
              >
                <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
                {download.isPending ? "Generating…" : "Generate & download"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/enterprise/audit")}
                className={cn(secondaryBtnClass, "w-full justify-center")}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
        {label}
      </p>
      {children}
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      {icon ? (
        <span
          className="grid place-items-center h-7 w-7 rounded-lg text-white shrink-0"
          style={GLASS_GRADIENT}
          aria-hidden
        >
          {icon}
        </span>
      ) : (
        <span className="h-7 w-7 shrink-0" aria-hidden />
      )}
      <div className="min-w-0">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
          {label}
        </p>
        <p className="font-body text-[12.5px] font-medium text-foreground mt-0.5">
          {value}
        </p>
      </div>
    </div>
  );
}
