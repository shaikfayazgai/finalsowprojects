"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, ChevronLeft, ChevronDown, ChevronUp,
  DollarSign, Target, Scale, Shield, ShieldCheck, Clock, XCircle,
  Send, Sparkles, Building2, FileText, Users, Tag, Calendar,
  BookOpen, Layers, Bot, Lock, Gauge, LayoutGrid, GitBranch,
  MessageSquare, CornerDownRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Checkbox, Textarea } from "@/components/ui";
import { mockSOWs, mockSOWSections } from "@/mocks/data/enterprise-sow";

/* ══════════════════════════════════════════ Config ══════════════════════════════════════════ */

const STAGE_LABELS: Record<string, string> = {
  business:            "Business Owner",
  glimmora_commercial: "GlimmoraTeam Commercial",
  legal:               "Legal / Compliance",
  security:            "Security Review",
  final:               "Final Sign-off",
};

const STAGE_DESC: Record<string, string> = {
  business:            "Budget, scope, and business alignment",
  glimmora_commercial: "Rate cards, budget viability, and commercial terms",
  legal:               "Contractual terms and compliance review",
  security:            "Data sensitivity and security requirements",
  final:               "Executive sign-off for project initiation",
};

const STAGE_ICONS: Record<string, LucideIcon> = {
  business: DollarSign, glimmora_commercial: Target,
  legal: Scale, security: Shield, final: ShieldCheck,
};

const COMMERCIAL_CHECKLIST = [
  { id: "rate-card",        label: "Rate card alignment verified",       description: "All declared roles have configured rate cards" },
  { id: "margin-ok",        label: "Margin and fee structure approved",   description: "Budget viability vs scope confirmed" },
  { id: "resource-avail",   label: "Resource availability confirmed",     description: "Contributor matching feasible for declared skills" },
  { id: "commercial-terms", label: "Commercial terms standard-compliant", description: "Pricing model and payment schedule supported" },
];

const TABS = [
  { id: "overview",  label: "Overview",  icon: LayoutGrid },
  { id: "sections",  label: "Sections",  icon: BookOpen },
  { id: "pipeline",  label: "Pipeline",  icon: GitBranch },
] as const;
type TabId = typeof TABS[number]["id"];

/* ══════════════════════════════════════════ Helpers ══════════════════════════════════════════ */

function formatBudget(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function riskMeta(score: number) {
  if (score <= 25) return { bar: "var(--color-forest-500)", text: "text-forest-700", bg: "bg-forest-50", label: "Low Risk" };
  if (score <= 50) return { bar: "var(--color-gold-500)",   text: "text-gold-700",   bg: "bg-gold-50",   label: "Medium Risk" };
  if (score <= 75) return { bar: "#e67e22",                 text: "text-orange-700", bg: "bg-orange-50", label: "High Risk" };
  return           { bar: "var(--danger)",                  text: "text-red-700",    bg: "bg-red-50",    label: "Critical Risk" };
}

const sensitivityStyle: Record<string, string> = {
  public:       "bg-teal-50 text-teal-700 border-teal-100",
  internal:     "bg-gray-100 text-gray-600 border-gray-200",
  confidential: "bg-gold-50 text-gold-700 border-gold-100",
  restricted:   "bg-red-50 text-red-700 border-red-100",
};

/* ══════════════════════════════════════════ Sub-components ══════════════════════════════════════════ */

function SectionRow({ title, content, confidence, aiSuggestion }: {
  title: string; content: string; confidence: number; aiSuggestion?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const confColor = confidence >= 90 ? "text-forest-600 bg-forest-50" : confidence >= 75 ? "text-teal-600 bg-teal-50" : "text-gold-600 bg-gold-50";

  return (
    <div className="border-b border-beige-50 last:border-0">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-3 w-full px-6 py-4 text-left hover:bg-beige-50/60 transition-colors group"
      >
        <div className="w-6 h-6 rounded-lg bg-beige-100 flex items-center justify-center shrink-0 group-hover:bg-beige-200 transition-colors">
          <BookOpen className="w-3 h-3 text-beige-500" />
        </div>
        <span className="flex-1 text-[13px] font-medium text-gray-800 leading-snug">{title}</span>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 mr-1", confColor)}>
          {confidence}%
        </span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-beige-400 shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-beige-400 shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pt-1 ml-9 space-y-3">
              <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">{content}</p>
              {aiSuggestion && (
                <div className="flex items-start gap-2 rounded-xl bg-teal-50 border border-teal-100 px-3 py-2.5">
                  <Bot className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-teal-700 leading-snug">{aiSuggestion}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PipelineStage({ stage, index, total }: {
  stage: { stage: string; status: string; reviewer?: string; comments?: string; enterpriseReply?: string; enterpriseRepliedAt?: string };
  index: number; total: number;
}) {
  const isActive  = stage.stage === "glimmora_commercial";
  const done      = stage.status === "approved";
  const rejected  = stage.status === "rejected";
  const StageIcon = done ? CheckCircle2 : rejected ? XCircle : isActive ? Clock : (STAGE_ICONS[stage.stage] || FileText);

  return (
    <div className="flex gap-4 px-6 py-5" style={{ borderBottom: index < total - 1 ? "1px solid var(--border-hair)" : undefined }}>
      {/* Icon + connector */}
      <div className="flex flex-col items-center shrink-0">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center border-2",
          done     ? "border-forest-400 bg-forest-50" :
          isActive ? (rejected ? "border-amber-400 bg-amber-50" : "border-gold-400 bg-gold-50") :
                     "border-beige-200 bg-beige-50",
        )}>
          <StageIcon className={cn("w-4 h-4",
            done     ? "text-forest-500" :
            isActive ? (rejected ? "text-amber-500" : "text-gold-600") :
                       "text-beige-400",
          )} />
        </div>
        {index < total - 1 && (
          <div className={cn("w-0.5 flex-1 mt-1 min-h-[24px]", done ? "bg-forest-200" : "bg-beige-100")} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn("text-[13px] font-semibold", isActive ? "text-gray-900" : done ? "text-gray-700" : "text-gray-400")}>
              {STAGE_LABELS[stage.stage]}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">{STAGE_DESC[stage.stage]}</p>
          </div>
          <span className={cn(
            "shrink-0 text-[9px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mt-0.5",
            done     ? "bg-forest-50 text-forest-700" :
            isActive ? (rejected ? "bg-amber-50 text-amber-700" : "bg-gold-50 text-gold-700") :
                       "bg-gray-100 text-gray-400",
          )}>
            {done ? "Approved" : isActive ? (rejected ? "Changes Requested" : "In Review") : "Pending"}
          </span>
        </div>
        {stage.reviewer && (
          <p className="text-[11px] text-gray-400 mt-1.5">
            Reviewer: <span className="font-medium text-gray-600">{stage.reviewer}</span>
          </p>
        )}
        {stage.comments && done && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-beige-50 border border-beige-100">
            <p className="text-[11px] text-gray-500 italic">&ldquo;{stage.comments}&rdquo;</p>
          </div>
        )}
        {stage.comments && stage.status === "rejected" && (
          <div className="mt-2 space-y-2">
            <div className="px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-600 mb-1">Changes Requested</p>
              <p className="text-[11px] text-amber-900 leading-relaxed">{stage.comments}</p>
            </div>
            {stage.enterpriseReply ? (
              <div className="flex items-start gap-2">
                <CornerDownRight className="w-3 h-3 text-beige-300 mt-1 shrink-0" />
                <div className="flex-1 px-3 py-2.5 rounded-xl bg-teal-50 border border-teal-100">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-teal-600">Enterprise Reply</p>
                    {stage.enterpriseRepliedAt && (
                      <p className="text-[10px] text-teal-400">{formatDate(stage.enterpriseRepliedAt)}</p>
                    )}
                  </div>
                  <p className="text-[11px] text-teal-900 leading-relaxed">{stage.enterpriseReply}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50 border border-dashed border-gray-200">
                <Clock className="w-3 h-3 text-gray-300 shrink-0" />
                <p className="text-[10px] text-gray-400 italic">Awaiting enterprise response…</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════ Page ══════════════════════════════════════════ */

export default function AdminSOWApprovePage() {
  const params = useParams();
  const router = useRouter();
  const sowId  = params.sowId as string;

  const sow      = mockSOWs.find((s) => s.id === sowId) ?? null;
  const sections = mockSOWSections.filter((s) => s.sowId === sowId).sort((a, b) => a.order - b.order);

  const [tab, setTab]                               = React.useState<TabId>("overview");
  const [checked, setChecked]                       = React.useState<Record<string, boolean>>({});
  const [notes, setNotes]                           = React.useState("");
  const [panelMode, setPanelMode]                   = React.useState<"checklist" | "reject">("checklist");
  const [rejectionReason, setRejectionReason]       = React.useState("");
  const [approvalSubmitted, setApprovalSubmitted]   = React.useState(false);
  const [rejectionSubmitted, setRejectionSubmitted] = React.useState(false);

  const checkedCount = COMMERCIAL_CHECKLIST.filter((item) => checked[item.id]).length;
  const allChecked   = checkedCount === COMMERCIAL_CHECKLIST.length;

  if (!sow) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 rounded-2xl bg-beige-50 flex items-center justify-center mb-4">
          <FileText className="w-6 h-6 text-beige-300" />
        </div>
        <p className="text-[14px] font-semibold text-brown-950 mb-1">SOW not found</p>
        <p className="text-sm text-beige-500 mb-5">This document may have been removed or is unavailable.</p>
        <Link href="/admin/sow" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brown-600 hover:text-brown-900 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Oversight
        </Link>
      </div>
    );
  }

  const glimmoraStage      = sow.approvalStages.find((s) => s.stage === "glimmora_commercial");
  const isChangesRequested = glimmoraStage?.status === "rejected";
  const risk               = riskMeta(sow.riskScore.overall);

  function handleApprove() {
    setApprovalSubmitted(true);
    setPanelMode("checklist");
    setTimeout(() => router.push("/admin/sow"), 2200);
  }

  function handleReject() {
    if (!rejectionReason.trim()) return;
    setRejectionSubmitted(true);
    setPanelMode("checklist");
    setTimeout(() => router.push("/admin/sow"), 2500);
  }

  /* ── Success screens ── */
  if (approvalSubmitted || rejectionSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center max-w-md mx-auto"
      >
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6",
          approvalSubmitted
            ? "bg-gradient-to-br from-forest-400 to-forest-600"
            : "bg-gradient-to-br from-gold-400 to-gold-600",
        )}>
          {approvalSubmitted
            ? <Sparkles className="w-8 h-8 text-white" />
            : <AlertTriangle className="w-8 h-8 text-white" />}
        </div>
        <h2 className="font-heading text-[22px] font-bold text-brown-950 mb-2">
          {approvalSubmitted ? "Commercial Stage Approved" : "Changes Requested"}
        </h2>
        <p className="text-[13px] text-beige-600 max-w-[300px] leading-relaxed">
          {approvalSubmitted
            ? "This SOW will now advance to Legal / Compliance review. Redirecting to oversight…"
            : "Sent back to the enterprise admin for revision. Redirecting…"}
        </p>
        {(notes || rejectionReason) && (
          <p className="text-[12px] text-beige-400 italic mt-4 max-w-[340px]">
            &ldquo;{approvalSubmitted ? notes : rejectionReason}&rdquo;
          </p>
        )}
      </motion.div>
    );
  }

  /* ── Main layout ── */
  return (
    <div className="flex flex-col gap-0 -mx-6 -mt-2">

      {/* ════════════════════════════════ HEADER BAND ════════════════════════════════ */}
      <div className="px-6 pt-6 pb-5 border-b border-beige-100 bg-white">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-[11px] text-beige-400 mb-4">
          <Link href="/admin/dashboard" className="hover:text-brown-700 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/admin/sow" className="hover:text-brown-700 transition-colors">SOW Oversight</Link>
          <span>/</span>
          <span className="text-brown-700 font-medium truncate max-w-[200px]">{sow.title}</span>
          <span>/</span>
          <span className="text-brown-700 font-medium">Review</span>
        </div>

        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Title block */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border",
                isChangesRequested ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gold-50 text-gold-700 border-gold-200",
              )}>
                <Clock className="w-3 h-3" />
                {isChangesRequested ? "Changes Requested" : "Awaiting Commercial Review"}
              </span>
              {sow.riskScore.overall > 0 && (
                <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border", risk.bg, risk.text,
                  sow.riskScore.overall <= 25 ? "border-forest-100" : sow.riskScore.overall <= 50 ? "border-gold-100" : "border-red-100",
                )}>
                  <Shield className="w-3 h-3" />
                  {risk.label} · {sow.riskScore.overall}/100
                </span>
              )}
              <span className={cn(
                "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full border",
                sensitivityStyle[sow.dataSensitivity] ?? "bg-gray-100 text-gray-600 border-gray-200",
              )}>
                <Lock className="w-3 h-3" />
                {sow.dataSensitivity}
              </span>
            </div>

            <h1 className="font-heading text-[22px] font-bold text-brown-950 tracking-tight leading-snug">
              {sow.title}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 text-[12px] text-beige-500 flex-wrap">
              <Building2 className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium text-gray-600">{sow.client}</span>
              {sow.industry && <><span className="text-beige-300">·</span><span>{sow.industry}</span></>}
              <span className="text-beige-300">·</span>
              <span>Submitted by <span className="font-medium text-gray-600">{sow.createdBy}</span></span>
              <span className="text-beige-300">·</span>
              <span>{formatDate(sow.updatedAt)}</span>
            </div>
          </div>

          {/* Key stats strip */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {[
              { icon: DollarSign, label: "Value",       value: formatBudget(sow.estimatedBudget) },
              { icon: Calendar,   label: "Duration",    value: sow.estimatedDuration },
              { icon: BookOpen,   label: "Pages",       value: String(sow.pages) },
              { icon: Gauge,      label: "AI Conf.",    value: `${sow.aiConfidence}%` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center px-4 py-2.5 rounded-xl bg-beige-50 border border-beige-100 min-w-[72px]">
                <Icon className="w-3.5 h-3.5 text-beige-400 mx-auto mb-1" />
                <p className="text-[14px] font-bold text-brown-950 leading-none">{value}</p>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-beige-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Change request thread banner */}
        {isChangesRequested && glimmoraStage?.comments && (
          <div className="mt-4 rounded-2xl border border-amber-200 overflow-hidden">
            {/* Glimmora request row */}
            <div className="flex items-start gap-3 bg-amber-50 px-4 py-3.5">
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold text-amber-800">GlimmoraTeam Admin</span>
                  <span className="text-[10px] text-amber-500">·</span>
                  <span className="text-[10px] text-amber-500">
                    {glimmoraStage.reviewedAt ? formatDate(glimmoraStage.reviewedAt) : ""}
                  </span>
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-200 text-amber-700">
                    Changes Requested
                  </span>
                </div>
                <p className="text-[12px] text-amber-900 leading-relaxed">{glimmoraStage.comments}</p>
              </div>
            </div>

            {/* Enterprise reply row */}
            {glimmoraStage.enterpriseReply && (
              <div className="flex items-start gap-3 bg-white px-4 py-3.5 border-t border-amber-100">
                <div className="flex flex-col items-center shrink-0">
                  <CornerDownRight className="w-3.5 h-3.5 text-beige-300 mt-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-2.5 h-2.5 text-teal-600" />
                    </div>
                    <span className="text-[11px] font-bold text-gray-800">Enterprise Admin</span>
                    <span className="text-[10px] text-gray-400">·</span>
                    <span className="text-[10px] text-gray-400">
                      {glimmoraStage.enterpriseRepliedAt ? formatDate(glimmoraStage.enterpriseRepliedAt) : ""}
                    </span>
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                      Reply
                    </span>
                  </div>
                  <p className="text-[12px] text-gray-700 leading-relaxed">{glimmoraStage.enterpriseReply}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════ BODY — two columns ════════════════════════════════ */}
      <div className="flex gap-0 flex-1 min-h-0">

        {/* ── LEFT: scrollable content ── */}
        <div className="flex-1 min-w-0 overflow-y-auto">

          {/* Tab bar */}
          <div className="flex items-center gap-0 px-6 pt-0 border-b border-beige-100 bg-white sticky top-0 z-10">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3.5 text-[12px] font-semibold border-b-2 transition-all",
                  tab === id
                    ? "border-brown-600 text-brown-950"
                    : "border-transparent text-beige-400 hover:text-brown-700",
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {id === "sections" && sections.length > 0 && (
                  <span className="ml-1 px-1.5 text-[9px] font-bold rounded-full bg-beige-100 text-beige-500">
                    {sections.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="px-6 py-6 space-y-6">

            {/* ── OVERVIEW TAB ── */}
            {tab === "overview" && (
              <>
                {/* Stakeholders + Tags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl bg-white border border-beige-100 shadow-sm px-5 py-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Users className="w-3.5 h-3.5 text-beige-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-beige-400">Stakeholders</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(sow.stakeholders ?? []).map((s) => (
                        <span key={s} className="inline-flex items-center text-[11px] font-medium text-brown-700 bg-beige-50 border border-beige-100 px-2.5 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white border border-beige-100 shadow-sm px-5 py-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Tag className="w-3.5 h-3.5 text-beige-400" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-beige-400">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(sow.tags ?? []).map((t) => (
                        <span key={t} className="text-[11px] font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-full">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Risk Breakdown */}
                {sow.riskScore.overall > 0 && (
                  <div className="rounded-2xl bg-white border border-beige-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-beige-50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-beige-400">Risk Score Breakdown</p>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      {/* Overall */}
                      <div className="flex items-center gap-4 pb-4 border-b border-beige-50">
                        <span className="text-[12px] font-semibold text-gray-700 w-32 shrink-0">Overall Risk</span>
                        <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${sow.riskScore.overall}%`, background: risk.bar }} />
                        </div>
                        <span className="font-mono text-[14px] font-bold w-8 text-right" style={{ color: risk.bar }}>
                          {sow.riskScore.overall}
                        </span>
                      </div>
                      {/* Dimensions */}
                      {[
                        { label: "Completeness",  value: sow.riskScore.completeness },
                        { label: "Confidence",    value: sow.riskScore.confidence },
                        { label: "Compliance",    value: sow.riskScore.compliance },
                        { label: "Pattern Match", value: sow.riskScore.patternMatch },
                      ].map(({ label, value }) => {
                        const c = riskMeta(value);
                        return (
                          <div key={label} className="flex items-center gap-4">
                            <span className="text-[11px] text-gray-500 w-32 shrink-0">{label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${value}%`, background: c.bar }} />
                            </div>
                            <span className="font-mono text-[11px] font-semibold w-8 text-right" style={{ color: c.bar }}>
                              {value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Hallucination Flags */}
                {(sow.hallucinationFlags ?? []).length > 0 && (
                  <div className="rounded-2xl bg-white border border-beige-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-beige-50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-beige-400">AI Hallucination Flags</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                        {sow.hallucinationFlags!.length} flag{sow.hallucinationFlags!.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="divide-y divide-beige-50">
                      {sow.hallucinationFlags!.map((flag) => (
                        <div key={flag.id} className="px-5 py-4 flex items-start gap-3">
                          <div className={cn("mt-1 w-2 h-2 rounded-full shrink-0",
                            flag.severity === "high" ? "bg-red-500" : flag.severity === "medium" ? "bg-gold-500" : "bg-teal-400",
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-gray-800 mb-0.5 italic">&ldquo;{flag.clause}&rdquo;</p>
                            <p className="text-[11px] text-gray-500 mb-1">{flag.reason}</p>
                            {flag.suggestion && <p className="text-[11px] text-teal-600 font-medium">Suggestion: {flag.suggestion}</p>}
                          </div>
                          <span className={cn("shrink-0 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full",
                            flag.severity === "high" ? "bg-red-50 text-red-700" : flag.severity === "medium" ? "bg-gold-50 text-gold-700" : "bg-teal-50 text-teal-700",
                          )}>
                            {flag.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No flags */}
                {(sow.hallucinationFlags ?? []).length === 0 && (
                  <div className="rounded-2xl bg-forest-50 border border-forest-100 px-5 py-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-forest-500 shrink-0" />
                    <div>
                      <p className="text-[12px] font-semibold text-forest-700">No hallucination flags detected</p>
                      <p className="text-[11px] text-forest-600 mt-0.5">AI extraction passed all clause integrity checks.</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── SECTIONS TAB ── */}
            {tab === "sections" && (
              <div className="rounded-2xl bg-white border border-beige-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-beige-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-beige-400">Parsed Sections</p>
                  <span className="text-[11px] text-beige-400">
                    {sections.length > 0 ? `${sections.length} sections · v${sow.version}` : "No sections extracted"}
                  </span>
                </div>
                {sections.length > 0 ? (
                  sections.map((s) => (
                    <SectionRow
                      key={s.id}
                      title={s.title}
                      content={s.content}
                      confidence={s.confidence}
                      aiSuggestion={s.aiSuggestion}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 text-center px-8">
                    <Layers className="w-8 h-8 text-beige-200 mb-3" />
                    <p className="text-[13px] font-semibold text-brown-950 mb-1">
                      {sow.parsedSections > 0 ? `${sow.parsedSections} sections parsed` : "No sections extracted"}
                    </p>
                    <p className="text-[12px] text-beige-500">
                      {sow.parsedSections > 0
                        ? "Full section text is available in the source document."
                        : "This SOW has not yet been processed by the AI extraction engine."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── PIPELINE TAB ── */}
            {tab === "pipeline" && (
              <div className="rounded-2xl bg-white border border-beige-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-beige-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-beige-400">Approval Pipeline</p>
                  <p className="text-[11px] text-beige-400 mt-0.5">5-stage review process — currently at GlimmoraTeam Commercial</p>
                </div>
                {sow.approvalStages.map((stage, i) => (
                  <PipelineStage key={stage.stage} stage={stage} index={i} total={sow.approvalStages.length} />
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ── RIGHT: sticky approval panel ── */}
        <div className="w-[320px] shrink-0 border-l border-beige-100 bg-white">
          <div className="sticky top-0">

            {/* Panel header */}
            <div className="px-5 py-4 border-b border-beige-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-beige-400 mb-0.5">Commercial Review</p>
              <p className="text-[13px] font-semibold text-brown-950">Stage 2 of 5</p>
              <p className="text-[11px] text-beige-500 mt-0.5">Validate rate cards, budget viability, and commercial terms</p>
            </div>

            <AnimatePresence mode="wait">

              {/* ── CHECKLIST mode ── */}
              {panelMode === "checklist" && (
                <motion.div
                  key="checklist"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }}
                >
                  {/* Progress */}
                  <div className="px-5 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-gray-700">Checklist</span>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full",
                        allChecked ? "bg-forest-50 text-forest-700" : "bg-gold-50 text-gold-700",
                      )}>
                        {checkedCount}/{COMMERCIAL_CHECKLIST.length}
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", allChecked ? "bg-forest-500" : "bg-gradient-to-r from-brown-400 to-brown-500")}
                        style={{ width: `${(checkedCount / COMMERCIAL_CHECKLIST.length) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-5 pb-4 space-y-1 mt-2">
                    {COMMERCIAL_CHECKLIST.map((item) => {
                      const isChecked = !!checked[item.id];
                      return (
                        <label
                          key={item.id}
                          className={cn(
                            "flex items-start gap-3 px-3 py-3 rounded-xl cursor-pointer transition-colors",
                            isChecked ? "bg-forest-50" : "hover:bg-beige-50",
                          )}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={(val) => setChecked((prev) => ({ ...prev, [item.id]: !!val }))}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[12px] font-medium leading-snug transition-colors", isChecked ? "text-forest-700" : "text-gray-800")}>
                              {item.label}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{item.description}</p>
                          </div>
                          {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-forest-500 shrink-0 mt-0.5" />}
                        </label>
                      );
                    })}
                  </div>

                  {/* Notes */}
                  <div className="px-5 pb-4 border-t border-beige-50 pt-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-beige-400 mb-2">Approval Notes</p>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional notes or conditions…"
                      className="min-h-[72px] text-[12px] resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="px-5 pb-5 space-y-2 border-t border-beige-50 pt-4">
                    <button
                      disabled={!allChecked}
                      onClick={handleApprove}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 text-[13px] font-semibold py-2.5 rounded-xl transition-all",
                        allChecked
                          ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 shadow-sm"
                          : "text-gray-400 bg-gray-100 cursor-not-allowed",
                      )}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {allChecked ? "Approve Commercial Stage" : `Verify all ${COMMERCIAL_CHECKLIST.length} items`}
                    </button>

                    <button
                      onClick={() => setPanelMode("reject")}
                      className="w-full flex items-center justify-center gap-2 text-[12px] font-semibold text-amber-700 py-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Request Changes
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── REQUEST CHANGES mode ── */}
              {panelMode === "reject" && (
                <motion.div
                  key="reject"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.15 }}
                  className="flex flex-col"
                >
                  {/* Panel title */}
                  <div className="px-5 pt-5 pb-4 border-b border-beige-50">
                    <div className="flex items-center gap-2 mb-0.5">
                      <MessageSquare className="w-4 h-4 text-amber-500 shrink-0" />
                      <p className="text-[13px] font-semibold text-gray-900">Change Request Thread</p>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-snug">
                      Conversation history for this commercial review stage.
                    </p>
                  </div>

                  {/* ── Thread: existing messages ── */}
                  {isChangesRequested && glimmoraStage?.comments && (
                    <div className="px-5 pt-4 pb-3 space-y-3">

                      {/* Glimmora original request */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-[11px] font-bold text-gray-800">You</span>
                            <span className="text-[10px] text-gray-400">
                              {glimmoraStage.reviewedAt ? formatDate(glimmoraStage.reviewedAt) : ""}
                            </span>
                          </div>
                          <div className="rounded-xl rounded-tl-none bg-amber-50 border border-amber-100 px-3 py-2.5">
                            <p className="text-[11.5px] text-amber-900 leading-relaxed">{glimmoraStage.comments}</p>
                          </div>
                        </div>
                      </div>

                      {/* Enterprise reply bubble */}
                      {glimmoraStage.enterpriseReply ? (
                        <div className="flex items-start gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Building2 className="w-3 h-3 text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5 mb-1">
                              <span className="text-[11px] font-bold text-gray-800">Enterprise Admin</span>
                              <span className="text-[10px] text-gray-400">
                                {glimmoraStage.enterpriseRepliedAt ? formatDate(glimmoraStage.enterpriseRepliedAt) : ""}
                              </span>
                              <span className="ml-auto text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
                                Reply
                              </span>
                            </div>
                            <div className="rounded-xl rounded-tl-none bg-teal-50 border border-teal-100 px-3 py-2.5">
                              <p className="text-[11.5px] text-teal-900 leading-relaxed">{glimmoraStage.enterpriseReply}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-dashed border-gray-200">
                          <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                          <p className="text-[11px] text-gray-400 italic">Awaiting enterprise admin response…</p>
                        </div>
                      )}

                      <div className="border-t border-beige-50 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-beige-400 mb-2">
                          {glimmoraStage.enterpriseReply ? "Send Follow-up" : "Add Another Request"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── New message composer ── */}
                  <div className={cn("px-5 pb-5", !(isChangesRequested && glimmoraStage?.comments) && "pt-5")}>
                    {!(isChangesRequested && glimmoraStage?.comments) && (
                      <p className="text-[11px] text-gray-400 mb-3 leading-snug">
                        Describe what needs to be addressed before this SOW can receive commercial approval.
                      </p>
                    )}
                    <Textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder={glimmoraStage?.enterpriseReply
                        ? "Send a follow-up or additional request…"
                        : "e.g. Budget range too low for declared scope. Rate cards for senior roles are missing."}
                      className="min-h-[100px] text-[12px] resize-none mb-4"
                      autoFocus
                    />

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setPanelMode("checklist"); setRejectionReason(""); }}
                        className="flex-1 text-[12px] font-medium text-gray-500 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!rejectionReason.trim()}
                        onClick={handleReject}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-1.5 text-[12px] font-semibold py-2.5 rounded-xl transition-all",
                          rejectionReason.trim()
                            ? "text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-sm"
                            : "text-gray-400 bg-gray-100 cursor-not-allowed",
                        )}
                      >
                        <Send className="w-3.5 h-3.5" />
                        {glimmoraStage?.enterpriseReply ? "Send Follow-up" : "Send Request"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
