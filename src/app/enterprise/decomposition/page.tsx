"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Network,
  Clock,
  Layers,
  ArrowRight,
  Boxes,
  Sparkles,
  Download,
  Milestone as MilestoneIcon,
  ListTree,
  BrainCircuit,
  ArrowUpDown,
  CheckCircle2,
  FileText,
  X,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, fadeIn } from "@/lib/utils/motion-variants";
import {
  Badge,
  Progress,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui";
import { mockPlans, mockTasks } from "@/mocks/data/enterprise-projects";
import type { DecompositionPlan, PlanStatus } from "@/types/enterprise";

/* ── Status badge config ── */
const statusBadge: Record<
  PlanStatus,
  { variant: "beige" | "gold" | "teal" | "forest" | "brown"; label: string }
> = {
  draft: { variant: "beige", label: "Draft" },
  pending_review: { variant: "gold", label: "Pending Review" },
  approved: { variant: "teal", label: "Approved" },
  in_progress: { variant: "forest", label: "In Progress" },
  completed: { variant: "brown", label: "Completed" },
};

/* ── Complexity badge config ── */
const complexityConfig: Record<
  string,
  { variant: "forest" | "teal" | "gold" | "brown"; label: string }
> = {
  low: { variant: "forest", label: "Low" },
  medium: { variant: "teal", label: "Medium" },
  high: { variant: "gold", label: "High" },
  critical: { variant: "brown", label: "Critical" },
};

/* ── Sort options ── */
type SortKey = "updated" | "confidence" | "cost" | "hours" | "tasks";
const sortOptions: { label: string; value: SortKey }[] = [
  { label: "Last Updated", value: "updated" },
  { label: "AI Confidence", value: "confidence" },
  { label: "Estimated Cost", value: "cost" },
  { label: "Estimated Hours", value: "hours" },
  { label: "Total Tasks", value: "tasks" },
];

function sortPlans(plans: DecompositionPlan[], key: SortKey): DecompositionPlan[] {
  return [...plans].sort((a, b) => {
    switch (key) {
      case "updated": return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      case "confidence": return b.aiConfidence - a.aiConfidence;
      case "cost": return b.estimatedCost - a.estimatedCost;
      case "hours": return b.estimatedHours - a.estimatedHours;
      case "tasks": return b.totalTasks - a.totalTasks;
    }
  });
}

/* ── AI Confidence label ── */
function confidenceLabel(value: number): string {
  if (value >= 90) return "Very High — reliable decomposition";
  if (value >= 80) return "High — minor adjustments may help";
  if (value >= 70) return "Moderate — review recommended";
  return "Low — significant review needed";
}

/* ── Summary stat card ── */
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
  });
  const cost = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(plan.estimatedCost);

  /* Task completion progress (#15) */
  const planTasks = mockTasks.filter((t) => t.planId === plan.id);
  const completedTasks = planTasks.filter((t) => t.status === "accepted").length;
  const taskTotal = planTasks.length > 0 ? planTasks.length : plan.totalTasks;
  const taskProgress = taskTotal > 0 ? Math.round((completedTasks / taskTotal) * 100) : 0;
  const hasTaskData = planTasks.length > 0;

  return (
    <motion.div variants={fadeUp}>
      <Link
        href={`/enterprise/decomposition/${plan.id}`}
        className="group block"
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 hover:shadow-xl hover:shadow-brown-100/20 hover:-translate-y-0.5 transition-all duration-300">
          {/* Row 1: Icon + Title + Badges */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="hidden sm:flex w-11 h-11 rounded-xl bg-gradient-to-br from-brown-50 to-beige-100 items-center justify-center shrink-0 group-hover:from-brown-100 group-hover:to-beige-200 transition-colors">
              <Network className="w-5 h-5 text-brown-500" />
            </div>

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
              <p className="text-[11px] text-beige-500 mt-1">
                SOW: {plan.sowId} &middot; Updated {updatedDate} &middot; v
                {plan.version}
              </p>
            </div>
          </div>

          {/* Row 2: Metrics + Task Progress + AI Confidence + Cost */}
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap">
            {/* Milestones */}
            <div className="flex items-center gap-1.5">
              <MilestoneIcon className="w-3.5 h-3.5 text-beige-400" />
              <span className="text-[12px] font-semibold text-brown-800">
                {plan.totalMilestones}
              </span>
              <span className="text-[10px] text-beige-500">Milestones</span>
            </div>

            <div className="w-px h-5 bg-beige-200 hidden sm:block" />

            {/* Tasks with progress (#15) */}
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-beige-400" />
              <span className="text-[12px] font-semibold text-brown-800">
                {hasTaskData ? `${completedTasks}/${taskTotal}` : plan.totalTasks}
              </span>
              <span className="text-[10px] text-beige-500">Tasks</span>
              {hasTaskData && taskProgress > 0 && (
                <div className="flex items-center gap-1.5 ml-1">
                  <Progress
                    value={taskProgress}
                    size="sm"
                    variant={taskProgress === 100 ? "teal" : "gold"}
                    className="w-10"
                  />
                  <span className="text-[9px] font-bold text-beige-500 tabular-nums">
                    {taskProgress}%
                  </span>
                </div>
              )}
            </div>

            <div className="w-px h-5 bg-beige-200 hidden sm:block" />

            {/* Subtasks */}
            <div className="flex items-center gap-1.5">
              <ListTree className="w-3.5 h-3.5 text-beige-400" />
              <span className="text-[12px] font-semibold text-brown-800">
                {plan.totalSubtasks}
              </span>
              <span className="text-[10px] text-beige-500">Subtasks</span>
            </div>

            <div className="w-px h-5 bg-beige-200 hidden sm:block" />

            {/* Hours */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-beige-400" />
              <span className="text-[12px] font-semibold text-brown-800">
                {plan.estimatedHours.toLocaleString()}h
              </span>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* AI Confidence bar with tooltip (#16) */}
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 min-w-[140px] cursor-help">
                    <BrainCircuit className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                    <Progress
                      value={plan.aiConfidence}
                      size="sm"
                      variant={
                        plan.aiConfidence >= 85
                          ? "teal"
                          : plan.aiConfidence >= 70
                            ? "gold"
                            : "brown"
                      }
                      className="w-16"
                    />
                    <span className="text-[11px] font-bold text-brown-700 tabular-nums">
                      {plan.aiConfidence}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px]">
                  <p className="text-[11px] font-semibold mb-0.5">AI Confidence Score</p>
                  <p className="text-[10px] text-beige-400">{confidenceLabel(plan.aiConfidence)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="w-px h-5 bg-beige-200 hidden md:block" />

            {/* Cost + Arrow */}
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-bold text-teal-700">
                {cost}
              </span>
              <ArrowRight className="w-4 h-4 text-beige-300 group-hover:text-brown-500 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ======================================================================
   DECOMPOSITION PLANS LIST PAGE
   ====================================================================== */
export default function DecompositionPlansPage() {
  const [activeTab, setActiveTab] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<SortKey>("updated");
  const [sortOpen, setSortOpen] = React.useState(false);
  const [exportToast, setExportToast] = React.useState(false);
  const sortRef = React.useRef<HTMLDivElement>(null);

  /* Close sort dropdown on outside click */
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }
    if (sortOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [sortOpen]);

  const tabValues: { label: string; value: string }[] = [
    { label: "All", value: "all" },
    { label: "Draft", value: "draft" },
    { label: "Pending Review", value: "pending_review" },
    { label: "Approved", value: "approved" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
  ];

  const tabFiltered =
    activeTab === "all"
      ? mockPlans
      : mockPlans.filter((p) => p.status === activeTab);

  const filtered = sortPlans(tabFiltered, sortBy);

  /* Summary stats */
  const totalPlans = mockPlans.length;
  const totalMilestones = mockPlans.reduce(
    (s, p) => s + p.totalMilestones,
    0
  );
  const avgTasks = Math.round(
    mockPlans.reduce((s, p) => s + p.totalTasks, 0) / totalPlans
  );
  const totalHours = mockPlans.reduce((s, p) => s + p.estimatedHours, 0);
  const avgConfidence = Math.round(
    mockPlans.reduce((s, p) => s + p.aiConfidence, 0) / totalPlans
  );

  /* Export handler (#10) */
  const handleExport = () => {
    setExportToast(true);
    setTimeout(() => setExportToast(false), 3000);
  };

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
            AI-powered task decomposition from your SOW documents. Review, edit,
            and approve plans before team formation begins.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Sort dropdown (#6) */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors",
                sortOpen
                  ? "border-brown-300 text-brown-700 bg-brown-50/50"
                  : "border-beige-200 text-beige-600 hover:border-brown-300 hover:text-brown-600"
              )}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-white border border-beige-200/60 shadow-xl shadow-brown-100/20 py-1.5 z-20"
                >
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setSortBy(opt.value);
                        setSortOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3.5 py-2 text-[12px] font-medium transition-colors",
                        sortBy === opt.value
                          ? "text-brown-800 bg-brown-50/60"
                          : "text-beige-600 hover:text-brown-700 hover:bg-beige-50/60"
                      )}
                    >
                      {opt.label}
                      {sortBy === opt.value && (
                        <CheckCircle2 className="w-3 h-3 text-brown-500 inline ml-2" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Export button with feedback (#10) */}
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-beige-200 text-beige-600 text-[12px] font-medium hover:border-brown-300 hover:text-brown-600 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          {/* New plan from SOW (#17 — clearer CTA) */}
          <Link
            href="/enterprise/sow/upload"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brown-600 hover:bg-brown-700 text-white text-[12px] font-semibold shadow-sm transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upload SOW
          </Link>
        </div>
      </motion.div>

      {/* Summary stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MiniStat
          label="Total Plans"
          value={totalPlans}
          icon={Boxes}
          accent="bg-brown-100 text-brown-600"
        />
        <MiniStat
          label="Total Milestones"
          value={totalMilestones}
          icon={MilestoneIcon}
          accent="bg-forest-100 text-forest-600"
        />
        <MiniStat
          label="Avg Tasks / Plan"
          value={avgTasks}
          icon={Layers}
          accent="bg-teal-100 text-teal-600"
        />
        <MiniStat
          label="Total Est. Hours"
          value={totalHours.toLocaleString()}
          icon={Clock}
          accent="bg-gold-100 text-gold-700"
        />
        <MiniStat
          label="Avg AI Confidence"
          value={`${avgConfidence}%`}
          icon={BrainCircuit}
          accent="bg-teal-100 text-teal-600"
        />
      </div>

      {/* Status tabs + sort indicator */}
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

        {/* Active sort indicator */}
        {sortBy !== "updated" && (
          <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 shrink-0">
            <span className="text-[10px] text-beige-400">Sorted by</span>
            <span className="text-[10px] font-semibold text-brown-600">
              {sortOptions.find((o) => o.value === sortBy)?.label}
            </span>
            <button
              onClick={() => setSortBy("updated")}
              className="text-beige-400 hover:text-brown-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Plan cards */}
      <motion.div variants={stagger} className="space-y-3">
        {filtered.length === 0 ? (
          <motion.div
            variants={fadeIn}
            className="text-center py-16 rounded-2xl border border-beige-200/50 bg-white/50 backdrop-blur-sm"
          >
            <Network className="w-8 h-8 text-beige-300 mx-auto mb-3" />
            <p className="text-[14px] font-medium text-beige-500">
              No plans match this filter
            </p>
            <p className="text-[12px] text-beige-400 mt-1">
              Try selecting a different status tab
            </p>
          </motion.div>
        ) : (
          filtered.map((plan) => <PlanCard key={plan.id} plan={plan} />)
        )}
      </motion.div>

      {/* Export toast (#10) */}
      <AnimatePresence>
        {exportToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-brown-900 text-white shadow-2xl shadow-brown-900/30 max-w-md">
              <Download className="w-4 h-4 text-teal-400 shrink-0" />
              <span className="text-[12px] font-medium">
                Exporting {filtered.length} plans as CSV…
              </span>
              <button
                onClick={() => setExportToast(false)}
                className="text-[11px] text-beige-300 hover:text-white ml-2 transition-colors shrink-0"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
