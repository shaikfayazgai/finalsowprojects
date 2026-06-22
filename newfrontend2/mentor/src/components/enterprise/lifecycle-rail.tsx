"use client";

import { cn } from "@/lib/utils/cn";

export type LifecycleStepId =
  | "intake"
  | "approval"
  | "decompose"
  | "provision"
  | "assign"
  | "execute"
  | "review"
  | "pay";

const STEPS: Array<{ id: LifecycleStepId; label: string }> = [
  { id: "intake", label: "Intake" },
  { id: "approval", label: "Approval" },
  { id: "decompose", label: "Decompose" },
  { id: "provision", label: "Project" },
  { id: "assign", label: "Assign" },
  { id: "execute", label: "Execute" },
  { id: "review", label: "Review" },
  { id: "pay", label: "Pay" },
];

interface Props {
  current: LifecycleStepId;
  caption?: string;
  className?: string;
}

export function LifecycleRail({ current, caption, className }: Props) {
  const idx = STEPS.findIndex((s) => s.id === current);

  return (
    <div
      className={cn(
        "rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-3 py-2.5",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
          Platform lifecycle
        </p>
        {caption && (
          <p className="font-body text-[11px] text-text-secondary">{caption}</p>
        )}
      </div>
      <ol className="flex flex-wrap items-center gap-1">
        {STEPS.map((step, i) => {
          const done = i < idx;
          const active = i === idx;
          return (
            <li key={step.id} className="flex items-center gap-1">
              <span
                className={cn(
                  "inline-flex h-6 items-center px-2 rounded-md font-body text-[10.5px] font-semibold",
                  done && "bg-success-subtle text-success-text",
                  active && "bg-brand text-on-brand",
                  !done && !active && "bg-surface border border-stroke-subtle text-text-tertiary",
                )}
              >
                {step.label}
              </span>
              {i < STEPS.length - 1 && (
                <span aria-hidden className="font-mono text-[10px] text-text-disabled">
                  →
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
