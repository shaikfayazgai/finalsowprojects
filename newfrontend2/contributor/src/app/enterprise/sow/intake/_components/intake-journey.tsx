"use client";

/**
 * Shared "Your path" journey rail + two-column wrapper for the SOW intake flow.
 * Every mode (choose / upload / author / generate) renders this so the
 * orientation stays consistent across the whole create-SOW journey.
 */

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GLASS_GRADIENT } from "@/app/admin/_shell/aurora";

export const JOURNEY_STEPS = [
  { label: "Choose method", sub: "How you want to start" },
  { label: "Add SOW details", sub: "Scope & confidentiality" },
  { label: "Assign approvers", sub: "Finance, Security, Legal" },
  { label: "Create & submit", sub: "Enter the pipeline" },
];

export function JourneyRail({ activeStep }: { activeStep: number }) {
  return (
    <ol className="relative">
      {JOURNEY_STEPS.map((step, i) => {
        const active = i === activeStep;
        const done = i < activeStep;
        return (
          <li key={step.label} className="relative flex gap-3 pb-6 last:pb-0">
            {i < JOURNEY_STEPS.length - 1 ? (
              <span aria-hidden className="absolute left-[13px] top-7 bottom-0 w-px bg-stroke-subtle" />
            ) : null}
            <span
              className={cn(
                "relative z-10 grid place-items-center h-[26px] w-[26px] rounded-full text-[11px] font-bold tabular-nums shrink-0",
                active || done ? "text-white" : "bg-bg-subtle text-text-tertiary ring-1 ring-stroke-subtle",
              )}
              style={active || done ? GLASS_GRADIENT : undefined}
            >
              {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <div className="min-w-0 pt-0.5">
              <p className={cn("font-body text-[13px] leading-tight", active ? "font-semibold text-foreground" : "font-medium text-text-secondary")}>
                {step.label}
              </p>
              <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary leading-snug">{step.sub}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Two-column layout: sticky journey rail (lg+) + the active step's content. */
export function IntakeJourney({ activeStep, children }: { activeStep: number; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[230px_1fr] items-start">
      <aside className="hidden lg:block lg:sticky lg:top-6">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-4">Your path</p>
        <JourneyRail activeStep={activeStep} />
      </aside>
      <div className="min-w-0 space-y-4">{children}</div>
    </div>
  );
}
