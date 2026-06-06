// @ts-nocheck
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, TrendingDown, Clock, CheckCircle2,
  AlertTriangle, BarChart3, Download,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockMyMetrics, mockReviewHistory } from "@/mocks/data/enterprise-reviewer";

export default function MyMetricsPage() {
  const [dateRange, setDateRange] = React.useState("last30");

  const dateRanges = [
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "last30", label: "Last 30 Days" },
    { value: "last90", label: "Last 90 Days" },
    { value: "all", label: "All Time" },
  ];

  const metricTiles = [
    {
      label: "SLA Compliance",
      value: `${mockMyMetrics.slaCompliance.current}%`,
      previous: `${mockMyMetrics.slaCompliance.previous}%`,
      target: `${mockMyMetrics.slaCompliance.target}%`,
      trend: mockMyMetrics.slaCompliance.current >= mockMyMetrics.slaCompliance.previous ? "up" : "down",
      status: mockMyMetrics.slaCompliance.current >= mockMyMetrics.slaCompliance.target ? "good" : "warning",
      icon: CheckCircle2,
      iconBg: "bg-gradient-to-br from-forest-400 to-forest-600",
    },
    {
      label: "Rec. Acceptance Rate",
      value: `${mockMyMetrics.recommendationAcceptanceRate.current}%`,
      previous: `${mockMyMetrics.recommendationAcceptanceRate.previous}%`,
      target: `${mockMyMetrics.recommendationAcceptanceRate.target}%`,
      trend: mockMyMetrics.recommendationAcceptanceRate.current >= mockMyMetrics.recommendationAcceptanceRate.previous ? "up" : "down",
      status: mockMyMetrics.recommendationAcceptanceRate.current >= mockMyMetrics.recommendationAcceptanceRate.target ? "good" : "warning",
      icon: TrendingUp,
      iconBg: "bg-gradient-to-br from-teal-400 to-teal-600",
    },
    {
      label: "Avg Review Time",
      value: `${mockMyMetrics.averageReviewTimeHours.current}h`,
      previous: `${mockMyMetrics.averageReviewTimeHours.previous}h`,
      target: `<${mockMyMetrics.averageReviewTimeHours.target}h`,
      trend: mockMyMetrics.averageReviewTimeHours.current <= mockMyMetrics.averageReviewTimeHours.previous ? "up" : "down",
      status: mockMyMetrics.averageReviewTimeHours.current <= mockMyMetrics.averageReviewTimeHours.target ? "good" : "warning",
      icon: Clock,
      iconBg: "bg-gradient-to-br from-gold-400 to-gold-600",
    },
    {
      label: "Reviews Completed",
      value: mockMyMetrics.reviewsCompleted.thisMonth,
      previous: "This month",
      target: `${mockMyMetrics.reviewsCompleted.total} total`,
      trend: "up",
      status: "good",
      icon: BarChart3,
      iconBg: "bg-gradient-to-br from-brown-400 to-brown-600",
    },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">My Metrics</h1>
            <p className="text-[13px] text-gray-500 mt-1">Your review performance and quality indicators.</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all shrink-0">
            <Download className="w-3.5 h-3.5" /> Download Report
          </button>
        </div>
      </motion.div>

      {/* ═══ DATE RANGE ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center gap-1 overflow-x-auto" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          {dateRanges.map((r) => (
            <button key={r.value}
              onClick={() => setDateRange(r.value)}
              className={cn(
                "px-4 py-3 text-[11px] font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
                dateRange === r.value
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              )}>
              {r.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ METRIC TILES ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {metricTiles.map((metric) => {
          const MetricIcon = metric.icon;
          return (
            <motion.div key={metric.label} variants={scaleIn} className="card-parchment px-5 py-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", metric.iconBg)}>
                  <MetricIcon className="w-4 h-4 text-white" />
                </div>
                <span className="text-[11px] font-medium text-gray-400">{metric.label}</span>
              </div>
              <div className="flex items-end justify-between">
                <span className={cn("text-[28px] font-bold font-mono leading-none",
                  metric.status === "good" ? "text-gray-900" : "text-gold-600"
                )}>
                  {metric.value}
                </span>
                <div className="flex items-center gap-1">
                  {metric.trend === "up"
                    ? <TrendingUp className="w-3.5 h-3.5 text-forest-500" />
                    : <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                  }
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-400">Prev: {metric.previous}</span>
                <span className="text-[10px] text-gray-400">Target: {metric.target}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ OVERRIDE RATE ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <div className="card-parchment">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Override Rate</span>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-gray-600">You recommended Accept → Enterprise chose Rework</span>
                <span className="text-[13px] font-bold text-red-600">{mockMyMetrics.overrideRate.reviewerAcceptEnterpriseRework}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${mockMyMetrics.overrideRate.reviewerAcceptEnterpriseRework}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] text-gray-600">You recommended Rework → Enterprise chose Accept</span>
                <span className="text-[13px] font-bold text-gold-600">{mockMyMetrics.overrideRate.reviewerReworkEnterpriseAccept}%</span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div className="h-full rounded-full bg-gold-400 transition-all" style={{ width: `${mockMyMetrics.overrideRate.reviewerReworkEnterpriseAccept}%` }} />
              </div>
            </div>
            <p className="text-[11px] text-gray-400">High override rates may indicate misalignment with Enterprise Admin's expectations.</p>
          </div>
        </div>

        {/* ═══ RUBRIC SCORES ═══ */}
        <div className="card-parchment">
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
            <span className="text-sm font-semibold text-gray-800">Avg Rubric Score by Dimension</span>
          </div>
          <div className="px-5 py-4 space-y-3">
            {mockMyMetrics.rubricScoresByDimension.map((d) => (
              <div key={d.dimension}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] text-gray-600">{d.dimension}</span>
                  <span className="text-[12px] font-bold font-mono text-gray-700">{d.averageScore}/5</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all",
                    d.averageScore >= 4 ? "bg-forest-500" : d.averageScore >= 3 ? "bg-teal-500" : "bg-gold-500"
                  )} style={{ width: `${(d.averageScore / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ═══ REVIEW QUALITY TABLE ═══ */}
      <motion.div variants={fadeUp} className="card-parchment">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Review Quality Analysis</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-hair)" }}>
                {["Task", "Project", "Date", "Recommendation", "Outcome", "Agreement", "Round"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockReviewHistory.map((r, i) => (
                <tr key={r.id}
                  className="hover:bg-black/[0.02] transition-colors cursor-pointer"
                  style={{ borderBottom: i < mockReviewHistory.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                  <td className="px-4 py-3 text-[12px] font-medium text-gray-800 max-w-[160px] truncate">{r.taskTitle}</td>
                  <td className="px-4 py-3 text-[11px] text-gray-500 max-w-[120px] truncate">{r.projectName}</td>
                  <td className="px-4 py-3 text-[11px] text-gray-500 whitespace-nowrap">
                    {new Date(r.reviewedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      r.recommendation === "recommend_accept"
                        ? "bg-forest-50 text-forest-700 border-forest-200"
                        : "bg-gold-50 text-gold-700 border-gold-200"
                    )}>
                      {r.recommendation === "recommend_accept" ? "Accept" : "Rework"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      r.enterpriseOutcome === "accepted"
                        ? "bg-forest-50 text-forest-700 border-forest-200"
                        : "bg-gold-50 text-gold-700 border-gold-200"
                    )}>
                      {r.enterpriseOutcome === "accepted" ? "Accepted" : "Rework"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.agreement
                      ? <CheckCircle2 className="w-4 h-4 text-forest-500" />
                      : <AlertTriangle className="w-4 h-4 text-red-500" />
                    }
                  </td>
                  <td className="px-4 py-3 text-[11px] text-gray-500">Round {r.reworkRound}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

    </motion.div>
  );
}