"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Target,
  Gauge,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Activity,
  Zap,
  BarChart3,
  TrendingUp,
  Shield,
  DollarSign,
  FileText,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { MetricRing } from "@/components/enterprise/metric-ring";

/* ══════════════════════════════════════════
   I1 — Workforce Dashboard
   Skills heatmap, capacity metrics, performance overview
   ══════════════════════════════════════════ */

/* ── Inline Mock Data ── */
const kpis = [
  { label: "Active Contributors", value: "47", change: "+8", positive: true, icon: Users, bg: "bg-brown-50", iconColor: "text-brown-600" },
  { label: "Avg Match Score", value: "91%", change: "+2.4%", positive: true, icon: Target, bg: "bg-teal-50", iconColor: "text-teal-600" },
  { label: "Skills Coverage", value: "86%", change: "+5.1%", positive: true, icon: Layers, bg: "bg-forest-50", iconColor: "text-forest-600" },
  { label: "Capacity Utilization", value: "82%", change: "-1.3%", positive: false, icon: Gauge, bg: "bg-gold-50", iconColor: "text-gold-600" },
];

const skillHeatmapData = [
  { skill: "React / Next.js", demand: 92, availability: 88, gap: 4 },
  { skill: "Node.js / NestJS", demand: 85, availability: 78, gap: 7 },
  { skill: "PostgreSQL", demand: 78, availability: 82, gap: -4 },
  { skill: "TypeScript", demand: 95, availability: 91, gap: 4 },
  { skill: "DevOps / CI-CD", demand: 68, availability: 55, gap: 13 },
  { skill: "Security / Auth", demand: 62, availability: 48, gap: 14 },
  { skill: "Mobile / RN", demand: 54, availability: 60, gap: -6 },
  { skill: "QA / Testing", demand: 72, availability: 65, gap: 7 },
  { skill: "UI / UX Design", demand: 58, availability: 52, gap: 6 },
  { skill: "Data / Analytics", demand: 45, availability: 38, gap: 7 },
  { skill: "Finance Domain", demand: 40, availability: 35, gap: 5 },
  { skill: "HR Domain", demand: 32, availability: 30, gap: 2 },
];

const capacityData = [
  { label: "Full-Time", available: 28, total: 32, color: "#4D5741" },
  { label: "Part-Time", available: 11, total: 15, color: "#5B9BA2" },
  { label: "Limited", available: 3, total: 8, color: "#D0B060" },
];

const performanceMetrics = [
  { label: "Acceptance Rate", value: 92, color: "forest" as const, trend: "+3.5%" },
  { label: "Avg Rating", value: 4.7, max: 5, color: "gold" as const, trend: "+0.2" },
  { label: "Rework Rate", value: 12, color: "brown" as const, trend: "-3.2%" },
  { label: "On-Time Delivery", value: 87, color: "teal" as const, trend: "+4.2%" },
];

/* ── Heatmap Cell Color ── */
function heatColor(value: number): string {
  if (value >= 90) return "bg-brown-600";
  if (value >= 75) return "bg-brown-400";
  if (value >= 60) return "bg-brown-300";
  if (value >= 40) return "bg-beige-300";
  return "bg-beige-200";
}

function gapBadge(gap: number) {
  if (gap > 10) return { text: `+${gap}`, cls: "bg-gold-100 text-gold-700" };
  if (gap > 0) return { text: `+${gap}`, cls: "bg-beige-100 text-beige-600" };
  return { text: `${gap}`, cls: "bg-forest-50 text-forest-700" };
}

/* ── Nav Card ── */
function NavCard({
  href,
  icon,
  title,
  description,
  gradient,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <Link href={href}>
      <div className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
        <div className="flex items-center justify-between mb-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
              gradient
            )}
          >
            {icon}
          </div>
          <ChevronRight className="w-4 h-4 text-beige-300 group-hover:text-brown-400 group-hover:translate-x-0.5 transition-all" />
        </div>
        <h3 className="text-[14px] font-semibold text-brown-800 mb-1">
          {title}
        </h3>
        <p className="text-[11px] text-beige-500 leading-relaxed">
          {description}
        </p>
      </div>
    </Link>
  );
}

/* ══════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════ */
export default function WorkforceDashboardPage() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Page header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
          Workforce Dashboard
        </h1>
        <p className="text-[13px] text-beige-500 mt-1">
          Skills heatmap, contributor capacity, and performance overview across all active projects.
        </p>
      </motion.div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              variants={fadeUp}
              className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", kpi.bg)}>
                  <Icon className={cn("w-4 h-4", kpi.iconColor)} />
                </div>
                <div className="flex items-center gap-1">
                  {kpi.positive ? (
                    <ArrowUpRight className="w-3 h-3 text-forest-500" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-gold-600" />
                  )}
                  <span
                    className={cn(
                      "text-[10px] font-semibold",
                      kpi.positive ? "text-forest-600" : "text-gold-600"
                    )}
                  >
                    {kpi.change}
                  </span>
                </div>
              </div>
              <p className="text-[24px] font-bold text-brown-900 tracking-tight">
                {kpi.value}
              </p>
              <p className="text-[11px] text-beige-500 mt-0.5">{kpi.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ── Skills Heatmap ── */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-[14px] font-semibold text-brown-800">
              Skills Heatmap
            </h2>
            <p className="text-[11px] text-beige-500 mt-0.5">
              Demand vs availability — darker cells indicate higher intensity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2.5 rounded-sm bg-brown-600" />
              <span className="text-[10px] text-beige-500">High (90+)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2.5 rounded-sm bg-brown-300" />
              <span className="text-[10px] text-beige-500">Mid (60-89)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2.5 rounded-sm bg-beige-200" />
              <span className="text-[10px] text-beige-500">Low (&lt;40)</span>
            </div>
          </div>
        </div>

        {/* Heatmap Header */}
        <div className="grid grid-cols-[180px_1fr_1fr_80px] gap-2 px-2 py-2 text-[10px] font-semibold text-beige-500 uppercase tracking-wider border-b border-beige-100">
          <div>Skill</div>
          <div className="text-center">Demand</div>
          <div className="text-center">Availability</div>
          <div className="text-center">Gap</div>
        </div>

        {/* Heatmap Rows */}
        <div className="divide-y divide-beige-50">
          {skillHeatmapData.map((row, i) => {
            const gb = gapBadge(row.gap);
            return (
              <div
                key={row.skill}
                className="grid grid-cols-[180px_1fr_1fr_80px] gap-2 px-2 py-2.5 items-center hover:bg-beige-50/40 transition-colors"
              >
                <span className="text-[12px] font-medium text-brown-700">
                  {row.skill}
                </span>

                {/* Demand bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-beige-100/60 rounded-lg overflow-hidden relative">
                    <div
                      className={cn("h-full rounded-lg transition-all", heatColor(row.demand))}
                      style={{ width: `${row.demand}%`, opacity: 0.8 }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brown-800 mix-blend-multiply">
                      {row.demand}%
                    </span>
                  </div>
                </div>

                {/* Availability bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-6 bg-beige-100/60 rounded-lg overflow-hidden relative">
                    <div
                      className={cn("h-full rounded-lg transition-all", heatColor(row.availability))}
                      style={{ width: `${row.availability}%`, opacity: 0.65 }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brown-800 mix-blend-multiply">
                      {row.availability}%
                    </span>
                  </div>
                </div>

                {/* Gap badge */}
                <div className="flex items-center justify-center">
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", gb.cls)}>
                    {gb.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Capacity + Performance Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contributor Capacity Chart */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
        >
          <h3 className="text-[14px] font-semibold text-brown-800 mb-1">
            Contributor Capacity
          </h3>
          <p className="text-[11px] text-beige-500 mb-4">
            Available vs total slots by availability type
          </p>

          <div className="space-y-5">
            {capacityData.map((seg) => {
              const pct = Math.round((seg.available / seg.total) * 100);
              return (
                <div key={seg.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-sm"
                        style={{ backgroundColor: seg.color, opacity: 0.8 }}
                      />
                      <span className="text-[12px] font-medium text-brown-700">
                        {seg.label}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-brown-800">
                      {seg.available} / {seg.total}
                    </span>
                  </div>
                  <div className="relative h-7 bg-beige-100/60 rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg transition-all"
                      style={{ width: `${pct}%`, backgroundColor: seg.color, opacity: 0.7 }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-[10px] font-bold text-white drop-shadow-sm">
                        {pct}% utilized
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-3 border-t border-beige-100/60 flex items-center justify-between">
            <span className="text-[11px] text-beige-500">
              Total capacity
            </span>
            <span className="text-[13px] font-bold text-brown-800">
              42 / 55 contributors available
            </span>
          </div>
        </motion.div>

        {/* Performance Overview */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
        >
          <h3 className="text-[14px] font-semibold text-brown-800 mb-1">
            Performance Overview
          </h3>
          <p className="text-[11px] text-beige-500 mb-4">
            Key quality and delivery metrics across the workforce
          </p>

          <div className="grid grid-cols-2 gap-4">
            {performanceMetrics.map((pm) => (
              <div
                key={pm.label}
                className="flex flex-col items-center gap-2 p-4 rounded-xl bg-beige-50/50 border border-beige-100/50"
              >
                <MetricRing
                  value={pm.value}
                  max={pm.max ?? 100}
                  size={72}
                  strokeWidth={5}
                  color={pm.color}
                />
                <span className="text-[11px] font-semibold text-brown-700 text-center">
                  {pm.label}
                </span>
                <div className="flex items-center gap-1">
                  {pm.trend.startsWith("-") ? (
                    <ArrowDownRight className="w-3 h-3 text-forest-500" />
                  ) : (
                    <ArrowUpRight className="w-3 h-3 text-forest-500" />
                  )}
                  <span className="text-[10px] font-medium text-forest-600">
                    {pm.trend}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Quick Navigation: Explore Other Dashboards ── */}
      <motion.div variants={fadeUp}>
        <h2 className="text-[14px] font-semibold text-brown-800 mb-3">
          Explore Analytics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <NavCard
            href="/enterprise/analytics/cost"
            icon={<DollarSign className="w-5 h-5 text-white" />}
            title="Economic Dashboard"
            description="Budget vs actual, cost trends, and forecasts."
            gradient="from-gold-400 to-gold-600"
          />
          <NavCard
            href="/enterprise/analytics/quality"
            icon={<Shield className="w-5 h-5 text-white" />}
            title="Governance & Risk"
            description="Incidents, fraud flags, and APG overrides."
            gradient="from-teal-400 to-teal-600"
          />
          <NavCard
            href="/enterprise/analytics/reports"
            icon={<FileText className="w-5 h-5 text-white" />}
            title="Self-service Analytics"
            description="Build custom reports with drill-down and export."
            gradient="from-brown-500 to-teal-500"
          />
          <NavCard
            href="/enterprise/audit"
            icon={<Activity className="w-5 h-5 text-white" />}
            title="Audit Log"
            description="Complete timeline of all actions and events."
            gradient="from-forest-500 to-forest-600"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
