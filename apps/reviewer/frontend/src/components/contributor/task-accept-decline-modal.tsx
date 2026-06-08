"use client";

/**
 * Accept / Decline modal — spec §5.D.4.
 *
 * Two modes:
 *   - "accept": one-click confirm with deadline + rate, copy "30 min step-back"
 *   - "decline": reason radio (skills / capacity / deadline / conflict / other)
 *
 * Caller controls open state + mode. Mutations are passed in so this
 * file stays presentational.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAcceptTask, useDeclineTask } from "@/lib/hooks/use-contributor-tasks";
import { ContributorApiError, type ContributorTaskSummary, type DeclineReason } from "@/lib/api/contributor-tasks";
import {
  CONTRIBUTOR_PAYMENT_NOTE,
  fmtDeliveryDeadline,
  fmtEstimatedPayoutOnAcceptance,
} from "@/app/contributor/tasks/lib/task-list-utils";
import { cn } from "@/lib/utils/cn";

interface Props {
  task: ContributorTaskSummary;
  mode: "accept" | "decline";
  open: boolean;
  onClose: () => void;
}

const DECLINE_REASONS: Array<{ value: DeclineReason; label: string }> = [
  { value: "skills", label: "I don't have the right skills" },
  { value: "capacity", label: "I don't have capacity" },
  { value: "deadline", label: "The submit-by deadline is too tight" },
  { value: "conflict", label: "Conflict with another task" },
  { value: "other", label: "Other" },
];

export function TaskAcceptDeclineModal({ task, mode, open, onClose }: Props) {
  const router = useRouter();
  const accept = useAcceptTask(task.id);
  const decline = useDeclineTask(task.id);

  const [reason, setReason] = React.useState<DeclineReason>("capacity");
  const [otherNote, setOtherNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) { setReason("capacity"); setOtherNote(""); setError(null); }
  }, [open]);

  if (!open) return null;

  const doAccept = async () => {
    setError(null);
    try {
      await accept.mutateAsync();
      onClose();
      router.push(`/contributor/tasks/${task.id}`);
    } catch (e) {
      setError(e instanceof ContributorApiError ? e.message : (e as Error).message);
    }
  };

  const doDecline = async () => {
    setError(null);
    if (reason === "other" && !otherNote.trim()) {
      setError("Please tell us why you're declining.");
      return;
    }
    try {
      await decline.mutateAsync({
        reason,
        note: reason === "other" ? otherNote.trim() : undefined,
      });
      onClose();
    } catch (e) {
      setError(e instanceof ContributorApiError ? e.message : (e as Error).message);
    }
  };

  const isAccept = mode === "accept";
  const delivery = fmtDeliveryDeadline(task);
  const payoutLabel = fmtEstimatedPayoutOnAcceptance(task);
  const busy = accept.isPending || decline.isPending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4"
      onClick={busy ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-surface shadow-lg border border-stroke"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 py-3 border-b border-stroke-subtle">
          <h3
            id="task-modal-title"
            className="font-body text-[14px] font-semibold text-foreground"
          >
            {isAccept ? "Accept this task?" : "Decline this task?"}
          </h3>
        </header>

        {isAccept ? (
          <div className="px-4 py-3 space-y-2">
            <p className="font-body text-[13px] font-medium text-foreground">{task.title}</p>
            {delivery.text !== "—" && (
              <p
                className={cn(
                  "font-body text-[12px]",
                  delivery.overdue ? "text-error-text font-medium" : "text-text-secondary",
                )}
              >
                Delivery deadline · {delivery.text}
              </p>
            )}
            {payoutLabel && (
              <p className="font-body text-[12px] font-medium text-foreground">{payoutLabel}</p>
            )}
            <p className="font-body text-[11.5px] text-text-tertiary leading-relaxed">
              {CONTRIBUTOR_PAYMENT_NOTE}
            </p>
            <p className="font-body text-[12px] text-text-tertiary">
              You&apos;ll have 30 minutes to step back if you change your mind.
            </p>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-3">
            <p className="font-body text-[12.5px] text-text-secondary">
              Help us improve matching — why are you declining?
            </p>
            <div role="radiogroup" aria-labelledby="decline-reason-legend" className="space-y-1.5">
              <p id="decline-reason-legend" className="sr-only">Reason</p>
              {DECLINE_REASONS.map((r) => (
                <label
                  key={r.value}
                  className="flex items-center gap-2 font-body text-[12.5px] text-foreground cursor-pointer"
                >
                  <input
                    type="radio"
                    name="decline-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="h-3.5 w-3.5 accent-brand"
                  />
                  {r.label}
                </label>
              ))}
            </div>
            {reason === "other" && (
              <input
                type="text"
                value={otherNote}
                onChange={(e) => setOtherNote(e.target.value)}
                placeholder="Tell us briefly…"
                maxLength={200}
                className={cn(
                  "w-full h-9 px-3 rounded-md",
                  "bg-surface border border-stroke",
                  "font-body text-[13px] text-foreground placeholder:text-text-disabled",
                  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
                )}
              />
            )}
          </div>
        )}

        {error && (
          <p className="px-4 pb-2 font-body text-[12px] text-error-text">{error}</p>
        )}

        <footer className="flex items-center justify-end gap-2 px-4 py-3 border-t border-stroke-subtle bg-bg-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex items-center h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={isAccept ? doAccept : doDecline}
            disabled={busy}
            className={cn(
              "inline-flex items-center h-9 px-3.5 rounded-md shadow-xs font-body text-[13px] font-semibold transition-colors duration-fast disabled:opacity-60 disabled:cursor-not-allowed",
              isAccept
                ? "bg-brand text-on-brand hover:bg-brand-hover"
                : "bg-error-text text-white hover:opacity-90",
            )}
          >
            {isAccept
              ? (accept.isPending ? "Accepting…" : "Accept and open")
              : (decline.isPending ? "Declining…" : "Decline task")}
          </button>
        </footer>
      </div>
    </div>
  );
}
