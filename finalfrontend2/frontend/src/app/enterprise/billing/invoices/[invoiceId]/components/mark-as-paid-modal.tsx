"use client";

/**
 * Mark-as-paid modal — spec doc 02 §5.G.3 PAYMENT block.
 *
 * The enterprise pays Glimmora via bank transfer (out-of-band), then
 * Finance records the reference here. Confirming flips the invoice from
 * pending/overdue → paid via the mock overlay (persists to localStorage)
 * so list, detail, and overview surfaces all stay consistent.
 */

import * as React from "react";
import { Check } from "lucide-react";
import { Modal } from "@/components/meridian";
import { recordInvoicePayment } from "@/lib/billing/invoices-mock";
import { cn } from "@/lib/utils/cn";
import {
  GLASS_MODAL_CLASS,
  GLASS_MODAL_OVERLAY,
  GLASS_FIELD_STYLE,
  primaryBtnClass,
  primaryStyle,
  ghostBtnClass,
} from "@/app/admin/_shell/aurora-ui";

interface Props {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  totalLabel: string;
  defaultMethod: string;
  onRecorded?: () => void;
}

export function MarkAsPaidModal({
  open,
  onClose,
  invoiceId,
  totalLabel,
  defaultMethod,
  onRecorded,
}: Props) {
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
    recordInvoicePayment(invoiceId, {
      reference: ref,
      method: method.trim() || defaultMethod,
      paidAt: new Date(paidOn).toISOString(),
    });
    setSaving(false);
    onRecorded?.();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Mark ${invoiceId} as paid`}
      description="Settled by bank transfer — record the reference number so the invoice and audit trail reflect it."
      className={GLASS_MODAL_CLASS}
      overlayClassName={GLASS_MODAL_OVERLAY}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={cn(ghostBtnClass, "h-9")}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className={cn(primaryBtnClass, "h-9")}
            style={primaryStyle}
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            {saving ? "Recording…" : "Mark as paid"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-white/65 bg-white/50 backdrop-blur px-3 py-2.5">
          <p className="font-body text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            Amount due
          </p>
          <p className="mt-0.5 font-display text-[18px] font-semibold text-foreground tabular-nums tracking-[-0.01em]">
            {totalLabel}
          </p>
        </div>

        <Field label="Bank transfer reference" required>
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. TRX-9421"
            autoFocus
            style={GLASS_FIELD_STYLE}
            className={inputCls}
          />
        </Field>

        <Field label="Payment method">
          <input
            type="text"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="Bank transfer to Acme corporate account"
            style={GLASS_FIELD_STYLE}
            className={inputCls}
          />
        </Field>

        <Field label="Paid on">
          <input
            type="date"
            value={paidOn}
            onChange={(e) => setPaidOn(e.target.value)}
            max={today}
            style={GLASS_FIELD_STYLE}
            className={inputCls}
          />
        </Field>

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-error-border bg-error-subtle px-3 py-2 font-body text-[12px] text-error-text"
          >
            {error}
          </p>
        )}

        <p className="font-body text-[11px] text-text-tertiary leading-snug">
          Recording the payment writes an audit-trail entry and notifies finance.
          This action cannot be undone from this screen — contact admin to reverse.
        </p>
      </div>
    </Modal>
  );
}

const inputCls = cn(
  "w-full h-9 px-3 rounded-xl backdrop-blur-md",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]",
);

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required && <span className="text-error-text normal-case tracking-normal"> *</span>}
      </label>
      {children}
    </div>
  );
}
