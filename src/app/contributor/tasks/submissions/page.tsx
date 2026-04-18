"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardCheck, Clock, FileText, ChevronRight, Eye,
  CheckCircle2, RotateCcw, AlertCircle, Hourglass, Send,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockSubmissions, mockContributorTasks } from "@/mocks/data/contributor";

/* ═══ Badge ═══ */

const badgeStyles: Record<string, { bg: string; text: string; dot: string }> = {
  forest: { bg: "bg-forest-50", text: "text-forest-700", dot: "bg-forest-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500" },
  gold: { bg: "bg-gold-50", text: "text-gold-700", dot: "bg-gold-500" },
  brown: { bg: "bg-brown-50", text: "text-brown-700", dot: "bg-brown-500" },
  beige: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  danger: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-500" },
};

function Badge({ variant, dot, children }: { variant: string; dot?: boolean; children: React.ReactNode }) {
  const s = badgeStyles[variant] || badgeStyles.beige;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[9px] font-medium tracking-wide uppercase px-2.5 py-0.5 rounded-full", s.bg, s.text)}>
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} />}
      {children}
    </span>
  );
}

/* ═══ Helpers ═══ */

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const statusConfig: Record<string, { variant: string; label: string; icon: React.ElementType; dotColor: string }> = {
  accepted: { variant: "forest", label: "Accepted", icon: CheckCircle2, dotColor: "bg-forest-500" },
  rework: { variant: "gold", label: "Rework", icon: RotateCcw, dotColor: "bg-gold-500" },
  rejected: { variant: "danger", label: "Rejected", icon: AlertCircle, dotColor: "bg-red-500" },
  pending: { variant: "teal", label: "Pending Review", icon: Hourglass, dotColor: "bg-teal-500" },
  draft: { variant: "beige", label: "Draft", icon: FileText, dotColor: "bg-gray-400" },
  submitted: { variant: "teal", label: "Submitted", icon: Send, dotColor: "bg-teal-500" },
  in_review: { variant: "gold", label: "In Review", icon: Eye, dotColor: "bg-gold-500" },
};

/* ═══ Task lookup ═══ */
const taskMap = new Map<string, any>(mockContributorTasks.map((t: any) => [t.id, t]));
function getTaskTitle(taskId: string) {
  return taskMap.get(taskId)?.title ?? taskId;
}
function getTaskProject(taskId: string) {
  return taskMap.get(taskId)?.projectTitle ?? "";
}

/* ═══ PAGE ═══ */

export default function SubmissionsPage() {
  const submissions = mockSubmissions;

  const statusCounts = submissions.reduce((acc: Record<string, number>, s: any) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight leading-tight">Submissions</h1>
        <p className="text-[13px] text-gray-400 mt-1">Track all your task submissions and review outcomes</p>
      </motion.div>

      {/* ═══ KPI ROW ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Submissions", value: submissions.length, icon: ClipboardCheck, iconBg: "bg-gradient-to-br from-brown-400 to-brown-600" },
          { label: "Accepted", value: statusCounts.accepted || 0, icon: CheckCircle2, iconBg: "bg-gradient-to-br from-forest-400 to-forest-600" },
          { label: "Pending Review", value: statusCounts.pending || 0, icon: Hourglass, iconBg: "bg-gradient-to-br from-teal-400 to-teal-600" },
          { label: "Rework", value: statusCounts.rework || 0, icon: RotateCcw, iconBg: "bg-gradient-to-br from-gold-400 to-gold-600" },
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
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ═══ SUBMISSIONS TABLE ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-8">
        {/* Table header */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">Submission History</span>
            <span className="text-[11px] text-gray-400">{submissions.length} submissions</span>
          </div>
        </div>

        {/* Column headers */}
        <div
          className="grid items-center px-5 py-2.5 text-[10px] font-medium text-gray-400 uppercase tracking-wider"
          style={{
            gridTemplateColumns: "1fr 70px 120px 120px 100px 40px",
            borderBottom: "1px solid var(--border-hair)",
          }}
        >
          <span>Task</span>
          <span className="text-center">Version</span>
          <span>Submitted</span>
          <span>Status</span>
          <span>Review</span>
          <span />
        </div>

        {/* Rows */}
        {submissions.length === 0 && (
          <div className="px-5 py-12 text-center">
            <ClipboardCheck className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-[13px] text-gray-500 mb-1">No submissions yet</p>
            <p className="text-[11px] text-gray-400">Submitted task deliverables will appear here.</p>
          </div>
        )}
        {submissions.map((sub: any, i: number) => {
          const status = statusConfig[sub.status] || statusConfig.pending;
          const StatusIcon = status.icon;
          const taskId = sub.taskId;

          return (
            <Link key={sub.id} href={`/contributor/tasks/${taskId}`}>
              <div
                className="grid items-center px-5 py-3.5 transition-colors hover:bg-black/[0.02] cursor-pointer"
                style={{
                  gridTemplateColumns: "1fr 70px 120px 120px 100px 40px",
                  borderBottom: i < submissions.length - 1 ? "1px solid var(--border-hair)" : undefined,
                }}
              >
                {/* Task title */}
                <div className="min-w-0 pr-3">
                  <span className="text-[13px] font-medium text-gray-800 truncate block">
                    {getTaskTitle(sub.taskId)}
                  </span>
                  <span className="text-[10px] text-gray-400">{getTaskProject(sub.taskId)}</span>
                </div>

                {/* Version */}
                <div className="text-center">
                  <span className="text-[12px] font-mono font-medium text-gray-700">v{sub.version}</span>
                </div>

                {/* Submitted date */}
                <div>
                  <span className="text-[12px] text-gray-700 block">{formatDate(sub.submittedAt)}</span>
                  <span className="text-[10px] text-gray-400">{formatTime(sub.submittedAt)}</span>
                </div>

                {/* Status */}
                <div>
                  <Badge variant={status.variant} dot>{status.label}</Badge>
                </div>

                {/* Review score */}
                <div>
                  {sub.reviewScore ? (
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "text-[13px] font-semibold",
                        sub.reviewScore >= 4 ? "text-forest-600" : sub.reviewScore >= 3 ? "text-gold-600" : "text-red-500"
                      )}>
                        {sub.reviewScore}
                      </span>
                      <span className="text-[10px] text-gray-400">/5</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-gray-400">--</span>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex justify-end">
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                </div>
              </div>
            </Link>
          );
        })}
      </motion.div>

      {/* ═══ EVIDENCE SUMMARY ═══ */}
      <motion.div variants={fadeUp} className="card-parchment mb-8">
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          <span className="text-sm font-semibold text-gray-800">Evidence Summary</span>
        </div>
        <div className="py-2">
          {submissions.length === 0 && (
            <div className="px-5 py-8 text-center"><p className="text-[12px] text-gray-400">No evidence to show</p></div>
          )}
          {submissions.map((sub: any, si: number) => {
            const verifiedCount = sub.evidence.filter((e: any) => e.verified).length;
            const totalCount = sub.evidence.length;
            const pct = totalCount ? Math.round((verifiedCount / totalCount) * 100) : 0;
            const status = statusConfig[sub.status] || statusConfig.pending;

            return (
              <div
                key={sub.id}
                className="px-5 py-3"
                style={{ borderBottom: si < submissions.length - 1 ? "1px solid var(--border-hair)" : undefined }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[12px] font-medium text-gray-700 truncate">{getTaskTitle(sub.taskId)}</span>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <span className="text-[10px] font-mono text-gray-500 shrink-0">{verifiedCount}/{totalCount} verified</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      pct === 100 ? "bg-forest-500" : pct >= 50 ? "bg-teal-400" : "bg-gold-400"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {sub.files.length > 0 && (
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {sub.files.map((file: any) => (
                      <span key={file.name} className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <FileText className="w-2.5 h-2.5" />{file.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

    </motion.div>
  );
}
