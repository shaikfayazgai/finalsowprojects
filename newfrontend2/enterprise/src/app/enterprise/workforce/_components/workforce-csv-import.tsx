"use client";

import * as React from "react";
import { FileUp, Loader2, Download } from "lucide-react";
import {
  applyWorkforceCsvImport,
  previewWorkforceCsvImport,
} from "@/lib/api/workforce";
import type { WorkforceImportDiff } from "@/lib/workforce/csv-import";
import { WORKFORCE_CSV_TEMPLATE } from "@/lib/workforce/csv-import";
import { toast } from "@/lib/stores/toast-store";
import { DASH_CARD } from "@/app/admin/_shell/aurora";
import {
  secondaryBtnClass,
  primaryBtnClass,
  primaryStyle,
  TONE,
} from "@/app/admin/_shell/aurora-ui";
import { cn } from "@/lib/utils/cn";
import { triggerDownload } from "@/lib/utils/file-download";

type Phase = "idle" | "previewing" | "diff" | "applying" | "applied" | "error";

interface WorkforceCsvImportProps {
  onApplied?: () => void;
}

export function WorkforceCsvImport({ onApplied }: WorkforceCsvImportProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [csvText, setCsvText] = React.useState("");
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [diffs, setDiffs] = React.useState<WorkforceImportDiff[]>([]);
  const [errors, setErrors] = React.useState<Array<{ row: number; email?: string; message: string }>>(
    [],
  );
  const [err, setErr] = React.useState<string | null>(null);

  const counts = {
    create: diffs.filter((d) => d.action === "create").length,
    update: diffs.filter((d) => d.action === "update").length,
    deactivate: diffs.filter((d) => d.action === "deactivate").length,
  };
  const total = diffs.length;
  const highDeletion = total > 0 && counts.deactivate / total > 0.1;

  function reset() {
    setPhase("idle");
    setCsvText("");
    setFileName(null);
    setDiffs([]);
    setErrors([]);
    setErr(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function downloadTemplate() {
    triggerDownload(
      new Blob(["\uFEFF" + WORKFORCE_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }),
      "workforce-import-template.csv",
    );
  }

  async function onFileSelected(file: File) {
    setErr(null);
    setErrors([]);
    const text = await file.text();
    setCsvText(text);
    setFileName(file.name);
    setPhase("previewing");
    try {
      const result = await previewWorkforceCsvImport(text);
      setDiffs(result.diffs);
      setErrors(result.errors);
      if (result.errors.length > 0 && result.diffs.length === 0) {
        setPhase("error");
        setErr("Fix the rows below and upload again.");
      } else if (result.diffs.length === 0) {
        setPhase("diff");
        setErr(null);
      } else {
        setPhase("diff");
      }
    } catch (e) {
      setPhase("error");
      setErr(e instanceof Error ? e.message : "Could not parse CSV.");
    }
  }

  async function apply() {
    if (!csvText) return;
    setPhase("applying");
    setErr(null);
    try {
      const result = await applyWorkforceCsvImport(csvText);
      toast.success(
        "Import applied",
        `${result.created} added · ${result.updated} updated · ${result.deactivated} deactivated`,
      );
      setPhase("applied");
      onApplied?.();
    } catch (e) {
      setPhase("error");
      setErr(e instanceof Error ? e.message : "Import failed.");
    }
  }

  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-stroke-subtle">
        <div>
          <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">
            Import from CSV
          </h2>
          <p className="mt-0.5 font-body text-[12px] text-text-secondary max-w-xl">
            Upload a spreadsheet of internal employees, preview changes, then apply.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className={cn(secondaryBtnClass, "h-9 px-3 text-[12.5px]")}
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Download template
        </button>
      </header>

      <div className="p-5 space-y-3">
        {err && (
          <p
            role="alert"
            className="rounded-xl border px-3 py-2 font-body text-[12.5px]"
            style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}
          >
            {err}
          </p>
        )}

        {errors.length > 0 && (
          <div
            className="rounded-xl border px-3 py-2 space-y-1"
            style={{ background: TONE.warning.soft, borderColor: TONE.warning.border }}
          >
            <p className="font-body text-[12px] font-semibold text-foreground">
              {errors.length} row{errors.length === 1 ? "" : "s"} need attention
            </p>
            <ul className="font-body text-[11.5px] text-text-secondary space-y-0.5 max-h-24 overflow-y-auto">
              {errors.slice(0, 8).map((e, i) => (
                <li key={`${e.row}-${i}`}>
                  {e.row > 0 ? `Row ${e.row}: ` : ""}
                  {e.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {phase === "idle" && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onFileSelected(f);
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={primaryStyle}
              className={cn(primaryBtnClass, "h-9 px-3.5 text-[12.5px]")}
            >
              <FileUp className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Upload CSV
            </button>
          </>
        )}

        {phase === "previewing" && (
          <p className="font-body text-[12.5px] text-text-secondary flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-text-secondary" strokeWidth={2} aria-hidden />
            Validating {fileName ?? "file"}…
          </p>
        )}

        {phase === "diff" && (
          <div className="space-y-3">
            {fileName && (
              <p className="font-body text-[12px] text-text-tertiary">
                File: <span className="text-foreground font-medium">{fileName}</span>
              </p>
            )}
            {total === 0 ? (
              <p className="font-body text-[12.5px] text-text-secondary">
                No changes detected — every row matches your current workforce directory.
              </p>
            ) : (
              <>
                <p className="font-body text-[12.5px] text-foreground">
                  Preview · <span className="font-semibold tabular-nums">{counts.create}</span> new ·{" "}
                  <span className="font-semibold tabular-nums">{counts.update}</span> updated ·{" "}
                  <span className="font-semibold tabular-nums">{counts.deactivate}</span> deactivated
                </p>
                {highDeletion && (
                  <p
                    className="rounded-xl border px-3 py-2 font-body text-[12px] text-text-secondary"
                    style={{ background: TONE.warning.soft, borderColor: TONE.warning.border }}
                  >
                    More than 10% of records would be deactivated. Confirm this matches your export
                    before applying.
                  </p>
                )}
                <div className="rounded-xl border border-stroke-subtle bg-bg-subtle overflow-hidden max-h-64 overflow-y-auto">
                  <ul className="divide-y divide-stroke-subtle">
                    {diffs.map((d) => (
                      <li
                        key={d.email}
                        className="px-3 py-2.5 flex flex-wrap items-center gap-2 gap-y-1 hover:bg-bg-subtle transition-colors"
                      >
                        <span className="font-mono text-[11.5px] text-foreground min-w-[140px] truncate">
                          {d.email}
                        </span>
                        <span className="font-body text-[12px] text-text-secondary flex-1 min-w-[100px] truncate">
                          {d.name}
                        </span>
                        <span
                          className="inline-flex px-2 py-0.5 rounded-full border font-body text-[10px] font-semibold uppercase"
                          style={{
                            background:
                              d.action === "create"
                                ? TONE.success.soft
                                : d.action === "update"
                                  ? TONE.info.soft
                                  : TONE.warning.soft,
                            borderColor:
                              d.action === "create"
                                ? TONE.success.border
                                : d.action === "update"
                                  ? TONE.info.border
                                  : TONE.warning.border,
                            color:
                              d.action === "create"
                                ? TONE.success.text
                                : d.action === "update"
                                  ? TONE.info.text
                                  : TONE.warning.text,
                          }}
                        >
                          {d.action}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={apply}
                    disabled={total === 0 || errors.length > 0}
                    style={primaryStyle}
                    className={cn(primaryBtnClass, "h-8 px-3 text-[12px]")}
                  >
                    Apply changes
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="font-body text-[12.5px] text-text-secondary hover:text-foreground transition-colors duration-fast"
                  >
                    Choose another file
                  </button>
                </div>
              </>
            )}
            {total === 0 && (
              <button
                type="button"
                onClick={reset}
                className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
              >
                Upload another file
              </button>
            )}
          </div>
        )}

        {phase === "applying" && (
          <p className="font-body text-[12.5px] text-text-secondary flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-text-secondary" strokeWidth={2} aria-hidden />
            Applying import…
          </p>
        )}

        {phase === "applied" && (
          <div className="space-y-2">
            <p className="font-body text-[12.5px]" style={{ color: TONE.success.text }}>
              Import complete — employees are available in the directory below.
            </p>
            <button
              type="button"
              onClick={reset}
              className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
            >
              Import another file
            </button>
          </div>
        )}

        {phase === "error" && (
          <button
            type="button"
            onClick={reset}
            className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast"
          >
            Try again
          </button>
        )}
      </div>
    </section>
  );
}
