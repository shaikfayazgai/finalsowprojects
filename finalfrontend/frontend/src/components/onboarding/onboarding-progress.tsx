"use client";

/**
 * Step indicator for the /onboarding/* flow. The exact step set is
 * track-specific (student adds /student, women adds /women, internal
 * employees skip evidence + verify). The component just renders the
 * given list with one marked current.
 */

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface OnboardingStep {
  href: string;
  label: string;
}

export function OnboardingProgress({
  steps,
  current,
}: {
  steps: OnboardingStep[];
  current: string;
}) {
  const idx = steps.findIndex((s) => s.href === current);
  const pct = steps.length > 1 ? Math.round((idx / (steps.length - 1)) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
          Step {idx + 1} of {steps.length}
        </span>
        <span className="font-mono text-[11px] text-text-tertiary tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-bg-subtle overflow-hidden">
        <div
          className="h-full rounded-full bg-brand transition-all duration-fast"
          style={{ width: `${Math.max(pct, idx === 0 ? 8 : pct)}%` }}
        />
      </div>
      <ol className="flex flex-wrap gap-x-3 gap-y-1">
        {steps.map((s, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <li key={s.href}>
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
                  <Check className="h-2.5 w-2.5 text-success-text shrink-0" strokeWidth={3} aria-hidden />
                )}
                {done ? (
                  <Link href={s.href} className="hover:underline underline-offset-2">
                    {s.label}
                  </Link>
                ) : (
                  s.label
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Default step list — freelancer/most-common track.
export const DEFAULT_STEPS: OnboardingStep[] = [
  { href: "/onboarding/consent",      label: "Consent" },
  { href: "/onboarding/skills",       label: "Skills" },
  { href: "/onboarding/availability", label: "Availability" },
  { href: "/onboarding/evidence",     label: "Evidence" },
  { href: "/onboarding/verify",       label: "KYC" },
  { href: "/onboarding/complete",     label: "Done" },
];
