"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Clock,
  DollarSign,
  Layers,
  Zap,
  Users,
  AlertTriangle,
  XCircle,
  GitBranch,
  Network,
  Undo2,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Lock,
  ArrowRight,
  ListChecks,
  BarChart3,
  FileText,
  Scale,
  Send,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import {
  Badge,
  Button,
  Checkbox,
  GlassCard,
  GlassCardHeader,
  GlassCardTitle,
  GlassCardContent,
  GlassCardFooter,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  Textarea,
  Progress,
  Separator,
} from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import {
  mockPlans,
  mockTasks,
  mockPlanMilestones,
  mockAIRecommendations,
} from "@/mocks/data/enterprise-projects";
import { mockSOWs } from "@/mocks/data/enterprise-sow";
import type {
  DecompositionTask,
  PlanValidationResult,
  PlanMilestone,
} from "@/types/enterprise";

/* ── Validation status icon + color mapping ── */
const validationConfig = {
  passed: {
    icon: CheckCircle2,
    iconColor: "text-forest-500",
    bg: "bg-forest-50/60",
    border: "border-forest-200/50",
    textColor: "text-forest-700",
    badgeBg: "bg-forest-100 text-forest-700",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-gold-600",
    bg: "bg-gold-50/60",
    border: "border-gold-200/50",
    textColor: "text-gold-700",
    badgeBg: "bg-gold-100 text-gold-700",
  },
  error: {
    icon: XCircle,
    iconColor: "text-red-600",
    bg: "bg-red-50/60",
    border: "border-red-200/50",
    textColor: "text-red-700",
    badgeBg: "bg-red-100 text-red-700",
  },
} as const;

/* ── Validation result row ── */
function ValidationRow({ result }: { result: PlanValidationResult }) {
  const config = validationConfig[result.status];
  const Icon = config.icon;

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "flex items-start gap-3 px-4 py-3 rounded-xl border transition-all",
        config.bg,
        config.border
      )}
    >
      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] font-semibold", config.textColor)}>
          {result.field}
        </p>
        <p className="text-[11px] text-beige-500 mt-0.5">{result.message}</p>
      </div>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0",
          config.badgeBg
        )}
      >
        {result.status}
      </span>
    </motion.div>
  );
}

/* ── Checklist item ── */
function ChecklistItem({
  label,
  description,
  checked,
  onToggle,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-300",
        disabled
          ? "border-beige-200/40 bg-beige-50/30 opacity-60 cursor-not-allowed"
          : checked
            ? "border-forest-200 bg-forest-50/40 cursor-pointer"
            : "border-beige-200/60 bg-white/70 hover:border-beige-300 cursor-pointer"
      )}
      onClick={() => !disabled && onToggle()}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={() => !disabled && onToggle()}
        disabled={disabled}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[13px] font-semibold transition-colors",
            checked ? "text-forest-800" : "text-brown-900"
          )}
        >
          {label}
        </p>
        <p className="text-[11px] text-beige-500 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
      {checked && (
        <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0 mt-0.5" />
      )}
    </motion.div>
  );
}

/* ── Skill badge with availability ── */
function SkillBadge({
  skill,
  taskCount,
  contributors,
}: {
  skill: string;
  taskCount: number;
  contributors: number;
}) {
  const isLimited = contributors <= 3;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-[11px] font-semibold px-3 py-2 rounded-xl border transition-all",
        isLimited
          ? "bg-gold-50/60 border-gold-200/50 text-gold-800"
          : "bg-beige-100/80 border-beige-200/50 text-beige-700"
      )}
    >
      <span>{skill}</span>
      <span className="text-[9px] bg-beige-200/80 text-beige-600 px-1.5 py-0.5 rounded-md font-mono">
        {taskCount} tasks
      </span>
      <span
        className={cn(
          "text-[9px] px-1.5 py-0.5 rounded-md font-medium",
          isLimited
            ? "bg-gold-100 text-gold-700"
            : "bg-forest-100 text-forest-700"
        )}
      >
        {contributors} contributors
      </span>
    </div>
  );
}

/* ── SOW comparison row ── */
function ComparisonRow({
  metric,
  sowValue,
  planValue,
  variance,
  status,
}: {
  metric: string;
  sowValue: string;
  planValue: string;
  variance: string;
  status: "good" | "neutral" | "warning";
}) {
  return (
    <div className="grid grid-cols-4 gap-3 items-center py-3 border-b border-beige-100/60 last:border-0">
      <p className="text-[12px] font-semibold text-brown-800">{metric}</p>
      <p className="text-[12px] text-beige-600 text-center">{sowValue}</p>
      <p className="text-[12px] text-brown-900 font-medium text-center">
        {planValue}
      </p>
      <div className="flex items-center justify-center gap-1">
        {status === "good" && (
          <CheckCircle2 className="w-3 h-3 text-forest-500" />
        )}
        {status === "warning" && (
          <AlertTriangle className="w-3 h-3 text-gold-600" />
        )}
        {status === "neutral" && (
          <Target className="w-3 h-3 text-teal-500" />
        )}
        <span
          className={cn(
            "text-[11px] font-medium",
            status === "good"
              ? "text-forest-600"
              : status === "warning"
                ? "text-gold-600"
                : "text-teal-600"
          )}
        >
          {variance}
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   APPROVE PLAN PAGE — Flow C4
   ══════════════════════════════════════════ */
export default function ApprovePlanPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;
  const plan = mockPlans.find((p) => p.id === planId) ?? mockPlans[0];
  const tasks = mockTasks.filter((t) => t.planId === plan.id);
  const milestones = mockPlanMilestones.filter((m) => m.planId === plan.id);
  const sow = mockSOWs.find((s) => s.id === plan.sowId);

  /* ── Generate plan-specific validation results ── */
  const sowBudgetCeiling = sow?.estimatedBudget ?? 300000;
  const planEstCost = plan.estimatedCost;
  const budgetOk = planEstCost <= sowBudgetCeiling;
  const fmtK = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`);
  const taskCount = tasks.length;
  const tasksWithDesc = tasks.filter((t) => t.description).length;
  const tasksWithSkills = tasks.filter((t) => t.skillsRequired.length > 0).length;
  const tasksWithCriteria = tasks.filter((t) => t.acceptanceCriteria.length > 0).length;
  const softDeps = tasks.filter((t) => t.dependencies.some((d) => d.type === "related")).length;
  const critPathTight = plan.criticalPathDuration > 1800;
  const rareSkillCombos = tasks.some((t) =>
    t.skillsRequired.length >= 2 &&
    t.skillsRequired.every((s) => ["Finance", "HR", "Compliance", "Legal"].includes(s.name))
  );
  const validations: PlanValidationResult[] = [
    { field: "All tasks have descriptions", status: tasksWithDesc === taskCount ? "passed" : "error", message: `${tasksWithDesc}/${taskCount} tasks have descriptions` },
    { field: "Effort estimates complete", status: "passed", message: "All tasks have hour estimates" },
    { field: "Skills tags assigned", status: tasksWithSkills === taskCount ? "passed" : "error", message: tasksWithSkills === taskCount ? "All tasks have at least 1 skill tag" : `${tasksWithSkills}/${taskCount} tasks have skills` },
    { field: "Acceptance criteria defined", status: tasksWithCriteria === taskCount ? "passed" : "warning", message: `${tasksWithCriteria}/${taskCount} tasks have acceptance criteria` },
    { field: "Dependencies validated", status: softDeps > 0 ? "warning" : "passed", message: softDeps > 0 ? `${softDeps} task(s) have soft dependencies that may need review` : "All dependencies are firm blocks" },
    { field: "Budget within SOW limits", status: budgetOk ? "passed" : "error", message: budgetOk ? `Estimated cost ${fmtK(planEstCost)} is within ${fmtK(sowBudgetCeiling)} SOW ceiling` : `Estimated cost ${fmtK(planEstCost)} exceeds ${fmtK(sowBudgetCeiling)} SOW ceiling` },
    { field: "Critical path feasible", status: critPathTight ? "warning" : "passed", message: critPathTight ? `Critical path (${plan.criticalPathDuration.toLocaleString()}h) is tight for the project timeline` : `Critical path (${plan.criticalPathDuration.toLocaleString()}h) is within acceptable range` },
    { field: "Skill coverage available", status: rareSkillCombos ? "error" : "passed", message: rareSkillCombos ? "Rare skill combination has limited matching contributors" : "All required skills have sufficient contributor coverage" },
  ];

  /* ── Checklist state — all unchecked to force deliberate review (#12) ── */
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({
    breakdown: false,
    dependencies: false,
    estimates: false,
    budget: false,
    skills: false,
  });

  /* ── Rejection dialog state ── */
  const [rejectionOpen, setRejectionOpen] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);

  /* ── Validation summary counts ── */
  const passed = validations.filter((v) => v.status === "passed").length;
  const warnings = validations.filter((v) => v.status === "warning").length;
  const errors = validations.filter((v) => v.status === "error").length;
  const hasErrors = errors > 0;

  /* ── Checklist completion ── */
  const checklistKeys = Object.keys(checklist);
  const allChecked = checklistKeys.every((k) => checklist[k]);
  const checkedCount = checklistKeys.filter((k) => checklist[k]).length;
  const canApprove = allChecked && !hasErrors;

  /* ── Skill analysis with mock contributor counts ── */
  const uniqueSkills = Array.from(
    new Set(tasks.flatMap((t) => t.skillsRequired.map((s) => s.name)))
  );
  const skillData = uniqueSkills.map((skill) => {
    const taskCount = tasks.filter((t) =>
      t.skillsRequired.some((s) => s.name === skill)
    ).length;
    // Simulated contributor availability
    const contributorMap: Record<string, number> = {
      DevOps: 8,
      TypeScript: 15,
      Backend: 12,
      Security: 5,
      Database: 7,
      Architecture: 4,
      Frontend: 14,
      Design: 6,
      Finance: 3,
      HR: 2,
      "Full-Stack": 11,
      Data: 5,
      QA: 9,
    };
    return {
      name: skill,
      taskCount,
      contributors: contributorMap[skill] ?? 4,
    };
  });

  /* ── Currency formatter ── */
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  /* ── SOW comparison data ── */
  const sowBudget = sow?.estimatedBudget ?? 300000;
  const planCost = plan.estimatedCost;
  const budgetVariance = ((planCost - sowBudget) / sowBudget) * 100;
  const budgetVarianceStr =
    budgetVariance < 0
      ? `${budgetVariance.toFixed(0)}%`
      : `+${budgetVariance.toFixed(0)}%`;

  /* ── Stats data ── */
  const stats = [
    {
      label: "Milestones",
      value: plan.totalMilestones.toString(),
      icon: Target,
      accent: "from-brown-500 to-brown-600",
      iconBg: "bg-brown-100 text-brown-600",
    },
    {
      label: "Tasks",
      value: plan.totalTasks.toString(),
      icon: Layers,
      accent: "from-teal-500 to-teal-600",
      iconBg: "bg-teal-100 text-teal-600",
    },
    {
      label: "Subtasks",
      value: plan.totalSubtasks.toString(),
      icon: ListChecks,
      accent: "from-forest-500 to-forest-600",
      iconBg: "bg-forest-100 text-forest-600",
    },
    {
      label: "Total Hours",
      value: plan.estimatedHours.toLocaleString() + "h",
      icon: Clock,
      accent: "from-gold-500 to-gold-600",
      iconBg: "bg-gold-100 text-gold-700",
    },
    {
      label: "Est. Cost",
      value: fmt.format(plan.estimatedCost),
      icon: DollarSign,
      accent: "from-forest-500 to-teal-500",
      iconBg: "bg-forest-100 text-forest-600",
    },
    {
      label: "Critical Path",
      value: plan.criticalPathDuration.toLocaleString() + "h",
      icon: Zap,
      accent: "from-brown-500 to-gold-500",
      iconBg: "bg-brown-100 text-brown-600",
    },
    {
      label: "AI Confidence",
      value: plan.aiConfidence + "%",
      icon: Sparkles,
      accent: "from-teal-500 to-forest-500",
      iconBg: "bg-teal-100 text-teal-600",
    },
    {
      label: "Dependencies",
      value: plan.dependencyCount.toString(),
      icon: GitBranch,
      accent: "from-beige-400 to-brown-500",
      iconBg: "bg-beige-200 text-brown-600",
    },
  ];

  const toggleChecklist = (key: string) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  /* ── Already approved/in_progress/completed — show confirmation view ── */
  const isAlreadyApproved = plan.status === "approved" || plan.status === "in_progress" || plan.status === "completed";

  if (isAlreadyApproved) {
    const statusDisplay = {
      approved: { label: "Approved", sublabel: "Ready for team formation", icon: ShieldCheck, gradient: "from-forest-500 to-teal-500", bg: "bg-forest-50", border: "border-forest-200/50", text: "text-forest-700", nextLabel: "Proceed to Team Formation", nextHref: "/enterprise/team" },
      in_progress: { label: "In Progress", sublabel: "Project delivery is active", icon: Zap, gradient: "from-teal-500 to-forest-500", bg: "bg-teal-50", border: "border-teal-200/50", text: "text-teal-700", nextLabel: "View Active Project", nextHref: `/enterprise/projects/${plan.projectId ?? "proj-001"}` },
      completed: { label: "Completed", sublabel: "Project delivery finished", icon: CheckCircle2, gradient: "from-brown-500 to-gold-500", bg: "bg-brown-50", border: "border-brown-200/50", text: "text-brown-700", nextLabel: "View Completed Project", nextHref: `/enterprise/projects/${plan.projectId ?? "proj-001"}` },
    } as const;
    const display = statusDisplay[plan.status as "approved" | "in_progress" | "completed"];
    const DisplayIcon = display.icon;

    return (
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-[900px] mx-auto space-y-7 pb-12"
      >
        {/* Back */}
        <motion.div variants={fadeUp}>
          <Link
            href={`/enterprise/decomposition/${plan.id}`}
            className="inline-flex items-center gap-1.5 text-[12px] text-beige-500 hover:text-brown-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Plan Detail
          </Link>
        </motion.div>

        {/* Approval Confirmation Card */}
        <motion.div variants={scaleIn}>
          <GlassCard padding="none" className="overflow-hidden">
            <div className={cn("px-8 py-10 text-center relative", display.bg)}>
              {/* Decorative gradient orb */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-br opacity-10 blur-3xl pointer-events-none" style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />

              <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-br mx-auto flex items-center justify-center shadow-lg mb-5", display.gradient)}>
                <DisplayIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
                Plan {display.label}
              </h1>
              <p className="text-[13px] text-beige-500 mt-1">{display.sublabel}</p>
              <p className="text-[12px] text-beige-400 mt-2">
                {plan.title} <span className="mx-1">·</span> <span className="text-teal-600 font-medium">v{plan.version}</span>
              </p>
            </div>

            {/* Approval Details */}
            <div className="px-8 py-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-beige-50/60 border border-beige-200/40 p-4">
                  <p className="text-[10px] text-beige-400 uppercase tracking-wider font-semibold mb-1">Approved On</p>
                  <p className="text-[13px] font-semibold text-brown-800">{new Date(plan.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <div className="rounded-xl bg-beige-50/60 border border-beige-200/40 p-4">
                  <p className="text-[10px] text-beige-400 uppercase tracking-wider font-semibold mb-1">Approved By</p>
                  <p className="text-[13px] font-semibold text-brown-800">Priya Nair (Enterprise Admin)</p>
                </div>
              </div>

              {/* Validation summary — all passed at approval time */}
              <div className="rounded-xl bg-forest-50/40 border border-forest-200/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-4 h-4 text-forest-500" />
                  <p className="text-[12px] font-semibold text-forest-800">All Validations Passed at Approval</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["Task breakdown verified", "Dependencies validated", "Estimates reviewed", "Budget within SOW limits", "Skills requirements confirmed"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[11px] text-forest-700">
                      <CheckCircle2 className="w-3 h-3 text-forest-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="px-8 py-5 bg-beige-50/30 border-t border-beige-200/40 flex items-center justify-between">
              <Link href={`/enterprise/decomposition/${plan.id}`}>
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  View Plan Details
                </Button>
              </Link>
              <Link href={display.nextHref}>
                <Button variant="gradient-primary" size="sm">
                  {display.nextLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </motion.div>

        {/* Plan Summary Stats — still useful for reference */}
        <motion.div variants={fadeUp}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-beige-400" />
            <h2 className="text-[14px] font-bold text-brown-900">Plan Summary</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={scaleIn}
                className="rounded-xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className={cn("w-9 h-9 rounded-lg mx-auto flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110", stat.iconBg)}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <p className="text-[17px] font-bold text-brown-900 tracking-tight leading-none">{stat.value}</p>
                <p className="text-[10px] text-beige-500 mt-1 font-medium uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[900px] mx-auto space-y-7 pb-12"
    >
      {/* ── Back + Header ── */}
      <motion.div variants={fadeUp}>
        <Link
          href={`/enterprise/decomposition/${plan.id}`}
          className="inline-flex items-center gap-1.5 text-[12px] text-beige-500 hover:text-brown-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Plan Detail
        </Link>

        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forest-500 to-teal-500 flex items-center justify-center shrink-0 shadow-lg shadow-forest-500/20">
            <ShieldCheck className="w-5.5 h-5.5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-[20px] font-bold text-brown-900 tracking-[-0.02em]">
              Review & Approve Plan
            </h1>
            <p className="text-[12px] text-beige-500 mt-0.5">
              {plan.title}{" "}
              <span className="text-beige-400 mx-1">*</span>
              <span className="text-teal-600 font-medium">v{plan.version}</span>
            </p>
          </div>
          {/* Validation summary badges in header */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-forest-50 border border-forest-200/50">
              <CheckCircle2 className="w-3 h-3 text-forest-500" />
              <span className="text-[11px] font-semibold text-forest-700">
                {passed}
              </span>
            </div>
            {warnings > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gold-50 border border-gold-200/50">
                <AlertTriangle className="w-3 h-3 text-gold-600" />
                <span className="text-[11px] font-semibold text-gold-700">
                  {warnings}
                </span>
              </div>
            )}
            {errors > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200/50">
                <XCircle className="w-3 h-3 text-red-600" />
                <span className="text-[11px] font-semibold text-red-700">
                  {errors}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ══ SECTION 1: Pre-Approval Validation ══ */}
      <motion.div variants={fadeUp}>
        <GlassCard padding="none" className="overflow-hidden">
          <div className="px-6 pt-5 pb-4">
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-forest-500 to-teal-500 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-[14px] font-bold text-brown-900 tracking-tight">
                Pre-Approval Validation
              </h2>
            </div>
            <p className="text-[11px] text-beige-500 ml-[34px]">
              System checks for plan completeness and readiness
            </p>
          </div>

          <div className="px-6 pb-5 space-y-2">
            {validations.map((v, i) => (
              <ValidationRow key={i} result={v} />
            ))}
          </div>

          {/* Validation summary bar */}
          <div className="px-6 py-3.5 bg-beige-50/50 border-t border-beige-200/40 flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest-100/80">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
              <span className="text-[11px] font-semibold text-forest-700">
                {passed} passed
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-100/80">
              <AlertTriangle className="w-3.5 h-3.5 text-gold-600" />
              <span className="text-[11px] font-semibold text-gold-700">
                {warnings} warnings
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100/80">
              <XCircle className="w-3.5 h-3.5 text-red-600" />
              <span className="text-[11px] font-semibold text-red-700">
                {errors} errors
              </span>
            </div>
            <div className="flex-1" />
            <Progress
              value={(passed / validations.length) * 100}
              variant="gradient-forest"
              size="sm"
              className="w-32"
            />
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {hasErrors && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 py-3 bg-red-50 border-t border-red-200/40 flex items-center gap-2.5">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[12px] font-semibold text-red-700">
                    {errors} validation error{errors > 1 ? "s" : ""} must be
                    resolved before approval
                  </p>
                  <div className="flex-1" />
                  <Link href={`/enterprise/decomposition/${plan.id}/edit`}>
                    <Button variant="outline" size="sm" className="h-7 text-[11px] border-red-300 text-red-600 hover:bg-red-50">
                      Fix Issues
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* ══ SECTION 2: Plan Summary Stats ══ */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-beige-400" />
          <h2 className="text-[14px] font-bold text-brown-900">
            Plan Summary
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={scaleIn}
              className="rounded-xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-lg mx-auto flex items-center justify-center mb-2.5 transition-transform group-hover:scale-110",
                  stat.iconBg
                )}
              >
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-[17px] font-bold text-brown-900 tracking-tight leading-none">
                {stat.value}
              </p>
              <p className="text-[10px] text-beige-500 mt-1 font-medium uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ══ SECTION 3: SOW Comparison ══ */}
      <motion.div variants={fadeUp}>
        <GlassCard padding="none" className="overflow-hidden">
          <div className="px-6 pt-5 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brown-500 to-gold-500 flex items-center justify-center">
                <Scale className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h2 className="text-[14px] font-bold text-brown-900 tracking-tight">
                  SOW Comparison
                </h2>
                <p className="text-[11px] text-beige-500">
                  Plan estimates vs. original SOW scope
                </p>
              </div>
            </div>
            {sow && (
              <Badge
                variant="beige"
                size="sm"
                className="text-[10px]"
              >
                {sow.title}
              </Badge>
            )}
          </div>

          <div className="px-6 pb-5">
            {/* Column headers */}
            <div className="grid grid-cols-4 gap-3 pb-2.5 border-b border-beige-200/50 mb-1">
              <p className="text-[10px] font-semibold text-beige-400 uppercase tracking-wider">
                Metric
              </p>
              <p className="text-[10px] font-semibold text-beige-400 uppercase tracking-wider text-center">
                SOW Scope
              </p>
              <p className="text-[10px] font-semibold text-beige-400 uppercase tracking-wider text-center">
                Plan Estimate
              </p>
              <p className="text-[10px] font-semibold text-beige-400 uppercase tracking-wider text-center">
                Variance
              </p>
            </div>

            <ComparisonRow
              metric="Budget"
              sowValue={fmt.format(sowBudget)}
              planValue={fmt.format(planCost)}
              variance={budgetVarianceStr}
              status={budgetVariance <= 0 ? "good" : "warning"}
            />
            <ComparisonRow
              metric="Duration"
              sowValue={sow?.estimatedDuration ?? "6 months"}
              planValue={plan.criticalPathDuration.toLocaleString() + "h path"}
              variance="On track"
              status="neutral"
            />
            <ComparisonRow
              metric="Scope Coverage"
              sowValue={`${sow?.totalSections ?? 12} sections`}
              planValue={`${plan.totalMilestones} milestones`}
              variance="Mapped"
              status="good"
            />
            <ComparisonRow
              metric="Confidentiality"
              sowValue={
                sow?.confidentiality
                  ? sow.confidentiality.charAt(0).toUpperCase() +
                    sow.confidentiality.slice(1)
                  : "Internal"
              }
              planValue="Matched"
              variance="Verified"
              status="good"
            />
            <ComparisonRow
              metric="Stakeholders"
              sowValue={`${sow?.stakeholders.length ?? 3} people`}
              planValue="Notified"
              variance="Ready"
              status="good"
            />
          </div>

          {/* Budget comparison visual bar */}
          <div className="px-6 py-4 bg-beige-50/50 border-t border-beige-200/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-beige-600">
                Budget Utilization
              </span>
              <span className="text-[11px] font-semibold text-brown-700">
                {fmt.format(planCost)} / {fmt.format(sowBudget)}
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-beige-200/60 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(planCost / sowBudget) * 100}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  planCost <= sowBudget
                    ? "bg-gradient-to-r from-forest-400 to-forest-500"
                    : "bg-gradient-to-r from-gold-400 to-gold-500"
                )}
              />
              {/* SOW budget line marker */}
              <div className="absolute inset-y-0 right-0 w-px bg-brown-400/60" />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-beige-400">$0</span>
              <div className="flex items-center gap-1">
                {planCost <= sowBudget ? (
                  <TrendingDown className="w-3 h-3 text-forest-500" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-gold-500" />
                )}
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    planCost <= sowBudget ? "text-forest-600" : "text-gold-600"
                  )}
                >
                  {budgetVarianceStr} vs SOW ceiling
                </span>
              </div>
              <span className="text-[10px] text-beige-400">
                {fmt.format(sowBudget)}
              </span>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* ══ SECTION 4: Required Skills ══ */}
      <motion.div variants={fadeUp}>
        <GlassCard padding="md">
          <GlassCardHeader className="mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal-500 to-forest-500 flex items-center justify-center">
                <GitBranch className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <GlassCardTitle className="text-[14px]">
                  Required Skills ({uniqueSkills.length})
                </GlassCardTitle>
                <p className="text-[11px] text-beige-500">
                  Skill coverage and contributor availability
                </p>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="flex flex-wrap gap-2.5">
              {skillData.map((sd) => (
                <SkillBadge
                  key={sd.name}
                  skill={sd.name}
                  taskCount={sd.taskCount}
                  contributors={sd.contributors}
                />
              ))}
            </div>
            {/* Warning for limited skills */}
            {skillData.some((sd) => sd.contributors <= 3) && (
              <div className="mt-4 flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl bg-gold-50/60 border border-gold-200/40">
                <AlertTriangle className="w-3.5 h-3.5 text-gold-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-gold-700 leading-relaxed">
                  <span className="font-semibold">Limited availability:</span>{" "}
                  {skillData
                    .filter((sd) => sd.contributors <= 3)
                    .map((sd) => sd.name)
                    .join(", ")}{" "}
                  skills have fewer than 4 matching contributors in the talent
                  pool.
                </p>
              </div>
            )}
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* ══ SECTION 5: Approval Checklist ══ */}
      <motion.div variants={fadeUp}>
        <GlassCard padding="md">
          <GlassCardHeader className="mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
                <div>
                  <GlassCardTitle className="text-[14px]">
                    Approval Checklist
                  </GlassCardTitle>
                  <p className="text-[11px] text-beige-500">
                    Complete all items below before approving this plan
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-brown-700">
                  {checkedCount}/{checklistKeys.length}
                </span>
                <div className="w-16">
                  <Progress
                    value={(checkedCount / checklistKeys.length) * 100}
                    variant={allChecked ? "gradient-forest" : "gradient-brown"}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-2.5">
              <ChecklistItem
                label="Task breakdown verified"
                description="All SOW requirements are covered by the decomposed tasks with no gaps."
                checked={checklist.breakdown}
                onToggle={() => toggleChecklist("breakdown")}
              />
              <ChecklistItem
                label="Dependencies validated"
                description="Task dependency chains are logically correct and do not contain circular references."
                checked={checklist.dependencies}
                onToggle={() => toggleChecklist("dependencies")}
              />
              <ChecklistItem
                label="Estimates reviewed"
                description="Hour estimates are realistic and align with historical delivery data."
                checked={checklist.estimates}
                onToggle={() => toggleChecklist("estimates")}
              />
              <ChecklistItem
                label="Budget within SOW limits"
                description="Total estimated cost does not exceed the SOW-approved budget ceiling."
                checked={checklist.budget}
                onToggle={() => toggleChecklist("budget")}
              />
              <ChecklistItem
                label="Skills requirements confirmed"
                description="All required skills have sufficient contributors in the platform talent pool."
                checked={checklist.skills}
                onToggle={() => toggleChecklist("skills")}
              />
            </div>
          </GlassCardContent>
        </GlassCard>
      </motion.div>

      {/* ══ SECTION 6: Team Formation Preview ══ */}
      <motion.div variants={scaleIn}>
        <div className="rounded-2xl border-2 border-dashed border-teal-200/70 bg-gradient-to-br from-teal-50/50 via-white/50 to-beige-50/50 p-6 relative overflow-hidden">
          {/* Decorative gradient orb */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-teal-400/5 blur-3xl pointer-events-none" />

          <div className="flex items-start gap-4 relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-forest-500 flex items-center justify-center shrink-0 shadow-lg shadow-teal-500/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-bold text-brown-900">
                Team Formation Preview
              </h3>
              <p className="text-[12px] text-beige-600 mt-1 leading-relaxed">
                Approving this plan will trigger the AI-powered team formation
                engine. The system will match{" "}
                <span className="font-semibold text-teal-700">
                  {uniqueSkills.length} required skills
                </span>{" "}
                against the contributor pool to form an optimal delivery team.
              </p>

              {/* Formation steps preview */}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 border border-teal-200/40">
                  <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                  <span className="text-[11px] text-brown-700 font-medium">
                    AI-optimized matching
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 border border-teal-200/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-forest-500" />
                  <span className="text-[11px] text-brown-700 font-medium">
                    Privacy-first assignment
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 border border-teal-200/40">
                  <Network className="w-3.5 h-3.5 text-teal-500" />
                  <span className="text-[11px] text-brown-700 font-medium">
                    Skill coverage analysis
                  </span>
                </div>
              </div>

              {/* Expected outcome */}
              <div className="mt-3 flex items-center gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-[11px] text-teal-600 font-medium">
                  Expected: {Math.ceil(plan.totalTasks * 0.7)}-
                  {plan.totalTasks} contributors matched within 24 hours
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══ SECTION 7: CTAs ══ */}
      <motion.div variants={fadeUp}>
        <Separator className="mb-6" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Edit link */}
          <Link href={`/enterprise/decomposition/${plan.id}/edit`}>
            <Button variant="outline" size="md" className="w-full sm:w-auto">
              <Undo2 className="w-4 h-4" />
              Request Revisions
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            {/* Reject button */}
            <Dialog open={rejectionOpen} onOpenChange={setRejectionOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="md"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                >
                  <Ban className="w-4 h-4" />
                  Reject with Reasons
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <Ban className="w-4 h-4 text-red-600" />
                    </div>
                    Request Changes
                  </DialogTitle>
                  <DialogDescription>
                    Provide specific feedback for the decomposition team. The
                    plan status will return to Draft.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div>
                    <label className="text-[12px] font-semibold text-brown-800 mb-1.5 block">
                      Rejection Reason
                    </label>
                    <Textarea
                      placeholder="Provide specific feedback about what needs to change..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="min-h-[140px]"
                    />
                    <p className="text-[10px] text-beige-400 mt-1.5">
                      {rejectionReason.length}/500 characters
                    </p>
                  </div>

                  {/* Quick reason chips */}
                  <div>
                    <p className="text-[11px] font-medium text-beige-500 mb-2">
                      Quick suggestions
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "Budget exceeds limits",
                        "Timeline too aggressive",
                        "Missing requirements",
                        "Skill gaps unresolved",
                        "Dependencies unclear",
                      ].map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() =>
                            setRejectionReason((prev) =>
                              prev
                                ? `${prev}\n- ${reason}`
                                : `- ${reason}`
                            )
                          }
                          className="text-[10px] px-2.5 py-1 rounded-lg bg-beige-100 text-beige-600 hover:bg-beige-200 hover:text-brown-700 transition-colors border border-beige-200/50"
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setRejectionOpen(false);
                      setRejectionReason("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={rejectionReason.trim().length === 0}
                    onClick={() => {
                      setSubmitted(true);
                      setRejectionOpen(false);
                      setRejectionReason("");
                    }}
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Rejection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Approve button */}
            <Link
              href="/enterprise/team"
              className={cn(!canApprove && "pointer-events-none")}
            >
              <Button
                variant="gradient-forest"
                size="md"
                disabled={!canApprove}
                className={cn(
                  "px-8 relative overflow-hidden",
                  canApprove &&
                    "shadow-lg shadow-forest-500/25 hover:shadow-xl hover:shadow-forest-500/30"
                )}
              >
                {/* Pulse glow effect when ready */}
                {canApprove && (
                  <span className="absolute inset-0 rounded-xl animate-pulse bg-white/10 pointer-events-none" />
                )}
                <ShieldCheck className="w-4 h-4" />
                Approve & Form Team
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Disabled approval helper text */}
        <AnimatePresence>
          {!canApprove && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-3 flex items-center justify-end gap-2"
            >
              <Lock className="w-3 h-3 text-beige-400" />
              <p className="text-[11px] text-beige-400">
                {hasErrors
                  ? "Resolve validation errors to unlock approval"
                  : `Complete ${checklistKeys.length - checkedCount} remaining checklist item${checklistKeys.length - checkedCount > 1 ? "s" : ""} to unlock approval`}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Post-submit confirmation toast (simple inline) ── */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-brown-900 text-white shadow-2xl shadow-brown-900/30">
              <CheckCircle2 className="w-4 h-4 text-gold-400" />
              <span className="text-[13px] font-medium">
                Plan rejected. Status returned to Draft.
              </span>
              <button
                onClick={() => setSubmitted(false)}
                className="text-[11px] text-beige-300 hover:text-white ml-2 transition-colors"
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
