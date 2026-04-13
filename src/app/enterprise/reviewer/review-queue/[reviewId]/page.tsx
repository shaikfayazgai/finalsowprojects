// @ts-nocheck
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ChevronLeft, FileText, Send, Upload, X, Clock,
  AlertTriangle, CheckCircle2,Eye, EyeOff,
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

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.reviewId as string;
  const item = mockReviewQueue.find(r => r.id === reviewId) ?? mockReviewQueue[0];

  const [comment, setComment] = React.useState("");
  const [action, setAction] = React.useState("");
  const [actionComment, setActionComment] = React.useState("");
  const [viewingFile, setViewingFile] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  const sla = formatTimeLeft(item.slaDeadline);

  const handleSubmit = () => {
    if (!action) return alert("Please select an action — Clarification, Rework, or Approve.");
    setSubmitted(true);
    alert(
      action === "clarification" ? "Clarification request sent to contributor." :
      action === "rework" ? "Rework request sent to contributor." :
      "Task approved successfully."
    );
    router.push("/enterprise/reviewer/review-queue");
  };

  if (submitted) return null;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ BACK + HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <button
          onClick={() => router.push("/enterprise/reviewer/review-queue")}
          className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to Review Queue
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-tight">{item.taskTitle}</h1>
            <div className="flex items-center gap-2 mt-1 text-[12px] text-gray-400">
              <span>{item.projectName}</span>
              <span>·</span>
              <span>{item.contributorId}</span>
              <span>·</span>
              <span>{item.evidenceFiles} files submitted</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {item.reworkRound > 1 && (
              <span className="text-[10px] font-bold text-brown-600 bg-brown-50 border border-brown-200 px-2.5 py-1 rounded-full">
                Round {item.reworkRound} of {item.totalRounds}
              </span>
            )}
            <span className={cn("text-[11px] font-semibold px-3 py-1.5 rounded-lg border", sla.bg, sla.color)}>
              {sla.label}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Left: Submission Context ── */}
        <motion.div variants={fadeUp} className="card-parchment p-5 space-y-5">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Submission Context</p>

          {/* Task Description */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Tasks</p>
            <p className="text-[12px] text-gray-700 leading-relaxed px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
              {item.taskTitle} — This task is part of the {item.projectName}. The contributor is responsible for implementing all acceptance criteria as specified in the project SOW and delivering evidence of completion.
            </p>
          </div>

          {/* Submission Notes */}
          {item.submissionNotes && (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Note from Contributor</p>
              <div className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-[12px] text-gray-600">{item.submissionNotes}</p>
              </div>
            </div>
          )}

          {/* Acceptance Criteria */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Acceptance Criteria</p>
            <div className="space-y-2">
              {item.acceptanceCriteria.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-teal-600 bg-teal-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-[12px] text-gray-700">{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contributor Attachments */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Attachments from Contributor</p>
            <div className="space-y-2">
              {Array.from({ length: item.evidenceFiles }).map((_, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-[12px] text-gray-700 flex-1">attachment-{i + 1}.pdf</span>
                    <button
                      onClick={() => setViewingFile(viewingFile === `${i}` ? null : `${i}`)}
                      className="text-teal-600 hover:text-teal-700 transition-colors shrink-0"
                      title={viewingFile === `${i}` ? "Hide" : "View"}>
                      {viewingFile === `${i}`
                        ? <EyeOff className="w-4 h-4" />
                        : <Eye className="w-4 h-4" />
                      }
                    </button>
                    <button className="text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors shrink-0">
                      Download
                    </button>
                  </div>
                  {viewingFile === `${i}` && (
                    <div className="mt-1 rounded-xl border border-gray-200 overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-100 border-b border-gray-200">
                        <span className="text-[11px] font-medium text-gray-600">attachment-{i + 1}.pdf</span>
                        <button onClick={() => setViewingFile(null)}>
                          <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                      <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50">
                        <FileText className="w-10 h-10 text-gray-300 mb-3" />
                        <p className="text-[12px] font-medium text-gray-600">attachment-{i + 1}.pdf</p>
                        <p className="text-[11px] text-gray-400 mt-1">PDF/image preview renders here in production.</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Right: Review Form ── */}
        <motion.div variants={fadeUp} className="card-parchment p-5 space-y-5">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Review Form</p>

          {/* Add Comment */}
          <div>
            <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Add Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write your comment for the contributor..."
              rows={4}
              className="w-full text-[12px] border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus:border-teal-300 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* Reviewer Attachment */}
          <div>
            <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">
              Reviewer Attachment <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <label className="w-full flex flex-col items-center justify-center px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal-300 hover:bg-teal-50 transition-all">
              <Upload className="w-5 h-5 text-gray-400 mb-1" />
              <span className="text-[12px] text-gray-500">Click to upload attachment</span>
              <input type="file" className="hidden" />
            </label>
          </div>

          {/* Action Comment Box */}
          {action && (
            <div className={cn("px-4 py-3 rounded-xl border space-y-3",
              action === "clarification" ? "bg-teal-50 border-teal-200" :
              action === "rework" ? "bg-gold-50 border-gold-200" :
              "bg-forest-50 border-forest-200"
            )}>
              <p className="text-[11px] font-semibold text-gray-700">
                {action === "clarification" ? "Clarification message to contributor:" :
                 action === "rework" ? "Rework instructions for contributor:" :
                 "Approval note for contributor:"}
              </p>
              <textarea
                value={actionComment}
                onChange={(e) => setActionComment(e.target.value)}
                placeholder={
                  action === "clarification" ? "Describe what needs clarification..." :
                  action === "rework" ? "Describe what needs to be reworked..." :
                  "Add an approval note (optional)..."
                }
                rows={3}
                className="w-full text-[12px] border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none bg-white"
              />
            </div>
          )}

          {/* Three Action Buttons */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Select Action</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "clarification", label: "Clarification", active: "border-teal-400 bg-teal-50 text-teal-700", hover: "hover:border-teal-300 hover:text-teal-600" },
                { value: "rework", label: "Rework", active: "border-gold-400 bg-gold-50 text-gold-700", hover: "hover:border-gold-300 hover:text-gold-600" },
                { value: "approve", label: "Approve", active: "border-forest-400 bg-forest-50 text-forest-700", hover: "hover:border-forest-300 hover:text-forest-600" },
              ].map((btn) => (
                <button key={btn.value}
                  onClick={() => setAction(action === btn.value ? "" : btn.value)}
                  className={cn("py-2.5 rounded-xl border-2 text-[11px] font-semibold transition-all",
                    action === btn.value ? btn.active : `border-gray-200 text-gray-500 ${btn.hover}`
                  )}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-semibold text-white bg-teal-500 hover:bg-teal-600 transition-all">
            <Send className="w-3.5 h-3.5" />
            {action === "clarification" ? "Send Clarification Request" :
             action === "rework" ? "Send Rework Request" :
             action === "approve" ? "Submit Approval" :
             "Submit"}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}