"use client";

import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { uploadFlowSteps } from "@/mocks/data/sow-upload-flow";

interface WhatHappensNextProps {
  activeStep: number;
}

export function WhatHappensNext({ activeStep }: WhatHappensNextProps) {
  return (
    <div className="card-parchment px-5 py-5">
      <h3 className="text-[13px] font-semibold text-gray-800 mb-4">What Happens Next?</h3>
      <div className="space-y-1">
        {uploadFlowSteps.map((s) => {
          const isDone = activeStep > s.step;
          const isActive = activeStep === s.step;
          return (
            <div key={s.step} className={cn(
              "flex items-start gap-3 px-3 py-2 rounded-lg transition-all",
              isActive && "bg-brown-50",
            )}>
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0 mt-0.5" />
              ) : (
                <span className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5",
                  isActive ? "bg-brown-500 text-white" : "bg-gray-100 text-gray-400"
                )}>
                  {s.step}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "text-[11px] font-medium",
                  isDone ? "text-forest-600" : isActive ? "text-brown-700" : "text-gray-500"
                )}>
                  {s.label}
                </span>
                <p className="text-[10px] text-gray-400 leading-snug">{s.description}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 pt-3 text-center" style={{ borderTop: "1px solid var(--border-hair)" }}>
        <span className="text-[10px] text-gray-400">Estimated total time: ~40–50 minutes</span>
      </div>
    </div>
  );
}
