// @ts-nocheck
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Bell, CheckCircle2, AlertTriangle, MessageSquare,
  Clock, ArrowRight, Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockReviewerNotifications } from "@/mocks/data/enterprise-reviewer";

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

const priorityConfig: Record<string, { color: string; dot: string }> = {
  high: { color: "border-l-red-400", dot: "bg-red-400" },
  medium: { color: "border-l-gold-400", dot: "bg-gold-400" },
  low: { color: "border-l-gray-300", dot: "bg-gray-300" },
};

const typeConfig: Record<string, { icon: React.ReactNode; bg: string }> = {
  submission_received: { icon: <CheckCircle2 className="w-4 h-4 text-teal-500" />, bg: "bg-teal-50" },
  sla_warning: { icon: <Clock className="w-4 h-4 text-red-500" />, bg: "bg-red-50" },
  midpoint_checkpoint: { icon: <AlertTriangle className="w-4 h-4 text-gold-500" />, bg: "bg-gold-50" },
  override: { icon: <AlertTriangle className="w-4 h-4 text-red-500" />, bg: "bg-red-50" },
  new_message: { icon: <MessageSquare className="w-4 h-4 text-teal-500" />, bg: "bg-teal-50" },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(mockReviewerNotifications);
  const [filter, setFilter] = React.useState("all");

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filters = [
    { value: "all", label: "All" },
    { value: "unread", label: `Unread (${unreadCount})` },
    { value: "high", label: "High Priority" },
    { value: "medium", label: "Medium Priority" },
  ];

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.read;
    if (filter === "high") return n.priority === "high";
    if (filter === "medium") return n.priority === "medium";
    return true;
  });

  const hrefMap: Record<string, string> = {
    submission_received: "/enterprise/reviewer/review-queue",
    sla_warning: "/enterprise/reviewer/review-queue",
    midpoint_checkpoint: "/enterprise/reviewer/task-monitor",
    override: "/enterprise/reviewer/review-history",
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="text-[11px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <p className="text-[13px] text-gray-500 mt-1">All platform events requiring your attention.</p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all shrink-0">
              <Check className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
      </motion.div>

      {/* ═══ FILTERS ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center gap-1 overflow-x-auto" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          {filters.map((f) => (
            <button key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-4 py-3 text-[11px] font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
                filter === f.value
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ NOTIFICATION LIST ═══ */}
      <motion.div variants={fadeUp} className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card-parchment flex flex-col items-center justify-center py-16 text-center">
            <Bell className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-[13px] font-semibold text-gray-600">No notifications.</p>
            <p className="text-[11px] text-gray-400">You're all caught up!</p>
          </div>
        ) : (
          filtered.map((notif) => {
            const priority = priorityConfig[notif.priority] ?? priorityConfig.low;
            const type = typeConfig[notif.type] ?? { icon: <Bell className="w-4 h-4 text-gray-400" />, bg: "bg-gray-50" };
            const href = hrefMap[notif.type] ?? "/enterprise/reviewer";

            return (
              <div key={notif.id}
                className={cn(
                  "card-parchment flex items-start gap-4 px-5 py-4 cursor-pointer transition-all border-l-4 hover:shadow-sm",
                  priority.color,
                  !notif.read && "bg-teal-50/20"
                )}
                onClick={() => { markRead(notif.id); router.push(href); }}>

                {/* Icon */}
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", type.bg)}>
                  {type.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={cn("text-[13px] font-medium", notif.read ? "text-gray-600" : "text-gray-900")}>
                      {notif.title}
                    </p>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                </div>

                {/* Priority + Arrow */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", priority.dot)} />
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                </div>
              </div>
            );
          })
        )}
      </motion.div>

    </motion.div>
  );
}