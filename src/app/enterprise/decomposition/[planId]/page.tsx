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
  ClipboardList, History, Package, TrendingUp, CreditCard, Users, BarChart2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fetchInternal, ApiError } from "@/lib/api/client";
import { sowApi } from "@/lib/api/sow";
import { decompositionApi } from "@/lib/api/decomposition";
import { Skeleton } from "@/components/ui";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import type {
  DecompositionTask, DecompositionPlan, PlanMilestone, PlanStatus, TaskStatus, AIRecommendation,
} from "@/types/enterprise";
import { PaymentReleaseTab } from "@/components/enterprise/decomposition/PaymentReleaseTab";
import { useProjectHoldStore } from "@/lib/stores/project-hold-store";
import { useNotificationStore } from "@/lib/stores/notification-store";
import { useSession } from "next-auth/react";
import { toast } from "@/lib/stores/toast-store";
import {
  useDecompositionPlan, useTasks, useMilestones, usePlanSummary,
} from "@/lib/hooks/use-decomposition";

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

const planStatusMap: Record<string, { variant: string; label: string }> = {
  draft: { variant: "beige", label: "Draft" },
  pending_review: { variant: "gold", label: "Plan Review Required" },
  revision_in_progress: { variant: "teal", label: "Revision In Progress" },
  approved: { variant: "forest", label: "Plan Confirmed" },
  in_progress: { variant: "beige", label: "Plan Locked" },
  completed: { variant: "brown", label: "Completed" },
  // API returns uppercase statuses
  NEW: { variant: "beige", label: "New" },
  IN_REVIEW: { variant: "gold", label: "In Review" },
  CONFIRMED: { variant: "forest", label: "Confirmed" },
  LOCKED: { variant: "teal", label: "Locked" },
  REVISION_REQUESTED: { variant: "gold", label: "Revision Requested" },
  PENDING_KICKOFF: { variant: "beige", label: "Pending Kickoff" },
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

/* ═══ Task Breakdown Gantt ═══ */
const GANTT_PALETTE = [
  { border: "#0d9488", track: "rgba(13,148,136,0.14)", fill: "#0d9488", rowBg: "rgba(13,148,136,0.04)", label: "#0f766e" },
  { border: "#b45309", track: "rgba(180,83,9,0.12)",   fill: "#b45309", rowBg: "rgba(180,83,9,0.03)",   label: "#92400e" },
  { border: "#16a34a", track: "rgba(22,163,74,0.12)",  fill: "#16a34a", rowBg: "rgba(22,163,74,0.03)",  label: "#15803d" },
  { border: "#7c3aed", track: "rgba(124,58,237,0.12)", fill: "#7c3aed", rowBg: "rgba(124,58,237,0.03)", label: "#6d28d9" },
];

type TooltipData = { x: number; y: number; content: React.ReactNode } | null;

function TaskBreakdownGantt({ milestones, tasks, plan }: { milestones: PlanMilestone[]; tasks: DecompositionTask[]; plan: DecompositionPlan }) {
  const [expanded, setExpanded] = React.useState<Set<string>>(() => new Set(milestones.map(m => m.id)));
  const toggle = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const [tooltip, setTooltip] = React.useState<TooltipData>(null);

  const showTooltip = (e: React.MouseEvent, content: React.ReactNode) => {
    setTooltip({ x: e.clientX, y: e.clientY, content });
  };
  const moveTooltip = (e: React.MouseEvent) => {
    if (tooltip) setTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null);
  };
  const hideTooltip = () => setTooltip(null);

  // Real dates: start from plan.createdAt, each milestone's duration = estimatedHours / 40h per week
  const planStart = React.useMemo(() => {
    const d = new Date(plan.createdAt);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, [plan.createdAt]);

  const msTimeline = React.useMemo(() => {
    const out: { id: string; start: Date; end: Date; durationWeeks: number }[] = [];
    let cursor = new Date(planStart);
    for (const ms of milestones) {
      const days = Math.ceil((ms.estimatedHours / 40) * 7);
      const start = new Date(cursor);
      const end = new Date(cursor.getTime() + days * 86400000);
      out.push({ id: ms.id, start, end, durationWeeks: Math.round(ms.estimatedHours / 40) });
      cursor = new Date(end.getTime() + 86400000);
    }
    return out;
  }, [milestones, planStart]);

  const planEnd = msTimeline.length > 0
    ? new Date(msTimeline[msTimeline.length - 1].end.getTime() + 14 * 86400000)
    : new Date(planStart.getFullYear(), planStart.getMonth() + 4, 1);

  const totalMs = planEnd.getTime() - planStart.getTime();
  const toPct = (d: Date) => Math.min(100, Math.max(0, (d.getTime() - planStart.getTime()) / totalMs * 100));
  const today = new Date();
  const todayPct = toPct(today);
  const todayVisible = today >= planStart && today <= planEnd;

  // Month column labels
  const months: { label: string }[] = [];
  { const c = new Date(planStart); while (c < planEnd) { months.push({ label: c.toLocaleDateString("en-US", { month: "short", year: "2-digit" }) }); c.setMonth(c.getMonth() + 1); } }

  const totalWeeks = Math.round(milestones.reduce((s, m) => s + m.estimatedHours, 0) / 40);
  const LEFT_W = 230;

  const tooltipEl = tooltip
    ? <div className="fixed z-[9999] pointer-events-none" style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}>{tooltip.content}</div>
    : null;

  return (
    <div>
      {/* Fixed tooltip — outside overflow containers */}
      {typeof window !== "undefined" && tooltipEl}

      {/* ── Chart description + legend ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-1">
        <p className="text-[11px] text-gray-500">
          Estimated schedule · <span className="font-semibold text-gray-700">{totalWeeks} weeks</span> total ·
          milestones run <span className="font-semibold text-gray-700">sequentially</span> · bars show estimated duration & completion
        </p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-10 h-2.5 rounded-full" style={{ background: "rgba(13,148,136,0.16)" }} />
            <span className="text-[10px] text-gray-400">Planned window</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-5 h-2.5 rounded-full" style={{ background: "#0d9488" }} />
            <span className="text-[10px] text-gray-400">Completed %</span>
          </div>
          {todayVisible && (
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-px h-3.5 bg-teal-500" />
              <span className="text-[10px] text-gray-400">Today</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Chart ── */}
      <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--border-soft)" }}>
        {/* Month header */}
        <div className="flex min-w-[700px]" style={{ borderBottom: "1px solid var(--border-soft)", background: "rgba(0,0,0,0.018)" }}>
          <div className="shrink-0 px-4 py-3 flex items-end" style={{ width: LEFT_W }}>
            <span className="text-[9px] font-semibold tracking-widest uppercase text-gray-400">Milestone / Task</span>
          </div>
          <div className="flex-1 flex">
            {months.map((m, i) => (
              <div key={m.label} className="flex-1 py-3 text-center"
                style={{ background: i % 2 === 1 ? "rgba(0,0,0,0.016)" : "transparent", borderLeft: "1px solid var(--border-hair)" }}>
                <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Milestone + task rows */}
        <div className="min-w-[700px]">
          {milestones.map((ms, msIdx) => {
            const c = GANTT_PALETTE[msIdx % GANTT_PALETTE.length];
            const timeline = msTimeline.find(t => t.id === ms.id)!;
            const msTasks = tasks.filter(t => t.milestoneId === ms.id).slice(0, 6);
            const done = msTasks.filter(t => t.status === "accepted").length;
            const pctDone = msTasks.length ? Math.round(done / msTasks.length * 100) : 0;
            const isOpen = expanded.has(ms.id);

            if (!timeline) return null;
            const bLeft = toPct(timeline.start);
            const bWidth = Math.max(4, toPct(timeline.end) - bLeft);

            return (
              <React.Fragment key={ms.id}>
                {/* ── Milestone row ── */}
                <div className="flex items-center cursor-pointer select-none transition-all hover:brightness-[0.97]"
                  style={{ background: c.rowBg, borderBottom: "1px solid var(--border-hair)", borderLeft: `3px solid ${c.border}` }}
                  onClick={() => toggle(ms.id)}>

                  {/* Left: label */}
                  <div className="flex items-center gap-2.5 px-4 py-3.5 shrink-0" style={{ width: LEFT_W }}>
                    <motion.span animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.18 }} className="shrink-0" style={{ color: c.border }}>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </motion.span>
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-gray-800 truncate leading-snug">{ms.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {timeline.durationWeeks}w · {ms.estimatedHours}h · {msTasks.length} tasks
                      </p>
                    </div>
                  </div>

                  {/* Right: timeline */}
                  <div className="flex-1 relative h-16 overflow-hidden">
                    {/* Column shading */}
                    {months.map((_, i) => (
                      <div key={i} className="absolute inset-y-0" style={{ left: `${(i / months.length) * 100}%`, width: `${100 / months.length}%`, background: i % 2 === 1 ? "rgba(0,0,0,0.016)" : "transparent", borderLeft: "1px solid var(--border-hair)" }} />
                    ))}
                    {todayVisible && <div className="absolute inset-y-0 w-px z-20" style={{ left: `${todayPct}%`, background: c.border, opacity: 0.5 }} />}

                    {/* Milestone bar */}
                    <div className="absolute top-1/2 -translate-y-1/2 h-7 rounded-lg overflow-hidden cursor-pointer z-10"
                      style={{ left: `${bLeft}%`, width: `${bWidth}%`, background: c.track }}
                      onMouseEnter={(e) => showTooltip(e, (
                        <div className="rounded-xl px-3 py-2.5 shadow-xl min-w-[180px]" style={{ background: "#1c1917", border: "1px solid rgba(255,255,255,0.08)" }}>
                          <p className="text-[12px] font-semibold text-white mb-1.5">{ms.title}</p>
                          <div className="space-y-1 text-[10.5px] text-gray-400">
                            <div className="flex justify-between gap-4"><span>Start</span><span className="text-gray-200">{timeline.start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>
                            <div className="flex justify-between gap-4"><span>End</span><span className="text-gray-200">{timeline.end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></div>
                            <div className="flex justify-between gap-4"><span>Duration</span><span className="text-gray-200">{timeline.durationWeeks}w · {ms.estimatedHours}h</span></div>
                            <div className="flex justify-between gap-4"><span>Tasks</span><span className="text-gray-200">{msTasks.length}</span></div>
                            <div className="flex justify-between gap-4 pt-1 border-t border-white/10"><span>Progress</span><span style={{ color: c.fill }} className="font-semibold">{pctDone}%</span></div>
                          </div>
                        </div>
                      ))}
                      onMouseMove={moveTooltip}
                      onMouseLeave={hideTooltip}
                    >
                      <motion.div className="h-full rounded-lg"
                        initial={{ width: 0 }} animate={{ width: `${pctDone}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ background: c.fill, opacity: 0.85 }} />
                      {bWidth > 14 && (
                        <div className="absolute inset-0 flex items-center px-2.5">
                          <span className="text-[10px] font-semibold text-white truncate" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                            {pctDone > 0 ? `${pctDone}% done` : "Not started"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Start / end date chips */}
                    <div className="absolute z-10 flex items-center gap-1" style={{ left: `${bLeft}%`, bottom: 4, transform: "translateX(-2px)" }}>
                      <span className="text-[8px] font-medium text-gray-400">
                        {timeline.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className="absolute z-10" style={{ left: `${Math.min(bLeft + bWidth, 98)}%`, bottom: 4 }}>
                      <span className="text-[8px] font-medium text-gray-400">
                        {timeline.end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Task rows ── */}
                <AnimatePresence initial={false}>
                  {isOpen && msTasks.map((task, ti) => {
                    const ts = taskStatusMap[task.status] ?? { variant: "beige", label: task.status, dotColor: "bg-gray-300" };
                    const tProg = task.status === "accepted" ? 100 : task.status === "in_progress" || task.status === "in_review" ? 60 : task.status === "rework" ? 35 : 0;
                    // Spread tasks evenly within the milestone window
                    const slotSize = (timeline.end.getTime() - timeline.start.getTime()) / Math.max(msTasks.length, 1);
                    const tStart = new Date(timeline.start.getTime() + ti * slotSize);
                    const tEnd   = new Date(tStart.getTime() + slotSize * 0.85);
                    const tLeft  = toPct(tStart);
                    const tWidth = Math.max(3, toPct(tEnd) - tLeft);

                    return (
                      <motion.div key={task.id}
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.14, delay: ti * 0.03 }}
                        className="flex items-center"
                        style={{ borderBottom: "1px solid var(--border-hair)" }}>

                        {/* Left: label */}
                        <div className="flex items-center gap-2 shrink-0 pl-11 pr-3 py-2.5" style={{ width: LEFT_W }}>
                          <span className={cn("w-2 h-2 rounded-full shrink-0", ts.dotColor)} />
                          <div className="min-w-0">
                            <p className="text-[11.5px] font-medium text-gray-700 truncate">{task.title}</p>
                            <p className="text-[9.5px] text-gray-400">{task.estimatedHours}h · <span className="capitalize">{task.priority}</span></p>
                          </div>
                        </div>

                        {/* Right: timeline */}
                        <div className="flex-1 relative h-10 overflow-hidden">
                          {months.map((_, i) => (
                            <div key={i} className="absolute inset-y-0" style={{ left: `${(i / months.length) * 100}%`, width: `${100 / months.length}%`, background: i % 2 === 1 ? "rgba(0,0,0,0.016)" : "transparent", borderLeft: "1px solid var(--border-hair)" }} />
                          ))}
                          {todayVisible && <div className="absolute inset-y-0 w-px" style={{ left: `${todayPct}%`, background: c.border, opacity: 0.25 }} />}
                          {/* Task bar */}
                          <div className="absolute top-1/2 -translate-y-1/2 h-4 rounded-md overflow-hidden cursor-pointer z-10"
                            style={{ left: `${tLeft}%`, width: `${tWidth}%`, background: c.track }}
                            onMouseEnter={(e) => showTooltip(e, (
                              <div className="rounded-xl px-3 py-2.5 shadow-xl min-w-[170px]" style={{ background: "#1c1917", border: "1px solid rgba(255,255,255,0.08)" }}>
                                <p className="text-[11.5px] font-semibold text-white mb-1">{task.title}</p>
                                <div className="space-y-1 text-[10px] text-gray-400">
                                  <div className="flex justify-between gap-4"><span>Status</span><span className="text-gray-200 capitalize">{ts.label}</span></div>
                                  <div className="flex justify-between gap-4"><span>Hours</span><span className="text-gray-200">{task.estimatedHours}h</span></div>
                                  <div className="flex justify-between gap-4"><span>Priority</span><span className="text-gray-200 capitalize">{task.priority}</span></div>
                                  <div className="flex justify-between gap-4 pt-1 border-t border-white/10"><span>Progress</span><span style={{ color: c.fill }} className="font-semibold">{tProg}%</span></div>
                                </div>
                              </div>
                            ))}
                            onMouseMove={moveTooltip}
                            onMouseLeave={hideTooltip}
                          >
                            <div className="h-full rounded-md" style={{ width: `${tProg}%`, background: c.fill, opacity: 0.75 }} />
                          </div>
                          {/* % label next to bar */}
                          {tProg > 0 && (
                            <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${Math.min(tLeft + tWidth + 1, 92)}%` }}>
                              <span className="text-[9px] font-semibold tabular-nums" style={{ color: c.label }}>{tProg}%</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══ AI Generating Card ═══ */

function AiGeneratingCard() {
  return (
    <motion.div variants={fadeUp} className="card-parchment flex flex-col items-center justify-center py-20 mb-8 text-center overflow-hidden relative">
      {/* Soft radial background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(20,184,166,0.08) 0%, rgba(20,184,166,0) 55%)",
        }}
      />

      {/* Animated icon with orbiting rings */}
      <div className="relative mb-6">
        {/* Outer pulsing ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-teal-300/50"
          animate={{ scale: [1, 1.6, 1.6], opacity: [0.6, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          style={{ width: 64, height: 64 }}
        />
        {/* Middle pulsing ring (staggered) */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-teal-400/60"
          animate={{ scale: [1, 1.6, 1.6], opacity: [0.8, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
          style={{ width: 64, height: 64 }}
        />
        {/* Icon container with gentle float */}
        <motion.div
          className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 via-teal-500 to-teal-600 flex items-center justify-center shadow-xl shadow-teal-200/70"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-7 h-7 text-white" />
          </motion.div>
        </motion.div>
      </div>

      <p className="relative text-[15px] font-semibold text-gray-800 mb-1.5">AI is working on your decomposition</p>
      <p className="relative text-[12px] text-gray-400 max-w-[340px] mb-7">
        You will be able to see the details once it is completed.
      </p>

      {/* Material-style dual-bar indeterminate progress */}
      <div className="relative w-72 h-1 rounded-full bg-teal-100/70 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600"
          initial={{ left: "-35%", width: "35%" }}
          animate={{ left: ["−35%", "100%"], width: ["35%", "35%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-teal-300 to-teal-500"
          initial={{ left: "-60%", width: "20%" }}
          animate={{ left: ["−60%", "110%"], width: ["20%", "20%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </div>

      {/* Animated dots */}
      <div className="relative flex items-center gap-1.5 mt-5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-teal-500"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ═══ PAGE ═══ */

export default function PlanDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const planId = params.planId as string;

  // ── API data ──
  const { data: apiPlanRes, isLoading: planLoading, isError: planError, error: planErrorObj } = useDecompositionPlan(planId);
  const { data: apiTasksRes } = useTasks(planId);
  const { data: apiMilestonesRes } = useMilestones(planId);

  // Map backend status to frontend PlanStatus
  const normalizeStatus = (s: string): PlanStatus => {
    const map: Record<string, PlanStatus> = {
      PLAN_REVIEW_REQUIRED: "pending_review",
      PENDING_KICKOFF: "draft",
      NEW: "draft",
      PLAN_CONFIRMED: "approved",
      PLAN_LOCKED: "in_progress",
      REVISION_IN_PROGRESS: "revision_in_progress",
      COMPLETED: "completed",
      WITHDRAWN: "completed",
    };
    return map[s] ?? (s as PlanStatus);
  };

  const plan: DecompositionPlan | null = React.useMemo(() => {
    // Handle both {data: {...}} wrapper and direct object
    const resp = apiPlanRes as unknown;
    let raw: Record<string, unknown> | null = null;
    if (resp && typeof resp === "object") {
      const obj = resp as Record<string, unknown>;
      if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) {
        raw = obj.data as Record<string, unknown>;
      } else if (obj.plan_id || obj._id || obj.id) {
        raw = obj;
      }
    }
    if (raw && (raw._id || raw.id || raw.plan_id)) {
      return {
        id: (raw.plan_id ?? raw.id ?? raw._id ?? planId) as string,
        sowId: (raw.sow_id ?? raw.sowId ?? raw.sow_reference ?? searchParams.get("sowId") ?? "") as string,
        title: (raw.title ?? raw.project_name ?? "Untitled Plan") as string,
        status: normalizeStatus((raw.status ?? "draft") as string),
        createdAt: (raw.created_at ?? raw.createdAt ?? new Date().toISOString()) as string,
        updatedAt: (raw.updated_at ?? raw.updatedAt ?? new Date().toISOString()) as string,
        totalTasks: Number(raw.total_tasks ?? raw.totalTasks ?? (raw.summary as Record<string, unknown>)?.total_tasks ?? 0),
        totalSubtasks: Number(raw.total_subtasks ?? raw.totalSubtasks ?? 0),
        totalMilestones: Number(raw.total_milestones ?? raw.totalMilestones ?? (raw.summary as Record<string, unknown>)?.total_milestones ?? 0),
        estimatedHours: Number(raw.estimated_hours ?? raw.estimatedHours ?? ((raw.summary as Record<string, unknown>)?.estimated_total_effort_days as number ?? 0) * 8),
        estimatedCost: Number(raw.estimated_cost ?? raw.estimatedCost ?? 0),
        maximumBudget: Number(raw.maximum_budget ?? raw.maximumBudget ?? raw.max_budget ?? 0),
        complexity: (raw.complexity ?? "medium") as DecompositionPlan["complexity"],
        version: Number(raw.version ?? raw.plan_version ?? 1),
        teamId: (raw.team_id ?? raw.teamId) as string | undefined,
        projectId: (raw.project_id ?? raw.projectId) as string | undefined,
        aiConfidence: Number(raw.ai_confidence ?? raw.aiConfidence ?? 0),
        criticalPathDuration: Number(raw.critical_path_duration ?? raw.criticalPathDuration ?? 0),
        uniqueSkills: Number(raw.unique_skills ?? raw.uniqueSkills ?? 0),
        dependencyCount: Number(raw.dependency_count ?? raw.dependencyCount ?? 0),
      };
    }
    return null;
  }, [apiPlanRes, planId]);

  // Extract the raw plan object once — reused by tasks and milestones below
  const planRaw = React.useMemo<Record<string, unknown> | null>(() => {
    const resp = apiPlanRes as unknown;
    if (!resp || typeof resp !== "object") return null;
    const obj = resp as Record<string, unknown>;
    if (obj.data && typeof obj.data === "object" && !Array.isArray(obj.data)) return obj.data as Record<string, unknown>;
    if (obj.plan_id || obj._id || obj.id) return obj;
    return null;
  }, [apiPlanRes]);

  const tasks: DecompositionTask[] = React.useMemo(() => {
    if (!plan) return [];
    // Prefer tasks embedded in the plan response; fall back to separate endpoint
    const fromPlan = planRaw?.tasks ?? planRaw?.task_list;
    const resp = fromPlan ?? (apiTasksRes as unknown);
    const raw = (!fromPlan && resp && typeof resp === "object" && (resp as Record<string, unknown>).data)
      ? (resp as Record<string, unknown>).data
      : resp;
    const arr = (Array.isArray(raw) ? raw : (raw as Record<string, unknown> | null)?.tasks ?? null) as Record<string, unknown>[] | null;
    if (arr && arr.length > 0) {
      return arr.map((t) => {
        // Backend returns: {id, task_name, milestone, skills, effort, start_date, end_date, critical}
        const skills = t.skills_required ?? t.skillsRequired ?? t.skills;
        const skillTags: DecompositionTask["skillsRequired"] = Array.isArray(skills)
          ? skills.map((s: unknown) => typeof s === "string" ? { name: s, source: "ai" as const } : s as DecompositionTask["skillsRequired"][0])
          : typeof skills === "string" && skills
            ? skills.split(",").map((s: string) => ({ name: s.trim(), source: "ai" as const }))
            : [];

        return {
          id: String(t.task_id ?? t.id ?? t._id ?? ""),
          planId: (t.plan_id ?? t.planId ?? planId) as string,
          milestoneId: (t.milestone_id ?? t.milestoneId ?? t.milestone ?? "") as string,
          title: (t.title ?? t.task_name ?? "") as string,
          description: (t.description ?? "") as string,
          status: (t.status ?? "backlog") as TaskStatus,
          priority: (t.priority ?? (t.critical ? "critical" : "medium")) as DecompositionTask["priority"],
          estimatedHours: Number(t.estimated_hours ?? t.estimatedHours ?? t.effort ?? 0) * (t.effort ? 8 : 1),
          skillsRequired: skillTags,
          dependencies: (t.dependencies ?? []) as DecompositionTask["dependencies"],
          phase: Number(t.phase ?? 1),
          order: Number(t.order ?? t.id ?? 0),
          assigneeId: (t.assignee_id ?? t.assigneeId) as string | undefined,
          acceptanceCriteria: (t.acceptance_criteria ?? t.acceptanceCriteria ?? []) as string[],
          aiConfidence: Number(t.ai_confidence ?? t.aiConfidence ?? 0),
          itemStatus: (t.item_status ?? t.itemStatus ?? "proposed") as DecompositionTask["itemStatus"],
          subtasks: (t.subtasks ?? []) as DecompositionTask["subtasks"],
          startDate: (t.start_date ?? t.startDate) as string | undefined,
          endDate: (t.end_date ?? t.endDate) as string | undefined,
          critical: Boolean(t.critical ?? false),
          seniority: (t.seniority ?? "") as string,
        } as unknown as DecompositionTask;
      });
    }
    return [];
  }, [apiTasksRes, planRaw, plan, planId]);

  const milestones: PlanMilestone[] = React.useMemo(() => {
    if (!plan) return [];
    // Prefer milestones embedded in the plan response; fall back to separate endpoint
    const fromPlan = planRaw?.milestones ?? planRaw?.milestone_list;
    const resp = fromPlan ?? (apiMilestonesRes as unknown);
    const raw = (!fromPlan && resp && typeof resp === "object" && (resp as Record<string, unknown>).data)
      ? (resp as Record<string, unknown>).data
      : resp;
    // Backend can return: {milestones: {M1: [...tasks], M2: [...]}} (dict) or [{...}, {...}] (array)
    const milestonesRaw = fromPlan ?? (raw as Record<string, unknown> | null)?.milestones ?? raw;

    // Case 1: Array of milestone objects
    if (Array.isArray(milestonesRaw) && milestonesRaw.length > 0) {
      return milestonesRaw.map((m: Record<string, unknown>) => ({
        id: (m.milestone_id ?? m.id ?? m._id ?? "") as string,
        planId: (m.plan_id ?? m.planId ?? planId) as string,
        title: (m.title ?? "") as string,
        description: (m.description ?? "") as string,
        order: Number(m.order ?? 0),
        estimatedHours: Number(m.estimated_hours ?? m.estimatedHours ?? 0),
        taskCount: Number(m.task_count ?? m.taskCount ?? 0),
        subtaskCount: Number(m.subtask_count ?? m.subtaskCount ?? 0),
        itemStatus: (m.item_status ?? m.itemStatus ?? "proposed") as PlanMilestone["itemStatus"],
        aiConfidence: Number(m.ai_confidence ?? m.aiConfidence ?? 0),
      })).sort((a, b) => a.order - b.order);
    }

    // Case 2: Dict of {M1: [...tasks], M2: [...tasks]} — convert to milestone objects
    if (milestonesRaw && typeof milestonesRaw === "object" && !Array.isArray(milestonesRaw)) {
      const msDict = milestonesRaw as Record<string, unknown[]>;
      return Object.entries(msDict).map(([key, msTasks], idx) => {
        const tasksArr = Array.isArray(msTasks) ? msTasks : [];
        const totalEffort = tasksArr.reduce((sum: number, t) => sum + Number((t as Record<string, unknown>).effort ?? 0), 0);
        return {
          id: key,
          planId: planId,
          title: `Milestone ${idx + 1} (${key})`,
          description: `${tasksArr.length} tasks, ${totalEffort} days effort`,
          order: idx + 1,
          estimatedHours: totalEffort * 8,
          taskCount: tasksArr.length,
          subtaskCount: 0,
          itemStatus: "proposed" as PlanMilestone["itemStatus"],
          aiConfidence: 0,
        };
      }).sort((a, b) => a.order - b.order);
    }

    return [];
  }, [apiMilestonesRes, planRaw, plan, planId]);

  const sowTitle = plan?.sowId ?? "";
  const recommendations: AIRecommendation[] = [];

  // ── All hooks must be declared before any early return ──
  const { holdProject } = useProjectHoldStore();
  const { push: pushNotification } = useNotificationStore();
  const { data: session } = useSession();

  const [expandedMilestones, setExpandedMilestones] = React.useState<Set<string>>(new Set());
  const [expandedTasks, setExpandedTasks] = React.useState<Set<string>>(new Set());
  const [dismissedRecs, setDismissedRecs] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<"list" | "gantt">("list");
  const [activeTab, setActiveTab] = React.useState(() => searchParams.get("tab") ?? "project_plan");
  const [aiGenerating, setAiGenerating] = React.useState(() => searchParams.get("ai") === "generating");
  const [checkedItems, setCheckedItems] = React.useState<Set<number>>(new Set());
  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const [isConfirmed, setIsConfirmed] = React.useState(
    () => plan?.status === "approved" || plan?.status === "completed" || plan?.status === "in_progress"
  );
  const [promoteLoading, setPromoteLoading] = React.useState(false);
  const [isPromoted, setIsPromoted] = React.useState(false);

  // Expand first 2 milestones once data loads
  React.useEffect(() => {
    if (milestones.length > 0) {
      setExpandedMilestones(new Set(milestones.slice(0, 2).map((m) => m.id)));
    }
  }, [milestones.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seed dismissed recs from data
  React.useEffect(() => {
    setDismissedRecs(new Set(recommendations.filter((r) => r.dismissed).map((r) => r.id)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── AI generation timer ── */
  React.useEffect(() => {
    if (!aiGenerating || !plan) return;

    const timer = setTimeout(() => {
      setAiGenerating(false);

      pushNotification({
        title: "AI Decomposition Complete",
        body: `Task breakdown for "${plan.title}" is ready. Review your milestones and tasks.`,
        severity: "medium",
        href: `/enterprise/decomposition/${plan.id}`,
      });

      toast.success("AI Decomposition Complete", `Task breakdown for "${plan.title}" is ready.`);

      const userEmail = session?.user?.email;
      if (userEmail) {
        fetchInternal("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "sow_stage_approved",
            subject: `AI Task Breakdown Ready — ${plan.title}`,
            payload: {
              stageName: "AI Decomposition",
              projectTitle: plan.title,
              approvedBy: session?.user?.name ?? "Glimmora AI",
              comments: "Your project has been decomposed into milestones and tasks. Please review the breakdown and proceed.",
            },
            to: userEmail,
          }),
        }).catch(() => {});
      }
    }, 20_000);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiGenerating]);

  /* ── Loading skeleton ── */
  if (planLoading) {
    return (
      <div className="space-y-7">
        {/* Back link */}
        <Skeleton className="h-3.5 w-36" />

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-7 w-2/3" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>

        {/* KPI row — 6 cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card-parchment flex items-center gap-4 px-4 py-4">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-2.5 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-lg" />
          ))}
        </div>

        {/* Milestones */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-parchment p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full" />
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-3 w-16" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error state ── */
  if (planError) {
    const is404 = planErrorObj instanceof ApiError && planErrorObj.status === 404;
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm font-semibold text-gray-800 mb-1">
          {is404 ? "Plan not found" : "Failed to load plan"}
        </p>
        <p className="text-xs text-gray-500 max-w-md mb-4">
          {is404
            ? "This decomposition plan no longer exists or you don't have access to it."
            : planErrorObj instanceof Error ? planErrorObj.message : "Unknown error"}
        </p>
        <Link href="/enterprise/decomposition" className="text-sm text-brown-500 hover:text-brown-600 font-medium">
          Back to plans
        </Link>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Network className="w-10 h-10 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Plan not found</h2>
        <p className="text-sm text-gray-500 mb-4">The decomposition plan could not be loaded.</p>
        <Link href="/enterprise/decomposition" className="text-sm text-brown-500 hover:text-brown-600 font-medium">Back to plans</Link>
      </div>
    );
  }

  const effectiveProjectId = (plan as { projectId?: string }).projectId ?? "proj-001";

  const toggleMilestone = (id: string) => setExpandedMilestones((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleTask = (id: string) => setExpandedTasks((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const st = planStatusMap[plan.status] ?? { variant: "beige", label: plan.status };
  const completedTasks = tasks.filter((t) => t.status === "accepted").length;
  const completionPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const totalSubtasks = tasks.reduce((s, t) => s + t.subtasks.length, 0);
  const activeRecCount = recommendations.filter((r) => !dismissedRecs.has(r.id)).length;


  /* ═══ Review Checklist items ═══ */
  const checklistItems = [
    "I have reviewed all milestones, tasks, and their acceptance criteria.",
    "I confirm the project timeline fits within the SOW dates.",
    "I confirm the required skills and seniority levels match the project needs.",
  ];
  const toggleCheck = (i: number) => setCheckedItems((p) => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const allChecked = checkedItems.size === checklistItems.length;

  const handleConfirmPlan = async () => {
    if (!allChecked || confirmLoading) return;
    setConfirmLoading(true);
    try {
      const updatedBy = session?.user?.email ?? session?.user?.id ?? "";

      // Fetch checklist items and mark all as checked before confirming
      const checklistRes = await decompositionApi.getReviewChecklist(planId);
      console.log("[ConfirmPlan] getReviewChecklist raw response:", JSON.stringify(checklistRes, null, 2));

      // Unwrap: handles { data: [...] }, { data: { items: [...] } }, { items: [...] }, or direct array
      const outer = checklistRes as unknown as Record<string, unknown>;
      const inner = (outer.data ?? outer) as unknown;
      const rawItems: Record<string, unknown>[] = Array.isArray(inner)
        ? inner
        : Array.isArray((inner as Record<string, unknown>)?.items)
          ? (inner as Record<string, unknown>).items as Record<string, unknown>[]
          : Array.isArray((inner as Record<string, unknown>)?.checklist)
            ? (inner as Record<string, unknown>).checklist as Record<string, unknown>[]
            : [];

      console.log("[ConfirmPlan] checklist items to patch:", rawItems.length, rawItems.map((i) => i.item_id ?? i.id));

      for (const item of rawItems) {
        const itemId = String(item.item_id ?? item.id ?? "");
        if (!itemId) continue;
        await decompositionApi.updateReviewChecklist(planId, {
          item_id: itemId,
          is_checked: true,
          updated_by: updatedBy,
        });
      }

      await decompositionApi.confirmPlan(planId, { confirmed_by: updatedBy });
      setIsConfirmed(true);
      toast.success("Plan Confirmed", "The decomposition plan has been confirmed successfully.");
    } catch (err) {
      toast.error("Confirmation Failed", err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setConfirmLoading(false);
    }
  };

  const handlePromoteToPortfolio = async () => {
    if (promoteLoading || !plan.sowId) return;
    setPromoteLoading(true);
    try {
      await sowApi.promoteToPortfolio(plan.sowId);
      setIsPromoted(true);
      toast.success("Added to Portfolio", "The project has been added to your portfolio successfully.");
    } catch (err) {
      toast.error("Failed to Add", err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setPromoteLoading(false);
    }
  };

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
            {plan.status === "draft" && (
              <Link href={`/enterprise/decomposition/${plan.id}/approve`}>
                <button className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                  <ShieldCheck className="w-3.5 h-3.5" /> Submit for Approval
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

      {/* ═══ CONFIRMATION BANNER ═══ */}
      <AnimatePresence>
        {isConfirmed && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="relative flex items-center gap-4 px-5 py-4 mb-6 rounded-2xl border border-forest-200 bg-forest-50 overflow-hidden"
          >
            {/* Animated shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-forest-100/60 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.2, ease: "easeInOut", delay: 0.2 }}
            />

            {/* Icon with pulse ring */}
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-xl bg-forest-500 flex items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.1 }}
                >
                  <CheckCircle2 className="w-4.5 h-4.5 text-white" />
                </motion.div>
              </div>
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-forest-400"
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
              />
            </div>

            <div className="flex-1 min-w-0 relative">
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="text-[13px] font-semibold text-forest-800"
              >
                Plan Confirmed
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                className="text-[11px] text-forest-600 mt-0.5"
              >
                Contributor matching is now running.
              </motion.p>
            </div>

            {/* Animated dots */}
            <div className="flex items-center gap-1 shrink-0 relative">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-forest-400"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
            projectId={effectiveProjectId}
            onProjectHold={(pid) => holdProject(pid, "payment_overdue")}
            onM1Paid={() => { setAiGenerating(true); setActiveTab("project_plan"); }}
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
        {aiGenerating && <AiGeneratingCard />}

          {/* ═══ MILESTONE → TASK TREE / GANTT ═══ */}
          {!aiGenerating && (
          <motion.div id="task-breakdown" variants={fadeUp} className="mb-8 scroll-mt-24">
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
              <TaskBreakdownGantt milestones={milestones} tasks={tasks} plan={plan} />
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
                      <div
                        className="w-full flex items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-black/[0.02] cursor-pointer"
                        onClick={() => toggleMilestone(milestone.id)}
                      >
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
                      </div>

                      {isOpen && (
                        <div>
                          {msTasks.map((task) => {
                            const ts = taskStatusMap[task.status] ?? { variant: "beige", label: task.status, dotColor: "bg-gray-300" };
                            const pr = priorityMap[task.priority];
                            const isTaskOpen = expandedTasks.has(task.id);
                            const hasSubtasks = task.subtasks.length > 0;

                            return (
                              <div key={task.id}>
                                <div className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-black/[0.02] cursor-pointer"
                                  style={{ borderTop: "1px solid var(--border-hair)" }}
                                  onClick={() => toggleTask(task.id)}>
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
                                  {isTaskOpen ? <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                                </div>

                                {isTaskOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.2, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                    style={{ borderTop: "1px solid var(--border-hair)" }}
                                  >
                                    <div className="ml-[52px] mr-5 my-4 space-y-4">

                                      {/* Description */}
                                      {task.description && (
                                        <p className="text-[12.5px] text-gray-500 leading-relaxed pl-3" style={{ borderLeft: "2px solid #e5e7eb" }}>
                                          {task.description}
                                        </p>
                                      )}

                                      {/* Acceptance Criteria */}
                                      {task.acceptanceCriteria.length > 0 && (
                                        <div>
                                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Acceptance Criteria</p>
                                          <ul className="space-y-1.5">
                                            {task.acceptanceCriteria.map((criterion, ci) => (
                                              <li key={ci} className="flex items-start gap-2.5">
                                                <span className="shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full bg-teal-400" />
                                                <span className="text-[12px] text-gray-600 leading-relaxed">{criterion}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}

                                      {/* Meta chips row */}
                                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1" style={{ borderTop: "1px solid var(--border-hair)" }}>
                                        {/* Skills */}
                                        {task.skillsRequired.length > 0 && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-gray-400 shrink-0">Skills</span>
                                            <div className="flex flex-wrap gap-1">
                                              {task.skillsRequired.map(s => (
                                                <span key={s.name} className="text-[10px] font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-full">{s.name}</span>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        {/* Separator */}
                                        {task.skillsRequired.length > 0 && <span className="w-px h-3 bg-gray-200" />}
                                        {/* Experience Level */}
                                        {!!(task as unknown as Record<string, unknown>).seniority && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-gray-400">Experience Level</span>
                                            <span className="text-[11px] font-semibold text-gray-700">{(task as unknown as Record<string, unknown>).seniority as string}</span>
                                          </div>
                                        )}
                                        {/* Separator */}
                                        {!!(task as unknown as Record<string, unknown>).startDate && <span className="w-px h-3 bg-gray-200" />}
                                        {/* Timeline */}
                                        {!!(task as unknown as Record<string, unknown>).startDate && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-gray-400">Start Date</span>
                                            <span className="text-[11px] font-semibold text-gray-700">{formatDate((task as unknown as Record<string, unknown>).startDate as string)}</span>
                                            <span className="text-gray-300 text-[10px]">→</span>
                                            <span className="text-[10px] text-gray-400">End Date</span>
                                            <span className="text-[11px] font-semibold text-gray-700">{(task as unknown as Record<string, unknown>).endDate ? formatDate((task as unknown as Record<string, unknown>).endDate as string) : "—"}</span>
                                          </div>
                                        )}
                                        {/* Critical */}
                                        {!!(task as unknown as Record<string, unknown>).critical && (
                                          <>
                                            <span className="w-px h-3 bg-gray-200" />
                                            <Badge variant="danger" dot>Critical</Badge>
                                          </>
                                        )}
                                      </div>

                                      {/* Subtasks */}
                                      {task.subtasks.length > 0 && (
                                        <div style={{ borderTop: "1px solid var(--border-hair)" }} className="pt-3">
                                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Subtasks</p>
                                          <div className="space-y-1">
                                            {task.subtasks.map((st) => (
                                              <div key={st.id} className="flex items-center gap-2 py-1">
                                                {st.itemStatus === "accepted"
                                                  ? <CheckCircle2 className="w-3 h-3 text-forest-500 shrink-0" />
                                                  : <Circle className="w-3 h-3 text-gray-300 shrink-0" />}
                                                <span className="text-[11.5px] text-gray-600 flex-1 truncate">{st.title}</span>
                                                <span className="text-[9.5px] font-mono text-gray-400 shrink-0">{st.estimatedHours}h</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                    </div>
                                  </motion.div>
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
              {isConfirmed ? (
                <div className="py-6 px-5 flex flex-col items-center gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-forest-500" />
                  </div>
                  <p className="text-[13px] font-semibold text-forest-700">Plan Confirmed</p>
                  <p className="text-[11px] text-gray-400">Contributor matching is now running.</p>
                  {isPromoted ? (
                    <div className="w-full flex items-center justify-center gap-2 text-[12px] font-semibold py-2.5 rounded-xl text-white bg-gradient-to-r from-brown-400 to-brown-600 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Added to Portfolio
                    </div>
                  ) : (
                    <button
                      onClick={handlePromoteToPortfolio}
                      disabled={promoteLoading}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 text-[12px] font-semibold py-2.5 rounded-xl transition-all mt-1",
                        !promoteLoading
                          ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 shadow-sm"
                          : "text-gray-400 bg-gray-100 cursor-not-allowed"
                      )}
                    >
                      {promoteLoading ? (
                        <>
                          <motion.span
                            className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          />
                          Adding…
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-3.5 h-3.5" />
                          Add to Portfolio
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
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
                  <div className="pt-1">
                    <button
                      onClick={handleConfirmPlan}
                      disabled={!allChecked || confirmLoading}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 text-[12px] font-semibold py-2.5 rounded-xl transition-all",
                        allChecked && !confirmLoading
                          ? "text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-sm"
                          : "text-gray-400 bg-gray-100 cursor-not-allowed"
                      )}
                    >
                      {confirmLoading ? (
                        <>
                          <motion.span
                            className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                          />
                          Confirming…
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirm Plan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
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