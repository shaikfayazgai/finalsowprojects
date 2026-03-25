"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  Download,
  Scissors,
  ShieldAlert,
  Link2,
  Lock,
  Sparkles,
  ListChecks,
  Hash,
  Timer,
  Gauge,
  Brain,
  Milestone as MilestoneIcon,
  FileText,
  FileSpreadsheet,
  FileDown,
  AlertCircle,
  ExternalLink,
  FolderOpen,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, fadeIn, slideInRight, scaleIn } from "@/lib/utils/motion-variants";
import {
  Badge,
  Button,
  Progress,
  ScrollArea,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { StatusTimeline } from "@/components/enterprise/status-timeline";
import {
  mockPlans,
  mockTasks,
  mockPlanMilestones,
  mockAIRecommendations,
} from "@/mocks/data/enterprise-projects";
import { mockSOWs } from "@/mocks/data/enterprise-sow";
import type {
  DecompositionTask,
  PlanMilestone,
  PlanStatus,
  TaskStatus,
  AIRecommendation,
  SkillTag,
  Subtask,
} from "@/types/enterprise";

/* ══════════════════════════════════════════
   CONFIG MAPS
   ══════════════════════════════════════════ */

const planStatusBadge: Record<
  PlanStatus,
  { variant: "beige" | "gold" | "teal" | "forest" | "brown"; label: string }
> = {
  draft: { variant: "beige", label: "Draft" },
  pending_review: { variant: "gold", label: "Pending Review" },
  approved: { variant: "teal", label: "Approved" },
  in_progress: { variant: "forest", label: "In Progress" },
  completed: { variant: "brown", label: "Completed" },
};

const taskStatusConfig: Record<
  TaskStatus,
  {
    variant: "beige" | "teal" | "gold" | "forest" | "danger" | "brown";
    label: string;
    icon: React.ElementType;
    dotColor: string;
  }
> = {
  backlog: { variant: "beige", label: "Backlog", icon: Circle, dotColor: "bg-beige-400" },
  in_progress: { variant: "teal", label: "In Progress", icon: Zap, dotColor: "bg-teal-500" },
  in_review: { variant: "gold", label: "In Review", icon: Clock, dotColor: "bg-gold-500" },
  rework: { variant: "danger", label: "Rework", icon: AlertTriangle, dotColor: "bg-red-500" },
  accepted: { variant: "forest", label: "Accepted", icon: CheckCircle2, dotColor: "bg-forest-500" },
  rejected: { variant: "danger", label: "Rejected", icon: AlertTriangle, dotColor: "bg-red-500" },
};

const priorityConfig: Record<string, { variant: "beige" | "teal" | "gold" | "brown"; label: string }> = {
  low: { variant: "beige", label: "Low" },
  medium: { variant: "teal", label: "Medium" },
  high: { variant: "gold", label: "High" },
  critical: { variant: "brown", label: "Critical" },
};

const recTypeIcon: Record<AIRecommendation["type"], React.ElementType> = {
  split: Scissors,
  dependency: GitBranch,
  skill_gap: AlertTriangle,
  effort: Clock,
  risk: ShieldAlert,
};

const recSeverityColor: Record<AIRecommendation["severity"], string> = {
  info: "text-teal-600 bg-teal-50 border-teal-200/60",
  warning: "text-gold-700 bg-gold-50 border-gold-200/60",
  critical: "text-brown-700 bg-brown-50 border-brown-200/60",
};

const depTypeIcon: Record<string, React.ElementType> = {
  blocks: Lock,
  related: Link2,
};

/* ══════════════════════════════════════════
   AI CONFIDENCE GAUGE (inline mini component)
   ══════════════════════════════════════════ */
function ConfidenceGauge({
  value,
  size = "md",
}: {
  value: number;
  size?: "sm" | "md";
}) {
  const color =
    value >= 90
      ? "from-forest-400 to-forest-500"
      : value >= 75
        ? "from-teal-400 to-teal-500"
        : value >= 60
          ? "from-gold-400 to-gold-500"
          : "from-brown-400 to-brown-500";

  const barWidth = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn("flex items-center gap-2", size === "sm" ? "w-16" : "w-20")}>
      <div className="flex-1 h-1.5 rounded-full bg-beige-100 overflow-hidden">
        <div
          className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", color)}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <span
        className={cn(
          "font-mono font-bold tabular-nums",
          size === "sm" ? "text-[9px]" : "text-[10px]",
          value >= 90
            ? "text-forest-600"
            : value >= 75
              ? "text-teal-600"
              : value >= 60
                ? "text-gold-600"
                : "text-brown-600"
        )}
      >
        {value}%
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════
   SKILL CHIP (with AI/Manual source badge)
   ══════════════════════════════════════════ */
function SkillChip({ skill, size = "sm" }: { skill: SkillTag; size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-beige-100/80 text-beige-700 font-semibold border border-beige-200/50",
        size === "sm" ? "text-[9px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"
      )}
    >
      {skill.name}
      <span
        className={cn(
          "rounded px-1 py-px font-bold uppercase tracking-wider",
          skill.source === "ai"
            ? "bg-teal-100 text-teal-600 text-[7px]"
            : "bg-beige-200 text-beige-500 text-[7px]"
        )}
      >
        {skill.source === "ai" ? "AI" : "Manual"}
      </span>
    </span>
  );
}

/* ══════════════════════════════════════════
   SUBTASK ROW
   ══════════════════════════════════════════ */
function SubtaskRow({
  subtask,
  isLast,
  onSelect,
}: {
  subtask: Subtask;
  isLast: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="flex items-start gap-2.5 w-full text-left group py-1.5 pl-1"
    >
      {/* Tree connector */}
      <div className="flex items-center gap-0 shrink-0 mt-1">
        <span className="text-beige-300 text-[11px] font-mono select-none">
          {isLast ? "\u2514" : "\u251C"}
        </span>
        <span className="w-2 h-px bg-beige-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-brown-700 group-hover:text-brown-900 transition-colors truncate">
          {subtask.title}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[9px] text-beige-400 font-mono">{subtask.estimatedHours}h</span>
        <ConfidenceGauge value={subtask.aiConfidence} size="sm" />
      </div>
    </button>
  );
}

/* ══════════════════════════════════════════
   TASK CARD (within milestone tree)
   ══════════════════════════════════════════ */
function TaskTreeCard({
  task,
  allTasks,
  isSelected,
  onSelect,
}: {
  task: DecompositionTask;
  allTasks: DecompositionTask[];
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const status = taskStatusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const StatusIcon = status.icon;
  const hasSubtasks = task.subtasks.length > 0;

  const deps = task.dependencies
    .map((d) => {
      const target = allTasks.find((t) => t.id === d.targetId);
      return target ? { ...d, title: target.title } : null;
    })
    .filter(Boolean) as (typeof task.dependencies[0] & { title: string })[];

  return (
    <motion.div variants={fadeUp} className="relative">
      {/* Main task row */}
      <div
        className={cn(
          "group relative rounded-xl border bg-white/80 backdrop-blur-sm transition-all duration-300 cursor-pointer",
          isSelected
            ? "border-brown-300 bg-brown-50/30 shadow-lg shadow-brown-100/20 ring-1 ring-brown-200/40"
            : "border-beige-200/60 hover:shadow-lg hover:shadow-brown-100/15 hover:border-beige-300/80"
        )}
      >
        <div className="p-3.5" onClick={() => onSelect(task.id)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 flex-1 min-w-0">
              {/* Expand/collapse toggle */}
              {hasSubtasks ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpanded(!expanded);
                  }}
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 bg-beige-100/60 hover:bg-beige-200/80 transition-colors"
                >
                  {expanded ? (
                    <ChevronDown className="w-3 h-3 text-beige-500" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-beige-500" />
                  )}
                </button>
              ) : (
                <div className="w-6 h-6 shrink-0" />
              )}
              {/* Status icon */}
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                  task.status === "accepted" && "bg-forest-100 text-forest-600",
                  task.status === "in_progress" && "bg-teal-100 text-teal-600",
                  task.status === "in_review" && "bg-gold-100 text-gold-600",
                  task.status === "rework" && "bg-red-50 text-red-600",
                  task.status === "rejected" && "bg-red-50 text-red-600",
                  task.status === "backlog" && "bg-beige-100 text-beige-500"
                )}
              >
                <StatusIcon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-brown-900 leading-tight truncate">
                  {task.title}
                </p>
                <p className="text-[11px] text-beige-500 mt-0.5 line-clamp-1 leading-relaxed">
                  {task.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ConfidenceGauge value={task.aiConfidence} />
              <Badge variant={status.variant} size="sm">
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2.5 mt-2.5 ml-[3.75rem] flex-wrap">
            <Badge variant={priority.variant} size="sm">
              {priority.label}
            </Badge>
            <span className="text-[10px] text-beige-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.estimatedHours}h
            </span>
            {hasSubtasks && (
              <span className="text-[10px] text-beige-500 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {task.subtasks.length} subtask{task.subtasks.length > 1 ? "s" : ""}
              </span>
            )}
            {deps.length > 0 && (
              <span className="text-[10px] text-teal-600 flex items-center gap-1">
                <GitBranch className="w-3 h-3" />
                {deps.length} dep{deps.length > 1 ? "s" : ""}
              </span>
            )}
            {/* Skill chips (first 3) */}
            {task.skillsRequired.slice(0, 3).map((s) => (
              <SkillChip key={s.name} skill={s} />
            ))}
            {task.skillsRequired.length > 3 && (
              <span className="text-[9px] text-beige-400 font-medium">
                +{task.skillsRequired.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Selected indicator left bar */}
        {isSelected && (
          <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-gradient-to-b from-brown-400 to-brown-500" />
        )}
      </div>

      {/* Expanded subtasks */}
      <AnimatePresence>
        {expanded && hasSubtasks && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <div className="ml-12 pl-3 border-l-2 border-beige-200/40 mt-1 mb-1 space-y-0">
              {task.subtasks.map((st, i) => (
                <SubtaskRow
                  key={st.id}
                  subtask={st}
                  isLast={i === task.subtasks.length - 1}
                  onSelect={() => onSelect(task.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MILESTONE GROUP (top-level in hierarchy)
   ══════════════════════════════════════════ */
function MilestoneGroup({
  milestone,
  tasks,
  allTasks,
  selectedTaskId,
  onSelectTask,
}: {
  milestone: PlanMilestone;
  tasks: DecompositionTask[];
  allTasks: DecompositionTask[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(true);
  const completedCount = tasks.filter((t) => t.status === "accepted").length;
  const milestoneTotalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);
  const milestoneProgress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const milestoneStatusColor =
    milestone.itemStatus === "accepted"
      ? "from-forest-500 to-forest-600"
      : milestone.itemStatus === "modified"
        ? "from-gold-500 to-gold-600"
        : "from-beige-400 to-beige-500";

  return (
    <motion.div variants={fadeUp} className="space-y-3">
      {/* Milestone header */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full text-left group"
      >
        <div
          className={cn(
            "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105",
            milestoneStatusColor
          )}
        >
          <MilestoneIcon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-brown-900 truncate">
              {milestone.title}
            </h3>
            <Badge
              variant={milestone.itemStatus === "accepted" ? "forest" : "beige"}
              size="sm"
            >
              {milestone.itemStatus === "accepted" ? "Complete" : "Proposed"}
            </Badge>
          </div>
          <p className="text-[11px] text-beige-500 mt-0.5 flex items-center gap-2">
            <span>{completedCount}/{tasks.length} tasks</span>
            <span className="text-beige-300">&middot;</span>
            <span>{milestone.subtaskCount} subtasks</span>
            <span className="text-beige-300">&middot;</span>
            <span>{milestoneTotalHours.toLocaleString()}h</span>
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ConfidenceGauge value={milestone.aiConfidence} />
          <div className="w-20">
            <Progress
              value={milestoneProgress}
              size="sm"
              variant="gradient-forest"
            />
          </div>
          {open ? (
            <ChevronDown className="w-4 h-4 text-beige-400 transition-transform" />
          ) : (
            <ChevronRight className="w-4 h-4 text-beige-400 transition-transform" />
          )}
        </div>
      </button>

      {/* Milestone description */}
      {open && milestone.description && (
        <p className="text-[11px] text-beige-500 ml-12 -mt-1 italic">
          {milestone.description}
        </p>
      )}

      {/* Tasks under this milestone */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden"
          >
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="space-y-2.5 pl-4 border-l-2 border-beige-200/50 ml-4"
            >
              {tasks.map((task) => (
                <TaskTreeCard
                  key={task.id}
                  task={task}
                  allTasks={allTasks}
                  isSelected={selectedTaskId === task.id}
                  onSelect={onSelectTask}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   AI RECOMMENDATION CARD
   ══════════════════════════════════════════ */
function RecommendationCard({
  rec,
  allTasks,
  onAccept,
  onDismiss,
}: {
  rec: AIRecommendation;
  allTasks: DecompositionTask[];
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const Icon = recTypeIcon[rec.type];
  const affectedTask = rec.affectedTaskId
    ? allTasks.find((t) => t.id === rec.affectedTaskId)
    : null;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-3.5 transition-all duration-300",
        recSeverityColor[rec.severity],
        rec.dismissed && "opacity-40"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          rec.severity === "info" && "bg-teal-100",
          rec.severity === "warning" && "bg-gold-100",
          rec.severity === "critical" && "bg-brown-100"
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-[12px] font-semibold leading-tight",
            rec.dismissed && "line-through"
          )}
        >
          {rec.title}
        </p>
        <p
          className={cn(
            "text-[11px] mt-1 leading-relaxed opacity-80",
            rec.dismissed && "line-through"
          )}
        >
          {rec.description}
        </p>
        {affectedTask && (
          <p className="text-[10px] mt-1.5 opacity-60 flex items-center gap-1">
            <Target className="w-3 h-3" />
            Affects: {affectedTask.title}
          </p>
        )}
        {rec.suggestion && (
          <div className="mt-2 rounded-lg bg-white/60 backdrop-blur-sm border border-current/10 px-2.5 py-1.5">
            <p className="text-[10px] font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Suggestion
            </p>
            <p className="text-[10px] mt-0.5 opacity-70">{rec.suggestion}</p>
          </div>
        )}
        {!rec.dismissed && (
          <div className="flex items-center gap-2 mt-2.5">
            <Button
              variant="secondary"
              size="sm"
              className="h-6 px-3 text-[10px]"
              onClick={() => onAccept(rec.id)}
            >
              <CheckCircle2 className="w-3 h-3" />
              Accept
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-3 text-[10px]"
              onClick={() => onDismiss(rec.id)}
            >
              <X className="w-3 h-3" />
              Dismiss
            </Button>
          </div>
        )}
      </div>
      {rec.severity === "critical" && !rec.dismissed && (
        <Badge variant="brown" size="sm" className="h-fit shrink-0">
          Critical
        </Badge>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   TASK DETAIL SIDE PANEL (slides from right)
   ══════════════════════════════════════════ */
function TaskDetailPanel({
  task,
  allTasks,
  planId,
  onClose,
}: {
  task: DecompositionTask;
  allTasks: DecompositionTask[];
  planId: string;
  onClose: () => void;
}) {
  const status = taskStatusConfig[task.status];
  const StatusIcon = status.icon;
  const priority = priorityConfig[task.priority];

  const deps = task.dependencies
    .map((d) => {
      const target = allTasks.find((t) => t.id === d.targetId);
      return target ? { dep: d, task: target } : null;
    })
    .filter(Boolean) as { dep: (typeof task.dependencies)[0]; task: DecompositionTask }[];

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed right-0 top-0 bottom-0 w-full max-w-[420px] z-50 bg-white/95 backdrop-blur-xl border-l border-beige-200/80 shadow-2xl shadow-brown-900/10 overflow-hidden flex flex-col"
    >
      {/* Mobile drag handle — tap to close (#9) */}
      <button
        onClick={onClose}
        className="sm:hidden w-full flex justify-center py-2.5 border-b border-beige-100"
        aria-label="Close panel"
      >
        <div className="w-10 h-1 rounded-full bg-beige-300" />
      </button>

      {/* Header */}
      <div className="p-5 pb-4 border-b border-beige-200/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                task.status === "accepted" && "bg-forest-100 text-forest-600",
                task.status === "in_progress" && "bg-teal-100 text-teal-600",
                task.status === "in_review" && "bg-gold-100 text-gold-600",
                task.status === "rework" && "bg-red-50 text-red-600",
                task.status === "rejected" && "bg-red-50 text-red-600",
                task.status === "backlog" && "bg-beige-100 text-beige-500"
              )}
            >
              <StatusIcon className="w-4 h-4" />
            </div>
            <div>
              <Badge variant={status.variant} size="sm">
                {status.label}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href={`/enterprise/decomposition/${planId}/edit`}>
              <Button variant="outline" size="icon-sm">
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon-sm" onClick={onClose} className="w-8 h-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <h2 className="text-[16px] font-bold text-brown-900 mt-3 leading-snug">
          {task.title}
        </h2>
        <p className="text-[11px] text-beige-500 mt-1.5 leading-relaxed">
          {task.description}
        </p>
      </div>

      {/* Scrollable content */}
      <ScrollArea className="flex-1">
        <div className="p-5 space-y-5">
          {/* Quick stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-beige-50/80 border border-beige-200/40 p-3 text-center">
              <Clock className="w-4 h-4 text-beige-400 mx-auto" />
              <p className="text-[14px] font-bold text-brown-900 mt-1">
                {task.estimatedHours}h
              </p>
              <p className="text-[9px] text-beige-500 font-medium">Est. Hours</p>
            </div>
            <div className="rounded-xl bg-beige-50/80 border border-beige-200/40 p-3 text-center">
              <Badge variant={priority.variant} size="sm" className="mx-auto">
                {priority.label}
              </Badge>
              <p className="text-[9px] text-beige-500 font-medium mt-2">Priority</p>
            </div>
            <div className="rounded-xl bg-beige-50/80 border border-beige-200/40 p-3 text-center">
              <div className="flex justify-center">
                <MetricRing
                  value={task.aiConfidence}
                  size={44}
                  strokeWidth={4}
                  color={task.aiConfidence >= 85 ? "forest" : task.aiConfidence >= 70 ? "teal" : "gold"}
                />
              </div>
              <p className="text-[9px] text-beige-500 font-medium mt-1">AI Confidence</p>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h4 className="text-[11px] font-bold text-brown-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-beige-400" />
              Required Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {task.skillsRequired.map((s) => (
                <SkillChip key={s.name} skill={s} size="md" />
              ))}
            </div>
          </div>

          {/* Dependencies */}
          {deps.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-brown-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <GitBranch className="w-3 h-3 text-beige-400" />
                Dependencies ({deps.length})
              </h4>
              <div className="space-y-2">
                {deps.map(({ dep, task: depTask }) => {
                  const DepIcon = depTypeIcon[dep.type] || Link2;
                  const depStatus = taskStatusConfig[depTask.status];
                  return (
                    <div
                      key={depTask.id}
                      className="flex items-center gap-2.5 rounded-lg border border-beige-200/50 bg-beige-50/50 p-2.5"
                    >
                      <DepIcon className="w-3.5 h-3.5 text-beige-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-brown-800 truncate">
                          {depTask.title}
                        </p>
                        <p className="text-[9px] text-beige-400 mt-0.5">
                          {dep.type === "blocks" ? "Blocking" : "Related"}
                        </p>
                      </div>
                      <Badge variant={depStatus.variant} size="sm">
                        {depStatus.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Acceptance Criteria */}
          {task.acceptanceCriteria.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-brown-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ListChecks className="w-3 h-3 text-beige-400" />
                Acceptance Criteria
              </h4>
              <div className="space-y-1.5">
                {task.acceptanceCriteria.map((criteria, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div
                      className={cn(
                        "w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 border",
                        task.status === "accepted"
                          ? "bg-forest-100 border-forest-300 text-forest-600"
                          : "bg-beige-50 border-beige-200 text-beige-400"
                      )}
                    >
                      {task.status === "accepted" ? (
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      ) : (
                        <Circle className="w-2 h-2" />
                      )}
                    </div>
                    <p className="text-[11px] text-brown-700 leading-relaxed">
                      {criteria}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          {task.subtasks.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold text-brown-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-beige-400" />
                Subtasks ({task.subtasks.length})
              </h4>
              <div className="space-y-2">
                {task.subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2.5 rounded-lg border border-beige-200/40 bg-beige-50/30 p-2.5"
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-md flex items-center justify-center shrink-0",
                        st.itemStatus === "accepted"
                          ? "bg-forest-100 text-forest-600"
                          : "bg-beige-100 text-beige-400"
                      )}
                    >
                      {st.itemStatus === "accepted" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Circle className="w-3 h-3" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-medium text-brown-800 truncate">
                        {st.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-beige-400">{st.estimatedHours}h</span>
                        <ConfidenceGauge value={st.aiConfidence} size="sm" />
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {st.skillsRequired.slice(0, 2).map((s) => (
                        <SkillChip key={s.name} skill={s} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Confidence Detailed */}
          <div className="rounded-xl border border-beige-200/50 bg-gradient-to-br from-beige-50/50 to-white p-4">
            <h4 className="text-[11px] font-bold text-brown-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Brain className="w-3 h-3 text-teal-500" />
              AI Confidence Analysis
            </h4>
            <div className="flex items-center justify-center mb-3">
              <MetricRing
                value={task.aiConfidence}
                size={80}
                strokeWidth={6}
                color={task.aiConfidence >= 85 ? "forest" : task.aiConfidence >= 70 ? "teal" : "gold"}
                label="Confidence"
              />
            </div>
            <p className="text-[10px] text-beige-500 text-center leading-relaxed">
              {task.aiConfidence >= 90
                ? "High confidence. This task decomposition closely matches historical patterns."
                : task.aiConfidence >= 75
                  ? "Good confidence. Minor adjustments may improve delivery predictability."
                  : "Moderate confidence. Consider reviewing scope and estimates."}
            </p>
          </div>
        </div>
      </ScrollArea>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PLAN DETAIL PAGE
   ══════════════════════════════════════════════════════════════ */
export default function PlanDetailPage() {
  const params = useParams();
  const planId = params.planId as string;
  const plan = mockPlans.find((p) => p.id === planId) ?? mockPlans[0];
  const sow = mockSOWs.find((s) => s.id === plan.sowId);
  const sowTitle = sow?.title ?? plan.sowId;
  const tasks = mockTasks.filter((t) => t.planId === plan.id);
  const milestones = mockPlanMilestones.filter((m) => m.planId === plan.id);
  const recommendations = mockAIRecommendations.filter((r) => r.planId === plan.id);

  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [dismissedRecs, setDismissedRecs] = React.useState<Set<string>>(
    () => new Set(recommendations.filter((r) => r.dismissed).map((r) => r.id))
  );

  /* ── C5: Export modal state ── */
  const [exportOpen, setExportOpen] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<"csv" | "pdf">("csv");
  const [exportScope, setExportScope] = React.useState<"full" | "tasks" | "summary">("full");
  const [exporting, setExporting] = React.useState(false);
  const [exportDone, setExportDone] = React.useState(false);

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null;

  const status = planStatusBadge[plan.status];
  const cost = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(plan.estimatedCost);

  /* Computed stats */
  const completedTasks = tasks.filter((t) => t.status === "accepted").length;
  const completionPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const totalSubtasks = tasks.reduce((s, t) => s + t.subtasks.length, 0);
  const allSkills = new Set(tasks.flatMap((t) => t.skillsRequired.map((s) => s.name)));
  const totalDeps = tasks.reduce((s, t) => s + t.dependencies.length, 0);

  /* Recommendation handlers with toast feedback (#7) */
  const [recToast, setRecToast] = React.useState<{ message: string; type: "accept" | "dismiss" } | null>(null);
  const recToastTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const showRecToast = (message: string, type: "accept" | "dismiss") => {
    clearTimeout(recToastTimer.current);
    setRecToast({ message, type });
    recToastTimer.current = setTimeout(() => setRecToast(null), 3000);
  };
  const handleAcceptRec = (id: string) => {
    const rec = recommendations.find((r) => r.id === id);
    setDismissedRecs((prev) => new Set([...prev, id]));
    showRecToast(rec ? `Accepted: ${rec.title}` : "Recommendation accepted", "accept");
  };
  const handleDismissRec = (id: string) => {
    const rec = recommendations.find((r) => r.id === id);
    setDismissedRecs((prev) => new Set([...prev, id]));
    showRecToast(rec ? `Dismissed: ${rec.title}` : "Recommendation dismissed", "dismiss");
  };

  /* Active (non-dismissed) recommendation count */
  const activeRecCount = recommendations.filter((r) => !dismissedRecs.has(r.id)).length;

  /* ── C5: Export handler ── */
  const isDraft = plan.status === "draft";
  const planTitleSlug = plan.title.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
  const exportFilename = `Plan-${plan.sowId}-${planTitleSlug}-v${plan.version}.${exportFormat}`;

  const handleExport = () => {
    setExporting(true);
    setExportDone(false);
    /* Simulate export generation delay */
    setTimeout(() => {
      /* In production: generate real CSV/PDF via API. For now, simulate download. */
      if (exportFormat === "csv") {
        const headers = ["Milestone", "Task", "Subtask", "Description", "Effort (h)", "Skills", "Dependencies", "Status", "Assigned To"];
        const rows: string[][] = [];
        for (const t of tasks) {
          const ms = milestones.find((m) => m.id === t.milestoneId);
          if (exportScope === "summary") continue;
          rows.push([
            ms?.title ?? "",
            t.title,
            "",
            exportScope === "full" ? t.description : "",
            t.estimatedHours.toString(),
            t.skillsRequired.map((s) => s.name).join("; "),
            t.dependencies.map((d) => d.targetId).join("; "),
            t.status,
            t.assigneeId ?? "Unassigned",
          ]);
          if (exportScope === "full") {
            for (const st of t.subtasks) {
              rows.push([
                ms?.title ?? "",
                t.title,
                st.title,
                "",
                st.estimatedHours.toString(),
                st.skillsRequired.map((s) => s.name).join("; "),
                "",
                "",
                "",
              ]);
            }
          }
        }
        if (exportScope === "summary") {
          rows.push(["Plan", plan.title, "", "", plan.estimatedHours.toString(), allSkills.size + " skills", totalDeps + " deps", plan.status, ""]);
          for (const ms of milestones) {
            rows.push([ms.title, "", "", ms.description, ms.estimatedHours.toString(), "", "", "", ""]);
          }
        }
        const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = exportFilename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        /* PDF: In production this would use a PDF library. Simulate with a text blob. */
        const lines = [
          isDraft ? "[DRAFT]" : "",
          `DECOMPOSITION PLAN EXPORT`,
          `========================`,
          `Title: ${plan.title}`,
          `SOW: ${plan.sowId}`,
          `Version: ${plan.version}`,
          `Status: ${plan.status}`,
          `Created: ${plan.createdAt}`,
          `Milestones: ${milestones.length}`,
          `Tasks: ${tasks.length}`,
          `Estimated Hours: ${plan.estimatedHours}`,
          `Estimated Cost: $${plan.estimatedCost.toLocaleString()}`,
          `Critical Path: ${plan.criticalPathDuration}h`,
          `AI Confidence: ${plan.aiConfidence}%`,
          ``,
        ];
        if (exportScope !== "tasks") {
          lines.push(`--- MILESTONES ---`);
          for (const ms of milestones) {
            lines.push(`  ${ms.order}. ${ms.title} — ${ms.estimatedHours}h, ${ms.taskCount} tasks`);
          }
          lines.push(``);
        }
        if (exportScope !== "summary") {
          lines.push(`--- TASKS ---`);
          for (const t of tasks) {
            lines.push(`  [${t.status}] ${t.title} — ${t.estimatedHours}h, Priority: ${t.priority}`);
            if (exportScope === "full") {
              lines.push(`    Skills: ${t.skillsRequired.map((s) => s.name).join(", ")}`);
              lines.push(`    Dependencies: ${t.dependencies.length > 0 ? t.dependencies.map((d) => d.targetId).join(", ") : "None"}`);
              for (const st of t.subtasks) {
                lines.push(`      └─ ${st.title} — ${st.estimatedHours}h`);
              }
            }
          }
        }
        const blob = new Blob([lines.join("\n")], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = exportFilename;
        a.click();
        URL.revokeObjectURL(url);
      }
      setExporting(false);
      setExportDone(true);
    }, 1200);
  };

  const resetExportModal = () => {
    setExportFormat("csv");
    setExportScope("full");
    setExportDone(false);
    setExporting(false);
  };

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
      description: `${plan.totalTasks} tasks, ${plan.totalMilestones} milestones`,
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
      description: plan.teamId ? "Team assigned" : "Pending plan approval",
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
    <TooltipProvider>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="max-w-[1200px] mx-auto space-y-6"
      >
        {/* ── Back + Header ── */}
        <motion.div variants={fadeUp}>
          <Link
            href="/enterprise/decomposition"
            className="inline-flex items-center gap-1.5 text-[12px] text-beige-500 hover:text-brown-600 transition-colors mb-3 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Decomposition Plans
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brown-500 to-brown-600 flex items-center justify-center shrink-0 shadow-md shadow-brown-500/20">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em]">
                    {plan.title}
                  </h1>
                  <Badge variant={status.variant} size="sm" dot>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-[12px] text-beige-500 mt-1 flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={`/enterprise/sow/${plan.sowId}`}
                    className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700 font-medium transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    {sowTitle}
                    <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                  </Link>
                  <span className="text-beige-300">&middot;</span>
                  <span>
                    Created{" "}
                    {new Date(plan.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-beige-300">&middot;</span>
                  <span>v{plan.version}</span>
                  <span className="text-beige-300">&middot;</span>
                  <span className="flex items-center gap-1">
                    AI Confidence:
                    <span
                      className={cn(
                        "font-bold font-mono",
                        plan.aiConfidence >= 85
                          ? "text-forest-600"
                          : plan.aiConfidence >= 70
                            ? "text-teal-600"
                            : "text-gold-600"
                      )}
                    >
                      {plan.aiConfidence}%
                    </span>
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetExportModal();
                  setExportOpen(true);
                }}
              >
                <Download className="w-3.5 h-3.5" />
                Export Plan
              </Button>
              {/* C6: Edit for draft/pending_review/approved/in_progress — NOT completed (#2) */}
              {plan.status !== "completed" && (
                <Link href={`/enterprise/decomposition/${plan.id}/edit`}>
                  <Button variant="outline" size="sm">
                    {(plan.status === "approved" || plan.status === "in_progress") && (
                      <AlertTriangle className="w-3 h-3 text-gold-500" />
                    )}
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Plan
                  </Button>
                </Link>
              )}
              {/* C4: Only show approval CTA for draft/pending_review plans */}
              {(plan.status === "draft" || plan.status === "pending_review") && (
                <Link href={`/enterprise/decomposition/${plan.id}/approve`}>
                  <Button variant="gradient-primary" size="sm">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Submit for Approval
                  </Button>
                </Link>
              )}
              {/* Approved — link to team formation (#3) */}
              {plan.status === "approved" && (
                <Link href="/enterprise/team">
                  <Button variant="gradient-primary" size="sm">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    View Team Formation
                  </Button>
                </Link>
              )}
              {/* In progress — link to active project (#3) */}
              {plan.status === "in_progress" && (
                <Link href={`/enterprise/projects/${plan.projectId ?? "proj-001"}`}>
                  <Button variant="gradient-primary" size="sm">
                    <FolderOpen className="w-3.5 h-3.5" />
                    View Project
                  </Button>
                </Link>
              )}
              {/* Completed — link to completed project (#2, #3) */}
              {plan.status === "completed" && (
                <Link href={`/enterprise/projects/${plan.projectId ?? "proj-001"}`}>
                  <Button variant="gradient-primary" size="sm">
                    <FolderOpen className="w-3.5 h-3.5" />
                    View Completed Project
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Summary Bar ── */}
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm"
        >
          <div className="flex items-center divide-x divide-beige-200/50 overflow-x-auto">
            {[
              {
                label: "Milestones",
                value: milestones.length.toString(),
                icon: MilestoneIcon,
                color: "text-brown-600",
              },
              {
                label: "Tasks",
                value: tasks.length.toString(),
                icon: Layers,
                color: "text-teal-600",
              },
              {
                label: "Subtasks",
                value: totalSubtasks.toString(),
                icon: Hash,
                color: "text-beige-500",
              },
              {
                label: "Hours",
                value: plan.estimatedHours.toLocaleString() + "h",
                icon: Timer,
                color: "text-gold-600",
              },
              {
                label: "Skills",
                value: allSkills.size.toString(),
                icon: Sparkles,
                color: "text-forest-600",
              },
              {
                label: "Dependencies",
                value: totalDeps.toString(),
                icon: GitBranch,
                color: "text-teal-500",
              },
              {
                label: "Critical Path",
                value: plan.criticalPathDuration.toLocaleString() + "h",
                icon: Gauge,
                color: "text-brown-500",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-4 py-3 min-w-0 flex-1"
              >
                <item.icon className={cn("w-3.5 h-3.5 shrink-0", item.color)} />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-brown-900 tabular-nums">
                    {item.value}
                  </p>
                  <p className="text-[9px] text-beige-500 font-medium uppercase tracking-wider">
                    {item.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Main Layout (2/3 + 1/3) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT: Milestone → Task → Subtask tree + AI Recommendations */}
          <motion.div
            variants={fadeUp}
            className={cn(
              "lg:col-span-2 space-y-6 transition-all duration-300",
              selectedTask && "lg:col-span-2"
            )}
          >
            {/* Task status summary */}
            <div className="flex items-center gap-4 flex-wrap rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-3.5">
              {(
                [
                  ["backlog", "Backlog"],
                  ["in_progress", "Active"],
                  ["in_review", "Review"],
                  ["rework", "Rework"],
                  ["accepted", "Done"],
                ] as [TaskStatus, string][]
              ).map(([key, label]) => {
                const count = tasks.filter((t) => t.status === key).length;
                const cfg = taskStatusConfig[key];
                return (
                  <div key={key} className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", cfg.dotColor)} />
                    <span className="text-[12px] text-brown-700 font-medium tabular-nums">
                      {count} {label}
                    </span>
                  </div>
                );
              })}
              <div className="flex-1" />
              <span className="text-[11px] text-beige-400">
                {completedTasks}/{tasks.length} complete
              </span>
            </div>

            {/* Milestone groups */}
            <div className="space-y-6">
              {milestones
                .sort((a, b) => a.order - b.order)
                .map((milestone) => {
                  const milestoneTasks = tasks
                    .filter((t) => t.milestoneId === milestone.id)
                    .sort((a, b) => a.order - b.order);
                  return (
                    <MilestoneGroup
                      key={milestone.id}
                      milestone={milestone}
                      tasks={milestoneTasks}
                      allTasks={tasks}
                      selectedTaskId={selectedTaskId}
                      onSelectTask={setSelectedTaskId}
                    />
                  );
                })}
            </div>

            {/* AI Recommendations Panel */}
            <motion.div variants={fadeUp} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-brown-900 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-teal-500" />
                  AI Recommendations
                  {activeRecCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {activeRecCount}
                    </span>
                  )}
                </h3>
                <span className="text-[10px] text-beige-400">
                  {dismissedRecs.size} dismissed
                </span>
              </div>
              <div className="space-y-2.5">
                {recommendations.length === 0 ? (
                  /* #11: Empty state when no AI recommendations */
                  <div className="rounded-xl border border-beige-200/40 bg-beige-50/30 p-6 text-center">
                    <Inbox className="w-8 h-8 text-beige-300 mx-auto mb-2" />
                    <p className="text-[12px] font-medium text-beige-500">No active recommendations</p>
                    <p className="text-[10px] text-beige-400 mt-0.5">All AI suggestions have been resolved for this plan.</p>
                  </div>
                ) : activeRecCount === 0 ? (
                  /* All dismissed */
                  <div className="rounded-xl border border-forest-200/40 bg-forest-50/30 p-4 text-center">
                    <CheckCircle2 className="w-6 h-6 text-forest-400 mx-auto mb-1.5" />
                    <p className="text-[11px] font-medium text-forest-600">All recommendations addressed</p>
                  </div>
                ) : null}
                {/* Active recommendations first, then dismissed */}
                {recommendations
                  .sort((a, b) => {
                    const aD = dismissedRecs.has(a.id) ? 1 : 0;
                    const bD = dismissedRecs.has(b.id) ? 1 : 0;
                    if (aD !== bD) return aD - bD;
                    const sevOrder = { critical: 0, warning: 1, info: 2 };
                    return sevOrder[a.severity] - sevOrder[b.severity];
                  })
                  .map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      rec={{ ...rec, dismissed: dismissedRecs.has(rec.id) }}
                      allTasks={tasks}
                      onAccept={handleAcceptRec}
                      onDismiss={handleDismissRec}
                    />
                  ))}
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT: Sticky Sidebar */}
          <motion.div variants={slideInRight} className="space-y-5">
            <div className="lg:sticky lg:top-6 space-y-5">
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
                <div className="mt-3 pt-3 border-t border-beige-100">
                  <Progress
                    value={completionPct}
                    size="sm"
                    variant="gradient-forest"
                  />
                </div>
              </div>

              {/* Plan metadata */}
              <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 space-y-4">
                <h3 className="text-[13px] font-bold text-brown-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-beige-400" />
                  Plan Details
                </h3>
                {[
                  {
                    label: "Total Tasks",
                    value: plan.totalTasks.toString(),
                    icon: Layers,
                  },
                  {
                    label: "Milestones",
                    value: plan.totalMilestones.toString(),
                    icon: MilestoneIcon,
                  },
                  {
                    label: "Estimated Hours",
                    value: plan.estimatedHours.toLocaleString() + "h",
                    icon: Clock,
                  },
                  {
                    label: "Estimated Cost",
                    value: cost,
                    icon: DollarSign,
                  },
                  {
                    label: "Complexity",
                    value:
                      plan.complexity.charAt(0).toUpperCase() +
                      plan.complexity.slice(1),
                    icon: Zap,
                  },
                  {
                    label: "Unique Skills",
                    value: plan.uniqueSkills.toString(),
                    icon: Sparkles,
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
                    <span className="text-[13px] font-semibold text-brown-800 tabular-nums">
                      {item.value}
                    </span>
                  </div>
                ))}

                {/* Progress by milestone */}
                <div className="pt-3 border-t border-beige-100">
                  <p className="text-[11px] text-beige-500 font-medium mb-2.5">
                    Progress by Milestone
                  </p>
                  {milestones.map((ms, i) => {
                    const msTasks = tasks.filter((t) => t.milestoneId === ms.id);
                    const msCompleted = msTasks.filter(
                      (t) => t.status === "accepted"
                    ).length;
                    const msPct = msTasks.length
                      ? Math.round((msCompleted / msTasks.length) * 100)
                      : 0;
                    return (
                      <div key={ms.id} className="mb-2.5 last:mb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-brown-700 font-medium truncate max-w-[70%]">
                            {ms.title}
                          </span>
                          <span className="text-[10px] text-beige-500 tabular-nums">
                            {msPct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-beige-100 overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              i === 0
                                ? "bg-gradient-to-r from-brown-400 to-brown-500"
                                : i === 1
                                  ? "bg-gradient-to-r from-teal-400 to-teal-500"
                                  : i === 2
                                    ? "bg-gradient-to-r from-gold-400 to-gold-500"
                                    : "bg-gradient-to-r from-forest-400 to-forest-500"
                            )}
                            style={{ width: `${msPct}%` }}
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
            </div>
          </motion.div>
        </div>

        {/* ── Task Detail Side Panel (overlay) ── */}
        <AnimatePresence>
          {selectedTask && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-brown-950/10 backdrop-blur-[2px]"
                onClick={() => setSelectedTaskId(null)}
              />
              {/* Panel */}
              <TaskDetailPanel
                task={selectedTask}
                allTasks={tasks}
                planId={plan.id}
                onClose={() => setSelectedTaskId(null)}
              />
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Recommendation action toast (#7) ── */}
      <AnimatePresence>
        {recToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-brown-900 text-white shadow-2xl shadow-brown-900/30 max-w-md">
              {recToast.type === "accept" ? (
                <CheckCircle2 className="w-4 h-4 text-forest-400 shrink-0" />
              ) : (
                <X className="w-4 h-4 text-beige-400 shrink-0" />
              )}
              <span className="text-[12px] font-medium truncate">{recToast.message}</span>
              <button
                onClick={() => setRecToast(null)}
                className="text-[11px] text-beige-300 hover:text-white ml-2 transition-colors shrink-0"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════
          C5: PLAN EXPORT MODAL
          ══════════════════════════════════════════ */}
      <Dialog
        open={exportOpen}
        onOpenChange={(open) => {
          setExportOpen(open);
          if (!open) resetExportModal();
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-brown-900">
              <FileDown className="w-5 h-5 text-brown-600" />
              Export Plan
            </DialogTitle>
            <DialogDescription>
              Export &ldquo;{plan.title}&rdquo; (v{plan.version}) as CSV or PDF.
            </DialogDescription>
          </DialogHeader>

          {!exportDone ? (
            <div className="space-y-5 py-2">
              {/* ── Format selection ── */}
              <div>
                <p className="text-[12px] font-semibold text-brown-800 mb-2.5">
                  Format
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat("csv")}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-4 transition-all text-left",
                      exportFormat === "csv"
                        ? "border-brown-400 bg-brown-50/50 shadow-sm"
                        : "border-beige-200 bg-white hover:border-beige-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        exportFormat === "csv"
                          ? "bg-forest-100 text-forest-600"
                          : "bg-beige-100 text-beige-500"
                      )}
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-brown-900">CSV</p>
                      <p className="text-[10px] text-beige-500">
                        Tabular data, spreadsheet-ready
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat("pdf")}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border-2 p-4 transition-all text-left",
                      exportFormat === "pdf"
                        ? "border-brown-400 bg-brown-50/50 shadow-sm"
                        : "border-beige-200 bg-white hover:border-beige-300"
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                        exportFormat === "pdf"
                          ? "bg-teal-100 text-teal-600"
                          : "bg-beige-100 text-beige-500"
                      )}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-brown-900">PDF</p>
                      <p className="text-[10px] text-beige-500">
                        Formatted document, print-ready
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* ── Content scope ── */}
              <div>
                <p className="text-[12px] font-semibold text-brown-800 mb-2.5">
                  Content Scope
                </p>
                <div className="space-y-2">
                  {[
                    {
                      value: "full" as const,
                      label: "Full Plan",
                      desc: "Milestones + tasks + subtasks + dependencies",
                    },
                    {
                      value: "tasks" as const,
                      label: "Tasks Only",
                      desc: "Task list without subtask or milestone detail",
                    },
                    {
                      value: "summary" as const,
                      label: "Summary Only",
                      desc: "High-level overview, milestones, and effort totals",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setExportScope(opt.value)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl border px-4 py-3 transition-all text-left",
                        exportScope === opt.value
                          ? "border-brown-400 bg-brown-50/40"
                          : "border-beige-200 bg-white hover:border-beige-300"
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                          exportScope === opt.value
                            ? "border-brown-500"
                            : "border-beige-300"
                        )}
                      >
                        {exportScope === opt.value && (
                          <div className="w-2 h-2 rounded-full bg-brown-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-brown-900">
                          {opt.label}
                        </p>
                        <p className="text-[10px] text-beige-500">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Draft watermark notice */}
              {isDraft && exportFormat === "pdf" && (
                <div className="flex items-start gap-2.5 rounded-xl bg-gold-50 border border-gold-200/60 px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-gold-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-gold-800">
                      Draft Watermark
                    </p>
                    <p className="text-[10px] text-gold-600">
                      This plan is in draft status. The PDF export will include a
                      &ldquo;DRAFT&rdquo; watermark on every page.
                    </p>
                  </div>
                </div>
              )}

              {/* Filename preview */}
              <div className="rounded-lg bg-beige-50 border border-beige-200/50 px-4 py-2.5">
                <p className="text-[10px] text-beige-500 mb-0.5">Filename</p>
                <p className="text-[11px] font-mono font-medium text-brown-700 truncate">
                  {exportFilename}
                </p>
              </div>
            </div>
          ) : (
            /* ── Export complete state ── */
            <div className="py-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-100 to-teal-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-forest-600" />
              </div>
              <h3 className="text-[16px] font-bold text-brown-900 mb-1">
                Export Complete
              </h3>
              <p className="text-[12px] text-beige-500 max-w-xs mx-auto mb-3">
                Your file has been downloaded successfully.
              </p>
              <p className="text-[11px] font-mono text-brown-600 bg-beige-50 inline-block px-3 py-1.5 rounded-lg">
                {exportFilename}
              </p>
            </div>
          )}

          <DialogFooter>
            {!exportDone ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExportOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="gradient-primary"
                  size="sm"
                  disabled={exporting}
                  onClick={handleExport}
                >
                  {exporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      Download {exportFormat.toUpperCase()}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetExportModal();
                  }}
                >
                  Export Again
                </Button>
                <Button
                  variant="gradient-primary"
                  size="sm"
                  onClick={() => setExportOpen(false)}
                >
                  Done
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
