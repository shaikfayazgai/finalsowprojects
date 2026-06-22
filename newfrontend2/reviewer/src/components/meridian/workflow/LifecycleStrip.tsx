/**
 * Meridian — LifecycleStrip
 *
 * Horizontal lifecycle visualization. Each stage is a tile with:
 *   - state ring (done / current / upcoming)
 *   - leading icon
 *   - label
 *   - optional sub-label
 *
 * Used by SOW Detail, Project Detail, Review Detail, and Delivery
 * Tracking. The N-stage shape is generic — pass the stages array.
 */

import * as React from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface LifecycleStage<T extends string = string> {
  id: T;
  label: string;
  sub?: string;
  icon?: React.ReactNode;
  /** "done" | "current" | "upcoming" — driven by your context, not stage order. */
  state: "done" | "current" | "upcoming";
}

interface LifecycleStripProps<T extends string> {
  stages: LifecycleStage<T>[];
  /** Optional eyebrow label rendered above the strip. */
  eyebrow?: React.ReactNode;
  className?: string;
}

export function LifecycleStrip<T extends string>({
  stages,
  eyebrow,
  className,
}: LifecycleStripProps<T>) {
  return (
    <section
      className={cn("rounded-2xl border border-stroke bg-surface px-5 py-4", className)}
    >
      {eyebrow && (
        <div className="font-body text-[10.5px] font-semibold uppercase tracking-[0.14em] text-text-secondary mb-3">
          {eyebrow}
        </div>
      )}
      <ol className="flex items-stretch gap-1 overflow-x-auto pb-1">
        {stages.map((stage, i) => {
          const isDone = stage.state === "done";
          const isCurrent = stage.state === "current";
          return (
            <React.Fragment key={stage.id}>
              <li
                className={cn(
                  "rounded-xl border px-3 py-2.5 min-w-[120px] flex-1 transition-colors",
                  isCurrent
                    ? "border-brand bg-brand-subtle/40 shadow-sm"
                    : isDone
                    ? "border-success-border bg-success-subtle/30"
                    : "border-stroke bg-bg-subtle/30",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold tabular-nums shrink-0 font-body",
                      isCurrent
                        ? "bg-brand text-on-brand"
                        : isDone
                        ? "bg-success text-on-brand"
                        : "bg-bg-subtle text-text-tertiary",
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3 w-3" strokeWidth={3} aria-hidden />
                    ) : (
                      i + 1
                    )}
                  </span>
                  {stage.icon && (
                    <span
                      aria-hidden
                      className={cn(
                        "shrink-0",
                        isCurrent
                          ? "text-brand-subtle-text"
                          : isDone
                          ? "text-success-text"
                          : "text-text-tertiary",
                      )}
                    >
                      {stage.icon}
                    </span>
                  )}
                </div>
                <p
                  className={cn(
                    "font-body text-[11.5px] font-semibold leading-tight",
                    isCurrent
                      ? "text-primary"
                      : isDone
                      ? "text-success-text"
                      : "text-text-secondary",
                  )}
                >
                  {stage.label}
                </p>
                {stage.sub && (
                  <p className="font-body text-[10px] text-text-tertiary mt-0.5 leading-snug">
                    {stage.sub}
                  </p>
                )}
              </li>
              {i < stages.length - 1 && (
                <span
                  aria-hidden
                  className="self-center text-text-disabled text-[14px] select-none shrink-0"
                >
                  →
                </span>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </section>
  );
}
