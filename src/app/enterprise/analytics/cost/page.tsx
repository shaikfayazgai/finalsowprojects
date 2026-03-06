"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Receipt,
  TrendingUp,
  Target,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";

/* ══════════════════════════════════════════
   I2 — Economic Dashboard
   Budget vs actual, cost trends, forecasts
   ══════════════════════════════════════════ */

/* ── Inline Mock Data ── */
const kpis = [
  { label: "Total Budget", value: "$1.08M", raw: 1080000, change: "+$95k", positive: true, icon: Wallet, bg: "bg-brown-50", iconColor: "text-brown-500" },
  { label: "Total Spent", value: "$650.7k", raw: 650700, change: "+$50.7k", positive: false, icon: Receipt, bg: "bg-teal-50", iconColor: "text-teal-500" },
  { label: "Budget Variance", value: "+39.7%", raw: 39.7, change: "+2.1%", positive: true, icon: TrendingUp, bg: "bg-forest-50", iconColor: "text-forest-500" },
  { label: "Forecasted Cost", value: "$927k", raw: 927000, change: "93% conf.", positive: true, icon: Target, bg: "bg-gold-50", iconColor: "text-gold-600" },
];

const budgetVsActual = [
  { name: "ERP Platform", budget: 285000, actual: 98500 },
  { name: "Mobile Banking", budget: 180000, actual: 42000 },
  { name: "E-Commerce", budget: 520000, actual: 495000 },
  { name: "CRM Integration", budget: 95000, actual: 15200 },
];

const costTrendData = [
  { month: "Oct", amount: 45000 },
  { month: "Nov", amount: 82000 },
  { month: "Dec", amount: 165000 },
  { month: "Jan", amount: 210000 },
  { month: "Feb", amount: 98000 },
  { month: "Mar", amount: 50700 },
];

const forecastData = [
  { month: "Apr", amount: 72000 },
  { month: "May", amount: 95000 },
  { month: "Jun", amount: 110000 },
];

const costBySkill = [
  { category: "Backend / API", amount: 245000, pct: 37.7, color: "#A67763" },
  { category: "Frontend / UI", amount: 148000, pct: 22.7, color: "#5B9BA2" },
  { category: "DevOps / Infra", amount: 95000, pct: 14.6, color: "#4D5741" },
  { category: "QA / Testing", amount: 72000, pct: 11.1, color: "#D0B060" },
  { category: "Design / UX", amount: 52700, pct: 8.1, color: "#C9B09D" },
  { category: "Other", amount: 38000, pct: 5.8, color: "#E9DFD7" },
];

/* ── Budget vs Actual Horizontal Bar Chart ── */
function BudgetVsActualChart() {
  const maxVal = Math.max(...budgetVsActual.map((p) => Math.max(p.budget, p.actual)));

  return (
    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
      <h3 className="text-[14px] font-semibold text-brown-800 mb-1">
        Budget vs Actual by Project
      </h3>
      <p className="text-[11px] text-beige-500 mb-4">
        Horizontal comparison across active projects
      </p>

      <div className="space-y-4">
        {budgetVsActual.map((proj) => {
          const budgetPct = (proj.budget / maxVal) * 100;
          const actualPct = (proj.actual / maxVal) * 100;
          const utilization = Math.round((proj.actual / proj.budget) * 100);

          return (
            <div key={proj.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-medium text-brown-700">
                  {proj.name}
                </span>
                <span className={cn(
                  "text-[10px] font-semibold",
                  utilization > 90 ? "text-gold-600" : "text-beige-500"
                )}>
                  {utilization}% utilized
                </span>
              </div>
              {/* Budget bar */}
              <div className="relative h-5 bg-beige-100/60 rounded-md overflow-hidden mb-1">
                <div
                  className="absolute top-0 left-0 h-full rounded-md bg-beige-200/80"
                  style={{ width: `${budgetPct}%` }}
                />
                <div
                  className="absolute top-0 left-0 h-full rounded-md"
                  style={{
                    width: `${actualPct}%`,
                    backgroundColor: utilization > 90 ? "#D0B060" : "#4D5741",
                    opacity: 0.7,
                  }}
                />
                <div className="absolute inset-0 flex items-center px-2">
                  <span className="text-[8px] font-bold text-white drop-shadow-sm">
                    ${(proj.actual / 1000).toFixed(0)}k / ${(proj.budget / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-beige-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-beige-200" />
          <span className="text-[10px] text-beige-500">Budget</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-forest-500 opacity-70" />
          <span className="text-[10px] text-beige-500">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-sm bg-gold-500 opacity-70" />
          <span className="text-[10px] text-beige-500">&gt;90% Utilized</span>
        </div>
      </div>
    </div>
  );
}

/* ── Cost Trend Line Chart (SVG) ── */
function CostTrendChart() {
  const allData = [...costTrendData, ...forecastData];
  const maxVal = Math.max(...allData.map((d) => d.amount));
  const pad = 25;
  const w = 500;
  const h = 160;

  const pts = allData.map((d, i) => ({
    x: pad + (i / (allData.length - 1)) * (w - pad * 2),
    y: h - pad - (d.amount / maxVal) * (h - pad * 2 - 5),
  }));

  const actualPts = pts.slice(0, costTrendData.length);
  const forecastPts = [pts[costTrendData.length - 1], ...pts.slice(costTrendData.length)];

  const actualLine = actualPts.map((p) => `${p.x},${p.y}`).join(" ");
  const forecastLine = forecastPts.map((p) => `${p.x},${p.y}`).join(" ");

  // Area under actual line
  const areaPath = `M${actualPts[0].x},${h - pad} ${actualPts.map((p) => `L${p.x},${p.y}`).join(" ")} L${actualPts[actualPts.length - 1].x},${h - pad} Z`;

  return (
    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[14px] font-semibold text-brown-800">
            Cost Trend Over Time
          </h3>
          <p className="text-[11px] text-beige-500 mt-0.5">
            Monthly spend with 3-month forecast
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-brown-500 rounded" />
            <span className="text-[9px] text-beige-500">Actual</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-gold-500 rounded" style={{ borderTop: "1.5px dashed #D0B060" }} />
            <span className="text-[9px] text-beige-500">Forecast</span>
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[200px]">
        {/* Grid */}
        {[0, 1, 2, 3].map((i) => {
          const y = pad + (i * (h - pad * 2)) / 3;
          const val = Math.round(maxVal - (i * maxVal) / 3);
          return (
            <g key={i}>
              <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#E9DFD7" strokeWidth="0.5" />
              <text x={pad - 4} y={y + 3} textAnchor="end" fontSize="7" fill="#B8A99A">
                ${(val / 1000).toFixed(0)}k
              </text>
            </g>
          );
        })}

        {/* Divider between actual and forecast */}
        <line
          x1={actualPts[actualPts.length - 1].x}
          y1={pad}
          x2={actualPts[actualPts.length - 1].x}
          y2={h - pad}
          stroke="#E9DFD7"
          strokeWidth="0.8"
          strokeDasharray="3,3"
        />
        <text
          x={actualPts[actualPts.length - 1].x}
          y={pad - 5}
          textAnchor="middle"
          fontSize="7"
          fill="#B8A99A"
        >
          Today
        </text>

        {/* Area fill */}
        <defs>
          <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A67763" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#A67763" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#costGrad)" />

        {/* Actual line */}
        <polyline
          points={actualLine}
          fill="none"
          stroke="#A67763"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Forecast line (dashed) */}
        <polyline
          points={forecastLine}
          fill="none"
          stroke="#D0B060"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="6,4"
        />

        {/* Dots on actual */}
        {actualPts.map((p, i) => (
          <g key={`a-${i}`}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#A67763" strokeWidth="1.5" />
            <text x={p.x} y={h - 6} textAnchor="middle" fontSize="7" fill="#B8A99A">
              {allData[i].month}
            </text>
          </g>
        ))}

        {/* Dots on forecast */}
        {forecastPts.slice(1).map((p, i) => (
          <g key={`f-${i}`}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke="#D0B060" strokeWidth="1.5" strokeDasharray="2,1" />
            <text x={p.x} y={h - 6} textAnchor="middle" fontSize="7" fill="#D0B060">
              {allData[costTrendData.length + i].month}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ── Cost By Skill Category Donut ── */
function CostBySkillDonut() {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
      <h3 className="text-[14px] font-semibold text-brown-800 mb-4">
        Cost by Skill Category
      </h3>
      <div className="flex items-center justify-center gap-8">
        {/* SVG Donut */}
        <div className="relative">
          <svg width="160" height="160" className="-rotate-90">
            {costBySkill.map((seg, i) => {
              const dashLength = (seg.pct / 100) * circumference;
              const gap = circumference - dashLength;
              const offset = cumulativeOffset;
              cumulativeOffset += dashLength;

              return (
                <circle
                  key={i}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="16"
                  strokeDasharray={`${dashLength} ${gap}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  opacity="0.85"
                />
              );
            })}
            <circle cx="80" cy="80" r="48" fill="white" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[20px] font-bold text-brown-900">$651k</span>
            <span className="text-[9px] text-beige-500 font-medium">Total Spent</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2.5">
          {costBySkill.map((seg, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: seg.color, opacity: 0.85 }}
              />
              <div>
                <p className="text-[11px] font-semibold text-brown-700">
                  {seg.pct}%
                </p>
                <p className="text-[9px] text-beige-500">{seg.category}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE COMPONENT
   ══════════════════════════════════════════ */
export default function EconomicDashboardPage() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Back + header */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/analytics"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-teal-600 hover:text-teal-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Analytics
        </Link>
        <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
          Economic Dashboard
        </h1>
        <p className="text-[13px] text-beige-500 mt-1">
          Budget utilization, cost trends, spending forecasts, and cost breakdowns across all projects.
        </p>
      </motion.div>

      {/* ── 4 KPI Cards ── */}
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
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", kpi.bg)}>
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

      {/* ── Budget vs Actual ── */}
      <motion.div variants={fadeUp}>
        <BudgetVsActualChart />
      </motion.div>

      {/* ── Cost Trend + Donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div variants={fadeUp}>
          <CostTrendChart />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CostBySkillDonut />
        </motion.div>
      </div>
    </motion.div>
  );
}
