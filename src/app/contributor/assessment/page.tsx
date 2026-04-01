"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  FileCode2,
  BrainCircuit,
  Timer,
  Trophy,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCcw,
  ShieldCheck,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockAssessmentComposite, mockContributorProfile } from "@/mocks/data/contributor";

/* ═══ Status badge config ═══ */

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string; icon: React.ElementType }> = {
  completed: { label: "Completed", bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500", icon: CheckCircle2 },
  in_progress: { label: "In Progress", bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500", icon: Clock },
  not_started: { label: "Not Started", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", icon: Timer },
  expired: { label: "Expired", bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500", icon: AlertTriangle },
  borderline_review: { label: "Under Review", bg: "bg-gold-50", text: "text-gold-700", dot: "bg-gold-500", icon: Clock },
};

const componentIcons: Record<string, React.ElementType> = {
  mcq: ClipboardCheck,
  work_sample: FileCode2,
  adaptive: BrainCircuit,
};

const componentLinks: Record<string, string> = {
  mcq: "/contributor/assessment/mcq",
  work_sample: "/contributor/assessment/work-sample",
  adaptive: "/contributor/assessment/adaptive",
};

/* ═══ Helpers ═══ */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getTimeRemaining(expiresAt: string) {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}d ${hours}h remaining`;
}

/* ═══ PAGE ═══ */

export default function AssessmentOverviewPage() {
  const data = mockAssessmentComposite;
  const status = statusConfig[data.status] || statusConfig.not_started;
  const StatusIcon = status.icon;

  const compositeScore = data.compositeScore ?? 0;
  const allCompleted = data.components.every((c: { status: string }) => c.status === "completed");

  /* ═══ C5: 60% Profile Completeness Gate ═══ */
  if (mockContributorProfile.profileCompleteness < 60) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="bg-gold-50 border border-gold-200 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-gold-600" />
          </div>
          <h2 className="text-[20px] font-semibold text-gold-800 mb-2">Profile Incomplete</h2>
          <p className="text-[13px] text-gold-700 mb-6 max-w-md mx-auto">
            Your profile must be at least 60% complete with all mandatory fields before you can start the assessment. Current: {mockContributorProfile.profileCompleteness}%
          </p>
          <Link
            href="/contributor/profile/edit"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-white bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-2.5 rounded-xl hover:from-gold-600 hover:to-gold-700 transition-colors"
            aria-label="Complete your profile"
          >
            Complete Your Profile
          </Link>
        </div>
      </motion.div>
    );
  }

  /* ═══ M5: Retake Cooldown Enforcement ═══ */
  if (data.retakeEligibleAt && new Date(data.retakeEligibleAt).getTime() > Date.now()) {
    return (
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div className="bg-gold-50 border border-gold-200 rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-gold-100 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-gold-600" />
          </div>
          <h2 className="text-[20px] font-semibold text-gold-800 mb-2">Retake Not Available Yet</h2>
          <p className="text-[13px] text-gold-700 mb-3 max-w-md mx-auto">
            You can retake the assessment after {formatDate(data.retakeEligibleAt)}. There is a mandatory 14-day cooling period between attempts.
          </p>
          <p className="text-[12px] text-gold-600 mb-4">
            Maximum 3 attempts within any 6-month period.
          </p>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-gold-100 text-gold-700">
            <RefreshCcw className="w-3.5 h-3.5" />
            Attempt {data.attemptNumber} of 3
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-[-0.02em]">
          Skills Assessment
        </h1>
        <p className="text-[13px] text-gray-400 mt-1">
          Complete all three components within the 7-day window to confirm your designation
        </p>
      </motion.div>

      {/* ═══ STATUS BANNER ═══ */}
      <motion.div
        variants={fadeUp}
        className={cn(
          "rounded-2xl border p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4",
          data.status === "completed"
            ? "bg-forest-50/60 border-forest-200"
            : data.status === "expired"
            ? "bg-red-50/60 border-red-200"
            : "bg-teal-50/60 border-teal-200"
        )}
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", status.bg)}>
          <StatusIcon className={cn("w-5 h-5", status.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full", status.bg, status.text)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
              {status.label}
            </span>
            {data.attemptNumber > 1 && (
              <span className="text-[10px] text-gray-400">Attempt #{data.attemptNumber}</span>
            )}
          </div>
          <p className="text-[13px] text-gray-600">
            {data.status === "completed" && data.passed
              ? `Assessment completed on ${formatDate(data.completedAt!)}. Your designation has been confirmed.`
              : data.status === "completed" && !data.passed
              ? "Assessment completed but did not meet the passing threshold."
              : data.status === "in_progress" && data.expiresAt
              ? `Assessment in progress. ${getTimeRemaining(data.expiresAt)} to complete all components.`
              : data.status === "expired"
              ? "Your assessment window has expired. You may be eligible for a retake."
              : "Start your assessment to confirm your skills and designation."}
          </p>
        </div>
        {data.status === "in_progress" && data.expiresAt && (
          <div className="flex items-center gap-2 text-[12px] font-medium text-teal-700 shrink-0">
            <Timer className="w-4 h-4" />
            {getTimeRemaining(data.expiresAt)}
          </div>
        )}
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Composite Score", value: allCompleted ? `${compositeScore}%` : "--", icon: Trophy, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600", sub: allCompleted ? (data.passed ? "Passed" : "Not passed") : "Complete all tests" },
          { label: "Components Done", value: `${data.components.filter((c: { status: string }) => c.status === "completed").length}/${data.components.length}`, icon: CheckCircle2, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600", sub: `${data.components.filter((c: { status: string }) => c.status === "completed").length} of 3 completed` },
          { label: "Designation", value: data.designationConfirmed || "Pending", icon: Award, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600", sub: data.seniorityConfirmed ? `${data.seniorityConfirmed} level` : "Confirm via assessment" },
          { label: "Attempt", value: `#${data.attemptNumber}`, icon: RefreshCcw, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600", sub: data.retakeEligibleAt ? `Retake after ${formatDate(data.retakeEligibleAt)}` : "First attempt" },
        ].map((kpi) => {
          const KpiIcon = kpi.icon;
          return (
            <motion.div key={kpi.label} variants={scaleIn} className="card-parchment flex items-center gap-5 px-5 py-5">
              <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", kpi.iconBg)}>
                <KpiIcon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-400">{kpi.label}</div>
                <div className="num-display text-[28px] text-gray-900 leading-none mt-1">{kpi.value}</div>
                <div className="text-[10px] text-gray-400 mt-1">{kpi.sub}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ ASSESSMENT COMPONENTS ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <h2 className="text-lg font-semibold text-brown-900 mb-4">Assessment Components</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.components.map((comp: { id: string; type: string; title: string; description: string; status: string; weight: number; score?: number; startedAt?: string; completedAt?: string; totalQuestions?: number; answeredQuestions?: number; timeLimit?: number }) => {
            const CompIcon = componentIcons[comp.type] || ClipboardCheck;
            const cs = statusConfig[comp.status] || statusConfig.not_started;
            const link = componentLinks[comp.type];
            return (
              <motion.div key={comp.id} variants={scaleIn}>
                <Link href={link} aria-label={`Go to ${comp.title}`}>
                  <div className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6 hover:shadow-md transition-shadow group cursor-pointer h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", "bg-gradient-to-br",
                        comp.type === "mcq" ? "from-teal-400 to-teal-600" :
                        comp.type === "work_sample" ? "from-brown-400 to-brown-600" :
                        "from-gold-400 to-gold-600"
                      )}>
                        <CompIcon className="w-5 h-5 text-white" />
                      </div>
                      <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full", cs.bg, cs.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", cs.dot)} />
                        {cs.label}
                      </span>
                    </div>

                    <h3 className="text-[14px] font-semibold text-gray-800 mb-1">{comp.title}</h3>
                    <p className="text-[12px] text-gray-400 mb-4 flex-1">{comp.description}</p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-gray-400">Weight</span>
                        <span className="font-medium text-gray-700">{comp.weight}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all",
                            comp.status === "completed" ? "bg-forest-500" :
                            comp.status === "in_progress" ? "bg-teal-500" : "bg-gray-300"
                          )}
                          style={{ width: `${comp.status === "completed" ? 100 : comp.status === "in_progress" ? 50 : 0}%` }}
                        />
                      </div>
                      {comp.score !== undefined && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400">Score</span>
                          <span className="font-semibold text-forest-700">{comp.score}%</span>
                        </div>
                      )}
                      {comp.timeLimit && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-gray-400">Time Limit</span>
                          <span className="text-gray-600">{comp.timeLimit} min</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        {comp.status === "completed" && comp.completedAt
                          ? `Completed ${formatDate(comp.completedAt)}`
                          : comp.status === "in_progress"
                          ? "Continue"
                          : "Start"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ DESIGNATION CONFIRMATION (if passed) ═══ */}
      {data.passed && data.designationConfirmed && (
        <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-gray-800 mb-1">Designation Confirmed</h3>
              <p className="text-[13px] text-gray-600 mb-3">
                Based on your assessment results, your designation and seniority have been confirmed.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-forest-50 text-forest-700">
                  <Award className="w-3.5 h-3.5" />
                  {data.designationConfirmed}
                </span>
                {data.seniorityConfirmed && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-brown-50 text-brown-700">
                    {data.seniorityConfirmed.charAt(0).toUpperCase() + data.seniorityConfirmed.slice(1)} Level
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full bg-gold-50 text-gold-700">
                  <Trophy className="w-3.5 h-3.5" />
                  Score: {compositeScore}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ RETAKE INFO (if failed) ═══ */}
      {data.status === "completed" && !data.passed && (
        <motion.div variants={fadeUp} className="bg-white/80 backdrop-blur rounded-2xl border border-white/40 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shrink-0">
              <RefreshCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-gray-800 mb-1">Retake Available</h3>
              <p className="text-[13px] text-gray-600 mb-2">
                Your composite score of {compositeScore}% did not meet the passing threshold of 70%.
                {data.retakeEligibleAt
                  ? ` You can retake the assessment after ${formatDate(data.retakeEligibleAt)}.`
                  : " You can retake the assessment after a 14-day waiting period."}
              </p>
              <p className="text-[11px] text-gray-400">
                Each retake focuses on the components where improvement is needed.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ VIEW RESULTS LINK ═══ */}
      {allCompleted && (
        <motion.div variants={fadeUp} className="flex justify-end">
          <Link
            href="/contributor/assessment/results"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-teal-700 hover:text-teal-800 transition-colors"
            aria-label="View detailed assessment results"
          >
            View Detailed Results <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}
    </motion.div>
  );
}
