"use client";

import * as React from "react";
import { FileText, PencilLine, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type IntakeMode = "upload" | "compose" | "generate";

interface ModeSelectorProps {
  mode: IntakeMode;
  onChange: (mode: IntakeMode) => void;
}

const MODES: {
  id: IntakeMode;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}[] = [
  {
    id: "upload",
    icon: FileText,
    title: "Upload file",
    description: "Drop a signed SOW · we parse the scope",
  },
  {
    id: "compose",
    icon: PencilLine,
    title: "Compose from scratch",
    description: "Type the scope · use the guided form",
  },
  {
    id: "generate",
    icon: Sparkles,
    title: "Generate with AI",
    description: "Give a brief · AI drafts the structure",
  },
];

export const ModeSelector: React.FC<ModeSelectorProps> = ({ mode, onChange }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    {MODES.map((m) => {
      const isActive = m.id === mode;
      return (
        <button
          key={m.id}
          type="button"
          onClick={() => onChange(m.id)}
          aria-pressed={isActive}
          className={cn(
            "flex items-start gap-3 rounded-xl px-4 py-3.5 text-left",
            "transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
            isActive
              ? "ring-2 ring-[var(--color-brand)] bg-[color-mix(in_oklab,var(--color-brand)_4%,transparent)]"
              : "ring-1 ring-stroke-subtle bg-surface hover:bg-[var(--state-hover)]",
          )}
        >
          <span
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md ring-1 shrink-0",
              isActive
                ? "bg-[var(--color-brand)] text-text-inverse ring-[var(--color-brand)]"
                : "bg-[color-mix(in_oklab,var(--color-brand)_8%,transparent)] text-[var(--color-brand)] ring-[color-mix(in_oklab,var(--color-brand)_22%,transparent)]",
            )}
          >
            <m.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className={cn("font-body text-[13px] leading-tight", isActive ? "font-semibold text-foreground" : "font-semibold text-foreground")}>
              {m.title}
            </p>
            <p className="font-body text-[11.5px] text-text-tertiary mt-1 leading-snug">
              {m.description}
            </p>
          </div>
        </button>
      );
    })}
  </div>
);
