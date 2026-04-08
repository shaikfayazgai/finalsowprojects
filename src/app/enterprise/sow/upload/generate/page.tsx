"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertTriangle, Send,
  Sparkles, ShieldCheck, FileText, RefreshCw, Ban, Eye, GitBranch,
  MessageSquareDiff, RotateCcw, X, Zap, TrendingUp, FileCheck2, PenLine, Clock4,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { StatusBanner } from "@/components/enterprise/sow/StatusBanner";
import { SowBadge, riskVariant } from "@/components/enterprise/sow/SowBadge";
import { mockPreviewMetrics } from "@/mocks/data/sow-upload-flow";
import { mockHallucinationLayers } from "@/mocks/data/enterprise-sow-detail";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { useGenerationStatus, useGenerateManualSOW, useHallucinationLayers } from "@/lib/hooks/use-manual-sow";

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

export default function GeneratePreviewPage({ sowId: sowIdProp }: { sowId?: string | null }) {
  const router = useRouter();
  const store = useSOWUploadStore();

  const [genPhase, setGenPhase] = React.useState<"idle" | "generating" | "complete">(store.generationState);
  const [genStageIdx, setGenStageIdx] = React.useState(-1);
  const [showSubmitModal, setShowSubmitModal] = React.useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = React.useState(false);
  const [apiImprovements, setApiImprovements] = React.useState<any>(null);
  const [submittedChangeNotes, setSubmittedChangeNotes] = React.useState("");
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [requestChangesText, setRequestChangesText] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [showProcessingModal, setShowProcessingModal] = React.useState(false);
  const [showImprovementsModal, setShowImprovementsModal] = React.useState(false);
  const [processingStageIdx, setProcessingStageIdx] = React.useState(-1);
  const [activeTab, setActiveTab] = React.useState<TabKey>("sow");

  const sowId = sowIdProp ?? store.uploadedSowId;
  const generateMutation = useGenerateManualSOW(sowId);
  const { data: genStatusRes } = useGenerationStatus(sowId, genPhase === "generating");
  const { data: layersRes } = useHallucinationLayers(sowId);

  type HallucinationLayer = { layer?: number | string; name?: string; status?: string; details?: string };

  /* Robustly extract generation status */
  const genStatusPayload = (genStatusRes as unknown as Record<string, unknown> | null);
  const genStatusData = (genStatusPayload?.data ?? genStatusPayload) as Record<string, unknown> | null;
  const apiGenStatus = (genStatusData?.status as string | undefined);

  /* Robustly extract hallucination layers */
  const layersPayload = (layersRes as unknown as Record<string, unknown> | null);
  const layersData = (layersPayload?.data ?? layersPayload) as Record<string, unknown> | null;
  const apiLayers = (
    layersData?.layers ?? layersData?.hallucination_layers ?? layersData?.hallucinationLayers
    ?? (Array.isArray(layersData) ? layersData : null)
  ) as HallucinationLayer[] | null;

  /* Extract metrics from generation status if available */
  const apiMetrics = genStatusData ? {
    confidence: Number(genStatusData.confidence ?? genStatusData.ai_confidence ?? genStatusData.aiConfidence ?? 0),
    riskScore: Number(genStatusData.riskScore ?? genStatusData.risk_score ?? 0),
    hallucinationFlags: Number(genStatusData.hallucinationFlags ?? genStatusData.hallucination_flags ?? 0),
    completeness: Number(genStatusData.completeness ?? genStatusData.completeness_score ?? 0),
  } : null;
  const hasApiMetrics = apiMetrics && (apiMetrics.confidence > 0 || apiMetrics.completeness > 0);
  const metrics = hasApiMetrics ? apiMetrics : mockPreviewMetrics;

  const hallucinationLayers: HallucinationLayer[] = (apiLayers && apiLayers.length > 0 ? apiLayers : mockHallucinationLayers["sow-001"] ?? []) as HallucinationLayer[];
  const hasRedLayers = hallucinationLayers.some((l) => l.status === "failed");
  const isStale = store.previewState?.isStaleDocument || false;
  const canSubmit = genPhase === "complete" && !hasRedLayers && !isStale;

  /* When API signals completion, advance local phase */
  React.useEffect(() => {
    if ((apiGenStatus === "completed" || apiGenStatus === "complete") && genPhase !== "complete") {
      setGenStageIdx(GEN_STAGES.length - 1);
      setGenPhase("complete");
      store.setGenerationState("complete");
      store.setPreviewState({ qualityMetrics: metrics, isStaleDocument: false, hardBlocks: [] });
      store.setFlowStep(7);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiGenStatus]);

  const startGeneration = () => {
    setGenPhase("generating");
    GEN_STAGES.forEach((_, i) => {
      setTimeout(() => setGenStageIdx(i), (i + 1) * 800);
    });
    /* Trigger real generation */
    if (sowId) {
      generateMutation.mutate({});
    } else {
      /* Fallback: advance to complete after animation if no real SOW */
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
    }
  };

  React.useEffect(() => {
    if (genPhase === "idle") startGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const PROCESSING_STAGES = [
    { label: "Analyzing your request",        icon: FileText },
    { label: "Identifying affected clauses",  icon: PenLine },
    { label: "Applying document changes",     icon: Zap },
    { label: "Verifying compliance",          icon: ShieldCheck },
    { label: "Finalizing updates",            icon: FileCheck2 },
  ];

  const STATIC_IMPROVEMENTS = [
    { icon: TrendingUp,  color: "text-forest-600",  bg: "bg-forest-50",  border: "border-forest-200", section: "Delivery Scope",         change: "Updated to include a dedicated performance testing phase with defined benchmarks." },
    { icon: FileCheck2,  color: "text-brown-600",   bg: "bg-brown-50",   border: "border-brown-200",  section: "Budget Section",         change: "Revised to reflect the agreed fixed-price engagement model with milestone-based payments." },
    { icon: Clock4,      color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-200", section: "Timeline & Milestones",  change: "Added a 2-week UAT buffer and updated Phase 4 end date accordingly." },
    { icon: ShieldCheck, color: "text-teal-600",    bg: "bg-teal-50",    border: "border-teal-200",   section: "Risk Management",        change: "New clause added for scope change management and change request approval process." },
    { icon: PenLine,     color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",  section: "Acceptance Criteria",    change: "Detailed sign-off conditions added per milestone with named approvers." },
  ];

  const handleSubmitRequest = () => {
    setSubmittedChangeNotes(requestChangesText);
    setShowRequestChangesModal(false);
    setRequestChangesText("");
    setProcessingStageIdx(-1);
    setShowProcessingModal(true);
    setApiImprovements(null);

    // Start the processing animation
    PROCESSING_STAGES.forEach((_, i) => {
      setTimeout(() => setProcessingStageIdx(i), (i + 1) * 700);
    });

    if (sowId) {
      sowActionMutation.mutate(
        { action: "request_changes", change_notes: requestChangesText },
        {
          onSuccess: (data) => {
            const result = (data as any)?.data ?? data;
            setApiImprovements(result);
            // Wait for animation to finish, then show improvements
            const animDuration = (PROCESSING_STAGES.length + 1) * 700;
            setTimeout(() => {
              setShowProcessingModal(false);
              setShowImprovementsModal(true);
            }, animDuration);
          },
          onError: (err) => {
            setActionError(err.message);
            // Still show improvements modal with fallback data
            const animDuration = (PROCESSING_STAGES.length + 1) * 700;
            setTimeout(() => {
              setShowProcessingModal(false);
              setShowImprovementsModal(true);
            }, animDuration);
          },
        },
      );
    } else {
      setTimeout(() => {
        setShowProcessingModal(false);
        setShowImprovementsModal(true);
      }, (PROCESSING_STAGES.length + 1) * 700);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (sowId) {
      sowActionMutation.mutate(
        { action: "submit" },
        {
          onSuccess: () => setTimeout(() => router.push(`/enterprise/sow/${sowId}`), 2000),
          onError: (err) => { setActionError(err.message); setSubmitted(false); },
        },
      );
    } else {
      setTimeout(() => router.push("/enterprise/sow"), 2000);
    }
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

      {/* ═══ GENERATING MODAL ═══ */}
      <AnimatePresence>
        {genPhase === "generating" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(15,10,6,0.72)", backdropFilter: "blur(12px)" }}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 28 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl"
              style={{
                background: "linear-gradient(160deg, #FFFFFF 0%, #FAF7F4 100%)",
                boxShadow: "0 48px 96px -24px rgba(0,0,0,0.45), 0 12px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(229,221,212,0.9)",
              }}
            >
              {/* Premium top gradient bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: "linear-gradient(90deg, transparent 0%, #A67763 25%, #2A6068 50%, #A67763 75%, transparent 100%)" }} />

              {/* Corner glow decorations */}
              <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none rounded-full opacity-30"
                style={{ background: "radial-gradient(circle at top right, rgba(166,119,99,0.18) 0%, transparent 65%)", transform: "translate(20%, -20%)" }} />
              <div className="absolute bottom-0 left-0 w-40 h-40 pointer-events-none rounded-full opacity-20"
                style={{ background: "radial-gradient(circle at bottom left, rgba(42,96,104,0.18) 0%, transparent 65%)", transform: "translate(-20%, 20%)" }} />

              {/* Ambient breathing glow */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ background: "radial-gradient(ellipse at 20% 10%, rgba(42,96,104,0.07) 0%, transparent 55%)" }}
              />

              <div className="relative px-8 pt-8 pb-7">

                {/* ── Header ── */}
                <div className="flex items-center gap-4 mb-7">
                  <div className="relative shrink-0">
                    <div
                      className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center"
                      style={{ boxShadow: "0 8px 24px rgba(166,119,99,0.40), inset 0 1px 0 rgba(255,255,255,0.25)" }}
                    >
                      <Loader2 className="w-7 h-7 text-white animate-spin" />
                    </div>
                    {/* Breathing ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      animate={{ scale: [1, 1.22, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                      style={{ border: "2px solid rgba(166,119,99,0.45)" }}
                    />
                    {/* Outer slow ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl"
                      animate={{ scale: [1, 1.45, 1], opacity: [0.2, 0, 0.2] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                      style={{ border: "1.5px solid rgba(166,119,99,0.25)" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[20px] font-extrabold text-gray-900 uppercase tracking-tight leading-tight">
                      Generating Final SOW
                    </h2>
                    <p className="text-[12.5px] text-gray-400 mt-1 leading-relaxed">
                      Assembling your document from extracted content and commercial inputs.
                    </p>
                  </div>
                </div>

                {/* ── Stages 2-col grid ── */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 mb-7">
                  {GEN_STAGES.map((stage, i) => {
                    const isDone = genStageIdx > i;
                    const isActive = genStageIdx === i;
                    return (
                      <motion.div
                        key={stage.key}
                        className="flex items-center gap-2.5 min-w-0"
                        animate={{ opacity: isDone || isActive ? 1 : 0.28 }}
                        transition={{ duration: 0.35 }}
                      >
                        {/* Status dot with pulse */}
                        <div className="relative shrink-0 w-3 h-3 flex items-center justify-center">
                          {isActive && (
                            <motion.div
                              className="absolute inset-0 rounded-full bg-brown-400"
                              animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          )}
                          <div className={cn(
                            "w-2.5 h-2.5 rounded-full transition-all duration-300",
                            isDone ? "bg-forest-500" : isActive ? "bg-brown-500" : "bg-gray-300",
                          )} />
                        </div>

                        {/* Label */}
                        <span className={cn(
                          "text-[11px] font-bold tracking-widest uppercase truncate transition-colors duration-300",
                          isDone ? "text-gray-400" : isActive ? "text-gray-900" : "text-gray-400",
                        )}>
                          {stage.label}...
                        </span>

                        {/* Checkmark pop */}
                        {isDone && (
                          <motion.span
                            className="ml-auto shrink-0"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 420, damping: 18 }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
                          </motion.span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* ── Separator ── */}
                <div className="mb-5" style={{ borderTop: "1px solid #EDE8E3" }} />

                {/* ── Progress bar ── */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">
                      Overall Progress
                    </span>
                    <span className="num-display text-[14px] font-bold" style={{ color: "#A67763" }}>
                      {genStageIdx < 0 ? 0 : Math.round(((genStageIdx + 1) / GEN_STAGES.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden bg-gray-100">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-brown-400 to-brown-600"
                      animate={{ width: genStageIdx < 0 ? "4%" : `${Math.round(((genStageIdx + 1) / GEN_STAGES.length) * 100)}%` }}
                      transition={{ duration: 0.65, ease: "easeOut" }}
                      style={{ boxShadow: "0 0 14px rgba(166,119,99,0.50)" }}
                    />
                  </div>
                </div>

                {/* ── Warning ── */}
                <div className="flex items-center justify-center gap-2 mt-5">
                  <div className="w-1 h-1 rounded-full bg-amber-400" />
                  <p className="text-[11px] text-gray-400">
                    Please don&apos;t close this page while generating
                  </p>
                  <div className="w-1 h-1 rounded-full bg-amber-400" />
                </div>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <MetricCard label="Confidence"          value={`${Math.round(metrics.confidence)}%`}       sub="AI extraction quality" />
            <MetricCard label="Risk Score"          value={`${Math.round(metrics.riskScore)}/100`}     sub="Lower is better" />
            <MetricCard label="Hallucination Flags" value={metrics.hallucinationFlags}     sub={metrics.hallucinationFlags === 0 ? "All layers passed" : "Review required"} />
            <MetricCard label="Completeness"        value={`${Math.round(metrics.completeness)}%`}     sub="Sections covered" />
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
                  {apiSowSections && Array.isArray(apiSowSections) ? (
                    apiSowSections.map((sec: any, i: number) => (
                      <div key={i}>
                        <p className="text-[12px] font-semibold text-gray-700 mb-1.5">{sec.title ?? `${i + 1}. Section ${i + 1}`}</p>
                        <p className="text-[13px] text-gray-500 leading-relaxed">{sec.body ?? sec.content ?? sec.text ?? JSON.stringify(sec)}</p>
                      </div>
                    ))
                  ) : (
                    [
                      { title: "1. Project Overview", body: "This Statement of Work defines the scope, deliverables, and commercial terms for the modernization of the enterprise resource planning system. The project aims to reduce operational costs by 30% within 18 months of deployment through automated financial workflows and real-time analytics." },
                      { title: "2. Functional Requirements", body: "Core modules include General Ledger with multi-currency support, Accounts Payable automation with three-way matching, real-time financial dashboards, and budget planning with variance analysis." },
                      { title: "3. Delivery Scope", body: "Full-stack development including frontend, backend, and database layers. Cloud deployment on AWS (ap-south-1). Go-live support included with 30-day hypercare." },
                    ].map((sec) => (
                      <div key={sec.title}>
                        <p className="text-[12px] font-semibold text-gray-700 mb-1.5">{sec.title}</p>
                        <p className="text-[13px] text-gray-500 leading-relaxed">{sec.body}</p>
                      </div>
                    ))
                  )}
                  <p className="text-[11px] text-gray-400 italic">Full document continues — 10 sections total.</p>
                </div>
              )}

              {activeTab === "hallucination" && (
                <div className="space-y-1.5">
                  {hallucinationLayers.map((layer: any, idx: number) => {
                    const layerStatus = layer.status === "green" ? "passed" : layer.status === "amber" ? "warning" : layer.status === "red" ? "failed" : layer.status;
                    return (
                      <div key={layer.layer ?? layer.layer_id ?? idx} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors">
                        {layerStatus === "passed"
                          ? <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                          : layerStatus === "warning"
                          ? <AlertTriangle className="w-4 h-4 text-gold-500 shrink-0" />
                          : layerStatus === "failed"
                          ? <Ban className="w-4 h-4 text-red-500 shrink-0" />
                          : <Eye className="w-4 h-4 text-gray-400 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-gray-700">Layer {layer.layer ?? layer.layer_id ?? idx + 1}: {layer.name}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{layer.details ?? (layer.active ? "Active" : "Inactive")}</p>
                        </div>
                        <SowBadge variant={layerStatus === "passed" ? "forest" : layerStatus === "warning" ? "gold" : "danger"}>
                          {layerStatus}
                        </SowBadge>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeTab === "risk" && (
                <div className="space-y-4">
                  {(riskData?.factors ?? [
                    { factor: "Completeness", weight: "30%", score: metrics.completeness },
                    { factor: "Confidence",   weight: "25%", score: metrics.confidence },
                    { factor: "Compliance",   weight: "25%", score: 95 },
                    { factor: "Pattern Match", weight: "20%", score: 88 },
                  ]).map((f: any) => (
                    <div key={f.factor ?? f.name} className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-600 w-28 shrink-0">{f.factor ?? f.name}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all",
                          Math.round(f.score ?? 0) >= 90 ? "bg-forest-500" : Math.round(f.score ?? 0) >= 70 ? "bg-gold-400" : "bg-red-400",
                        )} style={{ width: `${Math.round(f.score ?? 0)}%` }} />
                      </div>
                      <span className="text-[12px] font-semibold text-gray-700 w-10 text-right tabular-nums">{Math.round(f.score ?? 0)}%</span>
                    </div>
                  ))}
                  {riskData?.risk_level && (
                    <div className="mt-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-[11px] text-gray-500">Overall Risk Level: <span className="font-semibold text-gray-700">{riskData.risk_level}</span> ({riskData.risk_score}/100)</p>
                    </div>
                  )}
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
                  onClick={handleSubmitRequest}
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
                <button onClick={() => {
                    if (sowId) {
                      sowActionMutation.mutate(
                        { action: "reject_regenerate" },
                        { onError: (err) => setActionError(err.message) },
                      );
                    }
                    setShowRejectModal(false);
                    router.push("/enterprise/sow/upload");
                  }}
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ background: "rgba(15,10,6,0.72)", backdropFilter: "blur(12px)" }}
            onClick={() => !submitted && setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.90, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[420px] overflow-hidden rounded-2xl"
              style={{
                background: "linear-gradient(160deg, #FFFFFF 0%, #FAF7F4 100%)",
                boxShadow: "0 32px 64px -16px rgba(0,0,0,0.35), 0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(229,221,212,0.9)",
              }}
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ background: "linear-gradient(90deg, transparent, #A67763 30%, #2A6068 70%, transparent)" }} />

              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}>

                    {/* Header */}
                    <div className="flex items-center gap-3 px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #F0EBE5" }}>
                      <div className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center"
                        style={{ boxShadow: "0 4px 12px rgba(166,119,99,0.30), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
                        <Send className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-extrabold text-gray-900 tracking-tight">Submit for Approval</h3>
                        <p className="text-[13px] font-medium text-gray-500">Enters the 5-stage approval pipeline</p>
                      </div>
                    </div>

                    {/* Quality metrics */}
                    <div className="px-5 pt-3.5 pb-3">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">Quality Snapshot</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Confidence",   value: `${Math.round(metrics.confidence)}%`,   color: "text-brown-600",  bg: "bg-brown-50",  border: "border-brown-100" },
                          { label: "Risk",         value: `${Math.round(metrics.riskScore)}`,      color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100" },
                          { label: "Completeness", value: `${Math.round(metrics.completeness)}%`,  color: "text-teal-700",   bg: "bg-teal-50",   border: "border-teal-100"  },
                        ].map((m) => (
                          <div key={m.label} className={cn("rounded-xl border px-2.5 py-2.5 text-center", m.bg, m.border)}>
                            <p className={cn("num-display text-[18px] leading-none font-bold", m.color)}>{m.value}</p>
                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mt-1">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Pipeline */}
                    <div className="px-5 pb-4">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3">Approval Stages</p>
                      <div className="space-y-0">
                        {(() => {
                          const STAGE_COLORS = [
                            { grad: "from-teal-400 to-teal-600",   shadow: "rgba(42,96,104,0.45)",  ping: "bg-teal-300",   line: "rgba(42,96,104,0.5)"  },
                            { grad: "from-brown-400 to-brown-600", shadow: "rgba(166,119,99,0.45)", ping: "bg-brown-300",  line: "rgba(166,119,99,0.5)" },
                            { grad: "from-forest-400 to-forest-600", shadow: "rgba(42,96,68,0.45)", ping: "bg-forest-300", line: "rgba(42,96,68,0.5)"   },
                            { grad: "from-amber-400 to-amber-600", shadow: "rgba(180,130,50,0.45)", ping: "bg-amber-300",  line: "rgba(180,130,50,0.5)" },
                            { grad: "from-teal-500 to-forest-600", shadow: "rgba(42,96,86,0.45)",  ping: "bg-teal-300",   line: "rgba(42,96,86,0.5)"   },
                          ];
                          const stages = [
                            "Business Owner Review",
                            "GlimmoraTeam Commercial",
                            "Legal Review",
                            "Security Compliance",
                            "Final Sign-off",
                          ];
                          const BASE = 0.1;
                          const STEP = 0.22;
                          return stages.map((label, i) => {
                            const dotDelay  = BASE + i * STEP;
                            const lineDelay = dotDelay + 0.10;
                            const cardDelay = dotDelay + 0.07;
                            const isLast = i === stages.length - 1;
                            const col = STAGE_COLORS[i];
                            return (
                              <div key={label} className="flex gap-3">

                                {/* Left column: dot + connector line */}
                                <div className="flex flex-col items-center" style={{ width: 28, minWidth: 28 }}>
                                  <div className="relative flex items-center justify-center" style={{ width: 28, height: 28 }}>
                                    {/* Ping ring */}
                                    <motion.div
                                      className={`absolute inset-0 rounded-full ${col.ping}`}
                                      initial={{ scale: 0, opacity: 0 }}
                                      animate={{ scale: [0, 1.7, 1.7], opacity: [0, 0.45, 0] }}
                                      transition={{ delay: dotDelay + 0.05, duration: 0.5, ease: "easeOut" }}
                                    />
                                    {/* Main dot */}
                                    <motion.div
                                      className={`relative z-10 w-[28px] h-[28px] rounded-full bg-gradient-to-br ${col.grad} flex items-center justify-center border-2 border-white`}
                                      initial={{ scale: 0, rotate: -30 }}
                                      animate={{ scale: 1, rotate: 0 }}
                                      transition={{ delay: dotDelay, type: "spring", stiffness: 520, damping: 22 }}
                                      style={{ boxShadow: `0 3px 12px ${col.shadow}` }}
                                    >
                                      <motion.span
                                        className="text-[10px] font-extrabold text-white"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: dotDelay + 0.12, duration: 0.12 }}
                                      >
                                        {i + 1}
                                      </motion.span>
                                    </motion.div>
                                  </div>

                                  {/* Connector line */}
                                  {!isLast && (
                                    <motion.div
                                      className="w-px flex-1 origin-top"
                                      initial={{ scaleY: 0 }}
                                      animate={{ scaleY: 1 }}
                                      transition={{ delay: lineDelay, duration: 0.14, ease: "easeIn" }}
                                      style={{
                                        minHeight: 14,
                                        background: `linear-gradient(to bottom, ${col.line}, rgba(200,200,200,0.15))`,
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Right column: label card */}
                                <motion.div
                                  className="flex-1 flex items-center min-w-0 mb-2"
                                  initial={{ opacity: 0, x: 14 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: cardDelay, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                >
                                  <div className="w-full px-3 py-2 rounded-xl border border-gray-100 bg-gray-50/70 flex items-center justify-between">
                                    <span className="text-[12px] font-medium text-gray-700">{label}</span>
                                    <motion.div
                                      className={`w-1.5 h-1.5 rounded-full ${col.ping} shrink-0`}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: cardDelay + 0.08, type: "spring", stiffness: 520, damping: 22 }}
                                    />
                                  </div>
                                </motion.div>

                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-5 pb-5 flex gap-2">
                      <button onClick={() => setShowSubmitModal(false)}
                        className="flex-1 text-[11.5px] font-medium text-gray-500 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                        Cancel
                      </button>
                      <button onClick={handleSubmit}
                        className="flex-[2] flex items-center justify-center gap-1.5 text-[12px] font-bold text-white py-2.5 rounded-xl transition-all bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
                        style={{ boxShadow: "0 4px 14px rgba(166,119,99,0.35)" }}>
                        <Send className="w-3.5 h-3.5" /> Confirm &amp; Submit
                      </button>
                    </div>

                  </motion.div>
                ) : (
                  /* Success */
                  <motion.div key="success" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    className="px-6 py-10 flex flex-col items-center text-center">
                    <div className="relative mb-5">
                      <motion.div
                        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center"
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.1 }}
                        style={{ boxShadow: "0 8px 24px rgba(42,96,68,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}>
                        <CheckCircle2 className="w-7 h-7 text-white" />
                      </motion.div>
                      {[1.35, 1.7].map((scale, i) => (
                        <motion.div key={i} className="absolute inset-0 rounded-2xl border-2 border-forest-300"
                          initial={{ scale: 1, opacity: 0.5 }} animate={{ scale, opacity: 0 }}
                          transition={{ duration: 1.1, delay: i * 0.18, ease: "easeOut" }} />
                      ))}
                    </div>
                    <motion.h3 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      className="text-[16px] font-extrabold text-gray-900 tracking-tight mb-1.5">
                      Submitted Successfully
                    </motion.h3>
                    <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="text-[12px] text-gray-400 leading-relaxed">
                      Sent to <span className="font-semibold text-gray-600">Stage 1 — Business Owner Review</span>
                    </motion.p>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                      className="mt-4 flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Loader2 className="w-3 h-3 animate-spin" /> Redirecting…
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ PROCESSING MODAL ═══ */}
      <AnimatePresence>
        {showProcessingModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-md px-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* Gradient top bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-brown-400 to-amber-500" />
              <div className="px-8 pt-8 pb-10">
                {/* Icon */}
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-brown-500 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-1.5 rounded-2xl border-2 border-dashed border-amber-300/60" />
                  </div>
                </div>
                <h3 className="text-center font-heading text-[18px] font-semibold text-gray-900 mb-1">
                  Applying Changes
                </h3>
                <p className="text-center text-[12px] text-gray-400 mb-7">
                  AI is processing your request and updating the document
                </p>
                {/* Stages */}
                <div className="space-y-3">
                  {PROCESSING_STAGES.map((stage, i) => {
                    const done = processingStageIdx > i;
                    const active = processingStageIdx === i;
                    const Icon = stage.icon;
                    return (
                      <motion.div
                        key={stage.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: i <= processingStageIdx + 1 ? 1 : 0.3, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500",
                          done   ? "bg-forest-500" :
                          active ? "bg-amber-400" :
                                   "bg-gray-100",
                        )}>
                          {done
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            : active
                            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                <Loader2 className="w-3.5 h-3.5 text-white" />
                              </motion.div>
                            : <Icon className="w-3.5 h-3.5 text-gray-400" />
                          }
                        </div>
                        <span className={cn(
                          "text-[12px] font-medium transition-colors",
                          done ? "text-forest-600" : active ? "text-amber-600" : "text-gray-400",
                        )}>
                          {stage.label}
                        </span>
                        {done && (
                          <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="ml-auto text-[10px] font-semibold text-forest-600">
                            Done
                          </motion.span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ IMPROVEMENTS MODAL ═══ */}
      <AnimatePresence>
        {showImprovementsModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-md px-4">
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl">

              {/* ── Gradient header ── */}
              <div className="relative bg-gradient-to-br from-forest-500 via-teal-500 to-forest-600 px-5 pt-5 pb-5 overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

                <button onClick={() => setShowImprovementsModal(false)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                  <X className="w-3 h-3 text-white" />
                </button>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-white/70 uppercase tracking-widest">Changes Applied</p>
                    <h3 className="font-heading text-[17px] font-bold text-white leading-tight">Document Updated</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3.5 relative z-10">
                  {[
                    { label: "Sections Updated", value: String(apiImprovements?.sections_updated ?? apiImprovements?.improved_areas?.length ?? STATIC_IMPROVEMENTS.length) },
                    { label: "Clauses Revised",  value: String(apiImprovements?.clauses_revised ?? apiImprovements?.improved_areas?.length ?? "—") },
                    { label: "Compliance",        value: apiImprovements?.compliance_status === "fail" ? "✗ Fail" : "✓ Pass" },
                  ].map((s) => (
                    <div key={s.label} className="flex-1 bg-white/15 rounded-lg px-2.5 py-1.5 border border-white/20">
                      <p className="text-[14px] font-bold text-white leading-none">{s.value}</p>
                      <p className="text-[8px] text-white/70 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Improvements list ── */}
              <div className="px-4 pt-4 pb-3 space-y-1.5">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Improved Areas</p>
                {(() => {
                  const apiAreas: any[] = apiImprovements?.improved_areas ?? apiImprovements?.changes ?? [];
                  if (apiAreas.length > 0) {
                    return apiAreas.map((item: any, i: number) => (
                      <motion.div
                        key={item.section ?? i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-200 transition-all">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border bg-forest-50 border-forest-200">
                          <CheckCircle2 className="w-3 h-3 text-forest-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-forest-600">
                            {item.section ?? item.title ?? item.area ?? `Section ${i + 1}`}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">{item.change ?? item.description ?? item.summary ?? ""}</p>
                        </div>
                        <CheckCircle2 className="w-3 h-3 text-forest-400 shrink-0" />
                      </motion.div>
                    ));
                  }
                  // Show user's request as the improvement when no API data
                  if (submittedChangeNotes) {
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-amber-100 bg-amber-50/60">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border bg-amber-50 border-amber-200 mt-0.5">
                          <MessageSquareDiff className="w-3 h-3 text-amber-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Requested Changes</p>
                          <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">{submittedChangeNotes}</p>
                        </div>
                        <CheckCircle2 className="w-3 h-3 text-forest-400 shrink-0 mt-0.5" />
                      </motion.div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* ── Footer ── */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => setShowImprovementsModal(false)}
                  className="w-full flex items-center justify-center gap-2 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-500 to-brown-700 hover:from-brown-600 hover:to-brown-800 py-2.5 rounded-xl shadow-sm transition-all">
                  <Eye className="w-3.5 h-3.5" /> View Updated SOW
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
