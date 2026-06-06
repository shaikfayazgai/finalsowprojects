"use client";

/**
 * Manual employee import (NO HRIS). Two-phase, educore-pattern:
 *  1. Upload CSV (or use the template) → preview with per-row validation +
 *     duplicate flags.
 *  2. Select rows → commit → backend creates accounts (must_change_password),
 *     emails each their credentials + login URL, writes audit.
 * Themed to match the platform (warm brown/gold/beige).
 */

import * as React from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Upload, Download, Loader2, CheckCircle2, AlertCircle, Users, Mail } from "lucide-react";

interface PreviewRow {
  rowNumber: number; email: string; name?: string; firstName?: string; lastName?: string;
  role?: string; department?: string | null; isDuplicate?: boolean; selectable?: boolean;
  errors?: string[];
}
interface ImportSummary {
  totalRows: number; validRows: PreviewRow[]; errorRows: PreviewRow[];
  imported?: number; committed?: number;
}

const TEMPLATE = "email,firstName,lastName,role,department\njane@example.com,Jane,Doe,employee,Engineering\n";

export default function EmployeeImportPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken ?? "";

  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<ImportSummary | null>(null);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [sendCreds, setSendCreds] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  function downloadTemplate() {
    const blob = new Blob([TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "employee-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function runPreview(f: File) {
    setBusy(true); setError(null); setDone(null); setPreview(null);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin/users/bulk-import?commit=false", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = (await res.json()) as ImportSummary;
      if (!res.ok) throw new Error("Preview failed");
      setPreview(data);
      setSelected(new Set((data.validRows ?? []).filter((r) => r.selectable).map((r) => r.rowNumber)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the file.");
    } finally { setBusy(false); }
  }

  async function commit() {
    if (!file || selected.size === 0) return;
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("selectedRows", JSON.stringify([...selected]));
      const res = await fetch(`/api/admin/users/bulk-import?commit=true&sendCredentials=${sendCreds}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = (await res.json()) as ImportSummary;
      if (!res.ok) throw new Error("Import failed");
      const n = data.imported ?? data.committed ?? selected.size;
      setDone(`${n} employee${n === 1 ? "" : "s"} imported${sendCreds ? " — credentials emailed" : ""}.`);
      setPreview(null); setFile(null); setSelected(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally { setBusy(false); }
  }

  const toggle = (n: number) =>
    setSelected((s) => { const x = new Set(s); x.has(n) ? x.delete(n) : x.add(n); return x; });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brown-500">
          <Users className="h-4 w-4 text-gold-600" /> Tenant · {tenantId}
        </div>
        <h1 className="font-heading text-3xl font-bold text-brown-950">Add employees</h1>
        <p className="text-sm text-beige-600">
          No HRIS connection needed — upload the CSV template or your own list. Each employee gets
          their login URL + a temporary password and resets it on first sign-in.
        </p>
      </div>

      {error && <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{error}</div>}
      {done && <div className="flex items-center gap-2 rounded-lg border border-forest-200 bg-forest-50 p-3 text-sm text-forest-700"><CheckCircle2 className="h-4 w-4" />{done}</div>}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-beige-200 bg-white p-5 shadow-sm">
        <button onClick={downloadTemplate}
          className="inline-flex items-center gap-1.5 rounded-full border border-beige-200 px-4 py-2 text-sm font-semibold text-brown-700 hover:bg-beige-50">
          <Download className="h-4 w-4" /> Download CSV template
        </button>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#6b4a22_0%,#a47b2e_100%)] px-4 py-2 text-sm font-semibold text-white hover:brightness-105">
          <Upload className="h-4 w-4" /> {file ? file.name : "Upload CSV / XLSX"}
          <input type="file" accept=".csv,.xlsx" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); runPreview(f); } }} />
        </label>
        {busy && <Loader2 className="h-5 w-5 animate-spin text-brown-500" />}
      </div>

      {preview && (
        <div className="space-y-4 rounded-2xl border border-beige-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-beige-600">
              {preview.totalRows} rows · <span className="text-forest-700">{preview.validRows.length} valid</span>
              {preview.errorRows.length > 0 && <> · <span className="text-red-600">{preview.errorRows.length} with errors</span></>}
            </p>
            <label className="flex items-center gap-2 text-sm text-brown-800">
              <input type="checkbox" checked={sendCreds} onChange={(e) => setSendCreds(e.target.checked)} className="h-4 w-4 rounded border-beige-300 text-brown-700" />
              Email credentials
            </label>
          </div>

          {preview.validRows.length > 0 && (
            <ul className="divide-y divide-beige-100 rounded-lg border border-beige-100">
              {preview.validRows.map((r) => (
                <li key={r.rowNumber} className="flex items-center gap-3 px-3 py-2.5">
                  <input type="checkbox" checked={selected.has(r.rowNumber)} disabled={!r.selectable}
                    onChange={() => toggle(r.rowNumber)} className="h-4 w-4 rounded border-beige-300 text-brown-700" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-brown-900">{r.name || `${r.firstName} ${r.lastName}`} <span className="text-xs text-beige-400">· {r.role}</span></p>
                    <p className="truncate text-xs text-beige-500">{r.email}{r.isDuplicate && <span className="ml-2 text-gold-700">already exists</span>}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {preview.errorRows.length > 0 && (
            <div className="rounded-lg border border-red-100 bg-red-50/50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-600">Rows with errors (skipped)</p>
              <ul className="space-y-1 text-xs text-red-700">
                {preview.errorRows.map((r) => (
                  <li key={r.rowNumber}>Row {r.rowNumber} · {r.email || "—"}: {(r.errors ?? []).join("; ")}</li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={commit} disabled={busy || selected.size === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#6b4a22_0%,#a47b2e_100%)] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Import {selected.size} employee{selected.size === 1 ? "" : "s"}
          </button>
        </div>
      )}
    </div>
  );
}
