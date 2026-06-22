"use client";

import * as React from "react";
import {
  CheckCircle2,
  Upload,
  FileSearch,
  Eye,
  AlertTriangle,
  PenLine,
  Sparkles,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AURORA_ACCENT } from "@/app/admin/_shell/aurora";

export interface FlowStep {
  label: string;
  icon: LucideIcon;
}

const DEFAULT_STEPS: FlowStep[] = [
  { label: "Upload",    icon: Upload },
  { label: "AI Report", icon: FileSearch },
  { label: "Review",    icon: Eye },
  { label: "Gaps",      icon: AlertTriangle },
  { label: "Details",   icon: PenLine },
  { label: "Generate",  icon: Sparkles },
  { label: "Confirm",   icon: ClipboardCheck },
];

interface FlowStepProgressProps {
  /** 1-indexed current step */
  currentStep: number;
  /** Optional custom steps (defaults to the 7-step upload flow) */
  steps?: FlowStep[];
  className?: string;
}

export function FlowStepProgress({ currentStep, steps = DEFAULT_STEPS, className }: FlowStepProgressProps) {
  return (
    <div className={cn("flex items-start", className)}>
      {steps.map((s, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isDone = stepNum < currentStep;
        const StepIcon = s.icon;

        return (
          <React.Fragment key={s.label}>
            {/* Step node */}
            <div
              className="flex flex-col items-center transition-all duration-200"
              style={{ width: 52, flexShrink: 0, gap: 6 }}
            >
              {/* Dot */}
              <div
                className="flex items-center justify-center shrink-0 transition-all duration-300"
                style={{
                  width: isActive ? 32 : 26,
                  height: isActive ? 32 : 26,
                  borderRadius: "50%",
                  backgroundImage: isActive ? AURORA_ACCENT : undefined,
                  background: isActive
                    ? undefined
                    : isDone
                    ? "var(--color-success-subtle)"
                    : "rgba(124,92,246,0.06)",
                  border: `1.5px solid ${
                    isActive
                      ? "rgba(124,92,246,0.40)"
                      : isDone
                      ? "var(--color-success-border)"
                      : "rgba(124,92,246,0.18)"
                  }`,
                  boxShadow: isActive ? "0 2px 10px rgba(124,92,246,0.30)" : "none",
                }}
              >
                {isDone ? (
                  <CheckCircle2 style={{ width: 12, height: 12, color: "var(--color-success-text)" }} />
                ) : (
                  <StepIcon
                    style={{
                      width: isActive ? 14 : 11,
                      height: isActive ? 14 : 11,
                      color: isActive ? "#FFFFFF" : "var(--color-text-tertiary)",
                      strokeWidth: 1.5,
                    }}
                  />
                )}
              </div>
              {/* Label */}
              <span
                style={{
                  fontSize: isActive ? 10 : 9,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive
                    ? "var(--color-foreground)"
                    : isDone
                    ? "var(--color-text-secondary)"
                    : "var(--color-text-tertiary)",
                  letterSpacing: "0.01em",
                  lineHeight: 1.2,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {s.label}
              </span>
            </div>

            {/* Connector */}
            {idx < steps.length - 1 && (
              <div style={{ flex: 1, paddingTop: 13, minWidth: 8 }}>
                <div
                  style={{
                    height: 2,
                    borderRadius: 2,
                    background:
                      stepNum < currentStep
                        ? "linear-gradient(90deg, rgba(124,92,246,0.55), rgba(56,122,246,0.30))"
                        : stepNum === currentStep
                        ? "linear-gradient(90deg, rgba(124,92,246,0.30), rgba(124,92,246,0.10))"
                        : "rgba(124,92,246,0.12)",
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
