// @ts-nocheck
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle, Clock, MessageSquare, CheckCircle2,
  ArrowRight, ClipboardList, Inbox, ListChecks, TrendingUp,
  Sparkles, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  mockReviewQueue, mockQAMessages, mockTaskMonitor,
  mockMyMetrics, mockReviewerNotifications, mockReviewer,
} from "@/mocks/data/enterprise-reviewer";

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

function formatTimeLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return { label: "OVERDUE", color: "text-red-600", bg: "bg-red-50" };
  const hours = Math.floor(diff / 3600000);
  if (hours < 4) return { label: `Due in ${hours}h`, color: "text-red-600", bg: "bg-red-50" };
  if (hours < 24) return { label: `Due in ${hours}h`, color: "text-gold-600", bg: "bg-gold-50" };
  const days = Math.floor(hours / 24);
  return { label: `Due in ${days}d`, color: "text-forest-600", bg: "bg-forest-50" };
}

export default function ReviewerDashboard() {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const unreadMessages = mockQAMessages.reduce((s, t) => s + t.messages.filter(m => !m.read).length, 0);
  const unreadNotifications = mockReviewerNotifications.filter(n => !n.read).length;
  const overdueReviews = mockReviewQueue.filter(r => r.status === "overdue").length;
  const pendingReviews = mockReviewQueue.filter(r => r.status === "submitted").length;
  const activeTasks = mockTaskMonitor.filter(t => t.status !== "accepted").length;

  const actionItems = [
    ...mockReviewQueue.filter(r => r.status === "overdue").map(r => ({
      id: r.id, type: "overdue", label: r.taskTitle,
      sub: "Review SLA breached", color: "red",
      href: "/enterprise/reviewer/review-queue",
    })),
    ...mockReviewQueue.filter(r => {
      const diff = new Date(r.slaDeadline).getTime() - Date.now();
      return diff > 0 && diff < 24 * 3600000;
    }).map(r => ({
      id: r.id, type: "due_today", label: r.taskTitle,
      sub: "Review due today", color: "gold",
      href: "/enterprise/reviewer/review-queue",
    })),
    ...mockTaskMonitor.filter(t => t.needsAttention && t.attentionReason === "Midpoint checkpoint pending").map(t => ({
      id: t.id, type: "midpoint", label: t.taskTitle,
      sub: "Midpoint checkpoint pending", color: "gold",
      href: "/enterprise/reviewer/task-monitor",
    })),
    ...mockQAMessages.filter(q => q.messages.some(m => !m.read)).map(q => ({
      id: q.id, type: "unread_qa", label: q.taskTitle,
      sub: `${q.messages.filter(m => !m.read).length} unread message(s)`, color: "teal",
      href: "/enterprise/reviewer/qa-inbox",
    })),
  ].slice(0, 7);

  const colorMap: Record<string, string> = {
    red: "bg-red-50 border-red-200 text-red-700",
    gold: "bg-gold-50 border-gold-200 text-gold-700",
    teal: "bg-teal-50 border-teal-200 text-teal-700",
  };

  const iconMap: Record<string, React.ReactNode> = {
    overdue: <AlertTriangle className="w-4 h-4 text-red-500" />,
    due_today: <Clock className="w-4 h-4 text-gold-500" />,
    midpoint: <Sparkles className="w-4 h-4 text-gold-500" />,
    unread_qa: <MessageSquare className="w-4 h-4 text-teal-500" />,
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                Reviewer
              </span>
            </div>
            <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">
              {greeting}, {mockReviewer.name.split(" ")[0]}.
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              You are assigned to <span className="font-semibold text-gray-700">{activeTasks} active tasks</span> across {mockReviewer.assignedProjects.length} projects.
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Auto-refreshes every 60 seconds · Last updated: {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {unreadNotifications > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-400" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadNotifications}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ SLA BREACH BANNER ═══ */}
      {overdueReviews > 0 && (
        <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-[12px] font-medium text-red-700 flex-1">
            You have <span className="font-bold">{overdueReviews} overdue review(s)</span>. Overdue reviews are escalated to GlimmoraTeam Admin.
          </p>
          <button onClick={() => router.push("/enterprise/reviewer/review-queue")}
            className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 shrink-0">
            View Overdue <ArrowRight className="w-3 h-3" />
          </button>
        </motion.div>
      )}

      {/* ═══ KPI TILES ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Pending Reviews", value: pendingReviews, icon: ListChecks, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600", href: "/enterprise/reviewer/review-queue" },
          { label: "Active Tasks", value: activeTasks, icon: ClipboardList, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600", href: "/enterprise/reviewer/task-monitor" },
          { label: "Unread Messages", value: unreadMessages, icon: Inbox, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600", href: "/enterprise/reviewer/qa-inbox" },
          { label: "SLA Compliance", value: `${mockMyMetrics.slaCompliance.current}%`, icon: TrendingUp, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600", href: "/enterprise/reviewer/my-metrics" },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={scaleIn}
              className="card-parchment flex items-center gap-4 px-5 py-5 cursor-pointer hover:shadow-md transition-all"
              onClick={() => router.push(kpi.href)}>
              <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0", kpi.iconBg)}>
                <KpiIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                <div className="num-display text-[26px] text-gray-900 leading-none mt-1">{kpi.value}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ MAIN GRID ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

        {/* ── Action Items ── */}
        <motion.div variants={fadeUp} className="lg:col-span-2 card-parchment">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Action Items</span>
            <span className="text-[10px] font-medium text-gray-400">{actionItems.length} requiring attention</span>
          </div>
          <div className="py-2">
            {actionItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-forest-400 mb-3" />
                <p className="text-[13px] font-semibold text-gray-700">All clear!</p>
                <p className="text-[11px] text-gray-400">No items require your attention right now.</p>
              </div>
            ) : (
              actionItems.map((item) => (
                <div key={item.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-black/[0.02] cursor-pointer transition-colors"
                  style={{ borderBottom: "1px solid var(--border-hair)" }}
                  onClick={() => router.push(item.href)}>
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border", colorMap[item.color])}>
                    {iconMap[item.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 truncate">{item.label}</p>
                    <p className="text-[11px] text-gray-400">{item.sub}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* ── SLA Performance ── */}
        <motion.div variants={fadeUp} className="card-parchment">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">SLA Performance</span>
          </div>
          <div className="px-5 py-4 space-y-4">
            {[
              { label: "SLA Compliance", value: mockMyMetrics.slaCompliance.current, target: mockMyMetrics.slaCompliance.target, color: "bg-forest-500" },
              { label: "Rec. Acceptance", value: mockMyMetrics.recommendationAcceptanceRate.current, target: mockMyMetrics.recommendationAcceptanceRate.target, color: "bg-teal-500" },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-gray-500">{metric.label}</span>
                  <span className={cn("text-[12px] font-bold font-mono", metric.value >= metric.target ? "text-forest-600" : "text-gold-600")}>
                    {metric.value}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", metric.color)} style={{ width: `${metric.value}%` }} />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Target: {metric.target}%</p>
              </div>
            ))}

            <div style={{ borderTop: "1px solid var(--border-hair)", paddingTop: 12 }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-gray-500">Avg Review Time</span>
                <span className="text-[12px] font-bold font-mono text-gray-700">{mockMyMetrics.averageReviewTimeHours.current}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500">Reviews This Month</span>
                <span className="text-[12px] font-bold font-mono text-gray-700">{mockMyMetrics.reviewsCompleted.thisMonth}</span>
              </div>
            </div>

            <button onClick={() => router.push("/enterprise/reviewer/my-metrics")}
              className="w-full text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center justify-center gap-1 pt-2">
              View My Metrics <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ═══ REVIEW QUEUE SUMMARY ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-8">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Review Queue</span>
          <button onClick={() => router.push("/enterprise/reviewer/review-queue")}
            className="text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {mockReviewQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-forest-400 mb-3" />
            <p className="text-[13px] font-semibold text-gray-700">Your review queue is clear.</p>
          </div>
        ) : (
          <div>
            {mockReviewQueue.slice(0, 5).map((item, i) => {
              const sla = formatTimeLeft(item.slaDeadline);
              return (
                <div key={item.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-black/[0.02] cursor-pointer transition-colors"
                  style={{ borderBottom: i < mockReviewQueue.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                  onClick={() => router.push("/enterprise/reviewer/review-queue")}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-gray-800 truncate">{item.taskTitle}</p>
                      {item.reworkRound > 1 && (
                        <span className="text-[9px] font-semibold text-brown-600 bg-brown-50 border border-brown-200 px-1.5 py-0.5 rounded-full">
                          Round {item.reworkRound}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{item.projectName} · {item.contributorId}</p>
                  </div>
                  <div className={cn("text-[10px] font-semibold px-2 py-1 rounded-lg", sla.bg, sla.color)}>
                    {sla.label}
                  </div>
                  <button className="text-[11px] font-semibold text-teal-600 border border-teal-200 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-all shrink-0">
                    Open Review
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ═══ ACTIVE TASK SIGNAL ═══ */}
      <motion.div variants={fadeUp} className="card-parchment">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Active Task Signal</span>
        </div>
        <div className="flex flex-wrap gap-2 px-5 py-4">
          {mockTaskMonitor.filter(t => t.status !== "accepted").map((task) => {
            const statusColors: Record<string, string> = {
              submitted: "bg-gold-50 text-gold-700 border-gold-200",
              in_progress: "bg-teal-50 text-teal-700 border-teal-200",
              rework: "bg-red-50 text-red-700 border-red-200",
              open: "bg-gray-100 text-gray-600 border-gray-200",
            };
            return (
              <button key={task.id}
                onClick={() => router.push("/enterprise/reviewer/task-monitor")}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all hover:shadow-sm", statusColors[task.status] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
                <span className="truncate max-w-[140px]">{task.taskTitle}</span>
                <span className="text-[9px] uppercase font-bold opacity-60">{task.status.replace("_", " ")}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

    </motion.div>
  );
}