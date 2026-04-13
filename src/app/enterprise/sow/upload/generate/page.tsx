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
import {
  mockPreviewMetrics,
  mockGeneratedSowSections,
  mockRiskAssessment,
  mockSourceTraceability,
  mockGenerationHallucinationLayers,
} from "@/mocks/data/sow-upload-flow";
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

/* ═══ Read-only detail row ═══ */
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

/* ═══ Read-only card for a section ═══ */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card-parchment px-5 py-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-brown-600 mb-3">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

/* ═══ Full read-only commercial-details preview ═══ */
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
        <ReadOnlyRow label="Project Vision" value={bc.projectVision} />
        <ReadOnlyRow label="Business Criticality" value={bc.businessCriticality} />
        <ReadOnlyRow label="Current State" value={bc.currentState} />
        <ReadOnlyRow label="Desired Future State" value={bc.desiredFutureState} />
        <ReadOnlyRow label="Definition of Success" value={bc.definitionOfSuccess} />
      </SectionCard>

      <SectionCard title="Delivery Scope Boundary">
        <ReadOnlyRow label="Development Scope" value={ds.developmentScope} />
        <ReadOnlyRow label="UI/UX Design Scope" value={ds.uiuxDesignScope} />
        <ReadOnlyRow label="Deployment Scope" value={ds.deploymentScope} />
        <ReadOnlyRow label="Go-Live Scope" value={ds.goLiveScope} />
        <ReadOnlyRow label="Data Migration Scope" value={ds.dataMigrationScope} />
      </SectionCard>

      <SectionCard title="Technical Architecture & Integrations">
        <ReadOnlyRow label="Technology Stack" value={ti.technologyStack} />
        <ReadOnlyRow label="Scalability Requirements" value={ti.scalabilityRequirements} />
        <ReadOnlyRow label="User Management Scope" value={ti.userManagementScope} />
        <ReadOnlyRow label="SSO Required" value={ti.ssoRequired ? "Yes" : "No"} />
      </SectionCard>

      <SectionCard title="Timeline, Team & Testing">
        <ReadOnlyRow label="Start Date" value={tt.startDate} />
        <ReadOnlyRow label="Target End Date" value={tt.targetEndDate} />
        <ReadOnlyRow label="Estimated Team Size" value={tt.estimatedTeamSize} />
        <ReadOnlyRow label="Work Model" value={tt.workModel} />
        <ReadOnlyRow label="UAT Sign-off Authority" value={tt.uatSignOffAuthority} />
      </SectionCard>

      <SectionCard title="Budget & Risk">
        <ReadOnlyRow label="Budget Range" value={budgetDisplay} />
        <ReadOnlyRow label="Pricing Model" value={br.pricingModel} />
        <ReadOnlyRow label="Contingency" value={br.contingencyPercent ? `${br.contingencyPercent}%` : ""} />
      </SectionCard>

      <SectionCard title="Governance & Compliance">
        <ReadOnlyRow label="Non-Discrimination Confirmed" value={gv.nonDiscriminationConfirmed ? "Yes" : "No"} />
        <ReadOnlyRow label="Data Sensitivity Level" value={gv.dataSensitivityLevel} />
        <ReadOnlyRow label="Personal Data Involved" value={gv.personalDataInvolved} />
        <ReadOnlyRow label="Data Residency" value={gv.dataResidency} />
        <ReadOnlyRow label="Regulatory Frameworks" value={gv.regulatoryFrameworks} />
      </SectionCard>

      <SectionCard title="Commercial & Legal">
        <ReadOnlyRow label="IP Ownership" value={cl.ipOwnership} />
        <ReadOnlyRow label="Source Code Ownership" value={cl.sourceCodeOwnership} />
        <ReadOnlyRow label="Third-Party Costs" value={cl.thirdPartyCosts} />
        <ReadOnlyRow label="Change Request Process" value={cl.changeRequestProcess} />
      </SectionCard>
    </div>
  );
}

/* ═══ PAGE ═══ */

export default function GeneratePreviewPage({ sowId: sowIdProp }: { sowId?: string | null }) {
  const router = useRouter();
  const store = useSOWUploadStore();

  /* Always start fresh on page mount.
     - genPhase starts as "generating" so the page immediately shows the in-progress state
     - genMinimized starts as `false` so the full-screen generating modal auto-opens
       the moment the user lands on the page. The left-side floating pill only appears
       once the user closes/minimizes the modal.
     - genReady flips to `true` once the timers finish, enabling the manual
       "Continue to Review" action. We never auto-transition to the complete view. */
  const [genPhase, setGenPhase] = React.useState<"idle" | "generating" | "complete">("generating");
  const [genStageIdx, setGenStageIdx] = React.useState(-1);
  const [genMinimized, setGenMinimized] = React.useState(false);
  const [genReady, setGenReady] = React.useState(false);
  const [showSubmitModal, setShowSubmitModal] = React.useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = React.useState(false);
  const [submittedChangeNotes, setSubmittedChangeNotes] = React.useState("");
  const [showRejectModal, setShowRejectModal] = React.useState(false);
  const [requestChangesText, setRequestChangesText] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [showProcessingModal, setShowProcessingModal] = React.useState(false);
  const [showImprovementsModal, setShowImprovementsModal] = React.useState(false);
  const [processingStageIdx, setProcessingStageIdx] = React.useState(-1);
  const [activeTab, setActiveTab] = React.useState<TabKey>("sow");

  const sowId = sowIdProp ?? store.uploadedSowId;

  type HallucinationLayer = { layer?: number | string; name?: string; status?: string; details?: string };

  const metrics = mockPreviewMetrics;
  const riskData = mockRiskAssessment;
  const hallucinationLayers: HallucinationLayer[] = mockGenerationHallucinationLayers as HallucinationLayer[];
  const hasRedLayers = hallucinationLayers.some((l) => l.status === "failed");
  const isStale = store.previewState?.isStaleDocument || false;
  const canSubmit = genPhase === "complete" && !hasRedLayers && !isStale;

  const startGeneration = React.useCallback(() => {
    setGenPhase("generating");
    setGenStageIdx(-1);
    setGenReady(false);
    GEN_STAGES.forEach((_, i) => {
      setTimeout(() => setGenStageIdx(i), (i + 1) * 800);
    });
    /* When the background generation finishes, mark it ready — DO NOT auto-advance
       to the complete/review view. The user must click "Continue to Review". */
    setTimeout(() => {
      setGenReady(true);
      store.setGenerationState("complete");
      store.setPreviewState({
        qualityMetrics: metrics,
        isStaleDocument: false,
        hardBlocks: hasRedLayers ? ["Hallucination layer failed"] : [],
      });
    }, (GEN_STAGES.length + 1) * 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Mount-only initializer — guarded against Strict Mode double-invoke */
  const didInitRef = React.useRef(false);
  React.useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    /* Reset any stale state from a previous visit, then kick off generation */
    store.setGenerationState("idle");
    GEN_STAGES.forEach((_, i) => {
      setTimeout(() => setGenStageIdx(i), (i + 1) * 800);
    });
    setTimeout(() => {
      setGenReady(true);
      store.setGenerationState("complete");
      store.setPreviewState({
        qualityMetrics: metrics,
        isStaleDocument: false,
        hardBlocks: hasRedLayers ? ["Hallucination layer failed"] : [],
      });
    }, (GEN_STAGES.length + 1) * 800);
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

    // Start the processing animation
    PROCESSING_STAGES.forEach((_, i) => {
      setTimeout(() => setProcessingStageIdx(i), (i + 1) * 700);
    });
    const animDuration = (PROCESSING_STAGES.length + 1) * 700;
    setTimeout(() => {
      setShowProcessingModal(false);
      setShowImprovementsModal(true);
    }, animDuration);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    /* No auto-redirect — user proceeds manually via the Continue button after submission */
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

      {/* ═══ READ-ONLY DETAILS PREVIEW (visible during generating phase) ═══ */}
      {genPhase === "generating" && (
        <motion.div variants={fadeUp} className="mb-6">
          <ReadOnlyDetailsPreview details={store.commercialDetails} />

          {/* Action bar — only Back to Details on the right-side main content.
              The forward action (View Progress / Continue to Review) lives in the
              floating pill at the bottom-left. */}
          <div className="mt-5 flex items-center justify-start gap-3">
            <button
              onClick={() => router.push("/enterprise/sow/upload/details")}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 px-4 py-2.5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Details
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
                      className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center"
                      style={{ boxShadow: "0 8px 24px rgba(166,119,99,0.40), inset 0 1px 0 rgba(255,255,255,0.25)" }}
                    >
                      <Loader2 className="w-7 h-7 text-white animate-spin" />
                    </div>
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

                {/* ── Actions: Wait / Cancel while running · Continue to Review when ready ── */}
                {genReady ? (
                  <div className="mt-6">
                    <button
                      onClick={() => setGenPhase("complete")}
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

      {/* ═══ FLOATING WIDGET — only visible once the user has minimized the generating modal.
             While generating → "View Progress" pill (reopens modal)
             When ready → "Continue to Review" pill (advances to review view) ═══ */}
      <AnimatePresence>
        {genPhase === "generating" && genMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-6 left-[232px] z-40"
          >
            {genReady ? (
              <button
                onClick={() => setGenPhase("complete")}
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
                  {mockGeneratedSowSections.map((sec, i) => (
                    <div key={`${sec.title}-${i}`}>
                      <p className="text-[12px] font-semibold text-gray-700 mb-1.5">{sec.title}</p>
                      <p className="text-[13px] text-gray-500 leading-relaxed">{sec.body}</p>
                    </div>
                  ))}
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
                  {riskData.factors.map((f: any) => (
                    <div key={f.factor ?? f.name} className="flex items-center gap-4">
                      <span className="text-[12px] text-gray-600 w-28 shrink-0">{f.factor ?? f.name}</span>
                      <span className="text-[10px] text-gray-400 w-10 shrink-0">{f.weight ?? ""}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all",
                          Math.round(f.score ?? 0) >= 90 ? "bg-forest-500" : Math.round(f.score ?? 0) >= 70 ? "bg-gold-400" : "bg-red-400",
                        )} style={{ width: `${Math.round(f.score ?? 0)}%` }} />
                      </div>
                      <span className="text-[12px] font-semibold text-gray-700 w-10 text-right tabular-nums">{Math.round(f.score ?? 0)}%</span>
                    </div>
                  ))}
                  <div className="mt-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[11px] text-gray-500">
                      Overall Risk Level:{" "}
                      <span className="font-semibold text-gray-700">{riskData.riskLevel}</span>{" "}
                      ({riskData.riskScore}/100)
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "traceability" && (
                <div className="space-y-1">
                  {mockSourceTraceability.map((item, i) => (
                    <div key={item.section} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <span className="text-[10px] font-mono text-gray-300 w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-[12px] font-medium text-gray-700 flex-1">{item.section}</span>
                      <span className="text-[10px] text-gray-400">{item.source}</span>
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
                    { label: "Sections Updated", value: String(STATIC_IMPROVEMENTS.length) },
                    { label: "Clauses Revised",  value: String(STATIC_IMPROVEMENTS.length) },
                    { label: "Compliance",        value: "✓ Pass" },
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
                {submittedChangeNotes && (
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
                )}
                {STATIC_IMPROVEMENTS.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={`${item.section}-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-gray-200 transition-all">
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border", item.bg, item.border)}>
                        <Icon className={cn("w-3 h-3", item.color)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-[10px] font-bold uppercase tracking-wider", item.color)}>
                          {item.section}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">{item.change}</p>
                      </div>
                      <CheckCircle2 className="w-3 h-3 text-forest-400 shrink-0" />
                    </motion.div>
                  );
                })}
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
