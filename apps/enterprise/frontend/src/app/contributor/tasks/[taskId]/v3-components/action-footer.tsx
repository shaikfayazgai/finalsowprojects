"use client";

/**
 * Action footer V3 — sticky bottom, calm CTAs.
 *
 *   ┌───────────────────────────────────────────────────────────────┐
 *   │ ⚪⚪⚪  4 of 6 criteria ready    [ Save draft ]  [ Submit → ]   │
 *   └───────────────────────────────────────────────────────────────┘
 *
 * Submit is the primary brand-fill button. Save draft is the calm
 * secondary. Request clarification is tucked behind a tertiary text
 * link when a clarification thread can be opened.
 *
 * Soft pressure, no hard gate. Submission is always allowed; readiness
 * is shown as transparency, not gatekeeping.
 */

import * as React from "react";
import { ArrowRight, MessageSquareWarning } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { WorkroomTask } from "@/mocks/data/contributor-workroom-detail";

interface ActionFooterProps {
  task: WorkroomTask;
  onSubmit: () => void;
  onSaveDraft: () => void;
  onRequestClarification?: () => void;
}

export function ActionFooter({
  task,
  onSubmit,
  onSaveDraft,
  onRequestClarification,
}: ActionFooterProps) {
  const criteria = task.acceptanceCriteria ?? [];
  const total = criteria.length;
  const done = criteria.filter((c) => c.addressed).length;
  const ready = total > 0 ? Math.round((done / total) * 100) : 0;

  const dots = [0, 1, 2].map((i) => {
    const threshold = (total / 3) * (i + 1);
    return done >= threshold ? "full" : done >= threshold - total / 6 ? "half" : "empty";
  });

  return (
    <div className="sticky bottom-0 z-30 bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80 border-t border-stroke-subtle">
      <div className="py-3 flex items-center justify-between gap-3 flex-wrap">
        {/* Readiness signal */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1" aria-hidden>
            {dots.map((state, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full",
                  state === "full"
                    ? "bg-[var(--color-brand)]"
                    : state === "half"
                      ? "bg-[var(--color-brand)]/40"
                      : "bg-bg-subtle ring-1 ring-stroke-subtle",
                )}
              />
            ))}
          </div>
          <p className="font-body text-[12.5px] text-foreground leading-snug tabular-nums">
            <span className="font-semibold">
              {done} of {total}
            </span>{" "}
            criteria addressed
            <span className="text-text-tertiary ml-1.5">· readiness {ready}%</span>
          </p>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2 shrink-0">
          {onRequestClarification && (
            <button
              type="button"
              onClick={onRequestClarification}
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-md font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground hover:bg-[var(--state-hover)] transition-colors"
            >
              <MessageSquareWarning className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Request clarification
            </button>
          )}

          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex items-center justify-center h-9 px-3.5 rounded-md font-body text-[12.5px] font-semibold bg-surface ring-1 ring-stroke-subtle text-foreground hover:bg-[var(--state-hover)] transition-colors"
          >
            Save draft
          </button>

          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md font-body text-[12.5px] font-semibold bg-[var(--color-brand)] text-text-inverse hover:opacity-95 transition-opacity"
          >
            {task.state === "revision_requested" ? "Resubmit" : "Submit for review"}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
