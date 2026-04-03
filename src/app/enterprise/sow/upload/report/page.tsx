"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2, RotateCcw, ArrowRight, Target, Users, Lightbulb,
  LayoutList, Sparkles, ShieldCheck, AlertTriangle,
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

      {/* Single card — all content */}
      <motion.div variants={fadeUp} className="card-parchment overflow-hidden">

        {/* KPI Row */}
        <div className="px-5 py-5 border-b border-gray-100">
          <KpiRow items={[
            { label: "Sections Found",  value: report.sectionsFound,        icon: LayoutList,    iconBg: "bg-gradient-to-br from-brown-400 to-brown-600"  },
            { label: "AI Confidence",   value: `${report.aiConfidence}%`,   icon: Sparkles,      iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
            { label: "Gap Score",       value: `${report.gapScore}%`,       icon: ShieldCheck,   iconBg: "bg-gradient-to-br from-teal-400 to-teal-600"    },
            { label: "Ambiguities",     value: report.ambiguities,          icon: AlertTriangle, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600"    },
          ]} />
        </div>

        {/* Context Detection + Sensitive Data */}
        <div className="grid grid-cols-2 divide-x divide-gray-100 border-b border-gray-100">

          {/* Left: Context Detection */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Context Detection</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {contextRows.map((row, i) => {
                const status = report.contextDetection[row.key];
                const style = detectionStyles[status];
                const Icon = row.icon;
                return (
                  <div key={row.key} className={cn("flex items-center gap-3 px-4 py-2.5 bg-white", i < contextRows.length - 1 && "border-b border-gray-100")}>
                    <Icon className="w-3.5 h-3.5 text-brown-400 shrink-0" />
                    <span className="text-[12px] font-medium text-gray-700 flex-1">{row.label}</span>
                    <SowBadge variant={style.text.includes("forest") ? "forest" : style.text.includes("gold") ? "gold" : "danger"} dot>
                      {style.label}
                    </SowBadge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Middle: Sensitive Data */}
          <div className="px-5 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Sensitive Data</p>
            <div className="rounded-xl border border-gray-100 bg-white px-4 py-5 h-[calc(100%-28px)]">
              <div className="flex items-center justify-between mb-3">
                <span className="label-caps">Detection</span>
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
          </div>

        </div>

        {/* Warning banner (conditional) */}
        {(report.gapScore < 80 || report.ambiguities > 3) && (
          <div className="px-5 py-4 border-b border-gray-100">
            <StatusBanner
              variant="warning"
              title="Review recommended before proceeding"
              description={`${report.ambiguities} ambiguities and ${100 - report.gapScore}% of standard sections are missing. These will be addressed in the Gap Analysis step.`}
            />
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 bg-gray-50/40">
          <button onClick={handleUploadAnother}
            className="text-[12px] font-semibold text-white bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600 px-4 py-2.5 rounded-xl transition-all uppercase">
            Wrong File? Re-upload
          </button>
          <button onClick={handleViewParsedSOW}
            className="flex items-center gap-2 text-[13px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl transition-all uppercase">
            View Parsed SOW <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
