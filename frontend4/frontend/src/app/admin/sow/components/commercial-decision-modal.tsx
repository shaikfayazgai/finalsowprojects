"use client";

/**
 * Commercial decision modal — Meridian Modal (enterprise mark-as-paid pattern).
 */

import * as React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { listAdminMentors } from "@/lib/admin/mocks/mentors-service";

export const COMMERCIAL_CHECKLIST = [
  {
    id: "rate_cards",
    label: "Rate cards apply to the in-scope skill set",
  },
  {
    id: "effort",
    label: "Effort estimates fall within ±15% of historical",
  },
  {
    id: "payment_terms",
    label: "Payment terms align with master agreement",
  },
] as const;

export type CommercialDecisionAction = "approve" | "send_back" | "reject";

export interface CommercialDecisionPayload {
  comment: string;
  notifySponsor: boolean;
  checklist: Record<string, boolean>;
  /** Glimmora-assigned mentor (set on approve — locked flow: mentor is
   *  assigned by Glimmora at the platform/Commercial approval stage). */
  mentorId?: string;
  mentorName?: string;
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
  { title: string; description: string; submit: string; minComment: number }
> = {
  approve: {
    title: "Approve Commercial stage",
    description:
      "Confirm staffing viability, rate alignment, and scope fit. This is the final gate — approving closes the SOW.",
    submit: "Approve Commercial",
    minComment: 10,
  },
  send_back: {
    title: "Send back to Business",
    description:
      "Return the SOW to the enterprise sponsor for revision. Stage history is preserved.",
    submit: "Send back to Business",
    minComment: 15,
  },
  reject: {
    title: "Reject at Commercial gate",
    description:
      "This terminates the approval pipeline. The sponsor must clone and resubmit as a new version.",
    submit: "Reject SOW",
    minComment: 20,
  },
};

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

const textareaCls = cn(
  "w-full px-3 py-2.5 rounded-md resize-none",
  "bg-surface border border-stroke",
  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
);

export function CommercialDecisionModal({
  open,
  action,
  sowTitle,
  onClose,
  onConfirm,
  submitting,
}: CommercialDecisionModalProps) {
  const copy = ACTION_COPY[action];
  const mentors = React.useMemo(() => listAdminMentors(), []);
  const [comment, setComment] = React.useState("");
  const [notifySponsor, setNotifySponsor] = React.useState(true);
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({});
  const [mentorId, setMentorId] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (open) {
      setComment("");
      setNotifySponsor(true);
      setChecklist({});
      setMentorId("");
      setError("");
    }
  }, [open, action]);

  const allChecked =
    action !== "approve" ||
    COMMERCIAL_CHECKLIST.every((item) => checklist[item.id]);
  // Glimmora must assign a mentor when approving (locked flow).
  const mentorOk = action !== "approve" || mentorId !== "";

  function handleSubmit() {
    if (!allChecked) {
      setError("Complete all checklist items before approving.");
      return;
    }
    if (action === "approve" && !mentorId) {
      setError("Assign a mentor before approving (Glimmora assigns the mentor at this stage).");
      return;
    }
    if (comment.trim().length < copy.minComment) {
      setError(`Comment must be at least ${copy.minComment} characters (visible in audit).`);
      return;
    }
    const mentor = mentors.find((m) => m.id === mentorId);
    onConfirm({
      comment: comment.trim(),
      notifySponsor,
      checklist,
      mentorId: mentorId || undefined,
      mentorName: mentor?.name,
    });
  }

  const confirmCls = action === "reject" ? dangerBtnCls : primaryBtnCls;

  return (
    <Modal
      open={open}
      onClose={() => !submitting && onClose()}
      title={copy.title}
      description={copy.description}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={cancelBtnCls}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !allChecked || !mentorOk || comment.trim().length < copy.minComment}
            className={confirmCls}
          >
            {action === "approve" ? (
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            ) : action === "reject" ? (
              <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
            ) : null}
            {submitting ? "Submitting…" : copy.submit}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-md border border-stroke-subtle bg-bg-subtle/40 px-3 py-2">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            SOW
          </p>
          <p className="mt-0.5 font-body text-[13px] font-medium text-foreground leading-snug">
            {sowTitle}
          </p>
        </div>

        {action === "approve" && (
          <fieldset className="space-y-2">
            <legend className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
              Commercial checklist
            </legend>
            {COMMERCIAL_CHECKLIST.map((item) => (
              <label
                key={item.id}
                className="flex items-start gap-2.5 font-body text-[12.5px] text-foreground cursor-pointer rounded-md border border-stroke-subtle px-3 py-2 hover:bg-bg-subtle/40"
              >
                <input
                  type="checkbox"
                  checked={Boolean(checklist[item.id])}
                  onChange={(e) =>
                    setChecklist((p) => ({ ...p, [item.id]: e.target.checked }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-stroke text-brand focus:ring-brand"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </fieldset>
        )}

        {action === "approve" && (
          <div>
            <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
              Assign mentor
              <span className="text-error-text normal-case tracking-normal"> *</span>
            </span>
            <select
              value={mentorId}
              onChange={(e) => {
                setMentorId(e.target.value);
                setError("");
              }}
              className={cn(
                "w-full h-9 px-3 rounded-md bg-surface border border-stroke",
                "font-body text-[13px] text-foreground",
                "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
              )}
            >
              <option value="">Select a Glimmora mentor…</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <p className="mt-1 font-body text-[11px] text-text-tertiary">
              Glimmora assigns the mentor at this stage — present before delivery starts.
            </p>
          </div>
        )}

        <div>
          <span className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5">
            Comment
            <span className="text-error-text normal-case tracking-normal"> *</span>
          </span>
          <textarea
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError("");
            }}
            rows={4}
            placeholder={
              action === "approve"
                ? "e.g. Rates align with MSA-2026-0008; contributor pool confirmed for POS rollout."
                : action === "send_back"
                  ? "Explain what the enterprise sponsor must revise before resubmission."
                  : "Document why Commercial cannot proceed — visible to enterprise and audit."
            }
            className={textareaCls}
          />
          <p className="mt-1 font-body text-[11px] text-text-tertiary">
            Minimum {copy.minComment} characters · recorded in audit trail
          </p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={notifySponsor}
            onChange={(e) => setNotifySponsor(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-stroke text-brand focus:ring-brand"
          />
          <span className="font-body text-[12px] text-text-secondary leading-snug">
            Notify enterprise sponsor on decision (demo — queued locally)
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-error-border bg-error-subtle px-3 py-2 font-body text-[12px] text-error-text"
          >
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
