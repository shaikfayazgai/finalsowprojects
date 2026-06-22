"use client";

import * as React from "react";
import {
  Check,
  ClipboardCheck,
  ClipboardList,
  Gauge,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AURORA_ACCENT } from "@/app/admin/_shell/aurora";

export type IntakeStage =
  | "scope"
  | "ai_analysis"
  | "classification"
  | "readiness"
  | "commit";

export interface IntakeNode {
  id: IntakeStage;
  label: string;
  sub: string;
}

export const INTAKE_STAGES: IntakeNode[] = [
  { id: "scope", label: "Scope", sub: "Capture intent" },
  { id: "ai_analysis", label: "AI scope analysis", sub: "Estimate complexity" },
  { id: "classification", label: "Operational classification", sub: "Set governance" },
  { id: "readiness", label: "Decomposition readiness", sub: "Confirm handoff" },
  { id: "commit", label: "Program creation", sub: "Seed pipeline" },
];

const ICONS: Record<IntakeStage, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  scope: ClipboardList,
  ai_analysis: Sparkles,
  classification: Layers,
  readiness: Gauge,
  commit: ClipboardCheck,
};

interface IntakeStepperProps {
  current: IntakeStage;
}

export const IntakeStepper: React.FC<IntakeStepperProps> = ({ current }) => {
  const currentIdx = INTAKE_STAGES.findIndex((n) => n.id === current);
  return (
    <ol className="flex items-start">
      {INTAKE_STAGES.map((node, i) => {
        const Icon = ICONS[node.id];
        const isDone = i < currentIdx;
        const isCurrent = i === currentIdx;
        const accentNode = isCurrent || isDone;
        const nodeCls = isCurrent
          ? "text-white ring-4 ring-[rgba(124,92,246,0.16)]"
          : isDone
            ? "text-white"
            : "bg-white/55 text-text-tertiary ring-1 ring-white/70 backdrop-blur";
        const labelCls = isCurrent
          ? "text-foreground font-semibold"
          : isDone
            ? "text-foreground font-medium"
            : "text-text-secondary font-medium";
        const connectorActive = isDone || (isCurrent && i > 0);
        return (
          <React.Fragment key={node.id}>
            <li className="flex flex-col items-center w-[110px] shrink-0">
              <span
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-full",
                  "transition-colors duration-150",
                  nodeCls,
                )}
                style={accentNode ? { backgroundImage: AURORA_ACCENT } : undefined}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone ? (
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden />
                ) : isCurrent ? (
                  <Icon className="h-4 w-4" strokeWidth={2.2} aria-hidden />
                ) : (
                  <span className="font-body text-[12px] font-bold tabular-nums leading-none">
                    {i + 1}
                  </span>
                )}
              </span>
              <div className="mt-2.5 text-center px-1 w-full min-w-0">
                <p className={cn("font-body text-[12.5px] leading-tight truncate", labelCls)}>
                  {node.label}
                </p>
                <p className="font-body text-[10.5px] text-text-tertiary mt-0.5 leading-snug truncate">
                  {node.sub}
                </p>
              </div>
            </li>
            {i < INTAKE_STAGES.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "flex-1 h-[2px] mx-1 self-start mt-[15px]",
                  connectorActive ? "" : "bg-white/60",
                )}
                style={connectorActive ? { backgroundImage: AURORA_ACCENT } : undefined}
              />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
};
