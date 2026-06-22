"use client";

import * as React from "react";
import Link from "next/link";
import { Check, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import type { MockReviewerItem } from "@/mocks/reviewer";
import { cn } from "@/lib/utils/cn";
import {
  TONE,
  primaryBtnClass,
  primaryStyle,
  secondaryBtnClass,
  dangerBtnClass,
  AuroraTextarea,
} from "@/app/admin/_shell/aurora-ui";
import {
  QualityRatingPanel,
  QA_RATING_DIMENSIONS,
  ratingComplete,
  overallRating,
  type RatingValues,
} from "@/components/delivery/quality-rating";

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
  onSubmit: (body: {
    decision: QaDecision;
    comment: string;
    ratings?: RatingValues;
    ratingOverall?: number;
  }) => Promise<void>;
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
  const [ratings, setRatings] = React.useState<RatingValues>({});
  const [showRatingDialog, setShowRatingDialog] = React.useState(false);

  const needsComment = decision === "rework" || decision === "reject";
  const canSubmit = !needsComment || comment.trim().length > 0;
  // Accepting opens a rating dialog; the rating (all dimensions) is required there.
  const ratingsDone = ratingComplete(QA_RATING_DIMENSIONS, ratings);

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
        {decision === "accept" && (
          <p className="mt-2 font-body text-[11.5px] text-text-tertiary">
            You&apos;ll rate the work quality in the next step before it&apos;s accepted.
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="qa-decision-comment"
          className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1.5"
        >
          Comment {needsComment ? "(required)" : "(optional)"} — visible to contributor
        </label>
        <AuroraTextarea
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
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      {actionError && (
        <p role="alert" className="font-body text-[12px]" style={{ color: TONE.error.text }}>
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <Link href="/enterprise/reviewer" className={secondaryBtnClass}>
          Cancel
        </Link>
        <button
          type="button"
          disabled={!canSubmit || submitPending}
          onClick={() => {
            if (decision === "accept") {
              setShowRatingDialog(true);
              return;
            }
            void onSubmit({ decision, comment: comment.trim() });
          }}
          className={decision === "reject" ? dangerBtnClass : primaryBtnClass}
          style={decision === "reject" ? undefined : primaryStyle}
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

      {showRatingDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Quality rating"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !submitPending && setShowRatingDialog(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-md rounded-xl border border-stroke-subtle bg-surface shadow-xl p-5 space-y-4">
            <div>
              <h3 className="font-display text-[15px] font-bold tracking-[-0.01em] text-foreground">
                Rate the work quality
              </h3>
              <p className="mt-1 font-body text-[12px] text-text-secondary">
                Score each dimension before accepting. All are required.
              </p>
            </div>
            <QualityRatingPanel
              title="Quality rating (QA)"
              dimensions={QA_RATING_DIMENSIONS}
              values={ratings}
              onChange={setRatings}
              disabled={submitPending}
            />
            {actionError && (
              <p role="alert" className="font-body text-[12px]" style={{ color: TONE.error.text }}>
                {actionError}
              </p>
            )}
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                className={secondaryBtnClass}
                disabled={submitPending}
                onClick={() => setShowRatingDialog(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={primaryBtnClass}
                style={primaryStyle}
                disabled={!ratingsDone || submitPending}
                onClick={() =>
                  void onSubmit({
                    decision: "accept",
                    comment: comment.trim(),
                    ratings,
                    ratingOverall: overallRating(QA_RATING_DIMENSIONS, ratings),
                  })
                }
              >
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {submitPending ? "Submitting…" : "Confirm accept"}
              </button>
            </div>
          </div>
        </div>
      )}
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
      className="grid grid-cols-1 sm:grid-cols-3 gap-2"
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
              "text-left px-3 py-2.5 rounded-lg border transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.18)]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              active
                ? "border-[var(--c-violet-400)] bg-[var(--color-ai-surface)] ring-1 ring-[var(--c-violet-400)]"
                : "border-stroke-subtle bg-surface hover:bg-bg-subtle/60 hover:border-stroke",
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
