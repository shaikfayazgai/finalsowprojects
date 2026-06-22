"use client";

import { Check } from "lucide-react";
import { REGISTRATION_STEPS } from "../data";

interface Props {
  step: number;
  onStepClick?: (n: number) => void;
}

export function StepProgress({ step, onStepClick }: Props) {
  return (
    <div className="flex items-center">
      {REGISTRATION_STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const active = n === step;
        const clickable = !!onStepClick && done;

        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick(n)}
                aria-label={`Go to step ${n}: ${label}`}
                aria-current={active ? "step" : undefined}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  done
                    ? "bg-teal-500 text-white shadow-sm shadow-teal-200"
                    : active
                    ? "bg-teal-700 text-white ring-4 ring-teal-100 shadow-sm"
                    : "bg-beige-100 text-beige-400 border border-beige-200"
                } ${clickable ? "cursor-pointer hover:scale-110 hover:ring-2 hover:ring-teal-300" : "cursor-default"}`}
              >
                {done ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : n}
              </button>
              <div className="flex flex-col items-center">
                <span
                  className={`text-[10px] font-semibold tracking-wide whitespace-nowrap transition-colors ${
                    done || active ? "text-teal-700" : "text-beige-400"
                  } ${clickable ? "cursor-pointer hover:underline" : ""}`}
                  onClick={() => clickable && onStepClick(n)}
                >
                  {label}
                </span>
              </div>
            </div>

            {i < REGISTRATION_STEPS.length - 1 && (
              <div className="flex-1 mx-2 mb-6">
                <div
                  className={`h-px transition-all duration-300 ${
                    done ? "bg-teal-400" : "bg-beige-200"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
