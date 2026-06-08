"use client";

import { CheckCircle2, ChevronRight } from "lucide-react";
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
  const completedCount = SECTIONS.filter((s) => sectionStatus[s.key] === "complete").length;

  return (
    <nav className={cn("card-parchment overflow-hidden", className)}>
      {/* Nav header */}
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sections</span>
        <span className="text-[10px] font-semibold text-gray-500">{completedCount}/7</span>
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
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                isActive ? "bg-brown-50 border border-brown-200" : "hover:bg-gray-50 border border-transparent",
              )}>
              {/* Status indicator */}
              {isComplete ? (
                <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
              ) : (
                <span className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                  isActive ? "bg-brown-500 text-white" : "bg-gray-100 text-gray-400",
                )}>
                  {sec.number}
                </span>
              )}

              <span className={cn(
                "flex-1 text-[12px] font-medium truncate",
                isActive ? "text-brown-700" : isComplete ? "text-forest-600" : "text-gray-600",
              )}>
                {sec.label}
              </span>

              {isActive && <ChevronRight className="w-3 h-3 text-brown-400 shrink-0" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export { SECTIONS };
