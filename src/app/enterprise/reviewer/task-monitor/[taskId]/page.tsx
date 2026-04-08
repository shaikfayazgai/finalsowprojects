// @ts-nocheck
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, AlertTriangle, Clock, FileText,
  MessageSquare, RotateCcw, History, ClipboardList,
  Send, UserX, CheckCircle2, Star,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockTaskMonitor, mockQAMessages } from "@/mocks/data/enterprise-reviewer";

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-gray-100 text-gray-600 border-gray-200" },
  in_progress: { label: "In Progress", color: "bg-teal-50 text-teal-700 border-teal-200" },
  submitted: { label: "Submitted", color: "bg-gold-50 text-gold-700 border-gold-200" },
  rework: { label: "Rework", color: "bg-red-50 text-red-700 border-red-200" },
  accepted: { label: "Accepted", color: "bg-forest-50 text-forest-700 border-forest-200" },
};

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.taskId as string;

  const task = mockTaskMonitor.find(t => t.id === taskId) ?? mockTaskMonitor[0];
  const qaThread = mockQAMessages.find(q => q.taskId === task.taskId);

  const [activeTab, setActiveTab] = React.useState("overview");
  const [replyText, setReplyText] = React.useState("");
  const [messages, setMessages] = React.useState(qaThread?.messages ?? []);
  const [showReassignModal, setShowReassignModal] = React.useState(false);
  const [reassignReason, setReassignReason] = React.useState("");
  const [reassignSubmitted, setReassignSubmitted] = React.useState(false);

  const st = statusConfig[task.status] ?? statusConfig.open;

  const tabs = [
    { id: "overview", label: "Overview", icon: ClipboardList },
    { id: "qa", label: "Q&A Thread", icon: MessageSquare },
    { id: "submission", label: "Submission", icon: FileText, conditional: ["submitted", "rework"].includes(task.status) },
    { id: "review_record", label: "Review Record", icon: Star, conditional: ["accepted", "rework"].includes(task.status) },
    { id: "rework", label: "Rework Details", icon: RotateCcw, conditional: task.status === "rework" },
    { id: "history", label: "History", icon: History },
  ].filter(t => !t.conditional === false || t.conditional === true || t.conditional === undefined);

  const handleReply = () => {
    if (!replyText.trim()) return;
    setMessages(prev => [...prev, {
      id: `msg-new-${Date.now()}`,
      from: "reviewer",
      text: replyText,
      timestamp: new Date().toISOString(),
      read: true,
    }]);
    setReplyText("");
  };

  const handleReassign = () => {
    if (reassignReason.trim().length < 50) {
      alert("Please provide a reassignment reason of at least 50 characters.");
      return;
    }
    setReassignSubmitted(true);
    setShowReassignModal(false);
    alert("Reassignment request sent to Enterprise Admin for approval.");
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ BACK + HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <button
          onClick={() => router.push("/enterprise/reviewer/task-monitor")}
          className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors mb-4">
          <ChevronLeft className="w-4 h-4" /> Back to Task Monitor
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full border", st.color)}>
                {st.label}
              </span>
              {task.needsAttention && (
                <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-2.5 h-2.5" /> {task.attentionReason}
                </span>
              )}
            </div>
            <h1 className="font-heading text-[24px] font-semibold text-gray-900 tracking-tight">{task.taskTitle}</h1>
            <div className="flex items-center gap-2 mt-1 text-[12px] text-gray-400 flex-wrap">
              <span>{task.projectName}</span>
              <span>·</span>
              <span>{task.milestoneTitle}</span>
              <span>·</span>
              <span>{task.contributorId}</span>
            </div>
            {/* Contributor track record */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                Acceptance rate: <span className="font-semibold text-gray-700">78%</span>
              </span>
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">
                Avg rework rounds: <span className="font-semibold text-gray-700">1.2</span>
              </span>
            </div>
          </div>

          {/* Reassign button */}
          {["in_progress", "submitted", "rework"].includes(task.status) && !reassignSubmitted && (
            <button
              onClick={() => setShowReassignModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-all shrink-0">
              <UserX className="w-3.5 h-3.5" /> Reassign Task
            </button>
          )}
          {reassignSubmitted && (
            <span className="text-[11px] font-medium text-gold-600 bg-gold-50 border border-gold-200 px-3 py-2 rounded-xl">
              Reassignment pending approval
            </span>
          )}
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-2 mt-3">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[12px] text-gray-500">
            Due: {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span className="text-[12px] text-gray-400">·</span>
          <span className="text-[12px] text-gray-500">
            Last activity: {formatTimeAgo(task.lastReviewerActivity)}
          </span>
        </div>
      </motion.div>

      {/* ═══ TABS ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <div className="flex items-center gap-1 overflow-x-auto" style={{ borderBottom: "1px solid var(--border-soft)" }}>
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-[11px] font-medium whitespace-nowrap transition-all border-b-2 -mb-px",
                  activeTab === tab.id
                    ? "border-teal-500 text-teal-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                )}>
                <TabIcon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ═══ TAB CONTENT ═══ */}
      <motion.div variants={fadeUp}>

        {/* Overview */}
        {activeTab === "overview" && (
          <div className="card-parchment p-6 space-y-5">
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Task Description</p>
              <p className="text-[13px] text-gray-700 leading-relaxed">
                This task involves building and implementing the {task.taskTitle} for the {task.projectName}. The contributor is responsible for meeting all acceptance criteria as defined in the project plan.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Acceptance Criteria</p>
              <div className="space-y-2">
                {["Meets functional requirements", "Unit tests passing at 90%+", "Code review approved", "Documentation complete"].map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[10px] font-bold text-teal-600 bg-teal-50 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-[12px] text-gray-700">{c}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Assignment Info</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Contributor", value: task.contributorId },
                  { label: "Project", value: task.projectName },
                  { label: "Milestone", value: task.milestoneTitle },
                  { label: "Reviewer", value: "You (Primary)" },
                ].map((item) => (
                  <div key={item.label} className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-[10px] text-gray-400 mb-0.5">{item.label}</p>
                    <p className="text-[12px] font-medium text-gray-800">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Q&A Thread */}
        {activeTab === "qa" && (
          <div className="card-parchment overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <p className="text-sm font-semibold text-gray-800">Q&A Thread</p>
              <p className="text-[11px] text-gray-400 mt-0.5">You are the primary respondent. Messages shown as "Reviewer" to the contributor.</p>
            </div>
            <div className="px-5 py-4 space-y-3 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-[12px] text-gray-400 text-center py-8">No messages yet. The contributor hasn't posted any questions.</p>
              ) : (
                messages.map((msg) => {
                  const isReviewer = msg.from === "reviewer";
                  return (
                    <div key={msg.id} className={cn("flex", isReviewer ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[70%] px-4 py-2.5 rounded-2xl",
                        isReviewer ? "bg-teal-500 text-white rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"
                      )}>
                        <p className={cn("text-[9px] font-semibold mb-1 uppercase tracking-wider",
                          isReviewer ? "text-teal-100" : "text-gray-400"
                        )}>
                          {isReviewer ? "Reviewer (You)" : task.contributorId}
                        </p>
                        <p className="text-[12px] leading-relaxed">{msg.text}</p>
                        <p className={cn("text-[9px] mt-1", isReviewer ? "text-teal-200" : "text-gray-400")}>
                          {formatTimeAgo(msg.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-5 pb-4">
              <div className="flex items-end gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                  placeholder="Type your reply... (Enter to send)"
                  rows={2}
                  className="flex-1 text-[12px] bg-transparent border-none outline-none resize-none text-gray-700 placeholder:text-gray-400"
                />
                <button
                  onClick={handleReply}
                  disabled={!replyText.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-40 transition-all shrink-0">
                  <Send className="w-3.5 h-3.5" /> Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submission */}
        {activeTab === "submission" && (
          <div className="card-parchment p-6 space-y-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Submitted Files</p>
            {[1, 2, 3].map((f) => (
              <div key={f} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-[12px] text-gray-700 flex-1">submission-file-{f}.pdf</span>
                <button className="text-[11px] font-medium text-teal-600 hover:text-teal-700 transition-colors">Download</button>
              </div>
            ))}
            <button
              onClick={() => router.push("/enterprise/reviewer/review-queue")}
              className="w-full py-2.5 rounded-xl text-[12px] font-semibold text-white bg-teal-500 hover:bg-teal-600 transition-all">
              Open Review Form
            </button>
          </div>
        )}

        {/* Review Record */}
        {activeTab === "review_record" && (
          <div className="card-parchment p-6 space-y-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Review Record — Round 1</p>
            <div className="space-y-3">
              {["Functionality", "Code Quality", "Testing", "Documentation"].map((criterion, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[12px] text-gray-600 w-32 shrink-0">{criterion}</span>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={cn("w-3.5 h-3.5", s <= 4 ? "text-gold-400 fill-gold-400" : "text-gray-200")} />
                    ))}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">4/5</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Overall Assessment</p>
              <p className="text-[12px] text-gray-700 leading-relaxed">Good submission overall. All core requirements met. Minor improvements needed in test coverage.</p>
            </div>
            <div className="px-3 py-2 rounded-xl bg-forest-50 border border-forest-200 inline-flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-600" />
              <span className="text-[11px] font-semibold text-forest-700">Recommended Accept</span>
            </div>
          </div>
        )}

        {/* Rework Details */}
        {activeTab === "rework" && (
          <div className="card-parchment p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold text-gold-600 bg-gold-50 border border-gold-200 px-2 py-0.5 rounded-full">Round 1 of 3</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Rework Requirements</p>
              <ul className="space-y-2">
                {["Fix MFA edge case handling", "Add refresh token rotation", "Increase test coverage to 90%"].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-gray-700">
                    <span className="text-gold-500 shrink-0">•</span>{item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Rework Deadline</p>
              <p className="text-[12px] text-gray-700">{new Date(Date.now() + 5 * 24 * 3600000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
            </div>
          </div>
        )}

        {/* History */}
        {activeTab === "history" && (
          <div className="card-parchment overflow-hidden">
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border-soft)" }}>
              <p className="text-sm font-semibold text-gray-800">Task History</p>
            </div>
            <div className="px-5 py-4 space-y-3">
              {[
                { event: "Task assigned to reviewer", time: "10d ago", icon: ClipboardList, color: "text-teal-500" },
                { event: "Contributor accepted task", time: "9d ago", icon: CheckCircle2, color: "text-forest-500" },
                { event: "Midpoint checkpoint triggered", time: "5d ago", icon: AlertTriangle, color: "text-gold-500" },
                { event: "Submission received", time: "2d ago", icon: FileText, color: "text-teal-500" },
              ].map((item, i) => {
                const ItemIcon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={cn("w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0", item.color)}>
                      <ItemIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] text-gray-700">{item.event}</p>
                      <p className="text-[10px] text-gray-400">{item.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══ REASSIGN MODAL ═══ */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowReassignModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[480px] mx-4"
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-bold text-gray-900 mb-1 flex items-center gap-2">
              <UserX className="w-4 h-4 text-red-500" /> Reassign Task
            </h3>
            <p className="text-[12px] text-gray-500 mb-4">
              Reassigning will remove the current contributor and trigger AGI re-matching. Enterprise Admin must approve this request.
            </p>
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-gray-700 block mb-2">Quick Select Reason</label>
              <div className="space-y-2">
                {[
                  "Contributor not responding to Q&A for 48+ hours",
                  "Work quality significantly below required standard",
                  "Contributor requested release from task",
                  "Scope mismatch — contributor skill does not match requirements",
                ].map((reason) => (
                  <button key={reason}
                    onClick={() => setReassignReason(reason)}
                    className={cn("w-full text-left text-[11px] px-3 py-2 rounded-lg border transition-all",
                      reassignReason === reason
                        ? "border-red-300 bg-red-50 text-red-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    )}>
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-gray-700 block mb-1.5">Or write your reason (min 50 chars)</label>
              <textarea
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="Describe the reason for reassignment..."
                rows={3}
                className="w-full text-[12px] border border-gray-200 rounded-lg px-3 py-2 resize-none outline-none focus:border-red-300"
              />
              <p className="text-[10px] text-gray-400 mt-1">{reassignReason.length}/50 characters minimum</p>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-all">
                Cancel
              </button>
              <button
                onClick={handleReassign}
                className="px-4 py-2 rounded-lg text-[12px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-all">
                Submit Reassignment Request
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}