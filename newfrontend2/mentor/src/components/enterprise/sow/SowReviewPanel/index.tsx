"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, MessageSquareDiff, RotateCcw, CheckCircle2,
  AlertTriangle, Ban, Loader2, Eye,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { fadeUp } from "@/lib/utils/motion-variants";
import { SowBadge } from "@/components/enterprise/sow/SowBadge";
import { GLASS_CARD, GLASS_SHADOW, AURORA_ACCENT } from "@/app/admin/_shell/aurora";
import {
  primaryBtnClass, primaryStyle, ghostBtnClass, dangerBtnClass,
  GLASS_FIELD_STYLE, GLASS_MODAL_CLASS, GLASS_MODAL_OVERLAY,
} from "@/app/admin/_shell/aurora-ui";
import type {
  SowReviewMetrics, SowReviewSection, SowRiskData,
  SowHallucinationLayer, SowTraceability,
} from "./types";

/* ── Tab config ── */

const TABS = [
  { key: "sow",           label: "Generated SOW" },
  { key: "hallucination", label: "Hallucination Analysis" },
  { key: "risk",          label: "Risk Assessment" },
  { key: "traceability",  label: "Traceability" },
] as const;
type TabKey = typeof TABS[number]["key"];

/* ── Props ── */

export interface SowReviewPanelProps {
  sections: SowReviewSection[];
  metrics: SowReviewMetrics;
  riskData: SowRiskData;
  hallucinationLayers: SowHallucinationLayer[];
  traceability: SowTraceability[];

  sectionsLoading?: boolean;
  riskLoading?: boolean;

  statusBanner?: React.ReactNode;

  canSubmit: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  submitError?: string;
  onSubmit: () => void;

  onBack: () => void;
  backLabel?: string;
  onRequestChanges?: (text: string) => void;
  onRejectRegenerate?: () => void;
  blockReason?: string;
}

/* ── Inline markdown renderer for SOW section bodies ── */

function SowSectionBody({ body }: { body: string }) {
  const lines = body.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line) { nodes.push(<br key={key++} />); continue; }

    // Bullet lines: "  - text" or "- text"
    if (/^\s*-\s/.test(line)) {
      const text = line.replace(/^\s*-\s/, "");
      nodes.push(
        <li key={key++} className="ml-4 text-[12.5px] text-text-secondary leading-relaxed list-disc">
          {renderInline(text)}
        </li>,
      );
      continue;
    }

    nodes.push(
      <p key={key++} className="text-[12.5px] text-text-secondary leading-relaxed">
        {renderInline(line)}
      </p>,
    );
  }

  return <div className="space-y-0.5">{nodes}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Split on **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
      : part,
  );
}

/* ── Metric card ── */

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className={cn(GLASS_CARD, "px-5 py-4")} style={GLASS_SHADOW}>
      <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2">{label}</p>
      <p className="num-display text-[26px] leading-none text-foreground">{value}</p>
      {sub && <p className="text-[10px] text-text-tertiary mt-1">{sub}</p>}
    </div>
  );
}

/* ── Panel ── */

export function SowReviewPanel({
  sections,
  metrics,
  riskData,
  hallucinationLayers,
  traceability,
  sectionsLoading = false,
  riskLoading = false,
  statusBanner,
  canSubmit,
  isSubmitting,
  isSubmitted,
  submitError,
  onSubmit,
  onBack,
  backLabel = "Back",
  onRequestChanges,
  onRejectRegenerate,
  blockReason,
}: SowReviewPanelProps) {
  const [activeTab,              setActiveTab]              = React.useState<TabKey>("sow");
  const [showSubmitModal,        setShowSubmitModal]        = React.useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = React.useState(false);
  const [showRejectModal,        setShowRejectModal]        = React.useState(false);
  const [requestChangesText,     setRequestChangesText]     = React.useState("");

  const RISK_ROWS = [
    { label: "Completeness",  weight: "30%", barColor: "#4D5741" },
    { label: "Confidence",    weight: "25%", barColor: "#C8B560" },
    { label: "Compliance",    weight: "25%", barColor: "#4D5741" },
    { label: "Pattern Match", weight: "20%", barColor: "#C8B560" },
  ];

  return (
    <>
      {/* Status banner */}
      {statusBanner && (
        <motion.div variants={fadeUp} className="mb-5">
          {statusBanner}
        </motion.div>
      )}

      {/* Quality metrics */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <MetricCard label="Confidence"          value={`${Math.round(metrics.confidence)}%`}      sub="AI extraction quality" />
        <MetricCard label="Risk Score"          value={`${Math.round(metrics.riskScore)}/100`}    sub="Lower is better" />
        <MetricCard label="Hallucination Flags" value={metrics.hallucinationFlags}                sub={metrics.hallucinationFlags === 0 ? "All layers passed" : "Review required"} />
        <MetricCard label="Completeness"        value={`${Math.round(metrics.completeness)}%`}   sub="Sections covered" />
      </motion.div>

      {/* Tab panel */}
      <motion.div variants={fadeUp} className={cn(GLASS_CARD, "overflow-hidden mb-5")} style={GLASS_SHADOW}>
        {/* Tab bar */}
        <div className="flex border-b border-white/55 px-2 pt-2 gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "text-[12px] font-medium px-4 py-2.5 rounded-t-xl whitespace-nowrap transition-all border-b-2 -mb-px",
                activeTab === tab.key
                  ? "text-foreground border-transparent"
                  : "text-text-tertiary border-transparent hover:text-foreground hover:bg-white/50",
              )}
              style={
                activeTab === tab.key
                  ? { backgroundImage: AURORA_ACCENT, backgroundRepeat: "no-repeat", backgroundSize: "100% 2px", backgroundPosition: "bottom" }
                  : undefined
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-6 py-6 min-h-[280px]">

          {/* Generated SOW */}
          {activeTab === "sow" && (
            <div className="space-y-6">
              {sectionsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3.5 w-1/3 rounded bg-white/60 animate-pulse" />
                    <div className="h-3 w-full rounded bg-white/60 animate-pulse" />
                    <div className="h-3 w-5/6 rounded bg-white/60 animate-pulse" />
                  </div>
                ))
              ) : sections.length === 0 ? (
                <p className="text-[13px] text-text-tertiary text-center py-8">No sections available yet.</p>
              ) : (
                sections.map((sec, i) => (
                  <div key={`${sec.title}-${i}`} className="pb-5 border-b border-white/55 last:border-0 last:pb-0">
                    <p className="text-[13px] font-bold text-foreground mb-2 uppercase tracking-wide">{sec.title}</p>
                    <SowSectionBody body={sec.body} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* Hallucination Analysis */}
          {activeTab === "hallucination" && (
            <div className="space-y-1.5">
              {hallucinationLayers.length === 0 ? (
                <p className="text-[13px] text-text-tertiary text-center py-8">No hallucination data available.</p>
              ) : (
                hallucinationLayers.map((layer: any, idx: number) => {
                  const layerStatus =
                    layer.status === "green" ? "passed" :
                    layer.status === "amber" ? "warning" :
                    layer.status === "red"   ? "failed"  : layer.status;
                  return (
                    <div
                      key={layer.layer ?? layer.layer_id ?? idx}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-fast hover:bg-white/50"
                    >
                      {layerStatus === "passed"  ? <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                       : layerStatus === "warning" ? <AlertTriangle className="w-4 h-4 text-gold-500 shrink-0" />
                       : layerStatus === "failed"  ? <Ban className="w-4 h-4 text-red-500 shrink-0" />
                       : <Eye className="w-4 h-4 text-text-tertiary shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-text-secondary">
                          Layer {layer.layer ?? layer.layer_id ?? idx + 1}: {layer.name}
                        </p>
                        <p className="text-[11px] text-text-tertiary mt-0.5">
                          {layer.details ?? (layer.active ? "Active" : "Inactive")}
                        </p>
                      </div>
                      <SowBadge variant={layerStatus === "passed" ? "forest" : layerStatus === "warning" ? "gold" : "danger"}>
                        {layerStatus}
                      </SowBadge>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Risk Assessment */}
          {activeTab === "risk" && (
            <div className="space-y-5">
              {riskLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-3 w-28 rounded bg-white/60 animate-pulse shrink-0" />
                    <div className="h-3 w-8 rounded bg-white/60 animate-pulse shrink-0" />
                    <div className="flex-1 h-2 rounded-full bg-white/60 animate-pulse" />
                    <div className="h-3 w-10 rounded bg-white/60 animate-pulse shrink-0" />
                  </div>
                ))
              ) : riskData.factors.length === 0 ? (
                <p className="text-[13px] text-text-tertiary text-center py-8">No risk data available.</p>
              ) : (
                <>
                  {riskData.factors.map((f, idx) => {
                    const score    = Math.round(f.score ?? 0);
                    const weight   = f.weight || RISK_ROWS[idx]?.weight || "";
                    const barColor = f.weight
                      ? (score >= 90 ? "#4D5741" : score >= 70 ? "#C8B560" : "#EF4444")
                      : (RISK_ROWS[idx]?.barColor ?? "#4D5741");
                    return (
                      <div key={f.factor} className="flex items-center gap-4">
                        <span className="text-[13px] text-text-secondary shrink-0" style={{ minWidth: "8.5rem" }}>
                          {f.factor}
                        </span>
                        <span className="text-[11px] text-text-tertiary shrink-0 w-9 tabular-nums">{weight}</span>
                        <div className="flex-1 h-2.5 rounded-full bg-foreground/[0.08] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(score, 100)}%`, background: barColor }}
                          />
                        </div>
                        <span className="text-[13px] font-semibold text-text-secondary w-12 text-right tabular-nums">
                          {score}%
                        </span>
                      </div>
                    );
                  })}
                  <div className="mt-2 px-4 py-3 rounded-xl bg-white/50 border border-white/55">
                    <p className="text-[12px] text-text-secondary">
                      Overall Risk Level:{" "}
                      <span className="font-bold text-foreground">{riskData.riskLevel || "—"}</span>{" "}
                      ({riskData.riskScore}/100)
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Source Traceability */}
          {activeTab === "traceability" && (
            <div className="space-y-1">
              {traceability.length === 0 ? (
                <p className="text-[13px] text-text-tertiary text-center py-8">No traceability data available.</p>
              ) : (
                traceability.map((item, i) => (
                  <div
                    key={`${item.section}-${i}`}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors duration-fast hover:bg-white/50"
                  >
                    <span className="text-[10px] font-mono text-text-disabled w-6 shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[12px] font-medium text-text-secondary flex-1">{item.section}</span>
                    <span className="text-[10px] text-text-tertiary">{item.source}</span>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      </motion.div>

      {/* Block notice */}
      {!canSubmit && blockReason && (
        <motion.div variants={fadeUp} className="mb-5 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
          <Ban className="w-3.5 h-3.5 text-red-400 shrink-0" />
          <span className="text-[12px] text-red-600">{blockReason}</span>
        </motion.div>
      )}

      {/* Action bar */}
      <motion.div variants={fadeUp} className="flex items-center justify-between gap-3">
        <button onClick={onBack} className={ghostBtnClass}>
          <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
        </button>

        <div className="flex items-center gap-2">
          {onRequestChanges && (
            <button
              onClick={() => setShowRequestChangesModal(true)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-700 px-4 py-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all"
            >
              <MessageSquareDiff className="w-3.5 h-3.5" /> Request Changes
            </button>
          )}
          {onRejectRegenerate && (
            <button
              onClick={() => setShowRejectModal(true)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-red-600 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reject & Regenerate
            </button>
          )}
          <button
            onClick={() => setShowSubmitModal(true)}
            disabled={!canSubmit}
            className={cn(
              primaryBtnClass,
              !canSubmit && "text-text-tertiary! bg-foreground/[0.06]",
            )}
            style={canSubmit ? primaryStyle : undefined}
          >
            <Send className="w-3.5 h-3.5" /> Submit for Approval
          </button>
        </div>
      </motion.div>

      {/* ── REQUEST CHANGES MODAL ── */}
      <AnimatePresence>
        {showRequestChangesModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={cn("fixed inset-0 z-50 flex items-center justify-center px-4", GLASS_MODAL_OVERLAY)}
            onClick={() => setShowRequestChangesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className={cn("rounded-2xl w-full max-w-[440px] overflow-hidden", GLASS_MODAL_CLASS)}
            >
              <div className="px-6 pt-6 pb-4 border-b border-white/55 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <MessageSquareDiff className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">Request Changes</h3>
                </div>
                <button onClick={() => setShowRequestChangesModal(false)} className="text-text-tertiary hover:text-foreground transition-colors">
                  ✕
                </button>
              </div>
              <div className="px-6 py-5 space-y-3">
                <p className="text-[12px] text-text-secondary leading-relaxed">
                  Describe the specific changes needed. This will be logged in the SOW audit trail and sent to the document generator.
                </p>
                <textarea
                  value={requestChangesText}
                  onChange={(e) => setRequestChangesText(e.target.value)}
                  placeholder="e.g. Update the delivery scope to include performance testing. Revise the budget section to reflect the agreed fixed-price model…"
                  rows={4}
                  style={GLASS_FIELD_STYLE}
                  className="w-full text-[13px] text-foreground px-3.5 py-2.5 rounded-xl backdrop-blur-md resize-none transition-colors placeholder:text-text-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)]"
                />
                <span className={cn("text-[10px] font-medium", requestChangesText.length < 20 ? "text-text-disabled" : "text-text-tertiary")}>
                  {requestChangesText.length} chars
                </span>
              </div>
              <div className="px-6 pb-5 flex gap-2 justify-end">
                <button
                  onClick={() => setShowRequestChangesModal(false)}
                  className={ghostBtnClass}
                >
                  Cancel
                </button>
                <button
                  disabled={requestChangesText.trim().length < 20}
                  onClick={() => {
                    onRequestChanges?.(requestChangesText);
                    setShowRequestChangesModal(false);
                    setRequestChangesText("");
                  }}
                  className={cn(
                    "flex items-center gap-1.5 text-[12px] font-semibold px-5 py-2.5 rounded-xl transition-all",
                    requestChangesText.trim().length >= 20
                      ? "text-white bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700"
                      : "text-text-tertiary bg-foreground/[0.06] cursor-not-allowed",
                  )}
                >
                  <MessageSquareDiff className="w-3.5 h-3.5" /> Submit Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── REJECT & REGENERATE MODAL ── */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={cn("fixed inset-0 z-50 flex items-center justify-center px-4", GLASS_MODAL_OVERLAY)}
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className={cn("rounded-2xl w-full max-w-[400px] overflow-hidden", GLASS_MODAL_CLASS)}
            >
              <div className="px-6 pt-6 pb-4 border-b border-white/55 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4 text-red-500" />
                  </div>
                  <h3 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">Reject & Regenerate?</h3>
                </div>
                <button onClick={() => setShowRejectModal(false)} className="text-text-tertiary hover:text-foreground transition-colors">
                  ✕
                </button>
              </div>
              <div className="px-6 py-5">
                <p className="text-[12px] text-text-secondary leading-relaxed mb-4">
                  This will discard the current generated draft and restart the generation process. This action cannot be undone.
                </p>
                <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600 leading-relaxed">
                    The current draft will be permanently discarded. Go back to Details to update any inputs first.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-5 flex gap-2 justify-end">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className={ghostBtnClass}
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowRejectModal(false); onRejectRegenerate?.(); }}
                  className={dangerBtnClass}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Discard & Regenerate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUBMIT MODAL ── */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={cn("fixed inset-0 z-50 flex items-center justify-center px-4", GLASS_MODAL_OVERLAY)}
            onClick={() => !isSubmitted && !isSubmitting && setShowSubmitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.90, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className={cn("relative w-full max-w-[420px] overflow-hidden rounded-2xl", GLASS_MODAL_CLASS)}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px]"
                style={{ backgroundImage: AURORA_ACCENT }} />

              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
                    <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-white/55">
                      <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundImage: AURORA_ACCENT, boxShadow: "0 4px 12px rgba(108,76,230,0.30)" }}>
                        <Send className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-display text-[15px] font-extrabold text-foreground tracking-tight">Submit for Approval</h3>
                        <p className="text-[13px] font-medium text-text-secondary">Enters the two-step approval pipeline</p>
                      </div>
                    </div>

                    {/* Quality snapshot */}
                    <div className="px-5 pt-3.5 pb-3">
                      <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-2.5">Quality Snapshot</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Confidence",   value: `${Math.round(metrics.confidence)}%`,  color: "text-foreground", bg: "bg-white/55", border: "border-white/55" },
                          { label: "Risk",         value: `${Math.round(metrics.riskScore)}`,    color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                          { label: "Completeness", value: `${Math.round(metrics.completeness)}%`, color: "text-teal-700",  bg: "bg-teal-50",  border: "border-teal-100"  },
                        ].map((m) => (
                          <div key={m.label} className={cn("rounded-xl border px-2.5 py-2.5 text-center backdrop-blur", m.bg, m.border)}>
                            <p className={cn("num-display text-[18px] leading-none font-bold", m.color)}>{m.value}</p>
                            <p className="text-[9px] font-semibold text-text-tertiary uppercase tracking-widest mt-1">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Approval stages */}
                    <div className="px-5 pb-4">
                      <p className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest mb-3">Approval Stages</p>
                      <div className="space-y-1.5">
                        {["Glimmora Commercial", "Enterprise admin sign-off"].map((label, i) => (
                          <div key={label} className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-white/55 bg-white/50">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white shrink-0" style={{ backgroundImage: AURORA_ACCENT }}>
                              {i + 1}
                            </span>
                            <span className="text-[12px] font-medium text-text-secondary">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Error + actions */}
                    <div className="px-5 pb-5">
                      {submitError && (
                        <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 flex items-start gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-red-600 leading-relaxed">{submitError}</p>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowSubmitModal(false)}
                          disabled={isSubmitting}
                          className={cn(ghostBtnClass, "flex-1")}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={onSubmit}
                          disabled={isSubmitting}
                          className={cn(primaryBtnClass, "flex-[2] disabled:cursor-wait")}
                          style={primaryStyle}
                        >
                          {isSubmitting
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                            : <><Send className="w-3.5 h-3.5" /> Confirm &amp; Submit</>}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                    className="px-6 py-10 flex flex-col items-center text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center mb-5"
                      style={{ boxShadow: "0 8px 24px rgba(42,96,68,0.35)" }}>
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="font-display text-[17px] font-extrabold text-foreground tracking-tight">Submitted!</h3>
                    <p className="text-[12px] text-text-secondary mt-2 leading-relaxed">
                      Your SOW has entered the two-step approval pipeline. You'll be notified at each gate.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
