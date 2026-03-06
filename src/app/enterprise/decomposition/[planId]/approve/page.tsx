"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
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
  GitBranch,
  Network,
  Undo2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Badge, Button, Checkbox } from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { mockPlans, mockTasks } from "@/mocks/data/enterprise-projects";

/* ── Checklist item ── */
function ChecklistItem({
  label,
  description,
  defaultChecked = false,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = React.useState(defaultChecked);

  return (
    <motion.div
      variants={fadeUp}
      className={cn(
        "flex items-start gap-3.5 p-4 rounded-xl border transition-all duration-300 cursor-pointer",
        checked
          ? "border-forest-200 bg-forest-50/40"
          : "border-beige-200/60 bg-white/70 hover:border-beige-300"
      )}
      onClick={() => setChecked(!checked)}
    >
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => setChecked(!!v)}
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

/* ══════════════════════════════════════════
   APPROVE PLAN PAGE
   ══════════════════════════════════════════ */
export default function ApprovePlanPage() {
  const params = useParams();
  const planId = params.planId as string;
  const plan = mockPlans.find((p) => p.id === planId) ?? mockPlans[0];
  const tasks = mockTasks.filter((t) => t.planId === plan.id);

  const cost = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(plan.estimatedCost);

  const complexityColor =
    plan.complexity === "low"
      ? "forest"
      : plan.complexity === "medium"
      ? "teal"
      : plan.complexity === "high"
      ? "gold"
      : "brown";

  const uniqueSkills = Array.from(
    new Set(tasks.flatMap((t) => t.skillsRequired))
  );

  /* Stat items */
  const stats = [
    {
      label: "Total Tasks",
      value: plan.totalTasks.toString(),
      icon: Layers,
      accent: "bg-brown-100 text-brown-600",
    },
    {
      label: "Estimated Hours",
      value: plan.estimatedHours.toLocaleString() + "h",
      icon: Clock,
      accent: "bg-teal-100 text-teal-600",
    },
    {
      label: "Estimated Cost",
      value: cost,
      icon: DollarSign,
      accent: "bg-forest-100 text-forest-600",
    },
    {
      label: "Complexity",
      value: plan.complexity.charAt(0).toUpperCase() + plan.complexity.slice(1),
      icon: Zap,
      accent: "bg-gold-100 text-gold-700",
    },
  ];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[900px] mx-auto space-y-6"
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

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-teal-500 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-brown-900 tracking-[-0.02em]">
              Review & Approve Plan
            </h1>
            <p className="text-[12px] text-beige-500 mt-0.5">
              {plan.title}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Plan summary stats */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-4 text-center"
          >
            <div
              className={cn(
                "w-9 h-9 rounded-lg mx-auto flex items-center justify-center mb-2",
                stat.accent
              )}
            >
              <stat.icon className="w-4 h-4" />
            </div>
            <p className="text-[18px] font-bold text-brown-900 tracking-tight">
              {stat.value}
            </p>
            <p className="text-[10px] text-beige-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Skills overview */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
      >
        <h3 className="text-[13px] font-bold text-brown-900 mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-beige-400" />
          Required Skills ({uniqueSkills.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {uniqueSkills.map((skill) => {
            const taskCount = tasks.filter((t) =>
              t.skillsRequired.includes(skill)
            ).length;
            return (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-beige-100/80 text-beige-700 border border-beige-200/50"
              >
                {skill}
                <span className="text-[9px] bg-beige-200 text-beige-600 px-1.5 py-0.5 rounded-md">
                  {taskCount}
                </span>
              </span>
            );
          })}
        </div>
      </motion.div>

      {/* Approval checklist */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 space-y-3"
      >
        <h3 className="text-[14px] font-bold text-brown-900 mb-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-forest-500" />
          Approval Checklist
        </h3>
        <p className="text-[12px] text-beige-500 mb-4">
          Complete all items below before approving this decomposition plan.
        </p>

        <div className="space-y-2.5">
          <ChecklistItem
            label="Task breakdown verified"
            description="All SOW requirements are covered by the decomposed tasks with no gaps."
            defaultChecked
          />
          <ChecklistItem
            label="Dependencies validated"
            description="Task dependency chains are logically correct and do not contain circular references."
            defaultChecked
          />
          <ChecklistItem
            label="Estimates reviewed"
            description="Hour estimates are realistic and align with historical delivery data."
          />
          <ChecklistItem
            label="Budget within SOW limits"
            description="Total estimated cost does not exceed the SOW-approved budget ceiling."
          />
          <ChecklistItem
            label="Skills requirements confirmed"
            description="All required skills have sufficient contributors in the platform talent pool."
          />
        </div>
      </motion.div>

      {/* Team formation preview */}
      <motion.div
        variants={scaleIn}
        className="rounded-2xl border-2 border-dashed border-teal-200 bg-gradient-to-br from-teal-50/50 to-beige-50/50 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-forest-500 flex items-center justify-center shrink-0">
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
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                <span className="text-[11px] text-brown-700 font-medium">
                  AI-optimized matching
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-forest-500" />
                <span className="text-[11px] text-brown-700 font-medium">
                  Privacy-first assignment
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-teal-500" />
                <span className="text-[11px] text-brown-700 font-medium">
                  Skill coverage analysis
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTAs */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2"
      >
        <Link href={`/enterprise/decomposition/${plan.id}/edit`}>
          <Button variant="outline" size="md" className="w-full sm:w-auto">
            <Undo2 className="w-4 h-4" />
            Request Revisions
          </Button>
        </Link>
        <Link href={`/enterprise/team`}>
          <Button
            variant="gradient-primary"
            size="md"
            className="w-full sm:w-auto px-8"
          >
            <ShieldCheck className="w-4 h-4" />
            Approve & Form Team
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
