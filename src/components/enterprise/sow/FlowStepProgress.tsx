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
                  background: isActive
                    ? "linear-gradient(135deg, #A67763, #C4956E)"
                    : isDone
                    ? "rgba(77,87,65,0.12)"
                    : "rgba(166,119,99,0.06)",
                  border: `1.5px solid ${
                    isActive
                      ? "rgba(166,119,99,0.40)"
                      : isDone
                      ? "rgba(77,87,65,0.25)"
                      : "rgba(166,119,99,0.18)"
                  }`,
                  boxShadow: isActive ? "0 2px 10px rgba(166,119,99,0.25)" : "none",
                }}
              >
                {isDone ? (
                  <CheckCircle2 style={{ width: 12, height: 12, color: "#4D5741" }} />
                ) : (
                  <StepIcon
                    style={{
                      width: isActive ? 14 : 11,
                      height: isActive ? 14 : 11,
                      color: isActive ? "#FFFFFF" : "var(--ink-faint)",
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
                    ? "var(--ink)"
                    : isDone
                    ? "var(--ink-muted)"
                    : "var(--ink-faint)",
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
                        ? "linear-gradient(90deg, rgba(166,119,99,0.55), rgba(166,119,99,0.30))"
                        : stepNum === currentStep
                        ? "linear-gradient(90deg, rgba(166,119,99,0.30), rgba(166,119,99,0.10))"
                        : "rgba(166,119,99,0.12)",
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
