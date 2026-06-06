"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  LayoutList,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { KpiRow } from "@/components/enterprise/sow/KpiRow";
import { useSOWUploadStore } from "@/lib/stores/sow-upload-store";
import { useExtractionReport } from "@/lib/hooks/use-manual-sow";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */

interface ExtractedSection {
  id: string;
  title: string;
  confidence: number;
  status: "complete" | "partial" | "missing" | "ambiguous";
  gaps?: string[];
}

/* ═══════════════════════════════════════════════════════════
   STATUS CONFIG
   ═══════════════════════════════════════════════════════════ */

const STATUS = {
  complete:  { label: "COMPLETE",  dot: "bg-forest-500", text: "text-forest-600"  },
  partial:   { label: "PARTIAL",   dot: "bg-amber-400",  text: "text-amber-600"   },
  ambiguous: { label: "AMBIGUOUS", dot: "bg-orange-400", text: "text-orange-600"  },
  missing:   { label: "ABSENT",    dot: "bg-red-400",    text: "text-red-500"     },
} as const;

/* ── Map API response → ExtractedSection[] ── */
function mapApiReport(data: unknown): {
  documentName: string;
  overallConfidence: number;
  gapScore: number;
  ambiguities: number;
  estimatedReviewTime: string;
  sections: ExtractedSection[];
} {
  const empty = { documentName: "", overallConfidence: 0, gapScore: 0, ambiguities: 0, estimatedReviewTime: "—", sections: [] };
  if (!data || typeof data !== "object") return empty;

  const root = data as Record<string, any>;
  const payload = root.data ?? root;

  const normalizeStatus = (s: string): ExtractedSection["status"] => {
    const v = String(s ?? "").toLowerCase();
    if (v === "complete" || v === "completed") return "complete";
    if (v === "partial" || v === "partially_extracted") return "partial";
    if (v === "ambiguous" || v === "needs_review") return "ambiguous";
    return "missing";
  };

  const rawSections: any[] = Array.isArray(payload.sections)
    ? payload.sections
    : Array.isArray(payload.extracted_sections)
      ? payload.extracted_sections
      : [];

  const sections: ExtractedSection[] = rawSections.map((s: any, i: number) => ({
    id: String(s.id ?? s.section_id ?? i),
    title: String(s.title ?? s.section_title ?? s.name ?? `Section ${i + 1}`),
    confidence: Number(s.confidence ?? s.confidence_score ?? 0),
    status: normalizeStatus(s.status ?? s.extraction_status ?? "missing"),
    gaps: Array.isArray(s.gaps) ? s.gaps.map(String) : [],
  }));

  return {
    documentName: String(payload.document_name ?? payload.file_name ?? payload.title ?? ""),
    overallConfidence: Number(payload.overall_confidence ?? payload.confidence_score ?? 0),
    gapScore: Number(payload.gap_score ?? payload.gap_percentage ?? 0),
    ambiguities: Number(payload.ambiguities ?? payload.ambiguity_count ?? 0),
    estimatedReviewTime: String(payload.estimated_review_time ?? "—"),
    sections,
  };
}

/* ═══════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════ */

export default function ExtractionReportPage() {
  const router = useRouter();
  const sowId = useSOWUploadStore((s) => s.uploadedSowId);
  const { data: reportRes, isLoading, isError } = useExtractionReport(sowId);

  const report = React.useMemo(() => mapApiReport(reportRes), [reportRes]);
  const { sections, overallConfidence, gapScore, ambiguities, documentName } = report;

  const countComplete  = sections.filter((s) => s.status === "complete").length;
  const countReview    = sections.filter((s) => s.status === "partial" || s.status === "ambiguous").length;
  const countMissing   = sections.filter((s) => s.status === "missing").length;
  const totalGaps      = sections.reduce((acc, s) => acc + (s.gaps?.length ?? 0), 0);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ── Page header ── */}
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">
          Extraction Intelligence Report
        </h1>
        <p className="mt-1 text-[13px] text-gray-400">
          AI has successfully parsed{" "}
          {documentName && <span className="font-medium text-gray-600">"{documentName}"</span>}
        </p>
      </motion.div>

      {/* ── Loading state ── */}
      {isLoading && (
        <motion.div variants={fadeUp} className="card-parchment flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-brown-500" />
          <span className="ml-3 text-[13px] text-gray-500">Loading extraction report…</span>
        </motion.div>
      )}

      {/* ── Error state ── */}
      {isError && !isLoading && (
        <motion.div variants={fadeUp} className="rounded-xl bg-red-50 border border-red-200 px-5 py-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-[13px] text-red-700">Failed to load extraction report. Please try again.</p>
          </div>
        </motion.div>
      )}

      {/* ── Main card ── */}
      {!isLoading && (
        <motion.div variants={fadeUp} className="card-parchment overflow-hidden">

          {/* Card header */}
          <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">
                Analysis Summary
              </p>
              <p className="text-[13px] text-gray-600">
                {sections.length} sections detected — review before proceeding
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-forest-700 bg-forest-50 border border-forest-200 px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" /> Parsing Complete
            </span>
          </div>

          {/* KPI row */}
          <div className="px-8 py-5 border-b border-gray-100">
            <KpiRow items={[
              { label: "Sections Found",  value: sections.length,         icon: LayoutList,    iconBg: "bg-gradient-to-br from-brown-400 to-brown-600"  },
              { label: "AI Confidence",   value: `${overallConfidence}%`, icon: Sparkles,      iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
              { label: "Gap Score",       value: `${gapScore}%`,          icon: ShieldCheck,   iconBg: "bg-gradient-to-br from-teal-400 to-teal-600"    },
              { label: "Ambiguities",     value: ambiguities,             icon: AlertTriangle, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600"    },
            ]} />
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">

            {/* ── Left: Context Detection ── */}
            <div className="px-8 py-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                Context Detection
              </p>
              {sections.length === 0 ? (
                <p className="text-[13px] text-gray-400">No sections detected.</p>
              ) : (
                <div className="space-y-1">
                  {sections.map((section) => {
                    const s = STATUS[section.status];
                    return (
                      <div
                        key={section.id}
                        className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-[13px] font-semibold text-gray-700 uppercase tracking-wide">
                          {section.title}
                        </span>
                        <span className={cn("flex items-center gap-1.5 text-[11px] font-bold", s.text)}>
                          <span className={cn("w-2 h-2 rounded-full", s.dot)} />
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Right: Key Metrics ── */}
            <div className="px-8 py-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                Extraction Metrics
              </p>
              <div className="space-y-0 divide-y divide-gray-100">
                {[
                  { label: "Complete",        value: countComplete  },
                  { label: "Needs Review",    value: countReview    },
                  { label: "Missing",         value: countMissing   },
                  { label: "Identified Gaps", value: totalGaps      },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-3.5">
                    <span className="text-[13px] text-gray-500">{label}</span>
                    <span className="text-[17px] font-bold text-gray-900 num-display">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Footer buttons ── */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-gray-50/40">
            <button
              onClick={() => router.push("/enterprise/sow/upload")}
              className="flex items-center gap-2 text-[12px] font-bold text-gray-500 uppercase tracking-wider px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-white hover:border-gray-300 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Upload Another
            </button>
            <button
              onClick={() => router.push("/enterprise/sow/upload/review")}
              className="flex items-center gap-2 text-[13px] font-bold text-white uppercase tracking-wider bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl shadow-sm transition-all"
            >
              View Parsed SOW <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Back link ── */}
      <motion.div variants={fadeUp} className="mt-5">
        <button
          onClick={() => router.push("/enterprise/sow/upload")}
          className="flex items-center gap-1.5 text-[12px] font-medium text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Upload
        </button>
      </motion.div>

    </motion.div>
  );
}
