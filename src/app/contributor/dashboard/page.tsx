"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListChecks, Wallet, Award, ArrowRight,
  Sparkles, Target, ChevronRight,
  BookOpen, Bell, TrendingUp, TrendingDown,
  Minus, AlertTriangle, X, ExternalLink,
  Clock, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ContributorDashboardSkeleton } from "./components/dashboard-skeleton";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  fetchContributorDashboard,
  fetchContributorNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type ContributorDashboardResponse,
  type DashboardNotification,
  type SystemBanner,
  type ActionItem,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";

// ── KPI icon map ──────────────────────────────────────────────────────────────

const KPI_ICON_MAP: Record<string, React.ElementType> = {
  active_tasks: ListChecks,
  total_earned: Wallet,
  credentials: Award,
  skill_score: Target,
};
const KPI_ICON_BG_MAP: Record<string, string> = {
  active_tasks: "bg-gradient-to-br from-teal-400 to-teal-600",
  total_earned: "bg-gradient-to-br from-brown-400 to-brown-600",
  credentials: "bg-gradient-to-br from-gold-400 to-gold-600",
  skill_score: "bg-gradient-to-br from-forest-400 to-forest-600",
};
const KPI_ICON_FALLBACK_BG = [
  "bg-gradient-to-br from-teal-400 to-teal-600",
  "bg-gradient-to-br from-brown-400 to-brown-600",
  "bg-gradient-to-br from-gold-400 to-gold-600",
  "bg-gradient-to-br from-forest-400 to-forest-600",
];
const KPI_ICONS_FALLBACK = [ListChecks, Wallet, Award, Target];

// ── Banner colour map ─────────────────────────────────────────────────────────

const BANNER_STYLES: Record<string, { wrapper: string; icon: string; title: string; body: string; cta: string }> = {
  amber: {
    wrapper: "bg-amber-50 border border-amber-200",
    icon: "text-amber-500",
    title: "text-amber-900",
    body: "text-amber-700",
    cta: "text-amber-800 underline hover:text-amber-900",
  },
  red: {
    wrapper: "bg-red-50 border border-red-200",
    icon: "text-red-500",
    title: "text-red-900",
    body: "text-red-700",
    cta: "text-red-800 underline hover:text-red-900",
  },
  green: {
    wrapper: "bg-forest-50 border border-forest-200",
    icon: "text-forest-500",
    title: "text-forest-900",
    body: "text-forest-700",
    cta: "text-forest-800 underline hover:text-forest-900",
  },
  blue: {
    wrapper: "bg-teal-50 border border-teal-200",
    icon: "text-teal-500",
    title: "text-teal-900",
    body: "text-teal-700",
    cta: "text-teal-800 underline hover:text-teal-900",
  },
};
const BANNER_DEFAULT_STYLE = BANNER_STYLES.amber;

// ── Urgency styles for action items ───────────────────────────────────────────

const URGENCY_DOT: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-gold-500",
  low: "bg-gray-400",
};

// ── Task status config ────────────────────────────────────────────────────────

const TASK_STATUS_DOT: Record<string, string> = {
  in_progress: "bg-teal-500",
  submitted: "bg-gold-500",
  in_review: "bg-gold-500",
  accepted: "bg-forest-500",
  rework: "bg-red-500",
};
const TASK_STATUS_LABEL: Record<string, string> = {
  in_progress: "In Progress",
  submitted: "Submitted",
  in_review: "In Review",
  accepted: "Accepted",
  rework: "Rework",
};

// ── Skill level colour ────────────────────────────────────────────────────────

const SKILL_LEVEL_COLOUR: Record<string, string> = {
  beginner: "bg-gray-200 text-gray-600",
  intermediate: "bg-teal-100 text-teal-700",
  advanced: "bg-forest-100 text-forest-700",
  expert: "bg-gold-100 text-gold-800",
};

// ── Credential status colour ──────────────────────────────────────────────────

const CREDENTIAL_STATUS_COLOUR: Record<string, string> = {
  active: "text-forest-600",
  expired: "text-red-500",
  pending: "text-gold-600",
  revoked: "text-gray-400",
};

// ── Small helpers ─────────────────────────────────────────────────────────────

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-5 py-8 text-center">
      <p className="text-[12px] text-gray-400">{message}</p>
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-forest-500" />;
  if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

// Map a notification to the page the user should land on when they click it.
function notificationHref(n: DashboardNotification): string {
  const type = (n.type ?? "").toLowerCase();
  const text = `${n.title ?? ""} ${n.body ?? ""}`.toLowerCase();
  if (type.includes("earning") || type.includes("payout") || text.includes("payout") || text.includes("earning")) {
    return "/contributor/earnings";
  }
  if (type.includes("submission") || text.includes("submission") || text.includes("submitted")) {
    return "/contributor/tasks/submissions";
  }
  if (type.includes("credential") || text.includes("credential")) {
    return "/contributor/credentials";
  }
  if (type.includes("message") || type.includes("chat")) {
    return "/contributor/messages";
  }
  // Default for task_assigned / rework_requested / generic task notifications
  return "/contributor/tasks";
}

// ── Banner component ──────────────────────────────────────────────────────────

function SystemBannerCard({
  banner,
  onDismiss,
}: {
  banner: SystemBanner;
  onDismiss: (id: string) => void;
}) {
  const styles = BANNER_STYLES[banner.variant] ?? BANNER_DEFAULT_STYLE;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn("flex items-start gap-3 rounded-xl px-4 py-3", styles.wrapper)}
    >
      <AlertTriangle className={cn("w-4 h-4 mt-0.5 shrink-0", styles.icon)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] font-semibold", styles.title)}>{banner.title}</p>
        {banner.body && (
          <p className={cn("text-[12px] mt-0.5", styles.body)}>{banner.body}</p>
        )}
        {banner.cta_label && banner.cta_href && (
          <Link href={banner.cta_href} className={cn("text-[12px] font-medium mt-1 inline-flex items-center gap-1", styles.cta)}>
            {banner.cta_label} <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
      {banner.dismissible && (
        <button
          onClick={() => onDismiss(banner.id)}
          className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}

// ── Action item component ─────────────────────────────────────────────────────

function ActionItemCard({ item }: { item: ActionItem }) {
  const dotColor = URGENCY_DOT[item.urgency] ?? "bg-gray-400";
  return (
    <div className="flex items-start gap-3 px-5 py-3.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
      <span className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", dotColor)} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-gray-800 truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">{item.subtitle}</p>
        )}
      </div>
      {item.cta_label && item.cta_href && (
        <Link
          href={item.cta_href}
          className="shrink-0 text-[11px] font-semibold text-brown-700 bg-brown-50 hover:bg-brown-100 px-2.5 py-1 rounded-lg transition-colors"
        >
          {item.cta_label}
        </Link>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ContributorDashboardPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [data, setData] = React.useState<ContributorDashboardResponse | null>(null);
  const [notifications, setNotifications] = React.useState<DashboardNotification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dismissedBanners, setDismissedBanners] = React.useState<Set<string>>(new Set());

  const accessToken = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  React.useEffect(() => {
    // Wait until NextAuth has resolved the session
    if (sessionStatus === "loading") return;

    const token = (session?.user as { accessToken?: string } | undefined)?.accessToken || "sso-contributor-fallback-token";

    setIsLoading(true);
    const sk = sessionKeyFragment(token);
    let live = true;
    void dedupeAsync(`contrib:dashboard-bundle:${sk}`, () =>
      Promise.all([
        fetchContributorDashboard(token),
        fetchContributorNotifications(token),
      ] as const),
    )
      .then(([dashboardRes, notificationsRes]) => {
        if (!live) return;
        setData(dashboardRes);
        setNotifications(notificationsRes.items);
        setError(null);
      })
      .catch((err: Error) => {
        if (!live) return;
        setError(err.message ?? "Failed to load dashboard");
      })
      .finally(() => {
        if (live) setIsLoading(false);
      });
    return () => {
      live = false;
    };
  }, [session, sessionStatus]);

  const dismissBanner = React.useCallback((id: string) => {
    setDismissedBanners((prev) => new Set([...prev, id]));
  }, []);

  const markAsRead = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
    if (!token) return;
    markNotificationRead(token, id).catch(() => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: false } : n)),
      );
    });
  }, [session]);

  const [markingAllRead, setMarkingAllRead] = React.useState(false);

  const markAllRead = React.useCallback(async () => {
    const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;
    if (!token || markingAllRead) return;

    // Snapshot current state so we can revert on failure
    const snapshot = notifications.map((n) => ({ ...n }));

    // Optimistically mark everything read
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setMarkingAllRead(true);

    try {
      await markAllNotificationsRead(token);
    } catch {
      setNotifications(snapshot);
    } finally {
      setMarkingAllRead(false);
    }
  }, [session, markingAllRead, notifications]);

  if (isLoading) return <ContributorDashboardSkeleton />;

  if (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[contributor dashboard] load failed:", error);
    }
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400" />
        <p className="text-[15px] font-semibold text-gray-700">We couldn&apos;t load your dashboard</p>
        <p className="text-[13px] text-gray-400 max-w-sm">
          Something went wrong on our end. Please check your connection and try again in a moment.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 text-[13px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 px-5 py-2 rounded-xl hover:from-brown-500 hover:to-brown-700 transition-all"
        >
          Try again
        </button>
      </div>
    );
  }

  // Derived values
  const greetingName = data?.greeting_name ?? (session?.user?.name ?? "").split(" ")[0] ?? "there";
  const activeTasks = data?.active_tasks ?? [];
  const skills = data?.skills ?? [];
  const recentEarnings = data?.recent_earnings ?? [];
  const credentials = data?.credentials ?? [];
  const recommendations = data?.recommended_learning ?? [];
  const kpis = data?.kpis ?? [];
  const actionItems = data?.action_items ?? [];
  const visibleBanners = (data?.system_banners ?? []).filter((b) => !dismissedBanners.has(b.id));
  const unreadCount = notifications.filter((n) => !n.read).length;
  const earnings = data?.earnings_snapshot;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ SYSTEM BANNERS ═══ */}
      <AnimatePresence mode="popLayout">
        {visibleBanners.length > 0 && (
          <motion.div variants={fadeUp} className="flex flex-col gap-2 mb-6">
            {visibleBanners.map((banner) => (
              <SystemBannerCard key={banner.id} banner={banner} onDismiss={dismissBanner} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
          {greetingName}
        </h1>
        <p className="text-[13px] text-gray-400 mt-1">
          {activeTasks.length} active {activeTasks.length === 1 ? "task" : "tasks"} · {unreadCount} new {unreadCount === 1 ? "notification" : "notifications"}
        </p>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {kpis.length > 0
          ? kpis.map((kpi, idx) => {
              const KpiIcon = KPI_ICON_MAP[kpi.key] ?? KPI_ICONS_FALLBACK[idx % KPI_ICONS_FALLBACK.length];
              const iconBg = KPI_ICON_BG_MAP[kpi.key] ?? KPI_ICON_FALLBACK_BG[idx % KPI_ICON_FALLBACK_BG.length];
              return (
                <motion.div key={kpi.key} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", iconBg)}>
                    <KpiIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                    <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendIcon trend={kpi.trend} />
                    </div>
                  </div>
                </motion.div>
              );
            })
          : /* Fallback static KPI tiles when API returns none */
            [
              { label: "Active Tasks", value: activeTasks.length.toString(), icon: ListChecks, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
              { label: "Total Earned", value: earnings ? `${earnings.currency}${earnings.total_paid_all_time.toLocaleString()}` : "—", icon: Wallet, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
              { label: "Credentials", value: credentials.length.toString(), icon: Award, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
              { label: "Pending Payout", value: earnings ? `${earnings.currency}${earnings.pending_payout.toLocaleString()}` : "—", icon: Target, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
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

      {/* ═══ ACTION ITEMS (if any) ═══ */}
      {actionItems.length > 0 && (
        <motion.div variants={fadeUp} className="card-parchment mb-6">
          <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-gray-800">Action Required</span>
            <span className="text-[10px] font-semibold text-white bg-red-500 w-5 h-5 rounded-full flex items-center justify-center ml-auto">
              {actionItems.length}
            </span>
          </div>
          <div>
            {actionItems.map((item) => (
              <ActionItemCard key={item.id} item={item} />
            ))}
          </div>
        </motion.div>
      )}

      {/* ═══ ACTIVE TASKS + NOTIFICATIONS ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        {/* Active Tasks — 3 cols */}
        <div className="lg:col-span-3 card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Active Tasks</span>
            <Link href="/contributor/tasks" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
              All tasks <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {activeTasks.length === 0 ? (
            <EmptyState message="No active tasks yet" />
          ) : (
            <div className="divide-y divide-gray-100">
              {activeTasks.map((task) => {
                const dotColor = TASK_STATUS_DOT[task.status] ?? "bg-gray-400";
                const statusLabel = TASK_STATUS_LABEL[task.status] ?? task.status;
                const href = task.workroom_path || `/contributor/tasks/${task.id}`;
                return (
                  <Link key={task.id} href={href}>
                    <div className="group flex items-center gap-3 px-5 py-3.5 hover:bg-black/[0.02] transition-colors">
                      <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", dotColor)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-gray-700 truncate">{task.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                          <span className="truncate max-w-[120px]">{task.project_title}</span>
                          {task.milestone_title && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                              <span className="truncate max-w-[100px]">{task.milestone_title}</span>
                            </>
                          )}
                          {task.due_relative && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                              <span className="flex items-center gap-0.5 shrink-0">
                                <Clock className="w-2.5 h-2.5" />
                                {task.due_relative}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {task.priority && (
                        <span className={cn(
                          "hidden sm:block text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded shrink-0",
                          task.priority === "high" ? "bg-red-50 text-red-600"
                            : task.priority === "medium" ? "bg-amber-50 text-amber-700"
                            : "bg-gray-50 text-gray-500"
                        )}>
                          {task.priority}
                        </span>
                      )}
                      <span className="text-[9px] font-medium text-gray-400 uppercase shrink-0">{statusLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications — 2 cols */}
        <div className="lg:col-span-2 card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-semibold text-brown-700 bg-brown-50 w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAllRead || !accessToken}
                className="text-[11px] font-medium text-gray-400 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {markingAllRead ? "Marking…" : "Mark all read"}
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <EmptyState message="You're all caught up" />
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((n) => {
                const href = notificationHref(n);
                return (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => { if (!n.read) markAsRead(n.id); }}
                    className={cn(
                      "block px-5 py-3 transition-colors hover:bg-gray-50",
                      !n.read && "bg-brown-50/30 hover:bg-brown-50/60",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Bell className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", n.read ? "text-gray-300" : "text-brown-500")} />
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-[12px] font-medium", n.read ? "text-gray-500" : "text-gray-800")}>{n.title}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5 truncate">{n.body}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="text-[10px] text-gray-400">{formatDate(n.created_at)}</span>
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brown-500" />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ SKILLS + EARNINGS + CREDENTIALS ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Skills */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Skills</span>
            <Link href="/contributor/profile" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
              Profile <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {skills.length === 0 ? (
            <EmptyState message="No skills added yet" />
          ) : (
            <div className="py-2">
              {skills.map((skill, i) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between gap-3 px-5 py-2.5"
                  style={{ borderBottom: i < skills.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                >
                  <span className="text-[12px] font-medium text-gray-700 truncate">{skill.name}</span>
                  <span className={cn(
                    "text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full shrink-0",
                    SKILL_LEVEL_COLOUR[skill.level.toLowerCase()] ?? "bg-gray-100 text-gray-600"
                  )}>
                    {skill.level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Earnings */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Recent Earnings</span>
            <Link href="/contributor/earnings" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {/* Earnings snapshot strip */}
          {earnings && (
            <div className="flex items-center justify-around px-4 py-3 bg-gray-50/60" style={{ borderBottom: "1px solid var(--border-hair)" }}>
              <div className="text-center">
                <div className="text-[10px] text-gray-400">This month</div>
                <div className="text-[14px] font-semibold text-gray-800">{earnings.currency}{earnings.earned_this_month.toLocaleString()}</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-[10px] text-gray-400">Pending</div>
                <div className="text-[14px] font-semibold text-gold-700">{earnings.currency}{earnings.pending_payout.toLocaleString()}</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-[10px] text-gray-400">All time</div>
                <div className="text-[14px] font-semibold text-forest-700">{earnings.currency}{earnings.total_paid_all_time.toLocaleString()}</div>
              </div>
            </div>
          )}
          {recentEarnings.length === 0 ? (
            <EmptyState message="No earnings yet" />
          ) : (
            <div className="py-2">
              {recentEarnings.map((e, i) => (
                <div
                  key={e.id}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: i < recentEarnings.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-gray-700 truncate">{e.label}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{formatDate(e.earned_at)}</div>
                  </div>
                  <span className="text-[14px] font-semibold text-forest-600">{e.currency}{e.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credentials */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Credentials</span>
            <Link href="/contributor/credentials" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {credentials.length === 0 ? (
            <EmptyState message="No credentials earned yet" />
          ) : (
            <div className="py-2">
              {credentials.map((c, i) => (
                <Link key={c.id} href={`/contributor/credentials/${c.id}`}>
                  <div
                    className="group flex items-center gap-3 px-5 py-3 hover:bg-black/[0.02] transition-colors"
                    style={{ borderBottom: i < credentials.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                  >
                    <Award className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-gray-700 truncate">{c.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400 truncate">{c.issuer}</span>
                        {c.expires_at && (
                          <span className="text-[9px] text-gray-400 shrink-0">· exp {formatDate(c.expires_at)}</span>
                        )}
                      </div>
                    </div>
                    <span className={cn(
                      "text-[9px] font-semibold uppercase shrink-0",
                      CREDENTIAL_STATUS_COLOUR[c.status.toLowerCase()] ?? "text-gray-400"
                    )}>
                      {c.status}
                    </span>
                    <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ LEARNING RECOMMENDATIONS ═══ */}
      <motion.div variants={fadeUp} className="card-parchment">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">Recommended for You</span>
            <Sparkles className="w-3.5 h-3.5 text-gray-400" />
          </div>
          <Link href="/contributor/learning" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
            All recommendations <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recommendations.length === 0 ? (
          <EmptyState message="Recommendations will appear as you build your profile" />
        ) : (
          <div className="divide-y divide-gray-100">
            {recommendations.map((rec) => (
              <Link key={rec.id} href={rec.url} target="_blank" rel="noopener noreferrer">
                <div className="group flex items-center gap-3 px-5 py-3 hover:bg-black/[0.02] transition-colors">
                  <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{rec.title}</div>
                    {rec.reason && (
                      <div className="text-[11px] text-gray-400 mt-0.5 truncate">{rec.reason}</div>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-[10px] text-gray-400">{rec.duration_minutes} min</div>
                    <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-500 mt-0.5 ml-auto transition-colors" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
}
