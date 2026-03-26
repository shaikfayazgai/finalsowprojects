"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, DollarSign, CheckCircle2, Zap, Target, Calendar,
  Upload, FileText, Download, ExternalLink, MessageSquare,
  Bot, User, ShieldCheck, AlertTriangle,
  Circle, Sparkles, Award, Send, Paperclip, Link2, Star,
  ArrowRight, RotateCcw, Timer, Check, X,
  GraduationCap, TrendingUp, Eye, Ban, Lightbulb, Package,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { mockContributorTasks, mockWorkroomData, mockSubmissions } from "@/mocks/data/contributor";
import type { ContributorTaskStatus } from "@/types/contributor";

/* ═══ Helpers ═══ */

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}>{children}</span>
  );
}

const statusCfg: Record<string, { label: string; color: string; bg: string }> = {
  available:   { label: "Available",   color: "var(--color-teal-700)",   bg: "var(--color-teal-50)" },
  assigned:    { label: "Assigned",    color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  in_progress: { label: "In Progress", color: "var(--color-brown-700)",  bg: "var(--color-brown-50)" },
  submitted:   { label: "Submitted",   color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  in_review:   { label: "In Review",   color: "var(--color-gold-700)",   bg: "var(--color-gold-50)" },
  accepted:    { label: "Completed",   color: "var(--color-forest-700)", bg: "var(--color-forest-50)" },
  rework:      { label: "Rework",      color: "var(--danger)",           bg: "var(--danger-light)" },
  rejected:    { label: "Rejected",    color: "var(--danger)",           bg: "var(--danger-light)" },
};
const prioCfg: Record<string, { label: string; color: string; bg: string }> = {
  low:      { label: "Low",      color: "var(--color-gray-600)",  bg: "var(--color-gray-100)" },
  medium:   { label: "Medium",   color: "var(--color-teal-700)",  bg: "var(--color-teal-50)" },
  high:     { label: "High",     color: "var(--color-gold-700)",  bg: "var(--color-gold-50)" },
  critical: { label: "Critical", color: "var(--danger)",          bg: "var(--danger-light)" },
};

function fmt$(n: number) { return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n); }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function fmtDateTime(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
function fmtSize(bytes: number) { if (bytes < 1024) return bytes + " B"; if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"; return (bytes / 1048576).toFixed(1) + " MB"; }
function daysUntil(iso: string) { return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000); }
function slaCountdown(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Overdue";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

/* Reusable section card */
function Section({ title, badge, action, children, className }: {
  title: string; badge?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("card-parchment", className)}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ═══ PAGE ═══ */

export default function ContributorTaskDetailPage() {
  const params = useParams();
  const taskId = params.taskId as string;
  const task = (mockContributorTasks.find((t) => t.id === taskId) ?? mockContributorTasks[0]) as any;
  const workroom = mockWorkroomData.taskId === task.id ? mockWorkroomData : null;
  const submissions = mockSubmissions.filter((s) => s.taskId === task.id);
  const latestSubmission = submissions.length > 0 ? submissions.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())[0] : null;

  const [taskStatus, setTaskStatus] = React.useState<ContributorTaskStatus>(task.status as ContributorTaskStatus);
  const [showAcceptDialog, setShowAcceptDialog] = React.useState(false);
  const [showDeclineDialog, setShowDeclineDialog] = React.useState(false);
  const [declineReason, setDeclineReason] = React.useState("");
  const [declineNotes, setDeclineNotes] = React.useState("");
  const [showSubmitDialog, setShowSubmitDialog] = React.useState(false);
  const [showUploadDialog, setShowUploadDialog] = React.useState(false);
  const [qaInput, setQaInput] = React.useState("");
  const [qaMessages, setQaMessages] = React.useState(workroom?.qaMessages || []);
  const [checklist, setChecklist] = React.useState(workroom?.evidenceChecklist || []);
  const [uploads, setUploads] = React.useState(workroom?.uploads || []);
  const [uploadFileName, setUploadFileName] = React.useState("");

  const sc = statusCfg[taskStatus] || statusCfg.available;
  const pc = prioCfg[task.priority] || prioCfg.medium;
  const slaDays = daysUntil(task.slaDeadline);
  const isOverdue = slaDays < 0;
  const isUrgent = slaDays >= 0 && slaDays <= 3;
  const completedChecklist = checklist.filter((e: any) => e.completed).length;
  const totalChecklist = checklist.length;

  function sendQA() {
    if (!qaInput.trim()) return;
    setQaMessages((prev: any[]) => [...prev, { id: `qa-user-${Date.now()}`, sender: "contributor", senderName: "You", message: qaInput.trim(), sentAt: new Date().toISOString() }]);
    setQaInput("");
    setTimeout(() => {
      setQaMessages((prev: any[]) => [...prev, { id: `qa-ai-${Date.now()}`, sender: "ai", senderName: "Contributor Support Assistant", message: "Thanks for your question! Based on the acceptance criteria, I'd recommend focusing on the evidence checklist items first — they map directly to the rubric reviewers will use.", sentAt: new Date().toISOString() }]);
    }, 500);
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER — shared across all states ═══ */}
      <motion.div variants={fadeUp} className="mb-5">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <Pill bg={sc.bg} color={sc.color}>{sc.label}</Pill>
          <Pill bg={pc.bg} color={pc.color}>{pc.label}</Pill>
          {task.milestoneTitle && <Pill bg="var(--color-gray-100)" color="var(--color-gray-600)">{task.milestoneTitle}</Pill>}
        </div>
        <h1 className="font-heading text-[22px] font-semibold text-gray-900 tracking-tight leading-tight mb-1.5">{task.title}</h1>
        <div className="flex items-center gap-2 flex-wrap text-[12px] text-gray-400">
          <span className="text-brown-500 font-medium">{task.projectTitle}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {fmtDate(task.dueDate)}</span>
        </div>
      </motion.div>

      {/* ═══ COMPACT META STRIP — key numbers at a glance ═══ */}
      <motion.div variants={fadeUp} className="card-parchment flex items-center divide-x divide-gray-100 mb-6">
        {[
          { label: "Effort", value: `${task.estimatedHours}h`, icon: Clock },
          { label: "Earn", value: fmt$(task.pricing.amount), icon: DollarSign },
          { label: "Match", value: `${task.matchScore}%`, icon: Target },
          { label: "SLA", value: slaCountdown(task.slaDeadline), icon: Timer },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-2.5 flex-1 px-5 py-3.5">
            <m.icon className={cn("w-4 h-4 shrink-0", m.label === "SLA" && isOverdue ? "text-red-400" : m.label === "SLA" && isUrgent ? "text-gold-400" : "text-gray-300")} />
            <div>
              <div className="text-[10px] text-gray-400 font-medium">{m.label}</div>
              <div className={cn("text-[14px] font-semibold text-gray-800 font-mono leading-none mt-0.5", m.label === "SLA" && isOverdue && "text-red-500", m.label === "Earn" && "text-forest-600")}>{m.value}</div>
            </div>
          </div>
        ))}
      </motion.div>


      {/* ╔═══════════════════════════════════════════════╗
         ║  AVAILABLE — Opportunity Preview               ║
         ╚═══════════════════════════════════════════════╝ */}
      {taskStatus === "available" && (
        <>
          {/* Description — full width */}
          <motion.div variants={fadeUp}>
            <Section title="Task Description">
              <div className="px-5 py-4">
                <p className="text-[13px] text-gray-600 leading-relaxed">{task.description}</p>
              </div>
            </Section>
          </motion.div>

          {/* Two columns: Skills + Match | Acceptance Criteria / Deliverables */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            {/* Match + Skills */}
            <Section title="Why This Matches You">
              <div className="px-5 py-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-gray-800 mb-0.5">{task.matchScore}% Skill Match</div>
                    <p className="text-[12px] text-gray-500 leading-relaxed">{task.matchReason ?? "Skills and availability match your profile."}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-3" style={{ borderTop: "1px solid var(--border-hair)" }}>
                  {task.skillsRequired.map((skill: string) => (
                    <span key={skill} className="text-[11px] font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">{skill}</span>
                  ))}
                </div>
              </div>
            </Section>

            {/* Acceptance Criteria / Deliverables or Task Details */}
            <Section title="Task Details">
              <div className="py-1">
                {[
                  { label: "Pricing Model", value: task.pricing.model.charAt(0).toUpperCase() + task.pricing.model.slice(1) },
                  { label: "Complexity", value: pc.label },
                  { label: "SLA Deadline", value: fmtDate(task.slaDeadline) },
                  { label: "Estimated Effort", value: `${task.estimatedHours} hours` },
                  { label: "Earnings on Acceptance", value: fmt$(task.pricing.amount) },
                ].map((item, i, arr) => (
                  <div key={item.label} className="flex items-center justify-between px-5 py-2.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                    <span className="text-[12px] text-gray-400">{item.label}</span>
                    <span className="text-[12px] font-medium text-gray-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* Accept CTA — full width, prominent */}
          <motion.div variants={fadeUp} className="card-parchment px-5 py-5 mt-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-gray-800">Ready to take on this task?</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Once accepted, you commit to delivering by {fmtDate(task.slaDeadline)}.</p>
              </div>
              <button onClick={() => setShowAcceptDialog(true)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl transition-all shrink-0"
                style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--color-brown-500) 25%, transparent)" }}>
                <CheckCircle2 className="w-4 h-4" /> Accept Task
              </button>
            </div>
          </motion.div>
        </>
      )}


      {/* ╔═══════════════════════════════════════════════╗
         ║  ASSIGNED — Get Ready                          ║
         ╚═══════════════════════════════════════════════╝ */}
      {taskStatus === "assigned" && (
        <>
          {/* Action banner */}
          <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-5">
            <div className="flex items-center gap-4 px-5 py-4" style={{ background: "linear-gradient(135deg, var(--color-gold-50), var(--color-brown-50))" }}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-800">Assigned to you on {fmtDate(task.assignedAt!)}</p>
                <p className="text-[11px] text-gray-500">Start working to open your workroom with instructions, resources, and Q&A.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => setShowDeclineDialog(true)} className="text-[12px] font-medium text-gray-400 px-4 py-2 rounded-xl border border-gray-200 hover:bg-white transition-all">Decline</button>
                <button onClick={() => setTaskStatus("in_progress")}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2.5 rounded-xl transition-all"
                  style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--color-brown-500) 25%, transparent)" }}>
                  <ArrowRight className="w-4 h-4" /> Start Working
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Section title="Task Description">
              <div className="px-5 py-4">
                <p className="text-[13px] text-gray-600 leading-relaxed">{task.description}</p>
              </div>
            </Section>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
            <Section title="Required Skills">
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {task.skillsRequired.map((skill: string) => (
                    <span key={skill} className="text-[11px] font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">{skill}</span>
                  ))}
                </div>
              </div>
            </Section>
            <Section title="Match Explanation">
              <div className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                  <p className="text-[12px] text-gray-500 leading-relaxed">{task.matchReason ?? "Skills and availability match your profile."}</p>
                </div>
              </div>
            </Section>
          </motion.div>
        </>
      )}


      {/* ╔═══════════════════════════════════════════════╗
         ║  IN PROGRESS — Two-column Workroom             ║
         ╚═══════════════════════════════════════════════╝ */}
      {taskStatus === "in_progress" && (
        <>
          {/* Progress bar */}
          <motion.div variants={fadeUp} className="card-parchment px-5 py-4 mb-5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">Progress</span>
                <span className="font-mono text-[12px] font-semibold text-brown-600">{task.progressPercent || 0}%</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-gray-400">
                <span><span className="font-semibold text-gray-600">{task.hoursLogged || 0}h</span> / {task.estimatedHours}h logged</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="flex items-center gap-1">
                  <Timer className={cn("w-3 h-3", isOverdue ? "text-red-500" : isUrgent ? "text-gold-500" : "text-gray-400")} />
                  <span className={cn("font-mono font-semibold", isOverdue ? "text-red-500" : isUrgent ? "text-gold-600" : "text-gray-600")}>{slaCountdown(task.slaDeadline)}</span>
                  left
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${task.progressPercent || 0}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                className={cn("h-full rounded-full", (task.progressPercent || 0) >= 100 ? "bg-forest-500" : "bg-gradient-to-r from-brown-400 to-brown-500")} />
            </div>
          </motion.div>

          {/* Two-column workroom — NO tabs, both visible */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-5">

            {/* LEFT (3/5): Instructions + Q&A */}
            <div className="lg:col-span-3 space-y-5">
              {/* Instructions */}
              <Section title="Instructions">
                <div className="px-5 py-4">
                  {workroom ? (
                    <div className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">{workroom.instructions}</div>
                  ) : (
                    <p className="text-[13px] text-gray-600 leading-relaxed">{task.description}</p>
                  )}
                </div>
                {/* Resources inline */}
                {workroom && (workroom.templates.length > 0 || workroom.links.length > 0) && (
                  <div style={{ borderTop: "1px solid var(--border-soft)" }}>
                    <div className="px-5 py-2.5"><span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Resources</span></div>
                    {workroom.templates.map((tmpl: any) => (
                      <div key={tmpl.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-black/[0.02] transition-colors"
                        style={{ borderTop: "1px solid var(--border-hair)" }}>
                        <div className="w-7 h-7 rounded-lg bg-brown-50 flex items-center justify-center shrink-0"><Download className="w-3 h-3 text-brown-400" /></div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-medium text-gray-700 block truncate">{tmpl.name}</span>
                          <span className="text-[10px] text-gray-400">{tmpl.description}</span>
                        </div>
                      </div>
                    ))}
                    {workroom.links.map((link: any) => (
                      <div key={link.url} className="flex items-center gap-3 px-5 py-2.5 hover:bg-black/[0.02] transition-colors"
                        style={{ borderTop: "1px solid var(--border-hair)" }}>
                        <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0"><ExternalLink className="w-3 h-3 text-teal-400" /></div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-medium text-gray-700 block truncate">{link.label}</span>
                          <span className="text-[10px] text-gray-400 truncate block">{link.url}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Q&A */}
              <Section title="Q&A" badge={qaMessages.length > 0 ? <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full font-medium">{qaMessages.length}</span> : undefined}>
                {qaMessages.length > 0 ? (
                  <div className="max-h-[360px] overflow-y-auto py-1">
                    {qaMessages.map((msg: any, i: number) => {
                      const isAI = msg.sender === "ai";
                      const isReviewer = msg.sender === "reviewer";
                      return (
                        <div key={msg.id} className="px-5 py-3" style={{ borderBottom: i < qaMessages.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                          <div className="flex items-start gap-3">
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                              isAI ? "bg-teal-50" : isReviewer ? "bg-gold-50" : "bg-brown-50")}>
                              {isAI ? <Bot className="w-3.5 h-3.5 text-teal-500" /> : isReviewer ? <ShieldCheck className="w-3.5 h-3.5 text-gold-500" /> : <User className="w-3.5 h-3.5 text-brown-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[11px] font-semibold text-gray-700">{msg.sender === "contributor" ? "You" : msg.senderName || msg.sender}</span>
                                {isAI && <span className="text-[9px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">AI</span>}
                                <span className="text-[10px] text-gray-400 ml-auto">{fmtDateTime(msg.sentAt)}</span>
                              </div>
                              <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center">
                    <MessageSquare className="w-5 h-5 text-gray-300 mx-auto mb-2" />
                    <p className="text-[12px] text-gray-400">Ask a question to get help from the AI assistant or project team.</p>
                  </div>
                )}
                <div className="px-5 py-3" style={{ borderTop: "1px solid var(--border-soft)" }}>
                  <div className="flex items-center gap-2">
                    <input type="text" placeholder="Ask a question..." value={qaInput} onChange={(e) => setQaInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") sendQA(); }}
                      className="flex-1 text-[12px] text-gray-700 placeholder:text-gray-400 bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" />
                    <button onClick={() => setShowUploadDialog(true)} className="p-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"><Paperclip className="w-3.5 h-3.5" /></button>
                    <button onClick={sendQA} className="p-2.5 rounded-xl bg-gradient-to-r from-brown-400 to-brown-600 text-white transition-all"><Send className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </Section>
            </div>

            {/* RIGHT (2/5): Files + Evidence + Submit */}
            <div className="lg:col-span-2 space-y-5">
              {/* Files */}
              <Section title="Files" badge={uploads.length > 0 ? <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full font-medium">{uploads.length}</span> : undefined}
                action={<button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-1 text-[11px] font-medium text-brown-500 hover:text-brown-600 transition-colors"><Upload className="w-3 h-3" /> Upload</button>}>
                {uploads.length > 0 ? (
                  <div>
                    {uploads.map((file: any, i: number) => (
                      <div key={file.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-black/[0.02] transition-colors"
                        style={{ borderBottom: i < uploads.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                        <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0"><FileText className="w-3 h-3 text-gray-400" /></div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-medium text-gray-700 block truncate">{file.fileName}</span>
                          <span className="text-[10px] text-gray-400">{fmtSize(file.fileSize ?? file.size ?? 0)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-6 text-center">
                    <button onClick={() => setShowUploadDialog(true)} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-1.5 hover:border-brown-300 hover:bg-brown-50/30 transition-all group">
                      <Upload className="w-4 h-4 text-gray-300 group-hover:text-brown-400 transition-colors" />
                      <span className="text-[11px] text-gray-400 group-hover:text-gray-600">Upload deliverables</span>
                    </button>
                  </div>
                )}
              </Section>

              {/* Evidence checklist */}
              {checklist.length > 0 && (
                <Section title="Evidence Checklist" badge={
                  <span className="text-[10px] font-medium text-gray-400">{completedChecklist}/{totalChecklist}</span>
                }>
                  <div className="py-1">
                    {checklist.map((item: any, i: number) => (
                      <div key={item.id} className="flex items-center gap-3 px-5 py-2.5 cursor-pointer hover:bg-black/[0.02] transition-colors"
                        style={{ borderBottom: i < checklist.length - 1 ? "1px solid var(--border-hair)" : undefined }}
                        onClick={() => setChecklist((prev: any[]) => prev.map((c: any) =>
                          c.id === item.id ? { ...c, completed: !c.completed, completedAt: !c.completed ? new Date().toISOString() : undefined } : c
                        ))}>
                        {item.completed ? <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" /> : <Circle className="w-4 h-4 text-gray-300 shrink-0" />}
                        <span className={cn("text-[12px] flex-1", item.completed ? "text-gray-400 line-through" : "text-gray-700")}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Submit CTA */}
              <div className="card-parchment px-5 py-5">
                <p className="text-[13px] font-semibold text-gray-800 mb-1">Ready to submit?</p>
                <p className="text-[11px] text-gray-400 mb-4">{totalChecklist > 0 ? `${completedChecklist}/${totalChecklist} evidence items complete` : "Ensure all deliverables are uploaded."}</p>
                <button onClick={() => setShowSubmitDialog(true)}
                  className="w-full flex items-center justify-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-6 py-2.5 rounded-xl transition-all"
                  style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--color-brown-500) 25%, transparent)" }}>
                  <Send className="w-4 h-4" /> Submit for Review
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}


      {/* ╔═══════════════════════════════════════════════╗
         ║  SUBMITTED / IN REVIEW — Waiting Room          ║
         ╚═══════════════════════════════════════════════╝ */}
      {(taskStatus === "submitted" || taskStatus === "in_review") && (
        <>
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* Left: Review pipeline */}
            <div className="lg:col-span-3">
              <Section title="Review Pipeline">
                <div className="px-5 py-5">
                  {[
                    { label: "Submitted", desc: task.submittedAt ? `Deliverables submitted on ${fmtDateTime(task.submittedAt)}` : "Deliverables submitted", icon: Send, done: true },
                    { label: "AI Review", desc: "Automated quality checks and compliance verification", icon: Bot, active: true },
                    { label: "Peer Review", desc: "Pending AI review completion", icon: User, active: false },
                    { label: "Mentor Review", desc: "Final human review and approval", icon: ShieldCheck, active: false },
                    { label: "Decision", desc: "Accept, rework, or feedback", icon: CheckCircle2, active: false },
                  ].map((step, i, arr) => (
                    <div key={step.label} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                          step.done ? "bg-forest-50" : step.active ? "bg-teal-50" : "bg-gray-50")}>
                          <step.icon className={cn("w-4 h-4", step.done ? "text-forest-500" : step.active ? "text-teal-500" : "text-gray-300")} />
                        </div>
                        {i < arr.length - 1 && <div className={cn("w-px flex-1 my-1", step.done ? "bg-forest-200" : "bg-gray-100")} />}
                      </div>
                      <div className={cn("pb-5", i === arr.length - 1 && "pb-0")}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn("text-[12px] font-semibold", step.done ? "text-gray-800" : step.active ? "text-gray-700" : "text-gray-400")}>{step.label}</span>
                          {step.active && <span className="text-[9px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full animate-pulse">Processing</span>}
                          {step.done && <Check className="w-3 h-3 text-forest-500" />}
                        </div>
                        <p className="text-[11px] text-gray-400">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            </div>

            {/* Right: Submission details */}
            <div className="lg:col-span-2 space-y-5">
              {latestSubmission && latestSubmission.files.length > 0 && (
                <Section title="Submitted Files">
                  <div>
                    {latestSubmission.files.map((f: any, i: number) => (
                      <div key={f.name} className="flex items-center gap-3 px-5 py-2.5"
                        style={{ borderBottom: i < latestSubmission.files.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                        <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="text-[12px] text-gray-700 flex-1 truncate">{f.name}</span>
                        <span className="text-[10px] text-gray-400">{fmtSize(f.size)}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
              {latestSubmission && latestSubmission.evidence.length > 0 && (
                <Section title="Evidence" badge={<span className="text-[10px] text-gray-400">{latestSubmission.evidence.filter((e: any) => e.verified).length}/{latestSubmission.evidence.length}</span>}>
                  <div className="py-1">
                    {latestSubmission.evidence.map((ev: any, i: number) => (
                      <div key={ev.label} className="flex items-center gap-3 px-5 py-2.5"
                        style={{ borderBottom: i < latestSubmission.evidence.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                        {ev.verified ? <CheckCircle2 className="w-3.5 h-3.5 text-forest-500 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
                        <span className="text-[11px] text-gray-600 flex-1">{ev.label}</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </motion.div>
        </>
      )}


      {/* ╔═══════════════════════════════════════════════╗
         ║  ACCEPTED — Achievement                        ║
         ╚═══════════════════════════════════════════════╝ */}
      {taskStatus === "accepted" && (
        <>
          {/* Celebration */}
          <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-5">
            <div className="flex items-center gap-5 px-6 py-6" style={{ background: "linear-gradient(135deg, var(--color-forest-50), var(--color-teal-50))" }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-400 to-forest-600 flex items-center justify-center shrink-0">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-[16px] font-heading font-semibold text-gray-900 mb-0.5">Task Accepted</h2>
                <p className="text-[12px] text-gray-500">Your delivery has been recorded on the Proof-of-Delivery Ledger.</p>
              </div>
              {task.reviewScore && (
                <div className="flex items-center gap-2 bg-white/80 px-4 py-2.5 rounded-xl shrink-0">
                  <Star className="w-4 h-4 text-gold-500" />
                  <span className="text-[15px] font-semibold text-gray-800">{task.reviewScore}</span>
                  <span className="text-[11px] text-gray-500">/ 5.0</span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Feedback */}
            {(task.reviewComment || (latestSubmission && typeof latestSubmission.reviewerFeedback === "string")) && (
              <Section title="Reviewer Feedback">
                <div className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-forest-50 flex items-center justify-center shrink-0 mt-0.5"><ShieldCheck className="w-3.5 h-3.5 text-forest-500" /></div>
                    <p className="text-[12px] text-gray-600 leading-relaxed">{task.reviewComment || latestSubmission?.reviewerFeedback}</p>
                  </div>
                </div>
              </Section>
            )}

            {/* Earnings */}
            <Section title="Earnings">
              <div className="py-1">
                {[
                  { label: "Task Value", value: fmt$(task.pricing.amount) },
                  { label: "Hours Logged", value: `${task.hoursLogged || task.estimatedHours}h` },
                  { label: "Accepted On", value: task.acceptedAt ? fmtDate(task.acceptedAt) : "—" },
                  { label: "Payment", value: "Paid" },
                ].map((item, i, arr) => (
                  <div key={item.label} className="flex items-center justify-between px-5 py-2.5"
                    style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                    <span className="text-[12px] text-gray-400">{item.label}</span>
                    <span className="text-[12px] font-medium text-gray-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* Skills + PoDL + Browse */}
          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5">
            <Section title="Skills Validated">
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {task.skillsRequired.map((skill: string) => (
                    <span key={skill} className="inline-flex items-center gap-1 text-[11px] font-medium text-forest-600 bg-forest-50 px-3 py-1.5 rounded-lg"><Check className="w-3 h-3" /> {skill}</span>
                  ))}
                </div>
              </div>
            </Section>

            <div className="card-parchment px-5 py-5 flex flex-col items-center justify-center text-center" style={{ background: "linear-gradient(135deg, var(--color-gold-50), var(--color-brown-50))" }}>
              <GraduationCap className="w-5 h-5 text-gold-500 mb-2" />
              <p className="text-[12px] font-semibold text-gray-800 mb-0.5">PoDL Credential Earned</p>
              <p className="text-[10px] text-gray-500">Recorded as a verified credential on the Proof-of-Delivery Ledger.</p>
            </div>

            <Link href="/contributor/tasks" className="card-parchment px-5 py-5 flex flex-col items-center justify-center text-center hover:bg-brown-50/30 transition-colors">
              <Sparkles className="w-5 h-5 text-brown-400 mb-2" />
              <p className="text-[12px] font-semibold text-gray-800 mb-0.5">Browse More Tasks</p>
              <p className="text-[10px] text-gray-500">Find your next opportunity.</p>
            </Link>
          </motion.div>
        </>
      )}


      {/* ╔═══════════════════════════════════════════════╗
         ║  REWORK — Improvement Opportunity              ║
         ╚═══════════════════════════════════════════════╝ */}
      {taskStatus === "rework" && (
        <>
          {/* Alert banner */}
          <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-5">
            <div className="flex items-center gap-4 px-5 py-4" style={{ background: "linear-gradient(135deg, var(--danger-light), var(--color-gold-50))" }}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shrink-0"><RotateCcw className="w-5 h-5 text-white" /></div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-gray-800">Changes Requested</p>
                <p className="text-[11px] text-gray-500">Revisions needed before acceptance.{task.reworkDeadline && <> Deadline: <span className="font-semibold text-gray-700">{fmtDate(task.reworkDeadline)}</span></>}</p>
              </div>
              <button onClick={() => setShowSubmitDialog(true)}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2.5 rounded-xl transition-all shrink-0">
                <Send className="w-4 h-4" /> Resubmit
              </button>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 space-y-5">
              {/* Reviewer feedback */}
              <Section title="Reviewer Feedback">
                <div className="px-5 py-4">
                  {task.reworkReason && (
                    <div className="flex items-start gap-3 p-3 rounded-xl mb-3" style={{ background: "var(--danger-light)" }}>
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[12px] text-red-700 leading-relaxed">{task.reworkReason}</p>
                    </div>
                  )}
                  {latestSubmission && typeof latestSubmission.reviewerFeedback === "string" && (
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-[12px] text-gray-600 leading-relaxed">{latestSubmission.reviewerFeedback}</p>
                    </div>
                  )}
                </div>
              </Section>

              {/* Evidence pass/fail */}
              {latestSubmission && latestSubmission.evidence.length > 0 && (
                <Section title="Evidence Status" badge={<span className="text-[10px] text-gray-400">{latestSubmission.evidence.filter((e: any) => e.verified).length}/{latestSubmission.evidence.length} passed</span>}>
                  <div className="py-1">
                    {latestSubmission.evidence.map((ev: any, i: number) => (
                      <div key={ev.label} className="flex items-center gap-3 px-5 py-2.5"
                        style={{ borderBottom: i < latestSubmission.evidence.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                        {ev.verified ? <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" /> : <X className="w-4 h-4 text-red-400 shrink-0" />}
                        <span className={cn("text-[12px] flex-1", !ev.verified && "text-red-600 font-medium")}>{ev.label}</span>
                        {!ev.verified && <span className="text-[9px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Needs Fix</span>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>

            <div className="lg:col-span-2 space-y-5">
              {/* Upload revised files */}
              <Section title="Upload Revised Files" action={
                <button onClick={() => setShowUploadDialog(true)} className="flex items-center gap-1 text-[11px] font-medium text-brown-500"><Upload className="w-3 h-3" /> Upload</button>
              }>
                <div className="px-5 py-6 text-center">
                  <button onClick={() => setShowUploadDialog(true)} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-1.5 hover:border-brown-300 hover:bg-brown-50/30 transition-all group">
                    <Upload className="w-4 h-4 text-gray-300 group-hover:text-brown-400 transition-colors" />
                    <span className="text-[11px] text-gray-400 group-hover:text-gray-600">Upload revised deliverables</span>
                  </button>
                </div>
              </Section>

              {/* Original description for reference */}
              <Section title="Original Task">
                <div className="px-5 py-4">
                  <p className="text-[12px] text-gray-500 leading-relaxed">{task.description}</p>
                </div>
              </Section>
            </div>
          </motion.div>
        </>
      )}


      {/* ╔═══════════════════════════════════════════════╗
         ║  REJECTED — Learning Moment                    ║
         ╚═══════════════════════════════════════════════╝ */}
      {taskStatus === "rejected" && (
        <>
          <motion.div variants={fadeUp} className="card-parchment overflow-hidden mb-5">
            <div className="flex items-center gap-5 px-6 py-6" style={{ background: "linear-gradient(135deg, var(--danger-light), var(--color-gray-50))" }}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shrink-0"><Ban className="w-7 h-7 text-white" /></div>
              <div>
                <h2 className="text-[16px] font-heading font-semibold text-gray-900 mb-0.5">Submission Not Accepted</h2>
                <p className="text-[12px] text-gray-500">This does not affect your standing. Use the feedback to grow.</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {latestSubmission && typeof latestSubmission.reviewerFeedback === "string" && (
              <Section title="Reviewer Feedback">
                <div className="px-5 py-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-gray-600 leading-relaxed">{latestSubmission.reviewerFeedback}</p>
                  </div>
                </div>
              </Section>
            )}

            <div className="card-parchment px-5 py-5" style={{ background: "linear-gradient(135deg, var(--color-teal-50), var(--color-beige-50))" }}>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-teal-500" />
                <span className="text-[12px] font-semibold text-gray-800">Growth Opportunity</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-3">Consider taking related tasks at a lower complexity to build confidence.</p>
              <div className="flex gap-2">
                <Link href="/contributor/learning">
                  <button className="flex items-center gap-1.5 text-[11px] font-medium text-teal-600 bg-white/60 hover:bg-white px-3 py-2 rounded-lg transition-all"><TrendingUp className="w-3 h-3" /> Learning</button>
                </Link>
                <Link href="/contributor/tasks">
                  <button className="flex items-center gap-1.5 text-[11px] font-medium text-brown-600 bg-white/60 hover:bg-white px-3 py-2 rounded-lg transition-all"><Sparkles className="w-3 h-3" /> Browse Tasks</button>
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}


      {/* ═══ DIALOGS ═══ */}

      {showAcceptDialog && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowAcceptDialog(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-white" /></div>
              <h3 className="text-[16px] font-heading font-semibold text-gray-900">Accept this task?</h3>
            </div>
            <p className="text-[13px] font-medium text-gray-800 mb-1">{task.title}</p>
            <p className="text-[12px] text-gray-400 mb-4">{task.estimatedHours}h · {fmt$(task.pricing.amount)} · Due {fmtDate(task.slaDeadline)}</p>
            <div className="bg-gold-50 rounded-xl px-4 py-3 mb-5">
              <p className="text-[12px] text-gold-700">By accepting, you commit to delivering by <span className="font-semibold">{fmtDate(task.slaDeadline)}</span>.</p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowAcceptDialog(false)} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={() => { setTaskStatus("assigned"); setShowAcceptDialog(false); }}
                className="text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">Confirm</button>
            </div>
          </motion.div>
        </div>
      )}

      {showDeclineDialog && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowDeclineDialog(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-heading font-semibold text-gray-900 mb-4">Decline Assignment</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Reason</label>
                <select value={declineReason} onChange={(e) => setDeclineReason(e.target.value)}
                  className="w-full text-[12px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brown-200 focus:border-brown-300 transition-all">
                  <option value="">Select a reason...</option>
                  <option value="schedule_conflict">Schedule conflict</option>
                  <option value="skills_mismatch">Skills mismatch</option>
                  <option value="scope_too_large">Scope too large</option>
                  <option value="personal_reasons">Personal reasons</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">Notes (optional)</label>
                <textarea value={declineNotes} onChange={(e) => setDeclineNotes(e.target.value)} placeholder="Any additional context..." rows={3}
                  className="w-full text-[12px] text-gray-700 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brown-200 focus:border-brown-300 transition-all resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => { setShowDeclineDialog(false); setDeclineReason(""); setDeclineNotes(""); }}
                className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={() => { setTaskStatus("available"); setShowDeclineDialog(false); setDeclineReason(""); setDeclineNotes(""); }}
                className="text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 px-5 py-2 rounded-xl transition-all">Decline</button>
            </div>
          </motion.div>
        </div>
      )}

      {showSubmitDialog && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowSubmitDialog(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center"><Send className="w-5 h-5 text-white" /></div>
              <h3 className="text-[16px] font-heading font-semibold text-gray-900">{taskStatus === "rework" ? "Resubmit?" : "Submit for Review?"}</h3>
            </div>
            <p className="text-[13px] font-medium text-gray-800 mb-1">{task.title}</p>
            <p className="text-[12px] text-gray-400 mb-4">{totalChecklist > 0 ? `${completedChecklist}/${totalChecklist} evidence items complete` : "All deliverables will be submitted."}</p>
            {totalChecklist > 0 && completedChecklist < totalChecklist && (
              <div className="bg-gold-50 rounded-xl px-4 py-3 mb-4">
                <div className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-gold-600 shrink-0" /><p className="text-[12px] text-gold-700">Incomplete evidence items may delay review.</p></div>
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowSubmitDialog(false)} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={() => { setTaskStatus("submitted"); setShowSubmitDialog(false); }}
                className="text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                {taskStatus === "rework" ? "Resubmit" : "Submit"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showUploadDialog && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center" onClick={() => setShowUploadDialog(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[16px] font-heading font-semibold text-gray-900 mb-4">Upload File</h3>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">File Name</label>
                <input type="text" placeholder="e.g. deliverable-v2.zip" value={uploadFileName} onChange={(e) => setUploadFileName(e.target.value)}
                  className="w-full text-[12px] text-gray-700 placeholder:text-gray-400 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brown-200 focus:border-brown-300 transition-all" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1 block">File</label>
                <input type="file" className="w-full text-[12px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 file:mr-3 file:text-[11px] file:font-medium file:bg-brown-50 file:text-brown-600 file:border-0 file:rounded-lg file:px-3 file:py-1 file:cursor-pointer" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => { setShowUploadDialog(false); setUploadFileName(""); }}
                className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={() => {
                const name = uploadFileName.trim() || `upload-${Date.now()}.zip`;
                setUploads((prev: any[]) => [...prev, { id: `upload-${Date.now()}`, fileName: name, fileSize: Math.floor(Math.random() * 500000) + 50000, fileType: "application/zip", uploadedAt: new Date().toISOString(), uploadedBy: "contrib-001", url: `/uploads/${name}`, category: "deliverable" as const }]);
                setShowUploadDialog(false); setUploadFileName("");
              }} className="text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">Upload</button>
            </div>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
}
