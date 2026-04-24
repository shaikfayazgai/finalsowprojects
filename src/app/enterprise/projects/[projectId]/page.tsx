"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar, CheckCircle2, CircleDollarSign, Clock, DollarSign,
  AlertTriangle, Eye, FileCheck, Flag, Layers, Package,
  ShieldCheck, Sparkles, Target, Timer, Users, Zap, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  mockProjects, mockTasks, mockTeams, mockMilestones, mockDeliverables,
} from "@/mocks/data/enterprise-projects";
import { Skeleton } from "@/components/ui";
import type { ProjectHealth, MilestoneStatus, TaskStatus } from "@/types/enterprise";
import { toast } from "@/lib/stores/toast-store";
import {
  useProjectOverview,
  useProjectActivities,
  useEvidencePacks,
  useReworkRequests,
  useHoldProject,
  useResumeProject,
} from "@/lib/hooks/use-portfolio";

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

/* ═══ Configs ═══ */

const healthCfg: Record<ProjectHealth, { label: string; variant: string }> = {
  on_track: { label: "On Track", variant: "forest" },
  at_risk: { label: "At Risk", variant: "gold" },
  behind: { label: "Behind", variant: "danger" },
  on_hold: { label: "On Hold", variant: "beige" },
  escalated: { label: "Escalated", variant: "brown" },
  completed: { label: "Completed", variant: "teal" },
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
  low: { variant: "beige", label: "Low" },
  medium: { variant: "teal", label: "Medium" },
  high: { variant: "gold", label: "High" },
  critical: { variant: "brown", label: "Critical" },
};

const msStatusColors: Record<MilestoneStatus, { dot: string; text: string; bg: string; border: string }> = {
  completed: { dot: "bg-forest-500", text: "text-forest-700", bg: "bg-forest-50", border: "border-forest-300" },
  in_progress: { dot: "bg-teal-500", text: "text-teal-700", bg: "bg-teal-50", border: "border-teal-300" },
  upcoming: { dot: "bg-gray-300", text: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" },
  overdue: { dot: "bg-brown-500", text: "text-brown-700", bg: "bg-brown-50", border: "border-brown-300" },
};

const deliverableStatusMap: Record<string, { variant: string; label: string }> = {
  pending: { variant: "gold", label: "Pending Review" },
  approved: { variant: "forest", label: "Approved" },
  rejected: { variant: "danger", label: "Rejected" },
  rework: { variant: "brown", label: "Rework" },
};

/* ═══ Helpers ═══ */

function formatDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function formatShortDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" }); }
function trackLabel(track: string) {
  switch (track) {
    case "women": return "Women's Track";
    case "student": return "University";
    default: return "General";
  }
}

/* ═══ PAGE ═══ */

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  /* Fetch real API data */
  const { data: overviewData, isLoading: isOverviewLoading } = useProjectOverview(projectId);
  const { data: activitiesData } = useProjectActivities(projectId);
  const { data: evidencePacksData } = useEvidencePacks(projectId);
  const { data: reworkData } = useReworkRequests(projectId);
  const holdMutation = useHoldProject();
  const resumeMutation = useResumeProject();

  /* Build project from API data; mock fallback only used to satisfy types */
  const mockProject = mockProjects.find((p) => p.id === projectId);
  const project = React.useMemo(() => {
    if (!overviewData) return mockProject;
    const healthMap: Record<string, ProjectHealth> = {
      OK: "on_track", ON_TRACK: "on_track", AT_RISK: "at_risk",
      BEHIND: "behind", ON_HOLD: "on_hold", ESCALATED: "escalated", COMPLETED: "completed",
    };
    return {
      ...(mockProject ?? ({} as any)),
      title: overviewData.name,
      health: healthMap[overviewData.health?.toUpperCase()] ?? (mockProject?.health ?? "on_track"),
      progress: overviewData.completion_pct,
    };
  }, [overviewData, mockProject]);

  const milestones = project ? mockMilestones.filter((m) => m.projectId === project.id) : [];
  const team = project ? mockTeams.find((t) => t.id === project.teamId) : undefined;
  const tasks = project ? mockTasks.filter((t) => t.planId === project.planId) : [];
  const deliverables = project ? mockDeliverables.filter((d) => d.projectId === project.id) : [];
  const hc = project ? healthCfg[project.health as ProjectHealth] : healthCfg.on_track;
  const [resolvedExceptions, setResolvedExceptions] = React.useState<Set<string>>(new Set());
  const [otpDialog, setOtpDialog] = React.useState<{
    isOpen: boolean;
    type: "payment" | "uat" | null;
    itemId: string | null;
  }>({ isOpen: false, type: null, itemId: null });
  const [releasedPayments, setReleasedPayments] = React.useState<Set<string>>(new Set());
  const [uatSigned, setUatSigned] = React.useState(false);
  const [tlTooltip, setTlTooltip] = React.useState<{ x: number; y: number; content: React.ReactNode } | null>(null);
  const [todayClient, setTodayClient] = React.useState<Date | null>(null);
  React.useEffect(() => { setTodayClient(new Date()); }, []);

  if (!project) {
    return (
      <div className="card-parchment px-6 py-16 text-center">
        <p className="text-[14px] font-medium text-gray-600 mb-1">Project not found</p>
        <p className="text-[12px] text-gray-400">This project may have been removed or is loading.</p>
      </div>
    );
  }

  const daysLeft = Math.max(0, Math.ceil((new Date(project.endDate).getTime() - Date.now()) / 86400000));
  const completedTasks = tasks.filter((t) => t.status === "accepted").length;
  const completionPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const timelineData = React.useMemo(() => {
    if (!milestones.length) return { rows: [], months: [], toPct: (_d: Date) => 0, rangeStart: new Date(0), rangeEnd: new Date(0) };
    const sorted = [...milestones].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    const rangeStart = new Date(project.startDate);
    const rangeEnd   = new Date(sorted[sorted.length - 1].dueDate);
    rangeEnd.setDate(rangeEnd.getDate() + 14);
    const totalMs = rangeEnd.getTime() - rangeStart.getTime();
    const toPct = (d: Date) => Math.min(100, Math.max(0, (d.getTime() - rangeStart.getTime()) / totalMs * 100));

    const palette: Record<MilestoneStatus, { track: string; fill: string; border: string; label: string }> = {
      completed:   { track: "rgba(22,163,74,0.15)",  fill: "#16a34a", border: "#16a34a", label: "#15803d" },
      in_progress: { track: "rgba(13,148,136,0.15)", fill: "#0d9488", border: "#0d9488", label: "#0f766e" },
      upcoming:    { track: "rgba(148,163,184,0.2)", fill: "#94a3b8", border: "#94a3b8", label: "#64748b" },
      overdue:     { track: "rgba(180,83,9,0.15)",   fill: "#b45309", border: "#b45309", label: "#92400e" },
    };

    const rows = sorted.map((ms, i) => {
      const start = i === 0 ? new Date(rangeStart) : new Date(sorted[i - 1].dueDate);
      const end   = new Date(ms.dueDate);
      if (start.getTime() >= end.getTime()) end.setDate(start.getDate() + 7);
      const bLeft  = toPct(start);
      const bWidth = Math.max(4, toPct(end) - bLeft);
      return { ms, start, end, bLeft, bWidth, c: palette[ms.status] };
    });

    const months: string[] = [];
    const c = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    while (c <= rangeEnd) {
      months.push(c.toLocaleDateString("en-US", { month: "short", year: "2-digit" }));
      c.setMonth(c.getMonth() + 1);
    }

    return { rows, months, toPct, rangeStart, rangeEnd };
  }, [milestones, project.startDate]);

  const todayPct = todayClient ? timelineData.toPct(todayClient) : 0;
  const todayVisible = todayClient
    ? todayClient >= timelineData.rangeStart && todayClient <= timelineData.rangeEnd
    : false;

  const projectExceptions = [
    ...(project.escalations > 0 ? [{ id: "pe-1", type: "escalation", description: "Client escalation: deliverable review cycle exceeding SLA threshold.", severity: "critical" as const, date: "2 hours ago", status: "open" as const }] : []),
    ...(project.slaCompliance < 90 ? [{ id: "pe-2", type: "sla_breach", description: "SLA compliance dropped below 90% target. Evidence packs pending review beyond 48h window.", severity: "warning" as const, date: "6 hours ago", status: "investigating" as const }] : []),
    ...(project.health === "behind" ? [{ id: "pe-3", type: "quality_issue", description: "Review pass rate dropped to 58% over last 5 submissions. APG quality threshold is 75%.", severity: "warning" as const, date: "1 day ago", status: "open" as const }] : []),
  ];

  const handleReleasePayment = (paymentId: string) => {
    setOtpDialog({ isOpen: true, type: "payment", itemId: paymentId });
  };

  const handleUATSignOff = () => {
    setOtpDialog({ isOpen: true, type: "uat", itemId: "m3" });
  };

  const handleOtpConfirm = () => {
    if (otpDialog.type === "payment" && otpDialog.itemId) {
      setReleasedPayments((prev) => new Set(prev).add(otpDialog.itemId!));
      toast.success("Payment Released", "Payment has been released to contributor");
    } else if (otpDialog.type === "uat") {
      setUatSigned(true);
      toast.success("UAT Signed Off", "M3 billing milestone has been triggered");
    }
  };

  const handleDownloadReport = () => {
    toast.success("Report Downloaded", `Project report for "${project.title}" has been downloaded.`);
  };

  const handlePutOnHold = () => {
    holdMutation.mutate(projectId);
    toast.info("Project On Hold", `"${project.title}" has been put on hold.`);
  };

  const handleResume = () => {
    resumeMutation.mutate(projectId);
    toast.success("Project Resumed", `"${project.title}" is now back on track.`);
  };

  /* Skeleton while API data is loading */
  if (isOverviewLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-7 w-2/3" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-32 rounded-xl" />
            </div>
          </div>
        </div>

        {/* KPI row skeleton — 6 cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
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

        {/* Team section skeleton */}
        <div className="card-parchment p-5 space-y-4">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="h-2.5 w-14" />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline skeleton */}
        <div className="card-parchment p-5 space-y-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>

        {/* Tasks skeleton */}
        <div className="card-parchment p-5 space-y-3">
          <Skeleton className="h-4 w-20" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-5 w-16 rounded-full ml-auto" />
            </div>
          ))}
        </div>

        {/* Deliverables skeleton */}
        <div className="card-parchment p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-3" style={{ borderBottom: i < 2 ? "1px solid var(--border-hair)" : undefined }}>
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <Badge variant={hc.variant} dot>{hc.label}</Badge>
            </div>
            <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">{project.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap text-[12px] text-gray-400">
              <span className="text-gray-600 font-medium">{project.client}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <Link href={`/enterprise/sow/${project.sowId}`} className="text-brown-500 hover:text-brown-600 font-medium transition-colors">{project.sowTitle}</Link>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>{formatDate(project.startDate)} – {formatDate(project.endDate)}</span>
              {overviewData?.owner && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="text-gray-600 font-medium">Owner: {overviewData.owner}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link href={`/enterprise/projects/${projectId}/milestones`}>
              <button className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                <Layers className="w-3 h-3" /> Milestones
              </button>
            </Link>
            <Link href={`/enterprise/projects/${projectId}/monitor`}>
              <button className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                <Zap className="w-3.5 h-3.5" /> Live Monitor
              </button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: "Progress", value: `${project.progress}%`, icon: CheckCircle2, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "APG Score", value: project.apgScore, icon: Target, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "Budget", value: `$${Math.round(project.spent / 1000)}k / $${Math.round(project.budget / 1000)}k`, icon: DollarSign, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { label: "Team Size", value: project.teamSize, icon: Users, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          { label: "SLA", value: `${project.slaCompliance}%`, icon: ShieldCheck, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "Days Left", value: daysLeft, icon: Calendar, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-4 px-4 py-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", kpi.iconBg)}>
                <KpiIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium text-gray-400">{kpi.label}</div>
                <div className="num-display text-[20px] text-gray-900 leading-none mt-0.5">{kpi.value}</div>
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
          {(["in_progress", "in_review", "accepted"] as TaskStatus[]).map((key) => {
            const count = tasks.filter((t) => t.status === key).length;
            const cfg = taskStatusMap[key];
            return (
              <div key={key} className="flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full", cfg.dotColor)} />
                <span className="text-[11px] text-gray-600"><span className="font-semibold">{count}</span> {cfg.label}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brown-400" />
            <span className="text-[11px] text-gray-600">
              <span className="font-semibold">{tasks.filter((t) => t.status === "rework").length}</span> In Clarification / Rework
            </span>
          </div>
        </div>
      </motion.div>

      {/* ═══ TASKS ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Tasks</span>
          <span className="text-[11px] text-gray-400">{tasks.length} total</span>
        </div>
        <div className="hidden lg:grid items-center px-5 py-2.5"
          style={{ gridTemplateColumns: "1fr 100px 80px 80px 20px", borderBottom: "1px solid var(--border-soft)", background: "color-mix(in srgb, var(--color-gray-100) 40%, white)", fontSize: 10, color: "var(--color-gray-400)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <span>Task</span><span>Status</span><span>Priority</span><span>Hours</span><span />
        </div>
        {tasks.map((task, i) => {
          const ts = taskStatusMap[task.status];
          const pr = priorityMap[task.priority];
          return (
            <Link key={task.id} href={`/enterprise/projects/${projectId}/tasks/${task.id}`}>
              <div className="group flex lg:grid items-center px-5 py-3.5 transition-colors hover:bg-black/[0.02]"
                style={{ gridTemplateColumns: "1fr 100px 80px 80px 20px", borderBottom: i < tasks.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-gray-700 truncate">{task.title}</div>
                  <div className="text-[11px] text-gray-400 truncate mt-0.5">{task.description}</div>
                </div>
                <div className="hidden lg:block"><Badge variant={ts.variant}>{ts.label}</Badge></div>
                <div className="hidden lg:block">{pr && <Badge variant={pr.variant}>{pr.label}</Badge>}</div>
                <div className="hidden lg:block text-[12px] font-mono text-gray-600">{task.estimatedHours}h</div>
                <div className="hidden lg:flex justify-end">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Link>
          );
        })}
        {tasks.length === 0 && (
          <div className="py-10 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-gray-300" />
            <p className="text-[13px] text-gray-400">No tasks found for this project.</p>
          </div>
        )}
      </motion.div>

      {/* ═══ TEAM + SLA ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Team */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Team</span>
            {team && <span className="text-[11px] text-gray-400">{team.totalMembers} members · {team.matchScore}% match</span>}
          </div>
          {team ? (
            <>
              <div className="flex items-center gap-2 mx-5 mt-3 px-3 py-2 rounded-lg bg-forest-50">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-500 shrink-0" />
                <p className="text-[10px] text-forest-700">All contributor identities are anonymized. Privacy by architecture.</p>
              </div>
              <div className="py-2">
                {team.members.map((member, i) => (
                  <div key={member.id} className="flex items-center gap-3 px-5 py-3"
                    style={{ borderBottom: i < team.members.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brown-300 to-brown-500 flex items-center justify-center text-[9px] font-bold text-white shrink-0">
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium text-gray-700">{member.displayName}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-mono text-gray-400">{member.anonymousId}</span>
                        <span className="text-[9px] text-gray-400">{trackLabel(member.track)}</span>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                      <div className="w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={cn("h-full rounded-full", member.matchScore >= 90 ? "bg-forest-500" : member.matchScore >= 80 ? "bg-teal-500" : "bg-gold-500")}
                          style={{ width: `${member.matchScore}%` }} />
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 w-7 text-right">{member.matchScore}%</span>
                    </div>
                    <Badge variant={member.availability === "full_time" ? "forest" : member.availability === "part_time" ? "gold" : "beige"}>
                      {member.availability === "full_time" ? "Full" : member.availability === "part_time" ? "Part" : "Limited"}
                    </Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <Sparkles className="w-3 h-3 text-gold-500" />
                      <span className="text-[11px] font-semibold text-gray-700">{member.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-10 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-gray-300" />
              <p className="text-[13px] text-gray-400">No team assigned yet.</p>
            </div>
          )}
        </div>

        {/* SLA */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">SLA Compliance</span>
            <span className={cn("text-[14px] font-semibold",
              project.slaCompliance >= 95 ? "text-forest-600" : project.slaCompliance >= 85 ? "text-gold-600" : "text-brown-600"
            )}>{project.slaCompliance}%</span>
          </div>
          <div className="py-2">
            {[
              { label: "Review Turnaround", target: "48h", actual: project.slaCompliance >= 90 ? "34h" : "52h", met: project.slaCompliance >= 90, icon: Timer },
              { label: "Payment Release", target: "72h", actual: project.slaCompliance >= 85 ? "48h" : "78h", met: project.slaCompliance >= 85, icon: CircleDollarSign },
              { label: "Escalation Response", target: "4h", actual: project.slaCompliance >= 90 ? "2h" : "6h", met: project.slaCompliance >= 90, icon: Flag },
              { label: "Evidence Review", target: "24h", actual: project.slaCompliance >= 90 ? "18h" : "32h", met: project.slaCompliance >= 90, icon: FileCheck },
            ].map((metric, i, arr) => {
              const MetricIcon = metric.icon;
              return (
                <div key={metric.label} className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                  <MetricIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-[12px] text-gray-600 flex-1">{metric.label}</span>
                  <span className="text-[11px] text-gray-400 shrink-0">Target: {metric.target}</span>
                  <span className={cn("text-[12px] font-semibold shrink-0 w-9 text-right", metric.met ? "text-forest-600" : "text-gold-600")}>{metric.actual}</span>
                  {metric.met ? <CheckCircle2 className="w-3.5 h-3.5 text-forest-500 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-gold-500 shrink-0" />}
                </div>
              );
            })}
          </div>
          {/* Compliance trend */}
          <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
            <div className="text-[11px] font-medium text-gray-400 mb-3">Weekly Trend</div>
            <div className="flex items-end gap-2 h-20">
              {[88, 91, 93, 90, 94, project.slaCompliance].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] font-semibold text-gray-500">{val}%</span>
                  <div className={cn("w-full rounded-t-md", val >= 95 ? "bg-forest-400" : val >= 85 ? "bg-gold-400" : "bg-brown-400")}
                    style={{ height: `${val * 0.8}%` }} />
                  <span className="text-[8px] text-gray-400">W{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ TIMELINE ═══ */}
      {milestones.length > 0 && (() => {
        const { rows, months } = timelineData;
        const LEFT_W = 220;
        const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        const fmtShort = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return (
          <motion.div variants={fadeUp} className="card-parchment mb-6 overflow-hidden">
            {/* Fixed tooltip */}
            {tlTooltip && (
              <div className="fixed z-[9999] pointer-events-none" style={{ left: tlTooltip.x + 14, top: tlTooltip.y - 10 }}>
                {tlTooltip.content}
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-800">Milestone Timeline</span>
                <div className="hidden sm:flex items-center gap-3">
                  {([
                    { s: "completed",   color: "#16a34a", label: "Completed"   },
                    { s: "in_progress", color: "#0d9488", label: "In Progress" },
                    { s: "upcoming",    color: "#94a3b8", label: "Upcoming"    },
                    { s: "overdue",     color: "#b45309", label: "Overdue"     },
                  ]).map(({ s, color, label }) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
                      <span className="text-[10px] text-gray-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {todayVisible && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-px h-3.5 bg-teal-500" />
                    <span className="text-[10px] text-gray-400">Today</span>
                  </div>
                )}
                <span className="text-[11px] text-gray-400">{formatDate(project.startDate)} – {formatDate(project.endDate)}</span>
              </div>
            </div>

            {/* Chart */}
            <div className="overflow-x-auto">
              {/* Month header */}
              <div className="flex min-w-[640px]" style={{ borderBottom: "1px solid var(--border-soft)", background: "rgba(0,0,0,0.018)" }}>
                <div className="shrink-0 flex items-end px-4 py-2.5" style={{ width: LEFT_W }}>
                  <span className="text-[9px] font-semibold tracking-widest uppercase text-gray-400">Milestone</span>
                </div>
                <div className="flex-1 flex">
                  {months.map((m, i) => (
                    <div key={m} className="flex-1 py-2.5 text-center"
                      style={{ background: i % 2 === 1 ? "rgba(0,0,0,0.016)" : "transparent", borderLeft: "1px solid var(--border-hair)" }}>
                      <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">{m}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestone rows */}
              <div className="min-w-[640px]">
                {rows.map(({ ms, start, end, bLeft, bWidth, c }, idx) => {
                  const sc = msStatusColors[ms.status];
                  return (
                    <div key={ms.id}
                      className="flex items-center"
                      style={{ background: idx % 2 === 0 ? "transparent" : "rgba(0,0,0,0.012)", borderBottom: "1px solid var(--border-hair)" }}>

                      {/* Left: label */}
                      <div className="shrink-0 px-4 py-3.5 flex items-center gap-3" style={{ width: LEFT_W }}>
                        <span className={cn("w-2 h-2 rounded-full shrink-0", sc.dot)} />
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-gray-800 truncate leading-snug">{ms.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full border", sc.bg, sc.text, sc.border)}>
                              {ms.status.replace("_", " ")}
                            </span>
                            <span className="text-[9.5px] text-gray-400">{ms.tasksCompleted}/{ms.tasksTotal} tasks</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: bar */}
                      <div className="flex-1 relative h-14 overflow-hidden">
                        {/* Column shading */}
                        {months.map((_, i) => (
                          <div key={i} className="absolute inset-y-0"
                            style={{ left: `${(i / months.length) * 100}%`, width: `${100 / months.length}%`, background: i % 2 === 1 ? "rgba(0,0,0,0.016)" : "transparent", borderLeft: "1px solid var(--border-hair)" }} />
                        ))}
                        {/* Today line */}
                        {todayVisible && (
                          <div className="absolute inset-y-0 w-px z-10" style={{ left: `${todayPct}%`, background: c.border, opacity: 0.5 }} />
                        )}

                        {/* Bar */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-8 rounded-xl overflow-hidden cursor-pointer z-10"
                          style={{ left: `${bLeft}%`, width: `${bWidth}%`, background: c.track }}
                          onMouseEnter={(e) => setTlTooltip({ x: e.clientX, y: e.clientY, content: (
                            <div className="rounded-xl px-3 py-2.5 shadow-xl min-w-[190px]" style={{ background: "#1c1917", border: "1px solid rgba(255,255,255,0.08)" }}>
                              <p className="text-[12px] font-semibold text-white mb-1.5">{ms.title}</p>
                              <div className="space-y-1 text-[10.5px] text-gray-400">
                                <div className="flex justify-between gap-4"><span>Start</span><span className="text-gray-200">{fmt(start)}</span></div>
                                <div className="flex justify-between gap-4"><span>Due</span><span className="text-gray-200">{fmt(end)}</span></div>
                                <div className="flex justify-between gap-4"><span>Tasks</span><span className="text-gray-200">{ms.tasksCompleted}/{ms.tasksTotal}</span></div>
                                <div className="flex justify-between gap-4"><span>Budget</span><span className="text-gray-200">₹{ms.budget?.toLocaleString("en-IN") ?? "—"}</span></div>
                                <div className="flex justify-between gap-4 pt-1 border-t border-white/10">
                                  <span>Progress</span><span style={{ color: c.fill }} className="font-semibold">{ms.progress}%</span>
                                </div>
                              </div>
                            </div>
                          )})}
                          onMouseMove={(e) => setTlTooltip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                          onMouseLeave={() => setTlTooltip(null)}
                        >
                          {/* Progress fill */}
                          <motion.div className="h-full rounded-xl"
                            initial={{ width: 0 }} animate={{ width: `${ms.progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            style={{ background: c.fill, opacity: 0.85 }} />
                          {/* Label inside bar */}
                          {bWidth > 12 && (
                            <div className="absolute inset-0 flex items-center px-3">
                              <span className="text-[10px] font-semibold text-white truncate" style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
                                {ms.progress > 0 ? `${ms.progress}%` : "Not started"}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Date chips */}
                        <div className="absolute z-10" style={{ left: `${bLeft}%`, bottom: 3, transform: "translateX(-2px)" }}>
                          <span className="text-[8px] text-gray-400">{fmtShort(start)}</span>
                        </div>
                        <div className="absolute z-10" style={{ left: `${Math.min(bLeft + bWidth, 97)}%`, bottom: 3 }}>
                          <span className="text-[8px] text-gray-400">{fmtShort(end)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* ═══ DELIVERABLES ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Deliverables</span>
          <span className="text-[11px] text-gray-400">{deliverables.length} total</span>
        </div>
        <div className="hidden lg:grid items-center px-5 py-2.5"
          style={{ gridTemplateColumns: "1fr 110px 100px 90px 80px 80px", borderBottom: "1px solid var(--border-soft)", background: "color-mix(in srgb, var(--color-gray-100) 40%, white)", fontSize: 10, color: "var(--color-gray-400)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <span>Deliverable</span><span>Status</span><span>Submitted By</span><span>Date</span><span>Evidence</span><span>Action</span>
        </div>
        {deliverables.map((del, i) => {
          const ds = deliverableStatusMap[del.status] || deliverableStatusMap.pending;
          return (
            <div key={del.id} className="flex lg:grid items-center px-5 py-3.5"
              style={{ gridTemplateColumns: "1fr 110px 100px 90px 80px 80px", borderBottom: i < deliverables.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-700">{del.title}</div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5">{del.taskId}</div>
              </div>
              <div className="hidden lg:block"><Badge variant={ds.variant} dot>{ds.label}</Badge></div>
              <div className="hidden lg:block text-[12px] text-gray-600">{del.submittedBy}</div>
              <div className="hidden lg:block text-[11px] text-gray-400">{formatShortDate(del.submittedAt)}</div>
              <div className="hidden lg:block">
                <Link href={`/enterprise/review/${del.id}`} className="text-[11px] font-medium text-brown-500 hover:text-brown-600">{del.evidenceFiles} files</Link>
              </div>
              <div className="hidden lg:block">
                {del.status === "pending" ? (
                  <Link href={`/enterprise/review/${del.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 px-3 py-1.5 rounded-lg">
                    <Eye className="w-3 h-3" /> Review
                  </Link>
                ) : del.status === "rework" ? (
                  <Link href={`/enterprise/review/${del.id}`} className="text-[11px] font-medium text-brown-500 hover:text-brown-600">Feedback</Link>
                ) : (
                  <span className="text-[10px] text-gray-400 capitalize">{del.status}</span>
                )}
              </div>
            </div>
          );
        })}
        {deliverables.length === 0 && (
          <div className="py-10 text-center">
            <Package className="w-6 h-6 mx-auto mb-2 text-gray-300" />
            <p className="text-[13px] text-gray-400">No deliverables submitted yet.</p>
          </div>
        )}
      </motion.div>

      {/* ═══ EVIDENCE PACKS (API) ═══ */}
      {evidencePacksData && evidencePacksData.groups.length > 0 && (
        <motion.div variants={fadeUp} className="card-parchment mb-6">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Evidence Packs</span>
            <span className="text-[11px] text-gray-400">{evidencePacksData.total} total</span>
          </div>
          {evidencePacksData.groups.map((group) => (
            <div key={group.milestone_id}>
              <div className="px-5 py-2 bg-gray-50/60 border-b border-gray-100">
                <span className="text-[11px] font-semibold text-gray-600 uppercase tracking-wider">{group.milestone_key} — {group.milestone_name}</span>
              </div>
              {group.evidence_packs.map((ep, i) => {
                const statusColors: Record<string, { bg: string; text: string }> = {
                  APPROVED: { bg: "bg-forest-50", text: "text-forest-700" },
                  PENDING_REVIEW: { bg: "bg-gold-50", text: "text-gold-700" },
                  REJECTED: { bg: "bg-red-50", text: "text-red-600" },
                  DRAFT: { bg: "bg-gray-100", text: "text-gray-600" },
                };
                const sc = statusColors[ep.status] ?? statusColors.DRAFT;
                return (
                  <div key={ep.id} className="flex items-center justify-between px-5 py-3" style={{ borderBottom: i < group.evidence_packs.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-700">{ep.title}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{new Date(ep.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase", sc.bg, sc.text)}>
                      {ep.status.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </motion.div>
      )}

      {/* ═══ REWORK REQUESTS (API) ═══ */}
      {reworkData && reworkData.rework_requests.length > 0 && (
        <motion.div variants={fadeUp} className="card-parchment mb-6">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Rework Requests</span>
            <span className="text-[11px] text-gray-400">{reworkData.total} total</span>
          </div>
          {reworkData.rework_requests.map((rw, i) => {
            const rwStatusColors: Record<string, { bg: string; text: string }> = {
              OPEN: { bg: "bg-red-50", text: "text-red-600" },
              IN_PROGRESS: { bg: "bg-gold-50", text: "text-gold-700" },
              RESOLVED: { bg: "bg-forest-50", text: "text-forest-700" },
              CLOSED: { bg: "bg-gray-100", text: "text-gray-600" },
            };
            const sc = rwStatusColors[rw.status] ?? rwStatusColors.OPEN;
            return (
              <div key={rw.id} className="px-5 py-3.5" style={{ borderBottom: i < reworkData.rework_requests.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-gray-700">{rw.task}</span>
                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase", sc.bg, sc.text)}>
                    {rw.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[12px] text-gray-500 leading-relaxed">{rw.reason}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                  <span>{rw.milestone}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>Round {rw.round}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span>Due {new Date(rw.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* ═══ EXCEPTIONS ═══ */}
      {projectExceptions.length > 0 && (
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-800">Exceptions</h2>
              <span className="text-[10px] font-semibold text-gold-700 bg-gold-50 w-5 h-5 rounded-full flex items-center justify-center">
                {projectExceptions.filter((e) => !resolvedExceptions.has(e.id)).length}
              </span>
            </div>
            <Link href="/enterprise/projects/exceptions" className="text-[12px] text-brown-500 hover:text-brown-600 font-medium flex items-center gap-1">
              Exception Queue <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="card-parchment">
            {projectExceptions.map((exc, i) => {
              const isResolved = resolvedExceptions.has(exc.id);
              return (
                <div key={exc.id} className={cn("px-5 py-4 transition-opacity", isResolved && "opacity-40")}
                  style={{ borderBottom: i < projectExceptions.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={cn("w-4 h-4 shrink-0 mt-0.5", exc.severity === "critical" ? "text-brown-600" : "text-gold-500")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={exc.type === "escalation" ? "danger" : exc.type === "sla_breach" ? "brown" : "gold"}>
                          {exc.type === "escalation" ? "Escalation" : exc.type === "sla_breach" ? "SLA Breach" : "Quality Issue"}
                        </Badge>
                        <Badge variant={exc.severity === "critical" ? "brown" : "gold"}>{exc.severity}</Badge>
                        <Badge variant={isResolved ? "forest" : exc.status === "open" ? "gold" : "teal"}>
                          {isResolved ? "resolved" : exc.status}
                        </Badge>
                      </div>
                      <p className="text-[12px] text-gray-500 leading-relaxed">{exc.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{exc.date}</span>
                        {!isResolved && (
                          <button onClick={() => setResolvedExceptions((p) => { const n = new Set(p); n.add(exc.id); return n; })}
                            className="flex items-center gap-1 text-[11px] font-medium text-white bg-gradient-to-r from-brown-400 to-brown-600 px-3 py-1.5 rounded-lg">
                            <CheckCircle2 className="w-3 h-3" /> Resolve
                          </button>
                        )}
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
