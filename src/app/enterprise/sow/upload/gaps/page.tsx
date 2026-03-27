"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Ban,
  ChevronDown,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { StatusBanner } from "@/components/enterprise/sow/StatusBanner";
import { mockGapItems } from "@/mocks/data/sow-upload-flow";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import type { GapItem, GapSeverity } from "@/types/enterprise";

/* ── Severity config ── */

const severityConfig: Record<
  GapSeverity,
  {
    label: string;
    border: string;
    bg: string;
    text: string;
    icon: typeof AlertTriangle;
  }
> = {
  critical: {
    label: "Critical",
    border: "border-l-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: Ban,
  },
  important: {
    label: "Important",
    border: "border-l-gold-500",
    bg: "bg-gold-50",
    text: "text-gold-700",
    icon: AlertTriangle,
  },
  optional: {
    label: "Optional",
    border: "border-l-gray-300",
    bg: "bg-gray-50",
    text: "text-gray-600",
    icon: CheckCircle2,
  },
};

/* ═══ PAGE ═══ */

export default function GapAnalysisPage() {
  const router = useRouter();
  const store = useSOWUploadStore();

  const [gaps, setGaps] = React.useState<GapItem[]>(() =>
    store.gapItems.length > 0 ? store.gapItems : mockGapItems,
  );
  const [collapsedSections, setCollapsedSections] = React.useState<
    Set<GapSeverity>
  >(new Set());

  const criticalGaps = gaps.filter((g) => g.severity === "critical");
  const importantGaps = gaps.filter((g) => g.severity === "important");
  const optionalGaps = gaps.filter((g) => g.severity === "optional");

  const unresolvedCritical = criticalGaps.filter((g) => !g.isResolved);
  const unacknowledgedImportant = importantGaps.filter(
    (g) => !g.isAcknowledged && !g.isResolved,
  );
  const prohibitedCount = gaps.filter(
    (g) => g.isProhibited && !g.isResolved,
  ).length;

  const canProceed =
    unresolvedCritical.length === 0 &&
    unacknowledgedImportant.length === 0 &&
    prohibitedCount === 0;

  const resolveGap = (id: string) =>
    setGaps((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isResolved: true } : g)),
    );
  const acknowledgeGap = (id: string) =>
    setGaps((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isAcknowledged: true } : g)),
    );
  const dismissGap = (id: string) =>
    setGaps((prev) =>
      prev.map((g) => (g.id === id ? { ...g, isDismissed: true } : g)),
    );
  const dismissAllOptional = () =>
    setGaps((prev) =>
      prev.map((g) =>
        g.severity === "optional" ? { ...g, isDismissed: true } : g,
      ),
    );

  const generateRemediation = (id: string) => {
    setGaps((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              remediationSuggestions: [
                "Add numbered acceptance criteria for each deliverable tied to specific test scenarios.",
                "Define pass/fail conditions using measurable metrics (e.g. response time < 500ms).",
                "Include sign-off authority and review process per milestone.",
              ],
            }
          : g,
      ),
    );
  };

  const toggleSection = (sev: GapSeverity) => {
    setCollapsedSections((prev) => {
      const n = new Set(prev);
      n.has(sev) ? n.delete(sev) : n.add(sev);
      return n;
    });
  };

  const handleContinue = () => {
    store.setGapItems(gaps);
    store.setFlowStep(5);
    router.push("/enterprise/sow/upload/details");
  };

  const resolvedCritical = criticalGaps.filter((g) => g.isResolved).length;

  function GapCard({ gap }: { gap: GapItem }) {
    const cfg = severityConfig[gap.severity];
    const isHandled = gap.isResolved || gap.isAcknowledged || gap.isDismissed;

    return (
      <div
        className={cn(
          "border-l-4 rounded-r-xl px-5 py-4 transition-all",
          isHandled ? "opacity-60 bg-gray-50 border-l-gray-300" : cfg.border,
          !isHandled && gap.severity === "critical" && "bg-red-50/50",
          !isHandled && gap.severity === "important" && "bg-gold-50/50",
        )}
      >
        <div className="flex items-start gap-3">
          {isHandled ? (
            <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0 mt-0.5" />
          ) : gap.isProhibited ? (
            <Ban className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          ) : (
            <cfg.icon className={cn("w-4 h-4 shrink-0 mt-0.5", cfg.text)} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "text-[13px] font-semibold",
                  isHandled ? "text-gray-500 line-through" : "text-gray-800",
                )}
              >
                {gap.title}
              </span>
              {gap.isProhibited && !isHandled && (
                <span className="text-[9px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase">
                  Prohibited
                </span>
              )}
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed mb-1">
              {gap.description}
            </p>
            <span className="text-[10px] text-gray-400">
              Section: {gap.section}
            </span>

            {/* Prohibited reason */}
            {gap.isProhibited && gap.prohibitedReason && !isHandled && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                <span className="text-[11px] text-red-700">
                  {gap.prohibitedReason}
                </span>
              </div>
            )}

            {/* Remediation suggestions */}
            {gap.remediationSuggestions &&
              gap.remediationSuggestions.length > 0 &&
              !isHandled && (
                <div className="mt-3 space-y-1.5">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    AI Suggestions
                  </span>
                  {gap.remediationSuggestions.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 cursor-pointer hover:border-forest-300 transition-colors"
                      onClick={() => resolveGap(gap.id)}
                    >
                      <Sparkles className="w-3 h-3 text-brown-400 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-gray-600">{s}</span>
                    </div>
                  ))}
                </div>
              )}

            {/* Actions */}
            {!isHandled && (
              <div className="flex items-center gap-2 mt-3">
                {gap.severity === "critical" && !gap.isProhibited && (
                  <>
                    <button
                      onClick={() => resolveGap(gap.id)}
                      className="text-[10px] font-medium text-forest-600 px-3 py-1.5 rounded-lg border border-forest-200 hover:bg-forest-50 transition-all"
                    >
                      Mark Resolved
                    </button>
                    {!gap.remediationSuggestions && (
                      <button
                        onClick={() => generateRemediation(gap.id)}
                        className="text-[10px] font-medium text-brown-600 px-3 py-1.5 rounded-lg border border-brown-200 hover:bg-brown-50 transition-all flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" /> Generate Suggestion
                      </button>
                    )}
                  </>
                )}
                {gap.severity === "critical" && gap.isProhibited && (
                  <button
                    onClick={() => resolveGap(gap.id)}
                    className="text-[10px] font-medium text-red-600 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-all"
                  >
                    Edit Clause to Resolve
                  </button>
                )}
                {gap.severity === "important" && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gap.isAcknowledged}
                      onChange={() => acknowledgeGap(gap.id)}
                      className="w-3.5 h-3.5 rounded border-gray-300"
                    />
                    <span className="text-[10px] text-gray-600">
                      I acknowledge this gap and understand it may affect SOW
                      quality
                    </span>
                  </label>
                )}
                {gap.severity === "optional" && (
                  <button
                    onClick={() => dismissGap(gap.id)}
                    className="text-[10px] font-medium text-gray-400 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Dismiss
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  function GapSection({
    severity,
    items,
    label,
  }: {
    severity: GapSeverity;
    items: GapItem[];
    label: string;
  }) {
    const isCollapsed = collapsedSections.has(severity);
    const cfg = severityConfig[severity];
    const visibleItems = items.filter((g) => !g.isDismissed);
    if (visibleItems.length === 0 && severity === "optional") return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 group">
          <button
            onClick={() => toggleSection(severity)}
            className="flex items-center gap-2"
          >
            <ChevronDown
              className={cn(
                "w-4 h-4 text-gray-400 transition-transform",
                isCollapsed && "-rotate-90",
              )}
            />
            <cfg.icon className={cn("w-4 h-4", cfg.text)} />
            <span className={cn("text-[13px] font-semibold", cfg.text)}>
              {label}
            </span>
            <span className="text-[11px] text-gray-400">
              ({visibleItems.length})
            </span>
          </button>
          {severity === "optional" && visibleItems.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissAllOptional();
              }}
              className="ml-auto text-[10px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Dismiss all
            </button>
          )}
        </div>
        {!isCollapsed && (
          <div className="space-y-2">
            {visibleItems.map((gap) => (
              <GapCard key={gap.id} gap={gap} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <motion.div variants={fadeUp} className="mb-6">
        <FlowStepProgress currentStep={4} />
      </motion.div>

      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">
          Gap Analysis Resolution
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          Resolve critical gaps and acknowledge important ones before proceeding
          to Commercial & Project Details.
        </p>
      </motion.div>

      {/* Prohibited clause hard block */}
      {prohibitedCount > 0 && (
        <motion.div variants={fadeUp} className="mb-6">
          <StatusBanner
            variant="error"
            title={`${prohibitedCount} prohibited clause(s) detected`}
            description="This SOW contains prohibited clauses that must be resolved before continuing. Edit or remove these clauses."
          />
        </motion.div>
      )}

      {/* Progress summary */}
      <motion.div variants={fadeUp} className="card-parchment px-5 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[11px] text-gray-400">Critical</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={cn(
                    "num-display text-[20px]",
                    unresolvedCritical.length === 0
                      ? "text-forest-600"
                      : "text-red-600",
                  )}
                >
                  {resolvedCritical}/{criticalGaps.length}
                </span>
                <span className="text-[10px] text-gray-400">resolved</span>
              </div>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div>
              <span className="text-[11px] text-gray-400">Important</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={cn(
                    "num-display text-[20px]",
                    unacknowledgedImportant.length === 0
                      ? "text-forest-600"
                      : "text-gold-600",
                  )}
                >
                  {
                    importantGaps.filter(
                      (g) => g.isAcknowledged || g.isResolved,
                    ).length
                  }
                  /{importantGaps.length}
                </span>
                <span className="text-[10px] text-gray-400">handled</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            {canProceed ? (
              <span className="text-[11px] font-medium text-forest-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready to proceed
              </span>
            ) : (
              <span className="text-[11px] font-medium text-red-500">
                {unresolvedCritical.length +
                  unacknowledgedImportant.length +
                  prohibitedCount}{" "}
                items remaining
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* Gap sections */}
      <motion.div variants={fadeUp}>
        <GapSection
          severity="critical"
          items={criticalGaps}
          label="Critical Gaps — Must Resolve"
        />
        <GapSection
          severity="important"
          items={importantGaps}
          label="Important Gaps — Acknowledge Required"
        />
        <GapSection
          severity="optional"
          items={optionalGaps}
          label="Optional Gaps — Dismissible"
        />
      </motion.div>

      {/* Actions */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between mt-4"
      >
        <button
          onClick={() => router.push("/enterprise/sow/upload/review")}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Review
        </button>
        <button
          onClick={handleContinue}
          disabled={!canProceed}
          className={cn(
            "flex items-center gap-2 text-[13px] font-semibold px-6 py-2.5 rounded-xl transition-all",
            canProceed
              ? "text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
              : "text-gray-400 bg-gray-100 cursor-not-allowed",
          )}
        >
          Continue to Project Details <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </motion.div>
  );
}
