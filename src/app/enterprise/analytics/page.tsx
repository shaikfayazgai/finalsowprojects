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
  Filter,
  Heart,
  GraduationCap,
  Globe2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { Badge } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";

/* ══════════════════════════════════════════
   I1 — Workforce Dashboard
   SOW: Section 3.1.6, 19.4, 27.3
   Skills heatmap, capacity, performance, engagement, diversity
   ══════════════════════════════════════════ */

/* ── Filter Options ── */
const segmentOptions = ["All Segments", "Students", "Women Workforce", "Freelancers", "Internal"];
const regionOptions = ["All Regions", "South Asia", "Southeast Asia", "Middle East", "Africa", "Global"];
const dateRangeOptions = ["Last 7 days", "Last 30 days", "This Quarter", "This Year"];

/* ── Inline Mock Data ── */
const kpis = [
  { label: "Active Contributors", value: "47", change: "+8", positive: true, icon: Users, bg: "bg-brown-50", iconColor: "text-brown-600" },
  { label: "Engagement Level", value: "74%", change: "+3.8%", positive: true, icon: Heart, bg: "bg-teal-50", iconColor: "text-teal-600" },
  { label: "Skills Coverage", value: "86%", change: "+5.1%", positive: true, icon: Layers, bg: "bg-forest-50", iconColor: "text-forest-600" },
  { label: "Capacity Utilization", value: "82%", change: "-1.3%", positive: false, icon: Gauge, bg: "bg-gold-50", iconColor: "text-gold-600" },
];

/* ── SOW 27.3 Secondary Metrics ── */
const secondaryMetrics = [
  { label: "Skill Development Progress", value: "68%", description: "Contributors advancing proficiency this quarter", icon: GraduationCap, color: "text-teal-600", bg: "bg-teal-50" },
  { label: "Diversity Index", value: "0.82", description: "Shannon diversity across segments and geography", icon: Globe2, color: "text-forest-600", bg: "bg-forest-50" },
  { label: "Inclusion Participation", value: "91%", description: "Women & student contributors actively engaged", icon: Heart, color: "text-brown-600", bg: "bg-brown-50" },
];

const skillHeatmapData = [
  { skill: "React / Next.js", demand: 92, availability: 88, gap: 4, proficiency: { beginner: 8, intermediate: 42, advanced: 50 } },
  { skill: "Node.js / NestJS", demand: 85, availability: 78, gap: 7, proficiency: { beginner: 15, intermediate: 45, advanced: 40 } },
  { skill: "PostgreSQL", demand: 78, availability: 82, gap: -4, proficiency: { beginner: 12, intermediate: 48, advanced: 40 } },
  { skill: "TypeScript", demand: 95, availability: 91, gap: 4, proficiency: { beginner: 5, intermediate: 35, advanced: 60 } },
  { skill: "DevOps / CI-CD", demand: 68, availability: 55, gap: 13, proficiency: { beginner: 25, intermediate: 45, advanced: 30 } },
  { skill: "Security / Auth", demand: 62, availability: 48, gap: 14, proficiency: { beginner: 30, intermediate: 40, advanced: 30 } },
  { skill: "Mobile / RN", demand: 54, availability: 60, gap: -6, proficiency: { beginner: 18, intermediate: 47, advanced: 35 } },
  { skill: "QA / Testing", demand: 72, availability: 65, gap: 7, proficiency: { beginner: 20, intermediate: 50, advanced: 30 } },
  { skill: "UI / UX Design", demand: 58, availability: 52, gap: 6, proficiency: { beginner: 22, intermediate: 43, advanced: 35 } },
  { skill: "Data / Analytics", demand: 45, availability: 38, gap: 7, proficiency: { beginner: 28, intermediate: 42, advanced: 30 } },
  { skill: "Finance Domain", demand: 40, availability: 35, gap: 5, proficiency: { beginner: 35, intermediate: 40, advanced: 25 } },
  { skill: "HR Domain", demand: 32, availability: 30, gap: 2, proficiency: { beginner: 32, intermediate: 43, advanced: 25 } },
];

const capacityData = [
  { label: "Full-Time", utilized: 28, total: 32, color: "#4D5741" },
  { label: "Part-Time", utilized: 12, total: 15, color: "#5B9BA2" },
  { label: "Limited", utilized: 5, total: 8, color: "#D0B060" },
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
  const [segment, setSegment] = React.useState("All Segments");
  const [region, setRegion] = React.useState("All Regions");
  const [dateRange, setDateRange] = React.useState("This Quarter");

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* ── Page Header + Export ── */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
            Workforce Dashboard
          </h1>
          <p className="text-[13px] text-beige-500 mt-1">
            Skills heatmap, contributor capacity, and performance overview across all active projects.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => toast.info("CSV export would be generated for the current workforce view.")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-beige-600 bg-white/70 border border-beige-200/60 hover:border-beige-300 hover:text-brown-700 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={() => toast.info("PDF report would be generated for the current workforce view.")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white bg-brown-500 hover:bg-brown-600 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </motion.div>

      {/* ── Filter Bar (SOW: filter by segment/region) ── */}
      <motion.div
        variants={fadeUp}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-beige-200/50 bg-white/60 backdrop-blur-sm px-4 py-3"
      >
        <Filter className="w-3.5 h-3.5 text-beige-400" />
        <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider mr-1">Filters</span>

        {/* Segment */}
        <select
          value={segment}
          onChange={(e) => setSegment(e.target.value)}
          className="h-7 rounded-lg border border-beige-200/60 bg-white/80 px-2.5 text-[11px] text-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-200/40 focus:border-brown-200"
        >
          {segmentOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Region */}
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          className="h-7 rounded-lg border border-beige-200/60 bg-white/80 px-2.5 text-[11px] text-brown-700 focus:outline-none focus:ring-2 focus:ring-brown-200/40 focus:border-brown-200"
        >
          {regionOptions.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* Date Range Quick Picks */}
        <div className="flex items-center gap-1 ml-auto">
          {dateRangeOptions.map((dr) => (
            <button
              key={dr}
              onClick={() => setDateRange(dr)}
              className={cn(
                "px-2.5 py-1 rounded-md text-[10px] font-medium transition-all",
                dateRange === dr
                  ? "bg-brown-500 text-white"
                  : "text-beige-500 hover:text-brown-700 hover:bg-beige-100/60"
              )}
            >
              {dr}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
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

      {/* ── SOW 27.3: Secondary Metrics (Skill Development, Diversity, Inclusion) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {secondaryMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={m.label}
              variants={fadeUp}
              className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 flex items-start gap-3"
            >
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", m.bg)}>
                <Icon className={cn("w-4 h-4", m.color)} />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-[18px] font-bold text-brown-900">{m.value}</span>
                  <span className="text-[11px] font-semibold text-brown-700 truncate">{m.label}</span>
                </div>
                <p className="text-[10px] text-beige-500 mt-0.5 leading-relaxed">{m.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Skills Heatmap (with proficiency breakdown) ── */}
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
              Demand vs availability with proficiency distribution — darker cells indicate higher intensity
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
        <div className="grid grid-cols-[150px_1fr_1fr_70px_minmax(140px,1fr)] gap-2 px-2 py-2 text-[10px] font-semibold text-beige-500 uppercase tracking-wider border-b border-beige-100">
          <div>Skill</div>
          <div className="text-center">Demand</div>
          <div className="text-center">Availability</div>
          <div className="text-center">Gap</div>
          <div className="text-center">Proficiency</div>
        </div>

        {/* Heatmap Rows */}
        <div className="divide-y divide-beige-50">
          {skillHeatmapData.map((row) => {
            const gb = gapBadge(row.gap);
            return (
              <div
                key={row.skill}
                className="grid grid-cols-[150px_1fr_1fr_70px_minmax(140px,1fr)] gap-2 px-2 py-2.5 items-center hover:bg-beige-50/40 transition-colors"
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

                {/* Proficiency distribution bar */}
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-5 rounded-md overflow-hidden flex">
                    <div
                      className="h-full bg-beige-300"
                      style={{ width: `${row.proficiency.beginner}%` }}
                      title={`Beginner: ${row.proficiency.beginner}%`}
                    />
                    <div
                      className="h-full bg-brown-300"
                      style={{ width: `${row.proficiency.intermediate}%` }}
                      title={`Intermediate: ${row.proficiency.intermediate}%`}
                    />
                    <div
                      className="h-full bg-brown-600"
                      style={{ width: `${row.proficiency.advanced}%` }}
                      title={`Advanced: ${row.proficiency.advanced}%`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Proficiency legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-beige-100/60 justify-end">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2.5 rounded-sm bg-beige-300" />
            <span className="text-[10px] text-beige-500">Beginner</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2.5 rounded-sm bg-brown-300" />
            <span className="text-[10px] text-beige-500">Intermediate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-2.5 rounded-sm bg-brown-600" />
            <span className="text-[10px] text-beige-500">Advanced</span>
          </div>
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
            Utilized vs total contributors by availability tier
          </p>

          <div className="space-y-5">
            {capacityData.map((seg) => {
              const pct = Math.round((seg.utilized / seg.total) * 100);
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
                      {seg.utilized} / {seg.total}
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
              45 / 55 contributors assigned
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
            href="/enterprise/analytics/economic"
            icon={<DollarSign className="w-5 h-5 text-white" />}
            title="Economic Dashboard"
            description="Budget vs actual, cost trends, and forecasts."
            gradient="from-gold-400 to-gold-600"
          />
          <NavCard
            href="/enterprise/analytics/governance"
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
