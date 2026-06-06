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
    <section className="rounded-xl border border-stroke bg-surface overflow-hidden">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-stroke bg-surface-subtle">
        <div>
          <h2 className="font-body text-[13px] font-semibold text-foreground">
            Import from CSV
          </h2>
          <p className="mt-0.5 font-body text-[12px] text-text-secondary max-w-xl">
            Upload a spreadsheet of internal employees, preview changes, then apply.
          </p>
        </div>
        <button
          type="button"
          onClick={downloadTemplate}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-stroke bg-surface font-body text-[12.5px] font-semibold text-foreground hover:border-brand/40 transition-colors shrink-0"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          Download template
        </button>
      </header>

      <div className="p-5 space-y-3">
        {err && (
          <p
            role="alert"
            className="rounded-lg border border-error-border px-3 py-2 font-body text-[12.5px] text-error-text"
          >
            {err}
          </p>
        )}

        {errors.length > 0 && (
          <div className="rounded-lg border border-warning-border bg-warning-subtle px-3 py-2 space-y-1">
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
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-md bg-brand text-on-brand font-body text-[12.5px] font-semibold hover:bg-brand-hover transition-colors duration-fast"
            >
              <FileUp className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Upload CSV
            </button>
          </>
        )}

        {phase === "previewing" && (
          <p className="font-body text-[12.5px] text-text-secondary flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-brand" strokeWidth={2} aria-hidden />
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
                  <p className="rounded-lg border border-warning-border px-3 py-2 font-body text-[12px] text-text-secondary">
                    More than 10% of records would be deactivated. Confirm this matches your export
                    before applying.
                  </p>
                )}
                <div className="rounded-lg border border-stroke-subtle overflow-hidden max-h-64 overflow-y-auto">
                  <ul className="divide-y divide-stroke-subtle">
                    {diffs.map((d) => (
                      <li
                        key={d.email}
                        className="px-3 py-2.5 flex flex-wrap items-center gap-2 gap-y-1"
                      >
                        <span className="font-mono text-[11.5px] text-foreground min-w-[140px] truncate">
                          {d.email}
                        </span>
                        <span className="font-body text-[12px] text-text-secondary flex-1 min-w-[100px] truncate">
                          {d.name}
                        </span>
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded-full font-body text-[10px] font-semibold uppercase",
                            d.action === "create" && "bg-success-subtle text-success-text",
                            d.action === "update" && "bg-brand-subtle text-brand-subtle-text",
                            d.action === "deactivate" && "bg-warning-subtle text-warning-text",
                          )}
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
                    className="inline-flex items-center h-8 px-3 rounded-md bg-brand text-on-brand font-body text-[12px] font-semibold hover:bg-brand-hover transition-colors duration-fast disabled:opacity-50"
                  >
                    Apply changes
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="font-body text-[12.5px] text-text-secondary hover:text-foreground"
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
                className="font-body text-[12.5px] font-semibold text-brand hover:opacity-80"
              >
                Upload another file
              </button>
            )}
          </div>
        )}

        {phase === "applying" && (
          <p className="font-body text-[12.5px] text-text-secondary flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-brand" strokeWidth={2} aria-hidden />
            Applying import…
          </p>
        )}

        {phase === "applied" && (
          <div className="space-y-2">
            <p className="font-body text-[12.5px] text-success-text">
              Import complete — employees are available in the directory below.
            </p>
            <button
              type="button"
              onClick={reset}
              className="font-body text-[12.5px] font-semibold text-brand hover:opacity-80"
            >
              Import another file
            </button>
          </div>
        )}

        {phase === "error" && (
          <button
            type="button"
            onClick={reset}
            className="font-body text-[12.5px] font-semibold text-brand hover:opacity-80"
          >
            Try again
          </button>
        )}
      </div>
    </section>
  );
}
