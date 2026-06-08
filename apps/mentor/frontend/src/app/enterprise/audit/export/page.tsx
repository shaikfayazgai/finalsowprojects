"use client";

/**
 * Audit export — spec doc 02 §5.H.3.
 *
 * Time range + format (CSV / JSON / NDJSON) + optional tenant-key
 * signature, generates a download via useDownloadAuditExport.
 *
 * "Filter same as current view" is a UX cue from the spec; Phase 1
 * audit filters are query-string in the list page, so we surface
 * the checkbox without persistence (Phase 2).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useDownloadAuditExport } from "@/lib/hooks/use-audit-view";
import { AuditViewApiError } from "@/lib/api/audit-view";
import { cn } from "@/lib/utils/cn";

type TimePreset = "24h" | "7d" | "30d" | "90d" | "all";

const PRESETS: Array<{ key: TimePreset; label: string; days: number | null }> = [
  { key: "24h", label: "Last 24 hours", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "all", label: "All time", days: null },
];

export default function AuditExportPage() {
  const router = useRouter();
  const download = useDownloadAuditExport();

  const [time, setTime] = React.useState<TimePreset>("30d");
  const [format, setFormat] = React.useState<"csv" | "json" | "ndjson">("csv");
  const [matchCurrent, setMatchCurrent] = React.useState(true);
  const [signWithKey, setSignWithKey] = React.useState(false);
  const [resultMsg, setResultMsg] = React.useState<string | null>(null);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const onGenerate = async () => {
    setResultMsg(null);
    setErrorMsg(null);
    const preset = PRESETS.find((p) => p.key === time) ?? PRESETS[2];
    const now = new Date();
    const from = preset.days
      ? new Date(now.getTime() - preset.days * 86_400_000).toISOString()
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
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/enterprise/audit"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          <span>Audit</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">Export</span>
      </nav>

      <header>
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
          Audit
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Export audit
        </h1>
        <p className="mt-1.5 font-body text-[13px] text-text-secondary">
          Download audit events for the selected window. Signed exports are
          tamper-evident.
        </p>
      </header>

      <section className="rounded-lg border border-stroke bg-surface shadow-xs">
        <div className="p-4 space-y-4">
          <Field label="Time range">
            <select
              value={time}
              onChange={(e) => setTime(e.target.value as TimePreset)}
              className={inputCls}
            >
              {PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Filter">
            <label className="inline-flex items-center gap-2 font-body text-[12.5px] text-foreground">
              <input
                type="checkbox"
                checked={matchCurrent}
                onChange={(e) => setMatchCurrent(e.target.checked)}
                className="h-3.5 w-3.5 accent-brand"
              />
              Match the current view's filters
            </label>
            <p className="mt-0.5 font-body text-[11px] text-text-tertiary">
              Persistence of saved filters lands in Phase 2.
            </p>
          </Field>

          <Field label="Format">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {(["csv", "json", "ndjson"] as const).map((f) => (
                <label
                  key={f}
                  className="inline-flex items-center gap-1.5 cursor-pointer font-body text-[12.5px] text-foreground"
                >
                  <input
                    type="radio"
                    name="format"
                    value={f}
                    checked={format === f}
                    onChange={() => setFormat(f)}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  {f.toUpperCase()}
                </label>
              ))}
            </div>
          </Field>

          <Field label="Tamper-evidence">
            <label className="inline-flex items-center gap-2 font-body text-[12.5px] text-foreground">
              <input
                type="checkbox"
                checked={signWithKey}
                onChange={(e) => setSignWithKey(e.target.checked)}
                className="h-3.5 w-3.5 accent-brand"
              />
              Sign with tenant key (for legal evidence)
            </label>
            <p className="mt-0.5 font-body text-[11px] text-text-tertiary">
              Phase 1 always includes per-event signatures; the tenant-level
              wrapper signature ships in Phase 2.
            </p>
          </Field>
        </div>
      </section>

      {resultMsg && (
        <div className="rounded-md bg-success-subtle border border-success-border px-3 py-2 font-body text-[12px] text-success-text">
          {resultMsg}
        </div>
      )}
      {errorMsg && (
        <div className="rounded-md bg-error-subtle border border-error-border px-3 py-2 font-body text-[12px] text-error-text">
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/enterprise/audit")}
          className={cn(
            "inline-flex items-center h-9 px-3.5 rounded-md",
            "bg-surface border border-stroke",
            "font-body text-[13px] font-semibold text-foreground",
            "hover:bg-surface-hover transition-colors duration-fast",
          )}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={download.isPending}
          className={cn(
            "inline-flex items-center h-9 px-3.5 rounded-md shadow-xs",
            "bg-brand text-on-brand",
            "font-body text-[13px] font-semibold",
            "hover:bg-brand-hover transition-colors duration-fast",
            "disabled:opacity-60 disabled:cursor-not-allowed",
          )}
        >
          {download.isPending ? "Generating…" : "Generate"}
        </button>
      </div>
    </div>
  );
}

const inputCls = cn(
  "w-full h-9 px-3 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] text-foreground",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
);

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}
