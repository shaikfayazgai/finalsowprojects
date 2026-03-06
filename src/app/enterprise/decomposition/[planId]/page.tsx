"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Network,
  Clock,
  DollarSign,
  CheckCircle2,
  Pencil,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Layers,
  Zap,
  AlertTriangle,
  Circle,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight, scaleIn } from "@/lib/utils/motion-variants";
import { Badge, Button, Progress } from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { StatusTimeline } from "@/components/enterprise/status-timeline";
import { mockPlans, mockTasks } from "@/mocks/data/enterprise-projects";
import type { DecompositionTask, PlanStatus, TaskStatus } from "@/types/enterprise";

/* ── Status badge config ── */
const statusBadge: Record<PlanStatus, { variant: "beige" | "gold" | "teal" | "forest" | "brown"; label: string }> = {
  draft: { variant: "beige", label: "Draft" },
  pending_review: { variant: "gold", label: "Pending Review" },
  approved: { variant: "teal", label: "Approved" },
  in_progress: { variant: "forest", label: "In Progress" },
  completed: { variant: "brown", label: "Completed" },
};

/* ── Task status config ── */
const taskStatusConfig: Record<TaskStatus, { variant: "beige" | "teal" | "gold" | "forest" | "danger" | "brown"; label: string; icon: React.ElementType }> = {
  backlog: { variant: "beige", label: "Backlog", icon: Circle },
  in_progress: { variant: "teal", label: "In Progress", icon: Zap },
  in_review: { variant: "gold", label: "In Review", icon: Clock },
  rework: { variant: "danger", label: "Rework", icon: AlertTriangle },
  accepted: { variant: "forest", label: "Accepted", icon: CheckCircle2 },
  rejected: { variant: "danger", label: "Rejected", icon: AlertTriangle },
};

/* ── Priority config ── */
const priorityConfig: Record<string, { variant: "beige" | "teal" | "gold" | "brown"; label: string }> = {
  low: { variant: "beige", label: "Low" },
  medium: { variant: "teal", label: "Medium" },
  high: { variant: "gold", label: "High" },
  critical: { variant: "brown", label: "Critical" },
};

/* ── Task Card ── */
function TaskCard({ task, allTasks }: { task: DecompositionTask; allTasks: DecompositionTask[] }) {
  const status = taskStatusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const StatusIcon = status.icon;

  const deps = task.dependencies
    .map((depId) => allTasks.find((t) => t.id === depId))
    .filter(Boolean);

  return (
    <motion.div
      variants={fadeUp}
      className="group relative rounded-xl border border-beige-200/60 bg-white/80 backdrop-blur-sm p-4 hover:shadow-lg hover:shadow-brown-100/15 hover:border-beige-300/80 transition-all duration-300"
    >
      {/* Dependency arrow indicator */}
      {deps.length > 0 && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-px bg-teal-300" />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
              task.status === "accepted"
                ? "bg-forest-100 text-forest-600"
                : task.status === "in_progress"
                ? "bg-teal-100 text-teal-600"
                : task.status === "in_review"
                ? "bg-gold-100 text-gold-600"
                : "bg-beige-100 text-beige-500"
            )}
          >
            <StatusIcon className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-brown-900 leading-tight truncate">
              {task.title}
            </p>
            <p className="text-[11px] text-beige-500 mt-1 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          </div>
        </div>
        <Badge variant={status.variant} size="sm">
          {status.label}
        </Badge>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <Badge variant={priority.variant} size="sm">
          {priority.label}
        </Badge>
        <span className="text-[10px] text-beige-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {task.estimatedHours}h
        </span>
        {deps.length > 0 && (
          <span className="text-[10px] text-teal-600 flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {deps.length} dep{deps.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Skills tags */}
      <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
        {task.skillsRequired.map((skill) => (
          <span
            key={skill}
            className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-beige-100 text-beige-600"
          >
            {skill}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Phase Group ── */
function PhaseGroup({
  phase,
  tasks,
  allTasks,
}: {
  phase: number;
  tasks: DecompositionTask[];
  allTasks: DecompositionTask[];
}) {
  const [open, setOpen] = React.useState(true);
  const completedCount = tasks.filter(
    (t) => t.status === "accepted"
  ).length;
  const phaseTotalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);

  return (
    <motion.div variants={fadeUp} className="space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full text-left group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brown-100 to-beige-100 flex items-center justify-center shrink-0 group-hover:from-brown-200 group-hover:to-beige-200 transition-colors">
          <Layers className="w-4 h-4 text-brown-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-[14px] font-bold text-brown-900">
            Phase {phase}
          </h3>
          <p className="text-[11px] text-beige-500">
            {completedCount}/{tasks.length} tasks &middot;{" "}
            {phaseTotalHours.toLocaleString()}h
          </p>
        </div>
        <div className="w-20">
          <Progress
            value={(completedCount / tasks.length) * 100}
            size="sm"
            variant="gradient-forest"
          />
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-beige-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-beige-400" />
        )}
      </button>

      {open && (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-2.5 pl-3 border-l-2 border-beige-200/60 ml-4"
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} allTasks={allTasks} />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   PLAN DETAIL PAGE
   ══════════════════════════════════════════ */
export default function PlanDetailPage() {
  const params = useParams();
  const planId = params.planId as string;
  const plan = mockPlans.find((p) => p.id === planId) ?? mockPlans[0];
  const tasks = mockTasks.filter((t) => t.planId === plan.id);

  const status = statusBadge[plan.status];
  const cost = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(plan.estimatedCost);

  /* Group tasks by phase */
  const phases = Array.from(new Set(tasks.map((t) => t.phase))).sort(
    (a, b) => a - b
  );

  /* Completion percentage */
  const completedTasks = tasks.filter((t) => t.status === "accepted").length;
  const completionPct = tasks.length
    ? Math.round((completedTasks / tasks.length) * 100)
    : 0;

  /* Timeline steps */
  const timelineSteps = [
    {
      label: "SOW Parsed",
      description: "AI analysis complete",
      timestamp: new Date(plan.createdAt).toLocaleDateString(),
      status: "completed" as const,
    },
    {
      label: "Tasks Decomposed",
      description: `${plan.totalTasks} tasks identified`,
      timestamp: new Date(plan.createdAt).toLocaleDateString(),
      status: "completed" as const,
    },
    {
      label: "Review & Approval",
      description:
        plan.status === "draft"
          ? "Waiting for submission"
          : plan.status === "pending_review"
          ? "Under review"
          : "Approved by admin",
      status:
        plan.status === "draft"
          ? ("upcoming" as const)
          : plan.status === "pending_review"
          ? ("current" as const)
          : ("completed" as const),
    },
    {
      label: "Team Formation",
      description:
        plan.teamId
          ? "Team assigned"
          : "Pending plan approval",
      status: plan.teamId ? ("completed" as const) : ("upcoming" as const),
    },
    {
      label: "Project Delivery",
      description:
        plan.status === "completed"
          ? "All tasks delivered"
          : plan.status === "in_progress"
          ? "Delivery in progress"
          : "Awaiting start",
      status:
        plan.status === "completed"
          ? ("completed" as const)
          : plan.status === "in_progress"
          ? ("current" as const)
          : ("upcoming" as const),
    },
  ];

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
          href="/enterprise/decomposition"
          className="inline-flex items-center gap-1.5 text-[12px] text-beige-500 hover:text-brown-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Decomposition Plans
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-500 to-brown-600 flex items-center justify-center shrink-0">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[20px] font-bold text-brown-900 tracking-[-0.02em]">
                  {plan.title}
                </h1>
                <Badge variant={status.variant} size="sm" dot>
                  {status.label}
                </Badge>
              </div>
              <p className="text-[12px] text-beige-500 mt-0.5">
                SOW: {plan.sowId} &middot; Created{" "}
                {new Date(plan.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/enterprise/decomposition/${plan.id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="w-3.5 h-3.5" />
                Edit Plan
              </Button>
            </Link>
            <Link href={`/enterprise/decomposition/${plan.id}/approve`}>
              <Button variant="gradient-primary" size="sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                Approve
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Three-column bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2/3: Task tree */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-2 space-y-5"
        >
          {/* Task summary bar */}
          <div className="flex items-center gap-4 flex-wrap rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4">
            {(
              [
                ["backlog", "Backlog"],
                ["in_progress", "Active"],
                ["in_review", "Review"],
                ["accepted", "Done"],
              ] as [TaskStatus, string][]
            ).map(([key, label]) => {
              const count = tasks.filter((t) => t.status === key).length;
              const cfg = taskStatusConfig[key];
              return (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      key === "backlog" && "bg-beige-400",
                      key === "in_progress" && "bg-teal-500",
                      key === "in_review" && "bg-gold-500",
                      key === "accepted" && "bg-forest-500"
                    )}
                  />
                  <span className="text-[12px] text-brown-700 font-medium">
                    {count} {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Phase groups */}
          <div className="space-y-6">
            {phases.map((phase) => (
              <PhaseGroup
                key={phase}
                phase={phase}
                tasks={tasks
                  .filter((t) => t.phase === phase)
                  .sort((a, b) => a.order - b.order)}
                allTasks={tasks}
              />
            ))}
          </div>
        </motion.div>

        {/* Right 1/3: Sidebar */}
        <motion.div
          variants={slideInRight}
          className="space-y-5"
        >
          {/* Completion ring */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 text-center">
            <MetricRing
              value={completionPct}
              size={100}
              strokeWidth={8}
              color="forest"
              label="Complete"
              className="mx-auto"
            />
            <p className="text-[13px] font-semibold text-brown-800 mt-3">
              Plan Completion
            </p>
            <p className="text-[11px] text-beige-500 mt-0.5">
              {completedTasks} of {tasks.length} tasks accepted
            </p>
          </div>

          {/* Plan metadata */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 space-y-4">
            <h3 className="text-[13px] font-bold text-brown-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-beige-400" />
              Plan Details
            </h3>
            {[
              { label: "Total Tasks", value: plan.totalTasks.toString(), icon: Layers },
              {
                label: "Estimated Hours",
                value: plan.estimatedHours.toLocaleString() + "h",
                icon: Clock,
              },
              { label: "Estimated Cost", value: cost, icon: DollarSign },
              {
                label: "Complexity",
                value: plan.complexity.charAt(0).toUpperCase() + plan.complexity.slice(1),
                icon: Zap,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5 text-beige-400" />
                  <span className="text-[12px] text-beige-600">
                    {item.label}
                  </span>
                </div>
                <span className="text-[13px] font-semibold text-brown-800">
                  {item.value}
                </span>
              </div>
            ))}

            {/* Cost breakdown mini chart */}
            <div className="pt-3 border-t border-beige-100">
              <p className="text-[11px] text-beige-500 font-medium mb-2">
                Cost by Phase
              </p>
              {phases.map((phase) => {
                const phaseTasks = tasks.filter((t) => t.phase === phase);
                const phaseHours = phaseTasks.reduce(
                  (s, t) => s + t.estimatedHours,
                  0
                );
                const pct = Math.round(
                  (phaseHours / plan.estimatedHours) * 100
                );
                return (
                  <div key={phase} className="mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-brown-700 font-medium">
                        Phase {phase}
                      </span>
                      <span className="text-[10px] text-beige-500">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-beige-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          phase === 1
                            ? "bg-brown-400"
                            : phase === 2
                            ? "bg-teal-400"
                            : "bg-gold-400"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Plan lifecycle timeline */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[13px] font-bold text-brown-900 mb-4 flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-beige-400" />
              Lifecycle
            </h3>
            <StatusTimeline steps={timelineSteps} />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
