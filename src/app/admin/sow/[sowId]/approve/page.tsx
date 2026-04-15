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
  MessageSquare, CornerDownRight, CircleDot, Paperclip, File, ImageIcon,
  ClipboardList, Info, HardDrive, Cpu, ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Checkbox, Textarea } from "@/components/ui";
import { mockSOWs, mockSOWSections } from "@/mocks/data/enterprise-sow";
import { getSOWWizardRecord } from "@/mocks/data/sow-wizard-data";

/* ─── Config ─────────────────────────────────────────────────── */

const STAGE_LABELS: Record<string, string> = {
  business:            "Business Owner",
  glimmora_commercial: "GlimmoraTeam Commercial",
  legal:               "Legal / Compliance",
  security:            "Security Review",
  final:               "Final Sign-off",
};

const STAGE_DESC: Record<string, string> = {
  business:            "Budget, scope & business alignment",
  glimmora_commercial: "Rate cards, budget viability & commercial terms",
  legal:               "Contractual terms & compliance review",
  security:            "Data sensitivity & security requirements",
  final:               "Executive sign-off for project initiation",
};

const STAGE_ICONS: Record<string, LucideIcon> = {
  business: DollarSign, glimmora_commercial: Target,
  legal: Scale, security: Shield, final: ShieldCheck,
};

const COMMERCIAL_CHECKLIST = [
  { id: "rate-card",        label: "Rate card alignment verified",       description: "All declared roles have configured rate cards" },
  { id: "margin-ok",        label: "Margin & fee structure approved",    description: "Budget viability vs scope confirmed" },
  { id: "resource-avail",   label: "Resource availability confirmed",    description: "Contributor matching feasible for declared skills" },
  { id: "commercial-terms", label: "Commercial terms standard-compliant", description: "Pricing model and payment schedule supported" },
];

const TABS = [
  { id: "overview",  label: "Overview",  icon: LayoutGrid },
  { id: "details",   label: "SOW Details", icon: ClipboardList },
  { id: "sections",  label: "Sections",  icon: BookOpen },
  { id: "pipeline",  label: "Pipeline",  icon: GitBranch },
] as const;
type TabId = typeof TABS[number]["id"];

/* ─── Helpers ────────────────────────────────────────────────── */

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

/* ─── Read-only Field ────────────────────────────────────────── */

function ReadOnlyField({ label, value, wide = false, mono = false }: {
  label: string; value: React.ReactNode; wide?: boolean; mono?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1", wide && "col-span-2")}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
      <div className={cn(
        "px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-[12.5px] text-gray-700 leading-snug min-h-[36px] flex items-center",
        mono && "font-mono",
      )}>
        {value ?? <span className="text-gray-300 italic">—</span>}
      </div>
    </div>
  );
}

/* ─── Section Row ────────────────────────────────────────────── */

function SectionRow({ title, content, confidence, aiSuggestion }: {
  title: string; content: string; confidence: number; aiSuggestion?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const confColor = confidence >= 90
    ? "text-forest-600 bg-forest-50 border-forest-100"
    : confidence >= 75
    ? "text-teal-600 bg-teal-50 border-teal-100"
    : "text-gold-600 bg-gold-50 border-gold-100";

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-3 w-full px-5 py-3.5 text-left hover:bg-gray-50 transition-colors group"
      >
        <FileText className="w-3.5 h-3.5 text-gray-300 shrink-0 group-hover:text-gray-400 transition-colors" />
        <span className="flex-1 text-[13px] font-medium text-gray-700 leading-snug">{title}</span>
        <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 mr-1", confColor)}>
          {confidence}%
        </span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-gray-300 shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-1 ml-6 space-y-3">
              <p className="text-[12.5px] text-gray-500 leading-relaxed whitespace-pre-line">{content}</p>
              {aiSuggestion && (
                <div className="flex items-start gap-2 rounded-lg bg-teal-50 border border-teal-100 px-3 py-2.5">
                  <Bot className="w-3.5 h-3.5 text-teal-500 mt-0.5 shrink-0" />
                  <p className="text-[11.5px] text-teal-700 leading-snug">{aiSuggestion}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Pipeline Stage ─────────────────────────────────────────── */

function PipelineStage({ stage, index, total }: {
  stage: { stage: string; status: string; reviewer?: string; comments?: string; enterpriseReply?: string; enterpriseRepliedAt?: string };
  index: number; total: number;
}) {
  const isActive  = stage.stage === "glimmora_commercial";
  const done      = stage.status === "approved";
  const rejected  = stage.status === "rejected";
  const StageIcon = done ? CheckCircle2 : rejected ? AlertTriangle : isActive ? Clock : (STAGE_ICONS[stage.stage] || CircleDot);

  return (
    <div className={cn("flex gap-4 px-5 py-4", index < total - 1 && "border-b border-gray-100")}>
      <div className="flex flex-col items-center shrink-0">
        <div className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center border",
          done     ? "border-forest-300 bg-forest-50" :
          rejected ? "border-amber-300 bg-amber-50" :
          isActive ? "border-gold-300 bg-gold-50" :
                     "border-gray-200 bg-gray-50",
        )}>
          <StageIcon className={cn("w-3.5 h-3.5",
            done ? "text-forest-500" : rejected ? "text-amber-500" : isActive ? "text-gold-600" : "text-gray-300",
          )} />
        </div>
        {index < total - 1 && (
          <div className={cn("w-px flex-1 mt-1.5 min-h-[20px]", done ? "bg-forest-200" : "bg-gray-100")} />
        )}
      </div>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className={cn("text-[12.5px] font-semibold leading-snug",
              done ? "text-gray-700" : isActive ? "text-gray-900" : "text-gray-400",
            )}>
              {STAGE_LABELS[stage.stage]}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{STAGE_DESC[stage.stage]}</p>
          </div>
          <span className={cn(
            "shrink-0 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md mt-0.5",
            done     ? "bg-forest-50 text-forest-700 border border-forest-100" :
            rejected ? "bg-amber-50 text-amber-700 border border-amber-100" :
            isActive ? "bg-gold-50 text-gold-700 border border-gold-100" :
                       "bg-gray-50 text-gray-400 border border-gray-100",
          )}>
            {done ? "Approved" : rejected ? "Changes Requested" : isActive ? "In Review" : "Pending"}
          </span>
        </div>

        {stage.reviewer && (
          <p className="text-[11px] text-gray-400 mt-1.5">
            Reviewer: <span className="font-medium text-gray-600">{stage.reviewer}</span>
          </p>
        )}

        {done && stage.comments && (
          <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-[11px] text-gray-400 italic">&ldquo;{stage.comments}&rdquo;</p>
          </div>
        )}

        {rejected && stage.comments && (
          <div className="mt-2.5 space-y-2">
            <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
              <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide mb-1">Changes Requested</p>
              <p className="text-[11.5px] text-amber-900 leading-relaxed">{stage.comments}</p>
            </div>
            {stage.enterpriseReply ? (
              <div className="flex gap-2">
                <CornerDownRight className="w-3 h-3 text-gray-300 mt-1 shrink-0" />
                <div className="flex-1 rounded-lg bg-teal-50 border border-teal-100 px-3 py-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[10px] font-semibold text-teal-600 uppercase tracking-wide">Enterprise Reply</p>
                    {stage.enterpriseRepliedAt && <p className="text-[10px] text-teal-400">{formatDate(stage.enterpriseRepliedAt)}</p>}
                  </div>
                  <p className="text-[11.5px] text-teal-900 leading-relaxed">{stage.enterpriseReply}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-200">
                <Clock className="w-3 h-3 text-gray-300 shrink-0" />
                <p className="text-[11px] text-gray-400">Awaiting enterprise response…</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */

export default function AdminSOWApprovePage() {
  const params = useParams();
  const router = useRouter();
  const sowId  = params.sowId as string;

  const sow        = mockSOWs.find(s => s.id === sowId) ?? null;
  const sections   = mockSOWSections.filter(s => s.sowId === sowId).sort((a, b) => a.order - b.order);
  const wizardRec  = sow ? getSOWWizardRecord(sow.id, sow.intakeMode) : null;

  const [tab, setTab]                               = React.useState<TabId>("overview");
  const [checked, setChecked]                       = React.useState<Record<string, boolean>>({});
  const [notes, setNotes]                           = React.useState("");
  const [panelMode, setPanelMode]                   = React.useState<"checklist" | "reject">("checklist");
  const [rejectionReason, setRejectionReason]       = React.useState("");
  const [approvalSubmitted, setApprovalSubmitted]   = React.useState(false);
  const [rejectionSubmitted, setRejectionSubmitted] = React.useState(false);
  const [followUpSent, setFollowUpSent]             = React.useState(false);
  const [composerFiles, setComposerFiles]           = React.useState<Array<{ name: string; size: number; type: string }>>([]);
  const composerFileRef                             = React.useRef<HTMLInputElement>(null);
  const [detailsPage, setDetailsPage]               = React.useState(0);

  const checkedCount = COMMERCIAL_CHECKLIST.filter(item => checked[item.id]).length;
  const allChecked   = checkedCount === COMMERCIAL_CHECKLIST.length;

  if (!sow) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
          <FileText className="w-5 h-5 text-gray-300" />
        </div>
        <p className="text-[14px] font-semibold text-gray-800 mb-1">SOW not found</p>
        <p className="text-[12px] text-gray-400 mb-5">This document may have been removed or is unavailable.</p>
        <Link href="/admin/sow" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brown-600 hover:text-brown-800 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to SOW Oversight
        </Link>
      </div>
    );
  }

  const glimmoraStage      = sow.approvalStages.find(s => s.stage === "glimmora_commercial");
  const isChangesRequested = glimmoraStage?.status === "rejected";
  const isFollowUp         = isChangesRequested && !!glimmoraStage?.enterpriseReply;
  const risk               = riskMeta(sow.riskScore.overall);

  function handleApprove() {
    setApprovalSubmitted(true);
    setPanelMode("checklist");
    setTimeout(() => router.push("/admin/sow"), 2200);
  }

  function handleReject() {
    if (!isFollowUp && !rejectionReason.trim() && composerFiles.length === 0) return;
    setComposerFiles([]);
    if (isFollowUp) {
      setFollowUpSent(true);
      setRejectionReason("");
      setPanelMode("checklist");
    } else {
      setRejectionSubmitted(true);
      setPanelMode("checklist");
      setTimeout(() => router.push("/admin/sow"), 2500);
    }
  }

  /* ── Success screens ── */
  if (approvalSubmitted || rejectionSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-32 text-center max-w-sm mx-auto"
      >
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5",
          approvalSubmitted ? "bg-forest-500" : "bg-amber-500",
        )}>
          {approvalSubmitted
            ? <CheckCircle2 className="w-7 h-7 text-white" />
            : <AlertTriangle className="w-7 h-7 text-white" />}
        </div>
        <h2 className="font-heading text-[20px] font-bold text-gray-900 mb-2">
          {approvalSubmitted ? "Commercial Stage Approved" : "Changes Requested"}
        </h2>
        <p className="text-[13px] text-gray-400 leading-relaxed">
          {approvalSubmitted
            ? "This SOW advances to Legal / Compliance review. Redirecting…"
            : "Sent back to the enterprise admin for revision. Redirecting…"}
        </p>
      </motion.div>
    );
  }

  /* ── Main layout ── */
  return (
    <div className="-mx-6 -mt-2 flex flex-col" style={{ minHeight: "calc(100vh - 60px)" }}>

      {/* ══ HEADER ══════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 shrink-0">

        {/* Top bar: back + meta */}
        <div className="px-6 pt-5 pb-4">
          <Link
            href="/admin/sow"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 hover:text-gray-700 transition-colors mb-4"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            SOW Oversight
          </Link>

          <div className="flex items-start justify-between gap-6">
            {/* Left: title + meta */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border",
                  isChangesRequested ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-gold-50 text-gold-700 border-gold-200",
                )}>
                  <Clock className="w-2.5 h-2.5" />
                  {isChangesRequested ? "Changes Requested" : "Awaiting Commercial Review"}
                </span>
                {sow.riskScore.overall > 0 && (
                  <span className={cn(
                    "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border",
                    risk.bg, risk.text,
                    sow.riskScore.overall <= 25 ? "border-forest-100" : sow.riskScore.overall <= 50 ? "border-gold-100" : "border-red-100",
                  )}>
                    <Shield className="w-2.5 h-2.5" />
                    {risk.label}
                  </span>
                )}
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md border",
                  sensitivityStyle[sow.dataSensitivity] ?? "bg-gray-100 text-gray-600 border-gray-200",
                )}>
                  <Lock className="w-2.5 h-2.5" />
                  {sow.dataSensitivity}
                </span>
              </div>

              <h1 className="font-heading text-[22px] font-bold text-gray-900 tracking-tight leading-tight mb-1.5">
                {sow.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3 h-3" />
                  <span className="font-medium text-gray-600">{sow.client}</span>
                </span>
                {sow.industry && <><span className="text-gray-200">|</span><span>{sow.industry}</span></>}
                <span className="text-gray-200">|</span>
                <span>Submitted by <span className="font-medium text-gray-600">{sow.createdBy}</span></span>
                <span className="text-gray-200">|</span>
                <span>{formatDate(sow.updatedAt)}</span>
              </div>
            </div>

            {/* Right: stat tiles */}
            <div className="flex items-center gap-2 shrink-0">
              {[
                { icon: DollarSign, label: "Contract Value", value: formatBudget(sow.estimatedBudget) },
                { icon: Calendar,   label: "Duration",       value: sow.estimatedDuration },
                { icon: BookOpen,   label: "Pages",          value: String(sow.pages) },
                { icon: Gauge,      label: "AI Confidence",  value: `${sow.aiConfidence}%` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex flex-col items-center px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 min-w-[76px]">
                  <Icon className="w-3.5 h-3.5 text-gray-300 mb-1.5" />
                  <p className="text-[14px] font-bold text-gray-900 leading-none">{value}</p>
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400 mt-1 text-center leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Change request thread — only when applicable */}
        {isChangesRequested && glimmoraStage?.comments && (
          <div className="mx-6 mb-4 rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            {/* Glimmora message */}
            <div className="flex gap-3 px-4 py-3.5 bg-amber-50 border-b border-amber-100">
              <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-semibold text-amber-900">GlimmoraTeam Admin</span>
                  <span className="text-[10px] text-amber-400">{glimmoraStage.reviewedAt ? formatDate(glimmoraStage.reviewedAt) : ""}</span>
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">
                    Changes Requested
                  </span>
                </div>
                <p className="text-[12px] text-amber-800 leading-relaxed">{glimmoraStage.comments}</p>
              </div>
            </div>

            {/* Enterprise reply */}
            {glimmoraStage.enterpriseReply && !followUpSent && (
              <div className="flex gap-3 px-4 py-3.5 bg-white">
                <CornerDownRight className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <Building2 className="w-2.5 h-2.5 text-teal-600" />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-800">Enterprise Admin</span>
                    <span className="text-[10px] text-gray-400">
                      {glimmoraStage.enterpriseRepliedAt ? formatDate(glimmoraStage.enterpriseRepliedAt) : ""}
                    </span>
                    <button
                      onClick={() => { setTab("details"); setDetailsPage(0); setPanelMode("reject"); }}
                      className="ml-auto inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-600 border border-teal-100 hover:bg-teal-100 transition-colors"
                    >
                      <MessageSquare className="w-2.5 h-2.5" /> Reply
                    </button>
                  </div>
                  <p className="text-[12px] text-gray-600 leading-relaxed">{glimmoraStage.enterpriseReply}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex px-6 gap-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setTab(id); if (id === "details") setDetailsPage(0); }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold border-b-2 transition-all",
                tab === id
                  ? "border-brown-600 text-brown-950"
                  : "border-transparent text-gray-400 hover:text-gray-700",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {id === "sections" && sections.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-gray-100 text-gray-500">
                  {sections.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══ BODY ════════════════════════════════════════════════ */}
      <div className="flex flex-col flex-1 min-h-0 bg-gray-50">

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-6 py-6 space-y-4 pb-4">

            {/* ── OVERVIEW TAB ── */}
            {tab === "overview" && (
              <>
                {/* Stakeholders + Tags */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white border border-gray-100 shadow-sm px-5 py-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Users className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Stakeholders</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(sow.stakeholders ?? []).map(s => (
                        <span key={s} className="inline-flex items-center text-[11px] font-medium text-gray-700 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white border border-gray-100 shadow-sm px-5 py-4">
                    <div className="flex items-center gap-1.5 mb-3">
                      <Tag className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(sow.tags ?? []).map(t => (
                        <span key={t} className="text-[11px] font-medium text-teal-700 bg-teal-50 border border-teal-100 px-2.5 py-1 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Risk Breakdown */}
                {sow.riskScore.overall > 0 && (
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Risk Score Breakdown</p>
                      <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md", risk.bg, risk.text)}>
                        {sow.riskScore.overall}/100 · {risk.label}
                      </span>
                    </div>
                    <div className="px-5 py-4 space-y-3.5">
                      {[
                        { label: "Completeness",  value: sow.riskScore.completeness },
                        { label: "Confidence",    value: sow.riskScore.confidence },
                        { label: "Compliance",    value: sow.riskScore.compliance },
                        { label: "Pattern Match", value: sow.riskScore.patternMatch },
                      ].map(({ label, value }) => {
                        const c = riskMeta(value);
                        return (
                          <div key={label} className="flex items-center gap-4">
                            <span className="text-[11px] text-gray-500 w-28 shrink-0">{label}</span>
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${value}%`, background: c.bar }} />
                            </div>
                            <span className="font-mono text-[11px] font-semibold w-7 text-right" style={{ color: c.bar }}>
                              {value}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Hallucination Flags */}
                {(sow.hallucinationFlags ?? []).length > 0 ? (
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">AI Hallucination Flags</p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">
                        {sow.hallucinationFlags!.length} flag{sow.hallucinationFlags!.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {sow.hallucinationFlags!.map(flag => (
                        <div key={flag.id} className="px-5 py-3.5 flex items-start gap-3">
                          <div className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0",
                            flag.severity === "high" ? "bg-red-500" : flag.severity === "medium" ? "bg-amber-400" : "bg-teal-400",
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-medium text-gray-700 mb-0.5 italic">&ldquo;{flag.clause}&rdquo;</p>
                            <p className="text-[11px] text-gray-400 mb-1 leading-snug">{flag.reason}</p>
                            {flag.suggestion && <p className="text-[11px] text-teal-600">Suggestion: {flag.suggestion}</p>}
                          </div>
                          <span className={cn("shrink-0 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border",
                            flag.severity === "high" ? "bg-red-50 text-red-700 border-red-100" :
                            flag.severity === "medium" ? "bg-amber-50 text-amber-700 border-amber-100" :
                            "bg-teal-50 text-teal-700 border-teal-100",
                          )}>
                            {flag.severity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-forest-50 border border-forest-100 px-5 py-4 flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                    <div>
                      <p className="text-[12px] font-semibold text-forest-700">No hallucination flags detected</p>
                      <p className="text-[11px] text-forest-600 mt-0.5">AI extraction passed all clause integrity checks.</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── DETAILS TAB ── */}
            {tab === "details" && (() => {
              const wd = wizardRec?.data;

              /* ── Step definitions per intake mode ── */
              const AI_PAGES = [
                { id: "context",    label: "Context",      step: "Step 0", icon: Sparkles },
                { id: "scope",      label: "Scope",        step: "Step 1", icon: FileText },
                { id: "delivery",   label: "Delivery",     step: "Step 2", icon: Layers },
                { id: "integrations", label: "Integrations", step: "Step 3", icon: GitBranch },
                { id: "timeline",   label: "Timeline",     step: "Step 4", icon: Calendar },
                { id: "budget",     label: "Budget",       step: "Step 5", icon: DollarSign },
                { id: "quality",    label: "Quality",      step: "Step 6", icon: Gauge },
                { id: "governance", label: "Governance",   step: "Step 7", icon: Shield },
                { id: "commercial", label: "Commercial",   step: "Step 8", icon: Scale },
                { id: "approvers",  label: "Approvers",    step: "Step 9", icon: Users },
                { id: "generated",  label: "Generated SOW", step: "Output", icon: BookOpen },
              ] as const;

              const MANUAL_PAGES = [
                { id: "upload",     label: "Upload",       step: "Upload", icon: HardDrive },
                { id: "context",    label: "Context",      step: "§1",     icon: Sparkles },
                { id: "scope",      label: "Scope",        step: "§2",     icon: FileText },
                { id: "delivery",   label: "Delivery",     step: "§3",     icon: Layers },
                { id: "timeline",   label: "Timeline",     step: "§4",     icon: Calendar },
                { id: "budget",     label: "Budget",       step: "§5",     icon: DollarSign },
                { id: "governance", label: "Governance",   step: "§6",     icon: Shield },
                { id: "commercial", label: "Commercial",   step: "§7",     icon: Scale },
                { id: "generated",  label: "Generated SOW", step: "Output", icon: BookOpen },
              ] as const;

              const DETAIL_PAGES = sow.intakeMode === "ai_generated" ? AI_PAGES : MANUAL_PAGES;
              const totalPages   = DETAIL_PAGES.length;

              /* ── Reusable chip/list helpers (scoped) ── */
              const Chips = ({ items, color = "gray" }: { items: string[]; color?: "gray" | "teal" | "blue" }) => (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {items.map((v, i) => (
                    <span key={i} className={cn(
                      "text-[11px] font-medium px-2 py-0.5 rounded-md border",
                      color === "teal" ? "text-teal-700 bg-teal-50 border-teal-100"
                      : color === "blue" ? "text-blue-700 bg-blue-50 border-blue-100"
                      : "text-gray-700 bg-gray-50 border-gray-200",
                    )}>
                      {v}
                    </span>
                  ))}
                </div>
              );

              const BulletList = ({ items }: { items: string[] }) => (
                <ul className="space-y-1.5 pt-0.5">
                  {items.map((v, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700 leading-snug">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 shrink-0" />
                      {v}
                    </li>
                  ))}
                </ul>
              );

              const ConfBar = ({ val }: { val: number }) => {
                const color = val >= 85 ? "bg-forest-500" : val >= 70 ? "bg-gold-500" : "bg-red-400";
                const textColor = val >= 85 ? "text-forest-700" : val >= 70 ? "text-gold-700" : "text-red-600";
                return (
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className={cn("h-full rounded-full", color)} style={{ width: `${val}%` }} />
                    </div>
                    <span className={cn("font-mono font-semibold text-[12px] shrink-0", textColor)}>{val}%</span>
                  </div>
                );
              };

              /* ── AI index mapping → MANUAL index mapping ──
                 AI:     0=context 1=scope 2=delivery 3=integrations 4=timeline 5=budget 6=quality 7=governance 8=commercial 9=approvers 10=generated
                 MANUAL: 0=upload  1=context 2=scope  3=delivery      4=timeline 5=budget 6=governance 7=commercial 8=generated            */
              const isAI = sow.intakeMode === "ai_generated";

              return (
                <div className="space-y-3">

                  {/* ── Step navigator + page content ── */}
                  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">

                    {/* Card header: intake mode badge */}
                    <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">SOW Details</p>
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border",
                        isAI ? "bg-teal-50 text-teal-700 border-teal-100" : "bg-blue-50 text-blue-700 border-blue-100",
                      )}>
                        {isAI ? <Cpu className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
                        {isAI ? "AI Generated" : "Manual Upload"}
                      </span>
                    </div>

                    {/* Scrollable step tabs */}
                    <div className="overflow-x-auto border-b border-gray-100">
                      <div className="flex w-full">
                        {DETAIL_PAGES.map((p, i) => {
                          const PIcon = p.icon;
                          const isActive = i === detailsPage;
                          const isDone   = i < detailsPage;
                          return (
                            <button
                              key={p.id}
                              onClick={() => setDetailsPage(i)}
                              className={cn(
                                "flex flex-col items-center gap-0.5 py-3 px-2 transition-all border-b-2 flex-1 min-w-[60px]",
                                isActive ? "border-brown-600 bg-brown-50/30" :
                                isDone   ? "border-forest-300 hover:bg-gray-50" :
                                           "border-transparent hover:bg-gray-50",
                              )}
                            >
                              <div className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center border transition-all",
                                isActive ? "bg-brown-600 border-brown-600" :
                                isDone   ? "bg-forest-500 border-forest-500" :
                                           "bg-gray-100 border-gray-200",
                              )}>
                                {isDone
                                  ? <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                  : <PIcon className={cn("w-2.5 h-2.5", isActive ? "text-white" : "text-gray-400")} />}
                              </div>
                              <span className={cn("text-[9px] font-medium leading-none",
                                isActive ? "text-brown-700" : isDone ? "text-forest-600" : "text-gray-400",
                              )}>
                                {p.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ─── Page content ─── */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={detailsPage}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.16 }}
                        className="px-5 py-4"
                      >

                        {/* ════════════════════════════════════════════
                            MANUAL UPLOAD — Page 0: Upload Details
                            ════════════════════════════════════════════ */}
                        {!isAI && detailsPage === 0 && (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                            <ReadOnlyField label="SOW Title" value={sow.title} wide />
                            <ReadOnlyField label="Client / Organization" value={sow.client} />
                            <ReadOnlyField label="Industry" value={sow.industry ?? "—"} />
                            <ReadOnlyField label="Submitted By" value={sow.createdBy} />
                            <ReadOnlyField label="Created" value={formatDate(sow.createdAt)} />
                            <ReadOnlyField label="Last Updated" value={formatDate(sow.updatedAt)} />
                            <ReadOnlyField label="File Size" value={sow.fileSize} mono />
                            <ReadOnlyField label="Total Pages" value={String(sow.pages)} mono />
                            <ReadOnlyField label="Sections Parsed" value={`${sow.parsedSections} / ${sow.totalSections}`} mono />
                            <ReadOnlyField label="Version" value={`v${sow.version}`} mono />
                            <ReadOnlyField label="AI Confidence" value={`${sow.aiConfidence}%`} mono />
                            {sow.gapAnalysisScore !== undefined && (
                              <ReadOnlyField label="Gap Analysis Score" value={`${sow.gapAnalysisScore}%`} mono />
                            )}
                            <ReadOnlyField
                              label="Confidentiality"
                              value={
                                <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border", sensitivityStyle[sow.confidentiality] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
                                  <Lock className="w-2.5 h-2.5" />{sow.confidentiality.charAt(0).toUpperCase() + sow.confidentiality.slice(1)}
                                </span>
                              }
                            />
                            <ReadOnlyField
                              label="Data Sensitivity"
                              value={
                                <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border", sensitivityStyle[sow.dataSensitivity] ?? "bg-gray-100 text-gray-600 border-gray-200")}>
                                  <Shield className="w-2.5 h-2.5" />{sow.dataSensitivity.charAt(0).toUpperCase() + sow.dataSensitivity.slice(1)}
                                </span>
                              }
                            />
                            <ReadOnlyField label="Hallucination Flags" value={
                              (sow.hallucinationFlags ?? []).length === 0
                                ? <span className="flex items-center gap-1 text-forest-600"><CheckCircle2 className="w-3 h-3" /> None detected</span>
                                : <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="w-3 h-3" /> {sow.hallucinationFlags!.length} flags</span>
                            } />
                          </div>
                        )}

                        {/* ════════════════════════════════════════════
                            SHARED — Context & Discovery
                            AI: page 0 | MANUAL: page 1
                            ════════════════════════════════════════════ */}
                        {wd && ((isAI && detailsPage === 0) || (!isAI && detailsPage === 1)) && (
                          <div className="space-y-4">
                            <ReadOnlyField label="Project Vision" value={wd.projectVision} wide />
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <ReadOnlyField label="Strategic Context" value={wd.strategicContext.replace(/_/g, " ")} />
                              <ReadOnlyField label="Business Criticality" value={wd.businessCriticality.replace(/_/g, " ")} />
                              <ReadOnlyField label="Current State Type" value={wd.currentStateType.replace(/_/g, " ")} />
                            </div>
                            <ReadOnlyField label="Current State" value={wd.currentState} wide />
                            <ReadOnlyField label="Desired Future State" value={wd.desiredFutureState} wide />
                            {wd.previousAttempts && <ReadOnlyField label="Previous Attempts" value={wd.previousAttempts} wide />}
                            <ReadOnlyField label="Definition of Success" value={wd.definitionOfSuccess} wide />
                            <ReadOnlyField label="Business Objectives" wide value={<BulletList items={wd.businessObjectives} />} />
                            <ReadOnlyField label="Pain Points" wide value={<BulletList items={wd.painPoints} />} />
                            <ReadOnlyField label="End User Profiles" wide value={<BulletList items={wd.endUserProfiles} />} />
                            <ReadOnlyField label="Success Metrics" wide value={<BulletList items={wd.successMetrics} />} />
                            <ReadOnlyField label="User Expectations" wide value={<BulletList items={wd.userExpectations} />} />
                            <ReadOnlyField label="Language Requirements" wide value={<Chips items={wd.languageRequirements} color="teal" />} />
                            {wd.enterpriseExpectations && <ReadOnlyField label="Enterprise Expectations" value={wd.enterpriseExpectations} wide />}
                          </div>
                        )}

                        {/* ════════════════════════════════════════════
                            SHARED — Project & Scope
                            AI: page 1 | MANUAL: page 2
                            ════════════════════════════════════════════ */}
                        {wd && ((isAI && detailsPage === 1) || (!isAI && detailsPage === 2)) && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <ReadOnlyField label="Project Category" value={wd.projectCategory.replace(/_/g, " ")} />
                              <ReadOnlyField label="Platform Type" value={wd.platformType.replace(/_/g, " ")} />
                              <ReadOnlyField label="Estimated Screens" value={wd.estimatedScreenCount} mono />
                              <ReadOnlyField label="Data Migration Scope" value={wd.dataMigrationScope.replace(/_/g, " ")} />
                            </div>
                            <ReadOnlyField label="Existing Tech Landscape" value={wd.existingTechLandscape} wide />
                            {wd.dataMigrationDetails && <ReadOnlyField label="Data Migration Details" value={wd.dataMigrationDetails} wide />}
                            <ReadOnlyField label="Feature Modules" wide value={<BulletList items={wd.featureModules} />} />
                            <ReadOnlyField label="User Roles" wide value={<Chips items={wd.userRoles} color="gray" />} />
                            <ReadOnlyField label="Business Workflows" wide value={<BulletList items={wd.businessWorkflows} />} />
                            <ReadOnlyField label="Critical Business Rules" wide value={<BulletList items={wd.criticalBusinessRules} />} />
                            <ReadOnlyField label="Out of Scope" wide value={<BulletList items={wd.outOfScope} />} />
                            <ReadOnlyField label="Assumptions" wide value={<BulletList items={wd.assumptions} />} />
                            <ReadOnlyField label="Constraints" wide value={<BulletList items={wd.constraints} />} />
                          </div>
                        )}

                        {/* ════════════════════════════════════════════
                            SHARED — Delivery & Technical
                            AI: page 2 | MANUAL: page 3
                            ════════════════════════════════════════════ */}
                        {wd && ((isAI && detailsPage === 2) || (!isAI && detailsPage === 3)) && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <ReadOnlyField label="UI/UX Design Scope" value={wd.uiuxDesignScope.replace(/_/g, " ")} />
                              <ReadOnlyField label="Deployment Scope" value={wd.deploymentScope.replace(/_/g, " ")} />
                              <ReadOnlyField label="Deployment Provider" value={wd.deploymentProvider} />
                              <ReadOnlyField label="Go-Live Scope" value={wd.goLiveScope.replace(/_/g, " ")} />
                              <ReadOnlyField label="ETL Approach" value={wd.etlApproach.replace(/_/g, " ")} />
                              <ReadOnlyField label="Transformation Complexity" value={wd.transformationComplexity} />
                              <ReadOnlyField label="Data Validation Method" value={wd.dataValidationMethod.replace(/_/g, " ")} />
                            </div>
                            <ReadOnlyField label="Development Scope" wide value={<Chips items={wd.developmentScope.map(s => s.replace(/_/g, " "))} color="blue" />} />
                            <ReadOnlyField label="Tech Stack" value={wd.techStack} wide />
                            <ReadOnlyField label="Scalability Requirements" value={wd.scalabilityRequirements} wide />
                            {wd.uiuxDesignDetails && <ReadOnlyField label="UI/UX Design Details" value={wd.uiuxDesignDetails} wide />}
                            {wd.goLiveDetails && <ReadOnlyField label="Go-Live Details" value={wd.goLiveDetails} wide />}
                          </div>
                        )}

                        {/* ════════════════════════════════════════════
                            AI ONLY — Integrations & User Management
                            AI: page 3
                            ════════════════════════════════════════════ */}
                        {wd && isAI && detailsPage === 3 && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <ReadOnlyField label="SSO Required" value={wd.ssoRequired} />
                              <ReadOnlyField label="User Registration Model" value={wd.userRegistrationModel.replace(/_/g, " ")} />
                              <ReadOnlyField label="Audit Logging" value={wd.auditLogging} />
                              <ReadOnlyField label="Approval Workflows" value={wd.approvalWorkflows.replace(/_/g, " ")} />
                              <ReadOnlyField label="Notifications" value={wd.notifications.replace(/_/g, " ")} />
                              <ReadOnlyField label="Password Policy" value={wd.passwordPolicy.replace(/_/g, " ")} />
                            </div>
                            {wd.ssoDetails && <ReadOnlyField label="SSO Details" value={wd.ssoDetails} wide />}
                            <ReadOnlyField label="Password Policy Details" value={wd.passwordPolicyDetails} wide />
                            <ReadOnlyField label="Integrations" wide value={<BulletList items={wd.integrations} />} />
                            <ReadOnlyField label="Scheduled Jobs" wide value={<BulletList items={wd.scheduledJobs} />} />
                          </div>
                        )}

                        {/* ════════════════════════════════════════════
                            SHARED — Timeline, Team & Testing
                            AI: page 4 | MANUAL: page 4
                            ════════════════════════════════════════════ */}
                        {wd && ((isAI && detailsPage === 4) || (!isAI && detailsPage === 4)) && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <ReadOnlyField label="Start Date" value={wd.startDate} mono />
                              <ReadOnlyField label="End Date" value={wd.endDate} mono />
                              <ReadOnlyField label="Team Size" value={wd.teamSize} />
                              <ReadOnlyField label="Work Model" value={wd.workModel} />
                              <ReadOnlyField label="Phasing Strategy" value={wd.phasingStrategy.replace(/_/g, " ")} />
                              <ReadOnlyField label="Knowledge Transfer" value={wd.knowledgeTransfer.replace(/_/g, " ")} />
                              <ReadOnlyField label="UAT Ownership" value={wd.uatOwnership.replace(/_/g, " ")} />
                              <ReadOnlyField label="UAT Duration" value={wd.uatDuration.replace(/_/g, " ")} />
                              <ReadOnlyField label="UAT Signoff Authority" value={wd.uatSignoffAuthority} wide />
                            </div>
                            <ReadOnlyField label="Skill Priorities" value={wd.skillPriorities} wide />
                            <ReadOnlyField label="Defect SLA" value={wd.defectSLA} wide />
                            <ReadOnlyField label="Milestones" wide value={<BulletList items={wd.milestones} />} />
                            <ReadOnlyField label="Roles" wide value={<Chips items={wd.roles} color="gray" />} />
                            <ReadOnlyField label="Client Dependencies" wide value={<BulletList items={wd.clientDependencies} />} />
                            {isAI && (
                              <div className="space-y-4">
                                <ReadOnlyField label="Acceptance Criteria" value={wd.acceptanceCriteria} wide />
                                <ReadOnlyField label="SLA Uptime Commitment" value={`${wd.slaUptime}%`} mono />
                                <ReadOnlyField label="Code Review Policy" value={wd.codeReviewPolicy} wide />
                                <ReadOnlyField label="Documentation Requirements" wide value={<Chips items={wd.documentationRequirements.map(s => s.replace(/_/g, " "))} color="teal" />} />
                                <ReadOnlyField label="Browser Compatibility" wide value={<Chips items={wd.browserCompatibility} color="gray" />} />
                                <ReadOnlyField label="Device Compatibility" wide value={<Chips items={wd.deviceCompatibility} color="gray" />} />
                                <ReadOnlyField label="Accessibility Standard" value={wd.accessibilityStandard} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* ════════════════════════════════════════════
                            SHARED — Budget & Risk
                            AI: page 5 | MANUAL: page 5
                            ════════════════════════════════════════════ */}
                        {wd && detailsPage === 5 && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <ReadOnlyField label="Budget Minimum" value={`${wd.currency} ${Number(wd.budgetMin).toLocaleString()}`} mono />
                              <ReadOnlyField label="Budget Maximum" value={`${wd.currency} ${Number(wd.budgetMax).toLocaleString()}`} mono />
                              <ReadOnlyField label="Currency" value={wd.currency} mono />
                              <ReadOnlyField label="Pricing Model" value={wd.pricingModel.replace(/_/g, " ")} />
                              <ReadOnlyField label="Breakdown Preference" value={wd.breakdownPreference.replace(/_/g, " ")} />
                              <ReadOnlyField label="Contingency Budget" value={`${wd.contingencyBudget}%`} mono />
                            </div>
                            <ReadOnlyField label="Project Constraints" value={wd.projectConstraints} wide />
                            <ReadOnlyField label="Escalation Process" value={wd.escalationProcess} wide />
                            <ReadOnlyField label="Known Risks" wide value={<BulletList items={wd.knownRisks} />} />
                          </div>
                        )}

                        {/* ════════════════════════════════════════════
                            AI ONLY — Quality Standards
                            AI: page 6
                            ════════════════════════════════════════════ */}
                        {wd && isAI && detailsPage === 6 && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <ReadOnlyField label="SLA Uptime Commitment" value={`${wd.slaUptime}%`} mono />
                              <ReadOnlyField label="Accessibility Standard" value={wd.accessibilityStandard} />
                            </div>
                            <ReadOnlyField label="Acceptance Criteria" value={wd.acceptanceCriteria} wide />
                            <ReadOnlyField label="Code Review Policy" value={wd.codeReviewPolicy} wide />
                            <ReadOnlyField label="Documentation Requirements" wide value={<Chips items={wd.documentationRequirements.map(s => s.replace(/_/g, " "))} color="teal" />} />
                            <ReadOnlyField label="Browser Compatibility" wide value={<Chips items={wd.browserCompatibility} color="gray" />} />
                            <ReadOnlyField label="Device Compatibility" wide value={<Chips items={wd.deviceCompatibility} color="gray" />} />
                          </div>
                        )}

                        {/* ════════════════════════════════════════════
                            SHARED — Governance & Compliance
                            AI: page 7 | MANUAL: page 6
                            ════════════════════════════════════════════ */}
                        {wd && ((isAI && detailsPage === 7) || (!isAI && detailsPage === 6)) && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <ReadOnlyField label="Personal Data Involved" value={wd.personalDataInvolved} />
                              <ReadOnlyField label="DPA Required" value={wd.dpaRequired} />
                              <ReadOnlyField label="Data Residency" value={wd.dataResidency} />
                              <ReadOnlyField label="Access Control" value={wd.accessControl} />
                              <ReadOnlyField label="Reporting Frequency" value={wd.reportingFrequency.replace(/_/g, " ")} />
                              <ReadOnlyField label="Project Methodology" value={wd.projectMethodology} />
                            </div>
                            <ReadOnlyField label="Communication Channels" value={wd.communicationChannels} wide />
                            <ReadOnlyField label="Encryption Requirements" value={wd.encryptionRequirements} wide />
                            <ReadOnlyField label="Regulatory Frameworks" wide value={<Chips items={wd.regulatoryFrameworks} color="teal" />} />
                            <ReadOnlyField label="Privacy Laws" wide value={<Chips items={wd.privacyLaws} color="blue" />} />
                            {/* Risk scores */}
                            {sow.riskScore.overall > 0 && (
                              <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Risk Score Breakdown</p>
                                  <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md", risk.bg, risk.text)}>
                                    {sow.riskScore.overall}/100 · {risk.label}
                                  </span>
                                </div>
                                {[
                                  { label: "Completeness", value: sow.riskScore.completeness },
                                  { label: "Confidence", value: sow.riskScore.confidence },
                                  { label: "Compliance", value: sow.riskScore.compliance },
                                  { label: "Pattern Match", value: sow.riskScore.patternMatch },
                                ].map(({ label, value }) => {
                                  const c = riskMeta(value);
                                  return (
                                    <div key={label} className="flex items-center gap-4">
                                      <span className="text-[11px] text-gray-500 w-28 shrink-0">{label}</span>
                                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                        <motion.div className="h-full rounded-full" style={{ background: c.bar }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.5 }} />
                                      </div>
                                      <span className="font-mono text-[11px] font-semibold w-7 text-right" style={{ color: c.bar }}>{value}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        {/* ════════════════════════════════════════════
                            SHARED — Commercial & Legal
                            AI: page 8 | MANUAL: page 7
                            ════════════════════════════════════════════ */}
                        {wd && ((isAI && detailsPage === 8) || (!isAI && detailsPage === 7)) && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <ReadOnlyField label="IP Ownership" value={wd.ipOwnership.replace(/_/g, " ")} />
                              <ReadOnlyField label="Source Code Ownership" value={wd.sourceCodeOwnership.replace(/_/g, " ")} />
                              <ReadOnlyField label="Reference Rights" value={wd.referenceRights.replace(/_/g, " ")} />
                              <ReadOnlyField label="Open Source Policy" value={wd.openSourcePolicy.replace(/_/g, " ")} />
                              <ReadOnlyField label="Warranty Period" value={wd.warrantyPeriod.replace(/_/g, " ")} />
                              <ReadOnlyField label="Post-Warranty Support" value={wd.postWarrantySupport.replace(/_/g, " ")} />
                              <ReadOnlyField label="Change Request Process" value={wd.changeRequestProcess.replace(/_/g, " ")} />
                              <ReadOnlyField label="Change Request Approver" value={wd.changeRequestApprover} />
                            </div>
                            <ReadOnlyField label="Third-Party Costs" value={wd.thirdPartyCosts} wide />
                            {wd.environmentCosts && <ReadOnlyField label="Environment Costs" value={wd.environmentCosts} wide />}
                            {/* Also show manual-upload integrations + SSO here */}
                            {!isAI && (
                              <div className="space-y-4 pt-2 border-t border-gray-100">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pt-1">Integrations & User Management</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                  <ReadOnlyField label="SSO Required" value={wd.ssoRequired} />
                                  <ReadOnlyField label="User Registration Model" value={wd.userRegistrationModel.replace(/_/g, " ")} />
                                  <ReadOnlyField label="Audit Logging" value={wd.auditLogging} />
                                  <ReadOnlyField label="Approval Workflows" value={wd.approvalWorkflows.replace(/_/g, " ")} />
                                  <ReadOnlyField label="Notifications" value={wd.notifications.replace(/_/g, " ")} />
                                  <ReadOnlyField label="Password Policy" value={wd.passwordPolicy.replace(/_/g, " ")} />
                                </div>
                                {wd.ssoDetails && <ReadOnlyField label="SSO Details" value={wd.ssoDetails} wide />}
                                <ReadOnlyField label="Password Policy Details" value={wd.passwordPolicyDetails} wide />
                                <ReadOnlyField label="Integrations" wide value={<BulletList items={wd.integrations} />} />
                                <ReadOnlyField label="Scheduled Jobs" wide value={<BulletList items={wd.scheduledJobs} />} />
                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pt-1">Quality Standards</p>
                                  <ReadOnlyField label="Acceptance Criteria" value={wd.acceptanceCriteria} wide />
                                  <ReadOnlyField label="SLA Uptime" value={`${wd.slaUptime}%`} mono />
                                  <ReadOnlyField label="Code Review Policy" value={wd.codeReviewPolicy} wide />
                                  <ReadOnlyField label="Accessibility Standard" value={wd.accessibilityStandard} />
                                  <ReadOnlyField label="Browser Compatibility" wide value={<Chips items={wd.browserCompatibility} color="gray" />} />
                                  <ReadOnlyField label="Device Compatibility" wide value={<Chips items={wd.deviceCompatibility} color="gray" />} />
                                  <ReadOnlyField label="Documentation Requirements" wide value={<Chips items={wd.documentationRequirements.map(s => s.replace(/_/g, " "))} color="teal" />} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* ════════════════════════════════════════════
                            AI ONLY — Approvers & Review (Step 9)
                            AI: page 9
                            ════════════════════════════════════════════ */}
                        {wd && isAI && detailsPage === 9 && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                              <ReadOnlyField label="Business Owner / Approver" value={wd.businessOwnerApprover ?? "—"} />
                              <ReadOnlyField label="Final Approver" value={wd.finalApprover ?? "—"} />
                              <ReadOnlyField label="Legal Reviewer" value={wd.legalReviewer ?? "—"} />
                              <ReadOnlyField label="Security Reviewer" value={wd.securityReviewer ?? "—"} />
                            </div>
                            {/* AI generation quality */}
                            <div className="space-y-3 pt-2 border-t border-gray-100">
                              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pt-1">Generation Quality</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                <ReadOnlyField label="AI Confidence" value={<ConfBar val={sow.aiConfidence} />} />
                                {sow.gapAnalysisScore !== undefined && (
                                  <ReadOnlyField label="Gap Analysis Score" value={<ConfBar val={sow.gapAnalysisScore} />} />
                                )}
                                {sow.slaCompliance !== undefined && (
                                  <ReadOnlyField label="SLA Compliance" value={`${sow.slaCompliance}%`} mono />
                                )}
                                <ReadOnlyField label="Template Used" value={sow.templateId ?? "Default"} mono />
                                <ReadOnlyField label="Sections Generated" value={`${sow.parsedSections} / ${sow.totalSections}`} mono />
                                <ReadOnlyField label="Hallucination Flags" value={
                                  (sow.hallucinationFlags ?? []).length === 0
                                    ? <span className="flex items-center gap-1 text-forest-600"><CheckCircle2 className="w-3 h-3" /> None detected</span>
                                    : <span className="flex items-center gap-1 text-amber-600"><AlertTriangle className="w-3 h-3" /> {sow.hallucinationFlags!.length} flags</span>
                                } />
                              </div>
                              {/* Risk score */}
                              {sow.riskScore.overall > 0 && (
                                <div className="space-y-3 pt-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10.5px] text-gray-500">Risk Score Breakdown</span>
                                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md", risk.bg, risk.text)}>{sow.riskScore.overall}/100 · {risk.label}</span>
                                  </div>
                                  {[
                                    { label: "Completeness", value: sow.riskScore.completeness },
                                    { label: "Confidence", value: sow.riskScore.confidence },
                                    { label: "Compliance", value: sow.riskScore.compliance },
                                    { label: "Pattern Match", value: sow.riskScore.patternMatch },
                                  ].map(({ label, value }) => {
                                    const c = riskMeta(value);
                                    return (
                                      <div key={label} className="flex items-center gap-4">
                                        <span className="text-[11px] text-gray-500 w-28 shrink-0">{label}</span>
                                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                                          <motion.div className="h-full rounded-full" style={{ background: c.bar }} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.5 }} />
                                        </div>
                                        <span className="font-mono text-[11px] font-semibold w-7 text-right" style={{ color: c.bar }}>{value}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ════════════════════════════════════════════
                            SHARED — Generated SOW Sections
                            AI: page 10 | MANUAL: page 8
                            ════════════════════════════════════════════ */}
                        {((isAI && detailsPage === 10) || (!isAI && detailsPage === 8)) && (
                          <div className="space-y-3">
                            {(wizardRec?.generatedSections ?? []).length > 0 ? (
                              wizardRec!.generatedSections.map((sec, i) => (
                                <div key={i} className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 mb-1.5">{sec.title}</p>
                                  <p className="text-[12.5px] text-gray-700 leading-relaxed">{sec.body}</p>
                                </div>
                              ))
                            ) : sections.length > 0 ? (
                              sections.map(s => (
                                <div key={s.id} className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{s.title}</p>
                                    <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded border",
                                      s.confidence >= 90 ? "text-forest-700 bg-forest-50 border-forest-100"
                                      : s.confidence >= 75 ? "text-teal-700 bg-teal-50 border-teal-100"
                                      : "text-gold-700 bg-gold-50 border-gold-100",
                                    )}>
                                      {s.confidence}%
                                    </span>
                                  </div>
                                  <p className="text-[12.5px] text-gray-700 leading-relaxed whitespace-pre-line">{s.content}</p>
                                  {s.aiSuggestion && (
                                    <div className="flex items-start gap-1.5 mt-2 rounded-md bg-teal-50 border border-teal-100 px-2.5 py-2">
                                      <Bot className="w-3 h-3 text-teal-500 mt-0.5 shrink-0" />
                                      <p className="text-[11px] text-teal-700 leading-snug">{s.aiSuggestion}</p>
                                    </div>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <BookOpen className="w-7 h-7 text-gray-200 mb-2" />
                                <p className="text-[12px] font-medium text-gray-600">No generated sections available</p>
                              </div>
                            )}
                          </div>
                        )}

                      </motion.div>
                    </AnimatePresence>

                    {/* ── Pagination footer ── */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/60">
                      <button
                        disabled={detailsPage === 0}
                        onClick={() => setDetailsPage(p => p - 1)}
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-lg transition-all",
                          detailsPage === 0
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-gray-600 hover:bg-white hover:border hover:border-gray-200 hover:shadow-sm",
                        )}
                      >
                        <ChevronLeft className="w-3.5 h-3.5" /> Previous
                      </button>

                      {/* Dot indicators */}
                      <div className="flex items-center gap-1">
                        {DETAIL_PAGES.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setDetailsPage(i)}
                            className={cn(
                              "rounded-full transition-all",
                              i === detailsPage ? "w-4 h-2 bg-brown-600"
                              : i < detailsPage ? "w-2 h-2 bg-forest-400"
                              : "w-2 h-2 bg-gray-200 hover:bg-gray-300",
                            )}
                          />
                        ))}
                      </div>

                      <button
                        disabled={detailsPage === totalPages - 1}
                        onClick={() => setDetailsPage(p => p + 1)}
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-lg transition-all",
                          detailsPage === totalPages - 1
                            ? "text-gray-300 cursor-not-allowed"
                            : "text-brown-700 hover:bg-white hover:border hover:border-brown-200 hover:shadow-sm",
                        )}
                      >
                        Next <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* ── SECTIONS TAB ── */}
            {tab === "sections" && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Parsed Sections</p>
                  <span className="text-[11px] text-gray-400">
                    {sections.length > 0 ? `${sections.length} sections · v${sow.version}` : "No sections extracted"}
                  </span>
                </div>
                {sections.length > 0 ? (
                  sections.map(s => (
                    <SectionRow key={s.id} title={s.title} content={s.content} confidence={s.confidence} aiSuggestion={s.aiSuggestion} />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-14 text-center px-8">
                    <Layers className="w-8 h-8 text-gray-200 mb-3" />
                    <p className="text-[13px] font-medium text-gray-600 mb-1">No sections extracted</p>
                    <p className="text-[11px] text-gray-400">This SOW has not yet been processed by the AI extraction engine.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── PIPELINE TAB ── */}
            {tab === "pipeline" && (
              <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Approval Pipeline</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">5-stage review — currently at GlimmoraTeam Commercial</p>
                </div>
                {sow.approvalStages.map((stage, i) => (
                  <PipelineStage key={stage.stage} stage={stage} index={i} total={sow.approvalStages.length} />
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ══ STICKY BOTTOM ACTION BAR — only on SOW Details tab ══ */}
        {tab === "details" && <div className="shrink-0 bg-white border-t border-gray-100 shadow-[0_-1px_12px_rgba(0,0,0,0.05)]">

          {/* ── Request Changes composer — slides up above the bar ── */}
          <AnimatePresence>
            {panelMode === "reject" && (
              <motion.div
                key="composer"
                initial={{ height: 0, opacity: 0, y: 8 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: 4 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden border-b border-gray-100"
              >
                <div className="px-6 pt-4 pb-4">

                  {/* Thread: existing messages when changes were already requested */}
                  {isChangesRequested && glimmoraStage?.comments && (
                    <div className="mb-4 space-y-2.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Change Request Thread</p>

                      {/* Glimmora bubble */}
                      <div className="flex gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5 mb-1">
                            <span className="text-[11px] font-semibold text-gray-800">You</span>
                            <span className="text-[10px] text-gray-400">{glimmoraStage.reviewedAt ? formatDate(glimmoraStage.reviewedAt) : ""}</span>
                          </div>
                          <div className="rounded-xl rounded-tl-none bg-amber-50 border border-amber-100 px-3 py-2.5">
                            <p className="text-[11.5px] text-amber-900 leading-relaxed">{glimmoraStage.comments}</p>
                          </div>
                        </div>
                      </div>

                      {/* Enterprise reply */}
                      {glimmoraStage.enterpriseReply && !followUpSent ? (
                        <div className="flex gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
                            <Building2 className="w-3 h-3 text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-1.5 mb-1">
                              <span className="text-[11px] font-semibold text-gray-800">Enterprise Admin</span>
                              <span className="text-[10px] text-gray-400">{glimmoraStage.enterpriseRepliedAt ? formatDate(glimmoraStage.enterpriseRepliedAt) : ""}</span>
                            </div>
                            <div className="rounded-xl rounded-tl-none bg-teal-50 border border-teal-100 px-3 py-2.5">
                              <p className="text-[11.5px] text-teal-900 leading-relaxed">{glimmoraStage.enterpriseReply}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        !followUpSent && (
                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-200 bg-gray-50">
                            <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                            <p className="text-[11px] text-gray-400">Awaiting enterprise response…</p>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Composer */}
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 overflow-hidden">
                    <div className="flex-1 space-y-2">
                      <Textarea
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        placeholder={isFollowUp && !followUpSent
                          ? "Type a follow-up message…"
                          : "Describe what needs to be addressed before this SOW can proceed…"}
                        className="min-h-[72px] text-[12px] resize-none bg-transparent border-0 shadow-none focus:ring-0 rounded-none"
                        autoFocus
                      />

                      {/* Attached file chips */}
                      <AnimatePresence>
                        {composerFiles.length > 0 && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                            <div className="flex flex-wrap gap-1.5 px-3 pb-2">
                              {composerFiles.map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5">
                                  <div className="w-5 h-5 rounded-md bg-brown-50 flex items-center justify-center shrink-0">
                                    {f.type.startsWith("image/") ? <ImageIcon className="w-3 h-3 text-brown-500" /> : <File className="w-3 h-3 text-brown-500" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-medium text-gray-700 truncate max-w-[140px]">{f.name}</p>
                                    <p className="text-[9px] text-gray-400">{f.size < 1024 * 1024 ? `${(f.size / 1024).toFixed(1)} KB` : `${(f.size / (1024 * 1024)).toFixed(1)} MB`}</p>
                                  </div>
                                  <button onClick={() => setComposerFiles(prev => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Action row */}
                      <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-200">
                        <button
                          onClick={() => composerFileRef.current?.click()}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-brown-500 hover:bg-white transition-all"
                          title="Attach file"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex-1" />
                        <button
                          onClick={() => { setPanelMode("checklist"); setRejectionReason(""); setComposerFiles([]); }}
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-gray-500 border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={!isFollowUp && !rejectionReason.trim() && composerFiles.length === 0}
                          onClick={handleReject}
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[11.5px] font-semibold px-3 py-1.5 rounded-lg transition-all",
                            (isFollowUp || rejectionReason.trim() || composerFiles.length > 0)
                              ? "text-white bg-brown-500 hover:bg-brown-600 shadow-sm"
                              : "text-gray-300 bg-gray-100 cursor-not-allowed",
                          )}
                        >
                          <Send className="w-3 h-3" />
                          Send
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={composerFileRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files ?? []);
                      setComposerFiles(prev => [...prev, ...files.map(f => ({ name: f.name, size: f.size, type: f.type }))]);
                      e.target.value = "";
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Main bar: checklist + action buttons ── */}
          <div className="px-6 py-3 flex items-center gap-4">

            {/* Left: checklist items */}
            <div className="flex items-center gap-4 flex-1 min-w-0 overflow-x-auto">

              {/* Progress pill + bar grouped */}
              <div className="flex items-center gap-2 shrink-0">
                <motion.span
                  animate={{
                    backgroundColor: allChecked ? "var(--color-forest-50)" : "var(--color-gray-100)",
                    color: allChecked ? "var(--color-forest-700)" : "var(--color-gray-500)",
                  }}
                  transition={{ duration: 0.4 }}
                  className="text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap leading-none border border-gray-200"
                >
                  {checkedCount}/{COMMERCIAL_CHECKLIST.length}
                </motion.span>
                <div className="w-20 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    animate={{
                      width: `${(checkedCount / COMMERCIAL_CHECKLIST.length) * 100}%`,
                      backgroundColor: allChecked ? "var(--color-forest-500)" : "var(--color-brown-400)",
                    }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>

              {/* Inline checkbox items */}
              <div className="flex items-center gap-3 flex-wrap">
                {COMMERCIAL_CHECKLIST.map((item, idx) => {
                  const isChecked = !!checked[item.id];
                  return (
                    <motion.label
                      key={item.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.22, ease: "easeOut" }}
                      className="flex items-center gap-1.5 cursor-pointer group whitespace-nowrap"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={val => setChecked(prev => ({ ...prev, [item.id]: !!val }))}
                      />
                      <motion.span
                        animate={{ color: isChecked ? "var(--color-forest-700)" : "var(--color-gray-600)" }}
                        transition={{ duration: 0.25 }}
                        className="text-[11.5px] font-medium"
                      >
                        {item.label}
                      </motion.span>
                    </motion.label>
                  );
                })}
              </div>
            </div>

            {/* Right: internal notes toggle + action buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Notes inline popover trigger */}
              <div className="relative">
                <button
                  onClick={() => setPanelMode(panelMode === "notes" as never ? "checklist" : "notes" as never)}
                  className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-gray-500 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Notes
                  {notes.trim() && <span className="w-1.5 h-1.5 rounded-full bg-brown-500 shrink-0" />}
                </button>
              </div>

              <button
                disabled={panelMode === "reject"}
                onClick={() => setPanelMode(prev => prev === "reject" ? "checklist" : "reject")}
                className={cn(
                  "inline-flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-xl border transition-all",
                  panelMode === "reject"
                    ? "text-gold-700 bg-gold-50 border-gold-200"
                    : "text-gold-700 bg-gold-50 border-gold-200 hover:bg-gold-100",
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Request Changes
              </button>

              <button
                disabled={!allChecked}
                onClick={handleApprove}
                className={cn(
                  "inline-flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-xl transition-all",
                  allChecked
                    ? "text-white bg-forest-500 hover:bg-forest-600 shadow-sm"
                    : "text-gray-400 bg-gray-100 cursor-not-allowed",
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {allChecked ? "Approve Stage" : `${checkedCount}/${COMMERCIAL_CHECKLIST.length} checked`}
              </button>
            </div>
          </div>

          {/* Notes area — inline below the bar when toggled */}
          <AnimatePresence>
            {(notes.trim() || panelMode === ("notes" as never)) && (
              <motion.div
                key="notes"
                initial={{ height: 0, opacity: 0, y: -4 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -4 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden border-t border-gray-100"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="px-6 py-3"
                >
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Optional internal notes or conditions for this stage…"
                    className="min-h-[64px] text-[12px] resize-none bg-gray-50 border-gray-100"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>}
      </div>
    </div>
  );
}
