"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Network,
  Clock,
  Layers,
  DollarSign,
  ArrowRight,
  Boxes,
  Sparkles,
  Filter,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, fadeIn } from "@/lib/utils/motion-variants";
import { Badge } from "@/components/ui";
import { mockPlans } from "@/mocks/data/enterprise-projects";
import type { DecompositionPlan, PlanStatus } from "@/types/enterprise";

/* ── Status badge config ── */
const statusBadge: Record<PlanStatus, { variant: "beige" | "gold" | "teal" | "forest" | "brown"; label: string }> = {
  draft: { variant: "beige", label: "Draft" },
  pending_review: { variant: "gold", label: "Pending Review" },
  approved: { variant: "teal", label: "Approved" },
  in_progress: { variant: "forest", label: "In Progress" },
  completed: { variant: "brown", label: "Completed" },
};

/* ── Complexity badge config ── */
const complexityConfig: Record<string, { variant: "forest" | "teal" | "gold" | "brown"; label: string }> = {
  low: { variant: "forest", label: "Low" },
  medium: { variant: "teal", label: "Medium" },
  high: { variant: "gold", label: "High" },
  critical: { variant: "brown", label: "Critical" },
};

/* ── Stat card with animated ring ── */
function MiniStat({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex items-center gap-4 rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-lg transition-all"
    >
      <div
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
          accent
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[22px] font-bold text-brown-900 tracking-tight leading-none">
          {value}
        </p>
        <p className="text-[11px] text-beige-500 font-medium mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

/* ── Plan horizontal card ── */
function PlanCard({ plan }: { plan: DecompositionPlan }) {
  const status = statusBadge[plan.status];
  const complexity = complexityConfig[plan.complexity];
  const updatedDate = new Date(plan.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const cost = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(plan.estimatedCost);

  return (
    <motion.div variants={fadeUp}>
      <Link
        href={`/enterprise/decomposition/${plan.id}`}
        className="group block"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-xl hover:shadow-brown-100/20 hover:-translate-y-0.5 transition-all duration-300">
          {/* Left icon accent */}
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br from-brown-50 to-beige-100 items-center justify-center shrink-0 group-hover:from-brown-100 group-hover:to-beige-200 transition-colors">
            <Network className="w-5 h-5 text-brown-500" />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-[14px] font-bold text-brown-900 group-hover:text-brown-700 transition-colors truncate">
                {plan.title}
              </h3>
              <Badge variant={status.variant} size="sm" dot>
                {status.label}
              </Badge>
              <Badge variant={complexity.variant} size="sm">
                {complexity.label}
              </Badge>
            </div>
            <p className="text-[11px] text-beige-500 mt-1.5">
              SOW: {plan.sowId} &middot; Updated {updatedDate}
            </p>
          </div>

          {/* Metrics inline */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center hidden md:block">
              <p className="text-[16px] font-bold text-brown-800">
                {plan.totalTasks}
              </p>
              <p className="text-[10px] text-beige-500">Tasks</p>
            </div>
            <div className="hidden lg:block w-px h-8 bg-beige-200" />
            <div className="text-center hidden lg:block">
              <p className="text-[16px] font-bold text-brown-800">
                {plan.estimatedHours.toLocaleString()}h
              </p>
              <p className="text-[10px] text-beige-500">Hours</p>
            </div>
            <div className="hidden lg:block w-px h-8 bg-beige-200" />
            <div className="text-center hidden md:block">
              <p className="text-[16px] font-bold text-teal-700">{cost}</p>
              <p className="text-[10px] text-beige-500">Est. Cost</p>
            </div>
            <ArrowRight className="w-4 h-4 text-beige-300 group-hover:text-brown-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   DECOMPOSITION PLANS LIST PAGE
   ══════════════════════════════════════════ */
export default function DecompositionPlansPage() {
  const [activeTab, setActiveTab] = React.useState<string>("all");

  const tabValues: { label: string; value: string }[] = [
    { label: "All", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Pending Review", value: "pending_review" },
    { label: "Approved", value: "approved" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
  ];

  const filtered =
    activeTab === "all"
      ? mockPlans
      : mockPlans.filter((p) => p.status === activeTab);

  /* Summary stats */
  const totalPlans = mockPlans.length;
  const avgTasks = Math.round(
    mockPlans.reduce((s, p) => s + p.totalTasks, 0) / totalPlans
  );
  const totalHours = mockPlans.reduce((s, p) => s + p.estimatedHours, 0);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Page header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brown-500 to-brown-600 flex items-center justify-center">
              <Network className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
              Decomposition Plans
            </h1>
          </div>
          <p className="text-[13px] text-beige-500 mt-1 max-w-lg">
            AI-powered task decomposition from your SOW documents. Review,
            edit, and approve plans before team formation begins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-beige-200 text-beige-600 text-[12px] font-medium hover:border-brown-300 hover:text-brown-600 transition-colors">
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>
          <Link
            href="/enterprise/sow"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brown-600 hover:bg-brown-700 text-white text-[12px] font-semibold shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            New from SOW
          </Link>
        </div>
      </motion.div>

      {/* Summary stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MiniStat
          label="Total Plans"
          value={totalPlans}
          icon={Boxes}
          accent="bg-brown-100 text-brown-600"
        />
        <MiniStat
          label="Avg Tasks per Plan"
          value={avgTasks}
          icon={Layers}
          accent="bg-teal-100 text-teal-600"
        />
        <MiniStat
          label="Total Estimated Hours"
          value={totalHours.toLocaleString()}
          icon={Clock}
          accent="bg-gold-100 text-gold-700"
        />
      </div>

      {/* Status tabs */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-0 border-b border-beige-200/60 overflow-x-auto"
      >
        {tabValues.map((tab) => {
          const count =
            tab.value === "all"
              ? mockPlans.length
              : mockPlans.filter((p) => p.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-4 py-2.5 text-[13px] font-medium transition-colors border-b-2 whitespace-nowrap",
                activeTab === tab.value
                  ? "text-brown-800 border-brown-500"
                  : "text-beige-500 border-transparent hover:text-brown-600"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md font-bold",
                  activeTab === tab.value
                    ? "bg-brown-100 text-brown-700"
                    : "bg-beige-100 text-beige-500"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Plan cards (horizontal list) */}
      <motion.div variants={stagger} className="space-y-3">
        {filtered.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </motion.div>
    </motion.div>
  );
}
