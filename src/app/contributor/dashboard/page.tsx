"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  ListChecks, Wallet, Award, TrendingUp, Clock, ArrowRight,
  Sparkles, CheckCircle2, AlertTriangle, Target, ChevronRight,
  BookOpen, Bell, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ContributorDashboardSkeleton } from "./components/dashboard-skeleton";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";

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

/* ═══ DASHBOARD ═══ */
export default function ContributorDashboardPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) return <ContributorDashboardSkeleton />;

  const greeting = getGreeting();
  const firstName = (session?.user?.name ?? "").split(" ")[0] || "there";
  const totalEarned = 2180;
  const pendingPayout = 680;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
          {greeting}, {firstName}
        </h1>
        <p className="text-[13px] text-gray-400 mt-1">
          {activeTasks.length} active tasks · {notifications.filter(n => !n.read).length} new notifications
        </p>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
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
                <KpiIcon className="w-5 h-5 text-white" />
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
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        {/* Active Tasks — 3 cols */}
        <div className="lg:col-span-3 card-parchment">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Active Tasks</span>
            <Link href="/contributor/tasks" className="text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1">
              All tasks <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {activeTasks.map((task) => {
              const ts = taskStatusConfig[task.status];
              return (
                <Link key={task.id} href={`/contributor/tasks/${task.id}`}>
                  <div className="group flex items-center gap-3 px-5 py-3.5 hover:bg-black/[0.02] transition-colors">
                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", ts.dot)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-700 truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                        <span>{task.project}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
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
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
            {notifications.map((n) => (
              <div key={n.id} className={cn("px-5 py-3", !n.read && "bg-brown-50/30")}>
                <div className="flex items-start gap-2.5">
                  <Bell className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", n.read ? "text-gray-300" : "text-brown-500")} />
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
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
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
                    {skill.validated && <CheckCircle2 className="w-3 h-3 text-forest-500" />}
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
                <span className={cn("text-[14px] font-semibold", earningStatusColor[e.status])}>${e.amount}</span>
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
                  <Award className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-gray-700">{c.title}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {c.skills.map(s => (
                        <span key={s} className="text-[9px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400">{new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <ChevronRight className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 shrink-0" />
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
            <Sparkles className="w-3.5 h-3.5 text-gray-400" />
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
              <BookOpen className="w-4 h-4 text-gray-400 shrink-0" />
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
