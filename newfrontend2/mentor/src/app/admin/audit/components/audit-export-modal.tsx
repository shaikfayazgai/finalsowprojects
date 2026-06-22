"use client";

/**
 * Audit export — request a signed compliance export without leaving the log.
 */

import * as React from "react";
import { ChevronDown, Download, ShieldCheck } from "lucide-react";
import { fetchInternal } from "@/lib/api/client";
import { MOCK_TENANTS } from "@/mocks/admin/tenants";
import { cn } from "@/lib/utils/cn";
import { AdminModal, TONE, primaryBtnClass, primaryStyle, secondaryBtnClass } from "../../_shell/aurora-ui";

const FIELD =
  "w-full h-10 px-3 rounded-lg border border-stroke-subtle bg-surface font-body text-[13.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]";

const SELECT = cn(FIELD, "appearance-none pr-10 cursor-pointer");

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
        {label}
      </label>
      <div className="relative">
        <select id={id} value={value} onChange={onChange} className={SELECT}>
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          strokeWidth={2}
          aria-hidden
        />
      </div>
    </div>
  );
}

interface AuditExportModalProps {
  open: boolean;
  onClose: () => void;
}

export function AuditExportModal({ open, onClose }: AuditExportModalProps) {
  const [format, setFormat] = React.useState<"csv" | "json" | "ndjson">("csv");
  const [window, setWindow] = React.useState("last_7d");
  const [tenant, setTenant] = React.useState("All");
  const [emailTo, setEmailTo] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [requested, setRequested] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setFormat("csv");
      setWindow("last_7d");
      setTenant("All");
      setEmailTo("");
      setSubmitting(false);
      setRequested(false);
      setError(null);
    }
  }, [open]);

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

  return (
    <AdminModal
      open={open}
      onClose={onClose}
      icon={Download}
      tone="ai"
      title="Export audit slice"
      description="Request a signed export for legal or compliance evidence. Export requests are audited."
      footer={
        requested ? (
          <button type="button" onClick={onClose} className={secondaryBtnClass}>
            Close
          </button>
        ) : (
          <>
            <button type="button" onClick={onClose} className={secondaryBtnClass}>
              Cancel
            </button>
            <button type="submit" form="audit-export-form" disabled={submitting} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
              <Download className="h-4 w-4" strokeWidth={2} aria-hidden />
              {submitting ? "Submitting…" : "Request export"}
            </button>
          </>
        )
      }
    >
      {requested ? (
        <div
          className="rounded-lg border px-4 py-3"
          style={{ background: TONE.success.soft, borderColor: TONE.success.border }}
        >
          <p className="font-body text-[13px] leading-relaxed" style={{ color: TONE.success.text }}>
            Export request submitted. You will receive a signed download link at <strong>{emailTo}</strong> within 10 minutes.
          </p>
        </div>
      ) : (
        <form id="audit-export-form" onSubmit={onSubmit} className="space-y-4">
          <div
            className="rounded-lg border px-4 py-3 flex items-start gap-2.5"
            style={{ background: TONE.info.soft, borderColor: TONE.info.border }}
          >
            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.info.text }} aria-hidden />
            <p className="font-body text-[12.5px] text-text-secondary">
              A signed download link is emailed within ~10 minutes. The request is logged as a new audit event.
            </p>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border px-4 py-2.5 font-body text-[12.5px]"
              style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}
            >
              {error}
            </p>
          ) : null}

          <SelectField id="audit-export-window" label="Time window" value={window} onChange={(e) => setWindow(e.target.value)}>
            <option value="last_24h">Last 24 hours</option>
            <option value="last_7d">Last 7 days</option>
            <option value="last_30d">Last 30 days</option>
            <option value="last_90d">Last 90 days</option>
          </SelectField>

          <SelectField id="audit-export-tenant" label="Tenant scope" value={tenant} onChange={(e) => setTenant(e.target.value)}>
            <option value="All">All tenants</option>
            {MOCK_TENANTS.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
            <option value="(internal)">Glimmora internal only</option>
          </SelectField>

          <SelectField id="audit-export-format" label="Format" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="ndjson">NDJSON (one event per line)</option>
          </SelectField>

          <div>
            <label htmlFor="audit-export-email" className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
              Delivery email
            </label>
            <p className="mb-2 font-body text-[11.5px] text-text-tertiary">The signed link goes here.</p>
            <input
              id="audit-export-email"
              type="email"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              placeholder="e.g. legal@glimmora.ai"
              required
              className={FIELD}
            />
          </div>
        </form>
      )}
    </AdminModal>
  );
}
