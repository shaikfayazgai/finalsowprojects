// @ts-nocheck
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, AlertTriangle, FileText, ChevronDown, ChevronRight,
  Star, Save, Send, Sparkles, X, CheckCircle2, RotateCcw,Upload,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockReviewQueue } from "@/mocks/data/enterprise-reviewer";

function formatTimeLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff < 0) return { label: "OVERDUE", color: "text-red-600", bg: "bg-red-50 border-red-200" };
  const hours = Math.floor(diff / 3600000);
  if (hours < 4) return { label: `Due in ${hours}h`, color: "text-red-600", bg: "bg-red-50 border-red-200" };
  if (hours < 24) return { label: `Due in ${hours}h`, color: "text-gold-600", bg: "bg-gold-50 border-gold-200" };
  const days = Math.floor(hours / 24);
  return { label: `Due in ${days}d`, color: "text-forest-600", bg: "bg-forest-50 border-forest-200" };
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = React.useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-colors">
          <Star className={cn("w-5 h-5", (hovered || value) >= star ? "text-gold-400 fill-gold-400" : "text-gray-300")} />
        </button>
      ))}
      {value > 0 && (
        <span className="text-[11px] text-gray-500 ml-1">
          {["", "Does not meet", "Partially meets", "Meets", "Exceeds", "Exceptional"][value]}
        </span>
      )}
    </div>
  );
}

export default function ReviewQueuePage() {
  const router = useRouter();
  const [activeReview, setActiveReview] = React.useState<string | null>(null);
  const [scores, setScores] = React.useState<Record<string, number[]>>({});
  const [comments, setComments] = React.useState<Record<string, string[]>>({});
  const [overallAssessment, setOverallAssessment] = React.useState<Record<string, string>>({});
  const [recommendation, setRecommendation] = React.useState<Record<string, string>>({});
  const [reworkItems, setReworkItems] = React.useState<Record<string, string>>({});
  const [reworkDeadline, setReworkDeadline] = React.useState<Record<string, string>>({});
  const [coachingNote, setCoachingNote] = React.useState<Record<string, string>>({});  const [submitted, setSubmitted] = React.useState<Set<string>>(new Set());
  const [savedDraft, setSavedDraft] = React.useState<Set<string>>(new Set());
  const [viewingFile, setViewingFile] = React.useState<string | null>(null);
  const pendingCount = mockReviewQueue.filter(r => r.status === "submitted").length;
  const overdueCount = mockReviewQueue.filter(r => r.status === "overdue").length;
  const dueTodayCount = mockReviewQueue.filter(r => {
    const diff = new Date(r.slaDeadline).getTime() - Date.now();
    return diff > 0 && diff < 24 * 3600000;
  }).length;

  const openReview = (id: string, criteria: string[]) => {
    setActiveReview(id);
    if (!scores[id]) setScores(s => ({ ...s, [id]: new Array(criteria.length).fill(0) }));
    if (!comments[id]) setComments(c => ({ ...c, [id]: new Array(criteria.length).fill("") }));
  };

  const handleSubmit = (id: string, criteria: string[]) => {
    const s = scores[id] ?? [];
    const c = comments[id] ?? [];
    const allScored = s.every(v => v > 0);
    const allCommented = c.every(v => v.length >= 20);
    const hasAssessment = (overallAssessment[id] ?? "").length >= 30;
    const hasRec = !!recommendation[id];
    const needsRework = recommendation[id] === "rework" && !(reworkItems[id] ?? "").trim();

    if (!allScored) return alert("Please score all acceptance criteria.");
    if (!allCommented) return alert("Please add a comment of at least 20 characters for each criterion.");
    if (!hasAssessment) return alert("Overall assessment must be at least 30 characters.");
    if (!hasRec) return alert("Please select a recommendation.");
    if (needsRework) return alert("Please specify rework items.");

    setSubmitted(p => new Set([...p, id]));
    setActiveReview(null);
    alert("Review submitted successfully. Enterprise Admin has been notified.");
  };

  const handleSaveDraft = (id: string) => {
    setSavedDraft(p => new Set([...p, id]));
    alert("Draft saved.");
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Review Queue</h1>
        <p className="text-[13px] text-gray-500 mt-1">Submissions awaiting your formal review.</p>
      </motion.div>

      {/* ═══ SUMMARY STRIP ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Pending Reviews", value: pendingCount, color: "text-gold-600" },
          { label: "Overdue", value: overdueCount, color: "text-red-600" },
          { label: "Due Today", value: dueTodayCount, color: "text-gold-600" },
          { label: "Avg Wait", value: "12h", color: "text-gray-700" },
        ].map((m) => (
          <div key={m.label} className="card-parchment px-5 py-4 text-center">
            <div className={cn("text-[28px] font-bold font-mono", m.color)}>{m.value}</div>
            <div className="text-[11px] text-gray-400 mt-1">{m.label}</div>
          </div>
        ))}
      </motion.div>

      {/* ═══ QUEUE LIST ═══ */}
      <motion.div variants={fadeUp} className="space-y-4">
        {mockReviewQueue.map((item) => {
          const sla = formatTimeLeft(item.slaDeadline);
          const isOpen = activeReview === item.id;
          const isSubmitted = submitted.has(item.id);
          const isDraft = savedDraft.has(item.id);
          const itemScores = scores[item.id] ?? new Array(item.acceptanceCriteria.length).fill(0);
          const itemComments = comments[item.id] ?? new Array(item.acceptanceCriteria.length).fill("");

          return (
            <div key={item.id} className="card-parchment overflow-hidden">
              {/* Card Header */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold text-gray-800">{item.taskTitle}</span>
                    {item.reworkRound > 1 && (
                      <span className="text-[9px] font-bold text-brown-600 bg-brown-50 border border-brown-200 px-2 py-0.5 rounded-full">
                        Round {item.reworkRound} of {item.totalRounds}
                      </span>
                    )}
                    {isSubmitted && (
                      <span className="text-[9px] font-bold text-forest-600 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Submitted
                      </span>
                    )}
                    {isDraft && !isSubmitted && (
                      <span className="text-[9px] font-bold text-teal-600 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                        Draft Saved
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                    <span>{item.projectName}</span>
                    <span>·</span>
                    <span>{item.contributorId}</span>
                    <span>·</span>
                    <span>{item.evidenceFiles} files submitted</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-lg border", sla.bg, sla.color)}>
                    {sla.label}
                  </span>
                  {!isSubmitted && (
                    <button
                      onClick={() => router.push(`/enterprise/reviewer/review-queue/${item.id}`)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-semibold text-white bg-teal-500 hover:bg-teal-600 transition-all">
                      Open Review <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Review Form */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ borderTop: "1px solid var(--border-hair)" }}>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                      {/* Left — Submission Context */}
                      <div className="px-5 py-5" style={{ borderRight: "1px solid var(--border-hair)" }}>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Submission Context</p>

                        {/* Task Details */}
                        <div className="mb-4">
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Tasks</p>
                          <p className="text-[12px] text-gray-700 leading-relaxed px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                            {item.taskTitle} — This task is part of the {item.projectName}. The contributor is responsible for implementing all acceptance criteria as specified in the project SOW and delivering evidence of completion.
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                            <span>{item.contributorId}</span>
                            <span>·</span>
                            <span>{item.projectName}</span>
                            <span>·</span>
                            <span>{item.evidenceFiles} files submitted</span>
                          </div>
                        </div>

                        {/* Submission Notes */}
                        {item.submissionNotes && (
                          <div className="mb-4 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                            <p className="text-[10px] font-semibold text-gray-400 mb-1">Contributor's submission notes</p>
                            <p className="text-[12px] text-gray-600">{item.submissionNotes}</p>
                          </div>
                        )}

                        {/* Acceptance Criteria */}
                        <p className="text-[11px] font-semibold text-gray-700 mb-2">Acceptance Criteria</p>
                        <div className="space-y-1.5 mb-4">
                          {item.acceptanceCriteria.map((c, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-teal-600 bg-teal-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                              <span className="text-[12px] text-gray-700">{c}</span>
                            </div>
                          ))}
                        </div>

                        {/* Contributor Attachments */}
                        <p className="text-[11px] font-semibold text-gray-700 mb-2">Attachments from Contributor</p>
                        <div className="space-y-2 mb-4">
                          {Array.from({ length: item.evidenceFiles }).map((_, i) => (
                            <div key={i}>
                              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                                <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                <span className="text-[12px] text-gray-700 flex-1">attachment-{i + 1}.pdf</span>
                                <button
                                  onClick={() => setViewingFile(viewingFile === `${item.id}-${i}` ? null : `${item.id}-${i}`)}
                                  className="text-[11px] font-medium text-teal-600 hover:text-teal-700 transition-colors shrink-0">
                                  {viewingFile === `${item.id}-${i}` ? "Hide" : "View"}
                                </button>
                                <button className="text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors shrink-0">
                                  Download
                                </button>
                              </div>
                              {/* File Preview */}
                              {viewingFile === `${item.id}-${i}` && (
                                <div className="mt-1 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                                  <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200">
                                    <span className="text-[11px] font-medium text-gray-600">attachment-{i + 1}.pdf</span>
                                    <button
                                      onClick={() => setViewingFile(null)}
                                      className="text-gray-400 hover:text-gray-600">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  {/* PDF/Image preview area */}
                                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                                    <FileText className="w-10 h-10 text-gray-300 mb-3" />
                                    <p className="text-[12px] font-medium text-gray-600">attachment-{i + 1}.pdf</p>
                                    <p className="text-[11px] text-gray-400 mt-1">Preview not available for mock files.</p>
                                    <p className="text-[10px] text-gray-400 mt-1">In production, PDF and image files will render inline here.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        
                      </div>

                      {/* Right — Review Form */}
                      <div className="px-5 py-5 space-y-5">
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Review Form</p>

                        {/* Add Comment */}
                        <div>
                          <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Add Comment</label>
                          <textarea
                            value={overallAssessment[item.id] ?? ""}
                            onChange={(e) => setOverallAssessment(a => ({ ...a, [item.id]: e.target.value }))}
                            placeholder="Write your comment for the contributor..."
                            rows={4}
                            className="w-full text-[12px] border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
                          />
                        </div>

                        {/* Reviewer Attachment */}
                        <div>
                          <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Reviewer Attachment <span className="text-gray-400 font-normal">(optional)</span></label>
                          <div className="flex items-center justify-center w-full">
                            <label className="w-full flex flex-col items-center justify-center px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-300 hover:bg-teal-50 transition-all">
                              <Upload className="w-5 h-5 text-gray-400 mb-1" />
                              <span className="text-[12px] text-gray-500">Click to upload attachment</span>
                              <input type="file" className="hidden" />
                            </label>
                          </div>
                        </div>

                        {/* Action selected comment box */}
                        {recommendation[item.id] && (
                          <div className={cn("px-4 py-3 rounded-xl border space-y-3",
                            recommendation[item.id] === "clarification" ? "bg-teal-50 border-teal-200" :
                            recommendation[item.id] === "rework" ? "bg-gold-50 border-gold-200" :
                            "bg-forest-50 border-forest-200"
                          )}>
                            <p className="text-[11px] font-semibold text-gray-700">
                              {recommendation[item.id] === "clarification" ? "Clarification message to contributor:" :
                               recommendation[item.id] === "rework" ? "Rework instructions for contributor:" :
                               "Approval note for contributor:"}
                            </p>
                            <textarea
                              value={reworkItems[item.id] ?? ""}
                              onChange={(e) => setReworkItems(r => ({ ...r, [item.id]: e.target.value }))}
                              placeholder={
                                recommendation[item.id] === "clarification" ? "Describe what needs clarification..." :
                                recommendation[item.id] === "rework" ? "Describe what needs to be reworked..." :
                                "Add an approval note (optional)..."
                              }
                              rows={3}
                              className="w-full text-[12px] border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none bg-white"
                            />
                          </div>
                        )}

                        {/* Three Action Buttons */}
                        <div className="space-y-2 pt-2">
                          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Select Action</p>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => setRecommendation(r => ({ ...r, [item.id]: r[item.id] === "clarification" ? "" : "clarification" }))}
                              className={cn("py-2.5 rounded-xl border-2 text-[11px] font-semibold transition-all",
                                recommendation[item.id] === "clarification"
                                  ? "border-teal-400 bg-teal-50 text-teal-700"
                                  : "border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600"
                              )}>
                              Clarification
                            </button>
                            <button
                              onClick={() => setRecommendation(r => ({ ...r, [item.id]: r[item.id] === "rework" ? "" : "rework" }))}
                              className={cn("py-2.5 rounded-xl border-2 text-[11px] font-semibold transition-all",
                                recommendation[item.id] === "rework"
                                  ? "border-gold-400 bg-gold-50 text-gold-700"
                                  : "border-gray-200 text-gray-500 hover:border-gold-300 hover:text-gold-600"
                              )}>
                              Rework
                            </button>
                            <button
                              onClick={() => setRecommendation(r => ({ ...r, [item.id]: r[item.id] === "approve" ? "" : "approve" }))}
                              className={cn("py-2.5 rounded-xl border-2 text-[11px] font-semibold transition-all",
                                recommendation[item.id] === "approve"
                                  ? "border-forest-400 bg-forest-50 text-forest-700"
                                  : "border-gray-200 text-gray-500 hover:border-forest-300 hover:text-forest-600"
                              )}>
                              Approve
                            </button>
                          </div>
                        </div>

                        {/* Submit Button */}
                        <button
                          onClick={() => {
                            if (!recommendation[item.id]) return alert("Please select an action — Clarification, Rework, or Approve.");
                            setSubmitted(p => new Set([...p, item.id]));
                            setActiveReview(null);
                            alert(
                              recommendation[item.id] === "clarification"
                                ? "Clarification request sent to contributor."
                                : recommendation[item.id] === "rework"
                                ? "Rework request sent to contributor."
                                : "Task approved successfully."
                            );
                          }}
                          className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold text-white bg-teal-500 hover:bg-teal-600 transition-all">
                          <Send className="w-3.5 h-3.5" />
                          {recommendation[item.id] === "clarification" ? "Send Clarification Request" :
                           recommendation[item.id] === "rework" ? "Send Rework Request" :
                           recommendation[item.id] === "approve" ? "Submit Approval" :
                           "Submit"}
                        </button>
                      </div>
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