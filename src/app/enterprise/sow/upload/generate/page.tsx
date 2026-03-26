"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertTriangle, Send,
  Sparkles, ShieldCheck, FileText, RefreshCw, Ban, Eye, GitBranch,
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
  { key: "assembling", label: "Assembling extracted content", icon: FileText },
  { key: "applying", label: "Applying structured inputs", icon: GitBranch },
  { key: "compliance", label: "Running compliance checks", icon: ShieldCheck },
  { key: "generating", label: "Generating clause library", icon: Sparkles },
  { key: "finalizing", label: "Scoring risk & completeness", icon: CheckCircle2 },
];

/* ═══ PAGE ═══ */

export default function GeneratePreviewPage() {
  const router = useRouter();
  const store = useSOWUploadStore();

  const [genPhase, setGenPhase] = React.useState<"idle" | "generating" | "complete">(store.generationState);
  const [genStageIdx, setGenStageIdx] = React.useState(-1);
  const [showSubmitModal, setShowSubmitModal] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"sow" | "hallucination" | "risk" | "traceability">("sow");

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
    setTimeout(() => {
      router.push("/enterprise/sow/sow-003");
    }, 2000);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-6">
        <FlowStepProgress currentStep={genPhase === "complete" ? 7 : 6} />
      </motion.div>

      {/* ═══ GENERATION IN PROGRESS ═══ */}
      {genPhase === "generating" && (
        <motion.div variants={fadeUp}>
          <div className="card-parchment px-8 py-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-7 h-7 text-white animate-spin" />
            </div>
            <h2 className="text-[20px] font-semibold text-gray-900 mb-2">Generating Final SOW</h2>
            <p className="text-[13px] text-gray-400 mb-8">Assembling your document from extractions and commercial inputs...</p>

            <div className="max-w-md mx-auto space-y-1">
              {GEN_STAGES.map((stage, i) => {
                const isDone = genStageIdx > i;
                const isActive = genStageIdx === i;
                const StageIcon = stage.icon;
                return (
                  <div key={stage.key} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all",
                    isActive && "bg-brown-50", !isActive && !isDone && "opacity-40"
                  )}>
                    {isDone ? <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" /> :
                     isActive ? <Loader2 className="w-4 h-4 text-brown-500 animate-spin shrink-0" /> :
                     <StageIcon className="w-4 h-4 text-gray-400 shrink-0" />}
                    <span className={cn("text-[12px] font-medium",
                      isDone ? "text-forest-700" : isActive ? "text-brown-700" : "text-gray-400"
                    )}>{stage.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ PREVIEW & CONFIRM ═══ */}
      {genPhase === "complete" && (
        <>
          {/* Banner */}
          <motion.div variants={fadeUp} className="mb-6">
            {isStale ? (
              <StatusBanner variant="warning" title="Document Outdated" description="Commercial & Project Details were edited after generation. Regenerate before submitting."
                action={{ label: "Regenerate", onClick: () => { setGenPhase("idle"); setGenStageIdx(-1); startGeneration(); } }} />
            ) : (
              <div className="rounded-2xl bg-forest-50 border border-forest-200 px-5 py-4 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-forest-500" />
                <div>
                  <p className="text-[13px] font-semibold text-forest-800">AI Generated Draft Ready</p>
                  <p className="text-[12px] text-forest-600">This document has been assembled from your extractions and commercial inputs.</p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Quality Metrics Header */}
          <motion.div variants={fadeUp} className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Confidence", value: `${metrics.confidence}%`, variant: metrics.confidence >= 90 ? "forest" : "gold" },
              { label: "Risk Score", value: `${metrics.riskScore}/100`, variant: riskVariant(metrics.riskScore) },
              { label: "Hallucination Flags", value: metrics.hallucinationFlags, variant: metrics.hallucinationFlags === 0 ? "forest" : "danger" },
              { label: "Completeness", value: `${metrics.completeness}%`, variant: metrics.completeness >= 90 ? "forest" : "gold" },
            ].map((m) => (
              <div key={m.label} className="card-parchment px-4 py-3 text-center">
                <div className="text-[10px] font-medium text-gray-400 mb-1">{m.label}</div>
                <SowBadge variant={m.variant}>
                  <span className="text-[12px]">{m.value}</span>
                </SowBadge>
              </div>
            ))}
          </motion.div>

          {/* Tabs */}
          <motion.div variants={fadeUp} className="mb-6">
            <div className="flex gap-1 mb-4">
              {[
                { key: "sow" as const, label: "Generated SOW" },
                { key: "hallucination" as const, label: "Hallucination Analysis" },
                { key: "risk" as const, label: "Risk Assessment" },
                { key: "traceability" as const, label: "Source Traceability" },
              ].map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={cn("text-[11px] font-medium px-4 py-2 rounded-lg transition-all",
                    activeTab === tab.key ? "bg-brown-50 text-brown-700 border border-brown-200" : "text-gray-500 hover:bg-gray-50"
                  )}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="card-parchment px-6 py-6 min-h-[300px]">
              {activeTab === "sow" && (
                <div className="space-y-4">
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    <strong>1. Project Overview</strong><br />
                    This Statement of Work defines the scope, deliverables, and commercial terms for the modernization of the enterprise resource planning system. The project aims to reduce operational costs by 30% within 18 months of deployment through automated financial workflows and real-time analytics.
                  </p>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    <strong>2. Functional Requirements</strong><br />
                    Core modules include General Ledger with multi-currency support, Accounts Payable automation with three-way matching, real-time financial dashboards, and budget planning with variance analysis.
                  </p>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    <strong>3. Delivery Scope</strong><br />
                    Full-stack development including frontend, backend, and database layers. Cloud deployment on AWS (ap-south-1). Go-live support included with 30-day hypercare.
                  </p>
                  <p className="text-[11px] text-gray-400 italic">Full document continues... (10 sections total)</p>
                </div>
              )}

              {activeTab === "hallucination" && (
                <div className="space-y-2">
                  {hallucinationLayers.map((layer) => (
                    <div key={layer.layer} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                      {layer.status === "passed" ? <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" /> :
                       layer.status === "warning" ? <AlertTriangle className="w-4 h-4 text-gold-500 shrink-0" /> :
                       layer.status === "failed" ? <Ban className="w-4 h-4 text-red-500 shrink-0" /> :
                       <Eye className="w-4 h-4 text-gray-400 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] font-medium text-gray-700">Layer {layer.layer}: {layer.name}</span>
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
                <div className="space-y-3">
                  {[
                    { factor: "Completeness", weight: "30%", score: metrics.completeness },
                    { factor: "Confidence", weight: "25%", score: metrics.confidence },
                    { factor: "Compliance", weight: "25%", score: 95 },
                    { factor: "Pattern Match", weight: "20%", score: 88 },
                  ].map((f) => (
                    <div key={f.factor} className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-600 w-28">{f.factor}</span>
                      <span className="text-[10px] text-gray-400 w-10">{f.weight}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className={cn("h-full rounded-full",
                          f.score >= 90 ? "bg-forest-500" : f.score >= 70 ? "bg-gold-500" : "bg-red-500"
                        )} style={{ width: `${f.score}%` }} />
                      </div>
                      <span className="text-[12px] font-mono font-semibold text-gray-700 w-10 text-right">{f.score}%</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "traceability" && (
                <div className="space-y-2">
                  {["Project Overview", "Functional Requirements", "Delivery Scope", "Technical Architecture", "Timeline", "Budget", "Governance", "Commercial & Legal"].map((sec, i) => (
                    <div key={sec} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className="text-[10px] font-mono text-gray-400 w-6">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-[12px] font-medium text-gray-700 flex-1">{sec}</span>
                      <span className="text-[10px] text-gray-400">
                        {i < 3 ? "Extracted (p." + (i * 5 + 3) + ")" : "Commercial Details §" + (i - 2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Action Bar */}
          <motion.div variants={fadeUp} className="flex items-center justify-between">
            <button onClick={() => router.push("/enterprise/sow/upload/details")}
              className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all uppercase">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Details
            </button>
            <button onClick={() => setShowSubmitModal(true)} disabled={!canSubmit}
              className={cn(
                "flex items-center gap-2 text-[13px] font-semibold px-6 py-2.5 rounded-xl transition-all uppercase",
                canSubmit
                  ? "text-white bg-gradient-to-r from-forest-400 to-forest-600 hover:from-forest-500 hover:to-forest-700"
                  : "text-gray-400 bg-gray-100 cursor-not-allowed"
              )}>
              <Send className="w-3.5 h-3.5" /> Submit for Approval
            </button>
          </motion.div>

          {/* Hard block tooltip */}
          {!canSubmit && genPhase === "complete" && (
            <motion.div variants={fadeUp} className="mt-3 text-right">
              <span className="text-[10px] text-red-500">
                {isStale ? "Regenerate the document before submitting." :
                 hasRedLayers ? "Resolve failed hallucination layers before submitting." : ""}
              </span>
            </motion.div>
          )}
        </>
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => !submitted && setShowSubmitModal(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-[460px] mx-4 rounded-2xl bg-white border border-gray-200 p-6"
            style={{ boxShadow: "0 16px 40px var(--border-hair)" }}>
            {!submitted ? (
              <>
                <h3 className="text-[16px] font-semibold text-gray-900 mb-1">Submit for Approval?</h3>
                <p className="text-[13px] text-gray-400 mb-4">This will send the SOW through the 5-stage approval pipeline:</p>
                <div className="text-[11px] text-gray-500 space-y-1 mb-5 px-3">
                  <p>1. Business Owner → 2. GlimmoraTeam Commercial → 3. Legal → 4. Security → 5. Final Sign-off</p>
                </div>
                <div className="card-parchment mb-5">
                  {[
                    { l: "Confidence", v: `${metrics.confidence}%` },
                    { l: "Risk Score", v: `${metrics.riskScore}/100` },
                    { l: "Completeness", v: `${metrics.completeness}%` },
                  ].map((item, i, arr) => (
                    <div key={item.l} className="flex items-center justify-between px-4 py-2.5"
                      style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                      <span className="text-[11px] text-gray-400 uppercase tracking-wider">{item.l}</span>
                      <span className="text-[12px] font-medium text-gray-700">{item.v}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowSubmitModal(false)}
                    className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
                  <button onClick={handleSubmit}
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-forest-400 to-forest-600 px-5 py-2 rounded-lg">
                    <Send className="w-3 h-3" /> Confirm Submission
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-[16px] font-semibold text-gray-900 mb-1">Submitted Successfully</h3>
                <p className="text-[13px] text-gray-400">Sent to Stage 1: Business Owner Review.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
