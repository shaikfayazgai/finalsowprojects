"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const FLOW_STEPS = [
  { step: 1, label: "Upload" },
  { step: 2, label: "EI Report" },
  { step: 3, label: "Review" },
  { step: 4, label: "Gaps" },
  { step: 5, label: "Details" },
  { step: 6, label: "Generate" },
  { step: 7, label: "Confirm" },
];

interface FlowStepProgressProps {
  currentStep: number;
  className?: string;
}

export function FlowStepProgress({ currentStep, className }: FlowStepProgressProps) {
  return (
    <div className={cn("flex items-start", className)}>
      {FLOW_STEPS.map((s, i) => {
        const isDone   = currentStep > s.step;
        const isActive = currentStep === s.step;

        return (
          <div key={s.step} className="flex items-start flex-1">
            {/* Step: circle + label stacked */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                isDone   && "bg-forest-500 text-white",
                isActive && "bg-gradient-to-br from-brown-400 to-brown-600 text-white shadow-sm",
                !isDone && !isActive && "bg-gray-100 text-gray-400",
              )}>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : s.step}
              </div>
              <span className={cn(
                "text-[9px] font-medium text-center leading-tight hidden sm:block",
                isDone   && "text-forest-600",
                isActive && "text-brown-700",
                !isDone && !isActive && "text-gray-400",
              )}>
                {s.label}
              </span>
            </div>

            {/* Connector line — between steps only */}
            {i < FLOW_STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-px mt-3.5 mx-1",
                isDone ? "bg-forest-300" : "bg-gray-200",
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
