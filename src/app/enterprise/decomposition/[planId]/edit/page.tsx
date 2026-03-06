"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  GripVertical,
  Plus,
  Save,
  X,
  Clock,
  DollarSign,
  Layers,
  Trash2,
  ChevronDown,
  ChevronRight,
  Network,
  GitBranch,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import {
  Badge,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui";
import { mockPlans, mockTasks } from "@/mocks/data/enterprise-projects";
import type { DecompositionTask } from "@/types/enterprise";

/* ── Priority color accent ── */
const priorityColors: Record<string, string> = {
  low: "border-l-beige-300",
  medium: "border-l-teal-400",
  high: "border-l-gold-400",
  critical: "border-l-brown-500",
};

/* ── Editable task card ── */
function EditableTaskCard({
  task,
  index,
}: {
  task: DecompositionTask;
  index: number;
}) {
  const [title, setTitle] = React.useState(task.title);
  const [hours, setHours] = React.useState(task.estimatedHours.toString());
  const [priority, setPriority] = React.useState(task.priority);

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "group relative rounded-xl border border-beige-200/60 bg-white/90 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-brown-100/10 border-l-[3px]",
        priorityColors[priority]
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Drag handle */}
        <div className="flex flex-col items-center gap-1 pt-1 shrink-0 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-beige-300 group-hover:text-beige-500 transition-colors" />
          <span className="text-[9px] font-bold text-beige-400 font-mono">
            #{index + 1}
          </span>
        </div>

        {/* Main content */}
        <div className="flex-1 space-y-3 min-w-0">
          {/* Title input */}
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 text-[13px] font-semibold border-transparent bg-transparent hover:bg-beige-50/60 focus:bg-white px-2 -mx-2 rounded-lg"
            placeholder="Task title..."
          />

          {/* Controls row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Priority select */}
            <div className="w-[120px]">
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger className="h-8 text-[11px] rounded-lg border-beige-200/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hours input */}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-beige-400" />
              <Input
                type="number"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="h-8 w-16 text-[11px] text-center px-2 rounded-lg border-beige-200/60"
              />
              <span className="text-[10px] text-beige-500">hrs</span>
            </div>

            {/* Dependencies indicator */}
            {task.dependencies.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-teal-600 bg-teal-50 px-2 py-1 rounded-md font-medium">
                <GitBranch className="w-3 h-3" />
                {task.dependencies.length} dep
                {task.dependencies.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Skills tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3 h-3 text-beige-400" />
            {task.skillsRequired.map((skill) => (
              <span
                key={skill}
                className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-beige-100 text-beige-600 hover:bg-beige-200 transition-colors cursor-default"
              >
                {skill}
                <button className="ml-1 text-beige-400 hover:text-brown-500 transition-colors">
                  &times;
                </button>
              </span>
            ))}
            <button className="text-[9px] font-semibold px-2 py-0.5 rounded-md border border-dashed border-beige-300 text-beige-500 hover:border-brown-400 hover:text-brown-600 transition-colors">
              + Add
            </button>
          </div>
        </div>

        {/* Delete button */}
        <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-beige-400 hover:text-[var(--danger)] hover:bg-[var(--danger-light)] transition-all shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Phase group (collapsible) ── */
function EditablePhaseGroup({
  phase,
  tasks,
}: {
  phase: number;
  tasks: DecompositionTask[];
}) {
  const [open, setOpen] = React.useState(true);
  const phaseHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);

  return (
    <motion.div variants={fadeUp} className="space-y-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 w-full text-left group"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brown-100 to-beige-100 flex items-center justify-center shrink-0 group-hover:from-brown-200 transition-colors">
          <Layers className="w-4 h-4 text-brown-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-[14px] font-bold text-brown-900">
            Phase {phase}
          </h3>
          <p className="text-[11px] text-beige-500">
            {tasks.length} tasks &middot; {phaseHours.toLocaleString()}h
          </p>
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
          {tasks.map((task, i) => (
            <EditableTaskCard key={task.id} task={task} index={i} />
          ))}
          <button className="flex items-center gap-2 w-full py-3 px-4 rounded-xl border border-dashed border-beige-300 text-beige-500 hover:border-brown-400 hover:text-brown-600 hover:bg-brown-50/30 transition-all text-[12px] font-medium">
            <Plus className="w-3.5 h-3.5" />
            Add task to Phase {phase}
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   EDIT DECOMPOSITION PAGE
   ══════════════════════════════════════════ */
export default function EditDecompositionPage() {
  const params = useParams();
  const planId = params.planId as string;
  const plan = mockPlans.find((p) => p.id === planId) ?? mockPlans[0];
  const tasks = mockTasks.filter((t) => t.planId === plan.id);

  const phases = Array.from(new Set(tasks.map((t) => t.phase))).sort(
    (a, b) => a - b
  );

  const totalHours = tasks.reduce((s, t) => s + t.estimatedHours, 0);
  const totalCost = plan.estimatedCost;
  const costFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 0,
  }).format(totalCost);

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
          href={`/enterprise/decomposition/${plan.id}`}
          className="inline-flex items-center gap-1.5 text-[12px] text-beige-500 hover:text-brown-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Plan Detail
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 flex items-center justify-center shrink-0">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-brown-900 tracking-[-0.02em]">
                Edit Plan
              </h1>
              <p className="text-[12px] text-beige-500 mt-0.5">
                {plan.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/enterprise/decomposition/${plan.id}`}>
              <Button variant="outline" size="sm">
                <X className="w-3.5 h-3.5" />
                Cancel
              </Button>
            </Link>
            <Button variant="gradient-primary" size="sm">
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left: Task list (3/4) */}
        <div className="lg:col-span-3 space-y-6">
          {phases.map((phase) => (
            <EditablePhaseGroup
              key={phase}
              phase={phase}
              tasks={tasks
                .filter((t) => t.phase === phase)
                .sort((a, b) => a.order - b.order)}
            />
          ))}

          {/* Add new phase */}
          <motion.div variants={fadeUp}>
            <button className="flex items-center gap-2 w-full py-4 px-5 rounded-2xl border-2 border-dashed border-beige-300 text-beige-500 hover:border-brown-400 hover:text-brown-600 hover:bg-brown-50/20 transition-all text-[13px] font-semibold">
              <Plus className="w-4 h-4" />
              Add New Phase
            </button>
          </motion.div>
        </div>

        {/* Right: Summary (1/4) */}
        <motion.div variants={slideInRight} className="space-y-5">
          {/* Live summary card */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 space-y-4 sticky top-4">
            <h3 className="text-[14px] font-bold text-brown-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-beige-400" />
              Plan Summary
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-beige-100">
                <span className="text-[12px] text-beige-600">Total Tasks</span>
                <span className="text-[16px] font-bold text-brown-900">
                  {tasks.length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-beige-100">
                <span className="text-[12px] text-beige-600 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Total Hours
                </span>
                <span className="text-[16px] font-bold text-brown-900">
                  {totalHours.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-beige-100">
                <span className="text-[12px] text-beige-600 flex items-center gap-1.5">
                  <DollarSign className="w-3 h-3" />
                  Est. Cost
                </span>
                <span className="text-[16px] font-bold text-teal-700">
                  {costFormatted}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[12px] text-beige-600">Phases</span>
                <span className="text-[16px] font-bold text-brown-900">
                  {phases.length}
                </span>
              </div>
            </div>

            {/* Phase breakdown */}
            <div className="pt-3 border-t border-beige-100 space-y-2.5">
              <p className="text-[11px] text-beige-500 font-medium uppercase tracking-wider">
                Hours by Phase
              </p>
              {phases.map((phase) => {
                const phaseTasks = tasks.filter((t) => t.phase === phase);
                const phaseHours = phaseTasks.reduce(
                  (s, t) => s + t.estimatedHours,
                  0
                );
                const pct = Math.round((phaseHours / totalHours) * 100);
                return (
                  <div key={phase}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-brown-700 font-semibold">
                        Phase {phase}
                      </span>
                      <span className="text-[10px] text-beige-500 font-mono">
                        {phaseHours}h ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-beige-100 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          phase === 1
                            ? "bg-gradient-to-r from-brown-400 to-brown-500"
                            : phase === 2
                            ? "bg-gradient-to-r from-teal-400 to-teal-500"
                            : "bg-gradient-to-r from-gold-400 to-gold-500"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Skills used */}
            <div className="pt-3 border-t border-beige-100">
              <p className="text-[11px] text-beige-500 font-medium uppercase tracking-wider mb-2">
                Required Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(
                  new Set(tasks.flatMap((t) => t.skillsRequired))
                ).map((skill) => (
                  <span
                    key={skill}
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-md bg-beige-100 text-beige-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
