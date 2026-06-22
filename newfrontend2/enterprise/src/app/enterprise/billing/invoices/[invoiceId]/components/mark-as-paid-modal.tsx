"use client";

/**
 * Mark-as-paid popup — record the bank-transfer reference; flips the invoice
 * pending/overdue → paid via the mock overlay so all surfaces stay consistent.
 */

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { recordInvoicePayment } from "@/lib/billing/invoices-mock";
import { cn } from "@/lib/utils/cn";
import { AdminModal, primaryBtnClass, primaryStyle, secondaryBtnClass } from "@/app/admin/_shell/aurora-ui";

interface Props {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  totalLabel: string;
  defaultMethod: string;
  onRecorded?: () => void;
}

const inputCls = cn(
  "w-full h-9 px-3 rounded-lg bg-surface border border-stroke-subtle",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled transition-colors",
  "focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
);

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
        {label}
        {required ? <span className="text-error-text"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

export function MarkAsPaidModal({ open, onClose, invoiceId, totalLabel, defaultMethod, onRecorded }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [reference, setReference] = React.useState("");
  const [method, setMethod] = React.useState(defaultMethod);
  const [paidOn, setPaidOn] = React.useState(today);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setReference("");
    setMethod(defaultMethod);
    setPaidOn(today);
    setError(null);
    setSaving(false);
  }, [open, defaultMethod, today]);

  const handleConfirm = () => {
    const ref = reference.trim();
    if (!ref) {
      setError("Bank transfer reference is required.");
      return;
    }
    if (ref.length < 4) {
      setError("Reference looks too short — double-check the bank record.");
      return;
    }
    setSaving(true);
    recordInvoicePayment(invoiceId, { reference: ref, method: method.trim() || defaultMethod, paidAt: new Date(paidOn).toISOString() });
    setSaving(false);
    onRecorded?.();
    onClose();
  };

  return (
    <AdminModal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      icon={CheckCircle2}
      tone="ai"
      title={`Mark ${invoiceId} as paid`}
      description="Settled by bank transfer — record the reference so the invoice and audit trail reflect it."
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={secondaryBtnClass}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={saving} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            {saving ? "Recording…" : "Mark as paid"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3.5 py-3 flex items-center justify-between gap-3">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Amount due</p>
          <p className="font-display text-[18px] font-bold text-foreground tabular-nums tracking-[-0.01em]">{totalLabel}</p>
        </div>

        <Field label="Bank transfer reference" required>
          <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. TRX-9421" autoFocus className={inputCls} />
        </Field>

        <Field label="Payment method">
          <input type="text" value={method} onChange={(e) => setMethod(e.target.value)} placeholder="Bank transfer to Acme corporate account" className={inputCls} />
        </Field>

        <Field label="Paid on">
          <input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} max={today} className={inputCls} />
        </Field>

        {error ? (
          <p role="alert" className="rounded-lg border border-error-border bg-error-subtle px-3 py-2 font-body text-[12px] text-error-text">
            {error}
          </p>
        ) : null}

        <p className="font-body text-[11px] text-text-tertiary leading-snug">
          Recording the payment writes an audit-trail entry and notifies finance. This can&apos;t be undone here — contact admin to reverse.
        </p>
      </div>
    </AdminModal>
  );
}
