// @ts-nocheck
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Clock, AlertTriangle, CheckCircle2, RotateCcw,
  Circle, ChevronRight, Filter,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockTaskMonitor } from "@/mocks/data/enterprise-reviewer";

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  open: { label: "Open", color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-400" },
  in_progress: { label: "In Progress", color: "bg-teal-50 text-teal-700 border-teal-200", dot: "bg-teal-500" },
  submitted: { label: "Submitted", color: "bg-gold-50 text-gold-700 border-gold-200", dot: "bg-gold-500" },
  rework: { label: "Rework", color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  accepted: { label: "Accepted", color: "bg-forest-50 text-forest-700 border-forest-200", dot: "bg-forest-500" },
  escalated: { label: "Escalated", color: "bg-brown-50 text-brown-700 border-brown-200", dot: "bg-brown-500" },
};

function formatDeadline(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return { label: "Overdue", color: "text-red-600" };
  const days = Math.floor(diff / (24 * 3600000));
  if (days === 0) return { label: "Due today", color: "text-gold-600" };
  return { label: `${days}d remaining`, color: "text-gray-500" };
}

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (24 * 3600000));
  const hours = Math.floor(diff / 3600000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

export default function TaskMonitorPage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = React.useState("all");

  const statusTabs = [
    { value: "all", label: "All" },
    { value: "open", label: "Open" },
    { value: "in_progress", label: "In Progress" },
    { value: "submitted", label: "Submitted" },
    { value: "rework", label: "Rework" },
    { value: "accepted", label: "Accepted" },
  ];

  const filtered = statusFilter === "all"
    ? mockTaskMonitor
    : mockTaskMonitor.filter(t => t.status === statusFilter);

  const counts = statusTabs.reduce((acc, tab) => {
    acc[tab.value] = tab.value === "all"
      ? mockTaskMonitor.length
      : mockTaskMonitor.filter(t => t.status === tab.value).length;
    return acc;
  }, {} as Record<string, number>);

  const needsAttentionCount = mockTaskMonitor.filter(t => t.needsAttention).length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Task Monitor</h1>
        <p className="text-[13px] text-gray-500 mt-1">All tasks assigned to you across all projects.</p>
      </motion.div>

      {/* ═══ ATTENTION BANNER ═══ */}
      {needsAttentionCount > 0 && (
        <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-gold-50 border border-gold-200">
          <AlertTriangle className="w-4 h-4 text-gold-500 shrink-0" />
          <p className="text-[12px] font-medium text-gold-700">
            <span className="font-bold">{needsAttentionCount} tasks</span> require your attention.
          </p>
        </motion.div>
      )}

      {/* ═══ STATUS TABS ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center gap-1 overflow-x-auto pb-0" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          {statusTabs.map((tab) => (
            <button key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
                statusFilter === tab.value
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              )}>
              {tab.label}
              {counts[tab.value] > 0 && (
                <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full",
                  statusFilter === tab.value ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"
                )}>
                  {counts[tab.value]}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ TASK LIST ═══ */}
      <motion.div variants={fadeUp} className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card-parchment flex flex-col items-center justify-center py-16 text-center">
            <Circle className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-[13px] font-semibold text-gray-600">No tasks match these filters.</p>
          </div>
        ) : (
          filtered.map((task) => {
            const st = statusConfig[task.status] ?? statusConfig.open;
            const deadline = formatDeadline(task.deadline);

            return (
              <div key={task.id} className="card-parchment cursor-pointer hover:shadow-md transition-all"
                onClick={() => router.push(`/enterprise/reviewer/task-monitor/${task.id}`)}>
                <div className="flex items-center gap-4 px-5 py-4">

                  {/* Status dot */}
                  <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", st.dot)} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-gray-800">{task.taskTitle}</span>
                      <span className={cn("text-[9px] font-medium px-2 py-0.5 rounded-full border", st.color)}>
                        {st.label}
                      </span>
                      {task.needsAttention && (
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Needs Attention
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400 flex-wrap">
                      <span>{task.projectName}</span>
                      <span>·</span>
                      <span>{task.milestoneTitle}</span>
                      {task.contributorId && (
                        <>
                          <span>·</span>
                          <span>{task.contributorId}</span>
                        </>
                      )}
                    </div>
                    {task.needsAttention && task.attentionReason && (
                      <p className="text-[11px] text-gold-600 mt-1 font-medium">{task.attentionReason}</p>
                    )}
                  </div>

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn("text-[11px] font-medium", deadline.color)}>
                      {deadline.label}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Last activity: {formatTimeAgo(task.lastReviewerActivity)}
                    </span>
                  </div>

                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 group-hover:text-gray-500 transition-colors" />                </div>
              </div>
            );
          })
        )}
      </motion.div>

    </motion.div>
  );
}