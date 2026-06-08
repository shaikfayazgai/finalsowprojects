"use client";

import * as React from "react";
import { Gauge, Layers, Sparkles, Timer, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface AiAnalysis {
  estimatedTasks: number;
  estimatedSkills: string[];
  estimatedDuration: string;
  capacityPctOfQuarter: number;
  confidence: number;
  risks: { title: string; tone: "warning" | "error" | "info" }[];
}

interface StageAiAnalysisProps {
  analysis: AiAnalysis;
}

export const StageAiAnalysis: React.FC<StageAiAnalysisProps> = ({ analysis }) => (
  <div className="space-y-5">
    <section className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
      <div className="px-5 py-4 flex items-start gap-4 flex-wrap bg-[color-mix(in_oklab,var(--color-brand)_4%,transparent)]">
        <span
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-md shrink-0",
            "bg-[color-mix(in_oklab,var(--color-brand)_10%,transparent)] text-[var(--color-brand)]",
            "ring-1 ring-[color-mix(in_oklab,var(--color-brand)_22%,transparent)]",
          )}
        >
          <Sparkles className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-1.5 font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
            AI analysis
          </p>
          <p className="font-body text-[18px] font-semibold text-foreground leading-tight mt-0.5">
            Scope estimate
          </p>
          <p className="font-body text-[12px] text-text-secondary mt-0.5 leading-snug">
            AI extracted the structured scope from your input. Review before continuing.
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
            Confidence
          </p>
          <p className="font-body text-[28px] font-semibold text-foreground tabular-nums leading-none">
            {analysis.confidence}
            <span className="text-[14px] text-text-tertiary font-medium ml-0.5">%</span>
          </p>
        </div>
      </div>
    </section>

    <section className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
      <header className="px-5 py-3.5 border-b border-stroke-subtle">
        <h2 className="font-body text-[14px] font-semibold text-foreground leading-tight">
          Workforce envelope
        </h2>
        <p className="font-body text-[12px] text-text-tertiary mt-0.5 leading-snug">
          Estimated tasks, skills, and capacity required to deliver this SOW.
        </p>
      </header>
      <ul className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat icon={Layers} label="Tasks" value={String(analysis.estimatedTasks)} />
        <Stat icon={Users} label="Skills" value={String(analysis.estimatedSkills.length)} />
        <Stat icon={Timer} label="Duration" value={analysis.estimatedDuration} />
        <Stat
          icon={Gauge}
          label="Capacity"
          value={`${analysis.capacityPctOfQuarter}%`}
        />
      </ul>
      {analysis.estimatedSkills.length > 0 && (
        <div className="px-5 py-3 border-t border-stroke-subtle">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-2">
            Required skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.estimatedSkills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-2 py-0.5 rounded-full font-body text-[11px] font-semibold bg-bg-subtle text-text-secondary"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>

    <section className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
      <header className="px-5 py-3.5 border-b border-stroke-subtle">
        <h2 className="font-body text-[14px] font-semibold text-foreground leading-tight">
          Risks detected
        </h2>
        <p className="font-body text-[12px] text-text-tertiary mt-0.5 leading-snug">
          Things to verify before pushing into the approval pipeline.
        </p>
      </header>
      {analysis.risks.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="font-body text-[13px] font-semibold text-foreground">
            No risks detected
          </p>
          <p className="font-body text-[12px] text-text-tertiary mt-1">
            Scope reads cleanly. Comparable to prior approved SOWs.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-stroke-subtle">
          {analysis.risks.map((r, i) => (
            <li key={i} className="px-5 py-3 flex items-start gap-3">
              <span
                aria-hidden
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 rounded-full shrink-0",
                  r.tone === "error"
                    ? "bg-[var(--color-error)]"
                    : r.tone === "warning"
                      ? "bg-[var(--color-warning)]"
                      : "bg-[var(--color-brand)]",
                )}
              />
              <p className="font-body text-[12.5px] text-foreground leading-snug">
                {r.title}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  </div>
);

const Stat: React.FC<{
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}> = ({ icon: Icon, label, value }) => (
  <li className="rounded-lg bg-bg-subtle/50 ring-1 ring-stroke-subtle px-3 py-2.5">
    <p className="inline-flex items-center gap-1.5 font-body text-[10px] font-bold uppercase tracking-[0.12em] text-text-tertiary mb-1">
      <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
      {label}
    </p>
    <p className="font-body text-[16px] font-semibold text-foreground tabular-nums leading-none">
      {value}
    </p>
  </li>
);
