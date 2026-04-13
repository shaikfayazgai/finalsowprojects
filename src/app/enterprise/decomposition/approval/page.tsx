"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Clock,
  Layers,
  DollarSign,
  ArrowRight,
  Network,
  Zap,
  ClipboardCheck,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Badge } from "@/components/ui";
import type { DecompositionPlan, PlanStatus } from "@/types/enterprise";
import { useDecompositionPlans } from "@/lib/hooks/use-decomposition";

/* ── Status badge config ── */
const statusBadge: Record<
  PlanStatus,
  { variant: "beige" | "gold" | "teal" | "forest" | "brown"; label: string }
> = {
  draft: { variant: "beige", label: "Draft" },
  pending_review: { variant: "gold", label: "Plan Review Required" },
  revision_in_progress: { variant: "teal", label: "Revision In Progress" },
  approved: { variant: "forest", label: "Plan Confirmed" },
  in_progress: { variant: "beige", label: "Plan Locked" },
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

/* ── Stat card ── */
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

/* ── Plan approval card ── */
function ApprovalCard({ plan }: { plan: DecompositionPlan }) {
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

  const isPending = plan.status === "pending_review";

  return (
    <motion.div variants={fadeUp}>
      <Link
        href={`/enterprise/decomposition/${plan.id}/approve`}
        className="group block"
      >
        <div
          className={cn(
            "flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border bg-white/70 backdrop-blur-sm p-5 hover:shadow-xl hover:shadow-brown-100/20 hover:-translate-y-0.5 transition-all duration-300",
            isPending
              ? "border-gold-200/60 bg-gradient-to-r from-gold-50/30 to-white/70"
              : "border-beige-200/50"
          )}
        >
          {/* Left icon accent */}
          <div
            className={cn(
              "hidden sm:flex w-12 h-12 rounded-xl bg-gradient-to-br items-center justify-center shrink-0 transition-colors",
              isPending
                ? "from-gold-100 to-gold-200 group-hover:from-gold-200 group-hover:to-gold-300"
                : "from-teal-50 to-teal-100 group-hover:from-teal-100 group-hover:to-teal-200"
            )}
          >
            {isPending ? (
              <ClipboardCheck className="w-5 h-5 text-gold-700" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-teal-600" />
            )}
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

            {/* CTA indicator */}
            <div
              className={cn(
                "hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                isPending
                  ? "bg-gold-100 text-gold-800 group-hover:bg-gold-200"
                  : "bg-teal-100 text-teal-700 group-hover:bg-teal-200"
              )}
            >
              {isPending ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Review
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  View
                </>
              )}
            </div>

            <ArrowRight className="w-4 h-4 text-beige-300 group-hover:text-brown-500 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ==============================================================
   PLAN APPROVAL QUEUE PAGE
   ============================================================== */
export default function PlanApprovalPage() {
  const { data: apiPlansRes } = useDecompositionPlans();

  // Map backend status to frontend PlanStatus
  const normalizeStatus = (s: string): PlanStatus => {
    const map: Record<string, PlanStatus> = {
      PLAN_REVIEW_REQUIRED: "pending_review",
      PENDING_KICKOFF: "draft",
      NEW: "draft",
      PLAN_CONFIRMED: "approved",
      PLAN_LOCKED: "in_progress",
      REVISION_IN_PROGRESS: "revision_in_progress",
      COMPLETED: "completed",
      WITHDRAWN: "completed",
    };
    return map[s] ?? (s as PlanStatus);
  };

  const allPlans: DecompositionPlan[] = React.useMemo(() => {
    // Handle both direct array and {data: [...]} wrapper
    const resp = apiPlansRes as unknown;
    let rawArr: Record<string, unknown>[] | null = null;
    if (Array.isArray(resp)) {
      rawArr = resp;
    } else if (resp && typeof resp === "object") {
      const obj = resp as Record<string, unknown>;
      const inner = obj.data ?? obj;
      if (Array.isArray(inner)) rawArr = inner;
      else if (inner && typeof inner === "object") {
        const nested = (inner as Record<string, unknown>).plans ?? (inner as Record<string, unknown>).items;
        if (Array.isArray(nested)) rawArr = nested;
      }
    }

    if (!rawArr || rawArr.length === 0) return [];

    return rawArr.map((p) => ({
      id: (p._id ?? p.id ?? p.plan_id ?? "") as string,
      sowId: (p.sow_id ?? p.sowId ?? p.sow_reference ?? "") as string,
      title: (p.title ?? p.project_name ?? "Untitled Plan") as string,
      status: normalizeStatus((p.status ?? "draft") as string),
      createdAt: (p.created_at ?? p.createdAt ?? new Date().toISOString()) as string,
      updatedAt: (p.updated_at ?? p.updatedAt ?? new Date().toISOString()) as string,
      totalTasks: Number(p.total_tasks ?? p.totalTasks ?? p.task_count ?? 0),
      totalSubtasks: Number(p.total_subtasks ?? p.totalSubtasks ?? 0),
      totalMilestones: Number(p.total_milestones ?? p.totalMilestones ?? p.milestone_count ?? 0),
      estimatedHours: Number(p.estimated_hours ?? p.estimatedHours ?? 0),
      estimatedCost: Number(p.estimated_cost ?? p.estimatedCost ?? 0),
      complexity: (p.complexity ?? "medium") as DecompositionPlan["complexity"],
      version: Number(p.version ?? p.plan_version ?? p.sow_version ?? 1),
      teamId: (p.team_id ?? p.teamId) as string | undefined,
      projectId: (p.project_id ?? p.projectId) as string | undefined,
      aiConfidence: Number(p.ai_confidence ?? p.aiConfidence ?? 0),
      criticalPathDuration: Number(p.critical_path_duration ?? p.criticalPathDuration ?? 0),
      uniqueSkills: Number(p.unique_skills ?? p.uniqueSkills ?? 0),
      dependencyCount: Number(p.dependency_count ?? p.dependencyCount ?? 0),
    }));
  }, [apiPlansRes]);

  /* Filter to plans needing attention: pending_review or approved */
  const approvalPlans = allPlans.filter(
    (p) => p.status === "pending_review" || p.status === "approved"
  );

  /* Summary stats */
  const pendingCount = approvalPlans.filter(
    (p) => p.status === "pending_review"
  ).length;
  const avgCost =
    approvalPlans.length > 0
      ? approvalPlans.reduce((s, p) => s + p.estimatedCost, 0) /
        approvalPlans.length
      : 0;
  const avgCostFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(avgCost);
  const totalTasks = approvalPlans.reduce((s, p) => s + p.totalTasks, 0);

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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
              Plan Approval
            </h1>
          </div>
          <p className="text-[13px] text-beige-500 mt-1 max-w-lg">
            Review and approve decomposition plans before team formation begins.
            Plans pending review require your attention.
          </p>
        </div>
        <Link
          href="/enterprise/decomposition"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-beige-200 text-beige-600 text-[12px] font-medium hover:border-brown-300 hover:text-brown-600 transition-colors"
        >
          <Network className="w-3.5 h-3.5" />
          All Plans
        </Link>
      </motion.div>

      {/* Summary stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MiniStat
          label="Plans Pending"
          value={pendingCount}
          icon={ClipboardCheck}
          accent="bg-gold-100 text-gold-700"
        />
        <MiniStat
          label="Avg Estimated Cost"
          value={avgCostFormatted}
          icon={DollarSign}
          accent="bg-teal-100 text-teal-600"
        />
        <MiniStat
          label="Total Tasks"
          value={totalTasks}
          icon={Layers}
          accent="bg-brown-100 text-brown-600"
        />
      </div>

      {/* Queue section header */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-bold text-brown-900">
            Approval Queue
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-gold-100 text-gold-700">
            {approvalPlans.length}
          </span>
        </div>
        <p className="text-[11px] text-beige-500">
          Sorted by status &middot; Pending first
        </p>
      </motion.div>

      {/* Plan cards list */}
      {approvalPlans.length > 0 ? (
        <motion.div variants={stagger} className="space-y-3">
          {/* Pending plans first, then approved */}
          {approvalPlans
            .sort((a, b) => {
              if (a.status === "pending_review" && b.status !== "pending_review")
                return -1;
              if (a.status !== "pending_review" && b.status === "pending_review")
                return 1;
              return (
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime()
              );
            })
            .map((plan) => (
              <ApprovalCard key={plan.id} plan={plan} />
            ))}
        </motion.div>
      ) : (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-12 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-forest-500" />
          </div>
          <h3 className="text-[16px] font-bold text-brown-900 mb-1.5">
            All caught up
          </h3>
          <p className="text-[13px] text-beige-500 max-w-sm mx-auto">
            No plans are currently awaiting approval. New plans will appear here
            once AI decomposition completes.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
