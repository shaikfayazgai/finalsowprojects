"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, CheckCircle2, FileText, Download, ExternalLink,
  AlertTriangle, Star, Send, RotateCcw, Ban, Timer,
  Circle, User, Calendar, Target, Link2, Paperclip,
  ChevronDown, Eye, MessageSquare, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { Input, Textarea } from "@/components/ui";
import { toast } from "@/lib/stores/toast-store";

/* ═══ Helpers ═══ */

function Pill({ bg, color, children }: { bg: string; color: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: bg, color }}>{children}</span>
  );
}

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

function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
function fmtDateTime(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
function fmtSize(bytes: number) { if (bytes < 1024) return bytes + " B"; if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"; return (bytes / 1048576).toFixed(1) + " MB"; }

function slaCountdown(iso: string) {
  const diff = new Date(iso).getTime() - new Date("2026-03-25T12:00:00Z").getTime();
  if (diff <= 0) return "Overdue";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

function slaState(iso: string): "overdue" | "urgent" | "normal" {
  const diff = new Date(iso).getTime() - new Date("2026-03-25T12:00:00Z").getTime();
  const hours = Math.floor(diff / 3600000);
  if (diff < 0) return "overdue";
  if (hours <= 24) return "urgent";
  return "normal";
}

/* ═══ Mock Data ═══ */

const mockReviewItem = {
  id: "rev-001",
  taskTitle: "Build accessible DataTable component with sorting & pagination",
  taskDescription: "Create a fully accessible, reusable DataTable component with column sorting, pagination, row selection, and CSV export. Must support server-side and client-side data modes. WCAG 2.1 AA compliance required for all interactive elements.",
  contributorId: "Contributor A-7K",
  projectTitle: "Enterprise Resource Planning Platform",
  submittedAt: "2026-03-23T09:00:00Z",
  slaDeadline: "2026-03-26T09:00:00Z",
  status: "pending",
  urgency: "urgent",
  reviewType: "initial",
  submissionVersion: 1,
  skillsInvolved: ["React", "TypeScript", "Accessibility", "Tailwind CSS"],
  estimatedHours: 40,
  pricing: 1200,
};

const mockArtifacts = [
  { id: "f1", name: "datatable-component.zip", type: "zip", size: 2456000, uploadedAt: "2026-03-23T08:45:00Z" },
  { id: "f2", name: "storybook-screenshots.pdf", type: "pdf", size: 4120000, uploadedAt: "2026-03-23T08:50:00Z" },
  { id: "f3", name: "accessibility-audit.pdf", type: "pdf", size: 890000, uploadedAt: "2026-03-23T08:55:00Z" },
];

const mockLinks = [
  { id: "l1", title: "Storybook Preview", url: "https://storybook.example.com/datatable", type: "preview" },
  { id: "l2", title: "GitHub Branch", url: "https://github.com/example/erp/tree/feat/datatable", type: "repository" },
];

const mockStructuredResponses = [
  { question: "How did you approach the accessibility requirements?", answer: "Implemented full keyboard navigation (Tab, Arrow keys, Enter, Space), ARIA attributes for all interactive elements (role='grid', aria-sort, aria-selected), and screen reader announcements for sort/page changes. Tested with VoiceOver and NVDA." },
  { question: "Describe your approach to server-side data mode", answer: "Created a generic DataProvider interface that accepts async fetch functions with sort/page/filter params. The component handles loading states, error boundaries, and optimistic page transitions. Debounced search with 300ms delay." },
  { question: "What testing was performed?", answer: "75 unit tests (Jest + RTL) covering sorting, pagination, selection, and keyboard nav. 12 integration tests for server-side mode. Axe-core accessibility checks pass with 0 violations. Manual testing across Chrome, Firefox, Safari." },
];

const mockChecklist = [
  { id: "ec1", label: "Component renders with sample data", completed: true },
  { id: "ec2", label: "Column sorting works (asc/desc/none)", completed: true },
  { id: "ec3", label: "Pagination with configurable page sizes", completed: true },
  { id: "ec4", label: "Row selection (single + multi)", completed: true },
  { id: "ec5", label: "CSV export generates valid file", completed: true },
  { id: "ec6", label: "Keyboard navigation (WCAG 2.1 AA)", completed: true },
  { id: "ec7", label: "Server-side data mode with loading states", completed: true },
  { id: "ec8", label: "Responsive layout (mobile-friendly)", completed: false },
];

const rubricCriteria = [
  { id: "r1", label: "Code Quality", description: "Clean, well-structured, maintainable code with proper TypeScript types" },
  { id: "r2", label: "Completeness", description: "All acceptance criteria and evidence checklist items addressed" },
  { id: "r3", label: "Requirements Adherence", description: "Deliverable matches the task specification and acceptance criteria" },
  { id: "r4", label: "Testing & Documentation", description: "Adequate test coverage and clear documentation/comments" },
  { id: "r5", label: "Accessibility & UX", description: "WCAG compliance, usability, and user experience quality" },
];

/* ═══ PAGE ═══ */

export default function ReviewDetailPage() {
  const params = useParams();
  const reviewId = params.reviewId as string;
  const item = mockReviewItem;

  const [scores, setScores] = React.useState<Record<string, number>>({});
  const [feedback, setFeedback] = React.useState("");
  const [internalNotes, setInternalNotes] = React.useState("");
  const [decision, setDecision] = React.useState<string | null>(null);
  const [reworkDetails, setReworkDetails] = React.useState("");
  const [rejectReason, setRejectReason] = React.useState("");
  const [showDecisionConfirm, setShowDecisionConfirm] = React.useState(false);

  const sla = slaState(item.slaDeadline);
  const completedChecklist = mockChecklist.filter((e) => e.completed).length;
  const totalChecklist = mockChecklist.length;
  const allScored = rubricCriteria.every((c) => scores[c.id] !== undefined);
  const avgScore = allScored ? (Object.values(scores).reduce((a, b) => a + b, 0) / rubricCriteria.length).toFixed(1) : null;

  function handleDecision(d: string) {
    setDecision(d);
    setShowDecisionConfirm(true);
  }

  function confirmDecision() {
    if (!allScored || !feedback.trim()) {
      toast.warning("Complete all rubric scores and feedback before submitting");
      return;
    }
    if (decision === "rework" && !reworkDetails.trim()) {
      toast.warning("Provide specific rework instructions");
      return;
    }
    if (decision === "reject" && !rejectReason.trim()) {
      toast.warning("Provide a reason for rejection");
      return;
    }
    const labels: Record<string, string> = { accept: "Accepted", rework: "Rework Requested", reject: "Rejected" };
    toast.success(`Review submitted — ${labels[decision!]}`, `${item.contributorId} has been notified`);
    setShowDecisionConfirm(false);
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-5">
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          <Pill bg="var(--color-teal-50)" color="var(--color-teal-700)">Pending Review</Pill>
          <Pill bg={item.urgency === "urgent" ? "var(--danger-light)" : "var(--color-gold-50)"} color={item.urgency === "urgent" ? "var(--danger)" : "var(--color-gold-700)"}>{item.urgency === "urgent" ? "Urgent" : "High"}</Pill>
          <Pill bg="var(--color-gray-100)" color="var(--color-gray-600)">v{item.submissionVersion} · {item.reviewType === "initial" ? "Initial Review" : item.reviewType === "rework" ? "Rework Review" : "Final Review"}</Pill>
        </div>
        <h1 className="font-heading text-[22px] font-semibold text-gray-900 tracking-tight leading-tight mb-1.5">{item.taskTitle}</h1>
        <div className="flex items-center gap-2 flex-wrap text-[12px] text-gray-400">
          <span className="text-brown-500 font-medium">{item.projectTitle}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {item.contributorId}</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Submitted {fmtDate(item.submittedAt)}</span>
        </div>
      </motion.div>

      {/* ═══ META STRIP ═══ */}
      <motion.div variants={fadeUp} className="card-parchment flex items-center divide-x divide-gray-100 mb-6">
        {[
          { label: "Effort", value: `${item.estimatedHours}h`, icon: Clock },
          { label: "Value", value: `$${item.pricing.toLocaleString()}`, icon: Target },
          { label: "Evidence", value: `${completedChecklist}/${totalChecklist}`, icon: CheckCircle2 },
          { label: "SLA Left", value: slaCountdown(item.slaDeadline), icon: Timer },
        ].map((m) => (
          <div key={m.label} className="flex items-center gap-2.5 flex-1 px-5 py-3.5">
            <m.icon className={cn("w-4 h-4 shrink-0", m.label === "SLA Left" && sla === "overdue" ? "text-red-400" : m.label === "SLA Left" && sla === "urgent" ? "text-gold-400" : "text-gray-300")} />
            <div>
              <div className="text-[10px] text-gray-400 font-medium">{m.label}</div>
              <div className={cn("text-[14px] font-semibold text-gray-800 font-mono leading-none mt-0.5", m.label === "SLA Left" && sla === "overdue" && "text-red-500")}>{m.value}</div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* ═══ TWO-COLUMN LAYOUT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* LEFT — Submission Content (3/5) */}
        <div className="lg:col-span-3 space-y-5">

          {/* Task Description */}
          <motion.div variants={fadeUp}>
            <Section title="Task Description">
              <div className="px-5 py-4">
                <p className="text-[13px] text-gray-600 leading-relaxed">{item.taskDescription}</p>
                <div className="flex flex-wrap gap-2 pt-3 mt-3" style={{ borderTop: "1px solid var(--border-hair)" }}>
                  {item.skillsInvolved.map((s) => (
                    <span key={s} className="text-[11px] font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">{s}</span>
                  ))}
                </div>
              </div>
            </Section>
          </motion.div>

          {/* Submitted Files */}
          <motion.div variants={fadeUp}>
            <Section title="Submitted Artifacts" badge={<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--color-brown-50)", color: "var(--color-brown-600)" }}>{mockArtifacts.length} files</span>}>
              <div className="py-1">
                {mockArtifacts.map((f, i) => (
                  <div key={f.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < mockArtifacts.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                    <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-700 truncate">{f.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{fmtSize(f.size)} · Uploaded {fmtDateTime(f.uploadedAt)}</div>
                    </div>
                    <a href={`/api/files/${f.id}/${f.name}`} download={f.name} onClick={(e) => { e.preventDefault(); toast.info("Download started", f.name); }} className="flex items-center gap-1 text-[11px] font-medium text-brown-500 hover:text-brown-600 transition-colors">
                      <Download className="w-3 h-3" /> Download
                    </a>
                  </div>
                ))}
                {/* Links */}
                {mockLinks.map((l) => (
                  <div key={l.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                    <Link2 className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium text-gray-700">{l.title}</div>
                      <div className="text-[10px] text-teal-500 truncate">{l.url}</div>
                    </div>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] font-medium text-teal-500 hover:text-teal-600 transition-colors">
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* Structured Responses */}
          <motion.div variants={fadeUp}>
            <Section title="Structured Responses" badge={<span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--color-brown-50)", color: "var(--color-brown-600)" }}>{mockStructuredResponses.length}</span>}>
              <div className="py-1">
                {mockStructuredResponses.map((r, i) => (
                  <div key={i} className="px-5 py-4" style={{ borderBottom: i < mockStructuredResponses.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                    <div className="flex items-start gap-2 mb-2">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-[12px] font-semibold text-gray-700">{r.question}</p>
                    </div>
                    <p className="text-[12px] text-gray-500 leading-relaxed pl-5.5">{r.answer}</p>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* Evidence Checklist */}
          <motion.div variants={fadeUp}>
            <Section title="Evidence Checklist" badge={
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                background: completedChecklist === totalChecklist ? "var(--color-forest-50)" : "var(--color-gold-50)",
                color: completedChecklist === totalChecklist ? "var(--color-forest-700)" : "var(--color-gold-700)",
              }}>{completedChecklist}/{totalChecklist}</span>
            }>
              <div className="py-1">
                {mockChecklist.map((item, i) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < mockChecklist.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                    {item.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-forest-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                    )}
                    <span className={cn("text-[13px]", item.completed ? "text-gray-700" : "text-gray-400")}>{item.label}</span>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>
        </div>

        {/* RIGHT — Review Panel (2/5) */}
        <div className="lg:col-span-2 space-y-5">

          {/* Rubric Scoring */}
          <motion.div variants={fadeUp}>
            <Section title="Review Rubric" badge={avgScore ? (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                background: Number(avgScore) >= 4 ? "var(--color-forest-50)" : Number(avgScore) >= 3 ? "var(--color-gold-50)" : "var(--danger-light)",
                color: Number(avgScore) >= 4 ? "var(--color-forest-700)" : Number(avgScore) >= 3 ? "var(--color-gold-700)" : "var(--danger)",
              }}>Avg: {avgScore}/5</span>
            ) : undefined}>
              <div className="py-1">
                {rubricCriteria.map((criteria, i) => (
                  <div key={criteria.id} className="px-5 py-3.5" style={{ borderBottom: i < rubricCriteria.length - 1 ? "1px solid var(--border-hair)" : undefined }}>
                    <div className="text-[12px] font-semibold text-gray-700 mb-0.5">{criteria.label}</div>
                    <div className="text-[10px] text-gray-400 mb-2.5">{criteria.description}</div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => {
                        const selected = scores[criteria.id] === n;
                        const rated = scores[criteria.id] !== undefined;
                        return (
                          <button key={n} onClick={() => setScores((prev) => ({ ...prev, [criteria.id]: n }))}
                            className={cn(
                              "w-8 h-8 rounded-lg text-[12px] font-semibold transition-all",
                              selected
                                ? n >= 4 ? "bg-forest-50 text-forest-700 ring-2 ring-forest-200" : n >= 3 ? "bg-gold-50 text-gold-700 ring-2 ring-gold-200" : "bg-red-50 text-red-600 ring-2 ring-red-200"
                                : rated ? "bg-gray-50 text-gray-400 hover:bg-gray-100" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                            )}>
                            {n}
                          </button>
                        );
                      })}
                      {scores[criteria.id] && (
                        <span className="text-[10px] text-gray-400 ml-1">
                          {scores[criteria.id]! >= 4 ? "Good" : scores[criteria.id]! >= 3 ? "Adequate" : "Needs work"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* Feedback */}
          <motion.div variants={fadeUp}>
            <Section title="Reviewer Feedback">
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-600">Feedback to Contributor *</label>
                  <Textarea value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Provide constructive feedback on the submission quality, strengths, and areas for improvement..." className="min-h-[120px]" />
                  <div className="text-[10px] text-gray-400 text-right mt-1">{feedback.length} characters</div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[12px] font-semibold text-gray-600">Internal Notes (not visible to contributor)</label>
                  <Textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Private notes for the review team..." className="min-h-[80px]" />
                </div>
              </div>
            </Section>
          </motion.div>

          {/* Decision */}
          <motion.div variants={fadeUp}>
            <Section title="Decision">
              <div className="px-5 py-5 space-y-3">
                {!allScored || !feedback.trim() ? (
                  <p className="text-[11px] text-gray-400 text-center py-2">Score all rubric criteria and provide feedback to unlock decisions</p>
                ) : (
                  <>
                    <button onClick={() => handleDecision("accept")}
                      className="w-full flex items-center justify-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2.5 rounded-xl transition-all"
                      style={{ boxShadow: "0 2px 8px color-mix(in srgb, var(--color-brown-500) 25%, transparent)" }}>
                      <CheckCircle2 className="w-4 h-4" /> Accept Submission
                    </button>
                    <button onClick={() => handleDecision("rework")}
                      className="w-full flex items-center justify-center gap-1.5 text-[12px] font-medium text-gold-700 px-5 py-2.5 rounded-xl border border-gold-200 hover:bg-gold-50 transition-all">
                      <RotateCcw className="w-3.5 h-3.5" /> Request Rework
                    </button>
                    <button onClick={() => handleDecision("reject")}
                      className="w-full flex items-center justify-center gap-1.5 text-[12px] font-medium text-gray-400 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-red-500 hover:border-red-200 transition-all">
                      <Ban className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}
              </div>
            </Section>
          </motion.div>
        </div>
      </div>

      {/* ═══ DECISION CONFIRMATION — POPUP ═══ */}
      {showDecisionConfirm && decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowDecisionConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold text-gray-900">
                {decision === "accept" ? "Accept Submission" : decision === "rework" ? "Request Rework" : "Reject Submission"}
              </h3>
              <button onClick={() => setShowDecisionConfirm(false)} className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2 mb-5">
              {[
                { label: "Task", value: item.taskTitle },
                { label: "Contributor", value: item.contributorId },
                { label: "Average Score", value: `${avgScore}/5` },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid var(--border-hair)" }}>
                  <span className="text-[12px] text-gray-400">{row.label}</span>
                  <span className="text-[12px] font-medium text-gray-700 truncate max-w-[220px] text-right">{row.value}</span>
                </div>
              ))}
            </div>

            {decision === "rework" && (
              <div className="mb-5">
                <label className="mb-1.5 block text-[12px] font-semibold text-gray-600">What specifically needs to change? *</label>
                <Textarea value={reworkDetails} onChange={(e) => setReworkDetails(e.target.value)} placeholder="List the specific items that need rework..." className="min-h-[100px]" />
              </div>
            )}

            {decision === "reject" && (
              <div className="mb-5">
                <label className="mb-1.5 block text-[12px] font-semibold text-gray-600">Reason for rejection *</label>
                <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain why this submission cannot be accepted..." className="min-h-[100px]" />
              </div>
            )}

            {decision === "accept" && (
              <div className="flex items-start gap-2.5 mb-5 px-4 py-3 rounded-xl bg-forest-50">
                <CheckCircle2 className="w-4 h-4 text-forest-500 mt-0.5 shrink-0" />
                <p className="text-[11px] text-forest-700 leading-relaxed">
                  This will mark the task as completed. The contributor will receive payment of ${item.pricing.toLocaleString()} and a PoDL credential update.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button onClick={() => setShowDecisionConfirm(false)} className="text-[12px] font-medium text-gray-500 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button onClick={confirmDecision}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700 px-5 py-2 rounded-xl transition-all">
                <Send className="w-3.5 h-3.5" /> Confirm {decision === "accept" ? "Acceptance" : decision === "rework" ? "Rework Request" : "Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

