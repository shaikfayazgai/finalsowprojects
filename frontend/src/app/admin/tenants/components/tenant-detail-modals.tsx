"use client";

/**
 * Tenant detail modals — Meridian Modal shell (matches enterprise billing mark-as-paid).
 */

import * as React from "react";
import { AlertTriangle, Edit3, PauseCircle } from "lucide-react";
import { Modal, Select } from "@/components/meridian";
import type { TenantTier } from "@/lib/stores/admin-provisioning-store";
import { cn } from "@/lib/utils/cn";

const MIN_REASON_LENGTH = 10;

interface PauseTenantModalProps {
  open: boolean;
  tenantName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function PauseTenantModal({
  open,
  tenantName,
  onClose,
  onConfirm,
}: PauseTenantModalProps) {
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setReason("");
    setError(null);
    setSubmitting(false);
  }, [open]);

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (trimmed.length < MIN_REASON_LENGTH) {
      setError(`Reason must be at least ${MIN_REASON_LENGTH} characters (recorded in audit).`);
      return;
    }
    setSubmitting(true);
    onConfirm(trimmed);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pause tenant"
      description="New SOWs and non-admin logins blocked until resumed."
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={cancelBtnCls}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || reason.trim().length < MIN_REASON_LENGTH}
            className={dangerBtnCls}
          >
            <PauseCircle className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            {submitting ? "Pausing…" : "Pause tenant"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <ContextStrip label="Tenant" value={tenantName} />

        <div className="rounded-md border border-warning-border/70 bg-warning-subtle/40 px-3 py-2.5 flex items-start gap-2">
          <AlertTriangle
            className="h-3.5 w-3.5 text-warning-text shrink-0 mt-0.5"
            strokeWidth={2}
            aria-hidden
          />
          <p className="font-body text-[11.5px] text-text-secondary leading-relaxed">
            In-flight milestones continue until close. Reason is written to cross-tenant audit.
          </p>
        </div>

        <Field label="Reason for audit log" required>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            rows={4}
            placeholder="e.g. Contract renewal pending — hold new work until MSA signed."
            className={textareaCls}
          />
        </Field>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-error-border bg-error-subtle px-3 py-2 font-body text-[12px] text-error-text"
          >
            {error}
          </p>
        )}

        <p className="font-body text-[11px] text-text-tertiary leading-snug">
          Enterprise admins retain read-only access while paused. Resume when the underlying
          issue is resolved.
        </p>
      </div>
    </Modal>
  );
}

interface EditSubscriptionModalProps {
  open: boolean;
  tenantName: string;
  currentTier: TenantTier;
  onClose: () => void;
  onConfirm: (tier: TenantTier) => void;
}

export function EditSubscriptionModal({
  open,
  tenantName,
  currentTier,
  onClose,
  onConfirm,
}: EditSubscriptionModalProps) {
  const [tier, setTier] = React.useState<TenantTier>(currentTier);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTier(currentTier);
    setSubmitting(false);
  }, [open, currentTier]);

  const handleConfirm = () => {
    setSubmitting(true);
    onConfirm(tier);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit subscription"
      description="Tier, feature flags, and commercial terms."
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={cancelBtnCls}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={primaryBtnCls}
          >
            <Edit3 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <ContextStrip label="Tenant" value={tenantName} />
        <Field label="Subscription tier" required>
          <Select
            value={tier}
            onChange={(e) => setTier(e.target.value as TenantTier)}
            variant="outline"
            size="sm"
          >
            <option value="Enterprise">Enterprise</option>
            <option value="Growth">Growth</option>
            <option value="Pilot">Pilot</option>
            <option value="Trial">Trial</option>
          </Select>
        </Field>

        <p className="font-body text-[11px] text-text-tertiary leading-snug">
          Tier changes apply feature flags and usage limits immediately. Persisted to database when
          the tenant exists in Postgres.
        </p>
      </div>
    </Modal>
  );
}

/* ── Shared enterprise modal primitives (mark-as-paid-modal pattern) ── */

const inputCls = cn(
  "w-full h-9 px-3 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] text-foreground",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
);

const textareaCls = cn(
  "w-full px-3 py-2.5 rounded-md resize-none",
  "bg-surface border border-stroke",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
);

const cancelBtnCls = cn(
  "inline-flex items-center h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand text-on-brand",
  "font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

const dangerBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-error-solid text-on-brand",
  "font-body text-[13px] font-semibold",
  "hover:bg-error transition-colors duration-fast",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

function ContextStrip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2">
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </p>
      <p className="mt-0.5 font-body text-[13px] font-medium text-foreground leading-snug">
        {value}
      </p>
    </div>
  );
}

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
      <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
        {label}
        {required && (
          <span className="text-error-text normal-case tracking-normal"> *</span>
        )}
      </span>
      {children}
    </div>
  );
}
