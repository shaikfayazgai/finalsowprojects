"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  ShieldCheck,
  DollarSign,
  Clock,
  Users,
  Sparkles,
  BookOpen,
  Layers,
  Pen,
  User,
  Lock,
  ScrollText,
  GitBranch,
  Target,
  Scale,
  ChevronDown,
  ChevronRight,
  XCircle,
  Send,
  AlertOctagon,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight, scaleIn } from "@/lib/utils/motion-variants";
import { Badge, Button, Checkbox, Textarea } from "@/components/ui";
import { MetricRing } from "@/components/enterprise/metric-ring";
import { mockSOWs, mockSOWSections } from "@/mocks/data/enterprise-sow";
import type { ApprovalStage } from "@/types/enterprise";

/* ═══════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════ */

const statusVariantMap: Record<string, "beige" | "gold" | "teal" | "forest" | "brown"> = {
  draft: "beige",
  parsing: "teal",
  review: "teal",
  approval: "gold",
  approved: "forest",
  archived: "beige",
};

const stageLabels: Record<string, string> = {
  business: "Business Owner",
  legal: "Legal / Compliance",
  security: "Security Review",
  final: "Final Sign-off",
};

const stageDescriptions: Record<string, string> = {
  business: "Verify budget, scope, and business alignment with strategic goals",
  legal: "Review contractual terms, IP rights, and regulatory compliance",
  security: "Assess data sensitivity classification and security requirements",
  final: "Executive sign-off with digital signature for project initiation",
};

/* ── Stage-Specific Checklists (per UX Flow B7) ── */

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
}

const stageChecklists: Record<ApprovalStage, ChecklistItem[]> = {
  business: [
    { id: "scope-align", label: "Scope aligns with business objectives", description: "SOW deliverables match the strategic goals for this quarter", icon: Target },
    { id: "budget-ok", label: "Budget within procurement limits", description: "Estimated cost falls within approved spending authority", icon: DollarSign },
    { id: "timeline-ok", label: "Timeline is feasible", description: "Milestone dates are realistic given resource availability", icon: Clock },
    { id: "stakeholders", label: "Stakeholders identified and notified", description: "All key decision-makers are listed and aware", icon: Users },
  ],
  legal: [
    { id: "ip-rights", label: "IP rights and ownership clauses reviewed", description: "Intellectual property terms are clear and acceptable", icon: Shield },
    { id: "liability", label: "Liability and indemnification verified", description: "Risk allocation between parties is balanced", icon: Scale },
    { id: "compliance", label: "Regulatory compliance confirmed", description: "SOW meets all applicable industry regulations", icon: ShieldCheck },
    { id: "terms", label: "Standard terms applied", description: "Contractual terms match approved templates", icon: FileText },
  ],
  security: [
    { id: "data-class", label: "Data classification appropriate", description: "Sensitivity level matches the data types involved", icon: Shield },
    { id: "access-ctrl", label: "Access controls specified", description: "Authentication and authorization requirements are defined", icon: Lock },
    { id: "encryption", label: "Encryption requirements met", description: "Data at rest and in transit protection standards", icon: ShieldCheck },
    { id: "audit-trail", label: "Audit logging requirements defined", description: "Compliance monitoring and traceability mechanisms", icon: ScrollText },
  ],
  final: [
    { id: "all-stages", label: "All prior stages approved", description: "Business, Legal, and Security reviews are complete", icon: CheckCircle2 },
    { id: "risk-accept", label: "Residual risks accepted", description: "Outstanding risks documented with mitigation plans", icon: AlertTriangle },
    { id: "decomp-ready", label: "Ready for decomposition", description: "SOW is complete and can be broken into tasks", icon: GitBranch },
  ],
};

/* ── Risk-Based Routing Tiers (SOW V2.1 Table 4) ── */

interface RiskTier {
  label: string;
  range: string;
  color: string;
  bgColor: string;
  borderColor: string;
  ringColor: string;
  iconColor: string;
  stages: ApprovalStage[];
  description: string;
}

const riskTiers: RiskTier[] = [
  {
    label: "Low Risk",
    range: "0–25",
    color: "text-forest-700",
    bgColor: "bg-forest-50",
    borderColor: "border-forest-200/60",
    ringColor: "ring-forest-200",
    iconColor: "text-forest-500",
    stages: ["business", "final"],
    description: "Standard review — Business + Final only",
  },
  {
    label: "Medium Risk",
    range: "26–50",
    color: "text-gold-800",
    bgColor: "bg-gold-50",
    borderColor: "border-gold-200/60",
    ringColor: "ring-gold-200",
    iconColor: "text-gold-600",
    stages: ["business", "legal", "final"],
    description: "Enhanced review — Business + Legal + Final",
  },
  {
    label: "High Risk",
    range: "51–75",
    color: "text-brown-700",
    bgColor: "bg-brown-50",
    borderColor: "border-brown-200/60",
    ringColor: "ring-brown-200",
    iconColor: "text-brown-500",
    stages: ["business", "legal", "security", "final"],
    description: "Full review — all 4 stages mandatory",
  },
  {
    label: "Critical",
    range: "76–100",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200/60",
    ringColor: "ring-red-200",
    iconColor: "text-red-500",
    stages: ["business", "legal", "security", "final"],
    description: "Auto-reject recommended — manual override required",
  },
];

function getRiskTier(score: number): RiskTier {
  if (score <= 25) return riskTiers[0];
  if (score <= 50) return riskTiers[1];
  if (score <= 75) return riskTiers[2];
  return riskTiers[3];
}

/* ── Rejection flow types ── */
type RejectionType = "changes" | "reject";

/* ═══════════════════════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════════════════════ */

export default function SOWApprovePage() {
  const params = useParams();
  const sowId = params.sowId as string;
  const sow = mockSOWs.find((s) => s.id === sowId) || mockSOWs[0];
  const sections = mockSOWSections.filter((s) => s.sowId === sow.id);

  /* ── Active stage detection ── */
  const activeStageIndex = sow.approvalStages.findIndex(
    (s) => s.status === "in_review" || s.status === "pending"
  );
  const activeStage = activeStageIndex >= 0 ? sow.approvalStages[activeStageIndex] : null;
  const activeChecklist = activeStage ? stageChecklists[activeStage.stage] : [];

  /* ── Checklist state ── */
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  const [comments, setComments] = React.useState("");

  const allChecked = activeChecklist.every((item) => checked[item.id]);
  const checkedCount = activeChecklist.filter((item) => checked[item.id]).length;

  /* ── Rejection flow state ── */
  const [showRejectForm, setShowRejectForm] = React.useState(false);
  const [rejectionType, setRejectionType] = React.useState<RejectionType>("changes");
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [rejectionSubmitted, setRejectionSubmitted] = React.useState(false);

  /* ── Approval submitted state ── */
  const [approvalSubmitted, setApprovalSubmitted] = React.useState(false);

  /* ── Collapsed stage toggle for completed stages ── */
  const [expandedCompleted, setExpandedCompleted] = React.useState<Record<string, boolean>>({});

  /* ── Risk routing ── */
  const riskScore = sow.riskScore.overall;
  const tier = getRiskTier(riskScore);

  const handleRejectSubmit = () => {
    if (!rejectionReason.trim()) return;
    setRejectionSubmitted(true);
    setShowRejectForm(false);
  };

  const handleApproveSubmit = () => {
    setApprovalSubmitted(true);
  };

  const allStagesApproved = sow.approvalStages.every((s) => s.status === "approved");

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1200px] mx-auto space-y-5"
    >
      {/* Back Link */}
      <motion.div variants={fadeUp}>
        <Link
          href={`/enterprise/sow/${sow.id}`}
          className="inline-flex items-center gap-2 text-sm text-beige-600 hover:text-brown-700 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to {sow.title}
        </Link>
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-brown-900 tracking-tight font-heading">
            Approve SOW
          </h1>
          <Badge variant={statusVariantMap[sow.status]} size="md" dot>
            {sow.status.charAt(0).toUpperCase() + sow.status.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-beige-600">
          {sow.title} — {sow.client}
        </p>
      </motion.div>

      {/* ═══ Risk-Based Routing Indicator (SOW V2.1 Table 4) ═══ */}
      <motion.div variants={fadeUp}>
        <div
          className={cn(
            "rounded-2xl border p-4 backdrop-blur-sm",
            tier.bgColor,
            tier.borderColor
          )}
        >
          <div className="flex items-start gap-4">
            <div
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                "bg-white/60 ring-1",
                tier.ringColor
              )}
            >
              <Gauge className={cn("w-5 h-5", tier.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn("text-[13px] font-bold", tier.color)}>
                  {tier.label}
                </span>
                <span className="text-[11px] text-beige-500 font-mono">
                  Score: {riskScore}/100
                </span>
              </div>
              <p className={cn("text-[12px]", tier.color, "opacity-80")}>
                {tier.description}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-beige-500 uppercase tracking-wider font-semibold mr-1">
                  Required stages:
                </span>
                {tier.stages.map((stageKey) => (
                  <Badge
                    key={stageKey}
                    variant={
                      sow.approvalStages.find((s) => s.stage === stageKey)?.status === "approved"
                        ? "forest"
                        : "beige"
                    }
                    size="sm"
                  >
                    {stageLabels[stageKey]}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <MetricRing
                value={riskScore}
                size={56}
                strokeWidth={5}
                color={
                  riskScore <= 25
                    ? "forest"
                    : riskScore <= 50
                    ? "gold"
                    : "brown"
                }
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Multi-Stage Approval Pipeline ═══ */}
      <motion.div
        variants={fadeUp}
        className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
      >
        <h2 className="text-[14px] font-semibold text-brown-900 mb-4">
          4-Stage Approval Pipeline
        </h2>
        <div className="flex items-start gap-0">
          {sow.approvalStages.map((stage, idx) => {
            const isLast = idx === sow.approvalStages.length - 1;
            const isActive = activeStage?.stage === stage.stage;
            return (
              <div key={stage.stage} className="flex-1 flex items-start">
                <div className="flex flex-col items-center text-center w-full">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0 mb-2 transition-all duration-300",
                      stage.status === "approved"
                        ? "bg-forest-100 ring-2 ring-forest-200"
                        : stage.status === "in_review"
                        ? "bg-gold-100 ring-2 ring-gold-200 animate-pulse"
                        : stage.status === "rejected"
                        ? "bg-red-100 ring-2 ring-red-200"
                        : "bg-beige-100"
                    )}
                  >
                    {stage.status === "approved" ? (
                      <CheckCircle2 className="w-5 h-5 text-forest-600" />
                    ) : stage.status === "in_review" ? (
                      <Clock className="w-5 h-5 text-gold-600" />
                    ) : stage.status === "rejected" ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <span className="text-[12px] font-bold text-beige-500">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-[12px] font-semibold",
                      isActive ? "text-gold-800" : "text-brown-800"
                    )}
                  >
                    {stageLabels[stage.stage]}
                  </p>
                  <p className="text-[10px] text-beige-500 mt-0.5 max-w-[140px]">
                    {stageDescriptions[stage.stage]}
                  </p>
                  {stage.reviewer && (
                    <p className="text-[10px] text-teal-600 mt-1 font-medium">
                      {stage.reviewer}
                    </p>
                  )}
                  <Badge
                    variant={
                      stage.status === "approved"
                        ? "forest"
                        : stage.status === "in_review"
                        ? "gold"
                        : stage.status === "rejected"
                        ? "danger"
                        : "beige"
                    }
                    size="sm"
                    className="mt-1.5"
                  >
                    {stage.status === "approved"
                      ? "Approved"
                      : stage.status === "in_review"
                      ? "In Review"
                      : stage.status === "rejected"
                      ? "Rejected"
                      : "Pending"}
                  </Badge>
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "h-0.5 flex-1 mt-5 mx-1 rounded-full transition-all duration-500",
                      stage.status === "approved" ? "bg-forest-300" : "bg-beige-200"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ Two Column Layout ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT — Approval Form (2/3) */}
        <motion.div variants={stagger} className="lg:col-span-2 space-y-5">
          {/* ── Completed Stages (collapsed green cards) ── */}
          {sow.approvalStages
            .filter((s) => s.status === "approved")
            .map((stage) => {
              const isExpanded = !!expandedCompleted[stage.stage];
              const stageItems = stageChecklists[stage.stage];
              const reviewDate = stage.reviewedAt
                ? new Date(stage.reviewedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : null;

              return (
                <motion.div
                  key={stage.stage}
                  variants={fadeUp}
                  className="rounded-2xl border border-forest-200/50 bg-forest-50/40 backdrop-blur-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedCompleted((prev) => ({
                        ...prev,
                        [stage.stage]: !prev[stage.stage],
                      }))
                    }
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-forest-50/60 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-forest-100 ring-1 ring-forest-200 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-forest-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-forest-800">
                          {stageLabels[stage.stage]}
                        </span>
                        <Badge variant="forest" size="sm">
                          Approved
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        {stage.reviewer && (
                          <span className="text-[11px] text-forest-600">
                            by {stage.reviewer}
                          </span>
                        )}
                        {reviewDate && (
                          <span className="text-[11px] text-beige-500">
                            {reviewDate}
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-forest-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-forest-400 shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          {/* Stage comments */}
                          {stage.comments && (
                            <div className="rounded-xl bg-white/60 border border-forest-100 p-3">
                              <p className="text-[10px] font-semibold text-beige-500 uppercase tracking-wider mb-1">
                                Reviewer Notes
                              </p>
                              <p className="text-[12px] text-brown-700 leading-relaxed">
                                {stage.comments}
                              </p>
                            </div>
                          )}

                          {/* Completed checklist items */}
                          <div className="space-y-1">
                            {stageItems.map((item) => {
                              const Icon = item.icon;
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-2.5 rounded-lg p-2 bg-white/40"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-forest-500 shrink-0" />
                                  <Icon className="w-3.5 h-3.5 text-forest-400 shrink-0" />
                                  <span className="text-[12px] text-forest-700 font-medium">
                                    {item.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

          {/* ── Active Stage Section ── */}
          {activeStage && !approvalSubmitted && !rejectionSubmitted && (
            <>
              {/* Progress Indicator */}
              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                    <h2 className="text-[14px] font-semibold text-brown-900">
                      {stageLabels[activeStage.stage]} — Review Checklist
                    </h2>
                  </div>
                  <span className="text-[12px] font-semibold text-beige-500">
                    {checkedCount}/{activeChecklist.length} completed
                  </span>
                </div>
                <p className="text-[11px] text-beige-500 mb-3">
                  {stageDescriptions[activeStage.stage]}
                </p>
                <div className="h-2 rounded-full bg-beige-100 overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      allChecked
                        ? "bg-gradient-to-r from-forest-500 to-teal-500"
                        : "bg-gradient-to-r from-brown-400 to-brown-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${
                        activeChecklist.length > 0
                          ? (checkedCount / activeChecklist.length) * 100
                          : 0
                      }%`,
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>

              {/* Active Stage Checklist */}
              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
              >
                <h2 className="text-[14px] font-semibold text-brown-900 mb-4">
                  {stageLabels[activeStage.stage]} Criteria
                </h2>
                <div className="space-y-1">
                  {activeChecklist.map((item) => {
                    const Icon = item.icon;
                    const isChecked = !!checked[item.id];

                    return (
                      <label
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3.5 rounded-xl p-3.5 cursor-pointer transition-all duration-200",
                          isChecked
                            ? "bg-forest-50/50 border border-forest-200/50"
                            : "hover:bg-beige-50/60 border border-transparent"
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(val) =>
                            setChecked((prev) => ({
                              ...prev,
                              [item.id]: !!val,
                            }))
                          }
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Icon
                              className={cn(
                                "w-3.5 h-3.5",
                                isChecked ? "text-forest-600" : "text-beige-400"
                              )}
                            />
                            <span
                              className={cn(
                                "text-[13px] font-semibold transition-colors",
                                isChecked ? "text-forest-800" : "text-brown-800"
                              )}
                            >
                              {item.label}
                            </span>
                          </div>
                          <p
                            className={cn(
                              "text-[11px] mt-0.5 ml-5.5",
                              isChecked ? "text-forest-600" : "text-beige-500"
                            )}
                          >
                            {item.description}
                          </p>
                        </div>
                        {isChecked && (
                          <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0 mt-0.5" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </motion.div>

              {/* Comments */}
              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
              >
                <h2 className="text-[14px] font-semibold text-brown-900 mb-3">
                  Comments & Notes
                </h2>
                <Textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Add any approval notes, conditions, or comments..."
                  className="min-h-[120px]"
                />
              </motion.div>

              {/* Sign-off Section */}
              <motion.div
                variants={fadeUp}
                className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5"
              >
                <h2 className="text-[14px] font-semibold text-brown-900 mb-4">
                  Sign-off
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[12px] font-semibold text-beige-600 uppercase tracking-wider block mb-1.5">
                      Approver Name
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-beige-200 bg-beige-50/60 px-4 py-2.5">
                      <User className="w-4 h-4 text-beige-400" />
                      <span className="text-sm text-brown-800 font-medium">
                        Priya Nair
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[12px] font-semibold text-beige-600 uppercase tracking-wider block mb-1.5">
                      Role
                    </label>
                    <div className="flex items-center gap-2 rounded-xl border border-beige-200 bg-beige-50/60 px-4 py-2.5">
                      <Shield className="w-4 h-4 text-beige-400" />
                      <span className="text-sm text-brown-800 font-medium">
                        {stageLabels[activeStage.stage]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Digital Signature Placeholder */}
                <div>
                  <label className="text-[12px] font-semibold text-beige-600 uppercase tracking-wider block mb-1.5">
                    Digital Signature
                  </label>
                  <div className="rounded-xl border-2 border-dashed border-beige-200 bg-beige-50/30 h-24 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-beige-400">
                      <Pen className="w-4 h-4" />
                      <span className="text-sm">Click to add digital signature</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <motion.div variants={fadeUp} className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button
                    variant="gradient-primary"
                    size="lg"
                    className="flex-1"
                    disabled={!allChecked}
                    onClick={handleApproveSubmit}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {allChecked
                      ? `Approve — ${stageLabels[activeStage.stage]}`
                      : `Complete checklist (${checkedCount}/${activeChecklist.length})`}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => {
                      setShowRejectForm((prev) => !prev);
                      setRejectionSubmitted(false);
                    }}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    Request Changes
                  </Button>
                </div>

                {/* ═══ Inline Rejection Form ═══ */}
                <AnimatePresence>
                  {showRejectForm && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-brown-200/50 bg-white/70 backdrop-blur-sm p-5 space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertOctagon className="w-4 h-4 text-brown-500" />
                          <h3 className="text-[14px] font-semibold text-brown-900">
                            Rejection / Change Request
                          </h3>
                        </div>

                        {/* Toggle: Request Changes vs Reject */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setRejectionType("changes")}
                            className={cn(
                              "flex-1 rounded-xl border px-4 py-3 text-left transition-all duration-200",
                              rejectionType === "changes"
                                ? "border-gold-300 bg-gold-50/60 ring-1 ring-gold-200"
                                : "border-beige-200 bg-white hover:border-beige-300"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={cn(
                                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                  rejectionType === "changes"
                                    ? "border-gold-500"
                                    : "border-beige-300"
                                )}
                              >
                                {rejectionType === "changes" && (
                                  <div className="w-2 h-2 rounded-full bg-gold-500" />
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-[13px] font-semibold",
                                  rejectionType === "changes"
                                    ? "text-gold-800"
                                    : "text-brown-700"
                                )}
                              >
                                Request Changes
                              </span>
                            </div>
                            <p className="text-[11px] text-beige-500 ml-6">
                              Sends SOW back to the owner for modifications
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setRejectionType("reject")}
                            className={cn(
                              "flex-1 rounded-xl border px-4 py-3 text-left transition-all duration-200",
                              rejectionType === "reject"
                                ? "border-red-300 bg-red-50/60 ring-1 ring-red-200"
                                : "border-beige-200 bg-white hover:border-beige-300"
                            )}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div
                                className={cn(
                                  "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                                  rejectionType === "reject"
                                    ? "border-red-500"
                                    : "border-beige-300"
                                )}
                              >
                                {rejectionType === "reject" && (
                                  <div className="w-2 h-2 rounded-full bg-red-500" />
                                )}
                              </div>
                              <span
                                className={cn(
                                  "text-[13px] font-semibold",
                                  rejectionType === "reject"
                                    ? "text-red-700"
                                    : "text-brown-700"
                                )}
                              >
                                Reject SOW
                              </span>
                            </div>
                            <p className="text-[11px] text-beige-500 ml-6">
                              Terminates this SOW — cannot be resumed
                            </p>
                          </button>
                        </div>

                        {/* Reason textarea */}
                        <div>
                          <label className="text-[12px] font-semibold text-beige-600 uppercase tracking-wider block mb-1.5">
                            Reason{" "}
                            <span className="text-red-400 normal-case">*</span>
                          </label>
                          <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder={
                              rejectionType === "changes"
                                ? "Describe what needs to be changed and why..."
                                : "Explain why this SOW is being rejected..."
                            }
                            className="min-h-[100px]"
                          />
                        </div>

                        {/* Submit */}
                        <div className="flex items-center gap-3">
                          <Button
                            variant={rejectionType === "reject" ? "danger" : "gold"}
                            size="md"
                            disabled={!rejectionReason.trim()}
                            onClick={handleRejectSubmit}
                          >
                            <Send className="w-3.5 h-3.5" />
                            {rejectionType === "changes"
                              ? "Send Change Request"
                              : "Reject SOW"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="md"
                            onClick={() => setShowRejectForm(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </>
          )}

          {/* ═══ Approval Success State ═══ */}
          {approvalSubmitted && (
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="show"
              className="rounded-2xl border border-forest-200/50 bg-forest-50/40 backdrop-blur-sm p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-forest-100 ring-2 ring-forest-200 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-forest-600" />
              </div>
              <h2 className="text-lg font-bold text-forest-800 font-heading mb-1">
                Stage Approved Successfully
              </h2>
              <p className="text-sm text-forest-600 mb-1">
                <span className="font-semibold">{activeStage ? stageLabels[activeStage.stage] : ""}</span> review
                has been completed and approved.
              </p>
              {comments && (
                <p className="text-[12px] text-beige-500 mt-2 italic">
                  &ldquo;{comments}&rdquo;
                </p>
              )}
              <div className="mt-5">
                <Link href={`/enterprise/sow/${sow.id}`}>
                  <Button variant="outline" size="md">
                    <ArrowLeft className="w-4 h-4" />
                    Return to SOW
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* ═══ Rejection Success State ═══ */}
          {rejectionSubmitted && (
            <motion.div
              variants={scaleIn}
              initial="hidden"
              animate="show"
              className={cn(
                "rounded-2xl border backdrop-blur-sm p-8 text-center",
                rejectionType === "changes"
                  ? "border-gold-200/50 bg-gold-50/40"
                  : "border-red-200/50 bg-red-50/40"
              )}
            >
              <div
                className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                  rejectionType === "changes"
                    ? "bg-gold-100 ring-2 ring-gold-200"
                    : "bg-red-100 ring-2 ring-red-200"
                )}
              >
                {rejectionType === "changes" ? (
                  <AlertTriangle className="w-8 h-8 text-gold-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
              </div>
              <h2
                className={cn(
                  "text-lg font-bold font-heading mb-1",
                  rejectionType === "changes" ? "text-gold-800" : "text-red-800"
                )}
              >
                {rejectionType === "changes"
                  ? "Changes Requested"
                  : "SOW Rejected"}
              </h2>
              <p
                className={cn(
                  "text-sm mb-1",
                  rejectionType === "changes" ? "text-gold-700" : "text-red-600"
                )}
              >
                {rejectionType === "changes"
                  ? "The SOW has been sent back to the owner for modifications."
                  : "This SOW has been terminated and cannot be resumed."}
              </p>
              <p className="text-[12px] text-beige-500 mt-2 italic max-w-md mx-auto">
                &ldquo;{rejectionReason}&rdquo;
              </p>
              <div className="mt-5">
                <Link href={`/enterprise/sow/${sow.id}`}>
                  <Button variant="outline" size="md">
                    <ArrowLeft className="w-4 h-4" />
                    Return to SOW
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* ═══ All Stages Complete — No Active Stage ═══ */}
          {allStagesApproved && !activeStage && !approvalSubmitted && !rejectionSubmitted && (
            <motion.div
              variants={fadeUp}
              className="rounded-2xl border border-forest-200/50 bg-forest-50/40 backdrop-blur-sm p-8 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-forest-100 ring-2 ring-forest-200 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-forest-600" />
              </div>
              <h2 className="text-lg font-bold text-forest-800 font-heading mb-1">
                All Stages Approved
              </h2>
              <p className="text-sm text-forest-600 max-w-sm mx-auto">
                This SOW has passed all approval stages and is ready for
                decomposition into tasks.
              </p>
              <div className="mt-5">
                <Link href={`/enterprise/sow/${sow.id}`}>
                  <Button variant="gradient-forest" size="md">
                    <GitBranch className="w-4 h-4" />
                    Proceed to Decomposition
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* RIGHT — SOW Summary Sidebar (1/3) */}
        <motion.div variants={slideInRight} className="space-y-4">
          {/* SOW Quick Summary */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-4">
              SOW Summary
            </h3>
            <div className="space-y-3">
              {[
                { label: "Title", value: sow.title },
                { label: "Client", value: sow.client },
                { label: "Version", value: `v${sow.version}` },
                { label: "Pages", value: `${sow.pages} pages` },
                {
                  label: "Budget",
                  value:
                    sow.estimatedBudget > 0
                      ? `$${sow.estimatedBudget.toLocaleString()}`
                      : "TBD",
                },
                { label: "Duration", value: sow.estimatedDuration },
                { label: "Industry", value: sow.industry || "—" },
                { label: "Sensitivity", value: sow.dataSensitivity },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-[12px] text-beige-600">{label}</span>
                  <span className="text-[12px] font-semibold text-brown-800 text-right max-w-[60%] truncate">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Confidence */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5 text-center">
            <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-3">
              AI Confidence
            </h3>
            <div className="flex justify-center mb-2">
              <MetricRing
                value={sow.aiConfidence}
                size={80}
                strokeWidth={6}
                color={
                  sow.aiConfidence >= 90
                    ? "forest"
                    : sow.aiConfidence >= 70
                    ? "teal"
                    : "gold"
                }
                label="Overall"
              />
            </div>
            <p className="text-[11px] text-beige-500">
              {sow.aiConfidence >= 90
                ? "High confidence analysis"
                : "Review flagged sections"}
            </p>
          </div>

          {/* Risk Breakdown */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-3">
              Risk Breakdown
            </h3>
            <div className="space-y-2.5">
              {[
                { label: "Completeness", value: sow.riskScore.completeness, max: 30 },
                { label: "Confidence", value: sow.riskScore.confidence, max: 25 },
                { label: "Compliance", value: sow.riskScore.compliance, max: 25 },
                { label: "Pattern Match", value: sow.riskScore.patternMatch, max: 20 },
              ].map(({ label, value, max }) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-beige-600">{label}</span>
                    <span className="text-[10px] font-mono text-beige-500">
                      {value}/{max}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-beige-100 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        value / max <= 0.5
                          ? "bg-forest-400"
                          : value / max <= 0.75
                          ? "bg-gold-400"
                          : "bg-brown-400"
                      )}
                      style={{ width: `${(value / max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sections Parsed */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-3">
              Parsed Sections
            </h3>
            <div className="space-y-2">
              {sections.slice(0, 6).map((section) => (
                <div
                  key={section.id}
                  className="flex items-center gap-2 py-1"
                >
                  <CheckCircle2
                    className={cn(
                      "w-3.5 h-3.5 shrink-0",
                      section.confidence >= 90
                        ? "text-forest-500"
                        : section.confidence >= 75
                        ? "text-teal-500"
                        : "text-gold-500"
                    )}
                  />
                  <span className="text-[12px] text-brown-700 truncate flex-1">
                    {section.title}
                  </span>
                  <span className="text-[10px] font-mono text-beige-500 shrink-0">
                    {section.confidence}%
                  </span>
                </div>
              ))}
              {sections.length > 6 && (
                <p className="text-[11px] text-beige-400 text-center pt-1">
                  +{sections.length - 6} more sections
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="rounded-2xl border border-beige-200/50 bg-white/70 backdrop-blur-sm p-5">
            <h3 className="text-[12px] font-bold text-beige-500 uppercase tracking-wider mb-3">
              Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {sow.tags.map((tag) => (
                <Badge key={tag} variant="beige" size="sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
