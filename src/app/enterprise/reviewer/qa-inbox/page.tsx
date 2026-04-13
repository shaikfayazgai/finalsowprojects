// @ts-nocheck
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  MessageSquare, Send, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { mockQAMessages } from "@/mocks/data/enterprise-reviewer";

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "Just now";
}

export default function QAInboxPage() {
  const [threads, setThreads] = React.useState(mockQAMessages);
  const [replyText, setReplyText] = React.useState<Record<string, string>>({});
  const [expandedThread, setExpandedThread] = React.useState<string | null>(threads[0]?.id ?? null);

  const unreadCount = threads.reduce((s, t) => s + t.messages.filter(m => !m.read).length, 0);

  const markAsRead = (threadId: string) => {
    setThreads(prev => prev.map(t =>
      t.id === threadId
        ? { ...t, messages: t.messages.map(m => ({ ...m, read: true })) }
        : t
    ));
  };

  const handleReply = (threadId: string) => {
    const text = replyText[threadId]?.trim();
    if (!text) return;
    setThreads(prev => prev.map(t =>
      t.id === threadId
        ? {
            ...t,
            messages: [...t.messages, {
              id: `msg-new-${Date.now()}`,
              from: "reviewer",
              text,
              timestamp: new Date().toISOString(),
              read: true,
            }],
          }
        : t
    ));
    setReplyText(r => ({ ...r, [threadId]: "" }));
  };

  const handleExpand = (threadId: string) => {
    setExpandedThread(prev => prev === threadId ? null : threadId);
    markAsRead(threadId);
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-[28px] font-semibold text-gray-900 tracking-tight">Q&A Inbox</h1>
          {unreadCount > 0 && (
            <span className="text-[11px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        <p className="text-[13px] text-gray-500 mt-1">Messages from contributors across all your assigned tasks.</p>
      </motion.div>

      {/* ═══ THREADS ═══ */}
      <motion.div variants={fadeUp} className="space-y-4">
        {threads.length === 0 ? (
          <div className="card-parchment flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="w-8 h-8 text-forest-400 mb-3" />
            <p className="text-[13px] font-semibold text-gray-700">No unread messages.</p>
            <p className="text-[11px] text-gray-400">All Q&A threads are up to date.</p>
          </div>
        ) : (
          threads.map((thread) => {
            const unread = thread.messages.filter(m => !m.read).length;
            const isExpanded = expandedThread === thread.id;
            const lastMessage = thread.messages[thread.messages.length - 1];

            return (
              <div key={thread.id} className="card-parchment overflow-hidden">
                {/* Thread Header */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-black/[0.02] transition-colors"
                  onClick={() => handleExpand(thread.id)}>
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                    unread > 0 ? "bg-gradient-to-br from-teal-400 to-teal-600" : "bg-gray-100"
                  )}>
                    <MessageSquare className={cn("w-4 h-4", unread > 0 ? "text-white" : "text-gray-400")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-gray-800 truncate">{thread.taskTitle}</span>
                      {thread.isCRFlagged && (
                        <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <AlertTriangle className="w-2.5 h-2.5" /> CR Flagged
                        </span>
                      )}
                      {unread > 0 && (
                        <span className="text-[9px] font-bold text-white bg-teal-500 w-4 h-4 rounded-full flex items-center justify-center shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                      <span>{thread.projectName}</span>
                      <span>·</span>
                      <span>{thread.contributorId}</span>
                      <span>·</span>
                      <span className="truncate max-w-[200px]">{lastMessage.text}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {formatTimeAgo(lastMessage.timestamp)}
                  </span>
                </div>

                {/* Thread Messages */}
                {isExpanded && (
                  <div style={{ borderTop: "1px solid var(--border-hair)" }}>
                    {/* Messages */}
                    <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
                      {thread.messages.map((msg) => {
                        const isReviewer = msg.from === "reviewer";
                        return (
                          <div key={msg.id} className={cn("flex", isReviewer ? "justify-end" : "justify-start")}>
                            <div className={cn(
                              "max-w-[70%] px-4 py-2.5 rounded-2xl",
                              isReviewer
                                ? "bg-teal-500 text-white rounded-tr-sm"
                                : "bg-gray-100 text-gray-800 rounded-tl-sm"
                            )}>
                              <div className={cn("text-[9px] font-semibold mb-1 uppercase tracking-wider",
                                isReviewer ? "text-teal-100" : "text-gray-400"
                              )}>
                                {isReviewer ? "Reviewer (You)" : thread.contributorId}
                              </div>
                              <p className="text-[12px] leading-relaxed">{msg.text}</p>
                              <p className={cn("text-[9px] mt-1", isReviewer ? "text-teal-200" : "text-gray-400")}>
                                {formatTimeAgo(msg.timestamp)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reply Box */}
                    <div className="px-5 pb-4">
                      <div className="flex items-end gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50">
                        <textarea
                          value={replyText[thread.id] ?? ""}
                          onChange={(e) => setReplyText(r => ({ ...r, [thread.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(thread.id); } }}
                          placeholder="Type your reply... (Enter to send)"
                          rows={2}
                          className="flex-1 text-[12px] bg-transparent border-none outline-none resize-none text-gray-700 placeholder:text-gray-400"
                        />
                        <button
                          onClick={() => handleReply(thread.id)}
                          disabled={!replyText[thread.id]?.trim()}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-white bg-teal-500 hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0">
                          <Send className="w-3.5 h-3.5" /> Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </motion.div>

    </motion.div>
  );
}