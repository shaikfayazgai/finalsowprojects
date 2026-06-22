"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { AURORA_ACCENT, DASH_CARD } from "@/app/admin/_shell/aurora";

export interface ClassificationValue {
  priority: "low" | "normal" | "high" | "critical";
  reviewModel: "standard" | "accelerated" | "deep";
  frameworks: string[];
}

interface StageClassificationProps {
  value: ClassificationValue;
  onChange: (patch: Partial<ClassificationValue>) => void;
}

const PRIORITIES: { id: ClassificationValue["priority"]; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "normal", label: "Normal" },
  { id: "high", label: "High" },
  { id: "critical", label: "Critical" },
];

const REVIEW_MODELS: { id: ClassificationValue["reviewModel"]; label: string; sub: string }[] = [
  { id: "standard", label: "Standard", sub: "4-gate parallel review" },
  { id: "accelerated", label: "Accelerated", sub: "Async approvals · 24h SLA" },
  { id: "deep", label: "Deep", sub: "Sequential review + risk audit" },
];

const FRAMEWORKS = ["SOC2", "GDPR", "HIPAA", "ISO27001", "PODL", "ESG"];

export const StageClassification: React.FC<StageClassificationProps> = ({
  value,
  onChange,
}) => {
  const toggleFramework = (f: string) => {
    const next = value.frameworks.includes(f)
      ? value.frameworks.filter((x) => x !== f)
      : [...value.frameworks, f];
    onChange({ frameworks: next });
  };

  return (
    <div className="space-y-5">
      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <header className="px-5 py-3.5 border-b border-stroke-subtle">
          <h2 className="font-display text-[14px] font-semibold text-foreground leading-tight">
            Operational classification
          </h2>
          <p className="font-body text-[12px] text-text-tertiary mt-0.5 leading-snug">
            Sets priority, review model, and compliance frameworks for this SOW.
          </p>
        </header>
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-2">
              Priority
            </p>
            <div className="inline-flex items-center gap-0.5 p-1 rounded-lg bg-bg-subtle ring-1 ring-stroke-subtle">
              {PRIORITIES.map((p) => {
                const isActive = p.id === value.priority;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onChange({ priority: p.id })}
                    className={cn(
                      "inline-flex items-center h-7 px-3 rounded-lg font-body text-[12px] font-medium",
                      "transition-colors duration-150",
                      isActive
                        ? "text-white font-semibold"
                        : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
                    )}
                    style={isActive ? { backgroundImage: AURORA_ACCENT, boxShadow: "0 8px 18px -10px rgba(108,76,230,0.6)" } : undefined}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-2">
              Review model
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {REVIEW_MODELS.map((m) => {
                const isActive = m.id === value.reviewModel;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onChange({ reviewModel: m.id })}
                    aria-pressed={isActive}
                    className={cn(
                      "text-left rounded-lg px-3 py-2.5",
                      "transition-all duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]",
                      isActive
                        ? "ring-2 ring-[var(--color-ai-border)] bg-[var(--color-ai-surface)]"
                        : "ring-1 ring-stroke-subtle bg-bg-subtle hover:bg-bg-subtle",
                    )}
                  >
                    <p className="font-body text-[12.5px] font-semibold text-foreground leading-tight">
                      {m.label}
                    </p>
                    <p className="font-body text-[11px] text-text-tertiary mt-0.5 leading-snug">
                      {m.sub}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-2">
              Compliance frameworks
              <span className="ml-1.5 font-medium normal-case tracking-normal text-text-tertiary">
                · select all that apply
              </span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FRAMEWORKS.map((f) => {
                const isActive = value.frameworks.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFramework(f)}
                    aria-pressed={isActive}
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full",
                      "font-body text-[11.5px] font-semibold",
                      "transition-colors duration-150",
                      isActive
                        ? "text-white"
                        : "bg-bg-subtle text-text-secondary ring-1 ring-stroke-subtle hover:bg-bg-subtle",
                    )}
                    style={isActive ? { backgroundImage: AURORA_ACCENT } : undefined}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
