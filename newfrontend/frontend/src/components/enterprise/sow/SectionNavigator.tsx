"use client";

import { CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GLASS_CARD, GLASS_SHADOW, AURORA_ACCENT, TONE } from "@/app/admin/_shell/aurora-ui";
import type { CommercialSectionKey, CommercialSectionStatus } from "@/types/enterprise";

const SECTIONS: { key: CommercialSectionKey; label: string; number: number }[] = [
  { key: "businessContext", label: "Business Context", number: 1 },
  { key: "deliveryScope", label: "Delivery Scope", number: 2 },
  { key: "techIntegrations", label: "Tech & Integrations", number: 3 },
  { key: "timelineTeam", label: "Timeline, Team & Testing", number: 4 },
  { key: "budgetRisk", label: "Budget & Risk", number: 5 },
  { key: "governance", label: "Governance & Compliance", number: 6 },
  { key: "commercialLegal", label: "Commercial & Legal", number: 7 },
];

interface SectionNavigatorProps {
  activeSection: CommercialSectionKey;
  sectionStatus: Record<CommercialSectionKey, CommercialSectionStatus>;
  onSectionClick: (key: CommercialSectionKey) => void;
  className?: string;
}

export function SectionNavigator({ activeSection, sectionStatus, onSectionClick, className }: SectionNavigatorProps) {
  const completedCount = SECTIONS.filter((s) => sectionStatus[s.key] === "complete").length;

  return (
    <nav className={cn(GLASS_CARD, "overflow-hidden", className)} style={GLASS_SHADOW}>
      {/* Nav header */}
      <div className="px-4 py-3.5 border-b border-white/55 flex items-center justify-between">
        <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Sections</span>
        <span className="text-[10px] font-semibold text-text-secondary">{completedCount}/7</span>
      </div>

      <div className="p-2 space-y-0.5">
        {SECTIONS.map((sec) => {
          const status = sectionStatus[sec.key];
          const isActive = activeSection === sec.key;
          const isComplete = status === "complete";

          return (
            <button
              key={sec.key}
              onClick={() => onSectionClick(sec.key)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-fast border",
                isActive ? "bg-white/70 border-white/70" : "hover:bg-white/50 border-transparent",
              )}>
              {/* Status indicator */}
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: TONE.success.dot }} />
              ) : (
                <span
                  className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                    isActive ? "text-white" : "bg-white/65 border border-white/70 text-text-tertiary",
                  )}
                  style={isActive ? { backgroundImage: AURORA_ACCENT } : undefined}
                >
                  {sec.number}
                </span>
              )}

              <span
                className="flex-1 text-[12px] font-medium truncate"
                style={{ color: isActive ? "var(--color-foreground)" : isComplete ? TONE.success.text : "var(--color-text-secondary)" }}
              >
                {sec.label}
              </span>

              {isActive && <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export { SECTIONS };
