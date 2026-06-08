"use client";

/**
 * Audit export workspace — compliance evidence export request.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { Select } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { fetchInternal } from "@/lib/api/client";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import { MOCK_TENANTS } from "@/mocks/admin/tenants";
import { cn } from "@/lib/utils/cn";

export function AuditExportWorkspace() {
  const router = useRouter();
  const canExport = useAdminSectionCanEdit("auditExport");

  const [format, setFormat] = React.useState<"csv" | "json" | "ndjson">("csv");
  const [window, setWindow] = React.useState("last_7d");
  const [tenant, setTenant] = React.useState("All");
  const [emailTo, setEmailTo] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [requested, setRequested] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!canExport) router.replace("/admin/audit");
  }, [canExport, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetchInternal("/api/admin/audit/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format, window, tenant, emailTo }),
      });
      const data = await res.json().catch(() => ({ success: false }));
      if (res.ok && data.success) {
        setRequested(true);
      } else {
        setError(data.message ?? "Export request failed.");
      }
    } catch {
      setError("Export request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canExport) return null;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/audit"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />{" "}
          <span>Audit log</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary">Export</span>
      </nav>

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Platform · Compliance
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Export audit slice
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Request a signed export for legal or compliance evidence. Export requests are themselves audited.
        </p>
      </header>

      <DashboardSection title="Before you export" description="What happens after submission">
        <ul className="space-y-2 font-body text-[12.5px] text-text-secondary leading-relaxed">
          <li className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-success-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            A signed download link is emailed to the delivery address within ~10 minutes.
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-success-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            The export request is logged as a new audit event with your admin identity.
          </li>
        </ul>
      </DashboardSection>

      {requested ? (
        <section className="rounded-xl border border-success-border bg-success-subtle/40 px-5 py-4 max-w-xl">
          <p className="font-body text-[13px] text-success-text leading-relaxed">
            Export request submitted. You will receive a signed download link at{" "}
            <strong>{emailTo}</strong> within 10 minutes.
          </p>
          <Link
            href="/admin/audit"
            className="mt-3 inline-flex items-center gap-1 font-body text-[12.5px] font-semibold text-brand-emphasis hover:underline underline-offset-2"
          >
            ← Back to audit log
          </Link>
        </section>
      ) : (
        <form
          onSubmit={onSubmit}
          className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden max-w-xl"
        >
          <header className="px-5 py-4 border-b border-stroke-subtle">
            <h2 className="font-body text-[15px] font-semibold text-foreground">Export parameters</h2>
            <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
              Choose scope, format, and where to deliver the signed link.
            </p>
          </header>

          <div className="p-5 space-y-4">
            {error && (
              <p
                role="alert"
                className="rounded-xl border border-error-border bg-error-subtle px-4 py-2.5 font-body text-[12.5px] text-error-text"
              >
                {error}
              </p>
            )}

            <FormField label="Time window">
              <Select
                variant="outline"
                size="sm"
                value={window}
                onChange={(e) => setWindow(e.target.value)}
              >
                <option value="last_24h">Last 24 hours</option>
                <option value="last_7d">Last 7 days</option>
                <option value="last_30d">Last 30 days</option>
                <option value="last_90d">Last 90 days</option>
              </Select>
            </FormField>

            <FormField label="Tenant scope">
              <Select
                variant="outline"
                size="sm"
                value={tenant}
                onChange={(e) => setTenant(e.target.value)}
              >
                <option value="All">All tenants</option>
                {MOCK_TENANTS.map((t) => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
                <option value="(internal)">Glimmora internal only</option>
              </Select>
            </FormField>

            <FormField label="Format">
              <Select
                variant="outline"
                size="sm"
                value={format}
                onChange={(e) => setFormat(e.target.value as typeof format)}
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="ndjson">NDJSON (one event per line)</option>
              </Select>
            </FormField>

            <FormField label="Delivery email" hint="The signed link goes here.">
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className={inputCls}
                placeholder="legal@glimmora.ai"
                required
              />
            </FormField>
          </div>

          <footer className="px-5 py-4 border-t border-stroke-subtle flex items-center justify-between gap-3">
            <Link
              href="/admin/audit"
              className="font-body text-[13px] text-text-secondary hover:text-foreground transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className={cn(primaryBtnCls, submitting && "opacity-60 cursor-not-allowed")}
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              {submitting ? "Submitting…" : "Request export"}
            </button>
          </footer>
        </form>
      )}
    </div>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
      </span>
      {children}
      {hint && (
        <span className="block mt-1.5 font-body text-[11px] text-text-tertiary">{hint}</span>
      )}
    </label>
  );
}

const inputCls = cn(
  "block w-full h-9 px-3 rounded-md border border-stroke-subtle bg-surface",
  "font-body text-[13px] text-foreground",
  "focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-4 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
);
