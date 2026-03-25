"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/utils/motion-variants";
import type { PortfolioCounts, ProjectHealth } from "@/types/enterprise";

interface HeaderStripProps {
  attentionCount: number;
  portfolio: PortfolioCounts;
  avgSla: number;
  healthFilter: ProjectHealth | null;
  onFilterChange: (h: ProjectHealth | null) => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}

const pills: { key: ProjectHealth; label: string; dotColor: string; bgActive: string; textActive: string; bgInactive: string; textInactive: string }[] = [
  { key: "on_track", label: "On Track", dotColor: "bg-forest-500", bgActive: "bg-forest-50", textActive: "text-forest-700", bgInactive: "bg-transparent", textInactive: "text-gray-500" },
  { key: "at_risk", label: "At Risk", dotColor: "bg-gold-500", bgActive: "bg-gold-50", textActive: "text-gold-700", bgInactive: "bg-transparent", textInactive: "text-gray-500" },
  { key: "behind", label: "Behind", dotColor: "bg-red-500", bgActive: "bg-red-50", textActive: "text-red-700", bgInactive: "bg-transparent", textInactive: "text-gray-500" },
];

export function HeaderStrip({ attentionCount, portfolio, avgSla, healthFilter, onFilterChange }: HeaderStripProps) {
  const greeting = getGreeting();
  const dateString = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const counts: Record<ProjectHealth, number> = {
    on_track: portfolio.onTrack,
    at_risk: portfolio.atRisk,
    behind: portfolio.behind,
    completed: 0,
  };

  return (
    <motion.div variants={fadeUp} className="flex items-end justify-between mb-7">
      {/* Left — Greeting */}
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Enterprise Console</div>
        <h1 className="font-heading text-[26px] font-semibold tracking-tight text-gray-900 leading-tight">
          {greeting}, <span className="text-brown-500">Priya.</span>
        </h1>
        <p className="mt-1 text-[13px] text-gray-500">
          {attentionCount > 0
            ? <>You have <span className="font-medium text-gray-700">{attentionCount} item{attentionCount > 1 ? "s" : ""}</span> requiring your attention.</>
            : "Everything is on track across your portfolio."}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">{dateString}</p>
      </div>

      {/* Center — Status Pills */}
      <div className="flex items-center gap-2">
        {pills.map((pill) => {
          const isActive = healthFilter === pill.key;
          return (
            <button
              key={pill.key}
              role="button"
              aria-pressed={isActive}
              aria-label={`Filter by ${pill.label}: ${counts[pill.key]} projects`}
              onClick={() => onFilterChange(isActive ? null : pill.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border
                ${isActive
                  ? `${pill.bgActive} ${pill.textActive} border-current/20`
                  : `${pill.bgInactive} ${pill.textInactive} border-gray-200 hover:border-gray-300`
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${pill.dotColor}`} />
              {pill.label}
              <span className="font-semibold">{counts[pill.key]}</span>
            </button>
          );
        })}

        {/* Right — Avg SLA */}
        <div className="ml-4 text-right pl-4 border-l border-gray-200">
          <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">Avg SLA</div>
          <div className="text-[22px] font-semibold text-gray-900 leading-none mt-0.5 tabular-nums">
            {avgSla > 0 ? `${avgSla}%` : "—"}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
