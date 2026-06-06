"use client";

import * as React from "react";
import Link from "next/link";
import { Check, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import type { MockReviewerItem } from "@/mocks/reviewer";
import { cn } from "@/lib/utils/cn";

export type QaDecision = "accept" | "rework" | "reject";

const QA_CHECKLIST = [
  "Mentor quality sign-off is on record — scoring shown below",
  "Evidence package matches the task brief",
  "File scan results reviewed (virus + similarity)",
  "Your decision routes to enterprise acceptance if accepted",
];

const DECISION_OPTIONS: Array<{
  value: QaDecision;
  label: string;
  short: string;
}> = [
  { value: "accept", label: "Accept", short: "Forward to enterprise acceptance" },
  { value: "rework", label: "Request rework", short: "Return to contributor" },
  { value: "reject", label: "Reject", short: "Close submission · no payout" },
];

interface QaDecisionPanelProps {
  review: MockReviewerItem;
  onSubmit: (body: { decision: QaDecision; comment: string }) => Promise<void>;
  submitPending: boolean;
  actionError: string | null;
}

export function QaDecisionPanel({
  review,
  onSubmit,
  submitPending,
  actionError,
}: QaDecisionPanelProps) {
  const [decision, setDecision] = React.useState<QaDecision>("accept");
  const [comment, setComment] = React.useState("");

  const needsComment = decision === "rework" || decision === "reject";
  const canSubmit = !needsComment || comment.trim().length > 0;

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {QA_CHECKLIST.map((line) => (
          <li key={line} className="flex items-start gap-2 font-body text-[13px] text-text-secondary">
            <Check className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
            {line}
          </li>
        ))}
      </ul>

      {review.round >= 2 && (
        <p className="font-body text-[12px] text-text-secondary rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3 py-2">
          Round {review.round} of {review.totalRounds} — compare the version diff below before deciding.
        </p>
      )}

      <div>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">
          Your decision
        </p>
        <DecisionSegment value={decision} onChange={setDecision} disabled={submitPending} />
      </div>

      <div>
        <label
          htmlFor="qa-decision-comment"
          className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5"
        >
          Comment {needsComment ? "(required)" : "(optional)"} — visible to contributor
        </label>
        <textarea
          id="qa-decision-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder={
            decision === "accept"
              ? "Optional note for the contributor…"
              : decision === "rework"
                ? "What needs to change before resubmission?"
                : "Required: explain why this submission is being rejected…"
          }
          disabled={submitPending}
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
          href="/enterprise/reviewer"
          className="inline-flex items-center h-9 px-3.5 rounded-md border border-stroke bg-surface font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
        >
          Cancel
        </Link>
        <button
          type="button"
          disabled={!canSubmit || submitPending}
          onClick={() => void onSubmit({ decision, comment: comment.trim() })}
          className={cn(
            "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md font-body text-[13px] font-semibold transition-colors duration-fast",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            decision === "reject"
              ? "bg-error-solid text-on-brand hover:bg-error shadow-sm"
              : "bg-brand text-on-brand hover:bg-brand-hover",
          )}
        >
          {decision === "accept" ? (
            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          ) : decision === "rework" ? (
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          ) : (
            <XCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          )}
          {submitPending
            ? "Submitting…"
            : decision === "accept"
              ? "Accept for enterprise"
              : decision === "rework"
                ? "Request rework"
                : "Reject submission"}
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
  value: QaDecision;
  onChange: (v: QaDecision) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="QA decision"
      className="inline-flex flex-wrap p-0.5 rounded-lg border border-stroke-subtle bg-bg-subtle/50 gap-0.5"
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
              "px-3 py-2 rounded-md text-left min-w-[128px] transition-colors duration-fast",
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
