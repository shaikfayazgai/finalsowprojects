"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Clock,
  DollarSign,
  AlertTriangle,
  Timer,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Settings,
  Plus,
  Pencil,
  Layers,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Badge, Switch } from "@/components/ui";

/* ══════════════════════════════════
   POLICIES PAGE (H3)
   SLA Templates, Pricing Rules,
   Governance Thresholds, Stage Gates
   ══════════════════════════════════ */

/* ── 1. SLA Templates ── */
const slaTemplates = [
  { id: "sla-1", priority: "Critical", reviewStart: "4h", reviewComplete: "24h", escalation: "After 2h overdue", enabled: true },
  { id: "sla-2", priority: "High", reviewStart: "8h", reviewComplete: "48h", escalation: "After 4h overdue", enabled: true },
  { id: "sla-3", priority: "Medium", reviewStart: "24h", reviewComplete: "72h", escalation: "After 12h overdue", enabled: true },
  { id: "sla-4", priority: "Low", reviewStart: "48h", reviewComplete: "120h", escalation: "After 24h overdue", enabled: true },
];

const slaPriorityConfig: Record<string, { variant: "brown" | "gold" | "teal" | "forest"; gradient: string }> = {
  Critical: { variant: "brown", gradient: "from-brown-500 to-brown-600" },
  High: { variant: "gold", gradient: "from-gold-500 to-gold-600" },
  Medium: { variant: "teal", gradient: "from-teal-500 to-teal-600" },
  Low: { variant: "forest", gradient: "from-forest-500 to-forest-600" },
};

/* ── 2. Pricing Rules ── */
const pricingRules = [
  { id: "pr-1", name: "Base Rate Card Policy", description: "Apply approved rate cards for all task pricing calculations", enabled: true },
  { id: "pr-2", name: "Overtime Multiplier", description: "1.5x rate for tasks exceeding SLA by 50%+", enabled: true },
  { id: "pr-3", name: "Rush Delivery Premium", description: "2x rate for critical-priority tasks requiring < 24h turnaround", enabled: true },
  { id: "pr-4", name: "Bulk Discount", description: "10% discount on projects with 50+ tasks", enabled: false },
  { id: "pr-5", name: "Regional Rate Adjustment", description: "Automatically adjust rates based on contributor region cost of living", enabled: true },
];

/* ── 3. Governance Thresholds ── */
const governanceThresholds = [
  { id: "gt-1", name: "Quality Score Threshold", description: "Minimum acceptance score for auto-approval", value: 85, unit: "score", max: 100, icon: Shield, gradient: "from-forest-400 to-forest-600" },
  { id: "gt-2", name: "SLA Breach Tolerance", description: "Maximum percentage of SLA breaches before project freeze", value: 15, unit: "%", max: 100, icon: Timer, gradient: "from-teal-400 to-teal-600" },
  { id: "gt-3", name: "Budget Overrun Alert", description: "Alert when project spending exceeds budget by this percentage", value: 90, unit: "%", max: 200, icon: DollarSign, gradient: "from-gold-400 to-gold-600" },
  { id: "gt-4", name: "Auto-Escalation Trigger", description: "Escalate to admin after this many failed reviews", value: 3, unit: "reviews", max: 10, icon: AlertTriangle, gradient: "from-brown-400 to-brown-600" },
  { id: "gt-5", name: "Rework Limit", description: "Maximum rework cycles before mandatory escalation", value: 2, unit: "cycles", max: 5, icon: Sparkles, gradient: "from-teal-500 to-forest-500" },
];

/* ── 4. Stage Gates ── */
const stageGates = [
  { id: "sg-1", stage: "SOW Approval", approvals: ["Owner"], description: "SOW must be approved before decomposition begins", mandatory: true },
  { id: "sg-2", stage: "Decomposition Review", approvals: ["Owner", "Manager"], description: "Task breakdown must be reviewed before team formation", mandatory: true },
  { id: "sg-3", stage: "Team Formation Sign-off", approvals: ["Manager"], description: "Team composition must be approved before project start", mandatory: true },
  { id: "sg-4", stage: "Milestone Completion", approvals: ["Owner", "Mentor"], description: "All deliverables in milestone must be accepted", mandatory: true },
  { id: "sg-5", stage: "Payment Release", approvals: ["Owner", "Finance Lead"], description: "Dual approval required for payout release", mandatory: true },
  { id: "sg-6", stage: "Project Closure", approvals: ["Owner"], description: "Final sign-off with all milestones completed", mandatory: false },
];

/* ═══════════════════════ PAGE ═══════════════════════ */
export default function PoliciesPage() {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-6"
    >
      {/* Back link */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/admin/config"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Config
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-500 to-forest-600 flex items-center justify-center shadow-md shadow-forest-500/20">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-brown-900 tracking-[-0.02em] font-heading">
              Policies
            </h1>
            <p className="text-[13px] text-beige-500 mt-1">
              SLA Templates, Pricing Rules, Governance Thresholds, and Stage Gates.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ═══ Section 1: SLA Templates ═══ */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-teal-500" />
            <h2 className="text-[14px] font-semibold text-brown-800">SLA Templates</h2>
            <Badge variant="teal" size="sm">{slaTemplates.length} templates</Badge>
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-beige-200 text-[11px] font-semibold text-brown-700 hover:bg-beige-50 transition-colors">
            <Plus className="w-3 h-3" />
            Add Template
          </button>
        </div>

        <p className="text-[11px] text-beige-500 mb-4">
          Default SLA durations by task priority. Defines review start time, completion time, and escalation triggers.
        </p>

        {/* Column headers */}
        <div className="hidden md:grid md:grid-cols-12 gap-3 px-4 py-2 text-[10px] font-semibold text-beige-500 uppercase tracking-wider border-b border-beige-100">
          <div className="col-span-2">Priority</div>
          <div className="col-span-2 text-center">Review Start</div>
          <div className="col-span-3 text-center">Review Complete</div>
          <div className="col-span-3">Escalation</div>
          <div className="col-span-2 text-center">Status</div>
        </div>

        <div className="divide-y divide-beige-100/60">
          {slaTemplates.map((sla) => {
            const config = slaPriorityConfig[sla.priority];
            return (
              <div
                key={sla.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center px-4 py-3.5 hover:bg-beige-50/40 transition-colors"
              >
                <div className="md:col-span-2">
                  <Badge variant={config.variant} size="sm" dot>
                    {sla.priority}
                  </Badge>
                </div>
                <div className="md:col-span-2 text-center">
                  <span className="text-[13px] font-bold text-brown-900">{sla.reviewStart}</span>
                </div>
                <div className="md:col-span-3 text-center">
                  <span className="text-[13px] font-bold text-brown-900">{sla.reviewComplete}</span>
                </div>
                <div className="md:col-span-3">
                  <span className="text-[11px] text-beige-600">{sla.escalation}</span>
                </div>
                <div className="md:col-span-2 flex justify-center">
                  <Switch defaultChecked={sla.enabled} />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ Section 2: Pricing Rules ═══ */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gold-500" />
            <h2 className="text-[14px] font-semibold text-brown-800">Pricing Rules</h2>
            <Badge variant="gold" size="sm">{pricingRules.filter((r) => r.enabled).length} active</Badge>
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-beige-200 text-[11px] font-semibold text-brown-700 hover:bg-beige-50 transition-colors">
            <Plus className="w-3 h-3" />
            Add Rule
          </button>
        </div>

        <p className="text-[11px] text-beige-500 mb-4">
          Rate card policies, overtime multipliers, and automatic pricing adjustments.
        </p>

        <div className="space-y-3">
          {pricingRules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "flex items-center gap-4 py-3.5 px-4 rounded-xl border transition-colors",
                rule.enabled
                  ? "border-beige-100 hover:bg-beige-50/40"
                  : "border-beige-100/50 opacity-60"
              )}
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-sm shrink-0">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-brown-800">{rule.name}</p>
                <p className="text-[11px] text-beige-500 mt-0.5">{rule.description}</p>
              </div>
              <Switch defaultChecked={rule.enabled} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Section 3: Governance Thresholds ═══ */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <AlertTriangle className="w-4 h-4 text-brown-500" />
          <h2 className="text-[14px] font-semibold text-brown-800">Governance Thresholds</h2>
          <Badge variant="brown" size="sm">APG Config</Badge>
        </div>

        <p className="text-[11px] text-beige-500 mb-4">
          APG intervention triggers. When these thresholds are breached, the system takes automated action.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {governanceThresholds.map((gt) => {
            const Icon = gt.icon;
            const barPercent = Math.min((gt.value / gt.max) * 100, 100);

            return (
              <motion.div
                key={gt.id}
                variants={scaleIn}
                className="rounded-xl border border-beige-100 bg-white/50 p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br shadow-sm shrink-0",
                        gt.gradient
                      )}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-[13px] font-semibold text-brown-800">{gt.name}</h3>
                      <p className="text-[10px] text-beige-500 mt-0.5">{gt.description}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-beige-500 font-medium">Threshold</span>
                    <span className="text-[13px] font-bold text-brown-800">
                      {gt.value}
                      <span className="text-[10px] text-beige-500 ml-1">{gt.unit}</span>
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-beige-100 overflow-hidden">
                    <div
                      className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all", gt.gradient)}
                      style={{ width: `${barPercent}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-brown-400 shadow-sm"
                      style={{ left: `calc(${barPercent}% - 6px)` }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ Section 4: Stage Gates ═══ */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-forest-500" />
            <h2 className="text-[14px] font-semibold text-brown-800">Stage Gates</h2>
            <Badge variant="forest" size="sm">{stageGates.filter((s) => s.mandatory).length} mandatory</Badge>
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-beige-200 text-[11px] font-semibold text-brown-700 hover:bg-beige-50 transition-colors">
            <Plus className="w-3 h-3" />
            Add Gate
          </button>
        </div>

        <p className="text-[11px] text-beige-500 mb-4">
          Required approvals per milestone or project stage. Mandatory gates cannot be bypassed.
        </p>

        <div className="space-y-3">
          {stageGates.map((gate, index) => (
            <motion.div
              key={gate.id}
              variants={scaleIn}
              className={cn(
                "flex items-center gap-4 py-3.5 px-4 rounded-xl border transition-colors",
                gate.mandatory
                  ? "border-beige-100 hover:bg-beige-50/40"
                  : "border-beige-100/50 opacity-70"
              )}
            >
              {/* Step number */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm">
                {index + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[13px] font-semibold text-brown-800">{gate.stage}</p>
                  {gate.mandatory && (
                    <Badge variant="forest" size="sm">Mandatory</Badge>
                  )}
                </div>
                <p className="text-[11px] text-beige-500 mt-0.5">{gate.description}</p>
              </div>

              {/* Required approvers */}
              <div className="flex flex-wrap gap-1 shrink-0">
                {gate.approvals.map((approver) => (
                  <span
                    key={approver}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-beige-100 text-beige-700"
                  >
                    {approver}
                  </span>
                ))}
              </div>

              <Switch defaultChecked={gate.mandatory} />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
