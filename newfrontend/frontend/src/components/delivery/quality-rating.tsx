"use client";

/**
 * Quality rating — a lightweight 1–5★ rating across role-specific conditions,
 * shown on the mentor + reviewer Accept flows. NOT a formal rubric: just stars
 * per dimension with an averaged overall. Required (every dimension scored)
 * before an Accept can be submitted.
 */

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface RatingDimension {
  key: string;
  label: string;
  hint: string;
}

/** Mentor lens — craft, requirements + coaching. */
export const MENTOR_RATING_DIMENSIONS: RatingDimension[] = [
  { key: "requirements", label: "Requirements met", hint: "Fulfils the brief + acceptance criteria" },
  { key: "code_quality", label: "Code quality", hint: "Clean, readable, well-structured" },
  { key: "best_practices", label: "Best practices", hint: "Sound patterns, error handling, naming" },
  { key: "functionality", label: "Functionality", hint: "Works / behaves correctly" },
  { key: "communication", label: "Communication", hint: "Clarity of notes + evidence" },
];

/** Reviewer (QA) lens — acceptance, robustness + safety. */
export const QA_RATING_DIMENSIONS: RatingDimension[] = [
  { key: "acceptance", label: "Acceptance criteria met", hint: "Each stated criterion is satisfied" },
  { key: "code_quality", label: "Code quality", hint: "Implementation quality of the deliverable" },
  { key: "testing", label: "Testing & robustness", hint: "Edge cases handled, no obvious breakage" },
  { key: "security", label: "Security / safety", hint: "No obvious vulnerabilities or unsafe handling" },
  { key: "documentation", label: "Documentation / handoff", hint: "Documented enough to deploy / hand off" },
];

export type RatingValues = Record<string, number>;

export function overallRating(dims: RatingDimension[], values: RatingValues): number {
  const scores = dims.map((d) => values[d.key] || 0).filter((s) => s > 0);
  if (scores.length === 0) return 0;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

export function ratingComplete(dims: RatingDimension[], values: RatingValues): boolean {
  return dims.every((d) => (values[d.key] || 0) > 0);
}

export function QualityRatingPanel({
  title,
  dimensions,
  values,
  onChange,
  disabled,
}: {
  title?: string;
  dimensions: RatingDimension[];
  values: RatingValues;
  // A React state dispatch so each star uses a functional update — robust to fast
  // consecutive clicks (no stale-closure overwrites).
  onChange: React.Dispatch<React.SetStateAction<RatingValues>>;
  disabled?: boolean;
}) {
  const overall = overallRating(dimensions, values);
  const done = ratingComplete(dimensions, values);
  return (
    <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/30 p-3 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
          {title ?? "Quality rating"} <span style={{ color: "#dc2626" }}>*</span>
        </p>
        <span className="font-body text-[12px] font-semibold text-foreground tabular-nums">
          {overall > 0 ? `${overall.toFixed(1)} / 5` : "—"}
        </span>
      </div>
      <div className="space-y-2">
        {dimensions.map((d) => (
          <div key={d.key} className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-body text-[12.5px] font-medium text-foreground">{d.label}</p>
              <p className="font-body text-[10.5px] text-text-tertiary">{d.hint}</p>
            </div>
            <StarRating
              value={values[d.key] || 0}
              onChange={(v) => onChange((prev) => ({ ...prev, [d.key]: v }))}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
      {!done && (
        <p className="font-body text-[10.5px] text-text-tertiary">
          Rate every dimension to enable Accept.
        </p>
      )}
    </div>
  );
}

function StarRating({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = React.useState(0);
  return (
    <div className="flex items-center gap-0.5 shrink-0" role="radiogroup" aria-label="rating">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className={cn("p-0.5", disabled && "cursor-not-allowed opacity-60")}
          >
            <Star
              className="h-4 w-4 transition-colors"
              style={{ color: active ? "#f59e0b" : "var(--color-stroke-subtle, #d4d4d8)" }}
              fill={active ? "#f59e0b" : "none"}
              strokeWidth={2}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
