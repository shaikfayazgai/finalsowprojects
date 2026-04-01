"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertTriangle, Send,
  Sparkles, ShieldCheck, FileText, RefreshCw, Ban, Eye, GitBranch,
  MessageSquareDiff, RotateCcw, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { StatusBanner } from "@/components/enterprise/sow/StatusBanner";
import { SowBadge, riskVariant } from "@/components/enterprise/sow/SowBadge";
import { mockPreviewMetrics } from "@/mocks/data/sow-upload-flow";
import { mockHallucinationLayers } from "@/mocks/data/enterprise-sow-detail";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";

/* ── Generation stages ── */
const GEN_STAGES = [
  { key: "assembling",  label: "Assembling extracted content",  icon: FileText },
  { key: "applying",   label: "Applying structured inputs",    icon: GitBranch },
  { key: "compliance", label: "Running compliance checks",     icon: ShieldCheck },
  { key: "generating", label: "Generating clause library",     icon: Sparkles },
  { key: "finalizing", label: "Scoring risk & completeness",   icon: CheckCircle2 },
];

const TABS = [
  { key: "sow",           label: "Generated SOW" },
  { key: "hallucination", label: "Hallucination Analysis" },
  { key: "risk",          label: "Risk Assessment" },
  { key: "traceability",  label: "Source Traceability" },
] as const;
type TabKey = typeof TABS[number]["key"];

/* ═══ PAGE ═══ */

export default function GeneratePreviewPage() {
  const router = useRouter();
  const store = useSOWUploadStore();

  const [genPhase, setGenPhase] = React.useState<"idle" | "generating" | "complete">(store.generationState);
  const [genStageIdx, setGenStageIdx] = React.useState(-1);
  const [showSubmitModal, setShowSubmitModal] = React.useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = React.useState(false);
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [requestChangesText, setRequestChangesText] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabKey>("sow");

  const metrics = mockPreviewMetrics;
  const hallucinationLayers = mockHallucinationLayers["sow-001"] || [];
  const hasRedLayers = hallucinationLayers.some((l) => l.status === "failed");
  const isStale = store.previewState?.isStaleDocument || false;
  const canSubmit = genPhase === "complete" && !hasRedLayers && !isStale;

  const startGeneration = () => {
    setGenPhase("generating");
    GEN_STAGES.forEach((_, i) => {
      setTimeout(() => setGenStageIdx(i), (i + 1) * 800);
    });
    setTimeout(() => {
      setGenPhase("complete");
      store.setGenerationState("complete");
      store.setPreviewState({
        qualityMetrics: metrics,
        isStaleDocument: false,
        hardBlocks: hasRedLayers ? ["Hallucination layer failed"] : [],
      });
      store.setFlowStep(7);
    }, (GEN_STAGES.length + 1) * 800);
  };

  React.useEffect(() => {
    if (genPhase === "idle") startGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => router.push("/enterprise/sow/sow-003"), 2000);
  };

  /* ── Metric card ── */
  function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
    return (
      <div className="card-parchment px-5 py-4">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        <p className="num-display text-[26px] leading-none text-gray-900">{value}</p>
        {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* Step progress */}
      <motion.div variants={fadeUp} className="mb-6">
        <FlowStepProgress currentStep={genPhase === "complete" ? 7 : 6} />
      </motion.div>

      {/* Page header */}
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">
          {genPhase === "complete" ? "Review & Submit SOW" : "Generating Final SOW"}
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          {genPhase === "complete"
            ? "Review the generated document, verify quality scores, then submit for the 5-stage approval pipeline."
            : "Assembling your document from extracted content and commercial inputs."}
        </p>
      </motion.div>

      {/* ═══ GENERATING ═══ */}
      {genPhase === "generating" && (
        <motion.div variants={fadeUp} className="card-parchment px-8 py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-[13px] text-gray-400 mb-8 max-w-xs mx-auto">
            This usually takes a few seconds. Please don't close this page.
          </p>
          <div className="max-w-sm mx-auto space-y-1.5">
            {GEN_STAGES.map((stage, i) => {
              const isDone = genStageIdx > i;
              const isActive = genStageIdx === i;
              const Icon = stage.icon;
              return (
                <div key={stage.key} className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                  isActive ? "bg-brown-50 border border-brown-100" : "",
                  !isActive && !isDone ? "opacity-35" : "",
                )}>
                  {isDone
                    ? <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                    : isActive
                    ? <Loader2 className="w-4 h-4 text-brown-500 animate-spin shrink-0" />
                    : <Icon className="w-4 h-4 text-gray-400 shrink-0" />}
                  <span className={cn(
                    "text-[12px] font-medium",
                    isDone ? "text-forest-700" : isActive ? "text-brown-700" : "text-gray-400",
                  )}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ═══ PREVIEW & CONFIRM ═══ */}
      {genPhase === "complete" && (
        <>
          {/* Status banner */}
          <motion.div variants={fadeUp} className="mb-5">
            {isStale ? (
              <StatusBanner
                variant="warning"
                title="Document Outdated"
                description="Commercial & Project Details were edited after generation. Regenerate before submitting."
                action={{ label: "Regenerate", onClick: () => { setGenPhase("idle"); setGenStageIdx(-1); startGeneration(); } }}
              />
            ) : (
              <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-forest-200 bg-forest-50/50">
                <RefreshCw className="w-4 h-4 text-forest-500 shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-forest-800">AI-Generated Draft Ready</p>
                  <p className="text-[12px] text-forest-600">Assembled from your extractions and commercial inputs.</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Quality metrics row */}
          <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <MetricCard label="Confidence"          value={`${metrics.confidence}%`}       sub="AI extraction quality" />
            <MetricCard label="Risk Score"          value={`${metrics.riskScore}/100`}     sub="Lower is better" />
            <MetricCard label="Hallucination Flags" value={metrics.hallucinationFlags}     sub={metrics.hallucinationFlags === 0 ? "All layers passed" : "Review required"} />
            <MetricCard label="Completeness"        value={`${metrics.completeness}%`}     sub="Sections covered" />
          </motion.div>

          {/* Tab bar + content */}
          <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-5">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100 px-2 pt-2 gap-1 overflow-x-auto">
              {TABS.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "text-[12px] font-medium px-4 py-2.5 rounded-t-xl whitespace-nowrap transition-all border-b-2 -mb-px",
                    activeTab === tab.key
                      ? "text-brown-700 border-brown-400 bg-brown-50/50"
                      : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50",
                  )}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="px-6 py-6 min-h-[280px]">

              {activeTab === "sow" && (
                <div className="space-y-5">
                  {[
                    { title: "1. Project Overview", body: "This Statement of Work defines the scope, deliverables, and commercial terms for the modernization of the enterprise resource planning system. The project aims to reduce operational costs by 30% within 18 months of deployment through automated financial workflows and real-time analytics." },
                    { title: "2. Functional Requirements", body: "Core modules include General Ledger with multi-currency support, Accounts Payable automation with three-way matching, real-time financial dashboards, and budget planning with variance analysis." },
                    { title: "3. Delivery Scope", body: "Full-stack development including frontend, backend, and database layers. Cloud deployment on AWS (ap-south-1). Go-live support included with 30-day hypercare." },
                  ].map((sec) => (
                    <div key={sec.title}>
                      <p className="text-[12px] font-semibold text-gray-700 mb-1.5">{sec.title}</p>
                      <p className="text-[13px] text-gray-500 leading-relaxed">{sec.body}</p>
                    </div>
                  ))}
                  <p className="text-[11px] text-gray-400 italic">Full document continues — 10 sections total.</p>
                </div>
              )}

              {activeTab === "hallucination" && (
                <div className="space-y-1.5">
                  {hallucinationLayers.map((layer) => (
                    <div key={layer.layer} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                      {layer.status === "passed"
                        ? <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                        : layer.status === "warning"
                        ? <AlertTriangle className="w-4 h-4 text-gold-500 shrink-0" />
                        : layer.status === "failed"
                        ? <Ban className="w-4 h-4 text-red-500 shrink-0" />
                        : <Eye className="w-4 h-4 text-gray-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-gray-700">Layer {layer.layer}: {layer.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{layer.details}</p>
                      </div>
                      <SowBadge variant={layer.status === "passed" ? "forest" : layer.status === "warning" ? "gold" : "danger"}>
                        {layer.status}
                      </SowBadge>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "risk" && (
                <div className="space-y-4">
                  {[
                    { factor: "Completeness", weight: "30%", score: metrics.completeness },
                    { factor: "Confidence",   weight: "25%", score: metrics.confidence },
                    { factor: "Compliance",   weight: "25%", score: 95 },
                    { factor: "Pattern Match",weight: "20%", score: 88 },
                  ].map((f) => (
                    <div key={f.factor} className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-600 w-28 shrink-0">{f.factor}</span>
                      <span className="text-[10px] font-medium text-gray-400 w-9 shrink-0">{f.weight}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all",
                          f.score >= 90 ? "bg-forest-500" : f.score >= 70 ? "bg-gold-400" : "bg-red-400",
                        )} style={{ width: `${f.score}%` }} />
                      </div>
                      <span className="text-[12px] font-semibold text-gray-700 w-10 text-right tabular-nums">{f.score}%</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "traceability" && (
                <div className="space-y-1">
                  {["Project Overview", "Functional Requirements", "Delivery Scope", "Technical Architecture", "Timeline", "Budget", "Governance", "Commercial & Legal"].map((sec, i) => (
                    <div key={sec} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className="text-[10px] font-mono text-gray-300 w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-[12px] font-medium text-gray-700 flex-1">{sec}</span>
                      <span className="text-[10px] text-gray-400">
                        {i < 3 ? `Extracted (p.${i * 5 + 3})` : `Commercial Details §${i - 2}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </motion.div>

          {/* Hard block note */}
          {!canSubmit && (
            <motion.div variants={fadeUp} className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
              <Ban className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-[12px] text-red-600">
                {isStale
                  ? "Regenerate the document before submitting."
                  : hasRedLayers
                  ? "Resolve failed hallucination layers before submitting."
                  : ""}
              </span>
            </motion.div>
          )}

          {/* Action bar */}
          <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
            <button onClick={() => router.push("/enterprise/sow/upload/details")}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 px-4 py-2.5 rounded-xl transition-all shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Details
            </button>

            <div className="flex items-center gap-2">
              <button onClick={() => setShowRequestChangesModal(true)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-700 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all">
                <MessageSquareDiff className="w-3.5 h-3.5" /> Request Changes
              </button>
              <button onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-red-600 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-all">
                <RotateCcw className="w-3.5 h-3.5" /> Reject & Regenerate
              </button>
              <button onClick={() => setShowSubmitModal(true)} disabled={!canSubmit}
                className={cn(
                  "flex items-center gap-2 text-[13px] font-semibold px-6 py-2.5 rounded-xl transition-all",
                  canSubmit
                    ? "text-white bg-gradient-to-r from-forest-400 to-forest-600 hover:from-forest-500 hover:to-forest-700 shadow-sm"
                    : "text-gray-400 bg-gray-100 cursor-not-allowed",
                )}>
                <Send className="w-3.5 h-3.5" /> Submit for Approval
              </button>
            </div>
          </motion.div>
        </>
      )}

      {/* ═══ REQUEST CHANGES MODAL ═══ */}
      <AnimatePresence>
        {showRequestChangesModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowRequestChangesModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-[440px] overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <MessageSquareDiff className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-gray-900">Request Changes</h3>
                </div>
                <button onClick={() => setShowRequestChangesModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-3">
                <p className="text-[12px] text-gray-500 leading-relaxed">
                  Describe the specific changes needed. This will be logged in the SOW audit trail and sent to the document generator.
                </p>
                <textarea
                  value={requestChangesText}
                  onChange={(e) => setRequestChangesText(e.target.value)}
                  placeholder="e.g. Update the delivery scope to include performance testing. Revise the budget section to reflect the agreed fixed-price model…"
                  rows={4}
                  className="w-full text-[13px] text-gray-700 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-50 resize-none transition-colors placeholder:text-gray-300"
                />
                <div className="flex items-center justify-between">
                  <span className={cn("text-[10px] font-medium", requestChangesText.length < 20 ? "text-gray-300" : "text-gray-400")}>
                    {requestChangesText.length} chars
                  </span>
                </div>
              </div>
              <div className="px-6 pb-5 flex gap-2 justify-end">
                <button onClick={() => setShowRequestChangesModal(false)}
                  className="text-[12px] font-medium text-gray-500 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button
                  disabled={requestChangesText.trim().length < 20}
                  onClick={() => { setShowRequestChangesModal(false); setRequestChangesText(""); }}
                  className={cn(
                    "flex items-center gap-1.5 text-[12px] font-semibold px-5 py-2.5 rounded-xl transition-all",
                    requestChangesText.trim().length >= 20
                      ? "text-white bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700"
                      : "text-gray-400 bg-gray-100 cursor-not-allowed",
                  )}>
                  <MessageSquareDiff className="w-3.5 h-3.5" /> Submit Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REJECT & REGENERATE MODAL ═══ */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowRejectModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-[400px] overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4 text-red-500" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-gray-900">Reject & Regenerate?</h3>
                </div>
                <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5">
                <p className="text-[12px] text-gray-500 leading-relaxed mb-4">
                  This will discard the current generated draft and restart the generation process from your existing commercial inputs. This action cannot be undone.
                </p>
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600 leading-relaxed">
                    The current draft will be permanently discarded. Go back to Details to update any inputs first.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-5 flex gap-2 justify-end">
                <button onClick={() => setShowRejectModal(false)}
                  className="text-[12px] font-medium text-gray-500 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button onClick={() => { setShowRejectModal(false); setGenPhase("idle"); setGenStageIdx(-1); startGeneration(); }}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 px-5 py-2.5 rounded-xl transition-all">
                  <RotateCcw className="w-3.5 h-3.5" /> Discard & Regenerate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ SUBMIT MODAL ═══ */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => !submitted && setShowSubmitModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-[440px] overflow-hidden">

              {!submitted ? (
                <>
                  {/* Modal header */}
                  <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                    <h3 className="text-[16px] font-semibold text-gray-900 mb-1">Submit for Approval?</h3>
                    <p className="text-[12px] text-gray-400">
                      This SOW will enter the 5-stage approval pipeline.
                    </p>
                  </div>

                  {/* Pipeline stages */}
                  <div className="px-6 py-4 space-y-1.5">
                    {["Business Owner", "GlimmoraTeam Commercial", "Legal", "Security", "Final Sign-off"].map((stage, i) => (
                      <div key={stage} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500 shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-[12px] text-gray-600">{stage}</span>
                      </div>
                    ))}
                  </div>

                  {/* Summary metrics */}
                  <div className="mx-6 mb-5 rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
                    {[
                      { l: "Confidence",   v: `${metrics.confidence}%` },
                      { l: "Risk Score",   v: `${metrics.riskScore}/100` },
                      { l: "Completeness", v: `${metrics.completeness}%` },
                    ].map((item) => (
                      <div key={item.l} className="flex items-center justify-between px-4 py-2.5 bg-gray-50/50">
                        <span className="text-[11px] text-gray-400 uppercase tracking-wider">{item.l}</span>
                        <span className="text-[12px] font-semibold text-gray-700">{item.v}</span>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="px-6 pb-5 flex gap-2 justify-end">
                    <button onClick={() => setShowSubmitModal(false)}
                      className="text-[12px] font-medium text-gray-500 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                      Cancel
                    </button>
                    <button onClick={handleSubmit}
                      className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-forest-400 to-forest-600 hover:from-forest-500 hover:to-forest-700 px-5 py-2.5 rounded-xl transition-all">
                      <Send className="w-3.5 h-3.5" /> Confirm & Submit
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center px-6 py-12">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-[16px] font-semibold text-gray-900 mb-1">Submitted Successfully</h3>
                  <p className="text-[13px] text-gray-400">Sent to Stage 1 — Business Owner Review.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
