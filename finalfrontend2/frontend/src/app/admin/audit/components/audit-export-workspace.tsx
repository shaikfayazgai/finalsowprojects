"use client";

/**
 * Audit export workspace — Aurora Glass compliance evidence export request.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { fetchInternal } from "@/lib/api/client";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import { fetchAdminTenants } from "@/lib/api/superadmin";
import { cn } from "@/lib/utils/cn";
import {
  AuroraInput,
  AuroraSelect,
  Banner,
  Crumbs,
  Field,
  GlassCard,
  PageHeader,
  TONE,
  ghostBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

export function AuditExportWorkspace() {
  const router = useRouter();
  const canExport = useAdminSectionCanEdit("auditExport");

  // Fetch real tenant list for the tenant scope dropdown
  const [tenantOptions, setTenantOptions] = React.useState<Array<{ id: string; name: string }>>([]);
  React.useEffect(() => {
    fetchAdminTenants()
      .then((items) => setTenantOptions(items.map((t) => ({ id: t.id, name: t.name }))))
      .catch(() => { /* non-fatal — dropdown just shows fewer options */ });
  }, []);

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
    <div className="space-y-6 pb-12 animate-fade-in">
      <Crumbs items={[{ label: "Audit log", href: "/admin/audit" }, { label: "Export" }]} />

      <PageHeader
        eyebrow="Platform · Governance"
        title="Export audit slice"
        subtitle="Request a signed export for legal or compliance evidence. Export requests are themselves audited."
      />

      <Banner tone="success" icon={ShieldCheck} title="What happens after submission">
        A signed download link is emailed to the delivery address within ~10 minutes. The export request is logged
        as a new audit event with your admin identity.
      </Banner>

      {requested ? (
        <GlassCard className="px-5 sm:px-6 py-5 max-w-xl">
          <p
            className="rounded-xl border px-4 py-3 font-body text-[13px] leading-relaxed"
            style={{ background: TONE.success.soft, borderColor: TONE.success.border, color: TONE.success.text }}
          >
            Export request submitted. You will receive a signed download link at{" "}
            <strong>{emailTo}</strong> within 10 minutes.
          </p>
          <Link
            href="/admin/audit"
            className="mt-4 inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            Back to audit log
          </Link>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden max-w-xl">
          <form onSubmit={onSubmit}>
            <header className="px-5 sm:px-6 pt-4 pb-3.5 border-b border-stroke-subtle">
              <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">
                Export parameters
              </h2>
              <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">
                Choose scope, format, and where to deliver the signed link.
              </p>
            </header>

            <div className="px-5 sm:px-6 py-5 space-y-4">
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border px-4 py-2.5 font-body text-[12.5px]"
                  style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}
                >
                  {error}
                </p>
              )}

              <Field label="Time window">
                <AuroraSelect size="sm" value={window} onChange={(e) => setWindow(e.target.value)}>
                  <option value="last_24h">Last 24 hours</option>
                  <option value="last_7d">Last 7 days</option>
                  <option value="last_30d">Last 30 days</option>
                  <option value="last_90d">Last 90 days</option>
                </AuroraSelect>
              </Field>

              <Field label="Tenant scope">
                <AuroraSelect size="sm" value={tenant} onChange={(e) => setTenant(e.target.value)}>
                  <option value="All">All tenants</option>
                  {tenantOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                  <option value="(internal)">Glimmora internal only</option>
                </AuroraSelect>
              </Field>

              <Field label="Format">
                <AuroraSelect
                  size="sm"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as typeof format)}
                >
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                  <option value="ndjson">NDJSON (one event per line)</option>
                </AuroraSelect>
              </Field>

              <Field label="Delivery email" hint="The signed link goes here.">
                <AuroraInput
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="legal@glimmora.ai"
                  required
                />
              </Field>
            </div>

            <footer className="px-5 sm:px-6 py-4 border-t border-stroke-subtle flex items-center justify-between gap-3">
              <Link href="/admin/audit" className={ghostBtnClass}>
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className={cn(primaryBtnClass, submitting && "opacity-60 cursor-not-allowed")}
                style={primaryStyle}
              >
                <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
                {submitting ? "Submitting…" : "Request export"}
              </button>
            </footer>
          </form>
        </GlassCard>
      )}
    </div>
  );
}
