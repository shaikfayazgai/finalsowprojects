"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Sparkles,
  X,
  Ban,
  ChevronDown,
  ChevronUp,
  Shield,
  Lightbulb,
  Loader2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, slideInRight } from "@/lib/utils/motion-variants";
import { Badge, Button, Progress, Checkbox } from "@/components/ui";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { useGapItems, useUpdateGapItem } from "@/lib/hooks/use-manual-sow";

/* ────────────────────────────────────────────────────────────
   Types & mock data
   ──────────────────────────────────────────────────────────── */
type GapSeverity = "critical" | "important" | "optional";
type GapStatus = "unresolved" | "resolving" | "resolved" | "acknowledged" | "dismissed";

interface Gap {
  id: string;
  severity: GapSeverity;
  title: string;
  description: string;
  affectedSection: string;
  status: GapStatus;
  remediation?: string;
}

const INITIAL_GAPS: Gap[] = [
  // Critical
  {
    id: "crit-1",
    severity: "critical",
    title: "Missing Acceptance Criteria",
    description:
      "No formal acceptance criteria defined for 4 of 6 major deliverables. This creates ambiguity around project completion and may lead to scope disputes.",
    affectedSection: "Feature/Module Deliverables",
    status: "unresolved",
  },
  {
    id: "crit-2",
    severity: "critical",
    title: "Undefined Data Migration Strategy",
    description:
      "The SOW references legacy data migration from 3 systems but provides no specification for data mapping, transformation rules, or rollback procedures.",
    affectedSection: "Technical Requirements",
    status: "unresolved",
  },

  // Important
  {
    id: "imp-1",
    severity: "important",
    title: "Ambiguous SLA Definitions",
    description:
      "Uptime SLA mentioned as '99.9%' but measurement window (monthly vs. annual) and exclusion periods are not specified.",
    affectedSection: "Compliance Requirements",
    status: "unresolved",
  },
  {
    id: "imp-2",
    severity: "important",
    title: "Vague Change Request Process",
    description:
      "Change management is referenced but lacks detail on pricing adjustments, approval timeline, and scope impact assessment methodology.",
    affectedSection: "Assumptions & Constraints",
    status: "unresolved",
  },
  {
    id: "imp-3",
    severity: "important",
    title: "Incomplete Risk Mitigation Plans",
    description:
      "Two identified risks lack corresponding mitigation strategies and fallback plans.",
    affectedSection: "Risk Factors",
    status: "unresolved",
  },

  // Optional
  {
    id: "opt-1",
    severity: "optional",
    title: "Training Materials Not Specified",
    description:
      "No mention of end-user training documentation, video tutorials, or knowledge base articles as deliverables.",
    affectedSection: "Feature/Module Deliverables",
    status: "unresolved",
  },
  {
    id: "opt-2",
    severity: "optional",
    title: "Warranty Period Undefined",
    description:
      "Post-launch warranty/support period not explicitly defined. Industry standard is 60-90 days.",
    affectedSection: "Budget & Commercial Terms",
    status: "unresolved",
  },
  {
    id: "opt-3",
    severity: "optional",
    title: "Performance Benchmarks Missing",
    description:
      "No specific performance benchmarks for page load times, API response times, or concurrent user capacity.",
    affectedSection: "Technical Requirements",
    status: "unresolved",
  },
];

const MOCK_REMEDIATIONS: Record<string, string> = {
  "crit-1":
    "Suggested acceptance criteria: Each deliverable should include (1) functional requirements checklist, (2) performance benchmarks, (3) user sign-off from designated stakeholder, and (4) automated test coverage minimum of 80%.",
  "crit-2":
    "Recommended data migration approach: Implement a phased ETL pipeline with (1) source system audit and data profiling, (2) mapping document approved by both parties, (3) staged migration with validation checkpoints, and (4) rollback window of 48 hours post-migration.",
};

const UNREVIEWED_EXTRACTIONS_COUNT = 5;

/* ────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────── */
function getSeverityConfig(severity: GapSeverity) {
  switch (severity) {
    case "critical":
      return {
        icon: AlertOctagon,
        borderColor: "border-red-300",
        bgColor: "bg-red-50/60",
        headerBg: "bg-red-500",
        badgeVariant: "danger" as const,
        textColor: "text-red-700",
        label: "Critical",
      };
    case "important":
      return {
        icon: AlertTriangle,
        borderColor: "border-gold-300",
        bgColor: "bg-gold-50/60",
        headerBg: "bg-gold-500",
        badgeVariant: "gold" as const,
        textColor: "text-gold-700",
        label: "Important",
      };
    case "optional":
      return {
        icon: Info,
        borderColor: "border-beige-300",
        bgColor: "bg-beige-50/60",
        headerBg: "bg-beige-400",
        badgeVariant: "beige" as const,
        textColor: "text-beige-700",
        label: "Optional",
      };
  }
}

/* ────────────────────────────────────────────────────────────
   Page component
   ──────────────────────────────────────────────────────────── */
/* Transform API gap items to local Gap shape */
function apiToGap(item: Record<string, unknown>): Gap {
  return {
    id: String(item.id ?? ""),
    severity: (item.severity as GapSeverity) ?? "important",
    title: String(item.title ?? item.name ?? ""),
    description: String(item.description ?? ""),
    affectedSection: String(item.affected_section ?? item.affectedSection ?? ""),
    status: (item.status as Gap["status"]) ?? "unresolved",
    remediation: item.remediation ? String(item.remediation) : undefined,
  };
}

export default function GapAnalysisPage() {
  const store = useSOWUploadStore();
  const sowId = store.uploadedSowId;
  const { data: gapRes } = useGapItems(sowId);
  const updateGapMutation = useUpdateGapItem(sowId);

  const apiGaps = React.useMemo(() => {
    if (!gapRes) return null;
    const res = gapRes as unknown as Record<string, unknown>;
    const payload = (res.data !== undefined && res.data !== null ? res.data : res) as Record<string, unknown>;
    const list = payload.items ?? payload.gaps ?? payload.gap_items ?? payload.gapItems ?? payload.results ?? payload;
    return Array.isArray(list) && list.length > 0 ? list : null;
  }, [gapRes]);
  const initialGaps = React.useMemo(
    () => (apiGaps && (apiGaps as unknown[]).length > 0 ? (apiGaps as Record<string, unknown>[]).map(apiToGap) : INITIAL_GAPS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [!!apiGaps],
  );

  const [gaps, setGaps] = React.useState<Gap[]>(initialGaps);
  const [expandedGap, setExpandedGap] = React.useState<string | null>("crit-1");
  const [generatingRemediation, setGeneratingRemediation] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (apiGaps && (apiGaps as unknown[]).length > 0) {
      setGaps((apiGaps as Record<string, unknown>[]).map(apiToGap));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!apiGaps]);

  const criticalGaps = gaps.filter((g) => g.severity === "critical");
  const importantGaps = gaps.filter((g) => g.severity === "important");
  const optionalGaps = gaps.filter((g) => g.severity === "optional");

  const unresolvedCritical = criticalGaps.filter(
    (g) => g.status !== "resolved"
  ).length;
  const allCriticalResolved = unresolvedCritical === 0;

  const totalGaps = gaps.length;
  const resolvedGaps = gaps.filter(
    (g) => g.status === "resolved" || g.status === "acknowledged" || g.status === "dismissed"
  ).length;

  const generateRemediation = (gapId: string) => {
    setGeneratingRemediation(gapId);
    setTimeout(() => {
      setGaps((prev) =>
        prev.map((g) =>
          g.id === gapId
            ? {
                ...g,
                remediation: MOCK_REMEDIATIONS[gapId] || "AI-generated remediation: Add specific requirements, timelines, and measurable criteria to address this gap. Consider scheduling a stakeholder review session to align expectations.",
                status: "resolving",
              }
            : g
        )
      );
      setGeneratingRemediation(null);
    }, 1500);
  };

  const resolveGap = (gapId: string) => {
    setGaps((prev) =>
      prev.map((g) =>
        g.id === gapId ? { ...g, status: "resolved" } : g
      )
    );
    if (sowId) updateGapMutation.mutate({ gapId, data: { is_resolved: true } });
  };

  const acknowledgeGap = (gapId: string) => {
    setGaps((prev) =>
      prev.map((g) =>
        g.id === gapId ? { ...g, status: "acknowledged" } : g
      )
    );
    if (sowId) updateGapMutation.mutate({ gapId, data: { is_acknowledged: true } });
  };

  const dismissAllOptional = () => {
    const optIds = gaps.filter((g) => g.severity === "optional" && g.status !== "dismissed").map((g) => g.id);
    setGaps((prev) =>
      prev.map((g) =>
        g.severity === "optional" ? { ...g, status: "dismissed" } : g
      )
    );
    if (sowId) {
      optIds.forEach((gapId) => updateGapMutation.mutate({ gapId, data: { is_dismissed: true } }));
    }
  };

  const renderGapCard = (gap: Gap) => {
    const config = getSeverityConfig(gap.severity);
    const isExpanded = expandedGap === gap.id;
    const isGenerating = generatingRemediation === gap.id;
    const isResolved =
      gap.status === "resolved" || gap.status === "acknowledged" || gap.status === "dismissed";

    return (
      <motion.div
        key={gap.id}
        layout
        className={cn(
          "rounded-xl overflow-hidden transition-all",
          isResolved && "opacity-60",
          config.borderColor
        )}
        style={{
          background: "var(--card-bg)",
          border: `1px solid`,
          borderColor: isResolved ? "var(--border-soft)" : undefined,
          borderRadius: 12,
        }}
      >
        {/* Card header */}
        <button
          className="w-full flex items-center gap-3 px-5 py-3.5 hover:opacity-90 transition-all text-left"
          onClick={() => setExpandedGap(isExpanded ? null : gap.id)}
        >
          <config.icon
            className={cn("w-4.5 h-4.5 shrink-0", config.textColor)}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-[13px] font-semibold truncate"
                style={{ color: "var(--ink)" }}
              >
                {gap.title}
              </span>
              {isResolved && (
                <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
              )}
            </div>
            <p className="text-[11px] truncate" style={{ color: "var(--ink-faint)" }}>
              {gap.affectedSection}
            </p>
          </div>
          <Badge variant={config.badgeVariant} size="sm">
            {isResolved
              ? gap.status.charAt(0).toUpperCase() + gap.status.slice(1)
              : config.label}
          </Badge>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 shrink-0" style={{ color: "var(--ink-muted)" }} />
          ) : (
            <ChevronDown className="w-4 h-4 shrink-0" style={{ color: "var(--ink-muted)" }} />
          )}
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div
                className="px-5 pb-4 pt-2 space-y-3"
                style={{ borderTop: "1px solid var(--border-soft)" }}
              >
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--ink)" }}>
                  {gap.description}
                </p>

                {/* Remediation suggestion */}
                {gap.remediation && (
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "var(--page-bg)",
                      border: "1px solid var(--border-soft)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-3.5 h-3.5 text-forest-500" />
                      <span className="text-[12px] font-bold text-forest-700 uppercase tracking-wider">
                        AI Remediation Suggestion
                      </span>
                    </div>
                    <p className="text-[12px] leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                      {gap.remediation}
                    </p>
                  </div>
                )}

                {/* Actions */}
                {!isResolved && (
                  <div className="flex items-center gap-2 pt-1">
                    {gap.severity === "critical" && !gap.remediation && (
                      <Button
                        variant="gradient-forest"
                        size="sm"
                        disabled={isGenerating}
                        onClick={() => generateRemediation(gap.id)}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            Generate Remediation Suggestion
                          </>
                        )}
                      </Button>
                    )}
                    {gap.severity === "critical" && gap.remediation && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => resolveGap(gap.id)}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Mark Resolved
                      </Button>
                    )}
                    {gap.severity === "important" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeGap(gap.id)}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Acknowledge
                      </Button>
                    )}
                    {gap.severity === "optional" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => {
                          setGaps((prev) =>
                            prev.map((g) =>
                              g.id === gap.id ? { ...g, status: "dismissed" } : g
                            )
                          );
                          if (sowId) updateGapMutation.mutate({ gapId: gap.id, data: { is_dismissed: true } });
                        }}
                      >
                        <Ban className="w-3 h-3" />
                        Exclude
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-[1100px] mx-auto space-y-6"
    >
      {/* Back Link */}
      <motion.div variants={fadeUp}>
        <Link
          href="/enterprise/sow/upload/parsed-review"
          className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-colors group"
          style={{ color: "var(--ink-muted)" }}
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Parsed Review
        </Link>
      </motion.div>

      {/* Page Header */}
      <motion.div variants={fadeUp}>
        <h1
          className="font-heading"
          style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--ink)" }}
        >
          Gap Analysis Resolution
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>
          Address identified gaps in the SOW before proceeding. Critical gaps must be resolved.
        </p>
      </motion.div>

      {/* Summary Bar */}
      <motion.div variants={fadeUp}>
        <div
          className="rounded-xl px-5 py-4 flex items-center gap-6 flex-wrap"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-soft)",
            borderRadius: 12,
          }}
        >
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold" style={{ color: "var(--ink)" }}>
                Resolution Progress
              </span>
              <span className="text-[12px] font-semibold" style={{ color: "var(--ink-muted)" }}>
                {resolvedGaps} of {totalGaps} resolved
              </span>
            </div>
            <Progress
              value={totalGaps > 0 ? Math.round((resolvedGaps / totalGaps) * 100) : 0}
              variant="gradient-forest"
              size="md"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold font-heading text-red-600">
                {criticalGaps.length}
              </p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>
                Critical
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-heading text-gold-600">
                {importantGaps.length}
              </p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>
                Important
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold font-heading" style={{ color: "var(--ink-muted)" }}>
                {optionalGaps.length}
              </p>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--ink-faint)" }}>
                Optional
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Unreviewed Extractions Warning */}
      {UNREVIEWED_EXTRACTIONS_COUNT > 0 && (
        <motion.div variants={fadeUp}>
          <div
            className="rounded-xl px-5 py-3.5 flex items-center gap-3"
            style={{
              background: "rgba(245, 166, 35, 0.08)",
              border: "1px solid rgba(245, 166, 35, 0.25)",
              borderRadius: 12,
            }}
          >
            <Eye className="w-4 h-4 text-gold-600 shrink-0" />
            <div className="flex-1">
              <span className="text-[13px] font-semibold text-gold-800">
                {UNREVIEWED_EXTRACTIONS_COUNT} unreviewed extractions
              </span>
              <span className="text-[12px] text-gold-700 ml-2">
                remaining from the parsed review. These will be auto-accepted if not reviewed.
              </span>
            </div>
            <Link href="/enterprise/sow/upload/parsed-review">
              <Button variant="outline" size="sm">
                Review Now
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Critical Gaps Section */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
            <AlertOctagon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2
              className="text-[15px] font-heading font-semibold"
              style={{ color: "var(--ink)" }}
            >
              Critical Gaps
            </h2>
            <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
              Must be resolved before proceeding. Blocks submission.
            </p>
          </div>
          {!allCriticalResolved && (
            <Badge variant="danger" size="sm" className="ml-auto">
              {unresolvedCritical} unresolved
            </Badge>
          )}
          {allCriticalResolved && (
            <Badge variant="forest" size="sm" className="ml-auto gap-1">
              <CheckCircle2 className="w-3 h-3" />
              All Resolved
            </Badge>
          )}
        </div>
        <div className="space-y-3">
          {criticalGaps.map(renderGapCard)}
        </div>
      </motion.div>

      {/* Important Gaps Section */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2
              className="text-[15px] font-heading font-semibold"
              style={{ color: "var(--ink)" }}
            >
              Important Gaps
            </h2>
            <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
              Acknowledge each to confirm awareness. Does not block proceeding.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          {importantGaps.map(renderGapCard)}
        </div>
      </motion.div>

      {/* Optional Gaps Section */}
      <motion.div variants={fadeUp} className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-beige-400 flex items-center justify-center">
            <Info className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2
              className="text-[15px] font-heading font-semibold"
              style={{ color: "var(--ink)" }}
            >
              Optional Gaps
            </h2>
            <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
              Nice-to-have improvements. Can be safely excluded.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto text-red-500 hover:text-red-600"
            onClick={dismissAllOptional}
          >
            <Ban className="w-3 h-3" />
            Exclude all optional
          </Button>
        </div>
        <div className="space-y-3">
          {optionalGaps.map(renderGapCard)}
        </div>
      </motion.div>

      {/* Bottom CTA */}
      <motion.div variants={fadeUp}>
        <div
          className="rounded-xl px-6 py-5 flex items-center justify-between"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-soft)",
            borderRadius: 12,
          }}
        >
          <div>
            {!allCriticalResolved ? (
              <>
                <p className="text-[13px] font-semibold text-red-700">
                  {unresolvedCritical} critical gap{unresolvedCritical !== 1 ? "s" : ""} must be resolved
                </p>
                <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  Generate remediation suggestions and mark them as resolved to proceed.
                </p>
              </>
            ) : (
              <>
                <p className="text-[13px] font-semibold text-forest-700">
                  All critical gaps resolved
                </p>
                <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
                  You may proceed to the next step.
                </p>
              </>
            )}
          </div>
          <Link
            href={allCriticalResolved ? "/enterprise/sow/upload/commercial-details" : "#"}
            className={cn(!allCriticalResolved && "pointer-events-none")}
          >
            <Button
              variant="gradient-primary"
              size="lg"
              disabled={!allCriticalResolved}
            >
              <Shield className="w-4 h-4" />
              Proceed to Commercial & Project Details
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}
