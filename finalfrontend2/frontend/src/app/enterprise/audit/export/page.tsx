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
import {
  GLASS_CARD,
  GLASS_SHADOW,
  TONE,
  primaryBtnClass,
  primaryStyle,
  ghostBtnClass,
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
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-white/50 transition-colors duration-fast"
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
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Export audit
        </h1>
        <p className="mt-1.5 font-body text-[13px] text-text-secondary">
          Download audit events for the selected window. Signed exports are
          tamper-evident.
        </p>
      </header>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 sm:px-6 py-5 space-y-4">
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

          <Field label="Filter">
            <label className="inline-flex items-center gap-2 font-body text-[12.5px] text-foreground">
              <input
                type="checkbox"
                checked={matchCurrent}
                onChange={(e) => setMatchCurrent(e.target.checked)}
                className="h-3.5 w-3.5 accent-[var(--c-violet-500)]"
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
                    className="h-3.5 w-3.5 accent-[var(--c-violet-500)]"
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
                className="h-3.5 w-3.5 accent-[var(--c-violet-500)]"
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
        <div
          className="rounded-xl border px-3 py-2 backdrop-blur font-body text-[12px]"
          style={{ background: TONE.success.soft, borderColor: TONE.success.border, color: TONE.success.text }}
        >
          {resultMsg}
        </div>
      )}
      {errorMsg && (
        <div
          className="rounded-xl border px-3 py-2 backdrop-blur font-body text-[12px]"
          style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}
        >
          {errorMsg}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => router.push("/enterprise/audit")}
          className={ghostBtnClass}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={download.isPending}
          className={primaryBtnClass}
          style={primaryStyle}
        >
          {download.isPending ? "Generating…" : "Generate"}
        </button>
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
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}
