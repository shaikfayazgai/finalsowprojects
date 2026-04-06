"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network, Clock, DollarSign, CheckCircle2, ShieldCheck, ChevronDown,
  ChevronRight, GitBranch, Layers, Zap, AlertTriangle, Target, X, Download,
  Sparkles, Brain, Milestone as MilestoneIcon, FileText, ExternalLink,
  FolderOpen, Circle, Lock, Link2, Pencil, LayoutList, GanttChartSquare,
  ClipboardList, History, Package, RotateCcw, TrendingUp, CreditCard, Users, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  mockPlans, mockTasks, mockPlanMilestones, mockAIRecommendations,
} from "@/mocks/data/enterprise-projects";
import { mockSOWs } from "@/mocks/data/enterprise-sow";
import type {
  DecompositionTask, PlanMilestone, PlanStatus, TaskStatus, AIRecommendation,
} from "@/types/enterprise";
import { Gantt, Willow } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/style.css";
import { PaymentReleaseTab } from "@/components/enterprise/decomposition/PaymentReleaseTab";

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

/* ═══ Status configs ═══ */

const planStatusMap: Record<PlanStatus, { variant: string; label: string }> = {
  draft: { variant: "beige", label: "Draft" },
  pending_review: { variant: "gold", label: "Plan Review Required" },
  revision_in_progress: { variant: "teal", label: "Revision In Progress" },
  approved: { variant: "forest", label: "Plan Confirmed" },
  in_progress: { variant: "beige", label: "Plan Locked" },
  completed: { variant: "brown", label: "Completed" },
};

const taskStatusMap: Record<TaskStatus, { variant: string; label: string; dotColor: string }> = {
  backlog: { variant: "beige", label: "Backlog", dotColor: "bg-gray-300" },
  in_progress: { variant: "teal", label: "In Progress", dotColor: "bg-teal-500" },
  in_review: { variant: "gold", label: "In Review", dotColor: "bg-gold-500" },
  rework: { variant: "danger", label: "Rework", dotColor: "bg-red-500" },
  accepted: { variant: "forest", label: "Accepted", dotColor: "bg-forest-500" },
  rejected: { variant: "danger", label: "Rejected", dotColor: "bg-red-500" },
};

const priorityMap: Record<string, { variant: string; label: string }> = {
  low: { variant: "beige", label: "Low" }, medium: { variant: "teal", label: "Medium" },
  high: { variant: "gold", label: "High" }, critical: { variant: "brown", label: "Critical" },
};

function formatCost(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 0 }).format(n); }
function formatDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

/* ═══ Tabs ═══ */
const tabs = [
  { id: "project_plan", label: "Project Plan", icon: ClipboardList },
  { id: "revision_history", label: "Revision History", icon: History },
  //{ id: "evidence_packs", label: "Evidence Packs", icon: Package },
  //{ id: "rework_requests", label: "Rework Requests", icon: RotateCcw },
  //{ id: "escalation_centre", label: "Escalation Centre", icon: TrendingUp },
  { id: "payment_release", label: "Payment Release", icon: CreditCard },
  { id: "team_summary", label: "Team Summary", icon: Users },
  { id: "commercial", label: "Commercial", icon: BarChart2 },
];

/* ═══ PAGE ═══ */

export default function PlanDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const planId = params.planId as string;
  const plan = mockPlans.find((p) => p.id === planId) ?? mockPlans[0];
  const sow = mockSOWs.find((s) => s.id === plan.sowId);
  const sowTitle = sow?.title ?? plan.sowId;
  const tasks = mockTasks.filter((t) => t.planId === plan.id);
  const milestones = mockPlanMilestones.filter((m) => m.planId === plan.id).sort((a, b) => a.order - b.order);
  const recommendations = mockAIRecommendations.filter((r) => r.planId === plan.id);

  const [expandedMilestones, setExpandedMilestones] = React.useState<Set<string>>(() => new Set(milestones.slice(0, 2).map((m) => m.id)));
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(new Set());
  const [dismissedRecs, setDismissedRecs] = React.useState<Set<string>>(() => new Set(recommendations.filter((r) => r.dismissed).map((r) => r.id)));
  const [viewMode, setViewMode] = React.useState<"list" | "gantt">("list");
  const [activeTab, setActiveTab] = React.useState(() => searchParams.get("tab") ?? "project_plan");

  const toggleMilestone = (id: string) => setExpandedMilestones((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleTask = (id: string) => setExpandedTasks((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const st = planStatusMap[plan.status];
  const completedTasks = tasks.filter((t) => t.status === "accepted").length;
  const completionPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const totalSubtasks = tasks.reduce((s, t) => s + t.subtasks.length, 0);
  const activeRecCount = recommendations.filter((r) => !dismissedRecs.has(r.id)).length;

  /* ═══ Gantt Data — Static M1/M2/M3 ═══ */
 const ganttTasks = React.useMemo(() => {
  if (!milestones || milestones.length === 0) return [];
  const today = new Date();
  const m1Start = new Date(today.getFullYear(), today.getMonth(), 1);
  const m2Start = new Date(today.getFullYear(), today.getMonth(), 15);
  const m3Start = new Date(today.getFullYear(), today.getMonth() + 1, 15);

  const m1Tasks = tasks.filter((t) => t.milestoneId === milestones[0]?.id).slice(0, 3);
  const m2Tasks = tasks.filter((t) => t.milestoneId === milestones[1]?.id).slice(0, 3);
  const m3Tasks = tasks.filter((t) => t.milestoneId === milestones[2]?.id).slice(0, 3);

  return [
    { id: 1, text: "M1 — Before Project Starts (35%)", start: m1Start, end: new Date(today.getFullYear(), today.getMonth(), 15), duration: 14, progress: 35, type: "summary", open: true },
    ...m1Tasks.map((t, i) => ({ id: 10 + i, text: t.title, start: new Date(m1Start.getTime() + i * 4 * 24 * 60 * 60 * 1000), end: new Date(m1Start.getTime() + (i + 1) * 4 * 24 * 60 * 60 * 1000), duration: 4, progress: t.status === "accepted" ? 100 : t.status === "in_progress" ? 50 : 0, type: "task", parent: 1 })),

    { id: 2, text: "M2 — Development Closure (35%)", start: m2Start, end: new Date(today.getFullYear(), today.getMonth() + 1, 15), duration: 30, progress: 35, type: "summary", open: true },
    ...m2Tasks.map((t, i) => ({ id: 20 + i, text: t.title, start: new Date(m2Start.getTime() + i * 8 * 24 * 60 * 60 * 1000), end: new Date(m2Start.getTime() + (i + 1) * 8 * 24 * 60 * 60 * 1000), duration: 8, progress: t.status === "accepted" ? 100 : t.status === "in_progress" ? 50 : 0, type: "task", parent: 2 })),

    { id: 3, text: "M3 — UAT Sign-off (30%)", start: m3Start, end: new Date(today.getFullYear(), today.getMonth() + 2, 5), duration: 21, progress: 30, type: "summary", open: true },
    ...m3Tasks.map((t, i) => ({ id: 30 + i, text: t.title, start: new Date(m3Start.getTime() + i * 6 * 24 * 60 * 60 * 1000), end: new Date(m3Start.getTime() + (i + 1) * 6 * 24 * 60 * 60 * 1000), duration: 6, progress: t.status === "accepted" ? 100 : t.status === "in_progress" ? 50 : 0, type: "task", parent: 3 })),
  ];
}, [milestones]);

  /* ═══ Review Checklist items ═══ */
  const checklistItems = [
    "I have reviewed all milestones, tasks, and their acceptance criteria.",
    "I confirm the project timeline fits within the SOW dates.",
    "I confirm the required skills and seniority levels match the project needs.",
  ];
  const [checkedItems, setCheckedItems] = React.useState<Set<number>>(new Set());
  const toggleCheck = (i: number) => setCheckedItems((p) => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant={st.variant} dot>{st.label}</Badge>
              <Badge variant="beige">{plan.complexity}</Badge>
            </div>
            <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">{plan.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-[12px] text-gray-400">
              <Link href={`/enterprise/sow/${plan.sowId}`} className="text-brown-500 hover:text-brown-600 font-medium transition-colors">{sowTitle}</Link>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>v{plan.version}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{formatDate(plan.createdAt)}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="flex items-center gap-1">AI: <span className={cn("font-mono font-semibold", plan.aiConfidence >= 85 ? "text-forest-600" : plan.aiConfidence >= 70 ? "text-teal-600" : "text-gold-600")}>{plan.aiConfidence}%</span></span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {plan.status !== "completed" && (
              <Link href={`/enterprise/decomposition/${plan.id}/edit`}>
                <button className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
              </Link>
            )}
            {(plan.status === "draft" || plan.status === "pending_review") && (
              <Link href={`/enterprise/decomposition/${plan.id}/approve`}>
                <button className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                  <ShieldCheck className="w-3.5 h-3.5" /> Confirm & Activate
                </button>
              </Link>
            )}
            {plan.status === "approved" && (
              <Link href="/enterprise/team">
                <button className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 px-5 py-2 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5" /> View Team Formation
                </button>
              </Link>
            )}
            {(plan.status === "in_progress" || plan.status === "completed") && (
              <Link href={`/enterprise/projects/${plan.projectId ?? "proj-001"}`}>
                <button className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 px-5 py-2 rounded-xl">
                  <FolderOpen className="w-3.5 h-3.5" /> View Project
                </button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
        {[
          { label: "Milestones", value: milestones.length, icon: MilestoneIcon, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "Tasks", value: `${completedTasks}/${tasks.length}`, icon: Layers, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "Subtasks", value: totalSubtasks, icon: GitBranch, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          { label: "Est. Hours", value: plan.estimatedHours.toLocaleString() + "h", icon: Clock, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { label: "Est. Cost", value: formatCost(plan.estimatedCost), icon: DollarSign, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
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

      {/* ═══ COMPLETION + TASK STATUS ═══ */}
      <motion.div variants={fadeUp} className="card-parchment px-5 py-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-800">Completion</span>
          <span className="text-[12px] font-mono font-semibold text-gray-600">{completionPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-4">
          <div className={cn("h-full rounded-full transition-all duration-700", completionPct === 100 ? "bg-forest-500" : "bg-gradient-to-r from-brown-400 to-brown-500")} style={{ width: `${completionPct}%` }} />
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          {(["backlog", "in_progress", "in_review", "rework", "accepted"] as TaskStatus[]).map((key) => {
            const count = tasks.filter((t) => t.status === key).length;
            const cfg = taskStatusMap[key];
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", cfg.dotColor)} />
                <span className="text-[11px] text-gray-600"><span className="font-semibold">{count}</span> {cfg.label}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ TABS ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center gap-1 overflow-x-auto pb-0" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
                  isActive
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
                )}>
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ TAB CONTENT ═══ */}
      {activeTab === "payment_release" && (
        <motion.div variants={fadeUp} className="mb-8">
          <PaymentReleaseTab
            planId={plan.id}
            planTitle={plan.title}
            estimatedCost={plan.estimatedCost}
          />
        </motion.div>
      )}

      {activeTab !== "project_plan" && activeTab !== "payment_release" && (
        <motion.div variants={fadeUp} className="card-parchment flex flex-col items-center justify-center py-20 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            {React.createElement(tabs.find(t => t.id === activeTab)?.icon ?? ClipboardList, { className: "w-5 h-5 text-gray-400" })}
          </div>
          <p className="text-sm font-semibold text-gray-600 mb-1">{tabs.find(t => t.id === activeTab)?.label}</p>
          <p className="text-xs text-gray-400">This section is coming soon.</p>
        </motion.div>
      )}

      {activeTab === "project_plan" && (
        <>
        {/* ═══ AI GENERATING STATE ═══ */}
        {plan.status === "draft" && (
          <motion.div variants={fadeUp} className="card-parchment flex flex-col items-center justify-center py-16 mb-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-gray-800 mb-1">AI is working on your decomposition</p>
            <p className="text-xs text-gray-400 max-w-[320px]">You will be able to see the details once it is completed.</p>
          </motion.div>
        )}

          {/* ═══ MILESTONE → TASK TREE / GANTT ═══ */}
          {plan.status !== "draft" && (
          <motion.div variants={fadeUp} className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">Task Breakdown</h2>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400">{milestones.length} milestones · {tasks.length} tasks</span>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("list")}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                      viewMode === "list" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    )}>
                    <LayoutList className="w-3.5 h-3.5" /> List
                  </button>
                  <button
                    onClick={() => setViewMode("gantt")}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all",
                      viewMode === "gantt" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"
                    )}>
                    <GanttChartSquare className="w-3.5 h-3.5" /> Gantt
                  </button>
                </div>
              </div>
            </div>

            {/* ═══ GANTT VIEW ═══ */}
            {viewMode === "gantt" && (
              <div className="card-parchment overflow-hidden" style={{ height: 400 }}>
              <style>{`
                .wx-gantt-task:nth-child(1) .wx-gantt-bar { background: #0d9488 !important; }
                .wx-gantt-task:nth-child(4) .wx-gantt-bar { background: #b45309 !important; }
                .wx-gantt-task:nth-child(8) .wx-gantt-bar { background: #166534 !important; }
                `}</style>
                <Willow>
                  <Gantt tasks={ganttTasks} scales={[{ unit: "month", step: 1, format: "%F %Y" }, { unit: "day", step: 1, format: "%j" }]} />
                </Willow>
              </div>
            )}
            
            {/* ═══ LIST VIEW ═══ */}
            {viewMode === "list" && (
              <div className="space-y-4">
                {milestones.map((milestone) => {
                  const msTasks = tasks.filter((t) => t.milestoneId === milestone.id).sort((a, b) => a.order - b.order);
                  const msCompleted = msTasks.filter((t) => t.status === "accepted").length;
                  const msPct = msTasks.length ? Math.round((msCompleted / msTasks.length) * 100) : 0;
                  const isOpen = expandedMilestones.has(milestone.id);

                  return (
                    <div key={milestone.id} className="card-parchment overflow-hidden">
                      <button onClick={() => toggleMilestone(milestone.id)}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.02]">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                          milestone.itemStatus === "accepted" ? "bg-gradient-to-br from-forest-400 to-forest-600" : "bg-gradient-to-br from-brown-300 to-brown-500"
                        )}>
                          <MilestoneIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] font-semibold text-gray-800">{milestone.title}</span>
                            <Badge variant={milestone.itemStatus === "accepted" ? "forest" : "beige"}>{milestone.itemStatus === "accepted" ? "Complete" : "Proposed"}</Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                            <span>{msCompleted}/{msTasks.length} tasks</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{milestone.subtaskCount} subtasks</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                            <span>{milestone.estimatedHours}h</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className={cn("h-full rounded-full", msPct === 100 ? "bg-forest-500" : "bg-brown-400")} style={{ width: `${msPct}%` }} />
                          </div>
                          <span className="text-[10px] font-mono text-gray-500 w-7 text-right">{msPct}%</span>
                          {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        </div>
                      </button>

                      {isOpen && (
                        <div>
                          {msTasks.map((task) => {
                            const ts = taskStatusMap[task.status];
                            const pr = priorityMap[task.priority];
                            const isTaskOpen = expandedTasks.has(task.id);
                            const hasSubtasks = task.subtasks.length > 0;

                            return (
                              <div key={task.id}>
                                <div className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-black/[0.02] cursor-pointer"
                                  style={{ borderTop: "1px solid var(--border-hair)" }}
                                  onClick={() => hasSubtasks && toggleTask(task.id)}>
                                  <span className={cn("w-2.5 h-2.5 rounded-full shrink-0 ml-5", ts.dotColor)} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[13px] font-medium text-gray-800 truncate">{task.title}</span>
                                      <Badge variant={ts.variant}>{ts.label}</Badge>
                                      {pr && <Badge variant={pr.variant}>{pr.label}</Badge>}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.estimatedHours}h</span>
                                      {hasSubtasks && <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{task.subtasks.length} subtasks</span>}
                                      {task.dependencies.length > 0 && <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{task.dependencies.length} deps</span>}
                                      {task.skillsRequired.slice(0, 2).map((s) => (
                                        <span key={s.name} className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{s.name}</span>
                                      ))}
                                      {task.skillsRequired.length > 2 && <span className="text-[9px] text-gray-400">+{task.skillsRequired.length - 2}</span>}
                                    </div>
                                  </div>
                                  <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                                    <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                      <div className={cn("h-full rounded-full",
                                        task.aiConfidence >= 85 ? "bg-forest-500" : task.aiConfidence >= 70 ? "bg-gold-500" : "bg-brown-500"
                                      )} style={{ width: `${task.aiConfidence}%` }} />
                                    </div>
                                    <span className="text-[10px] font-mono text-gray-500 w-7 text-right">{task.aiConfidence}%</span>
                                  </div>
                                  {hasSubtasks && (isTaskOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />)}
                                </div>

                                {isTaskOpen && hasSubtasks && (
                                  <div className="ml-14 mr-5 mb-3 mt-1 pl-4" style={{ borderLeft: "2px solid var(--border-hair)" }}>
                                    {task.subtasks.map((st) => (
                                      <div key={st.id} className="flex items-center gap-2.5 py-1.5">
                                        {st.itemStatus === "accepted" ? <CheckCircle2 className="w-3 h-3 text-forest-500 shrink-0" /> : <Circle className="w-3 h-3 text-gray-300 shrink-0" />}
                                        <span className="text-[11px] text-gray-600 flex-1 truncate">{st.title}</span>
                                        <span className="text-[9px] font-mono text-gray-400">{st.estimatedHours}h</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
          )}

          {/* ═══ AI RECOMMENDATIONS ═══ */}
          {recommendations.length > 0 && (
            <motion.div variants={fadeUp} className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-800">AI Recommendations</h2>
                  {activeRecCount > 0 && <span className="text-[10px] font-semibold text-gold-700 bg-gold-50 w-5 h-5 rounded-full flex items-center justify-center">{activeRecCount}</span>}
                </div>
              </div>
              <div className="card-parchment">
                {recommendations.map((rec, i) => {
                  const isDismissed = dismissedRecs.has(rec.id);
                  const severityColor = { info: "text-teal-600", warning: "text-gold-600", critical: "text-brown-600" };
                  const affectedTask = rec.affectedTaskId ? tasks.find((t) => t.id === rec.affectedTaskId) : null;
                  return (
                    <div key={rec.id} className={cn("px-5 py-4 transition-opacity", isDismissed && "opacity-40")}
                      style={{ borderBottom: i < recommendations.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5", severityColor[rec.severity] || "text-gray-400")} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("text-[13px] font-medium", isDismissed ? "line-through text-gray-400" : "text-gray-800")}>{rec.title}</span>
                            <Badge variant={rec.severity === "critical" ? "brown" : rec.severity === "warning" ? "gold" : "teal"}>{rec.severity}</Badge>
                          </div>
                          <p className={cn("text-[12px] leading-relaxed", isDismissed ? "text-gray-400 line-through" : "text-gray-500")}>{rec.description}</p>
                          {affectedTask && <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Target className="w-3 h-3" /> Affects: {affectedTask.title}</p>}
                          {rec.suggestion && (
                            <div className="flex items-start gap-2 mt-2 px-3 py-2 rounded-xl bg-teal-50">
                              <Sparkles className="w-3 h-3 text-teal-500 mt-0.5 shrink-0" />
                              <p className="text-[11px] text-teal-700">{rec.suggestion}</p>
                            </div>
                          )}
                        </div>
                        {!isDismissed && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => setDismissedRecs((p) => new Set([...p, rec.id]))}
                              className="text-[11px] font-medium text-white bg-gradient-to-r from-brown-400 to-brown-600 px-3 py-1.5 rounded-lg">Accept</button>
                            <button onClick={() => setDismissedRecs((p) => new Set([...p, rec.id]))}
                              className="text-[11px] font-medium text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">Dismiss</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ═══ REVIEW CHECKLIST + PLAN SUMMARY (replaces old bottom section) ═══ */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">

            {/* Review Checklist */}
            <div className="card-parchment">
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <span className="text-sm font-semibold text-gray-800">Review Checklist</span>
              </div>
              <div className="py-3 px-5 space-y-4">
                {checklistItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 cursor-pointer" onClick={() => toggleCheck(i)}>
                    <div className={cn(
                      "w-4 h-4 rounded shrink-0 mt-0.5 border-2 flex items-center justify-center transition-all",
                      checkedItems.has(i) ? "bg-teal-500 border-teal-500" : "border-gray-300 bg-white"
                    )}>
                      {checkedItems.has(i) && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <span className={cn("text-[12px] leading-relaxed", checkedItems.has(i) ? "line-through text-gray-400" : "text-gray-600")}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan Summary */}
            <div className="card-parchment">
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                <span className="text-sm font-semibold text-gray-800">Plan Summary</span>
              </div>
              <div className="py-2">
                {[
                  { label: "Total Milestones", value: plan.totalMilestones.toString() },
                  { label: "Total Tasks", value: plan.totalTasks.toString() },
                  { label: "Estimated Total Effort", value: plan.estimatedHours.toLocaleString() + " Days" },
                  { label: "Estimated Cost", value: formatCost(plan.estimatedCost) },
                  { label: "AI Confidence", value: `${plan.aiConfidence}%` },
                  { label: "Complexity", value: plan.complexity.charAt(0).toUpperCase() + plan.complexity.slice(1) },
                ].map((item, i, arr) => (
                  <div key={item.label} className="flex items-center justify-between px-5 py-2.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                    <span className="text-[12px] text-gray-400">{item.label}</span>
                    <span className="text-[12px] font-medium text-gray-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        </>
      )}

    </motion.div>
  );
}