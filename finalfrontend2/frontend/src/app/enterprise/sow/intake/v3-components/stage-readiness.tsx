"use client";

import * as React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";

interface ChecklistItem {
  id: string;
  label: string;
  status: "ok" | "warning" | "error";
  detail: string;
}

interface StageReadinessProps {
  readinessPct: number;
  checklist: ChecklistItem[];
}

export const StageReadiness: React.FC<StageReadinessProps> = ({
  readinessPct,
  checklist,
}) => {
  const tone: "success" | "warning" | "error" =
    readinessPct >= 90 ? "success" : readinessPct >= 70 ? "warning" : "error";

  return (
    <div className="space-y-5">
      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <header className="px-5 py-3.5 border-b border-white/55">
          <h2 className="font-display text-[14px] font-semibold text-foreground leading-tight">
            Decomposition readiness
          </h2>
          <p className="font-body text-[12px] text-text-tertiary mt-0.5 leading-snug">
            Composite score across scope completeness, classification, and risk signals. Must be ≥ 90 to commit.
          </p>
        </header>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-body text-[32px] font-semibold text-foreground tabular-nums leading-none">
              {readinessPct}
              <span className="text-[14px] text-text-tertiary font-medium ml-0.5">%</span>
            </p>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full",
                "font-body text-[11px] font-semibold uppercase tracking-wide",
                tone === "success"
                  ? "bg-success-subtle text-success-text"
                  : tone === "warning"
                    ? "bg-warning-subtle text-warning-text"
                    : "bg-error-subtle text-error-text",
              )}
            >
              {tone === "success" ? "Ready to commit" : tone === "warning" ? "Almost" : "Needs work"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-foreground/[0.08] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full",
                tone === "success"
                  ? "bg-[var(--color-success)]"
                  : tone === "warning"
                    ? "bg-[var(--color-warning)]"
                    : "bg-[var(--color-error)]",
              )}
              style={{ width: `${Math.max(2, Math.min(100, readinessPct))}%` }}
            />
          </div>
        </div>
      </section>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <header className="px-5 py-3.5 border-b border-white/55">
          <h2 className="font-display text-[14px] font-semibold text-foreground leading-tight">
            Checklist
          </h2>
          <p className="font-body text-[12px] text-text-tertiary mt-0.5 leading-snug">
            Each item drives one dimension of the score.
          </p>
        </header>
        <ul className="divide-y divide-white/60">
          {checklist.map((c) => (
            <li key={c.id} className="px-5 py-3 flex items-start gap-3 transition-colors duration-fast hover:bg-white/50">
              {c.status === "ok" ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success-text shrink-0 mt-[2px]" strokeWidth={2} aria-hidden />
              ) : (
                <XCircle
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 mt-[2px]",
                    c.status === "warning" ? "text-warning-text" : "text-error-text",
                  )}
                  strokeWidth={2}
                  aria-hidden
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-body text-[12.5px] font-semibold text-foreground leading-tight">
                  {c.label}
                </p>
                <p className="font-body text-[11.5px] text-text-secondary mt-0.5 leading-snug">
                  {c.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
