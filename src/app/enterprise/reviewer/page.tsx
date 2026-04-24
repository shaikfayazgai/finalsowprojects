"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  AlertTriangle, Clock, MessageSquare, CheckCircle2,
  ArrowRight, ClipboardList, Inbox, ListChecks, TrendingUp,
  Sparkles, Bell,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockQAMessages, mockReviewerNotifications } from "@/mocks/data/enterprise-reviewer";
import { reviewerApi, type ReviewerAssignment, type ReviewerDashboardData } from "@/lib/api/reviewer";
import { ApiError } from "@/lib/api/client";

function formatTimeLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return { label: "OVERDUE", color: "text-red-600", bg: "bg-red-50" };
  const hours = Math.floor(diff / 3600000);
  if (hours < 4) return { label: `Due in ${hours}h`, color: "text-red-600", bg: "bg-red-50" };
  if (hours < 24) return { label: `Due in ${hours}h`, color: "text-gold-600", bg: "bg-gold-50" };
  const days = Math.floor(hours / 24);
  return { label: `Due in ${days}d`, color: "text-forest-600", bg: "bg-forest-50" };
}

function syntheticDeadline(assignedAt?: string | null): string {
  if (!assignedAt) return new Date(Date.now() + 72 * 3600000).toISOString();
  const t = new Date(assignedAt).getTime();
  return new Date(t + 72 * 3600000).toISOString();
}

export default function ReviewerDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string })?.accessToken;
  const displayName = session?.user?.name?.trim() || "Reviewer";
  const firstName = displayName.split(/\s+/)[0] || "Reviewer";

  const [lastRefresh, setLastRefresh] = React.useState(new Date());
  const [dash, setDash] = React.useState<ReviewerDashboardData | null>(null);
  const [assignments, setAssignments] = React.useState<ReviewerAssignment[]>([]);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    if (!token) return;
    setLoadError(null);
    try {
      const [d, a] = await Promise.all([reviewerApi.getDashboard(token), reviewerApi.listAssignments(token)]);
      setDash(d);
      setAssignments(a);
      setLastRefresh(new Date());
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Could not load reviewer data.";
      setLoadError(msg);
    }
  }, [token]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      void load();
    }, 60000);
    return () => clearInterval(interval);
  }, [load]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const unreadMessages = mockQAMessages.reduce((s, t) => s + t.messages.filter(m => !m.read).length, 0);
  const unreadNotifications = mockReviewerNotifications.filter(n => !n.read).length;

  const pendingReviews = dash?.pendingEvidenceReviews ?? assignments.filter((a) => a.status === "pending").length;
  const activeTasks = dash?.assignedTaskCount ?? assignments.filter((a) => a.status !== "completed").length;
  const overdueReviews = assignments.filter((a) => {
    if (a.status === "completed") return false;
    return new Date(syntheticDeadline(a.assignedAt)).getTime() < Date.now();
  }).length;

  const actionItems = [
    ...assignments.filter((a) => {
      if (a.status === "completed") return false;
      return new Date(syntheticDeadline(a.assignedAt)).getTime() < Date.now();
    }).map((r) => ({
      id: r.id,
      type: "overdue" as const,
      label: r.title,
      sub: "Review SLA window passed",
      color: "red" as const,
      href: "/enterprise/reviewer/review-queue",
    })),
    ...assignments.filter((a) => {
      if (a.status === "completed") return false;
      const diff = new Date(syntheticDeadline(a.assignedAt)).getTime() - Date.now();
      return diff > 0 && diff < 24 * 3600000;
    }).map((r) => ({
      id: r.id,
      type: "due_today" as const,
      label: r.title,
      sub: "Due within 24 hours",
      color: "gold" as const,
      href: "/enterprise/reviewer/review-queue",
    })),
    ...mockQAMessages.filter(q => q.messages.some(m => !m.read)).map(q => ({
      id: q.id,
      type: "unread_qa" as const,
      label: q.taskTitle,
      sub: `${q.messages.filter(m => !m.read).length} unread message(s)`,
      color: "teal" as const,
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

  const approvalPct = dash?.evidenceApprovalRatePercent ?? null;
  const completed30 = dash?.completedLast30Days ?? 0;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

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
              {greeting}, {firstName}.
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              You have <span className="font-semibold text-gray-700">{activeTasks} open assignment(s)</span>
              {assignments.length ? ` across your queue.` : " — assignments appear here when an administrator assigns work to you."}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Auto-refreshes every 60 seconds · Last updated: {lastRefresh.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>
            {loadError && (
              <p className="text-[12px] text-red-600 mt-2">{loadError}</p>
            )}
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

      {overdueReviews > 0 && (
        <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-[12px] font-medium text-red-700 flex-1">
            You have <span className="font-bold">{overdueReviews} assignment(s)</span> past the review window. Prioritize these in your queue.
          </p>
          <button type="button" onClick={() => router.push("/enterprise/reviewer/review-queue")}
            className="text-[11px] font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 shrink-0">
            View queue <ArrowRight className="w-3 h-3" />
          </button>
        </motion.div>
      )}

      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Pending reviews", value: pendingReviews, icon: ListChecks, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600", href: "/enterprise/reviewer/review-queue" },
          { label: "Open assignments", value: activeTasks, icon: ClipboardList, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600", href: "/enterprise/reviewer/review-queue" },
          { label: "Unread messages", value: unreadMessages, icon: Inbox, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600", href: "/enterprise/reviewer/qa-inbox" },
          { label: "Evidence approval rate", value: approvalPct == null ? "—" : `${approvalPct}%`, icon: TrendingUp, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600", href: "/enterprise/reviewer/my-metrics" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <motion.div variants={fadeUp} className="lg:col-span-2 card-parchment">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Action items</span>
            <span className="text-[10px] font-medium text-gray-400">{actionItems.length} visible</span>
          </div>
          <div className="py-2">
            {actionItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle2 className="w-8 h-8 text-forest-400 mb-3" />
                <p className="text-[13px] font-semibold text-gray-700">All clear</p>
                <p className="text-[11px] text-gray-400">No urgent items from your assignments right now.</p>
              </div>
            ) : (
              actionItems.map((item) => (
                <div key={`${item.type}-${item.id}`}
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

        <motion.div variants={fadeUp} className="card-parchment">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Last 30 days</span>
          </div>
          <div className="px-5 py-4 space-y-3 text-[12px] text-gray-600">
            <div className="flex justify-between"><span>Completed assignments</span><span className="font-mono font-semibold">{completed30}</span></div>
            <div className="flex justify-between"><span>Evidence accepts</span><span className="font-mono font-semibold">{dash?.evidenceRecommendationsAccept ?? "—"}</span></div>
            <div className="flex justify-between"><span>Evidence reworks</span><span className="font-mono font-semibold">{dash?.evidenceRecommendationsRework ?? "—"}</span></div>
            <button type="button" onClick={() => router.push("/enterprise/reviewer/my-metrics")}
              className="w-full text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center justify-center gap-1 pt-2">
              Open metrics <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      </div>

      <motion.div variants={fadeUp} className="card-parchment mb-8">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Review queue</span>
          <button type="button" onClick={() => router.push("/enterprise/reviewer/review-queue")}
            className="text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="w-8 h-8 text-forest-400 mb-3" />
            <p className="text-[13px] font-semibold text-gray-700">No assignments yet</p>
            <p className="text-[11px] text-gray-400 max-w-sm">When an enterprise administrator assigns you a project or evidence review, it will show up here.</p>
          </div>
        ) : (
          <div>
            {assignments.slice(0, 5).map((item, i) => {
              const sla = formatTimeLeft(syntheticDeadline(item.assignedAt));
              return (
                <div key={item.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-black/[0.02] cursor-pointer transition-colors"
                  style={{ borderBottom: i < Math.min(assignments.length, 5) - 1 ? "1px solid var(--border-hair)" : undefined }}
                  onClick={() => router.push(`/enterprise/reviewer/review-queue/${item.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-800 truncate">{item.title}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {item.taskKind?.replace("_", " ") ?? "task"} · {item.status}
                      {item.relatedId ? ` · ref ${item.relatedId}` : ""}
                    </p>
                  </div>
                  <div className={cn("text-[10px] font-semibold px-2 py-1 rounded-lg", sla.bg, sla.color)}>
                    {sla.label}
                  </div>
                  <span className="text-[11px] font-semibold text-teal-600 border border-teal-200 bg-teal-50 px-3 py-1.5 rounded-lg shrink-0">
                    Open
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.div variants={fadeUp} className="card-parchment">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Active assignments</span>
        </div>
        <div className="flex flex-wrap gap-2 px-5 py-4">
          {assignments.filter((t) => t.status !== "completed").length === 0 ? (
            <p className="text-[12px] text-gray-400">No active assignments.</p>
          ) : (
            assignments.filter((t) => t.status !== "completed").map((task) => {
              const statusColors: Record<string, string> = {
                pending: "bg-gold-50 text-gold-700 border-gold-200",
                in_progress: "bg-teal-50 text-teal-700 border-teal-200",
              };
              return (
                <button key={task.id} type="button"
                  onClick={() => router.push(`/enterprise/reviewer/review-queue/${task.id}`)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all hover:shadow-sm",
                    statusColors[task.status] ?? "bg-gray-100 text-gray-600 border-gray-200",
                  )}>
                  <span className="truncate max-w-[200px]">{task.title}</span>
                  <span className="text-[9px] uppercase font-bold opacity-60">{task.status.replace("_", " ")}</span>
                </button>
              );
            })
          )}
        </div>
      </motion.div>

    </motion.div>
  );
}
