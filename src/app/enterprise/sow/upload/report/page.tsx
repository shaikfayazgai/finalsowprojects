"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2, LayoutList, Sparkles, ShieldCheck, AlertTriangle,
  Clock, Eye, RotateCcw, ArrowRight, Target, Users, Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { FlowStepProgress } from "@/components/enterprise/sow/FlowStepProgress";
import { KpiRow } from "@/components/enterprise/sow/KpiRow";
import { StatusBanner } from "@/components/enterprise/sow/StatusBanner";
import { SowBadge } from "@/components/enterprise/sow/SowBadge";
import { mockExtractionReport } from "@/mocks/data/sow-upload-flow";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";

/* ── Context detection row config ── */

const contextRows = [
  { key: "businessObjectives" as const, label: "Business Objectives", icon: Target, presentDesc: "Objectives with measurable targets found", partialDesc: "General goal statements found — no measurable targets", absentDesc: "No objective language found" },
  { key: "painPoints" as const, label: "Pain Points", icon: Lightbulb, presentDesc: "Specific problem statements with impact found", partialDesc: "General challenges mentioned — no specificity", absentDesc: "No problem context found" },
  { key: "userContext" as const, label: "User Context", icon: Users, presentDesc: "User roles with characteristics found", partialDesc: "Role names found — no characteristics", absentDesc: "No user information found" },
];

const detectionStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PRESENT: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500", label: "Present" },
  PARTIAL: { bg: "bg-gold-50", text: "text-gold-700", dot: "bg-gold-500", label: "Partial" },
  ABSENT: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", label: "Absent" },
};

const sensitiveStyles: Record<string, { variant: string; label: string }> = {
  none: { variant: "forest", label: "None Detected" },
  possible: { variant: "gold", label: "Possible" },
  explicit: { variant: "danger", label: "Detected" },
};

/* ═══ PAGE ═══ */

export default function ExtractionReportPage() {
  const router = useRouter();
  const store = useSOWUploadStore();
  const report = mockExtractionReport;

  const handleViewParsedSOW = () => {
    store.setFlowStep(3);
    router.push("/enterprise/sow/upload/review");
  };

  const handleUploadAnother = () => {
    store.reset();
    router.push("/enterprise/sow/upload");
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Flow step progress */}
      <motion.div variants={fadeUp} className="mb-6">
        <FlowStepProgress currentStep={2} />
      </motion.div>

      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Extraction Intelligence Report</h1>
            <p className="mt-1.5 text-[13px] text-gray-500">
              AI has successfully parsed {store.uploadedFile?.name || "your document"}.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-forest-700 bg-forest-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-3 h-3" /> PARSING COMPLETE
          </span>
        </div>
      </motion.div>

      {/* Context Detection Card */}
      <motion.div variants={fadeUp} className="card-parchment mb-6">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Context Detection</span>
        </div>
        <div>
          {contextRows.map((row, i) => {
            const status = report.contextDetection[row.key];
            const style = detectionStyles[status];
            const desc = status === "PRESENT" ? row.presentDesc : status === "PARTIAL" ? row.partialDesc : row.absentDesc;
            const Icon = row.icon;
            return (
              <div key={row.key} className="flex items-center gap-4 px-5 py-3.5"
                style={{ borderBottom: i < contextRows.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                <Icon className="w-4 h-4 text-brown-400 shrink-0" />
                <span className="text-[12px] font-medium text-gray-700 flex-1">{row.label}</span>
                <div className="text-right">
                  <SowBadge variant={style.text.includes("forest") ? "forest" : style.text.includes("gold") ? "gold" : "danger"} dot>
                    {style.label}
                  </SowBadge>
                  <p className="text-[10px] text-gray-400 mt-1 max-w-[240px]">{desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* KPI Row — NO budget or timeline (EIR-001, EIR-002) */}
      <motion.div variants={fadeUp} className="mb-6">
        <KpiRow items={[
          { label: "Sections Found", value: report.sectionsFound, icon: LayoutList, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "AI Confidence", value: `${report.aiConfidence}%`, icon: Sparkles, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          { label: "Gap Score", value: `${report.gapScore}%`, icon: ShieldCheck, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "Ambiguities", value: report.ambiguities, icon: AlertTriangle, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
        ]} />
      </motion.div>

      {/* Additional metrics row */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {/* Sensitive Data */}
        <div className="card-parchment px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="label-caps">Sensitive Data</span>
            <SowBadge variant={sensitiveStyles[report.sensitiveDataDetected].variant}>
              {sensitiveStyles[report.sensitiveDataDetected].label}
            </SowBadge>
          </div>
          {report.sensitiveDataTypes && report.sensitiveDataTypes.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {report.sensitiveDataTypes.map((t) => (
                <span key={t} className="text-[10px] text-gold-600 bg-gold-50 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Estimated Review Time */}
        <div className="card-parchment px-5 py-4">
          <div className="label-caps mb-2">Estimated Review Time</div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brown-400" />
            <span className="num-display text-[20px] text-gray-900">{report.estimatedReviewTime}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Time for you to review extractions and resolve gaps</p>
        </div>
      </motion.div>

      {/* Warning if gaps or ambiguities */}
      {(report.gapScore < 80 || report.ambiguities > 3) && (
        <motion.div variants={fadeUp} className="mb-6">
          <StatusBanner
            variant="warning"
            title="Review recommended before proceeding"
            description={`${report.ambiguities} ambiguities and ${100 - report.gapScore}% of standard sections are missing. These will be addressed in the Gap Analysis step.`}
          />
        </motion.div>
      )}

      {/* Actions */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <button onClick={handleUploadAnother}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all uppercase">
          <RotateCcw className="w-3 h-3" /> Upload Another
        </button>
        <button onClick={handleViewParsedSOW}
          className="flex items-center gap-2 text-[13px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl transition-all uppercase">
          View Parsed SOW <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </motion.div>
  );
}
