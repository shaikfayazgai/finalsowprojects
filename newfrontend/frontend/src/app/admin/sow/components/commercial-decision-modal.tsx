"use client";

/**
 * Commercial decision modal — confirm approve / send back / reject with audit comment.
 *
 * Solid modal: white card (stroke + soft shadow), tone-tinted header chip,
 * solid inset blocks + fields, gradient on the primary action.
 */

import * as React from "react";
import { Ban, CheckCircle2, Undo2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import {
  GLASS_MODAL_CLASS,
  GLASS_MODAL_FOOT,
  GLASS_MODAL_OVERLAY,
  TONE,
  type Tone,
  dangerBtnClass,
  primaryBtnClass,
  primaryStyle,
} from "../../_shell/aurora-ui";

export const COMMERCIAL_CHECKLIST = [
  { id: "rate_cards", label: "Rate cards apply to the in-scope skill set" },
  { id: "effort", label: "Effort estimates fall within ±15% of historical" },
  { id: "payment_terms", label: "Payment terms align with master agreement" },
] as const;

export type CommercialDecisionAction = "approve" | "send_back" | "reject";

export interface CommercialDecisionPayload {
  comment: string;
  notifySponsor: boolean;
  checklist: Record<string, boolean>;
  /** Approver's typed name — required signature on the final Admin approval. */
  signature: string;
  /** Optional delivery mentor selected during the approval (assigned on confirm). */
  mentorId?: string;
  mentorName?: string;
  mentorEmail?: string;
}

interface MentorOption {
  id: string;
  name: string;
  email?: string;
  label: string;
}

interface CommercialDecisionModalProps {
  open: boolean;
  action: CommercialDecisionAction;
  sowTitle: string;
  onClose: () => void;
  onConfirm: (payload: CommercialDecisionPayload) => void;
  submitting?: boolean;
}

const ACTION_COPY: Record<
  CommercialDecisionAction,
  { title: string; description: string; submit: string; minComment: number; icon: LucideIcon; tone: Tone }
> = {
  approve: {
    title: "Approve & sign off — Super admin",
    description: "Final Super admin approval. Sign with your name to confirm — the SOW becomes approved and delivery setup can begin.",
    submit: "Sign & approve",
    minComment: 10,
    icon: CheckCircle2,
    tone: "success",
  },
  send_back: {
    title: "Send back to enterprise sponsor",
    description: "Returns this SOW to draft so the sponsor can revise and resubmit. This decision is recorded in audit.",
    submit: "Send back for revision",
    minComment: 15,
    icon: Undo2,
    tone: "warning",
  },
  reject: {
    title: "Reject at Super admin",
    description: "Stops this approval attempt. The sponsor must clone and resubmit as a new version.",
    submit: "Confirm rejection",
    minComment: 20,
    icon: Ban,
    tone: "error",
  },
};

const FIELD =
  "w-full min-h-[96px] px-3 py-2.5 rounded-lg border border-stroke-subtle bg-surface font-body text-[13px] text-foreground placeholder:text-text-disabled resize-y transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]";

const INPUT_FIELD =
  "w-full h-10 px-3 rounded-lg border border-stroke-subtle bg-surface font-body text-[13px] text-foreground placeholder:text-text-disabled transition-colors focus-visible:outline-none focus-visible:border-[var(--c-violet-400)] focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]";

/** Min characters for the approver's signature (a real name). */
const SIGNATURE_MIN = 2;

const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg shrink-0",
  "border border-stroke-subtle bg-surface font-body text-[13.5px] font-semibold text-text-secondary",
  "hover:text-foreground hover:bg-bg-subtle transition-colors disabled:opacity-55",
);

function ModalHead({
  icon: Icon,
  tone,
  title,
  description,
  onClose,
  disabled,
}: {
  icon: LucideIcon;
  tone: Tone;
  title: string;
  description: string;
  onClose: () => void;
  disabled?: boolean;
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
        disabled={disabled}
        aria-label="Close"
        className="grid place-items-center h-8 w-8 shrink-0 rounded-lg text-text-tertiary hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast disabled:opacity-50"
      >
        <X className="h-4 w-4" strokeWidth={2} aria-hidden />
      </button>
    </header>
  );
}

export function CommercialDecisionModal({ open, action, sowTitle, onClose, onConfirm, submitting }: CommercialDecisionModalProps) {
  const copy = ACTION_COPY[action];
  const [comment, setComment] = React.useState("");
  const [signature, setSignature] = React.useState("");
  const [notifySponsor, setNotifySponsor] = React.useState(true);
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({});
  const [mentors, setMentors] = React.useState<MentorOption[]>([]);
  const [mentorId, setMentorId] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setComment("");
      setSignature("");
      setNotifySponsor(true);
      setChecklist({});
      setMentorId("");
      setError("");
    }
  }, [open, action]);

  // Load delivery mentors when approving — same source as the mentor panel.
  React.useEffect(() => {
    if (!open || action !== "approve") return;
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/superadmin/mentors", { cache: "no-store" });
        if (!res.ok) return;
        const body = await res.json();
        const list = (body?.mentors ?? body?.items ?? body?.data ?? body) as unknown;
        const arr = Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
        if (!alive) return;
        setMentors(
          arr
            .map((m) => {
              const name = (m.name as string) || (m.email as string) || "Mentor";
              const detail = (m.roleLabel as string) || (m.role as string) || "";
              return {
                id: String(m.id),
                name,
                email: m.email as string | undefined,
                label: detail ? `${name} — ${detail}` : name,
              };
            })
            .filter((m) => m.id),
        );
      } catch {
        /* leave empty */
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, action]);

  const allChecked = action !== "approve" || COMMERCIAL_CHECKLIST.every((item) => checklist[item.id]);
  const trimmedLen = comment.trim().length;
  // Signature (typed name) is required only when approving — it's the sign-off.
  const needsSignature = action === "approve";
  const signatureOk = !needsSignature || signature.trim().length >= SIGNATURE_MIN;

  function handleSubmit() {
    if (!allChecked) {
      setError("Complete all checklist items before approving.");
      return;
    }
    if (needsSignature && !signatureOk) {
      setError("Sign off by typing your full name to approve.");
      return;
    }
    if (trimmedLen < copy.minComment) {
      setError(`Add at least ${copy.minComment} characters — this comment is stored in the audit log.`);
      return;
    }
    const mentor = mentors.find((m) => m.id === mentorId);
    onConfirm({
      comment: comment.trim(),
      notifySponsor,
      checklist,
      signature: signature.trim(),
      mentorId: mentor?.id,
      mentorName: mentor?.name,
      mentorEmail: mentor?.email,
    });
  }

  const isReject = action === "reject";

  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose()}
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
            onClick={handleSubmit}
            disabled={submitting || !allChecked || !signatureOk || trimmedLen < copy.minComment}
            className={isReject ? dangerBtnClass : cn(primaryBtnClass, "px-5")}
            style={isReject ? undefined : primaryStyle}
          >
            {action === "approve" ? <CheckCircle2 className="h-4 w-4" strokeWidth={2.2} aria-hidden /> : null}
            {submitting ? "Submitting…" : copy.submit}
          </button>
        </>
      }
    >
      <ModalHead
        icon={copy.icon}
        tone={copy.tone}
        title={copy.title}
        description={copy.description}
        onClose={onClose}
        disabled={submitting}
      />
      <div className="px-5 sm:px-6 pb-5 space-y-5">
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-4 py-3">
          <p className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary">SOW</p>
          <p className="mt-0.5 font-body text-[14px] font-semibold text-foreground leading-snug">{sowTitle}</p>
        </div>

        {action === "approve" ? (
          <fieldset className="space-y-2">
            <legend className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-2">
              Platform checklist
            </legend>
            {COMMERCIAL_CHECKLIST.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-2.5 font-body text-[13px] text-foreground cursor-pointer rounded-lg border border-stroke-subtle bg-surface px-3.5 py-2.5 hover:bg-bg-subtle/60 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={Boolean(checklist[item.id])}
                  onChange={(e) => setChecklist((p) => ({ ...p, [item.id]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-stroke accent-[var(--c-violet-500)]"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </fieldset>
        ) : null}

        {action === "approve" ? (
          <div>
            <label htmlFor="admin-signature" className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
              Sign off — your full name
              <span style={{ color: TONE.error.text }}> *</span>
            </label>
            <input
              id="admin-signature"
              type="text"
              value={signature}
              onChange={(e) => {
                setSignature(e.target.value);
                setError("");
              }}
              placeholder="Type your full name to sign this approval"
              autoComplete="name"
              className={INPUT_FIELD}
            />
            <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">
              Recorded as the approver&apos;s signature in the audit log.
            </p>
          </div>
        ) : null}

        {action === "approve" ? (
          <div>
            <label htmlFor="assign-mentor" className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
              Delivery mentor <span className="font-normal text-text-tertiary">(optional)</span>
            </label>
            <select
              id="assign-mentor"
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
              className={INPUT_FIELD}
            >
              <option value="">{mentors.length ? "Assign a mentor on approval…" : "No mentors available"}</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">
              Glimmora&apos;s delivery mentor — assigned when you approve. You can also set this later.
            </p>
          </div>
        ) : null}

        <div>
          <label className="block font-body text-[12.5px] font-semibold text-foreground mb-1.5">
            Comment for audit log
            <span style={{ color: TONE.error.text }}> *</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError("");
            }}
            rows={4}
            placeholder={
              action === "approve"
                ? "e.g. Rates align with MSA; contributor pool confirmed for in-scope skills."
                : action === "send_back"
                  ? "Explain what the enterprise sponsor must revise before resubmission."
                  : "Document why the platform gate cannot proceed."
            }
            className={FIELD}
          />
          <p className="mt-1.5 font-body text-[11.5px] text-text-tertiary">
            {trimmedLen}/{copy.minComment} characters minimum
          </p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={notifySponsor}
            onChange={(e) => setNotifySponsor(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stroke accent-[var(--c-violet-500)]"
          />
          <span className="font-body text-[13px] text-text-secondary leading-snug">Notify enterprise sponsor (demo).</span>
        </label>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border px-3 py-2 font-body text-[12px]"
            style={{ background: TONE.error.soft, borderColor: TONE.error.border, color: TONE.error.text }}
          >
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
