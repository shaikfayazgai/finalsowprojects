"use client";

import { CheckCircle2, ChevronRight, Circle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
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
  return (
    <nav className={cn("space-y-1", className)}>
      <div className="label-caps mb-3">Sections</div>
      {SECTIONS.map((sec) => {
        const status = sectionStatus[sec.key];
        const isActive = activeSection === sec.key;
        const isComplete = status === "complete";
        const isPrePopulated = status === "pre_populated";
        const isInProgress = status === "in_progress";

        return (
          <button
            key={sec.key}
            onClick={() => onSectionClick(sec.key)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
              isActive && "bg-brown-50 border border-brown-200",
              !isActive && "hover:bg-gray-50",
            )}
          >
            {/* Status icon */}
            {isComplete ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-forest-500 shrink-0" />
            ) : isPrePopulated ? (
              <div className="w-4.5 h-4.5 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <span className="text-[8px] font-bold text-teal-600">AI</span>
              </div>
            ) : isInProgress ? (
              <Circle className="w-4.5 h-4.5 text-gold-400 shrink-0" />
            ) : (
              <span className={cn(
                "w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                isActive ? "bg-brown-500 text-white" : "bg-gray-100 text-gray-400"
              )}>
                {sec.number}
              </span>
            )}

            {/* Label */}
            <span className={cn(
              "flex-1 text-[12px] font-medium truncate",
              isActive ? "text-brown-700" : isComplete ? "text-forest-700" : "text-gray-600"
            )}>
              {sec.label}
            </span>

            {/* Arrow for active */}
            {isActive && <ChevronRight className="w-3.5 h-3.5 text-brown-400 shrink-0" />}
          </button>
        );
      })}
    </nav>
  );
}

export { SECTIONS };
