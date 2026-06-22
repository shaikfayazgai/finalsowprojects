"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface MentorOnboardingStep {
  id: string;
  label: string;
}

export function MentorOnboardingProgress({
  steps,
  currentIndex,
}: {
  steps: MentorOnboardingStep[];
  currentIndex: number;
}) {
  const pct =
    steps.length > 1 ? Math.round((currentIndex / (steps.length - 1)) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          Step {currentIndex + 1} of {steps.length}
        </span>
        <span className="font-mono text-[11px] text-text-tertiary tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-subtle overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-all duration-fast"
          style={{ width: `${Math.max(pct, currentIndex === 0 ? 8 : pct)}%` }}
        />
      </div>
      <ol className="flex flex-wrap gap-x-3 gap-y-1">
        {steps.map((s, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={s.id}>
              <span
                className={cn(
                  "font-body text-[10.5px] inline-flex items-center gap-1",
                  active
                    ? "text-foreground font-semibold"
                    : done
                      ? "text-text-secondary"
                      : "text-text-tertiary",
                )}
              >
                {done && (
                  <Check
                    className="h-2.5 w-2.5 text-success-text shrink-0"
                    strokeWidth={3}
                    aria-hidden
                  />
                )}
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
