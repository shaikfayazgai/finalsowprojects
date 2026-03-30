"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Download,
  ClipboardCheck,
  FileCode2,
  BrainCircuit,
  ShieldCheck,
  RefreshCcw,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockAssessmentComposite } from "@/mocks/data/contributor";

/* ═══ Configs ═══ */

const componentIcons: Record<string, React.ElementType> = {
  mcq: ClipboardCheck,
  work_sample: FileCode2,
  adaptive: BrainCircuit,
};

const componentColors: Record<string, { gradient: string; bg: string; text: string }> = {
  mcq: { gradient: "from-teal-400 to-teal-600", bg: "bg-teal-50", text: "text-teal-700" },
  work_sample: { gradient: "from-brown-400 to-brown-600", bg: "bg-brown-50", text: "text-brown-700" },
  adaptive: { gradient: "from-gold-400 to-gold-600", bg: "bg-gold-50", text: "text-gold-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ═══ PAGE ═══ */

export default function AssessmentResultsPage() {
  const data = mockAssessmentComposite;
  const compositeScore = data.compositeScore ?? 0;
  const passed = data.passed ?? false;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <Link href="/contributor/assessment" className="inline-flex items-center gap-1 text-[12px] text-gray-400 hover:text-gray-600 mb-4" aria-label="Back to assessment overview">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessment
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
              Assessment Results
            </h1>
            <p className="text-[13px] text-gray-400 mt-1">
              {data.completedAt ? `Completed on ${formatDate(data.completedAt)}` : "Assessment in progress"}
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 text-[12px] font-medium text-teal-700 bg-teal-50 px-4 py-2 rounded-xl hover:bg-teal-100 transition-colors"
            aria-label="Download assessment results"
            onClick={() => {
              /* Mock download — in production this would trigger a PDF download */
              const el = document.createElement("a");
              el.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2)));
              el.setAttribute("download", "assessment-results.json");
              el.click();
            }}
          >
            <Download className="w-4 h-4" /> Download Results
          </button>
        </div>
      </motion.div>

      {/* ═══ COMPOSITE SCORE CARD ═══ */}
      <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-8 mb-6 text-center">
        <div className={cn(
          "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
          passed ? "bg-gradient-to-br from-forest-400 to-forest-600" : "bg-gradient-to-br from-red-400 to-red-600"
        )}>
          <Trophy className="w-10 h-10 text-white" />
        </div>

        <h2 className="text-[14px] font-medium text-gray-500 mb-1">Composite Score</h2>
        <div className="num-display text-[56px] text-gray-900 leading-none mb-2">{compositeScore}%</div>

        <div className={cn(
          "inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full mb-4",
          passed ? "bg-forest-50 text-forest-700" : "bg-red-50 text-red-600"
        )}>
          {passed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          {passed ? "Passed — Minimum 70% required" : "Not Passed — Minimum 70% required"}
        </div>

        {/* Score formula */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 mt-2 flex-wrap">
          {data.components.map((comp: { id: string; type: string; score?: number; weight: number }, i: number) => (
            <React.Fragment key={comp.id}>
              {i > 0 && <span>+</span>}
              <span className="font-medium text-gray-600">
                {comp.score ?? 0}% x {comp.weight}%
              </span>
            </React.Fragment>
          ))}
          <span>=</span>
          <span className="font-semibold text-gray-800">{compositeScore}%</span>
        </div>
      </motion.div>

      {/* ═══ COMPONENT SCORES ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <h2 className="text-lg font-semibold text-brown-900 mb-4">Score Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.components.map((comp: { id: string; type: string; title: string; score?: number; weight: number; status: string; totalQuestions?: number; answeredQuestions?: number; timeLimit?: number; completedAt?: string }) => {
            const CompIcon = componentIcons[comp.type] || ClipboardCheck;
            const colors = componentColors[comp.type] || componentColors.mcq;
            const compScore = comp.score ?? 0;
            const weightedContribution = Math.round((compScore * comp.weight) / 100);

            return (
              <motion.div key={comp.id} variants={scaleIn} className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0", colors.gradient)}>
                    <CompIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-semibold text-gray-800 truncate">{comp.title}</h3>
                    <span className="text-[10px] text-gray-400">Weight: {comp.weight}%</span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-center mb-4">
                  <div className="num-display text-[36px] text-gray-900 leading-none">{compScore}%</div>
                  <div className="text-[11px] text-gray-400 mt-1">
                    Contributes {weightedContribution}% to composite
                  </div>
                </div>

                {/* Weight visualization bar */}
                <div className="relative w-full h-3 rounded-full bg-gray-100 overflow-hidden mb-3">
                  <div
                    className={cn("h-full rounded-full transition-all", compScore >= 70 ? "bg-forest-500" : "bg-red-400")}
                    style={{ width: `${compScore}%` }}
                  />
                  {/* Passing threshold marker */}
                  <div className="absolute top-0 bottom-0 w-0.5 bg-gray-400" style={{ left: "70%" }} />
                </div>

                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>0%</span>
                  <span className="text-gray-500 font-medium">70% pass</span>
                  <span>100%</span>
                </div>

                {/* Details */}
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                  {comp.totalQuestions !== undefined && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Questions</span>
                      <span className="text-gray-600">{comp.answeredQuestions}/{comp.totalQuestions}</span>
                    </div>
                  )}
                  {comp.timeLimit && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Time Limit</span>
                      <span className="text-gray-600">{comp.timeLimit} min</span>
                    </div>
                  )}
                  {comp.completedAt && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-gray-400">Completed</span>
                      <span className="text-gray-600">{formatDate(comp.completedAt)}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ DESIGNATION CONFIRMATION ═══ */}
      {passed && data.designationConfirmed && (
        <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-gray-800 mb-1">Designation & Seniority Confirmed</h3>
              <p className="text-[13px] text-gray-500 mb-4">
                Your skills assessment has confirmed your professional designation. You are now eligible for matching tasks.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-forest-50/50">
                  <Award className="w-4 h-4 text-forest-600" />
                  <div>
                    <div className="text-[10px] text-gray-400">Designation</div>
                    <div className="text-[13px] font-semibold text-forest-700">{data.designationConfirmed}</div>
                  </div>
                </div>
                {data.seniorityConfirmed && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-brown-50/50">
                    <TrendingUp className="w-4 h-4 text-brown-600" />
                    <div>
                      <div className="text-[10px] text-gray-400">Seniority</div>
                      <div className="text-[13px] font-semibold text-brown-700">
                        {data.seniorityConfirmed.charAt(0).toUpperCase() + data.seniorityConfirmed.slice(1)}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gold-50/50">
                  <Trophy className="w-4 h-4 text-gold-600" />
                  <div>
                    <div className="text-[10px] text-gray-400">Composite Score</div>
                    <div className="text-[13px] font-semibold text-gold-700">{compositeScore}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ RETAKE INFO (if failed) ═══ */}
      {!passed && (
        <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shrink-0">
              <RefreshCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-gray-800 mb-1">Retake Eligibility</h3>
              <p className="text-[13px] text-gray-500 mb-2">
                Your composite score of {compositeScore}% did not meet the 70% passing threshold.
              </p>
              <ul className="text-[12px] text-gray-500 space-y-1.5 list-disc ml-4">
                <li>
                  {data.retakeEligibleAt
                    ? `You can retake the assessment after ${formatDate(data.retakeEligibleAt)}.`
                    : "You can retake the assessment after a 14-day waiting period."}
                </li>
                <li>Retakes focus on components where improvement is needed.</li>
                <li>Your highest composite score across attempts will be used.</li>
                <li>A maximum of 3 attempts is allowed within a 6-month period.</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ ATTEMPT INFO ═══ */}
      <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-brown-900 mb-4">Assessment Details</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Attempt", value: `#${data.attemptNumber}` },
            { label: "Started", value: data.startedAt ? formatDate(data.startedAt) : "--" },
            { label: "Completed", value: data.completedAt ? formatDate(data.completedAt) : "--" },
            { label: "Window Expired", value: data.expiresAt ? formatDate(data.expiresAt) : "--" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="text-[10px] text-gray-400 mb-1">{item.label}</div>
              <div className="text-[14px] font-semibold text-gray-700">{item.value}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
