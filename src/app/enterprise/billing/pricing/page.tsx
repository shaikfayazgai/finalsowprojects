"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  DollarSign,
  Cpu,
  BarChart3,
  TrendingDown,
  Hash,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Globe2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Badge } from "@/components/ui";

/* ── Inline Mock Data with Region ── */

interface TaskPricing {
  id: string;
  task: string;
  skillsRequired: string[];
  estimatedHours: number;
  rate: number;
  totalCost: number;
  region: string;
  complexity: "Low" | "Medium" | "High";
  aiConfidence: number;
}

const taskPricingData: TaskPricing[] = [
  { id: "tp-01", task: "Auth Service with Keycloak", skillsRequired: ["Backend", "Security"], estimatedHours: 120, rate: 65, totalCost: 7800, region: "South Asia", complexity: "High", aiConfidence: 94 },
  { id: "tp-02", task: "Database Schema Design", skillsRequired: ["Database", "Architecture"], estimatedHours: 80, rate: 75, totalCost: 6000, region: "South Asia", complexity: "High", aiConfidence: 91 },
  { id: "tp-03", task: "Finance Module — GL", skillsRequired: ["Backend", "Finance"], estimatedHours: 160, rate: 55, totalCost: 8800, region: "South Asia", complexity: "High", aiConfidence: 88 },
  { id: "tp-04", task: "Frontend Design System", skillsRequired: ["Frontend", "Design"], estimatedHours: 80, rate: 50, totalCost: 4000, region: "Southeast Asia", complexity: "Medium", aiConfidence: 95 },
  { id: "tp-05", task: "Accounts Payable UI", skillsRequired: ["Frontend", "Finance"], estimatedHours: 120, rate: 45, totalCost: 5400, region: "Middle East", complexity: "Medium", aiConfidence: 93 },
  { id: "tp-06", task: "Reporting Engine", skillsRequired: ["Full-Stack", "Data"], estimatedHours: 160, rate: 70, totalCost: 11200, region: "South Asia", complexity: "High", aiConfidence: 86 },
  { id: "tp-07", task: "Integration Testing Suite", skillsRequired: ["QA", "DevOps"], estimatedHours: 100, rate: 40, totalCost: 4000, region: "Southeast Asia", complexity: "Medium", aiConfidence: 97 },
  { id: "tp-08", task: "HR Employee Records", skillsRequired: ["Full-Stack", "HR"], estimatedHours: 100, rate: 50, totalCost: 5000, region: "South Asia", complexity: "Medium", aiConfidence: 92 },
  { id: "tp-09", task: "Payroll Integration", skillsRequired: ["Backend", "Finance", "HR"], estimatedHours: 140, rate: 60, totalCost: 8400, region: "Middle East", complexity: "High", aiConfidence: 84 },
  { id: "tp-10", task: "Mobile UX Research", skillsRequired: ["UX", "Research"], estimatedHours: 60, rate: 45, totalCost: 2700, region: "Africa", complexity: "Low", aiConfidence: 96 },
];

/* ── Summary stats ── */
const totalProjectCost = taskPricingData.reduce((sum, t) => sum + t.totalCost, 0);
const avgTaskCost = Math.round(totalProjectCost / taskPricingData.length);
const totalHours = taskPricingData.reduce((sum, t) => sum + t.estimatedHours, 0);

/* ── Cost by skill category ── */
const skillCostMap: Record<string, number> = {};
taskPricingData.forEach((t) => {
  t.skillsRequired.forEach((s) => {
    skillCostMap[s] = (skillCostMap[s] || 0) + Math.round(t.totalCost / t.skillsRequired.length);
  });
});
const costBySkill = Object.entries(skillCostMap)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 6);
const maxSkillCost = costBySkill[0]?.[1] || 1;

/* ── Cost by region ── */
const regionCostMap: Record<string, number> = {};
taskPricingData.forEach((t) => {
  regionCostMap[t.region] = (regionCostMap[t.region] || 0) + t.totalCost;
});
const costByRegion = Object.entries(regionCostMap).sort((a, b) => b[1] - a[1]);

/* ── Helpers ── */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const complexityConfig: Record<string, { variant: "forest" | "gold" | "brown"; label: string }> = {
  Low: { variant: "forest", label: "Low" },
  Medium: { variant: "gold", label: "Medium" },
  High: { variant: "brown", label: "High" },
};

const regionColors: Record<string, string> = {
  "South Asia": "from-teal-500 to-teal-600",
  "Southeast Asia": "from-forest-500 to-forest-600",
  "Middle East": "from-gold-500 to-gold-600",
  "Africa": "from-brown-400 to-brown-600",
};

function ConfidenceBar({ value }: { value: number }) {
  const color =
    value >= 93
      ? "from-forest-500 to-teal-500"
      : value >= 88
        ? "from-teal-500 to-teal-400"
        : "from-gold-500 to-gold-400";

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full bg-beige-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r", color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span
        className={cn(
          "text-[11px] font-bold tabular-nums",
          value >= 93 ? "text-forest-600" : value >= 88 ? "text-teal-600" : "text-gold-600"
        )}
      >
        {value}%
      </span>
    </div>
  );
}

/* ═══════════════════════════════
   TASK PRICING PAGE (G2)
   ═══════════════════════════════ */
export default function TaskPricingPage() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Breadcrumb */}
      <motion.div variants={fadeUp} className="flex items-center gap-2 text-sm">
        <Link
          href="/enterprise/billing"
          className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Billing
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-beige-400" />
        <span className="text-beige-500">Task Pricing</span>
      </motion.div>

      {/* Page Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-500 to-gold-500 flex items-center justify-center shadow-md shadow-brown-500/20">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-brown-900 tracking-tight font-heading">
              Task Pricing
            </h1>
            <p className="text-sm text-beige-600">
              AI-driven pricing intelligence with regional rates and skill-based cost analysis.
            </p>
          </div>
        </div>
      </motion.div>

      {/* AI Pricing Callout Banner */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-gradient-to-r from-brown-50 via-beige-50 to-teal-50 backdrop-blur-sm p-5"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-forest-500 flex items-center justify-center shadow-md shadow-teal-500/20 shrink-0">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[14px] font-semibold text-brown-900">
                Task Pricing Intelligence Engine
              </h2>
              <Badge variant="gradient-forest" size="sm">
                <Sparkles className="w-3 h-3" />
                AI-Powered
              </Badge>
            </div>
            <p className="text-[12px] text-beige-600 leading-relaxed">
              Prices factor in skill requirements, task complexity, regional labor rates, and
              historical delivery data. The engine optimizes cost-to-quality while ensuring
              fair contributor compensation across all regions.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats Row */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-brown-50 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 text-brown-500" />
            </div>
            <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">Total Project Cost</span>
          </div>
          <p className="text-2xl font-bold text-brown-900 tracking-tight">{formatCurrency(totalProjectCost)}</p>
          <div className="flex items-center gap-1 mt-1">
            <Layers className="w-3 h-3 text-beige-400" />
            <span className="text-[10px] font-medium text-beige-500">{taskPricingData.length} tasks</span>
          </div>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-teal-500" />
            </div>
            <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">Avg Task Cost</span>
          </div>
          <p className="text-2xl font-bold text-brown-900 tracking-tight">{formatCurrency(avgTaskCost)}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowDownRight className="w-3 h-3 text-forest-600" />
            <span className="text-[10px] font-medium text-forest-600">Optimized</span>
          </div>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-forest-50 flex items-center justify-center">
              <Hash className="w-3.5 h-3.5 text-forest-500" />
            </div>
            <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">Total Hours</span>
          </div>
          <p className="text-2xl font-bold text-brown-900 tracking-tight">{totalHours.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3 h-3 text-teal-600" />
            <span className="text-[10px] font-medium text-teal-600">Estimated</span>
          </div>
        </div>
        <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-md transition-all">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-gold-50 flex items-center justify-center">
              <Globe2 className="w-3.5 h-3.5 text-gold-600" />
            </div>
            <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">Regions</span>
          </div>
          <p className="text-2xl font-bold text-brown-900 tracking-tight">{costByRegion.length}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingDown className="w-3 h-3 text-forest-600" />
            <span className="text-[10px] font-medium text-forest-600">Multi-region</span>
          </div>
        </div>
      </motion.div>

      {/* Pricing Table */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-500" />
            <h2 className="text-[14px] font-semibold text-brown-800">Task Pricing Breakdown</h2>
            <Badge variant="beige" size="sm">{taskPricingData.length} tasks</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-500" />
            <span className="text-[10px] font-medium text-forest-600">AI verified</span>
          </div>
        </div>

        {/* Column Labels */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-3 px-5 py-2.5 text-[10px] font-semibold text-beige-500 uppercase tracking-wider bg-beige-50/40 rounded-t-xl border border-b-0 border-beige-200/50">
          <div className="col-span-3">Task</div>
          <div className="col-span-2">Skills</div>
          <div className="col-span-1 text-right">Hours</div>
          <div className="col-span-1 text-right">Rate</div>
          <div className="col-span-1 text-right">Total</div>
          <div className="col-span-2">Region</div>
          <div className="col-span-2 text-right">AI Confidence</div>
        </div>
      </motion.div>

      {/* Pricing Rows */}
      <motion.div variants={stagger} className="space-y-2">
        {taskPricingData.map((item) => {
          const complexity = complexityConfig[item.complexity];
          const rColor = regionColors[item.region] || "from-beige-400 to-beige-500";

          return (
            <motion.div
              key={item.id}
              variants={scaleIn}
              className="group rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm px-5 py-4 hover:shadow-lg hover:shadow-brown-100/15 hover:border-beige-300/60 transition-all cursor-default"
            >
              {/* Desktop row */}
              <div className="hidden lg:grid lg:grid-cols-12 gap-3 items-center">
                <div className="col-span-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-beige-100 to-beige-200/60 flex items-center justify-center group-hover:from-brown-50 group-hover:to-beige-100 transition-colors">
                    <DollarSign className="w-4 h-4 text-brown-500" />
                  </div>
                  <div>
                    <span className="text-[13px] font-semibold text-brown-900 block">{item.task}</span>
                    <Badge variant={complexity.variant} size="sm" dot>{complexity.label}</Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="flex flex-wrap gap-1">
                    {item.skillsRequired.map((s) => (
                      <span key={s} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-beige-100 text-beige-700">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  <span className="text-[13px] font-bold text-brown-900 tabular-nums">{item.estimatedHours}h</span>
                </div>
                <div className="col-span-1 text-right">
                  <span className="text-[13px] font-medium text-beige-600 tabular-nums">${item.rate}/hr</span>
                </div>
                <div className="col-span-1 text-right">
                  <span className="text-[14px] font-bold text-brown-900 tabular-nums">{formatCurrency(item.totalCost)}</span>
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full bg-gradient-to-br", rColor)} />
                    <span className="text-[11px] font-medium text-brown-700">{item.region}</span>
                  </div>
                </div>
                <div className="col-span-2 flex justify-end">
                  <ConfidenceBar value={item.aiConfidence} />
                </div>
              </div>

              {/* Mobile layout */}
              <div className="lg:hidden space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-beige-100 to-beige-200/60 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-brown-500" />
                    </div>
                    <div>
                      <span className="text-[13px] font-semibold text-brown-900 block">{item.task}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={complexity.variant} size="sm" dot>{complexity.label}</Badge>
                        <div className="flex items-center gap-1">
                          <div className={cn("w-2 h-2 rounded-full bg-gradient-to-br", rColor)} />
                          <span className="text-[10px] text-beige-500">{item.region}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.skillsRequired.map((s) => (
                    <span key={s} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-beige-100 text-beige-700">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-beige-100/60">
                  <div>
                    <p className="text-[10px] text-beige-500 uppercase tracking-wider mb-0.5">Hours</p>
                    <p className="text-[13px] font-bold text-brown-900">{item.estimatedHours}h</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-beige-500 uppercase tracking-wider mb-0.5">Rate</p>
                    <p className="text-[13px] font-medium text-beige-600">${item.rate}/hr</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-beige-500 uppercase tracking-wider mb-0.5">Total</p>
                    <p className="text-[14px] font-bold text-brown-900">{formatCurrency(item.totalCost)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-beige-500 uppercase tracking-wider mb-0.5">Confidence</p>
                    <ConfidenceBar value={item.aiConfidence} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Summary Cards: Cost by Skill + Cost by Region */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cost by Skill */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-teal-500" />
            <h3 className="text-[14px] font-semibold text-brown-800">Cost by Skill Category</h3>
          </div>
          <div className="space-y-3">
            {costBySkill.map(([skill, cost]) => (
              <div key={skill} className="flex items-center gap-3">
                <span className="text-[12px] font-medium text-brown-700 w-24 shrink-0">{skill}</span>
                <div className="flex-1 h-2 rounded-full bg-beige-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-forest-500"
                    style={{ width: `${(cost / maxSkillCost) * 100}%` }}
                  />
                </div>
                <span className="text-[12px] font-bold text-brown-900 tabular-nums w-16 text-right">
                  {formatCurrency(cost)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cost by Region */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="w-4 h-4 text-gold-500" />
            <h3 className="text-[14px] font-semibold text-brown-800">Cost by Region</h3>
          </div>
          <div className="space-y-3">
            {costByRegion.map(([region, cost]) => {
              const rColor = regionColors[region] || "from-beige-400 to-beige-500";
              const pct = Math.round((cost / totalProjectCost) * 100);
              return (
                <div key={region} className="flex items-center gap-3">
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <div className={cn("w-3 h-3 rounded-full bg-gradient-to-br", rColor)} />
                    <span className="text-[12px] font-medium text-brown-700">{region}</span>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-beige-100 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full bg-gradient-to-r", rColor)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-right w-20 shrink-0">
                    <span className="text-[12px] font-bold text-brown-900 tabular-nums">{formatCurrency(cost)}</span>
                    <span className="text-[10px] text-beige-500 ml-1">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-beige-200/60">
            <span className="text-[11px] font-semibold text-beige-500 uppercase tracking-wider">Total Project Cost</span>
            <span className="text-[15px] font-bold text-brown-900">{formatCurrency(totalProjectCost)}</span>
          </div>
        </motion.div>
      </div>

      {/* Pricing Accuracy */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-gradient-to-r from-white/70 to-beige-50/50 backdrop-blur-sm p-5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-brown-800">Pricing Accuracy Score</p>
              <p className="text-[11px] text-beige-500">Based on post-delivery cost reconciliation across all regions</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block w-48">
              <div className="h-2 rounded-full bg-beige-200 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-forest-500 to-teal-500" style={{ width: "92%" }} />
              </div>
            </div>
            <span className="text-xl font-bold text-brown-900">
              92<span className="text-[12px] text-beige-500 ml-0.5">%</span>
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
