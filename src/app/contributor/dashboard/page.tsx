"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ListChecks, Wallet, Award, TrendingUp, Clock, ArrowRight,
  Sparkles, CheckCircle2, AlertTriangle, Target, ChevronRight,
  BookOpen, Bell, FileText, RefreshCw, ShieldAlert, ShieldCheck,
  CalendarClock, UserCircle, X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockContributorProfile } from "@/mocks/data/contributor";

/* ═══ Inline mock data (until contributor mock file is ready) ═══ */

const activeTasks = [
  { id: "ct-001", title: "Build REST API endpoints for user service", project: "HealthTech Platform", status: "in_progress" as const, dueDate: "2026-03-28", progress: 65, matchScore: 94 },
  { id: "ct-002", title: "Implement authentication middleware", project: "FinTech Gateway", status: "in_progress" as const, dueDate: "2026-03-30", progress: 30, matchScore: 88 },
  { id: "ct-003", title: "Database schema migration scripts", project: "HealthTech Platform", status: "submitted" as const, dueDate: "2026-03-25", progress: 100, matchScore: 91 },
];

const recentEarnings = [
  { id: "e-001", task: "Frontend component library", amount: 450, currency: "USD", status: "paid" as const, date: "2026-03-15" },
  { id: "e-002", task: "API integration testing", amount: 320, currency: "USD", status: "eligible" as const, date: "2026-03-18" },
  { id: "e-003", task: "Data pipeline setup", amount: 680, currency: "USD", status: "pending" as const, date: "2026-03-20" },
];

const credentials = [
  { id: "cr-001", title: "React Development", skills: ["React", "TypeScript"], date: "2026-03-10" },
  { id: "cr-002", title: "API Architecture", skills: ["Node.js", "REST API"], date: "2026-02-28" },
  { id: "cr-003", title: "Database Design", skills: ["PostgreSQL", "Migration"], date: "2026-02-15" },
];

const skills = [
  { name: "React", proficiency: 85, validated: true },
  { name: "TypeScript", proficiency: 80, validated: true },
  { name: "Node.js", proficiency: 72, validated: false },
  { name: "Python", proficiency: 65, validated: false },
  { name: "PostgreSQL", proficiency: 60, validated: true },
];

const notifications = [
  { id: "n-001", title: "Task review complete", message: "Your API testing submission has been accepted", type: "review_complete", time: "2h ago", read: false },
  { id: "n-002", title: "New task match", message: "A React dashboard task matches your skills (92%)", type: "task_assigned", time: "5h ago", read: false },
  { id: "n-003", title: "Payout processed", message: "$450 has been sent to your account", type: "payment_received", time: "1d ago", read: true },
  { id: "n-004", title: "Task reassigned", message: "Task 'Build user settings page' has been reassigned to another contributor due to schedule conflict", type: "reassignment", time: "3h ago", read: false },
];

const taskStatusConfig: Record<string, { label: string; dot: string }> = {
  in_progress: { label: "In Progress", dot: "bg-teal-500" },
  submitted: { label: "Submitted", dot: "bg-gold-500" },
  in_review: { label: "In Review", dot: "bg-gold-500" },
  accepted: { label: "Accepted", dot: "bg-forest-500" },
  rework: { label: "Rework", dot: "bg-red-500" },
};

const earningStatusColor: Record<string, string> = {
  paid: "text-forest-600",
  eligible: "text-teal-600",
  pending: "text-gray-400",
  processing: "text-gold-600",
};

/* ═══ Helpers ═══ */
function getGreeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }

/* ═══ System Banner Config ═══ */
type BannerType = "critical" | "high" | "medium" | "info";
interface SystemBanner {
  id: string;
  priority: number;
  type: BannerType;
  icon: React.ElementType;
  message: string;
  cta: string;
  href: string;
}

const bannerStyles: Record<BannerType, { bg: string; border: string; text: string; iconColor: string }> = {
  critical: { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    iconColor: "text-red-500" },
  high:     { bg: "bg-gold-50",   border: "border-gold-200",   text: "text-gold-800",   iconColor: "text-gold-600" },
  medium:   { bg: "bg-teal-50",   border: "border-teal-200",   text: "text-teal-800",   iconColor: "text-teal-600" },
  info:     { bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-700",   iconColor: "text-gray-500" },
};

function buildBanners(): SystemBanner[] {
  const banners: SystemBanner[] = [];
  const profile = mockContributorProfile as { accountStatus: string; kycStatus: string; lastAvailabilityReviewedAt?: string; profileCompleteness: number };

  if (profile.accountStatus === "pending_assessment") {
    banners.push({ id: "assessment", priority: 0, type: "critical", icon: ShieldAlert, message: "Assessment Required — Complete your skills assessment to unlock task assignments.", cta: "Start Assessment", href: "/contributor/assessment" });
  }
  if (profile.kycStatus !== "verified") {
    banners.push({ id: "kyc", priority: 1, type: "high", icon: ShieldCheck, message: "KYC Verification Required — Verify your identity to receive payouts.", cta: "Verify Now", href: "/contributor/earnings/kyc" });
  }
  if (profile.lastAvailabilityReviewedAt) {
    const daysSince = Math.floor((Date.now() - new Date(profile.lastAvailabilityReviewedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince > 14) {
      banners.push({ id: "availability", priority: 2, type: "medium", icon: CalendarClock, message: `Review Your Availability — Last reviewed ${daysSince} days ago. Keep your schedule up to date.`, cta: "Update", href: "/contributor/profile" });
    }
  }
  if (profile.profileCompleteness < 100) {
    banners.push({ id: "profile", priority: 3, type: "info", icon: UserCircle, message: `Profile Incomplete — Your profile is ${profile.profileCompleteness}% complete. A complete profile improves task matching.`, cta: "Complete Profile", href: "/contributor/profile" });
  }

  return banners.sort((a, b) => a.priority - b.priority);
}

/* ═══ DASHBOARD ═══ */
export default function ContributorDashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name?.split(" ")[0] ?? "there";
  const greeting = getGreeting();
  const totalEarned = 2180;
  const pendingPayout = 680;

  /* ── Auto-refresh ── */
  const [lastRefreshed, setLastRefreshed] = React.useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = React.useState<number>(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  React.useEffect(() => {
    const refreshInterval = setInterval(() => {
      setIsRefreshing(true);
      setLastRefreshed(Date.now());
      setTimeout(() => setIsRefreshing(false), 800);
    }, 60_000);

    const tickInterval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastRefreshed) / 1000));
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(tickInterval);
    };
  }, [lastRefreshed]);

  /* ── System Banners ── */
  const allBanners = React.useMemo(() => buildBanners(), []);
  const [dismissedBanners, setDismissedBanners] = React.useState<Set<string>>(new Set());
  const visibleBanners = allBanners.filter((b) => !dismissedBanners.has(b.id));

  function dismissBanner(id: string) {
    setDismissedBanners((prev) => new Set(prev).add(id));
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
<<<<<<< Updated upstream
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
          {greeting}, {userName}
        </h1>
=======
      <motion.div variants={fadeUp} className="mb-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
            {greeting}, Arjun
          </h1>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400" role="status" aria-live="polite" aria-label="Dashboard refresh status">
            <RefreshCw className={cn("w-3 h-3 transition-transform", isRefreshing && "animate-spin text-teal-500")} aria-hidden="true" />
            <span>{isRefreshing ? "Refreshing..." : secondsAgo === 0 ? "Just now" : `Updated ${secondsAgo}s ago`}</span>
          </div>
        </div>
>>>>>>> Stashed changes
        <p className="text-[13px] text-gray-400 mt-1">
          {activeTasks.length} active tasks · {notifications.filter(n => !n.read).length} new notifications
        </p>
      </motion.div>

      {/* ═══ SYSTEM BANNERS ═══ */}
      <AnimatePresence>
        {visibleBanners.length > 0 && (
          <motion.div variants={fadeUp} className="flex flex-col gap-2 mb-6">
            {visibleBanners.map((banner) => {
              const style = bannerStyles[banner.type];
              const BannerIcon = banner.icon;
              return (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  role="alert"
                  className={cn("rounded-xl border px-4 py-3 flex items-center gap-3", style.bg, style.border)}
                >
                  <BannerIcon className={cn("w-4.5 h-4.5 shrink-0", style.iconColor)} aria-hidden="true" />
                  <span className={cn("text-[12px] flex-1", style.text)}>{banner.message}</span>
                  <Link href={banner.href}
                    aria-label={banner.cta}
                    className={cn("text-[11px] font-semibold whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors focus:ring-2 focus:ring-teal-500 focus:outline-none",
                      banner.type === "critical" ? "bg-red-600 text-white hover:bg-red-700"
                      : banner.type === "high" ? "bg-gold-600 text-white hover:bg-gold-700"
                      : banner.type === "medium" ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "bg-gray-600 text-white hover:bg-gray-700"
                    )}>
                    {banner.cta}
                  </Link>
                  <button onClick={() => dismissBanner(banner.id)}
                    aria-label={`Dismiss ${banner.type} banner`}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors shrink-0 focus:ring-2 focus:ring-teal-500 focus:outline-none">
                    <X className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active Tasks", value: activeTasks.length, icon: ListChecks, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600", sub: "1 due this week" },
          { label: "Total Earned", value: `$${totalEarned.toLocaleString()}`, icon: Wallet, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600", sub: `$${pendingPayout} pending` },
          { label: "Credentials", value: credentials.length, icon: Award, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600", sub: "3 skills validated" },
          { label: "Skill Score", value: "78%", icon: Target, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600", sub: "+12% this month" },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.iconBg)}>
                <KpiIcon className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>
                <div className="text-[10px] text-gray-400 mt-1">{kpi.sub}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ ACTIVE TASKS + NOTIFICATIONS ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
        {/* Active Tasks — 3 cols */}
        <div className="lg:col-span-3 card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Active Tasks</span>
            <Link href="/contributor/tasks" aria-label="View all tasks" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1 focus:ring-2 focus:ring-teal-500 focus:outline-none rounded">
              All tasks <ArrowRight className="w-3 h-3" aria-hidden="true" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {activeTasks.length === 0 && (
              <div className="px-5 py-8 text-center">
                <ListChecks className="w-5 h-5 text-gray-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-[12px] text-gray-400">No active tasks. New matches will appear here.</p>
              </div>
            )}
            {activeTasks.map((task) => {
              const ts = taskStatusConfig[task.status];
              return (
                <Link key={task.id} href={`/contributor/tasks/${task.id}`}>
                  <div className="group flex items-center gap-3 px-5 py-3.5 hover:bg-black/[0.02] transition-colors">
                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", ts.dot)} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-700 truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                        <span>{task.project}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden="true" /> Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                    </div>
                    {task.status !== "submitted" && (
                      <div className="hidden sm:flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-teal-500" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-gray-400">{task.progress}%</span>
                      </div>
                    )}
                    <span className="text-[9px] font-medium text-gray-400 uppercase shrink-0">{ts.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Notifications — 2 cols */}
        <div className="lg:col-span-2 card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Notifications</span>
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="text-[10px] font-semibold text-brown-700 bg-brown-50 w-5 h-5 rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 && (
              <div className="px-5 py-8 text-center">
                <Bell className="w-5 h-5 text-gray-300 mx-auto mb-2" aria-hidden="true" />
                <p className="text-[12px] text-gray-400">No new notifications.</p>
              </div>
            )}
            {notifications.map((n) => (
              <div key={n.id} className={cn("px-5 py-3", !n.read && "bg-brown-50/30")}>
                <div className="flex items-start gap-2.5">
                  <Bell className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", n.read ? "text-gray-300" : "text-brown-500")} aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-[12px] font-medium", n.read ? "text-gray-500" : "text-gray-800")}>{n.title}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5 truncate">{n.message}</div>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">{n.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══ SKILLS + EARNINGS + CREDENTIALS ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
        {/* Skills */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Skills</span>
            <Link href="/contributor/profile" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
              Profile <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="py-2">
            {skills.map((skill, i) => (
              <div key={skill.name} className="flex items-center gap-3 px-5 py-2.5"
                style={{ borderBottom: i < skills.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-medium text-gray-700">{skill.name}</span>
                    {skill.validated && <><CheckCircle2 className="w-3 h-3 text-forest-500" aria-hidden="true" /><span className="sr-only">Validated</span></>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className={cn("h-full rounded-full", skill.validated ? "bg-forest-500" : "bg-brown-400")} style={{ width: `${skill.proficiency}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 w-7 text-right">{skill.proficiency}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Earnings */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Recent Earnings</span>
            <Link href="/contributor/earnings" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="py-2">
            {recentEarnings.map((e, i) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3"
                style={{ borderBottom: i < recentEarnings.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-gray-700 truncate">{e.task}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                </div>
                <span className={cn("text-[14px] font-semibold", earningStatusColor[e.status])}>${e.amount} <span className="text-[9px] font-medium uppercase">{e.status}</span></span>
              </div>
            ))}
          </div>
        </div>

        {/* Credentials */}
        <div className="card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Credentials</span>
            <Link href="/contributor/credentials" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
              All <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="py-2">
            {credentials.map((c, i) => (
              <Link key={c.id} href={`/contributor/credentials/${c.id}`}>
                <div className="group flex items-center gap-3 px-5 py-3 hover:bg-black/[0.02] transition-colors"
                  style={{ borderBottom: i < credentials.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                  <Award className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-gray-700">{c.title}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {c.skills.map(s => (
                        <span key={s} className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">{new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 shrink-0" aria-hidden="true" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══ LEARNING RECOMMENDATIONS ═══ */}
      <motion.div variants={fadeUp} className="card-parchment">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-800">Recommended for You</span>
            <Sparkles className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
          </div>
          <Link href="/contributor/learning" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
            All recommendations <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            { title: "Build GraphQL API layer", skills: ["GraphQL", "Node.js"], hours: 24, match: "Based on your API skills" },
            { title: "Docker containerization basics", skills: ["Docker", "DevOps"], hours: 16, match: "Trending skill in your area" },
            { title: "Learn testing with Jest", skills: ["Jest", "QA"], hours: 12, match: "Complements your React expertise" },
          ].map((rec, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <BookOpen className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-700">{rec.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {rec.skills.map(s => (
                    <span key={s} className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{s}</span>
                  ))}
                  <span className="text-[10px] text-gray-400">{rec.hours}h</span>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 hidden sm:block">{rec.match}</span>
            </div>
          ))}
        </div>
      </motion.div>

    </motion.div>
  );
}
