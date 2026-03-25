"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Plus } from "lucide-react";
import { fadeUp } from "@/lib/utils/motion-variants";
import type { Project, ProjectHealth } from "@/types/enterprise";

interface ProjectPipelineProps {
  projects: Project[];
  healthFilter: ProjectHealth | null;
}

const HEALTH_CFG: Record<ProjectHealth, { label: string; dot: string; bg: string; text: string }> = {
  on_track: { label: "On Track", dot: "bg-forest-500", bg: "bg-forest-50", text: "text-forest-700" },
  at_risk: { label: "At Risk", dot: "bg-gold-500", bg: "bg-gold-50", text: "text-gold-700" },
  behind: { label: "Behind", dot: "bg-red-500", bg: "bg-red-50", text: "text-red-700" },
  completed: { label: "Completed", dot: "bg-teal-500", bg: "bg-teal-50", text: "text-teal-700" },
};

const HEALTH_SORT: Record<ProjectHealth, number> = {
  behind: 1, at_risk: 2, on_track: 3, completed: 4,
};

export function ProjectPipeline({ projects, healthFilter }: ProjectPipelineProps) {
  const active = projects
    .filter((p) => p.health !== "completed")
    .filter((p) => !healthFilter || p.health === healthFilter)
    .sort((a, b) => HEALTH_SORT[a.health] - HEALTH_SORT[b.health]);

  const progressPercent = (p: Project) => {
    if (p.budget === 0) return 0;
    return Math.round((p.spent / p.budget) * 100);
  };

  return (
    <motion.div variants={fadeUp} className="card-parchment flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800">Project Pipeline</h2>
        <Link href="/enterprise/projects" className="flex items-center gap-1 text-[11px] font-medium text-brown-500 hover:text-brown-600">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Empty state */}
      {active.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-6 text-center">
          <p className="text-sm font-medium text-gray-600">
            {healthFilter ? "No projects match this filter." : "No active projects."}
          </p>
          <p className="text-[12px] text-gray-400 mt-1">
            {healthFilter ? "Try clearing the filter." : "Upload a SOW to get started."}
          </p>
          {!healthFilter && (
            <Link href="/enterprise/sow/intake" className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-brown-500 text-white text-[12px] font-medium hover:bg-brown-600 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New SOW
            </Link>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          {active.map((project, i) => {
            const hc = HEALTH_CFG[project.health];
            const pct = progressPercent(project);
            return (
              <Link key={project.id} href={`/enterprise/projects/${project.id}`}>
                <div
                  className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-black/[0.02]"
                  style={{ borderBottom: i < active.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                >
                  {/* Health dot */}
                  <span className={`w-2 h-2 rounded-full shrink-0 ${hc.dot}`} />
                  {/* Project info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-700 truncate" style={{ maxWidth: "40ch" }}>
                      {project.title}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{project.client}</div>
                  </div>
                  {/* Health badge */}
                  <span className={`text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${hc.bg} ${hc.text}`}>
                    {hc.label}
                  </span>
                  {/* Progress bar */}
                  <div className="w-16 shrink-0">
                    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${hc.dot.replace("bg-", "bg-")}`}
                        style={{ width: `${pct}%`, background: `var(--color-${project.health === "on_track" ? "forest" : project.health === "at_risk" ? "gold" : project.health === "behind" ? "danger" : "teal"}-500)` }}
                      />
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5 text-right tabular-nums">{pct}%</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
