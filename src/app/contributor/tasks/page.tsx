"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers, Clock, CheckCircle2, Sparkles,
  Inbox, GraduationCap, RefreshCw, ThumbsDown,
  Eye, Calendar, Zap, ShieldCheck, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockContributorTasks, mockContributorProfile } from "@/mocks/data/contributor";

/* ══════════════════════════════════════════ Pill helper ══════════════════════════════════════════ */

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}>
      {children}
    </span>
  );
}

/* ══════════════════════════════════════════ Status Configs ══════════════════════════════════════════ */

const statusConfig: Record<string, { label: string; color: string; bg: string; dotColor: string }> = {
  available:   { label: "Available",   color: "var(--color-teal-700)",   bg: "var(--color-teal-50)",    dotColor: "bg-teal-500" },
  assigned:    { label: "Assigned",    color: "var(--color-gold-700)",   bg: "var(--color-gold-50)",    dotColor: "bg-gold-500" },
  in_progress: { label: "In Progress", color: "var(--color-brown-700)",  bg: "var(--color-brown-50)",   dotColor: "bg-brown-500" },
  submitted:   { label: "Submitted",   color: "var(--color-gold-700)",   bg: "var(--color-gold-50)",    dotColor: "bg-gold-500" },
  in_review:   { label: "In Review",   color: "var(--color-gold-700)",   bg: "var(--color-gold-50)",    dotColor: "bg-gold-500" },
  accepted:    { label: "Completed",   color: "var(--color-forest-700)", bg: "var(--color-forest-50)",  dotColor: "bg-forest-500" },
  rework:      { label: "Rework",      color: "var(--danger)",           bg: "var(--danger-light)",     dotColor: "bg-red-500" },
  rejected:    { label: "Rejected",    color: "var(--danger)",           bg: "var(--danger-light)",     dotColor: "bg-red-500" },
};

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: "Low",      color: "var(--color-gray-600)",   bg: "var(--color-gray-100)" },
  medium:   { label: "Medium",   color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  high:     { label: "High",     color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  critical: { label: "Critical", color: "var(--danger)",           bg: "var(--danger-light)" },
};

/* ══════════════════════════════════════════ Helpers ══════════════════════════════════════════ */

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return days;
}

/* ══════════════════════════════════════════ Tab type ══════════════════════════════════════════ */

type FeedTab = "offered" | "in_progress" | "completed";

/* ══════════════════════════════════════════ PAGE ══════════════════════════════════════════ */

export default function ContributorTasksPage() {
  const router = useRouter();
  const tasks = mockContributorTasks;

  /* Tab state */
  const [activeTab, setActiveTab] = React.useState<FeedTab>("offered");

  /* KPI counts */
  const availableCount = tasks.filter((t) => t.status === "available").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress" || t.status === "assigned").length;
  const submittedCount = tasks.filter((t) => t.status === "submitted" || t.status === "in_review").length;
  const completedCount = tasks.filter((t) => t.status === "accepted").length;

  /* Filtered tasks by tab */
  const filteredTasks = React.useMemo(() => {
    switch (activeTab) {
      case "offered":
        return tasks.filter((t) => t.status === "available");
      case "in_progress":
        return tasks.filter((t) => t.status === "in_progress" || t.status === "assigned" || t.status === "submitted" || t.status === "in_review" || t.status === "rework");
      case "completed":
        return tasks.filter((t) => t.status === "accepted" || t.status === "rejected");
      default:
        return tasks;
    }
  }, [tasks, activeTab]);

  /* Sort offered tab by match score descending */
  const sortedTasks = React.useMemo(() => {
    const list = [...filteredTasks];
    if (activeTab === "offered") {
      list.sort((a, b) => b.matchScore - a.matchScore);
    }
    return list;
  }, [filteredTasks, activeTab]);

  /* Slide-in panel state (C4) */
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const selectedTask = selectedTaskId ? filteredTasks.find(t => t.id === selectedTaskId) || sortedTasks.find(t => t.id === selectedTaskId) || null : null;

  const tabs: { key: FeedTab; label: string; count: number }[] = [
    { key: "offered", label: "Offered to You", count: availableCount },
    { key: "in_progress", label: "In Progress", count: inProgressCount + submittedCount },
    { key: "completed", label: "Completed", count: completedCount },
  ];

  /* C2: Block task access if account is not active */
  if ((mockContributorProfile as any).accountStatus !== "active") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mx-auto mb-5">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h2 className="font-heading text-[20px] font-semibold text-gray-900 mb-2">Assessment Required</h2>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-6">
            You must complete your skills assessment before receiving task offers. The AGI matching system only assigns tasks to contributors with a confirmed designation.
          </p>
          <Link
            href="/contributor/assessment"
            className="inline-flex items-center gap-2 text-[13px] font-semibold text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 px-6 py-2.5 rounded-xl transition-all"
            style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--color-teal-500) 25%, transparent)" }}
          >
            <ShieldCheck className="w-4 h-4" />
            Go to Assessment
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HERO — AGI Match Feed ═══ */}
      <motion.div variants={fadeUp} className="mb-7">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
                AGI Match Feed
              </h1>
              <div className="flex items-center gap-1.5 bg-teal-50 text-teal-600 px-2.5 py-1 rounded-full">
                <Sparkles className="w-3 h-3" />
                <span className="text-[10px] font-semibold">AI-Powered</span>
              </div>
            </div>
            <p className="mt-1 text-[13px] text-gray-500">
              These tasks have been matched to your verified skills and availability by our AGI system
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 shrink-0">
            <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: "4s" }} />
            <span>Feed refreshes as new matches arrive</span>
          </div>
        </div>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Available", value: availableCount, icon: Sparkles, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "In Progress", value: inProgressCount, icon: Layers, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "Submitted", value: submittedCount, icon: Clock, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { label: "Completed", value: completedCount, icon: CheckCircle2, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
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

      {/* ═══ STUDENT TRACK BANNER ═══ */}
      {mockContributorProfile.track === "student" && (
        <motion.div variants={fadeUp} className="flex items-center gap-3 bg-teal-50 rounded-xl px-4 py-3 mb-5">
          <GraduationCap className="w-5 h-5 text-teal-500 shrink-0" />
          <p className="text-[12px] text-teal-700">
            <span className="font-semibold">Student Track</span> — You&apos;re seeing tasks appropriate for your academic level. Tasks have supervised review and count toward academic credits.
          </p>
        </motion.div>
      )}

      {/* ═══ STATUS TABS ═══ */}
      <motion.div variants={fadeUp} className="flex items-center gap-1 mb-5 p-1 bg-gray-50 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-2 text-[12px] font-medium px-4 py-2 rounded-lg transition-all",
              activeTab === tab.key
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                activeTab === tab.key
                  ? "bg-brown-50 text-brown-600"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* ═══ CARD FEED ═══ */}
      <motion.div variants={fadeUp} className="space-y-4">
        {sortedTasks.map((task) => {
          const sc = statusConfig[task.status as keyof typeof statusConfig] || statusConfig.available;
          const pr = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
          const days = daysUntil(task.dueDate);
          const isOverdue = days < 0;
          const isUrgent = days >= 0 && days <= 3;

          return (
            <motion.div
              key={task.id}
              variants={scaleIn}
              className="card-parchment overflow-hidden cursor-pointer group hover:shadow-md transition-shadow"
              onClick={() => router.push(`/contributor/tasks/${task.id}`)}
            >
              <div className="p-5">
                {/* Top row: title + status + priority */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Pill bg={sc.bg} color={sc.color}>{sc.label}</Pill>
                      <Pill bg={pr.bg} color={pr.color}>{pr.label}</Pill>
                    </div>
                    <h3 className="text-[15px] font-semibold text-gray-800 group-hover:text-brown-600 transition-colors leading-snug">
                      {task.title}
                    </h3>
                    <p className="text-[12px] text-gray-400 mt-0.5">{task.projectTitle}</p>
                  </div>

                  {/* Match score circle */}
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(${
                          task.matchScore >= 90 ? "var(--color-forest-500)" :
                          task.matchScore >= 75 ? "var(--color-gold-500)" :
                          "var(--color-brown-500)"
                        } ${task.matchScore * 3.6}deg, var(--color-gray-100) 0deg)`,
                      }}
                    >
                      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                        <span className="font-mono text-[14px] font-bold text-gray-800">{task.matchScore}%</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-medium text-gray-400 mt-1">Match</span>
                  </div>
                </div>

                {/* Match reason */}
                {(task as any).matchReason && (
                  <div className="flex items-start gap-2 mb-3 bg-teal-50/50 rounded-lg px-3 py-2">
                    <Sparkles className="w-3 h-3 text-teal-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-teal-700 leading-relaxed">{(task as any).matchReason}</p>
                  </div>
                )}

                {/* Skills */}
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  {task.skillsRequired.map((skill) => (
                    <span key={skill} className="font-mono text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{skill}</span>
                  ))}
                </div>

                {/* Meta row: hours, pricing, due date */}
                <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-3" style={{ borderTop: "1px solid var(--border-hair)" }}>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>{task.estimatedHours}h estimated</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3" />
                    <span className="font-semibold text-gray-600">{formatCurrency(task.pricing.amount)}</span>
                    <span className="text-gray-300">({task.pricing.model})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {isOverdue ? (
                      <span className="font-semibold text-red-500">Overdue</span>
                    ) : isUrgent ? (
                      <span className="font-semibold text-gold-600">{formatDate(task.dueDate)}</span>
                    ) : (
                      <span>{formatDate(task.dueDate)}</span>
                    )}
                  </div>

                  {/* CTAs — right aligned */}
                  <div className="flex items-center gap-2 ml-auto">
                    {activeTab === "offered" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); /* dismiss logic */ }}
                        className="flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50/50 transition-all"
                      >
                        <ThumbsDown className="w-3 h-3" />
                        Not Interested
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedTaskId(task.id); }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-brown-600 hover:text-brown-700 px-3 py-1.5 rounded-lg border border-brown-200 hover:border-brown-300 hover:bg-brown-50 transition-all"
                    >
                      <Eye className="w-3 h-3" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Empty state */}
      {sortedTasks.length === 0 && (
        <motion.div variants={fadeUp} className="card-parchment">
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <Inbox className="w-6 h-6 text-gray-300" />
            </div>
            <p className="text-[14px] font-medium text-gray-700 mb-1">
              {activeTab === "offered" ? "No new matches right now" : activeTab === "in_progress" ? "No tasks in progress" : "No completed tasks yet"}
            </p>
            <p className="text-[12px] text-gray-400 text-center max-w-xs">
              {activeTab === "offered"
                ? "New tasks matching your skills will appear here as our AGI system identifies opportunities for you."
                : activeTab === "in_progress"
                  ? "Accept an offered task to get started."
                  : "Completed tasks and their outcomes will be shown here."
              }
            </p>
          </div>
        </motion.div>
      )}

      {/* ═══ C4: SLIDE-IN TASK DETAIL PANEL ═══ */}
      <AnimatePresence>
        {selectedTask && (() => {
          const panelTask = selectedTask as any;
          const psc = statusConfig[panelTask.status as keyof typeof statusConfig] || statusConfig.available;
          const ppr = priorityConfig[panelTask.priority as keyof typeof priorityConfig] || priorityConfig.medium;
          return (
            <>
              {/* Backdrop */}
              <motion.div
                key="panel-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40"
                onClick={() => setSelectedTaskId(null)}
              />
              {/* Panel */}
              <motion.div
                key="panel-content"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 overflow-y-auto"
              >
                {/* Close button */}
                <div className="sticky top-0 bg-white/90 backdrop-blur z-10 flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                  <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Task Details</span>
                  <button onClick={() => setSelectedTaskId(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors" aria-label="Close panel">
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-5">
                  {/* Status + Priority pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Pill bg={psc.bg} color={psc.color}>{psc.label}</Pill>
                    <Pill bg={ppr.bg} color={ppr.color}>{ppr.label}</Pill>
                  </div>

                  {/* Title + Project */}
                  <div>
                    <h2 className="font-heading text-[18px] font-semibold text-gray-900 tracking-tight leading-snug mb-1">{panelTask.title}</h2>
                    <p className="text-[12px] text-brown-500 font-medium">{panelTask.projectTitle}</p>
                  </div>

                  {/* Match score ring */}
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: `conic-gradient(${
                          panelTask.matchScore >= 90 ? "var(--color-forest-500)" :
                          panelTask.matchScore >= 75 ? "var(--color-gold-500)" :
                          "var(--color-brown-500)"
                        } ${panelTask.matchScore * 3.6}deg, var(--color-gray-100) 0deg)`,
                      }}
                    >
                      <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                        <span className="font-mono text-[16px] font-bold text-gray-800">{panelTask.matchScore}%</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-gray-600 block mb-0.5">AGI Match Score</span>
                      {panelTask.matchReason && (
                        <p className="text-[11px] text-teal-700 leading-relaxed">{panelTask.matchReason}</p>
                      )}
                    </div>
                  </div>

                  {/* Required skills */}
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Required Skills</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {panelTask.skillsRequired.map((skill: string) => (
                        <span key={skill} className="font-mono text-[10px] text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{skill}</span>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Description</span>
                    <p className="text-[13px] text-gray-600 leading-relaxed">{panelTask.description}</p>
                  </div>

                  {/* Key details grid */}
                  <div className="card-parchment overflow-hidden">
                    <div className="px-4 py-2.5" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Key Details</span>
                    </div>
                    {[
                      { label: "Estimated Hours", value: `${panelTask.estimatedHours}h` },
                      { label: "Pricing", value: `${formatCurrency(panelTask.pricing.amount)} (${panelTask.pricing.model})` },
                      { label: "Due Date", value: formatDate(panelTask.dueDate) },
                      { label: "SLA Deadline", value: formatDate(panelTask.slaDeadline) },
                      { label: "Complexity", value: (ppr.label) },
                    ].map((item, i, arr) => (
                      <div key={item.label} className="flex items-center justify-between px-4 py-2.5"
                        style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                        <span className="text-[12px] text-gray-400">{item.label}</span>
                        <span className="text-[12px] font-medium text-gray-700">{item.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Acceptance criteria */}
                  {panelTask.acceptanceCriteria && panelTask.acceptanceCriteria.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Acceptance Criteria</span>
                      <ul className="space-y-1.5">
                        {panelTask.acceptanceCriteria.map((criterion: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                            <span className="text-[12px] text-gray-600 leading-relaxed">{criterion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Deliverables */}
                  {panelTask.deliverables && panelTask.deliverables.length > 0 && (
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Deliverables</span>
                      <ul className="space-y-1.5">
                        {panelTask.deliverables.map((del: any) => (
                          <li key={del.id} className="flex items-start gap-2">
                            <Layers className="w-3.5 h-3.5 text-brown-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-[12px] font-medium text-gray-700 block">{del.title}</span>
                              <span className="text-[11px] text-gray-400">{del.description}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA buttons */}
                  <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <button
                      onClick={() => router.push(`/contributor/tasks/${panelTask.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2.5 rounded-xl transition-all"
                      style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--color-brown-500) 25%, transparent)" }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept Task
                    </button>
                    <button
                      onClick={() => setSelectedTaskId(null)}
                      className="flex items-center justify-center gap-1 text-[12px] font-medium text-gray-400 hover:text-red-500 px-4 py-2.5 rounded-xl border border-gray-200 hover:border-red-200 hover:bg-red-50/50 transition-all"
                    >
                      Not Interested
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

    </motion.div>
  );
}
