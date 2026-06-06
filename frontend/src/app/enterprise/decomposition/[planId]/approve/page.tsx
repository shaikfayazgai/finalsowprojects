"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, CheckCircle2, Clock, DollarSign, Layers, Zap, Users,
  AlertTriangle, XCircle, GitBranch, Sparkles, Target, TrendingDown,
  TrendingUp, Lock, ArrowRight, ListChecks, Send, Ban, Undo2, Network,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Checkbox, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Textarea } from "@/components/ui";
import type { DecompositionPlan, PlanMilestone, DecompositionTask, PlanStatus, PlanValidationResult } from "@/types/enterprise";
import {
  useDecompositionPlan, useTasks, useMilestones,
  useConfirmPlan, useRequestRevision, useReviewChecklist, useUpdateReviewChecklist, useReviewSummary,
} from "@/lib/hooks/use-decomposition";

/* ═══ Badge ═══ */

const badgeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  forest: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  gold: { bg: "bg-gold-50", text: "text-gold-700", dot: "bg-gold-500" },
  brown: { bg: "bg-brown-50", text: "text-brown-700", dot: "bg-brown-500" },
  beige: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  danger: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

function Badge({ variant, dot, children }: { variant: string; dot?: boolean; children: React.ReactNode }) {
  const s = badgeStyles[variant] || badgeStyles.beige;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full", s.bg, s.text)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />}
      {children}
    </span>
  );
}

/* ═══ Helpers ═══ */

function formatCost(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n); }
function fmtK(n: number) { return n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`; }

const valIcon = {
  passed: { icon: CheckCircle2, color: "text-forest-500" },
  warning: { icon: AlertTriangle, color: "text-gold-500" },
  error: { icon: XCircle, color: "text-red-500" },
} as const;

const varianceTextColor: Record<string, string> = {
  forest: "text-forest-600", gold: "text-gold-600", teal: "text-teal-600",
};

/* ═══ PAGE ═══ */

export default function ApprovePlanPage() {
  const params = useParams();
  const planId = params.planId as string;

  // ── API data ──
  const { data: apiPlanRes } = useDecompositionPlan(planId);
  const { data: apiTasksRes } = useTasks(planId);
  const { data: apiMilestonesRes } = useMilestones(planId);
  const { data: apiReviewChecklistRes } = useReviewChecklist(planId);
  const { data: apiReviewSummaryRes } = useReviewSummary(planId);
  const confirmMutation = useConfirmPlan(planId);
  const revisionMutation = useRequestRevision(planId);
  const updateChecklistMutation = useUpdateReviewChecklist(planId);

  const plan: DecompositionPlan | null = React.useMemo(() => {
    const raw = apiPlanRes?.data as Record<string, unknown> | null;
    if (raw && (raw._id || raw.id)) {
      return {
        id: (raw._id ?? raw.id ?? planId) as string,
        sowId: (raw.sow_id ?? raw.sowId ?? "") as string,
        title: (raw.title ?? raw.project_name ?? "Untitled Plan") as string,
        status: (raw.status ?? "draft") as PlanStatus,
        createdAt: (raw.created_at ?? raw.createdAt ?? new Date().toISOString()) as string,
        updatedAt: (raw.updated_at ?? raw.updatedAt ?? new Date().toISOString()) as string,
        totalTasks: Number(raw.total_tasks ?? raw.totalTasks ?? 0),
        totalSubtasks: Number(raw.total_subtasks ?? raw.totalSubtasks ?? 0),
        totalMilestones: Number(raw.total_milestones ?? raw.totalMilestones ?? 0),
        estimatedHours: Number(raw.estimated_hours ?? raw.estimatedHours ?? 0),
        estimatedCost: Number(raw.estimated_cost ?? raw.estimatedCost ?? 0),
        maximumBudget: Number(raw.maximum_budget ?? raw.maximumBudget ?? raw.max_budget ?? 0),
        complexity: (raw.complexity ?? "medium") as DecompositionPlan["complexity"],
        version: Number(raw.version ?? 1),
        teamId: (raw.team_id ?? raw.teamId) as string | undefined,
        projectId: (raw.project_id ?? raw.projectId) as string | undefined,
        aiConfidence: Number(raw.ai_confidence ?? raw.aiConfidence ?? 0),
        criticalPathDuration: Number(raw.critical_path_duration ?? raw.criticalPathDuration ?? 0),
        uniqueSkills: Number(raw.unique_skills ?? raw.uniqueSkills ?? 0),
        dependencyCount: Number(raw.dependency_count ?? raw.dependencyCount ?? 0),
      };
    }
    return null;
  }, [apiPlanRes, planId]);

  const tasks = React.useMemo(() => {
    if (!plan) return [];
    const raw = apiTasksRes?.data;
    const arr = (Array.isArray(raw) ? raw : (raw as Record<string, unknown> | null)?.tasks ?? null) as Record<string, unknown>[] | null;
    if (arr && arr.length > 0) {
      return arr.map((t) => ({
        id: (t._id ?? t.id ?? "") as string,
        planId: (t.plan_id ?? t.planId ?? planId) as string,
        milestoneId: (t.milestone_id ?? t.milestoneId ?? "") as string,
        title: (t.title ?? "") as string,
        description: (t.description ?? "") as string,
        status: (t.status ?? "backlog") as string,
        priority: (t.priority ?? "medium") as string,
        estimatedHours: Number(t.estimated_hours ?? t.estimatedHours ?? 0),
        skillsRequired: (t.skills_required ?? t.skillsRequired ?? []) as { name: string }[],
        dependencies: (t.dependencies ?? []) as { type: string }[],
        acceptanceCriteria: (t.acceptance_criteria ?? t.acceptanceCriteria ?? []) as string[],
        aiConfidence: Number(t.ai_confidence ?? t.aiConfidence ?? 0),
        subtasks: (t.subtasks ?? []) as unknown[],
      }));
    }
    return [];
  }, [apiTasksRes, plan, planId]);

  const milestones = React.useMemo(() => {
    if (!plan) return [];
    const raw = apiMilestonesRes?.data;
    const arr = (Array.isArray(raw) ? raw : (raw as Record<string, unknown> | null)?.milestones ?? null) as Record<string, unknown>[] | null;
    if (arr && arr.length > 0) {
      return arr.map((m) => ({
        id: (m._id ?? m.id ?? "") as string,
        planId: (m.plan_id ?? m.planId ?? planId) as string,
        title: (m.title ?? "") as string,
        description: (m.description ?? "") as string,
        order: Number(m.order ?? 0),
        estimatedHours: Number(m.estimated_hours ?? m.estimatedHours ?? 0),
        taskCount: Number(m.task_count ?? m.taskCount ?? 0),
        subtaskCount: Number(m.subtask_count ?? m.subtaskCount ?? 0),
        itemStatus: (m.item_status ?? m.itemStatus ?? "proposed") as string,
        aiConfidence: Number(m.ai_confidence ?? m.aiConfidence ?? 0),
      }));
    }
    return [];
  }, [apiMilestonesRes, plan, planId]);

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <ShieldCheck className="w-10 h-10 text-gray-300 mb-4" />
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Plan not found</h2>
        <p className="text-sm text-gray-500 mb-4">The decomposition plan could not be loaded.</p>
        <Link href="/enterprise/decomposition" className="text-sm text-brown-500 hover:text-brown-600 font-medium">Back to plans</Link>
      </div>
    );
  }

  /* ── Validations ── */
  const sowBudgetCeiling = 300000;
  const budgetOk = plan.estimatedCost <= sowBudgetCeiling;
  const taskCount = tasks.length;
  const tasksWithDesc = tasks.filter((t) => t.description).length;
  const tasksWithSkills = tasks.filter((t) => t.skillsRequired.length > 0).length;
  const tasksWithCriteria = tasks.filter((t) => t.acceptanceCriteria.length > 0).length;
  const softDeps = tasks.filter((t) => t.dependencies.some((d) => d.type === "related")).length;
  const critPathTight = plan.criticalPathDuration > 1800;
  const rareSkillCombos = tasks.some((t) =>
    t.skillsRequired.length >= 2 && t.skillsRequired.every((s) => ["Finance", "HR", "Compliance", "Legal"].includes(s.name))
  );

  const validations: PlanValidationResult[] = [
    { field: "All tasks have descriptions", status: tasksWithDesc === taskCount ? "passed" : "error", message: `${tasksWithDesc}/${taskCount} tasks have descriptions` },
    { field: "Effort estimates complete", status: "passed", message: "All tasks have hour estimates" },
    { field: "Skills tags assigned", status: tasksWithSkills === taskCount ? "passed" : "error", message: tasksWithSkills === taskCount ? "All tasks have at least 1 skill tag" : `${tasksWithSkills}/${taskCount} tasks have skills` },
    { field: "Acceptance criteria defined", status: tasksWithCriteria === taskCount ? "passed" : "warning", message: `${tasksWithCriteria}/${taskCount} tasks have acceptance criteria` },
    { field: "Dependencies validated", status: softDeps > 0 ? "warning" : "passed", message: softDeps > 0 ? `${softDeps} task(s) have soft dependencies` : "All dependencies are firm blocks" },
    { field: "Budget within SOW limits", status: budgetOk ? "passed" : "error", message: budgetOk ? `${fmtK(plan.estimatedCost)} within ${fmtK(sowBudgetCeiling)} ceiling` : `${fmtK(plan.estimatedCost)} exceeds ${fmtK(sowBudgetCeiling)} ceiling` },
    { field: "Critical path feasible", status: critPathTight ? "warning" : "passed", message: critPathTight ? `${plan.criticalPathDuration.toLocaleString()}h — tight for timeline` : `${plan.criticalPathDuration.toLocaleString()}h — within range` },
    { field: "Skill coverage available", status: rareSkillCombos ? "error" : "passed", message: rareSkillCombos ? "Rare skill combination has limited contributors" : "Sufficient contributor coverage" },
  ];

  /* ── State ── */
  const [planStatus, setPlanStatus] = React.useState(plan.status);
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({ breakdown: false, dependencies: false, estimates: false, budget: false, skills: false });
  const [rejectionOpen, setRejectionOpen] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  /* ── Derived ── */
  const passed = validations.filter((v) => v.status === "passed").length;
  const warnings = validations.filter((v) => v.status === "warning").length;
  const errors = validations.filter((v) => v.status === "error").length;
  const hasErrors = errors > 0;

  /* ── Checklist completion ── */
  const checklistKeys = Object.keys(checklist);
  const allChecked = checklistKeys.every((k) => checklist[k]);
  const checkedCount = checklistKeys.filter((k) => checklist[k]).length;
  const canApprove = allChecked && !hasErrors;

  /* ── Skills ── */
  const uniqueSkills = Array.from(new Set(tasks.flatMap((t) => t.skillsRequired.map((s) => s.name))));
  const contributorMap: Record<string, number> = { DevOps: 8, TypeScript: 15, Backend: 12, Security: 5, Database: 7, Architecture: 4, Frontend: 14, Design: 6, Finance: 3, HR: 2, "Full-Stack": 11, Data: 5, QA: 9 };
  const skillData = uniqueSkills.map((skill) => ({
    name: skill,
    taskCount: tasks.filter((t) => t.skillsRequired.some((s) => s.name === skill)).length,
    contributors: contributorMap[skill] ?? 4,
  }));

  /* ── SOW comparison ── */
  const sowBudget = 300000;
  const planCost = plan.estimatedCost;
  const budgetVariance = ((planCost - sowBudget) / sowBudget) * 100;
  const budgetVarianceStr = budgetVariance < 0 ? `${budgetVariance.toFixed(0)}%` : `+${budgetVariance.toFixed(0)}%`;

  const toggleChecklist = (key: string) => setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ══ Already Approved View ══ */
  const isAlreadyApproved = plan.status === "approved" || plan.status === "in_progress" || plan.status === "completed";

  if (isAlreadyApproved) {
    const statusMap = {
      approved: { label: "Approved", sub: "Ready for team formation", icon: ShieldCheck, variant: "forest", nextLabel: "Proceed to Team Formation", nextHref: "/enterprise/team" },
      in_progress: { label: "In Progress", sub: "Project delivery is active", icon: Zap, variant: "teal", nextLabel: "View Active Project", nextHref: `/enterprise/projects/${plan.projectId ?? "proj-001"}` },
      completed: { label: "Completed", sub: "Project delivery finished", icon: CheckCircle2, variant: "brown", nextLabel: "View Project", nextHref: `/enterprise/projects/${plan.projectId ?? "proj-001"}` },
    } as const;
    const d = statusMap[plan.status as "approved" | "in_progress" | "completed"];
    const StatusIcon = d.icon;

    return (
      <motion.div variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp} className="mb-8">
          <div className="flex flex-wrap gap-1.5 mb-3"><Badge variant={d.variant} dot>{d.label}</Badge></div>
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">Plan {d.label}</h1>
          <p className="text-[12px] text-gray-400 mt-2">{plan.title} · v{plan.version}</p>
        </motion.div>

        <motion.div variants={fadeUp} className="card-parchment mb-6">
          <div className="px-5 py-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brown-400 to-brown-600 mx-auto flex items-center justify-center mb-4">
              <StatusIcon className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-[18px] font-semibold text-gray-900">{d.sub}</h2>
            <p className="text-[12px] text-gray-400 mt-1">Approved on {new Date(plan.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} by Priya Nair</p>
          </div>
          <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-forest-500" />
              <span className="text-[12px] font-semibold text-gray-800">All Validations Passed</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Task breakdown verified", "Dependencies validated", "Estimates reviewed", "Budget within SOW limits", "Skills requirements confirmed"].map((item) => (
                <div key={item} className="flex items-center gap-2 text-[11px] text-forest-700">
                  <CheckCircle2 className="w-3 h-3 text-forest-500 shrink-0" /><span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="px-5 py-4 flex items-center justify-end gap-2" style={{ borderTop: "1px solid var(--border-soft)" }}>
            <Link href={`/enterprise/decomposition/${plan.id}`}>
              <button className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">View Plan Details</button>
            </Link>
            <Link href={d.nextHref}>
              <button className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                {d.nextLabel} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Milestones", value: plan.totalMilestones, icon: Target, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
            { label: "Tasks", value: plan.totalTasks, icon: Layers, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
            { label: "Est. Hours", value: plan.estimatedHours.toLocaleString() + "h", icon: Clock, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
            { label: "Est. Cost", value: formatCost(plan.estimatedCost), icon: DollarSign, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          ].map((kpi) => {
            const KpiIcon = kpi.icon;
            return (
              <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.iconBg)}><KpiIcon className="w-5 h-5 text-white" /></div>
                <div>
                  <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                  <div className="num-display text-[24px] text-gray-900 leading-none mt-1">{kpi.value}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    );
  }

  /* ══ APPROVAL WORKFLOW ══ */
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-3"><Badge variant="gold" dot>Pending Review</Badge></div>
            <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">Review & Approve Plan</h1>
            <div className="flex items-center gap-2 mt-2 text-[12px] text-gray-400">
              <span>{plan.title}</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span>v{plan.version}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forest-50">
              <CheckCircle2 className="w-3 h-3 text-forest-500" />
              <span className="text-[11px] font-semibold text-forest-700">{passed}</span>
            </div>
            {warnings > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-50">
                <AlertTriangle className="w-3 h-3 text-gold-500" />
                <span className="text-[11px] font-semibold text-gold-700">{warnings}</span>
              </div>
            )}
            {errors > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50">
                <XCircle className="w-3 h-3 text-red-500" />
                <span className="text-[11px] font-semibold text-red-600">{errors}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══ PRE-APPROVAL VALIDATION ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Pre-Approval Validation</span>
          <span className="text-[11px] text-gray-400">{passed}/{validations.length} passed</span>
        </div>
        <div className="py-2">
          {validations.map((v, i) => {
            const vc = valIcon[v.status];
            const VIcon = vc.icon;
            return (
              <div key={i} className="flex items-center gap-3 px-5 py-3"
                style={{ borderBottom: i < validations.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                <VIcon className={cn("w-4 h-4 shrink-0", vc.color)} />
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-gray-700">{v.field}</span>
                  <span className="text-[11px] text-gray-400 ml-2 hidden sm:inline">{v.message}</span>
                </div>
                <Badge variant={v.status === "passed" ? "forest" : v.status === "warning" ? "gold" : "danger"}>{v.status}</Badge>
              </div>
            );
          })}
        </div>
        {hasErrors && (
          <div className="px-5 py-3 flex items-center gap-2.5" style={{ borderTop: "1px solid var(--border-soft)", background: "color-mix(in srgb, var(--danger-light) 50%, white)" }}>
            <XCircle className="w-4 h-4 shrink-0" style={{ color: "var(--danger)" }} />
            <p className="text-[12px] font-medium flex-1" style={{ color: "var(--danger)" }}>
              {errors} validation error{errors > 1 ? "s" : ""} must be resolved before approval
            </p>
            <Link href={`/enterprise/decomposition/${plan.id}/edit`}>
              <button className="text-[11px] font-medium px-3 py-1.5 rounded-lg border hover:bg-gray-50" style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>Fix Issues</button>
            </Link>
          </div>
        )}
      </motion.div>

      {/* ═══ PLAN SUMMARY ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Milestones", value: plan.totalMilestones, icon: Target, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "Tasks", value: plan.totalTasks, icon: Layers, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "Subtasks", value: plan.totalSubtasks, icon: ListChecks, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          { label: "Est. Hours", value: plan.estimatedHours.toLocaleString() + "h", icon: Clock, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { label: "Est. Cost", value: formatCost(plan.estimatedCost), icon: DollarSign, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "Critical Path", value: plan.criticalPathDuration.toLocaleString() + "h", icon: Zap, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "AI Confidence", value: plan.aiConfidence + "%", icon: Sparkles, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
          { label: "Dependencies", value: plan.dependencyCount, icon: GitBranch, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-4 px-4 py-4">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", kpi.iconBg)}><KpiIcon className="w-4 h-4 text-white" /></div>
              <div>
                <div className="text-[10px] font-medium text-gray-400">{kpi.label}</div>
                <div className="num-display text-[20px] text-gray-900 leading-none mt-0.5">{kpi.value}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ SOW COMPARISON ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">SOW Comparison</span>
          <span className="text-[11px] text-gray-400">{plan.sowId}</span>
        </div>
        <div className="hidden lg:grid items-center px-5 py-2.5"
          style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", borderBottom: "1px solid var(--border-soft)", background: "color-mix(in srgb, var(--color-gray-100) 40%, white)", fontSize: 10, color: "var(--color-gray-400)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <span>Metric</span><span className="text-center">SOW Scope</span><span className="text-center">Plan Estimate</span><span className="text-center">Variance</span>
        </div>
        {[
          { metric: "Budget", sow: formatCost(sowBudget), plan: formatCost(planCost), variance: budgetVarianceStr, color: budgetVariance <= 0 ? "forest" : "gold" },
          { metric: "Duration", sow: "6 months", plan: plan.criticalPathDuration.toLocaleString() + "h path", variance: "On track", color: "teal" },
          { metric: "Scope Coverage", sow: "12 sections", plan: `${plan.totalMilestones} milestones`, variance: "Mapped", color: "forest" },
          { metric: "Confidentiality", sow: "Internal", plan: "Matched", variance: "Verified", color: "forest" },
          { metric: "Stakeholders", sow: "3 people", plan: "Notified", variance: "Ready", color: "forest" },
        ].map((row, i, arr) => (
          <div key={row.metric} className="grid grid-cols-4 items-center px-5 py-3"
            style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
            <span className="text-[12px] font-medium text-gray-700">{row.metric}</span>
            <span className="text-[12px] text-gray-400 text-center">{row.sow}</span>
            <span className="text-[12px] text-gray-700 text-center font-medium">{row.plan}</span>
            <span className={cn("text-[11px] font-medium text-center", varianceTextColor[row.color])}>{row.variance}</span>
          </div>
        ))}
        <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border-soft)" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-gray-500">Budget Utilization</span>
            <span className="text-[11px] font-semibold text-gray-700">{formatCost(planCost)} / {formatCost(sowBudget)}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className={cn("h-full rounded-full transition-all duration-700", planCost <= sowBudget ? "bg-gradient-to-r from-forest-400 to-forest-500" : "bg-gradient-to-r from-gold-400 to-gold-500")}
              style={{ width: `${Math.min(100, (planCost / sowBudget) * 100)}%` }} />
          </div>
          <div className="flex items-center justify-end mt-1.5 gap-1">
            {planCost <= sowBudget ? <TrendingDown className="w-3 h-3 text-forest-500" /> : <TrendingUp className="w-3 h-3 text-gold-500" />}
            <span className={cn("text-[10px] font-semibold", planCost <= sowBudget ? "text-forest-600" : "text-gold-600")}>{budgetVarianceStr} vs SOW ceiling</span>
          </div>
        </div>
      </motion.div>

      {/* ═══ REQUIRED SKILLS ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Required Skills</span>
          <span className="text-[11px] text-gray-400">{uniqueSkills.length} skills</span>
        </div>
        <div className="px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {skillData.map((sd) => (
              <div key={sd.name} className={cn(
                "inline-flex items-center gap-2 text-[11px] font-medium px-3 py-2 rounded-xl border",
                sd.contributors <= 3 ? "bg-gold-50 border-gold-200 text-gold-700" : "bg-gray-50 border-gray-200 text-gray-700"
              )}>
                <span>{sd.name}</span>
                <span className="text-[9px] font-mono bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{sd.taskCount} tasks</span>
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded", sd.contributors <= 3 ? "bg-gold-100 text-gold-700" : "bg-forest-50 text-forest-700")}>{sd.contributors} avail.</span>
              </div>
            ))}
          </div>
          {skillData.some((sd) => sd.contributors <= 3) && (
            <div className="mt-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-gold-50">
              <AlertTriangle className="w-3.5 h-3.5 text-gold-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-gold-700">
                <span className="font-semibold">Limited availability:</span> {skillData.filter((sd) => sd.contributors <= 3).map((sd) => sd.name).join(", ")} skills have fewer than 4 matching contributors.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ═══ APPROVAL CHECKLIST ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Approval Checklist</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-gray-600">{checkedCount}/{checklistKeys.length}</span>
            <div className="w-16 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className={cn("h-full rounded-full transition-all duration-300", allChecked ? "bg-forest-500" : "bg-brown-400")} style={{ width: `${(checkedCount / checklistKeys.length) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="py-2">
          {[
            { key: "breakdown", label: "Task breakdown verified", desc: "All SOW requirements are covered by the decomposed tasks with no gaps." },
            { key: "dependencies", label: "Dependencies validated", desc: "Task dependency chains are logically correct and do not contain circular references." },
            { key: "estimates", label: "Estimates reviewed", desc: "Hour estimates are realistic and align with historical delivery data." },
            { key: "budget", label: "Budget within SOW limits", desc: "Total estimated cost does not exceed the SOW-approved budget ceiling." },
            { key: "skills", label: "Skills requirements confirmed", desc: "All required skills have sufficient contributors in the platform talent pool." },
          ].map((item, i, arr) => (
            <div key={item.key}
              className={cn("flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors hover:bg-black/[0.02]", checklist[item.key] && "bg-forest-50/30")}
              style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}
              onClick={() => toggleChecklist(item.key)}>
              <Checkbox checked={checklist[item.key]} onCheckedChange={() => toggleChecklist(item.key)} className="mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className={cn("text-[13px] font-medium", checklist[item.key] ? "text-forest-700" : "text-gray-700")}>{item.label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              {checklist[item.key] && <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0 mt-0.5" />}
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ TEAM FORMATION PREVIEW ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-8">
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Team Formation Preview</span>
        </div>
        <div className="px-5 py-4">
          <p className="text-[12px] text-gray-500 leading-relaxed">
            Approving this plan will trigger the AI-powered team formation engine. The system will match <span className="font-semibold text-gray-700">{uniqueSkills.length} required skills</span> against the contributor pool to form an optimal delivery team.
          </p>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {[
              { icon: Sparkles, label: "AI-optimized matching" },
              { icon: ShieldCheck, label: "Privacy-first assignment" },
              { icon: Network, label: "Skill coverage analysis" },
            ].map((f) => {
              const FIcon = f.icon;
              return (
                <div key={f.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                  <FIcon className="w-3.5 h-3.5 text-gray-500" /><span className="text-[11px] text-gray-600 font-medium">{f.label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500">
            <ArrowRight className="w-3 h-3" />
            Expected: {Math.ceil(plan.totalTasks * 0.7)}-{plan.totalTasks} contributors matched within 24 hours
          </div>
        </div>
      </motion.div>

      {/* ═══ ACTIONS ═══ */}
      <motion.div variants={fadeUp}>
        <div className="border-t border-gray-200 pt-5 flex items-center justify-end gap-2">
          <Link href={`/enterprise/decomposition/${plan.id}/edit`}>
            <button className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
              <Undo2 className="w-3.5 h-3.5" /> Request Revisions
            </button>
          </Link>

          <Dialog open={rejectionOpen} onOpenChange={setRejectionOpen}>
            <button onClick={() => setRejectionOpen(true)}
              className="flex items-center gap-1.5 text-[12px] font-medium px-4 py-2 rounded-xl border transition-all"
              style={{ borderColor: "var(--danger)", color: "var(--danger)" }}>
              <Ban className="w-3.5 h-3.5" /> Reject
            </button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Changes</DialogTitle>
                <DialogDescription>Provide specific feedback. The plan status will return to Draft.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-[12px] font-semibold text-gray-800 mb-1.5 block">Rejection Reason</label>
                  <Textarea placeholder="Provide specific feedback about what needs to change..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="min-h-[120px]" />
                  <p className="text-[10px] text-gray-400 mt-1.5">{rejectionReason.length}/500 characters</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-500 mb-2">Quick suggestions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {["Budget exceeds limits", "Timeline too aggressive", "Missing requirements", "Skill gaps unresolved", "Dependencies unclear"].map((reason) => (
                      <button key={reason} type="button"
                        onClick={() => setRejectionReason((prev) => prev ? `${prev}\n- ${reason}` : `- ${reason}`)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors border border-gray-200">
                        {reason}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <button onClick={() => {
                  setRejectionOpen(false);
                  setRejectionReason("");
                }}
                  className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">Cancel</button>
                <button disabled={rejectionReason.trim().length === 0 || revisionMutation.isPending}
                  onClick={() => {
                    revisionMutation.mutate({ reason: rejectionReason }, {
                      onSuccess: () => { setSubmitted(true); setRejectionOpen(false); setRejectionReason(""); },
                      onError: () => { setSubmitted(true); setRejectionOpen(false); setRejectionReason(""); },
                    });
                  }}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 px-4 py-2 rounded-xl disabled:opacity-50">
                  <Send className="w-3.5 h-3.5" /> {revisionMutation.isPending ? "Submitting…" : "Submit"}
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <button disabled={!canApprove || confirmMutation.isPending}
            onClick={() => confirmMutation.mutate(undefined, { onSuccess: () => window.location.href = "/enterprise/team" })}
            className={cn("flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2 rounded-xl transition-all disabled:opacity-50", canApprove && "shadow-md")}>
            <ShieldCheck className="w-3.5 h-3.5" /> {confirmMutation.isPending ? "Approving…" : "Approve & Form Team"} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!canApprove && (
          <div className="mt-3 flex items-center justify-end gap-1.5">
            <Lock className="w-3 h-3 text-gray-400" />
            <p className="text-[11px] text-gray-400">
              {hasErrors ? "Resolve validation errors to unlock approval" : `Complete ${checklistKeys.length - checkedCount} remaining checklist item${checklistKeys.length - checkedCount > 1 ? "s" : ""} to unlock`}
            </p>
          </div>
        )}
      </motion.div>

      {/* Post-submit toast */}
      <AnimatePresence>
        {submitted && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-900 text-white shadow-2xl">
              <CheckCircle2 className="w-4 h-4 text-gold-400" />
              <span className="text-[13px] font-medium">Plan rejected. Status returned to Draft.</span>
              <button onClick={() => setSubmitted(false)} className="text-[11px] text-gray-400 hover:text-white ml-2">Dismiss</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
