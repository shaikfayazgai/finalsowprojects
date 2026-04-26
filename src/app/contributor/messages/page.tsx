"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare, Search, Send, Users, Bot, User,
  ThumbsUp, ThumbsDown, ExternalLink, ArrowRight, Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp } from "@/lib/utils/motion-variants";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui";
import {
  fetchMessageThreads,
  fetchMessageThread,
  postMessageToThread,
  markThreadRead,
  rateThreadMessage,
  type MessageThreadItem,
  type MessageItem,
  type MessageParticipant,
} from "@/lib/api/contributor";
import { dedupeAsync, sessionKeyFragment } from "@/lib/utils/request-dedupe";
import { ApiError } from "@/lib/api/client";

/* ═══ Internal UI types ═══ */

interface UIMessage {
  id: string;
  sender: string;
  senderName: string;
  content: string;
  timestamp: string;
  isAI?: boolean;
}

interface UIThread {
  id: string;
  senderName: string;
  senderRole: string;
  projectName?: string;
  taskTitle?: string;
  taskId?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  unread: boolean;
  avatar: string;
  messages: UIMessage[];
  messagesLoaded: boolean;
}

/* ═══ API → UI mappers ═══ */

/** Roles that belong to the "other party" (not the logged-in contributor) */
const EXTERNAL_ROLES = new Set(["ai_assistant", "project_team", "mentor"]);

function mapThread(item: MessageThreadItem): UIThread {
  return {
    id: item.id,
    senderName: item.sender_name,
    senderRole: item.sender_role,
    projectName: item.project_name,
    taskTitle: item.task_title,
    taskId: item.task_id,
    lastMessage: item.last_message,
    timestamp: item.timestamp,
    unreadCount: item.unread_count,
    unread: item.unread_count > 0,
    avatar: item.avatar,
    messages: [],
    messagesLoaded: false,
  };
}

function mapMessage(msg: MessageItem): UIMessage {
  const isExternal = EXTERNAL_ROLES.has(msg.sender_role);
  return {
    id: msg.id,
    /* contributor's own messages sit on the right (sender === "user") */
    sender: isExternal ? msg.sender_role : "user",
    senderName: msg.sender_name,
    content: msg.content,
    timestamp: msg.timestamp,
    isAI: msg.sender_role === "ai_assistant",
  };
}

/** Pick the first non-contributor participant as the "other party" header */
function pickOtherParty(participants: MessageParticipant[]): MessageParticipant | null {
  return participants.find((p) => EXTERNAL_ROLES.has(p.role)) ?? participants[0] ?? null;
}

/* ═══ Helpers ═══ */

const roleConfig: Record<string, { variant: string; label: string; icon: React.ElementType; color: string }> = {
  project_team: { variant: "teal",   label: "Project Team",  icon: Users, color: "from-teal-400 to-teal-600" },
  mentor:       { variant: "forest", label: "Mentor",        icon: User,  color: "from-forest-400 to-forest-600" },
  ai_assistant: { variant: "gold",   label: "AI Assistant",  icon: Bot,   color: "from-gold-400 to-gold-600" },
};

const defaultRole = roleConfig.project_team;

const badgeStyles: Record<string, { bg: string; text: string }> = {
  teal:   { bg: "bg-teal-50",   text: "text-teal-700" },
  forest: { bg: "bg-forest-50", text: "text-forest-700" },
  gold:   { bg: "bg-gold-50",   text: "text-gold-700" },
};

function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const s = badgeStyles[variant] || badgeStyles.teal;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[9px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full", s.bg, s.text)}>
      {children}
    </span>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  if (days > 0)    return `${days}d ago`;
  if (hours > 0)   return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

/* ═══ PAGE ═══ */

export default function MessagesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const tokenRef = React.useRef<string | null>(null);
  if (session?.user?.accessToken) tokenRef.current = session.user.accessToken as string;

  /* ── State ── */
  const [allThreads,     setAllThreads]     = React.useState<UIThread[]>([]);
  const [loadingThreads, setLoadingThreads] = React.useState(true);
  const [threadsError,   setThreadsError]   = React.useState<string | null>(null);

  const [selectedId,    setSelectedId]    = React.useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);

  const [search,     setSearch]     = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [replyText,  setReplyText]  = React.useState("");
  const [sending,    setSending]    = React.useState(false);

  const [ratedMessages, setRatedMessages] = React.useState<Record<string, "up" | "down">>({});

  /* ── Load thread list ── */
  const loadThreads = React.useCallback(async (token: string) => {
    setLoadingThreads(true);
    setThreadsError(null);
    try {
      const sk = sessionKeyFragment(token);
      const res = await dedupeAsync(`contrib:msg-threads:${sk}`, () =>
        fetchMessageThreads(token, { page: 1, page_size: 100 }),
      );
      setAllThreads(res.items.map(mapThread));
    } catch (err) {
      setThreadsError(err instanceof ApiError ? err.message : "Failed to load messages.");
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  React.useEffect(() => {
    if (sessionStatus === "authenticated" && session?.user?.accessToken) {
      loadThreads(session.user.accessToken as string);
    } else if (sessionStatus === "unauthenticated") {
      setLoadingThreads(false);
      setThreadsError("Not authenticated.");
    }
  }, [sessionStatus, session, loadThreads]);

  /* ── Filter + search (client-side, same behaviour as before) ── */
  const filtered = React.useMemo(() => {
    let list = [...allThreads];
    if (roleFilter !== "all") list = list.filter((t) => t.senderRole === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) =>
        t.senderName.toLowerCase().includes(q) ||
        t.projectName?.toLowerCase().includes(q) ||
        t.taskTitle?.toLowerCase().includes(q) ||
        t.messages.some((m) => m.content.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list;
  }, [allThreads, roleFilter, search]);

  const selected       = filtered.find((t) => t.id === selectedId) || null;
  const unreadTotal    = allThreads.reduce((s, t) => s + t.unreadCount, 0);
  const activeFilterCount = [roleFilter].filter((v) => v !== "all").length + (search.trim() ? 1 : 0);

  /* ── Select thread → fetch detail + mark read ── */
  async function handleSelectThread(threadId: string) {
    setSelectedId(threadId);
    const token = tokenRef.current;
    if (!token) return;

    const thread = allThreads.find((t) => t.id === threadId);

    /* Mark read locally regardless */
    setAllThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0, unread: false } : t)),
    );

    /* Already fetched → just fire mark-read silently */
    if (thread?.messagesLoaded) {
      markThreadRead(token, threadId).catch(() => {});
      return;
    }

    setLoadingDetail(true);
    try {
      const [detail] = await Promise.all([
        fetchMessageThread(token, threadId),
        markThreadRead(token, threadId).catch(() => {}),
      ]);

      /* Seed ratings from server state so thumbs already reflect prior votes */
      const serverRatings: Record<string, "up" | "down"> = {};
      detail.messages.forEach((m) => {
        if (m.rating === "up" || m.rating === "down") serverRatings[m.id] = m.rating;
      });
      setRatedMessages((prev) => ({ ...serverRatings, ...prev }));

      /* Derive header info from participants if list data had no avatar */
      const other = pickOtherParty(detail.participants ?? []);

      setAllThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                taskId:         detail.task_id      ?? t.taskId,
                projectName:    detail.project_name ?? t.projectName,
                /* Update header fields from participants if available */
                senderName: other?.name   ?? t.senderName,
                senderRole: other?.role   ?? t.senderRole,
                avatar:     other?.avatar ?? t.avatar,
                messages:       detail.messages.map(mapMessage),
                messagesLoaded: true,
              }
            : t,
        ),
      );
    } catch (err) {
      console.error("Failed to load thread detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  }

  /* ── Send reply ── */
  async function handleSend() {
    if (!replyText.trim() || !selectedId || sending) return;
    const token = tokenRef.current;
    if (!token) return;

    const content = replyText.trim();
    setReplyText("");
    setSending(true);
    try {
      const msg   = await postMessageToThread(token, selectedId, content);
      const uiMsg = mapMessage(msg);
      setAllThreads((prev) =>
        prev.map((t) =>
          t.id === selectedId
            ? { ...t, messages: [...t.messages, uiMsg], lastMessage: content, timestamp: uiMsg.timestamp }
            : t,
        ),
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      setReplyText(content); /* restore on error */
    } finally {
      setSending(false);
    }
  }

  /* ── Rate AI message ── */
  async function handleRate(messageId: string, rating: "up" | "down") {
    /* Optimistic toggle */
    setRatedMessages((prev) => {
      if (prev[messageId] === rating) {
        const next = { ...prev };
        delete next[messageId];
        return next;
      }
      return { ...prev, [messageId]: rating };
    });

    const token = tokenRef.current;
    if (!token) return;

    /* Endpoint: POST /api/contributor/messages/{message_id}/rating  body: { rating: "up"|"down" } */
    rateThreadMessage(token, messageId, rating).catch(() => {});
  }

  /* ════════════════════ JSX ════════════════════ */
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ HEADER ═══ */}
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="font-heading leading-tight text-gray-900" style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
          Messages
        </h1>
        <p className="mt-1.5 text-[13px] text-gray-500">
          Q&A threads from task workrooms, project teams, and AI assistants.
        </p>
      </motion.div>

      {/* ═══ SPLIT PANEL ═══ */}
      <motion.div variants={fadeUp} className="card-parchment" style={{ minHeight: 560 }}>
        <div className="flex h-full" style={{ minHeight: 560 }}>

          {/* ─── LEFT: Thread List ─── */}
          <div
            className={cn("flex flex-col shrink-0 border-r", selected ? "hidden lg:flex" : "flex w-full lg:w-auto")}
            style={{ width: selected ? 360 : undefined, borderColor: "var(--border-soft)" }}
          >
            {/* Search + Filter */}
            <div className="px-4 py-3 space-y-2" style={{ borderBottom: "1px solid var(--border-hair)" }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full text-[12px] text-gray-700 bg-gray-50 rounded-lg pl-8.5 pr-3 py-2 border-none outline-none focus:bg-white focus:ring-2 focus:ring-brown-100 transition-all"
                  style={{ paddingLeft: 32 }}
                />
              </div>
              <div className="flex items-center justify-between">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="h-7 rounded-lg bg-white border border-gray-200 px-2.5 text-[11px] text-gray-600 hover:border-gray-300 focus:ring-2 focus:ring-brown-100 focus:border-brown-300 transition-all" style={{ minWidth: 110 }}>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Messages</SelectItem>
                    <SelectItem value="ai_assistant">AI Assistants</SelectItem>
                    <SelectItem value="project_team">Project Teams</SelectItem>
                    <SelectItem value="mentor">Mentors</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-[10px] text-gray-400">
                  {filtered.length} thread{filtered.length !== 1 ? "s" : ""}
                  {unreadTotal > 0 ? ` · ${unreadTotal} unread` : ""}
                </span>
              </div>
            </div>

            {/* Thread list body */}
            <div className="flex-1 overflow-y-auto">

              {/* Loading skeleton */}
              {loadingThreads && (
                <div className="py-16 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                </div>
              )}

              {/* Error */}
              {!loadingThreads && threadsError && (
                <div className="py-16 text-center px-6">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                  <p className="text-[12px] text-gray-400">{threadsError}</p>
                </div>
              )}

              {/* Thread rows */}
              {!loadingThreads && !threadsError && filtered.map((thread) => {
                const role     = roleConfig[thread.senderRole] ?? defaultRole;
                const isActive = selectedId === thread.id;
                return (
                  <div
                    key={thread.id}
                    onClick={() => handleSelectThread(thread.id)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors",
                      isActive
                        ? "bg-brown-50/40"
                        : thread.unread
                        ? "bg-teal-50/20 hover:bg-gray-50"
                        : "hover:bg-gray-50/60",
                    )}
                    style={{ borderBottom: "1px solid var(--border-hair)" }}
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-semibold shrink-0 bg-gradient-to-br", role.color)}>
                      {thread.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={cn("text-[12px] truncate", thread.unread ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>
                          {thread.senderName}
                        </span>
                        <span className="text-[9px] text-gray-400 shrink-0">{timeAgo(thread.timestamp)}</span>
                      </div>
                      {thread.taskTitle && (
                        <span className="text-[9px] text-gray-400 block truncate mb-0.5">{thread.taskTitle}</span>
                      )}
                      <p className={cn("text-[11px] leading-relaxed line-clamp-2", thread.unread ? "text-gray-600" : "text-gray-400")}>
                        {thread.lastMessage}
                      </p>
                    </div>
                    {thread.unread && thread.unreadCount > 0 && (
                      <span
                        className="text-[8px] font-bold text-white bg-gradient-to-r from-brown-400 to-brown-600 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ width: 18, height: 18 }}
                      >
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Empty state */}
              {!loadingThreads && !threadsError && filtered.length === 0 && (
                <div className="py-16 text-center px-6">
                  <MessageSquare className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                  <p className="text-[12px] text-gray-400">
                    {activeFilterCount > 0 ? "No messages match your search." : "No messages yet."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT: Conversation View ─── */}
          {selected ? (
            <div className="flex-1 flex flex-col min-w-0">

              {/* Conversation header */}
              <div className="flex items-center gap-3 px-5 py-3.5 shrink-0" style={{ borderBottom: "1px solid var(--border-soft)" }}>
                {/* Back (mobile) */}
                <button
                  onClick={() => setSelectedId(null)}
                  className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all shrink-0"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>

                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-semibold shrink-0 bg-gradient-to-br", (roleConfig[selected.senderRole] ?? defaultRole).color)}>
                  {selected.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-gray-900">{selected.senderName}</span>
                    <Badge variant={(roleConfig[selected.senderRole] ?? defaultRole).variant}>
                      {(roleConfig[selected.senderRole] ?? defaultRole).label}
                    </Badge>
                  </div>
                  {selected.projectName && (
                    <span className="text-[10px] text-gray-400 block">{selected.projectName}</span>
                  )}
                </div>

                {/* View Task link — navigates to the linked task */}
                {selected.taskId && (
                  <Link
                    href={`/contributor/tasks/${selected.taskId}`}
                    className="flex items-center gap-1.5 text-[11px] font-medium text-brown-500 hover:text-brown-600 px-3 py-1.5 rounded-lg hover:bg-brown-50 transition-all shrink-0"
                  >
                    <ExternalLink className="w-3 h-3" /> View Task
                  </Link>
                )}
              </div>

              {/* Task context bar */}
              {selected.taskTitle && (
                <div
                  className="flex items-center gap-2 px-5 py-2"
                  style={{ borderBottom: "1px solid var(--border-hair)", background: "color-mix(in srgb, var(--color-gray-100) 40%, white)" }}
                >
                  <span className="text-[10px] text-gray-400">Re:</span>
                  <span className="text-[10px] font-medium text-gray-600 truncate">{selected.taskTitle}</span>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {loadingDetail ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
                  </div>
                ) : (
                  <>
                    {selected.messages.map((msg) => {
                      const isUser = msg.sender === "user";
                      const isAI   = msg.isAI;
                      const rated  = ratedMessages[msg.id];
                      return (
                        <div key={msg.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[75%]", isUser ? "items-end" : "items-start")}>
                            <div className={cn(
                              "rounded-2xl px-4 py-3",
                              isUser
                                ? "bg-brown-50 rounded-br-md"
                                : "bg-white border border-gray-100 rounded-bl-md",
                            )}>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-semibold text-gray-600">{msg.senderName}</span>
                                <span className="text-[9px] text-gray-400">{formatTime(msg.timestamp)}</span>
                                {isAI && <Badge variant="gold">AI</Badge>}
                              </div>
                              <p className="text-[12px] text-gray-700 leading-relaxed">{msg.content}</p>
                            </div>

                            {/* Rate AI response */}
                            {isAI && !isUser && (
                              <div className="flex items-center gap-1 mt-1.5 ml-1">
                                <button
                                  onClick={() => handleRate(msg.id, "up")}
                                  className={cn(
                                    "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                                    rated === "up" ? "bg-forest-50 text-forest-600" : "text-gray-300 hover:text-gray-500 hover:bg-gray-50",
                                  )}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleRate(msg.id, "down")}
                                  className={cn(
                                    "w-6 h-6 rounded-md flex items-center justify-center transition-colors",
                                    rated === "down" ? "bg-red-50 text-red-500" : "text-gray-300 hover:text-gray-500 hover:bg-gray-50",
                                  )}
                                >
                                  <ThumbsDown className="w-3 h-3" />
                                </button>
                                {rated === "down" && (
                                  <span className="text-[9px] text-gray-400 ml-1">Feedback recorded</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* AI escalation notice */}
                    {selected.senderRole === "ai_assistant" && (
                      <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-teal-50/50">
                        <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="text-[10px] text-teal-700">
                          Need more help?{" "}
                          <Link href="/contributor/support" className="font-semibold underline underline-offset-2">
                            Post to the project team Q&A thread
                          </Link>{" "}
                          for human assistance.
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Reply input */}
              <div className="px-5 py-3 shrink-0" style={{ borderTop: "1px solid var(--border-hair)" }}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                    className="flex-1 text-[12px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border-none outline-none focus:bg-white focus:ring-2 focus:ring-brown-100 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!replyText.trim() || sending}
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all shrink-0",
                      replyText.trim() && !sending
                        ? "bg-gradient-to-r from-brown-400 to-brown-600 hover:from-brown-500 hover:to-brown-700"
                        : "bg-gray-200 cursor-not-allowed",
                    )}
                  >
                    {sending
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Send className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* No thread selected — empty state */
            <div className="flex-1 hidden lg:flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-[14px] font-medium text-gray-500 mb-1">Select a conversation</p>
                <p className="text-[12px] text-gray-400 max-w-[240px]">Choose a thread from the left to view and reply to messages.</p>
              </div>
            </div>
          )}

        </div>
      </motion.div>

    </motion.div>
  );
}
