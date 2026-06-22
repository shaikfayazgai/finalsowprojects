"use client";

/**
 * Tenant detail modals — operate actions with explicit cause → effect → confirm.
 *
 * Pause tenant: document why → review impact → confirm (audit logged).
 * Change tier: pick plan → review limits → apply (plan history + audit).
 *
 * Solid card system: white modal (stroke + soft shadow), solid inset blocks,
 * tone-tinted icon chips, solid fields, gradient only on the primary action.
 */

import * as React from "react";
import {
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Eye,
  Gauge,
  PauseCircle,
  PlayCircle,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/components/meridian";
import type { TenantTier } from "@/lib/stores/admin-provisioning-store";
import { PLAN_CATALOG } from "@/lib/subscription/plans";
import { planCodeFromAdminTier } from "@/lib/subscription/tier-map";
import { cn } from "@/lib/utils/cn";
import {
  Field,
  GLASS_MODAL_CLASS,
  GLASS_MODAL_FOOT,
  GLASS_MODAL_OVERLAY,
  TierBadge,
  TONE,
  type Tone,
  dangerBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

const MIN_REASON_LENGTH = 10;

const TIERS: TenantTier[] = ["Enterprise", "Growth", "Pilot", "Trial"];

/* solid surfaces + controls */
const INNER_CARD = "rounded-lg border border-stroke-subtle bg-bg-subtle/40";
const SECTION_LABEL = "font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary";
const FIELD =
  "w-full rounded-lg bg-surface border border-stroke-subtle font-body text-[13.5px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]";
const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg shrink-0",
  "border border-stroke-subtle bg-surface font-body text-[13.5px] font-semibold text-text-secondary",
  "hover:text-foreground hover:bg-bg-subtle transition-colors disabled:opacity-55",
);

/** Modal header — tone-tinted icon chip + title, on the plain white surface. */
function ModalHead({
  icon: Icon,
  tone,
  title,
  description,
  onClose,
}: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <header className="flex items-start gap-3.5 px-5 sm:px-6 pt-5 pb-4">
      <span
        className="grid place-items-center h-10 w-10 shrink-0 rounded-lg border"
        style={{ background: TONE[tone].soft, borderColor: TONE[tone].border, color: TONE[tone].text }}
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={2.1} />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <h2 className="font-display text-[16.5px] font-bold tracking-[-0.01em] text-foreground leading-tight">{title}</h2>
        <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="grid place-items-center h-8 w-8 shrink-0 rounded-lg text-text-tertiary hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
      >
        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </header>
  );
}

interface PauseTenantModalProps {
  open: boolean;
  tenantName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function PauseTenantModal({ open, tenantName, onClose, onConfirm }: PauseTenantModalProps) {
  const [reason, setReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setReason("");
    setError(null);
    setSubmitting(false);
  }, [open]);

  const trimmedLen = reason.trim().length;
  const reasonReady = trimmedLen >= MIN_REASON_LENGTH;

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (trimmed.length < MIN_REASON_LENGTH) {
      setError(`Add at least ${MIN_REASON_LENGTH} characters — this reason is stored in the audit log.`);
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
      size="md"
      hideCloseButton
      className={GLASS_MODAL_CLASS}
      overlayClassName={GLASS_MODAL_OVERLAY}
      bodyClassName="p-0"
      footerClassName={GLASS_MODAL_FOOT}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={BTN_SECONDARY}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} disabled={submitting || !reasonReady} className={dangerBtnClass}>
            <PauseCircle className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            {submitting ? "Pausing…" : "Pause tenant"}
          </button>
        </>
      }
    >
      <ModalHead
        icon={PauseCircle}
        tone="warning"
        title="Pause tenant"
        description="Block new work and non-admin sign-ins until you resume this tenant."
        onClose={onClose}
      />
      <div className="px-5 sm:px-6 pb-5 space-y-5">
        <ContextCard label="Tenant" value={tenantName} />

        <section aria-labelledby="pause-effects-heading">
          <h3 id="pause-effects-heading" className={`${SECTION_LABEL} mb-2.5`}>
            What happens immediately
          </h3>
          <ul className={`${INNER_CARD} divide-y divide-stroke-subtle overflow-hidden`}>
            <EffectRow icon={Ban} tone="blocked" label="Non-admin logins blocked" />
            <EffectRow icon={Ban} tone="blocked" label="New SOW submissions blocked" />
            <EffectRow icon={PlayCircle} tone="continues" label="In-flight milestones continue until close" />
            <EffectRow icon={Eye} tone="continues" label="Enterprise admins keep read-only access" />
          </ul>
        </section>

        <Field
          label="Reason for audit log"
          required
          hint={`${trimmedLen}/${MIN_REASON_LENGTH} characters minimum`}
          hintTone={reasonReady ? "success" : "muted"}
        >
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            rows={4}
            placeholder="e.g. Contract renewal pending — hold new work until MSA is signed."
            aria-invalid={Boolean(error)}
            className={cn(FIELD, "min-h-[96px] px-3 py-2.5 resize-y")}
          />
        </Field>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border px-3 py-2 font-body text-[12px]"
            style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}
          >
            {error}
          </p>
        ) : null}

        <p className="font-body text-[12px] text-text-tertiary leading-relaxed">
          Resume the tenant from Overview when the underlying issue is resolved. This action is recorded in cross-tenant audit.
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

export function EditSubscriptionModal({ open, tenantName, currentTier, onClose, onConfirm }: EditSubscriptionModalProps) {
  const [tier, setTier] = React.useState<TenantTier>(currentTier);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTier(currentTier);
    setSubmitting(false);
  }, [open, currentTier]);

  const changed = tier !== currentTier;
  const selectedPlan = PLAN_CATALOG[planCodeFromAdminTier(tier)];
  const currentPlan = PLAN_CATALOG[planCodeFromAdminTier(currentTier)];

  const handleConfirm = () => {
    if (!changed) return;
    setSubmitting(true);
    onConfirm(tier);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      hideCloseButton
      className={GLASS_MODAL_CLASS}
      overlayClassName={GLASS_MODAL_OVERLAY}
      bodyClassName="p-0"
      footerClassName={GLASS_MODAL_FOOT}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={BTN_SECONDARY}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || !changed}
            className={cn(primaryBtnClass, "px-5")}
            style={primaryStyle}
          >
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            {submitting ? "Applying…" : "Apply change"}
          </button>
        </>
      }
    >
      <ModalHead
        icon={Gauge}
        tone="ai"
        title="Change subscription tier"
        description="Select a plan — feature flags and usage limits update immediately."
        onClose={onClose}
      />
      <div className="px-5 sm:px-6 pb-5 space-y-5">
        <ContextCard label="Tenant" value={tenantName} />

        <div className={`flex items-stretch gap-3 p-4 ${INNER_CARD}`}>
          <div className="min-w-0 flex-1">
            <p className={`${SECTION_LABEL} mb-1.5`}>Current plan</p>
            <TierBadge tier={currentTier} />
            <p className="mt-2 font-body text-[12px] text-text-tertiary leading-snug line-clamp-2">{currentPlan.description}</p>
          </div>
          <div className="flex items-center shrink-0 pt-5">
            <ArrowRight className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`${SECTION_LABEL} mb-1.5`}>New plan</p>
            {changed ? (
              <TierBadge tier={tier} />
            ) : (
              <span className="inline-flex h-[22px] items-center px-2.5 rounded-full bg-bg-subtle font-body text-[11px] text-text-disabled">
                Select below
              </span>
            )}
            {changed ? (
              <p className="mt-2 font-body text-[12px] text-text-secondary leading-snug line-clamp-2">{selectedPlan.description}</p>
            ) : null}
          </div>
        </div>

        <Field label="New tier" required>
          <div className="relative">
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as TenantTier)}
              className={cn(FIELD, "h-10 px-3 appearance-none pr-9 cursor-pointer")}
            >
              {TIERS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" strokeWidth={2} aria-hidden />
          </div>
        </Field>

        {changed ? (
          <section aria-labelledby="tier-limits-heading" className={`px-4 py-3.5 ${INNER_CARD}`}>
            <h3 id="tier-limits-heading" className={`${SECTION_LABEL} mb-2`}>
              Limit changes on apply
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-body text-[12px]">
              <LimitRow label="Active SOWs" value={formatLimit(selectedPlan.limits.activeSows)} />
              <LimitRow label="Seats" value={formatLimit(selectedPlan.limits.seats)} />
              <LimitRow label="AI calls / mo" value={formatLimit(selectedPlan.limits.aiInvocationsMonth)} />
              <LimitRow label="Audit retention" value={`${selectedPlan.limits.auditRetentionDays}d`} />
            </dl>
          </section>
        ) : null}

        <ul className="space-y-1.5 font-body text-[12px] text-text-tertiary">
          <li className="flex items-start gap-2">
            <CircleDot className="h-3.5 w-3.5 shrink-0 mt-0.5 text-text-disabled" strokeWidth={2} aria-hidden />
            Feature flags and usage caps apply as soon as you confirm.
          </li>
          <li className="flex items-start gap-2">
            <CircleDot className="h-3.5 w-3.5 shrink-0 mt-0.5 text-text-disabled" strokeWidth={2} aria-hidden />
            Recorded in this tenant&apos;s plan change history and platform audit.
          </li>
        </ul>
      </div>
    </Modal>
  );
}

function ContextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className={`px-4 py-3 ${INNER_CARD}`}>
      <p className={SECTION_LABEL}>{label}</p>
      <p className="mt-0.5 font-body text-[14px] font-semibold text-foreground leading-snug">{value}</p>
    </div>
  );
}

function EffectRow({
  icon: Icon,
  tone,
  label,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  tone: "blocked" | "continues";
  label: string;
}) {
  const blocked = tone === "blocked";
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span
        className="grid place-items-center h-8 w-8 shrink-0 rounded-lg border"
        style={
          blocked
            ? { background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }
            : { background: TONE.neutral.soft, borderColor: TONE.neutral.border, color: "var(--color-text-secondary)" }
        }
        aria-hidden
      >
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <span className="font-body text-[13px] text-foreground">{label}</span>
    </li>
  );
}

function LimitRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-text-tertiary">{label}</dt>
      <dd className="font-medium text-foreground tabular-nums text-right">{value}</dd>
    </>
  );
}

function formatLimit(n: number | null): string {
  return n == null ? "Unlimited" : n.toLocaleString();
}
