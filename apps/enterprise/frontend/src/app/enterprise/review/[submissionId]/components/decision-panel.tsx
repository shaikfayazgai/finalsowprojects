"use client";

import * as React from "react";
import Link from "next/link";
import { Check, CheckCircle2, RotateCcw } from "lucide-react";
import type { EnterpriseReviewHistoryItem } from "@/lib/enterprise/mocks/reviews";
import type { EnterpriseReviewQueueItem } from "@/lib/enterprise-review/types";
import { cn } from "@/lib/utils/cn";

type Decision = "accept" | "rework";

const REVIEW_CHECKLIST = [
  "Mentor quality sign-off is on record",
  "Evidence package matches the task brief",
  "Acceptance criteria reviewed — no open gaps",
  "Accept triggers billing eligibility for this deliverable",
];

const DECISION_OPTIONS: Array<{ value: Decision; label: string; short: string }> = [
  { value: "accept", label: "Accept", short: "Close loop · billing eligible" },
  { value: "rework", label: "Request rework", short: "Return to contributor" },
];

interface DecisionPanelProps {
  item: EnterpriseReviewQueueItem;
  decided: EnterpriseReviewHistoryItem | null;
  readOnly: boolean;
  onClaim: () => Promise<void>;
  onSubmit: (body: { decision: Decision; note: string }) => Promise<void>;
  claimPending: boolean;
  submitPending: boolean;
  actionError: string | null;
}

export function DecisionPanel({
  item,
  decided,
  readOnly,
  onClaim,
  onSubmit,
  claimPending,
  submitPending,
  actionError,
}: DecisionPanelProps) {
  const [decision, setDecision] = React.useState<Decision>("accept");
  const [note, setNote] = React.useState("");

  if (readOnly && decided) {
    const accepted = decided.decision === "accept";
    return (
      <div className="space-y-3">
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-body text-[12px] font-semibold",
            accepted ? "bg-success-subtle text-success-text" : "bg-warning-subtle text-warning-text",
          )}
        >
          {accepted ? (
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          )}
          {accepted ? "Accepted" : "Rework requested"}
        </div>
        <p className="font-body text-[12.5px] text-text-secondary">
          Decided{" "}
          {new Date(decided.decidedAt).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
        {decided.note ? (
          <p className="font-body text-[13px] text-foreground leading-relaxed rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3 py-2.5">
            {decided.note}
          </p>
        ) : null}
        {accepted ? (
          <Link
            href="/enterprise/billing/payouts"
            className="inline-flex items-center font-body text-[12.5px] font-semibold text-text-link hover:underline underline-offset-2"
          >
            View billing impact
          </Link>
        ) : null}
      </div>
    );
  }

  const needsNote = decision === "rework";
  const canSubmit = !needsNote || note.trim().length > 0;
  const busy = claimPending || submitPending;

  return (
    <div className="space-y-4">
      {!item.enterpriseReviewerId && (
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <p className="font-body text-[12px] text-text-secondary">
            Claim this submission or submit — claiming happens automatically on decide.
          </p>
          <button
            type="button"
            onClick={() => void onClaim()}
            disabled={busy}
            className="shrink-0 inline-flex items-center h-8 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover disabled:opacity-50"
          >
            {claimPending ? "Claiming…" : "Claim"}
          </button>
        </div>
      )}

      <ul className="space-y-2">
        {REVIEW_CHECKLIST.map((line) => (
          <li key={line} className="flex items-start gap-2 font-body text-[13px] text-text-secondary">
            <Check className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            {line}
          </li>
        ))}
      </ul>

      <div>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
          Your decision
        </p>
        <DecisionSegment value={decision} onChange={setDecision} disabled={busy} />
      </div>

      <div>
        <label
          htmlFor="acceptance-note"
          className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5"
        >
          Note {needsNote ? "(required)" : "(optional)"}
        </label>
        <textarea
          id="acceptance-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder={
            needsNote ? "Explain what needs to change…" : "Optional context for the audit trail…"
          }
          disabled={busy}
          className={cn(
            "w-full px-3 py-2 rounded-md bg-surface border border-stroke",
            "font-body text-[13px] text-foreground placeholder:text-text-disabled",
            "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
            "disabled:opacity-50 disabled:cursor-not-allowed resize-none",
          )}
        />
      </div>

      {actionError && (
        <p role="alert" className="font-body text-[12px] text-error-text">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <Link
          href="/enterprise/review"
          className="inline-flex items-center h-9 px-3.5 rounded-md border border-stroke bg-surface font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
        >
          Cancel
        </Link>
        <button
          type="button"
          disabled={!canSubmit || busy}
          onClick={() => void onSubmit({ decision, note: note.trim() })}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
            "bg-brand text-on-brand font-body text-[13px] font-semibold",
            "hover:bg-brand-hover transition-colors duration-fast",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {decision === "accept" ? (
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          )}
          {busy ? "Submitting…" : decision === "accept" ? "Accept deliverable" : "Request rework"}
        </button>
      </div>
    </div>
  );
}

function DecisionSegment({
  value,
  onChange,
  disabled,
}: {
  value: Decision;
  onChange: (v: Decision) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Acceptance decision"
      className="inline-flex p-0.5 rounded-lg border border-stroke-subtle bg-bg-subtle/50"
    >
      {DECISION_OPTIONS.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-3 py-2 rounded-md text-left min-w-[140px] transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              active ? "bg-surface shadow-xs" : "hover:bg-surface/60",
            )}
          >
            <span className="block font-body text-[13px] font-semibold text-foreground">
              {opt.label}
            </span>
            <span className="block font-body text-[10.5px] text-text-tertiary mt-0.5">
              {opt.short}
            </span>
          </button>
        );
      })}
    </div>
  );
}
