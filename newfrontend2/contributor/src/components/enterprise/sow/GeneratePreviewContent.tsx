"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2,
  Sparkles, ShieldCheck, FileText, RefreshCw, X, Zap,
  FileCheck2, PenLine, Target, Code2, Link2, Calendar,
  DollarSign, Gavel, Scale, ClipboardCheck, ClipboardList, Eye,
  MessageSquareDiff,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { AURORA_ACCENT, GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import { GLASS_MODAL_OVERLAY, ghostBtnClass, primaryBtnClass, primaryStyle } from "@/app/admin/_shell/aurora-ui";
import { FlowStepProgress, type FlowStep } from "@/components/enterprise/sow/FlowStepProgress";
import { StatusBanner } from "@/components/enterprise/sow/StatusBanner";
import { SowReviewPanel } from "@/components/enterprise/sow/SowReviewPanel";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { SOWUploadGuard } from "@/components/enterprise/sow/SOWUploadGuard";
import { useManualSowReview } from "@/lib/hooks/use-manual-sow-review";
import { useAiSowReview } from "@/lib/hooks/use-ai-sow-review";
import { useSubmitSOW, useApprovalStages, useGenerationStatus } from "@/lib/hooks/use-manual-sow";
import { useAiSowStatusPolling } from "@/lib/hooks/use-sow-wizard";

export type { SowReviewData as SOWReviewData } from "@/components/enterprise/sow/SowReviewPanel/types";

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

function ReadOnlyRow({ label, value }: { label: string; value: React.ReactNode }) {
  const isEmpty = value == null || value === "" || (Array.isArray(value) && value.length === 0);
  return (
    <div className="space-y-1">
      <p className="font-body text-[10px] font-bold uppercase tracking-widest text-text-tertiary">{label}</p>
      <div className={cn(
        "rounded-xl px-3.5 py-2.5 font-body text-[12.5px] border border-white/55 bg-white/45 backdrop-blur min-h-[38px]",
        isEmpty ? "text-text-disabled" : "text-foreground",
      )}>
        {isEmpty ? "—" : (Array.isArray(value) ? value.join(", ") : value)}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={cn(GLASS_CARD, "px-5 py-4")} style={GLASS_SHADOW}>
      <p className="font-display text-[11px] font-bold uppercase tracking-widest text-text-secondary mb-3">{title}</p>
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

export interface GeneratePreviewContentProps {
  sowId?: string | null;
  flow?: "manual" | "ai";
  onBack?: () => void;
  onRejectRegenerate?: () => void;
  onSubmitComplete?: () => void;
  detailsOverride?: any;
}

export function GeneratePreviewContent({
  sowId: sowIdProp,
  flow = "manual",
  onBack,
  onRejectRegenerate,
  onSubmitComplete,
  detailsOverride,
}: GeneratePreviewContentProps) {
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
  const [apiProgress,          setApiProgress]          = React.useState<number | null>(null);

  const sowId = flow === "ai" ? (sowIdProp ?? null) : (sowIdProp ?? store.uploadedSowId);

  const manualReview = useManualSowReview(flow === "manual" ? sowId : null, genPhase === "complete");
  const aiReview     = useAiSowReview(flow === "ai" ? sowId : null);
  const reviewData   = flow === "manual" ? manualReview : aiReview;

  const submitSOW            = useSubmitSOW(sowId ?? null, flow);
  const { refetch: refetchApprovalPipeline } = useApprovalStages(sowId ?? null);

  const isGenerating = genPhase === "generating";
  const manualStatusQuery = useGenerationStatus(
    flow === "manual" && isGenerating ? sowId : null,
    isGenerating,
  );
  const aiStatusQuery = useAiSowStatusPolling(
    flow === "ai" && isGenerating ? sowId : null,
    isGenerating,
  );
  const generationStatusQuery = flow === "ai" ? aiStatusQuery : manualStatusQuery;

  const GEN_IN_PROGRESS = new Set([
    "pending", "processing", "in_progress", "assembling", "applying",
    "compliance", "generating", "finalizing", "uploading", "extracting",
    "extraction", "analyzing", "detecting", "scoring",
  ]);

  // Synchronously derived — updates in the same render as the query data change,
  // no useEffect delay needed.
  const isQueryComplete = React.useMemo(() => {
    if (!generationStatusQuery.data) return false;
    const raw = generationStatusQuery.data as unknown as Record<string, unknown>;
    const inner = (raw?.data && typeof raw.data === "object")
      ? (raw.data as Record<string, unknown>)
      : raw;
    const status = String(inner?.status ?? "");
    return !!(inner?.completed_at) || (!!status && !GEN_IN_PROGRESS.has(status));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationStatusQuery.data]);

  // Merge stateful genReady (set by useEffect + Continue button) with the
  // synchronous query-derived signal so the UI never lags behind.
  const effectiveGenReady = genReady || isQueryComplete;

  React.useEffect(() => {
    if (!submitted) return;
    const target = sowId ? `/enterprise/sow/${sowId}?tab=approval` : "/enterprise/sow";
    if (flow === "manual") {
      store.reset();
    } else {
      try {
        sessionStorage.removeItem("sow-generator-draft");
        sessionStorage.removeItem("sow-wizard-id");
        sessionStorage.removeItem("sow-ai-review-active");
      } catch { /* ignore */ }
    }
    onSubmitComplete?.();
    const timer = setTimeout(() => { window.location.href = target; }, 600);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, sowId]);

  const didInitRef = React.useRef(false);
  React.useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!generationStatusQuery.isSuccess || !generationStatusQuery.data) return;
    const raw = generationStatusQuery.data as unknown as Record<string, unknown> & { data?: Record<string, unknown> };
    const inner = raw?.data ?? raw;
    const status = String(inner?.status ?? "");

    const progress = typeof inner?.progress_percent === "number"
      ? inner.progress_percent as number
      : typeof inner?.progress === "number"
      ? inner.progress as number
      : null;

    if (progress !== null && progress > 0) {
      setApiProgress(progress);
      const idx = Math.min(
        Math.floor((progress / 100) * GEN_STAGES.length),
        GEN_STAGES.length - 1,
      );
      setGenStageIdx(idx);
    }

    const isComplete = !!inner?.completed_at;
    const inProgressStatuses = new Set(["pending", "processing", "in_progress", "assembling", "applying", "compliance", "generating", "finalizing", "uploading", "extracting", "extraction", "analyzing", "detecting", "scoring"]);
    const isInProgress = !status || inProgressStatuses.has(status);
    const isTerminal = isComplete || (status && !isInProgress);
    if (isTerminal) {
      setApiProgress(100);
      setGenStageIdx(GEN_STAGES.length - 1);
      setGenReady(true);
      store.setGenerationState("complete");
      store.setPreviewState({ qualityMetrics: reviewData.metrics, isStaleDocument: false, hardBlocks: [] });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationStatusQuery.isSuccess, generationStatusQuery.data]);

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
    setTimeout(() => setGenReady(true), (GEN_STAGES.length + 1) * 800);
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
    <div
      className="flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur"
      style={{ background: "var(--color-success-subtle)", borderColor: "var(--color-success-border)" }}
    >
      <RefreshCw className="w-4 h-4 shrink-0" style={{ color: "var(--color-success-text)" }} />
      <div>
        <p className="font-body text-[13px] font-semibold" style={{ color: "var(--color-success-text)" }}>AI-Generated Draft Ready</p>
        <p className="font-body text-[12px] text-text-secondary">Assembled from your extractions and commercial inputs.</p>
      </div>
    </div>
  );

  return (
    <>
    <motion.div variants={stagger} initial="hidden" animate="show">

      <motion.div variants={fadeUp} className="mb-6">
        {flow === "ai"
          ? <FlowStepProgress steps={AI_SOW_STEPS} currentStep={genPhase === "complete" ? 11 : 10} />
          : <FlowStepProgress currentStep={genPhase === "complete" ? 7 : 6} />
        }
      </motion.div>

      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-display text-[28px] font-semibold text-foreground tracking-[-0.025em]">
          {genPhase === "complete" ? "Review & Submit SOW" : "Generating Final SOW"}
        </h1>
        <p className="mt-1.5 font-body text-[13px] text-text-secondary">
          {genPhase === "complete"
            ? "Review the generated document, verify quality scores, then submit for the two-step approval pipeline."
            : "Assembling your document from extracted content and commercial inputs."}
        </p>
      </motion.div>

      {genPhase === "generating" && (
        <motion.div variants={fadeUp} className="mb-6">
          <ReadOnlyDetailsPreview details={detailsOverride ?? store.commercialDetails} />
          <div className="mt-5 flex items-center justify-start gap-3">
            <button onClick={handleBack} className={ghostBtnClass}>
              <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {genPhase === "generating" && !genMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn("fixed inset-0 z-50 flex items-center justify-center px-4", GLASS_MODAL_OVERLAY)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 28 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/65 bg-white/55 backdrop-blur-xl backdrop-saturate-150"
              style={{
                boxShadow: "0 48px 96px -24px rgba(26,22,68,0.38), 0 12px 40px rgba(40,60,130,0.18), 0 0 0 1px rgba(255,255,255,0.5)",
              }}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ backgroundImage: AURORA_ACCENT }} />

              <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none rounded-full opacity-30"
                style={{ background: "radial-gradient(circle at top right, rgba(124,92,246,0.18) 0%, transparent 65%)", transform: "translate(20%, -20%)" }} />
              <div className="absolute bottom-0 left-0 w-40 h-40 pointer-events-none rounded-full opacity-20"
                style={{ background: "radial-gradient(circle at bottom left, rgba(20,184,200,0.18) 0%, transparent 65%)", transform: "translate(-20%, 20%)" }} />

              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ background: "radial-gradient(ellipse at 20% 10%, rgba(56,122,246,0.07) 0%, transparent 55%)" }}
              />

              <div className="relative px-8 pt-8 pb-7">

                <div className="flex items-center gap-4 mb-7">
                  <div className="relative shrink-0">
                    <div
                      className="w-[60px] h-[60px] rounded-2xl flex items-center justify-center transition-colors duration-500"
                      style={{
                        backgroundImage: effectiveGenReady
                          ? "linear-gradient(135deg, var(--color-success-solid), var(--c-cyan-500))"
                          : AURORA_ACCENT,
                        boxShadow: effectiveGenReady
                          ? "0 8px 24px rgba(20,160,120,0.40), inset 0 1px 0 rgba(255,255,255,0.25)"
                          : "0 8px 24px rgba(124,92,246,0.40), inset 0 1px 0 rgba(255,255,255,0.25)",
                      }}
                    >
                      {effectiveGenReady ? (
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
                    {!effectiveGenReady && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          animate={{ scale: [1, 1.22, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                          style={{ border: "2px solid rgba(124,92,246,0.45)" }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-2xl"
                          animate={{ scale: [1, 1.45, 1], opacity: [0.2, 0, 0.2] }}
                          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                          style={{ border: "1.5px solid rgba(124,92,246,0.25)" }}
                        />
                      </>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-[20px] font-extrabold text-foreground uppercase tracking-tight leading-tight">
                      {effectiveGenReady ? "Generation Complete" : "Generating Final SOW"}
                    </h2>
                    <p className="font-body text-[12.5px] text-text-tertiary mt-1 leading-relaxed">
                      {effectiveGenReady
                        ? "Your SOW draft is ready for review."
                        : "Assembling your document from extracted content and commercial inputs."}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 mb-7">
                  {GEN_STAGES.map((stage, i) => {
                    const isDone = effectiveGenReady || genStageIdx > i;
                    const isActive = !effectiveGenReady && genStageIdx === i;
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
                              className="absolute inset-0 rounded-full"
                              animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              style={{ backgroundImage: AURORA_ACCENT }}
                            />
                          )}
                          <div
                            className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                            style={{
                              backgroundImage: isActive ? AURORA_ACCENT : undefined,
                              background: isDone ? "var(--color-success-solid)" : isActive ? undefined : "var(--color-text-disabled)",
                            }}
                          />
                        </div>
                        <span className={cn(
                          "font-body text-[11px] font-bold tracking-widest uppercase truncate transition-colors duration-300",
                          isDone ? "text-text-tertiary" : isActive ? "text-foreground" : "text-text-tertiary",
                        )}>
                          {stage.label}...
                        </span>
                        {isDone && (
                          <motion.span className="ml-auto shrink-0" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 18 }}>
                            <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--color-success-solid)" }} />
                          </motion.span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mb-5" style={{ borderTop: "1px solid rgba(255,255,255,0.6)" }} />

                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-body text-[10px] font-bold tracking-widest uppercase text-text-tertiary">Overall Progress</span>
                    <span className="font-display text-[14px] font-bold tabular-nums text-foreground">
                      {apiProgress !== null
                        ? `${Math.round(apiProgress)}%`
                        : effectiveGenReady ? "100%"
                        : genStageIdx < 0 ? "0%"
                        : `${Math.round(((genStageIdx + 0.5) / GEN_STAGES.length) * 100)}%`}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden bg-foreground/[0.08]">
                    <motion.div
                      className="h-full rounded-full"
                      animate={{ width: apiProgress !== null
                        ? `${Math.round(apiProgress)}%`
                        : effectiveGenReady ? "100%"
                        : genStageIdx < 0 ? "4%"
                        : `${Math.round(((genStageIdx + 0.5) / GEN_STAGES.length) * 100)}%` }}
                      transition={{ duration: 0.65, ease: "easeOut" }}
                      style={{ backgroundImage: AURORA_ACCENT, boxShadow: "0 0 14px rgba(124,92,246,0.50)" }}
                    />
                  </div>
                </div>

                {effectiveGenReady ? (
                  <div className="mt-6">
                    <button
                      onClick={() => { store.setGenerationState("complete"); store.setPreviewState({ qualityMetrics: reviewData.metrics, isStaleDocument: false, hardBlocks: [] }); setGenPhase("complete"); }}
                      className={cn(primaryBtnClass, "w-full h-auto py-3")}
                      style={primaryStyle}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Continue — Review &amp; Submit SOW
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-center font-body text-[10px] mt-3 font-medium" style={{ color: "var(--color-success-text)" }}>
                      Generation complete — ready to review the draft.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mt-6">
                      <button
                        onClick={() => setGenMinimized(true)}
                        className={cn(ghostBtnClass, "flex-1")}
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Wait — Keep Generating
                      </button>
                      <button
                        onClick={() => {
                          if (flow === "ai") {
                            try {
                              sessionStorage.removeItem("sow-generator-draft");
                              sessionStorage.removeItem("sow-wizard-id");
                              sessionStorage.removeItem("sow-ai-review-active");
                            } catch { /* ignore */ }
                            router.push("/enterprise/sow/generate");
                          } else {
                            store.reset();
                            router.push("/enterprise/sow/upload");
                          }
                        }}
                        className="flex items-center justify-center gap-2 font-body text-[12px] font-semibold border rounded-2xl px-4 py-2.5 backdrop-blur transition-colors duration-fast"
                        style={{ color: "var(--color-error-text)", background: "var(--color-error-subtle)", borderColor: "var(--color-error-border)" }}
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </button>
                    </div>
                    <p className="text-center font-body text-[10px] text-text-tertiary mt-3">
                      Please wait for generation to complete.
                    </p>
                  </>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {genPhase === "generating" && genMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-6 left-[232px] z-40"
          >
            {effectiveGenReady ? (
              <button
                onClick={() => { store.setGenerationState("complete"); store.setPreviewState({ qualityMetrics: reviewData.metrics, isStaleDocument: false, hardBlocks: [] }); setGenPhase("complete"); setGenMinimized(false); }}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl text-white font-body text-[12px] font-semibold shadow-xl transition-transform duration-fast hover:scale-[1.02]"
                style={{ backgroundImage: "linear-gradient(135deg, var(--color-success-solid) 0%, var(--c-cyan-500) 100%)", boxShadow: "0 8px 32px rgba(20,160,120,0.35)" }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Continue to Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setGenMinimized(false)}
                className="flex items-center gap-3 px-5 py-3 rounded-2xl text-white font-body text-[12px] font-semibold shadow-xl transition-transform duration-fast hover:scale-[1.02]"
                style={{ backgroundImage: AURORA_ACCENT, boxShadow: "0 8px 32px rgba(124,92,246,0.40)" }}
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

      <AnimatePresence>
        {showProcessingModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={cn("fixed inset-0 z-60 flex items-center justify-center px-4", GLASS_MODAL_OVERLAY)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/65 bg-white/55 backdrop-blur-xl backdrop-saturate-150 shadow-[0_28px_70px_-24px_rgba(26,22,68,0.38)]"
            >
              <div className="h-1.5 w-full" style={{ backgroundImage: AURORA_ACCENT }} />
              <div className="px-8 pt-8 pb-10">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundImage: AURORA_ACCENT }}>
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-1.5 rounded-2xl border-2 border-dashed border-[rgba(124,92,246,0.45)]"
                    />
                  </div>
                </div>
                <h3 className="text-center font-display text-[18px] font-semibold text-foreground mb-1">Applying Changes</h3>
                <p className="text-center font-body text-[12px] text-text-tertiary mb-7">AI is processing your request and updating the document</p>
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
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-500"
                          style={{
                            backgroundImage: active ? AURORA_ACCENT : undefined,
                            background: done ? "var(--color-success-solid)" : active ? undefined : "rgba(15,23,42,0.06)",
                          }}
                        >
                          {done
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            : active
                            ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                                <Loader2 className="w-3.5 h-3.5 text-white" />
                              </motion.div>
                            : <Icon className="w-3.5 h-3.5 text-text-tertiary" />
                          }
                        </div>
                        <span
                          className="font-body text-[12px] font-medium transition-colors"
                          style={{ color: done ? "var(--color-success-text)" : active ? "var(--color-ai-text)" : "var(--color-text-tertiary)" }}
                        >
                          {stage.label}
                        </span>
                        {done && (
                          <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                            className="ml-auto font-body text-[10px] font-semibold" style={{ color: "var(--color-success-text)" }}>Done</motion.span>
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

      <AnimatePresence>
        {showImprovementsModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={cn("fixed inset-0 z-60 flex items-center justify-center px-4", GLASS_MODAL_OVERLAY)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              className="relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-white/65 bg-white/55 backdrop-blur-xl backdrop-saturate-150 shadow-[0_28px_70px_-24px_rgba(26,22,68,0.38)]"
            >
              <div className="relative px-5 pt-5 pb-5 overflow-hidden" style={{ backgroundImage: "linear-gradient(135deg, var(--color-success-solid) 0%, var(--c-cyan-500) 55%, var(--color-success-solid) 100%)" }}>
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
                    <h3 className="font-display text-[17px] font-bold text-white leading-tight">Document Updated</h3>
                  </div>
                </div>
              </div>

              {submittedChangeNotes && (
                <div className="px-4 pt-4 pb-3">
                  <p className="font-body text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-2">Submitted Changes</p>
                  <motion.div
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg border border-amber-100 bg-amber-50/60"
                  >
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border bg-amber-50 border-amber-200 mt-0.5">
                      <MessageSquareDiff className="w-3 h-3 text-amber-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Requested Changes</p>
                      <p className="font-body text-[11px] text-text-secondary leading-relaxed mt-0.5">{submittedChangeNotes}</p>
                    </div>
                    <CheckCircle2 className="w-3 h-3 shrink-0 mt-0.5" style={{ color: "var(--color-success-solid)" }} />
                  </motion.div>
                </div>
              )}

              <div className="px-4 pb-4">
                <button
                  onClick={() => setShowImprovementsModal(false)}
                  className={cn(primaryBtnClass, "w-full")}
                  style={primaryStyle}
                >
                  <Eye className="w-3.5 h-3.5" /> View Updated SOW
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
    {flow === "manual" && <SOWUploadGuard />}
    </>
  );
}
