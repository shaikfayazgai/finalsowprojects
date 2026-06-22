/**
 * Meridian — Stepper
 *
 * Wizard-style step indicator for SOW Intake, onboarding, and other
 * multi-stage flows. Differs from LifecycleStrip in that the stepper
 * implies sequential progress (back/continue) rather than declarative
 * lifecycle position.
 */

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface StepperStep {
  id: string;
  label: string;
  sub?: string;
}

interface StepperProps {
  steps: StepperStep[];
  /** Zero-based current step. */
  currentIndex: number;
  className?: string;
  onStepClick?: (index: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentIndex,
  className,
  onStepClick,
}) => {
  return (
    <ol
      className={cn("flex items-stretch gap-1.5", className)}
      aria-label="Progress"
    >
      {steps.map((step, idx) => {
        const isDone = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const clickable = !!onStepClick && (isDone || isCurrent);
        const Wrapper = clickable ? "button" : "div";
        return (
          <li key={step.id} className="flex-1 min-w-0">
            <Wrapper
              type={clickable ? "button" : undefined}
              onClick={clickable ? () => onStepClick?.(idx) : undefined}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "w-full text-left flex items-center gap-2.5 rounded-xl px-3 py-2.5 border transition-colors duration-fast ease-standard",
                isCurrent
                  ? "border-brand bg-brand-subtle/40"
                  : isDone
                  ? "border-success-border bg-success-subtle/30"
                  : "border-stroke bg-surface",
                clickable && "hover:border-stroke-strong cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold tabular-nums shrink-0 font-body",
                  isCurrent
                    ? "bg-brand text-on-brand"
                    : isDone
                    ? "bg-success text-on-brand"
                    : "bg-bg-subtle text-text-tertiary border border-stroke",
                )}
              >
                {isDone ? <Check className="h-3 w-3" strokeWidth={3} aria-hidden /> : idx + 1}
              </span>
              <div className="min-w-0">
                <p
                  className={cn(
                    "font-body text-[12px] font-semibold leading-tight",
                    isCurrent
                      ? "text-primary"
                      : isDone
                      ? "text-success-text"
                      : "text-text-secondary",
                  )}
                >
                  {step.label}
                </p>
                {step.sub && (
                  <p className="font-body text-[10px] text-text-tertiary mt-0.5 leading-snug">
                    {step.sub}
                  </p>
                )}
              </div>
            </Wrapper>
          </li>
        );
      })}
    </ol>
  );
};
