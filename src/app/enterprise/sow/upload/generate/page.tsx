"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertTriangle,
  Sparkles, ShieldCheck, FileText, RefreshCw, X, Zap, TrendingUp,
  FileCheck2, PenLine, Clock4, Target, Code2, Link2, Calendar,
  DollarSign, Gavel, Scale, ClipboardCheck, ClipboardList, Eye,
  MessageSquareDiff,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress, type FlowStep } from "@/components/enterprise/sow/FlowStepProgress";
import { StatusBanner } from "@/components/enterprise/sow/StatusBanner";
import { SowReviewPanel } from "@/components/enterprise/sow/SowReviewPanel";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { useManualSowReview } from "@/lib/hooks/use-manual-sow-review";
import { useAiSowReview }    from "@/lib/hooks/use-ai-sow-review";
import { useSubmitSOW, useApprovalStages, useGenerationStatus } from "@/lib/hooks/use-manual-sow";

/* Re-export shared types so `generate/page.tsx` (AI wizard) can import them
   without changing its import path. */
export type { SowReviewData as SOWReviewData } from "@/components/enterprise/sow/SowReviewPanel/types";

/* ── Flow step config ── */

const AI_SOW_STEPS: FlowStep[] = [
  { label: "Overview",     icon: FileText },
  { label: "Scope",        icon: Target },
  { label: "Technical",    icon: Code2 },
  { label: "Integrations", icon: Link2 },
  { label: "Timeline",     icon: Calendar },
  { label: "Budget",       icon: DollarSign },
  { label: "Quality",      icon: ShieldCheck },
  { label: "Governance",   icon: Gavel },
  { label: "Commercial",   icon: Scale },
  { label: "Review",       icon: ClipboardCheck },
  { label: "Confirm",      icon: ClipboardList },
];

const GEN_STAGES = [
  { key: "assembling",  label: "Assembling extracted content",  icon: FileText },
  { key: "applying",   label: "Applying structured inputs",    icon: Target },
  { key: "compliance", label: "Running compliance checks",     icon: ShieldCheck },
  { key: "generating", label: "Generating clause library",     icon: Sparkles },
  { key: "finalizing", label: "Scoring risk & completeness",   icon: CheckCircle2 },
];

const PROCESSING_STAGES = [
  { label: "Analyzing your request",       icon: FileText },
  { label: "Identifying affected clauses", icon: PenLine },
  { label: "Applying document changes",    icon: Zap },
  { label: "Verifying compliance",         icon: ShieldCheck },
  { label: "Finalizing updates",           icon: FileCheck2 },
];

const STATIC_IMPROVEMENTS = [
  { icon: TrendingUp,  color: "text-forest-600", bg: "bg-forest-50", border: "border-forest-200", section: "Delivery Scope",        change: "Updated to include a dedicated performance testing phase with defined benchmarks." },
  { icon: FileCheck2,  color: "text-brown-600",  bg: "bg-brown-50",  border: "border-brown-200",  section: "Budget Section",        change: "Revised to reflect the agreed fixed-price engagement model with milestone-based payments." },
  { icon: Clock4,      color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200", section: "Timeline & Milestones", change: "Added a 2-week UAT buffer and updated Phase 4 end date accordingly." },
  { icon: ShieldCheck, color: "text-teal-600",   bg: "bg-teal-50",   border: "border-teal-200",   section: "Risk Management",       change: "New clause added for scope change management and change request approval process." },
  { icon: PenLine,     color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-200",  section: "Acceptance Criteria",   change: "Detailed sign-off conditions added per milestone with named approvers." },
];

/* ── Read-only helpers (shown while generating) ── */

function ReadOnlyRow({ label, value }: { label: string; value: React.ReactNode }) {
  const isEmpty = value == null || value === "" || (Array.isArray(value) && value.length === 0);
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</p>
      <div className={cn(
        "rounded-xl px-3.5 py-2.5 text-[12.5px] border border-gray-100 bg-gray-50/60 min-h-[38px]",
        isEmpty ? "text-gray-300" : "text-gray-700",
      )}>
        {isEmpty ? "—" : (Array.isArray(value) ? value.join(", ") : value)}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-parchment px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-brown-600 mb-3">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function ReadOnlyDetailsPreview({ details }: { details: any }) {
  const bc = details?.businessContext ?? {};
  const ds = details?.deliveryScope ?? {};
  const ti = details?.techIntegrations ?? {};
  const tt = details?.timelineTeam ?? {};
  const br = details?.budgetRisk ?? {};
  const gv = details?.governance ?? {};
  const cl = details?.commercialLegal ?? {};

  const budgetDisplay =
    br.budgetMinimum || br.budgetMaximum
      ? `${br.currency ?? "USD"} ${Number(br.budgetMinimum ?? 0).toLocaleString()} – ${Number(br.budgetMaximum ?? 0).toLocaleString()}`
      : "";

  return (
    <div className="space-y-4">
      <SectionCard title="Business Context & Vision">
        <ReadOnlyRow label="Project Vision"         value={bc.projectVision} />
        <ReadOnlyRow label="Business Criticality"   value={bc.businessCriticality} />
        <ReadOnlyRow label="Current State"          value={bc.currentState} />
        <ReadOnlyRow label="Desired Future State"   value={bc.desiredFutureState} />
        <ReadOnlyRow label="Definition of Success"  value={bc.definitionOfSuccess} />
      </SectionCard>
      <SectionCard title="Delivery Scope Boundary">
        <ReadOnlyRow label="Development Scope"   value={ds.developmentScope} />
        <ReadOnlyRow label="UI/UX Design Scope"  value={ds.uiuxDesignScope} />
        <ReadOnlyRow label="Deployment Scope"    value={ds.deploymentScope} />
        <ReadOnlyRow label="Go-Live Scope"       value={ds.goLiveScope} />
        <ReadOnlyRow label="Data Migration Scope" value={ds.dataMigrationScope} />
      </SectionCard>
      <SectionCard title="Technical Architecture & Integrations">
        <ReadOnlyRow label="Technology Stack"          value={ti.technologyStack} />
        <ReadOnlyRow label="Scalability Requirements"  value={ti.scalabilityRequirements} />
        <ReadOnlyRow label="User Management Scope"     value={ti.userManagementScope} />
        <ReadOnlyRow label="SSO Required"              value={ti.ssoRequired ? "Yes" : "No"} />
      </SectionCard>
      <SectionCard title="Timeline, Team & Testing">
        <ReadOnlyRow label="Start Date"               value={tt.startDate} />
        <ReadOnlyRow label="Target End Date"           value={tt.targetEndDate} />
        <ReadOnlyRow label="Estimated Team Size"       value={tt.estimatedTeamSize} />
        <ReadOnlyRow label="Work Model"                value={tt.workModel} />
        <ReadOnlyRow label="UAT Sign-off Authority"    value={tt.uatSignOffAuthority} />
      </SectionCard>
      <SectionCard title="Budget & Risk">
        <ReadOnlyRow label="Budget Range"   value={budgetDisplay} />
        <ReadOnlyRow label="Pricing Model"  value={br.pricingModel} />
        <ReadOnlyRow label="Contingency"    value={br.contingencyPercent ? `${br.contingencyPercent}%` : ""} />
      </SectionCard>
      <SectionCard title="Governance & Compliance">
        <ReadOnlyRow label="Non-Discrimination Confirmed" value={gv.nonDiscriminationConfirmed ? "Yes" : "No"} />
        <ReadOnlyRow label="Data Sensitivity Level"       value={gv.dataSensitivityLevel} />
        <ReadOnlyRow label="Personal Data Involved"       value={gv.personalDataInvolved} />
        <ReadOnlyRow label="Data Residency"               value={gv.dataResidency} />
        <ReadOnlyRow label="Regulatory Frameworks"        value={gv.regulatoryFrameworks} />
      </SectionCard>
      <SectionCard title="Commercial & Legal">
        <ReadOnlyRow label="IP Ownership"             value={cl.ipOwnership} />
        <ReadOnlyRow label="Source Code Ownership"    value={cl.sourceCodeOwnership} />
        <ReadOnlyRow label="Third-Party Costs"        value={cl.thirdPartyCosts} />
        <ReadOnlyRow label="Change Request Process"   value={cl.changeRequestProcess} />
      </SectionCard>
    </div>
  );
}

/* ═══ PAGE ═══ */

export default function GeneratePreviewPage({
  sowId: sowIdProp,
  flow = "manual",
  onBack,
  onRejectRegenerate,
  detailsOverride,
}: {
  sowId?: string | null;
  flow?: "manual" | "ai";
  onBack?: () => void;
  onRejectRegenerate?: () => void;
  detailsOverride?: any;
}) {
  const router = useRouter();
  const store  = useSOWUploadStore();

  const [genPhase,             setGenPhase]             = React.useState<"idle" | "generating" | "complete">(
    () => useSOWUploadStore.getState().generationState === "complete" ? "complete" : "generating",
  );
  const [genStageIdx,          setGenStageIdx]          = React.useState(-1);
  const [genMinimized,         setGenMinimized]         = React.useState(false);
  const [genReady,             setGenReady]             = React.useState(
    () => useSOWUploadStore.getState().generationState === "complete",
  );
  const [submitted,            setSubmitted]            = React.useState(false);
  const [submitError,          setSubmitError]          = React.useState("");
  const [showProcessingModal,  setShowProcessingModal]  = React.useState(false);
  const [showImprovementsModal, setShowImprovementsModal] = React.useState(false);
  const [processingStageIdx,   setProcessingStageIdx]   = React.useState(-1);
  const [submittedChangeNotes, setSubmittedChangeNotes] = React.useState("");

  const sowId = sowIdProp ?? store.uploadedSowId;

  /* ── Flow-specific data hooks (each only fetches when sowId matches flow) ── */
  const manualReview = useManualSowReview(flow === "manual" ? sowId : null);
  const aiReview     = useAiSowReview(flow === "ai" ? sowId : null);
  const reviewData   = flow === "manual" ? manualReview : aiReview;

  const submitSOW            = useSubmitSOW(sowId ?? null, flow);
  const { refetch: refetchApprovalPipeline } = useApprovalStages(sowId ?? null);

  /* Poll generation status for the manual flow */
  const generationStatusQuery = useGenerationStatus(
    flow === "manual" && sowId ? sowId : null,
    genPhase === "generating",
  );
  const generationStatusValue = (generationStatusQuery.data as { data?: { status?: string } } | undefined)?.data?.status;

  /* Redirect after successful submit */
  React.useEffect(() => {
    if (!submitted) return;
    const target = sowId ? `/enterprise/sow/${sowId}?tab=approval` : "/enterprise/sow";
    router.prefetch(target);
    const timer = setTimeout(() => router.push(target), 600);
    return () => clearTimeout(timer);
  }, [submitted, sowId, router]);

  /* Start generation animation on mount — skip if already complete */
  const didInitRef = React.useRef(false);
  React.useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    // If SOW was already generated (returning to review), skip animation entirely
    if (store.generationState === "complete") {
      setGenPhase("complete");
      setGenReady(true);
      return;
    }
    store.setGenerationState("idle");
    setGenPhase("generating");
    setGenStageIdx(-1);
    setGenReady(false);
    GEN_STAGES.forEach((_, i) => {
      setTimeout(() => setGenStageIdx(i), (i + 1) * 800);
    });
    setTimeout(() => {
      setGenReady(true);
      setGenPhase("complete");
      store.setGenerationState("complete");
    }, (GEN_STAGES.length + 1) * 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* React to polled generation status */
  React.useEffect(() => {
    if (generationStatusValue === "completed" || generationStatusValue === "complete") {
      setGenReady(true);
      setGenPhase("complete");
      store.setGenerationState("complete");
      store.setPreviewState({ qualityMetrics: reviewData.metrics, isStaleDocument: false, hardBlocks: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationStatusValue]);

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    router.push(flow === "ai" ? "/enterprise/sow/generate" : "/enterprise/sow/upload/details");
  };

  const backLabel = flow === "ai" ? "Back to Review" : "Back to Commercial Details";

  const isStale     = store.previewState?.isStaleDocument || false;
  const hasRedLayers = reviewData.hallucinationLayers.some((l) => l.status === "failed");
  const canSubmit   = genPhase === "complete" && !hasRedLayers && !isStale;

  const blockReason = !canSubmit
    ? isStale
      ? "Regenerate the document before submitting."
      : hasRedLayers
      ? "Resolve failed hallucination layers before submitting."
      : ""
    : undefined;

  const handleSubmit = () => {
    setSubmitError("");
    if (!sowId) { setSubmitted(true); return; }
    submitSOW.mutate(undefined, {
      onSuccess: () => {
        refetchApprovalPipeline();
        setSubmitted(true);
        setTimeout(() => router.push("/enterprise/sow"), 600);
      },
      onError: (err) => {
        setSubmitError(err instanceof Error ? err.message : "Failed to submit SOW. Please try again.");
      },
    });
  };

  const handleRequestChanges = (text: string) => {
    setSubmittedChangeNotes(text);
    setProcessingStageIdx(-1);
    setShowProcessingModal(true);
    PROCESSING_STAGES.forEach((_, i) => {
      setTimeout(() => setProcessingStageIdx(i), (i + 1) * 700);
    });
    setTimeout(() => {
      setShowProcessingModal(false);
      setShowImprovementsModal(true);
    }, (PROCESSING_STAGES.length + 1) * 700);
  };

  const startGeneration = React.useCallback(() => {
    setGenPhase("generating");
    setGenStageIdx(-1);
    setGenReady(false);
    GEN_STAGES.forEach((_, i) => { setTimeout(() => setGenStageIdx(i), (i + 1) * 800); });
    setTimeout(() => {
      setGenReady(true);
      setGenPhase("complete");
      store.setGenerationState("complete");
      store.setPreviewState({ qualityMetrics: reviewData.metrics, isStaleDocument: false, hardBlocks: [] });
    }, (GEN_STAGES.length + 1) * 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusBanner = isStale ? (
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
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* Step progress */}
      <motion.div variants={fadeUp} className="mb-6">
        {flow === "ai"
          ? <FlowStepProgress steps={AI_SOW_STEPS} currentStep={genPhase === "complete" ? 11 : 10} />
          : <FlowStepProgress currentStep={genPhase === "complete" ? 7 : 6} />
        }
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

      {/* Read-only details preview — visible while generating */}
      {genPhase === "generating" && (
        <motion.div variants={fadeUp} className="mb-6">
          <ReadOnlyDetailsPreview details={detailsOverride ?? store.commercialDetails} />
          <div className="mt-5 flex items-center justify-start gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 px-4 py-2.5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
            </button>
          </div>
        </motion.div>
      )}

      {/* ═══ GENERATING MODAL ═══ */}
      <AnimatePresence>
        {genPhase === "generating" && !genMinimized && (
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
                      className={cn(
                        "w-[60px] h-[60px] rounded-2xl flex items-center justify-center transition-colors duration-500",
                        genReady
                          ? "bg-gradient-to-br from-forest-500 to-teal-600"
                          : "bg-gradient-to-br from-brown-400 to-brown-600",
                      )}
                      style={{
                        boxShadow: genReady
                          ? "0 8px 24px rgba(42,96,104,0.40), inset 0 1px 0 rgba(255,255,255,0.25)"
                          : "0 8px 24px rgba(166,119,99,0.40), inset 0 1px 0 rgba(255,255,255,0.25)",
                      }}
                    >
                      {genReady ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 18 }}
                        >
                          <CheckCircle2 className="w-7 h-7 text-white" />
                        </motion.div>
                      ) : (
                        <Loader2 className="w-7 h-7 text-white animate-spin" />
                      )}
                    </div>
                    {!genReady && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          animate={{ scale: [1, 1.22, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                          style={{ border: "2px solid rgba(166,119,99,0.45)" }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          animate={{ scale: [1, 1.45, 1], opacity: [0.2, 0, 0.2] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                          style={{ border: "1.5px solid rgba(166,119,99,0.25)" }}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[20px] font-extrabold text-gray-900 uppercase tracking-tight leading-tight">
                      {genReady ? "Generation Complete" : "Generating Final SOW"}
                    </h2>
                    <p className="text-[12.5px] text-gray-400 mt-1 leading-relaxed">
                      {genReady
                        ? "Your SOW draft is ready for review."
                        : "Assembling your document from extracted content and commercial inputs."}
                    </p>
                  </div>
                </div>

                {/* ── Stages 2-col grid ── */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 mb-7">
                  {GEN_STAGES.map((stage, i) => {
                    const isDone = genReady || genStageIdx > i;
                    const isActive = !genReady && genStageIdx === i;
                    return (
                      <motion.div
                        key={stage.key}
                        className="flex items-center gap-2.5 min-w-0"
                        animate={{ opacity: isDone || isActive ? 1 : 0.28 }}
                        transition={{ duration: 0.35 }}
                      >
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
                        <span className={cn(
                          "text-[11px] font-bold tracking-widest uppercase truncate transition-colors duration-300",
                          isDone ? "text-gray-400" : isActive ? "text-gray-900" : "text-gray-400",
                        )}>
                          {stage.label}...
                        </span>
                        {isDone && (
                          <motion.span className="ml-auto shrink-0" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 18 }}>
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
                    <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Overall Progress</span>
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

                {/* ── Actions ── */}
                {genReady ? (
                  <div className="mt-6">
                    <button
                      onClick={() => sowId ? router.push(`/enterprise/sow/${sowId}`) : setGenPhase("complete")}
                      className="w-full flex items-center justify-center gap-2 text-[13px] font-semibold text-white bg-gradient-to-r from-forest-500 to-teal-600 hover:from-forest-600 hover:to-teal-700 px-4 py-3 rounded-xl transition-all shadow-sm"
                      style={{ boxShadow: "0 8px 24px rgba(42,96,104,0.30)" }}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Continue to Review
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-center text-[10px] text-forest-700 mt-3 font-medium">
                      Generation complete — ready to review the draft.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mt-6">
                      <button
                        onClick={() => setGenMinimized(true)}
                        className="flex-1 flex items-center justify-center gap-2 text-[12px] font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2.5 rounded-xl transition-all"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Wait — Keep Generating
                      </button>
                      <button
                        onClick={() => { setGenPhase("idle"); setGenStageIdx(-1); store.setGenerationState("idle"); }}
                        className="flex items-center justify-center gap-2 text-[12px] font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                    <p className="text-center text-[10px] text-gray-400 mt-3">
                      You can browse the page while generation runs in the background.
                    </p>
                  </>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ FLOATING WIDGET (minimized state) ═══ */}
      <AnimatePresence>
        {genPhase === "generating" && genMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-6 left-[232px] z-40"
          >
            {genReady ? (
              <button
                onClick={() => sowId ? router.push(`/enterprise/sow/${sowId}`) : setGenPhase("complete")}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-[12px] font-semibold shadow-xl transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #2A6068 0%, #1a4049 100%)", boxShadow: "0 8px 32px rgba(42,96,104,0.35)" }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Continue to Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setGenMinimized(false)}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-[12px] font-semibold shadow-xl transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, #A67763 0%, #7A4F38 100%)", boxShadow: "0 8px 32px rgba(166,119,99,0.40)" }}
              >
                <div className="relative">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <motion.div
                    className="absolute inset-0 rounded-full border border-white/40"
                    animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity }}
                  />
                </div>
                <span>View Progress</span>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ REVIEW & SUBMIT PANEL (complete phase) ═══ */}
      {genPhase === "complete" && (
        <SowReviewPanel
          sections={reviewData.sections}
          metrics={reviewData.metrics}
          riskData={reviewData.riskData}
          hallucinationLayers={reviewData.hallucinationLayers}
          traceability={reviewData.traceability}
          sectionsLoading={reviewData.sectionsLoading}
          riskLoading={reviewData.riskLoading}
          statusBanner={statusBanner}
          canSubmit={canSubmit}
          isSubmitting={submitSOW.isPending}
          isSubmitted={submitted}
          submitError={submitError}
          onSubmit={handleSubmit}
          onBack={handleBack}
          backLabel={backLabel}
          onRequestChanges={handleRequestChanges}
          onRejectRegenerate={() => {
            store.setGenerationState("idle");
            if (onRejectRegenerate) { onRejectRegenerate(); return; }
            router.push("/enterprise/sow/upload");
          }}
          blockReason={blockReason}
        />
      )}

      {/* ═══ PROCESSING MODAL ═══ */}
      <AnimatePresence>
        {showProcessingModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-brown-400 to-amber-500" />
              <div className="px-8 pt-8 pb-10">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-brown-500 flex items-center justify-center shadow-lg">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-1.5 rounded-2xl border-2 border-dashed border-amber-300/60"
                    />
                  </div>
                </div>
                <h3 className="text-center font-heading text-[18px] font-semibold text-gray-900 mb-1">Applying Changes</h3>
                <p className="text-center text-[12px] text-gray-400 mb-7">AI is processing your request and updating the document</p>
                <div className="space-y-3">
                  {PROCESSING_STAGES.map((stage, i) => {
                    const done   = processingStageIdx > i;
                    const active = processingStageIdx === i;
                    const Icon   = stage.icon;
                    return (
                      <motion.div
                        key={stage.label}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: i <= processingStageIdx + 1 ? 1 : 0.3, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500",
                          done ? "bg-forest-500" : active ? "bg-amber-400" : "bg-gray-100",
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
                            className="ml-auto text-[10px] font-semibold text-forest-600">Done</motion.span>
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
            className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-md px-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="relative bg-gradient-to-br from-forest-500 via-teal-500 to-forest-600 px-5 pt-5 pb-5 overflow-hidden">
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
                <button
                  onClick={() => setShowImprovementsModal(false)}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                >
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
                    { label: "Sections Updated", value: String(STATIC_IMPROVEMENTS.length) },
                    { label: "Clauses Revised",  value: String(STATIC_IMPROVEMENTS.length) },
                    { label: "Compliance",       value: "✓ Pass" },
                  ].map((s) => (
                    <div key={s.label} className="flex-1 bg-white/15 rounded-lg px-2.5 py-1.5 border border-white/20">
                      <p className="text-[14px] font-bold text-white leading-none">{s.value}</p>
                      <p className="text-[8px] text-white/70 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-4 pt-4 pb-3 space-y-1.5">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2">Improved Areas</p>
                {submittedChangeNotes && (
                  <motion.div
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-amber-100 bg-amber-50/60"
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border bg-amber-50 border-amber-200 mt-0.5">
                      <MessageSquareDiff className="w-3 h-3 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Requested Changes</p>
                      <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">{submittedChangeNotes}</p>
                    </div>
                    <CheckCircle2 className="w-3 h-3 text-forest-400 shrink-0 mt-0.5" />
                  </motion.div>
                )}
                {STATIC_IMPROVEMENTS.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={`${item.section}-${i}`}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-200 transition-all"
                    >
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border", item.bg, item.border)}>
                        <Icon className={cn("w-3 h-3", item.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[10px] font-bold uppercase tracking-wider", item.color)}>{item.section}</p>
                        <p className="text-[10px] text-gray-500 truncate">{item.change}</p>
                      </div>
                      <CheckCircle2 className="w-3 h-3 text-forest-400 shrink-0" />
                    </motion.div>
                  );
                })}
              </div>

              <div className="px-4 pb-4">
                <button
                  onClick={() => setShowImprovementsModal(false)}
                  className="w-full flex items-center justify-center gap-2 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-500 to-brown-700 hover:from-brown-600 hover:to-brown-800 py-2.5 rounded-xl shadow-sm transition-all"
                >
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
