"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ArrowLeft, CheckCircle2, AlertTriangle, Ban,
  ChevronDown, Sparkles, X, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { mockGapItems } from "@/mocks/data/sow-upload-flow";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import type { GapItem, GapSeverity } from "@/types/enterprise";

/* ── Severity config ── */

const SEV = {
  critical: {
    label: "Critical",
    dot: "bg-red-500",
    text: "text-red-600",
    border: "border-red-200",
    accentBorder: "border-l-red-400",
    badgeBg: "bg-red-50 text-red-600 border-red-200",
    icon: Ban,
  },
  important: {
    label: "Important",
    dot: "bg-amber-400",
    text: "text-amber-600",
    border: "border-amber-200",
    accentBorder: "border-l-amber-400",
    badgeBg: "bg-amber-50 text-amber-600 border-amber-200",
    icon: AlertTriangle,
  },
  optional: {
    label: "Optional",
    dot: "bg-gray-300",
    text: "text-gray-400",
    border: "border-gray-200",
    accentBorder: "border-l-gray-300",
    badgeBg: "bg-gray-50 text-gray-500 border-gray-200",
    icon: CheckCircle2,
  },
} as const;

/* ═══ PAGE ═══ */

export default function GapAnalysisPage() {
  const router = useRouter();
  const store = useSOWUploadStore();

  const [gaps, setGaps] = React.useState<GapItem[]>(() =>
    store.gapItems.length > 0 ? store.gapItems : mockGapItems,
  );
  const [collapsed, setCollapsed] = React.useState<Set<GapSeverity>>(new Set());

  /* Per-gap: AI suggestion selection */
  const [selectedSuggIdx, setSelectedSuggIdx] = React.useState<Record<string, number>>({});
  const [customText, setCustomText] = React.useState<Record<string, string>>({});

  /* Per-gap: false positive flow */
  const [showFPForm, setShowFPForm] = React.useState<Set<string>>(new Set());
  const [fpText, setFPText] = React.useState<Record<string, string>>({});

  /* Accept all pending modal */
  const [showAcceptModal, setShowAcceptModal] = React.useState(false);

  /* ── Derived counts ── */
  const criticalGaps  = gaps.filter((g) => g.severity === "critical");
  const importantGaps = gaps.filter((g) => g.severity === "important");
  const optionalGaps  = gaps.filter((g) => g.severity === "optional");

  const unresolvedCritical       = criticalGaps.filter((g) => !g.isResolved);
  const unacknowledgedImportant  = importantGaps.filter((g) => !g.isAcknowledged && !g.isResolved);
  const resolvedCritical         = criticalGaps.filter((g) => g.isResolved).length;
  const handledImportant         = importantGaps.filter((g) => g.isAcknowledged || g.isResolved).length;
  const dismissedOptional        = optionalGaps.filter((g) => g.isDismissed).length;
  const prohibitedCount          = gaps.filter((g) => g.isProhibited && !g.isResolved).length;

  const unreviewedCount = store.extractionItems.filter((e) => e.reviewState === "pending").length;

  const canProceed =
    unresolvedCritical.length === 0 &&
    unacknowledgedImportant.length === 0 &&
    prohibitedCount === 0;

  /* ── Actions ── */
  const resolveGap     = (id: string) => setGaps((p) => p.map((g) => g.id === id ? { ...g, isResolved: true } : g));
  const acknowledgeGap = (id: string) => setGaps((p) => p.map((g) => g.id === id ? { ...g, isAcknowledged: true } : g));
  const dismissGap     = (id: string) => setGaps((p) => p.map((g) => g.id === id ? { ...g, isDismissed: true } : g));
  const dismissAllOptional = () => setGaps((p) => p.map((g) => g.severity === "optional" ? { ...g, isDismissed: true } : g));

  const generateRemediation = (id: string) =>
    setGaps((p) => p.map((g) => g.id === id ? {
      ...g,
      remediationSuggestions: [
        "Add numbered acceptance criteria for each deliverable tied to specific test scenarios.",
        "Define pass/fail conditions using measurable metrics (e.g. response time < 500ms).",
        "Include sign-off authority and review process per milestone.",
      ],
    } : g));

  const applyAndResolve = (gapId: string) => {
    const selIdx = selectedSuggIdx[gapId] ?? -1;
    const hasText = selIdx >= 0 || (customText[gapId] || "").trim().length > 0;
    if (!hasText) return;
    resolveGap(gapId);
  };

  const handleFalsePositive = (id: string) => {
    if ((fpText[id] || "").length < 30) return;
    resolveGap(id);
    setShowFPForm((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const toggleSection = (sev: GapSeverity) =>
    setCollapsed((p) => { const n = new Set(p); n.has(sev) ? n.delete(sev) : n.add(sev); return n; });

  const handleAcceptAllPending = () => {
    store.acceptAllPending();
    setShowAcceptModal(false);
  };

  const handleContinue = () => {
    store.setGapItems(gaps);
    store.setFlowStep(5);
    router.push("/enterprise/sow/upload/details");
  };

  /* ══ Gap Card (small-width card per gap item) ══ */
  function GapCard({ gap }: { gap: GapItem }) {
    const cfg = SEV[gap.severity];
    const isHandled = gap.isResolved || gap.isAcknowledged || gap.isDismissed;
    const hasSuggestions = (gap.remediationSuggestions?.length ?? 0) > 0;
    const selIdx = selectedSuggIdx[gap.id] ?? -1;
    const hasResolveText =
      selIdx >= 0 || (customText[gap.id] || "").trim().length > 0;
    const isFPOpen = showFPForm.has(gap.id);
    const fpJustification = fpText[gap.id] || "";

    return (
      <div className={cn(
        "rounded-xl border border-l-[3px] bg-white shadow-sm transition-all overflow-hidden flex flex-col",
        cfg.accentBorder,
        cfg.border,
        isHandled && "opacity-55",
      )}>
        {/* ── Card header ── */}
        <div className="px-3.5 pt-3 pb-2.5">
          <div className="flex items-start gap-2 mb-1.5">
            {isHandled
              ? <CheckCircle2 className="w-3.5 h-3.5 text-forest-500 shrink-0 mt-0.5" />
              : gap.isProhibited
              ? <Ban className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
              : <cfg.icon className={cn("w-3.5 h-3.5 shrink-0 mt-0.5", cfg.text)} />
            }
            <span className={cn(
              "text-[12px] font-semibold leading-snug flex-1",
              isHandled ? "text-gray-400 line-through" : "text-gray-800",
            )}>
              {gap.title}
            </span>
            {gap.isProhibited && !isHandled && (
              <span className="shrink-0 text-[8px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                Prohibited
              </span>
            )}
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed pl-5">{gap.description}</p>

          <div className="mt-1.5 pl-5">
            <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">
              § {gap.section}
            </span>
          </div>
        </div>

        {/* ── Prohibited reason ── */}
        {gap.isProhibited && gap.prohibitedReason && !isHandled && (
          <div className="mx-3.5 mb-2.5 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
            <p className="text-[10px] text-red-600 leading-relaxed">{gap.prohibitedReason}</p>
          </div>
        )}

        {/* ── AI Suggestions: selectable cards + editable textarea ── */}
        {hasSuggestions && !isHandled && (
          <div className="px-3.5 pb-2.5 space-y-1.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              AI Suggestions — pick one
            </p>
            {gap.remediationSuggestions!.map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedSuggIdx((prev) => ({ ...prev, [gap.id]: i }));
                  setCustomText((prev) => ({ ...prev, [gap.id]: "" }));
                }}
                className={cn(
                  "w-full flex items-start gap-2 px-2.5 py-2 rounded-lg border text-left transition-all",
                  selIdx === i
                    ? "border-brown-400 bg-brown-50/70 ring-1 ring-brown-200"
                    : "border-gray-100 bg-gray-50/60 hover:border-brown-200 hover:bg-brown-50/30",
                )}>
                <Sparkles className={cn("w-2.5 h-2.5 shrink-0 mt-0.5", selIdx === i ? "text-brown-500" : "text-gray-400")} />
                <span className="text-[10px] text-gray-600 leading-relaxed">{s}</span>
              </button>
            ))}

            <div className="pt-0.5">
              <p className="text-[9px] text-gray-400 mb-1">Or write your own:</p>
              <textarea
                value={customText[gap.id] || ""}
                onChange={(e) => {
                  setCustomText((prev) => ({ ...prev, [gap.id]: e.target.value }));
                  if (e.target.value.trim()) {
                    setSelectedSuggIdx((prev) => { const n = { ...prev }; delete n[gap.id]; return n; });
                  }
                }}
                placeholder="Type your remediation text…"
                rows={2}
                className="w-full text-[10px] rounded-lg border border-gray-200 px-2.5 py-1.5 resize-none focus:outline-none focus:border-brown-300 placeholder:text-gray-300 bg-white"
              />
            </div>

            <button
              onClick={() => applyAndResolve(gap.id)}
              disabled={!hasResolveText}
              className={cn(
                "w-full text-[10px] font-semibold py-1.5 rounded-lg transition-all",
                hasResolveText
                  ? "bg-forest-600 text-white hover:bg-forest-700"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed",
              )}>
              Apply & Resolve
            </button>
          </div>
        )}

        {/* ── False positive justification form ── */}
        {isFPOpen && !isHandled && (
          <div className="mx-3.5 mb-2.5 px-3 py-2.5 rounded-lg bg-orange-50/50 border border-orange-100">
            <p className="text-[10px] font-semibold text-orange-700 mb-1.5">
              Justification required (min 30 chars)
            </p>
            <textarea
              value={fpJustification}
              onChange={(e) => setFPText((prev) => ({ ...prev, [gap.id]: e.target.value }))}
              placeholder="Explain why this is a false positive…"
              rows={2}
              className="w-full text-[10px] rounded-lg border border-orange-200 px-2.5 py-1.5 resize-none focus:outline-none focus:border-orange-400 bg-white placeholder:text-gray-300"
            />
            <div className="flex items-center justify-between mt-2 gap-2">
              <span className={cn(
                "text-[9px] font-medium tabular-nums",
                fpJustification.length < 30 ? "text-red-400" : "text-forest-600",
              )}>
                {fpJustification.length} / 30 min
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setShowFPForm((p) => { const n = new Set(p); n.delete(gap.id); return n; })}
                  className="text-[9px] font-medium text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg border border-gray-200 bg-white transition-all">
                  Cancel
                </button>
                <button
                  onClick={() => handleFalsePositive(gap.id)}
                  disabled={fpJustification.length < 30}
                  className={cn(
                    "text-[9px] font-semibold px-2.5 py-1 rounded-lg border transition-all",
                    fpJustification.length >= 30
                      ? "text-white bg-orange-500 border-orange-500 hover:bg-orange-600"
                      : "text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed",
                  )}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Actions footer ── */}
        {!isHandled && (
          <div className="mt-auto px-3.5 pb-3 pt-2 border-t border-gray-50 flex items-center gap-1.5 flex-wrap">

            {/* Critical — not prohibited, no suggestions yet */}
            {gap.severity === "critical" && !gap.isProhibited && !hasSuggestions && (
              <>
                <button
                  onClick={() => resolveGap(gap.id)}
                  className="text-[10px] font-medium text-forest-700 px-2.5 py-1.5 rounded-lg border border-forest-200 bg-forest-50 hover:bg-forest-100 transition-all">
                  Mark Resolved
                </button>
                <button
                  onClick={() => generateRemediation(gap.id)}
                  className="flex items-center gap-1 text-[10px] font-medium text-brown-600 px-2.5 py-1.5 rounded-lg border border-brown-200 bg-brown-50 hover:bg-brown-100 transition-all">
                  <Sparkles className="w-2.5 h-2.5" /> Generate Suggestion
                </button>
              </>
            )}

            {/* Critical — prohibited, false positive not open */}
            {gap.severity === "critical" && gap.isProhibited && !isFPOpen && (
              <>
                <button
                  onClick={() => resolveGap(gap.id)}
                  className="text-[10px] font-medium text-red-600 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-all">
                  Edit Clause
                </button>
                <button
                  onClick={() => setShowFPForm((p) => { const n = new Set(p); n.add(gap.id); return n; })}
                  className="text-[10px] font-medium text-orange-600 px-2.5 py-1.5 rounded-lg border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-all">
                  Mark as False Positive
                </button>
              </>
            )}

            {/* Important — acknowledgement checkbox */}
            {gap.severity === "important" && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={gap.isAcknowledged}
                  onChange={() => acknowledgeGap(gap.id)}
                  className="w-3.5 h-3.5 mt-0.5 rounded border-gray-300 accent-amber-500 shrink-0"
                />
                <span className="text-[10px] text-gray-500 leading-snug">
                  I acknowledge this gap and understand it may affect SOW quality.
                </span>
              </label>
            )}

            {/* Optional — dismiss */}
            {gap.severity === "optional" && (
              <button
                onClick={() => dismissGap(gap.id)}
                className="flex items-center gap-1 text-[10px] font-medium text-gray-400 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all">
                <X className="w-2.5 h-2.5" /> Dismiss
              </button>
            )}
          </div>
        )}

        {/* ── Handled badge ── */}
        {isHandled && (
          <div className="mt-auto px-3.5 pb-2.5 flex items-center gap-1.5 border-t border-gray-50 pt-2">
            <CheckCircle2 className="w-3 h-3 text-forest-500" />
            <span className="text-[10px] font-medium text-forest-600">
              {gap.isResolved ? "Resolved" : gap.isAcknowledged ? "Acknowledged" : "Dismissed"}
            </span>
          </div>
        )}
      </div>
    );
  }

  /* ══ Gap Section container ══ */
  function GapSection({
    severity, items, label, extraAction,
  }: {
    severity: GapSeverity;
    items: GapItem[];
    label: string;
    extraAction?: React.ReactNode;
  }) {
    const isCollapsed = collapsed.has(severity);
    const cfg = SEV[severity];
    const visibleItems = severity === "optional"
      ? items.filter((g) => !g.isDismissed)
      : items;

    if (visibleItems.length === 0 && severity === "optional") return null;

    const handledCount = visibleItems.filter(
      (g) => g.isResolved || g.isAcknowledged || g.isDismissed,
    ).length;
    const allHandled = handledCount === visibleItems.length && visibleItems.length > 0;

    return (
      <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-4">
        {/* Section header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100">
          <button
            onClick={() => toggleSection(severity)}
            className="flex items-center gap-2 flex-1 min-w-0 text-left">
            <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
            <cfg.icon className={cn("w-3.5 h-3.5 shrink-0", cfg.text)} />
            <span className={cn("text-[12px] font-semibold", cfg.text)}>{label}</span>
            <span className="text-[10px] text-gray-400">({visibleItems.length})</span>
            {allHandled && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-2.5 h-2.5" /> All handled
              </span>
            )}
            <ChevronDown className={cn(
              "w-4 h-4 text-gray-300 ml-auto transition-transform",
              isCollapsed && "-rotate-90",
            )} />
          </button>
          {extraAction}
        </div>

        {/* Cards grid — 2 columns of small cards */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden">
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {visibleItems.map((gap) => (
                  <GapCard key={gap.id} gap={gap} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  /* ══ Unreviewed Extractions section ══ */
  function UnreviewedSection() {
    if (unreviewedCount === 0) return null;
    return (
      <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-4">
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-amber-100 bg-amber-50/30">
          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="text-[12px] font-semibold text-amber-600">Unreviewed Extractions</span>
          <span className="text-[9px] font-bold text-amber-600 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
            {unreviewedCount} pending
          </span>
          <span className="ml-auto text-[10px] text-gray-400 hidden sm:block">
            Warning only — does not block progress
          </span>
        </div>
        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-[12px] font-medium text-gray-700 mb-0.5">
              {unreviewedCount} extraction item{unreviewedCount !== 1 ? "s" : ""} not yet reviewed
            </p>
            <p className="text-[11px] text-gray-400 leading-snug">
              These items were neither accepted, edited, nor excluded in the Parsed SOW Review step.
            </p>
          </div>
          <button
            onClick={() => setShowAcceptModal(true)}
            className="shrink-0 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-all whitespace-nowrap">
            Accept All Pending
          </button>
        </div>
      </motion.div>
    );
  }

  /* ══ Render ══ */
  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show">

        {/* Step progress */}
        <motion.div variants={fadeUp} className="mb-6">
          <FlowStepProgress currentStep={4} />
        </motion.div>

        {/* Header */}
        <motion.div variants={fadeUp} className="mb-6">
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">
            Gap Analysis Resolution
          </h1>
          <p className="mt-1.5 text-[13px] text-gray-500">
            Resolve critical gaps and acknowledge important ones before proceeding to Commercial &amp; Project Details.
          </p>
        </motion.div>

        {/* Summary card */}
        <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-5">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Critical</p>
              <div className="flex items-end gap-1.5">
                <span className={cn(
                  "num-display text-[28px] leading-none",
                  unresolvedCritical.length === 0 ? "text-forest-600" : "text-red-500",
                )}>
                  {resolvedCritical}/{criticalGaps.length}
                </span>
                <span className="text-[11px] text-gray-400 mb-1">resolved</span>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Important</p>
              <div className="flex items-end gap-1.5">
                <span className={cn(
                  "num-display text-[28px] leading-none",
                  unacknowledgedImportant.length === 0 ? "text-forest-600" : "text-amber-500",
                )}>
                  {handledImportant}/{importantGaps.length}
                </span>
                <span className="text-[11px] text-gray-400 mb-1">acknowledged</span>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Optional</p>
              <div className="flex items-end gap-1.5">
                <span className="num-display text-[28px] leading-none text-gray-500">
                  {dismissedOptional}/{optionalGaps.length}
                </span>
                <span className="text-[11px] text-gray-400 mb-1">dismissed</span>
              </div>
            </div>
          </div>
          {/* Status bar */}
          <div className={cn(
            "px-6 py-3 border-t border-gray-100 flex items-center gap-2",
            canProceed ? "bg-forest-50/50" : "bg-red-50/40",
          )}>
            {canProceed ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
                <span className="text-[12px] font-medium text-forest-700">
                  All gaps resolved — ready to proceed
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[12px] font-medium text-red-600">
                  {unresolvedCritical.length + unacknowledgedImportant.length + prohibitedCount} item
                  {unresolvedCritical.length + unacknowledgedImportant.length + prohibitedCount !== 1 ? "s" : ""}{" "}
                  remaining before you can continue
                </span>
              </>
            )}
          </div>
        </motion.div>

        {/* Prohibited hard block banner */}
        {prohibitedCount > 0 && (
          <motion.div variants={fadeUp} className="mb-4">
            <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border border-red-200 bg-red-50">
              <Ban className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-red-700 mb-0.5">
                  {prohibitedCount} prohibited clause{prohibitedCount !== 1 ? "s" : ""} detected
                </p>
                <p className="text-[12px] text-red-500">
                  This SOW contains {prohibitedCount} prohibited clause{prohibitedCount !== 1 ? "s" : ""}.
                  Resolve all before continuing — edit the clause or mark as false positive with a justification (min 30 chars). Dismissals are logged and reviewed by GlimmoraTeam Admin.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── All four sections ── */}
        <GapSection severity="critical"  items={criticalGaps}  label="Critical Gaps" />
        <GapSection severity="important" items={importantGaps} label="Important Gaps" />
        <GapSection
          severity="optional"
          items={optionalGaps}
          label="Optional Gaps"
          extraAction={
            optionalGaps.filter((g) => !g.isDismissed).length > 0 ? (
              <button
                onClick={dismissAllOptional}
                className="text-[11px] font-medium text-gray-400 hover:text-gray-600 whitespace-nowrap transition-colors mr-1">
                Dismiss all
              </button>
            ) : undefined
          }
        />
        <UnreviewedSection />

        {/* Footer nav */}
        <motion.div variants={fadeUp} className="flex items-center justify-between mt-2">
          <button
            onClick={() => router.push("/enterprise/sow/upload/review")}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 px-4 py-2.5 rounded-xl transition-all">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Review
          </button>
          <button
            onClick={handleContinue}
            disabled={!canProceed}
            className={cn(
              "flex items-center gap-2 text-[13px] font-semibold px-6 py-2.5 rounded-xl transition-all",
              canProceed
                ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 shadow-sm"
                : "text-gray-400 bg-gray-100 cursor-not-allowed",
            )}>
            Continue to Project Details <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

      </motion.div>

      {/* ── Accept All Pending confirmation modal ── */}
      <AnimatePresence>
        {showAcceptModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setShowAcceptModal(false)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <h3 className="text-[15px] font-semibold text-gray-800">Accept All Pending?</h3>
              </div>
              <p className="text-[12px] text-gray-500 mb-5 leading-relaxed">
                This will accept all <span className="font-semibold text-gray-700">{unreviewedCount}</span> pending
                extraction items as-is. They will be marked as confirmed without individual review.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAcceptModal(false)}
                  className="flex-1 text-[12px] font-medium text-gray-600 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleAcceptAllPending}
                  className="flex-1 text-[12px] font-semibold text-white bg-amber-500 hover:bg-amber-600 py-2.5 rounded-xl transition-all">
                  Accept All
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
