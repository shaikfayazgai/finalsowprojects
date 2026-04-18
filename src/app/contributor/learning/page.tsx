"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  GraduationCap, Clock, TrendingUp, Zap, BookOpen, Target,
  ChevronRight, ArrowRight, Sparkles, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockLearningRecommendations } from "@/mocks/data/contributor";

/* ═══ Badge ═══ */

const badgeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  forest: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  gold: { bg: "bg-gold-50", text: "text-gold-700", dot: "bg-gold-500" },
  brown: { bg: "bg-brown-50", text: "text-brown-700", dot: "bg-brown-500" },
  beige: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  danger: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

function Badge({ variant, dot, children }: { variant: string; dot?: boolean; children: React.ReactNode }) {
  const s = badgeStyles[variant] || badgeStyles.beige;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full", s.bg, s.text)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />}
      {children}
    </span>
  );
}

/* ═══ Helpers ═══ */

const priorityConfig: Record<string, { variant: string; label: string }> = {
  high: { variant: "brown", label: "High Priority" },
  medium: { variant: "gold", label: "Medium" },
  low: { variant: "beige", label: "Low" },
};

const difficultyConfig: Record<string, { variant: string; label: string }> = {
  beginner: { variant: "forest", label: "Beginner" },
  intermediate: { variant: "teal", label: "Intermediate" },
  advanced: { variant: "gold", label: "Advanced" },
  expert: { variant: "brown", label: "Expert" },
};

const typeConfig: Record<string, { icon: React.ElementType; iconBg: string; label: string }> = {
  task_based: { icon: Target, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600", label: "Task-based" },
  skill_based: { icon: Sparkles, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600", label: "Skill-based" },
  pathway: { icon: BookOpen, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600", label: "Pathway" },
};

/* ═══ PAGE ═══ */

export default function LearningPage() {
  const recommendations = mockLearningRecommendations;
  const taskBased = recommendations.filter((r) => r.type === "task_based");
  const skillBased = recommendations.filter((r) => r.type === "skill_based");

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">Learning</h1>
        <p className="text-[13px] text-gray-400 mt-1">AI-powered recommendations to grow your skills and unlock higher-value tasks</p>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Recommendations", value: recommendations.length, icon: Sparkles, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "Task-based", value: taskBased.length, icon: Target, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "Skill-based", value: skillBased.length, icon: Zap, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { label: "Total Hours", value: `${recommendations.reduce((s, r) => s + r.estimatedHours, 0)}h`, icon: Clock, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.iconBg)}>
                <KpiIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ EMPTY STATE ═══ */}
      {recommendations.length === 0 && (
        <motion.div variants={fadeUp} className="card-parchment px-6 py-16 text-center">
          <Sparkles className="w-8 h-8 mx-auto mb-3 text-gray-300" />
          <p className="text-[14px] font-medium text-gray-500 mb-1">No recommendations yet</p>
          <p className="text-[12px] text-gray-400 max-w-[360px] mx-auto">Complete tasks and add skills to your profile to receive personalised AI learning suggestions.</p>
        </motion.div>
      )}

      {/* ═══ TASK-BASED RECOMMENDATIONS ═══ */}
      {taskBased.length > 0 && (
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Recommended for Your Tasks</h2>
            <span className="text-[11px] text-gray-400">{taskBased.length} recommendations</span>
          </div>
          <div className="space-y-3">
            {taskBased.map((rec) => {
              const typeInfo = typeConfig[rec.type] || typeConfig.task_based;
              const priorityInfo = priorityConfig[rec.priority] || priorityConfig.medium;
              const diffInfo = difficultyConfig[rec.difficulty ?? "intermediate"] || difficultyConfig.intermediate;
              const TypeIcon = typeInfo.icon;

              return (
                <div key={rec.id} className="card-parchment overflow-hidden">
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", typeInfo.iconBg)}>
                        <TypeIcon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[14px] font-semibold text-gray-800">{rec.title}</span>
                          <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
                          <Badge variant={diffInfo.variant}>{diffInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2">
                          <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{rec.skill}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{rec.estimatedHours}h</span>
                        </div>
                        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-teal-50 mb-3">
                          <Sparkles className="w-3 h-3 text-teal-500 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-teal-700 leading-relaxed">{rec.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {rec.relatedTaskId && (
                            <Link href="/contributor/tasks">
                              <button className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-4 py-2 rounded-lg transition-all">
                                View Related Task <ArrowRight className="w-3 h-3" />
                              </button>
                            </Link>
                          )}
                          <a href={rec.resourceUrl} target="_blank" rel="noopener noreferrer">
                            <button className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">
                              <ExternalLink className="w-3 h-3" /> Open Module
                            </button>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══ SKILL-BASED RECOMMENDATIONS ═══ */}
      {skillBased.length > 0 && (
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">Recommended Skills</h2>
            <span className="text-[11px] text-gray-400">{skillBased.length} suggestions</span>
          </div>
          <div className="space-y-3">
            {skillBased.map((rec) => {
              const priorityInfo = priorityConfig[rec.priority] || priorityConfig.medium;
              const diffInfo = difficultyConfig[rec.difficulty ?? "intermediate"] || difficultyConfig.intermediate;

              return (
                <div key={rec.id} className="card-parchment overflow-hidden">
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-[14px] font-semibold text-gray-800">{rec.title}</span>
                          <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
                          <Badge variant={diffInfo.variant}>{diffInfo.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 mb-2">
                          <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" />{rec.skill}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{rec.estimatedHours}h</span>
                        </div>
                        <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-gold-50 mb-3">
                          <TrendingUp className="w-3 h-3 text-gold-600 mt-0.5 shrink-0" />
                          <p className="text-[11px] text-gold-700 leading-relaxed">{rec.reason}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href="/contributor/profile">
                            <button className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">
                              View Skills <ChevronRight className="w-3 h-3" />
                            </button>
                          </Link>
                          <a href={rec.resourceUrl} target="_blank" rel="noopener noreferrer">
                            <button className="flex items-center gap-1.5 text-[11px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-4 py-2 rounded-lg transition-all">
                              <ExternalLink className="w-3 h-3" /> Start Module
                            </button>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
