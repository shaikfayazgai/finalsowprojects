"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Target,
  Clock,
  RotateCcw,
  TrendingUp,
  Activity,
  ShieldCheck,
  Star,
  Flame,
  Zap,
  BarChart3,
  FileText,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockDigitalTwin, mockContributorProfile } from "@/mocks/data/contributor";

/* ═══ Helpers ═══ */

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

/* ═══ Circular Progress ═══ */

function CircularProgress({
  value,
  size = 160,
  strokeWidth = 10,
  color,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--color-gray-100)"
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

/* ═══ Trend Badge ═══ */

function TrendBadge({ rate }: { rate: number }) {
  const trend = rate >= 80 ? "Improving" : rate >= 60 ? "Stable" : "Declining";
  const variant =
    rate >= 80
      ? { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" }
      : rate >= 60
        ? { bg: "bg-gold-50", text: "text-gold-700", dot: "bg-gold-500" }
        : { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wide uppercase px-3 py-1 rounded-full",
        variant.bg,
        variant.text
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", variant.dot)} />
      {trend}
    </span>
  );
}

/* ═══ Monthly Activity Chart ═══ */

function MonthlyActivityChart() {
  const data = mockDigitalTwin.monthlyActivity;
  const maxTasks = Math.max(...data.map((m) => m.tasksCompleted), 1);

  if (data.length === 0) {
    return (
      <div className="px-5 py-8 text-center">
        <p className="text-[12px] text-gray-400">No activity data yet</p>
      </div>
    );
  }

  return (
    <div className="px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
          Monthly Activity
        </span>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-forest-500" />
          <span className="text-[11px] font-semibold text-forest-600">
            {data[data.length - 1]?.tasksCompleted} tasks this month
          </span>
        </div>
      </div>
      <div className="flex items-end gap-4 h-32">
        {data.map((m) => {
          const heightPct = maxTasks > 0 ? (m.tasksCompleted / maxTasks) * 100 : 0;
          const monthLabel = new Date(m.month + "-01").toLocaleDateString("en-US", {
            month: "short",
          });
          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-[9px] font-semibold text-gray-500">
                {m.tasksCompleted} tasks
              </span>
              <div className="w-full relative" style={{ height: "80px" }}>
                <div
                  className={cn(
                    "absolute bottom-0 w-full rounded-t-md transition-all duration-500",
                    m.tasksCompleted >= 5
                      ? "bg-gradient-to-t from-brown-500 to-brown-400"
                      : m.tasksCompleted >= 3
                        ? "bg-gradient-to-t from-teal-500 to-teal-400"
                        : "bg-gradient-to-t from-gold-400 to-gold-300"
                  )}
                  style={{ height: `${Math.max(heightPct, 8)}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-400 font-medium">{monthLabel}</span>
              <span className="text-[9px] font-semibold text-gray-500">
                {formatCurrency(m.earned)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ═══ PAGE ═══ */

export default function DigitalTwinPage() {
  const twin = mockDigitalTwin;
  const profile = mockContributorProfile;

  /* Health color */
  const healthColor =
    twin.acceptanceRate >= 80
      ? "var(--color-forest-500)"
      : twin.acceptanceRate >= 60
        ? "var(--color-gold-500)"
        : "var(--color-brown-500)";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">
          Digital Twin
        </h1>
        <p className="text-[13px] text-gray-400 mt-1">
          Your AI-computed performance profile based on delivery data
        </p>
        <p className="text-[11px] text-gray-400 mt-1">
          Last updated {formatDate(twin.updatedAt)}
        </p>
      </motion.div>

      {/* ═══ TWIN HEALTH SCORE ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="px-5 py-6 flex flex-col items-center">
          <div className="relative">
            <CircularProgress value={twin.acceptanceRate} size={160} strokeWidth={10} color={healthColor} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="num-display text-[36px] text-gray-900 leading-none font-semibold">
                {twin.acceptanceRate}%
              </span>
              <span className="text-[11px] font-medium text-gray-400 mt-1">Twin Health</span>
            </div>
          </div>
          <div className="mt-4">
            <TrendBadge rate={twin.acceptanceRate} />
          </div>
        </div>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          {
            label: "Tasks Completed",
            value: twin.tasksCompleted,
            icon: CheckCircle2,
            iconBg: "bg-gradient-to-br from-forest-400 to-forest-600",
            sub: `${twin.totalSubmissions} submissions`,
          },
          {
            label: "Acceptance Rate",
            value: `${twin.acceptanceRate}%`,
            icon: Target,
            iconBg: "bg-gradient-to-br from-teal-400 to-teal-600",
            sub: `${twin.averageReviewScore} avg score`,
          },
          {
            label: "On-Time Delivery",
            value: `${twin.onTimeDelivery}%`,
            icon: Clock,
            iconBg: "bg-gradient-to-br from-brown-400 to-brown-600",
            sub: `${twin.slaCompliance}% SLA`,
          },
          {
            label: "Rework Rate",
            value: `${twin.reworkRate}%`,
            icon: RotateCcw,
            iconBg: "bg-gradient-to-br from-gold-400 to-gold-600",
            sub: `${twin.totalHoursLogged}h logged`,
          },
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

      {/* ═══ VERIFIED SKILLS + RELIABILITY TRENDS ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
        {/* Verified Skills — 3 cols */}
        <div className="lg:col-span-3 card-parchment">
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-soft)" }}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Verified Skills</span>
              <span className="text-[10px] font-semibold text-brown-700 bg-brown-50 w-5 h-5 rounded-full flex items-center justify-center">
                {twin.topSkills.length}
              </span>
            </div>
          </div>
          {/* Column header */}
          <div
            className="hidden lg:grid items-center px-5 py-2.5"
            style={{
              gridTemplateColumns: "1fr 100px 90px 120px",
              borderBottom: "1px solid var(--border-soft)",
              background: "color-mix(in srgb, var(--color-gray-100) 40%, white)",
              fontSize: 10,
              color: "var(--color-gray-400)",
              fontWeight: 500,
              textTransform: "uppercase" as const,
              letterSpacing: "0.08em",
            }}
          >
            <span>Skill</span>
            <span>Tasks</span>
            <span>Avg Score</span>
            <span>Proficiency</span>
          </div>
          {twin.topSkills.length === 0 ? (
            <div className="px-5 py-8 text-center"><p className="text-[12px] text-gray-400">No verified skills yet</p></div>
          ) : (
          <div className="py-1">
            {twin.topSkills.map((s, i) => {
              /* Proficiency as percentage of 5.0 score */
              const profPct = Math.round((s.avgScore / 5) * 100);
              return (
                <div
                  key={s.skill}
                  className="flex lg:grid items-center gap-3 px-5 py-3.5"
                  style={{
                    gridTemplateColumns: "1fr 100px 90px 120px",
                    borderBottom:
                      i < twin.topSkills.length - 1 ? "1px solid var(--border-hair)" : undefined,
                  }}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                    <span className="text-[13px] font-medium text-gray-800">{s.skill}</span>
                  </div>
                  <div className="hidden lg:block">
                    <span className="text-[13px] font-semibold text-gray-700 num-display">
                      {s.tasksCompleted}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-1">completed</span>
                  </div>
                  <div className="hidden lg:flex items-center gap-1.5">
                    <Star className="w-3 h-3 text-gold-500" />
                    <span className="text-[13px] font-semibold text-gray-700 num-display">
                      {s.avgScore}
                    </span>
                  </div>
                  <div className="hidden lg:flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-forest-500 transition-all duration-700"
                        style={{ width: `${profPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-gray-400 w-7 text-right">
                      {profPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>

        {/* Reliability Trends — 2 cols */}
        <div className="lg:col-span-2 card-parchment">
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-soft)" }}
          >
            <span className="text-sm font-semibold text-gray-800">Reliability Trends</span>
          </div>
          <MonthlyActivityChart />
        </div>
      </motion.div>

      {/* ═══ ACTIVITY SUMMARY + AI INSIGHTS ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Activity Summary */}
        <div className="card-parchment">
          <div
            className="px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-soft)" }}
          >
            <span className="text-sm font-semibold text-gray-800">Activity Summary</span>
          </div>
          <div className="py-1">
            {[
              { label: "Total Submissions", value: twin.totalSubmissions, icon: FileText },
              { label: "Acceptance Rate", value: `${twin.acceptanceRate}%`, icon: Target },
              { label: "SLA Compliance", value: `${twin.slaCompliance}%`, icon: ShieldCheck },
              { label: "Avg Review Score", value: twin.averageReviewScore.toFixed(2), icon: Star },
              { label: "Avg Hours / Task", value: `${twin.averageHoursPerTask}h`, icon: Clock },
              { label: "Current Streak", value: `${twin.streakDays} days`, icon: Flame },
              { label: "Longest Streak", value: `${twin.longestStreak} days`, icon: Zap },
            ].map((row, i, arr) => {
              const RowIcon = row.icon;
              return (
                <div
                  key={row.label}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{
                    borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined,
                  }}
                >
                  <RowIcon className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-[12px] font-semibold text-gray-600 flex-1">{row.label}</span>
                  <span className="text-[14px] font-semibold text-gray-900 num-display">{row.value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights */}
        <div className="card-parchment">
          <div
            className="flex items-center gap-2 px-5 py-4"
            style={{ borderBottom: "1px solid var(--border-soft)" }}
          >
            <span className="text-sm font-semibold text-gray-800">AI Insights</span>
            <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 w-5 h-5 rounded-full flex items-center justify-center">
              {twin.aiInsights.length}
            </span>
          </div>
          {twin.aiInsights.length === 0 ? (
            <div className="px-5 py-8 text-center"><p className="text-[12px] text-gray-400">No insights yet</p></div>
          ) : (
          <div className="py-1">
            {twin.aiInsights.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-5 py-3"
                style={{
                  borderBottom:
                    i < twin.aiInsights.length - 1 ? "1px solid var(--border-hair)" : undefined,
                }}
              >
                <TrendingUp className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[12px] font-semibold text-gray-600 leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
