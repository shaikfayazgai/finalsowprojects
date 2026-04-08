// @ts-nocheck
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, RotateCcw, AlertTriangle, ChevronDown,
  ChevronRight, Star, Download,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockReviewHistory, mockReviewer } from "@/mocks/data/enterprise-reviewer";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export default function ReviewHistoryPage() {
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState("all");

  const agreementRate = Math.round(
    (mockReviewHistory.filter(r => r.agreement).length / mockReviewHistory.length) * 100
  );

  const filters = [
    { value: "all", label: "All" },
    { value: "recommend_accept", label: "Recommended Accept" },
    { value: "recommend_rework", label: "Recommended Rework" },
    { value: "overridden", label: "Overridden" },
  ];

  const filtered = filter === "all"
    ? mockReviewHistory
    : filter === "overridden"
      ? mockReviewHistory.filter(r => !r.agreement)
      : mockReviewHistory.filter(r => r.recommendation === filter);

  const outcomeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    accepted: { label: "Accepted", color: "text-forest-600 bg-forest-50 border-forest-200", icon: <CheckCircle2 className="w-3 h-3" /> },
    rework_required: { label: "Rework Required", color: "text-gold-600 bg-gold-50 border-gold-200", icon: <RotateCcw className="w-3 h-3" /> },
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Review History</h1>
        <p className="text-[13px] text-gray-500 mt-1">All reviews submitted by you. Records are immutable.</p>
      </motion.div>

      {/* ═══ AGREEMENT RATE ═══ */}
      <motion.div variants={fadeUp} className="card-parchment px-5 py-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <p className="text-[12px] text-gray-500">Your recommendation agreement rate</p>
          <p className="text-[13px] font-medium text-gray-800 mt-0.5">
            Enterprise Admin agreed with your recommendation in{" "}
            <span className="font-bold text-teal-600">{mockReviewHistory.filter(r => r.agreement).length}</span> of your last{" "}
            <span className="font-bold">{mockReviewHistory.length}</span> reviews.
          </p>
        </div>
        <div className={cn("text-[28px] font-bold font-mono", agreementRate >= 85 ? "text-forest-600" : agreementRate >= 70 ? "text-gold-600" : "text-red-600")}>
          {agreementRate}%
        </div>
      </motion.div>

      {/* ═══ FILTERS ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center gap-1 overflow-x-auto" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          {filters.map((f) => (
            <button key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "px-4 py-3 text-[11px] font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
                filter === f.value
                  ? "border-teal-500 text-teal-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              )}>
              {f.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ═══ REVIEW LIST ═══ */}
      <motion.div variants={fadeUp} className="space-y-3">
        {filtered.map((review) => {
          const isExpanded = expanded === review.id;
          const outcome = outcomeConfig[review.enterpriseOutcome];

          return (
            <div key={review.id} className="card-parchment overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-black/[0.02] transition-colors"
                onClick={() => setExpanded(isExpanded ? null : review.id)}>

                {/* Recommendation badge */}
                <div className={cn("px-2.5 py-1 rounded-lg border text-[10px] font-bold shrink-0",
                  review.recommendation === "recommend_accept"
                    ? "bg-forest-50 text-forest-700 border-forest-200"
                    : "bg-gold-50 text-gold-700 border-gold-200"
                )}>
                  {review.recommendation === "recommend_accept" ? "✓ Accept" : "↩ Rework"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-gray-800">{review.taskTitle}</span>
                    {review.reworkRound > 1 && (
                      <span className="text-[9px] font-bold text-brown-600 bg-brown-50 border border-brown-200 px-2 py-0.5 rounded-full">
                        Round {review.reworkRound}
                      </span>
                    )}
                    {!review.agreement && (
                      <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Overridden
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                    <span>{review.projectName}</span>
                    <span>·</span>
                    <span>{formatDate(review.reviewedAt)}</span>
                  </div>
                </div>

                {/* Outcome */}
                {outcome && (
                  <div className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-semibold shrink-0", outcome.color)}>
                    {outcome.icon} {outcome.label}
                  </div>
                )}

                {isExpanded
                  ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
              </div>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ borderTop: "1px solid var(--border-hair)" }}>
                    <div className="px-5 py-5 space-y-4">

                      {/* Rubric Scores */}
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Rubric Scores</p>
                        <div className="space-y-2">
                          {review.rubricScores.map((score, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <span className="text-[11px] text-gray-600 w-24 shrink-0">Criterion {i + 1}</span>
                              <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} className={cn("w-3.5 h-3.5", s <= score ? "text-gold-400 fill-gold-400" : "text-gray-200")} />
                                ))}
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono">{score}/5</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Overall Assessment */}
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Overall Assessment</p>
                        <p className="text-[12px] text-gray-700 leading-relaxed">{review.overallAssessment}</p>
                      </div>

                      {/* Rework Items */}
                      {review.reworkItems && (
                        <div>
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Rework Items</p>
                          <ul className="space-y-1.5">
                            {review.reworkItems.map((item, i) => (
                              <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                                <span className="text-gold-500 shrink-0">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Override */}
                      {!review.agreement && review.overrideJustification && (
                        <div className="px-3 py-3 rounded-xl bg-red-50 border border-red-200">
                          <p className="text-[10px] font-semibold text-red-600 mb-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Enterprise Admin Override Justification
                          </p>
                          <p className="text-[12px] text-red-700">{review.overrideJustification}</p>
                        </div>
                      )}

                      {/* Download */}
                      <button className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all">
                        <Download className="w-3.5 h-3.5" /> Download Review Record PDF
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </motion.div>

    </motion.div>
  );
}