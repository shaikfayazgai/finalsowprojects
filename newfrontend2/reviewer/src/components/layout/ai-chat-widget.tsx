"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Send,
  X,
  Sparkles,
  Mic,
  Volume2,
  VolumeX,
  History,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils/cn";
import { apiCall, ApiError } from "@/lib/api/client";

const SUPPORT_CHAT_BASE = "/api/v1/support-chat";
const SPEAKER_LS_KEY = "support-chat-speaker-enabled";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  createdAt: string;
};

type SessionSummary = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

type SessionDetail = SessionSummary & { messages: ChatMessage[] };

type SendMessageResponse = {
  userMessage: ChatMessage;
  aiMessage: ChatMessage;
  session: SessionSummary;
};

// Minimal typing shim — SpeechRecognition isn't in the standard TS DOM lib yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const body = err.body as
      | { detail?: { code?: string; message?: string } | string }
      | undefined;
    if (
      body &&
      typeof body.detail === "object" &&
      body.detail !== null &&
      "message" in body.detail &&
      typeof body.detail.message === "string"
    ) {
      return body.detail.message;
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong.";
}

// ── API helpers ─────────────────────────────────────────────────────────────
async function apiListSessions(token: string) {
  return apiCall<{ items: SessionSummary[] }>(`${SUPPORT_CHAT_BASE}/sessions`, {
    token,
  });
}

async function apiCreateSession(token: string) {
  return apiCall<SessionDetail>(`${SUPPORT_CHAT_BASE}/sessions`, {
    token,
    method: "POST",
  });
}

async function apiGetSession(token: string, id: string) {
  return apiCall<SessionDetail>(`${SUPPORT_CHAT_BASE}/sessions/${id}`, { token });
}

async function apiSendMessage(token: string, id: string, text: string) {
  return apiCall<SendMessageResponse>(
    `${SUPPORT_CHAT_BASE}/sessions/${id}/messages`,
    {
      token,
      method: "POST",
      body: JSON.stringify({ text }),
    },
  );
}

async function apiDeleteSession(token: string, id: string) {
  // apiCall<T> always parses JSON, so it can't handle 204 — use plain fetch here.
  const baseUrl =
    process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL ?? "";
  const res = await fetch(`${baseUrl}${SUPPORT_CHAT_BASE}/sessions/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok && res.status !== 204) {
    let detailMsg = `Delete failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.detail?.message) detailMsg = body.detail.message;
    } catch {
      // ignore
    }
    throw new Error(detailMsg);
  }
}

// ── Date grouping ───────────────────────────────────────────────────────────
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function groupSessionsByDay(sessions: SessionSummary[]) {
  const now = new Date();
  const todayMs = startOfDay(now);
  const yesterdayMs = todayMs - 86_400_000;
  const today: SessionSummary[] = [];
  const yesterday: SessionSummary[] = [];
  const earlier: SessionSummary[] = [];
  for (const s of sessions) {
    const bucket = startOfDay(new Date(s.updatedAt));
    if (bucket === todayMs) today.push(s);
    else if (bucket === yesterdayMs) yesterday.push(s);
    else earlier.push(s);
  }
  return { today, yesterday, earlier };
}

function summaryFromDetail(d: SessionDetail): SessionSummary {
  return {
    id: d.id,
    title: d.title,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    messageCount: d.messageCount,
  };
}

// ── Component ───────────────────────────────────────────────────────────────
export function AIChatWidget() {
  const { data: session } = useSession();
  const token = (session?.user as { accessToken?: string } | undefined)?.accessToken;

  const [open, setOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [sessions, setSessions] = React.useState<SessionSummary[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [bootstrapping, setBootstrapping] = React.useState(false);
  const bootstrapStartedRef = React.useRef(false);
  const [loadingSession, setLoadingSession] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  // Voice state
  const [voiceOut, setVoiceOut] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const recognitionRef = React.useRef<SpeechRecognitionInstance | null>(null);
  const voiceBaseInputRef = React.useRef<string>("");

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Defer feature detection to after mount so SSR/hydration stay aligned.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  const speechRecognitionAvailable = mounted && getSpeechRecognitionCtor() !== null;
  const speechSynthesisAvailable =
    mounted &&
    typeof window !== "undefined" &&
    typeof window.speechSynthesis !== "undefined";

  // Load persisted speaker preference
  React.useEffect(() => {
    if (!mounted) return;
    try {
      const v = window.localStorage.getItem(SPEAKER_LS_KEY);
      if (v === "true") setVoiceOut(true);
    } catch {
      // ignore
    }
  }, [mounted]);

  // Persist speaker preference
  React.useEffect(() => {
    if (!mounted) return;
    try {
      window.localStorage.setItem(SPEAKER_LS_KEY, voiceOut ? "true" : "false");
    } catch {
      // ignore
    }
  }, [voiceOut, mounted]);

  // Smooth scroll on new content
  React.useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  // Escape closes the modal
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const stopListening = React.useCallback(() => {
    setListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
  }, []);

  // Stop voice + cancel speech when modal closes
  React.useEffect(() => {
    if (open) return;
    if (speechSynthesisAvailable) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    stopListening();
  }, [open, speechSynthesisAvailable, stopListening]);

  // Cancel queued speech when speaker toggled off
  React.useEffect(() => {
    if (voiceOut || !speechSynthesisAvailable) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }, [voiceOut, speechSynthesisAvailable]);

  // Bootstrap: load most recent session (or create one) the first time the modal opens.
  // The `bootstrapStartedRef` guard prevents the effect from cancelling itself on the
  // immediate re-render that follows `setBootstrapping(true)`.
  React.useEffect(() => {
    if (!open || !token || activeId || bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;
    let cancelled = false;
    (async () => {
      setBootstrapping(true);
      setError(null);
      try {
        const list = await apiListSessions(token);
        if (cancelled) return;
        if (list.items.length > 0) {
          setSessions(list.items);
          const detail = await apiGetSession(token, list.items[0].id);
          if (cancelled) return;
          setActiveId(detail.id);
          setMessages(detail.messages);
        } else {
          const fresh = await apiCreateSession(token);
          if (cancelled) return;
          setActiveId(fresh.id);
          setMessages(fresh.messages);
          setSessions([summaryFromDetail(fresh)]);
        }
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err));
        bootstrapStartedRef.current = false; // allow a retry on the next render
      } finally {
        setBootstrapping(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, token, activeId]);

  const speakAi = React.useCallback(
    (text: string) => {
      if (!voiceOut || !speechSynthesisAvailable) return;
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      } catch {
        // ignore
      }
    },
    [voiceOut, speechSynthesisAvailable],
  );

  const startListening = React.useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;
    if (recognitionRef.current) {
      stopListening();
      return;
    }
    try {
      const rec: SpeechRecognitionInstance = new Ctor();
      rec.interimResults = true;
      rec.continuous = false;
      rec.lang = (typeof navigator !== "undefined" && navigator.language) || "en-US";
      voiceBaseInputRef.current = input;

      rec.onresult = (evt: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => {
        let interim = "";
        let finalText = "";
        for (let i = evt.resultIndex; i < evt.results.length; i++) {
          const r = evt.results[i];
          const transcript = r[0].transcript;
          if (r.isFinal) finalText += transcript;
          else interim += transcript;
        }
        const base = voiceBaseInputRef.current;
        const sep = base && !base.endsWith(" ") ? " " : "";
        const newInput = `${base}${sep}${finalText || interim}`.replace(/^\s+/, "");
        setInput(newInput);
        if (finalText) {
          voiceBaseInputRef.current = `${base}${sep}${finalText}`.replace(/^\s+/, "");
        }
      };
      rec.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };
      rec.onerror = () => {
        setListening(false);
        recognitionRef.current = null;
      };
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
      recognitionRef.current = null;
    }
  }, [input, stopListening]);

  const newSession = React.useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const fresh = await apiCreateSession(token);
      setActiveId(fresh.id);
      setMessages(fresh.messages);
      setSessions((prev) => [
        summaryFromDetail(fresh),
        ...prev.filter((s) => s.id !== fresh.id),
      ]);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }, [token]);

  const selectSession = React.useCallback(
    async (id: string) => {
      if (!token || id === activeId) return;
      setError(null);
      setLoadingSession(true);
      try {
        const detail = await apiGetSession(token, id);
        setActiveId(detail.id);
        setMessages(detail.messages);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setLoadingSession(false);
      }
    },
    [token, activeId],
  );

  const deleteSession = React.useCallback(
    async (id: string) => {
      if (!token) return;
      if (!window.confirm("Delete this conversation? This cannot be undone.")) return;
      try {
        await apiDeleteSession(token, id);
        const remaining = sessions.filter((s) => s.id !== id);
        setSessions(remaining);
        if (id === activeId) {
          if (remaining.length > 0) {
            setActiveId(null);
            await selectSession(remaining[0].id);
          } else {
            setActiveId(null);
            setMessages([]);
            await newSession();
          }
        }
      } catch (err) {
        setError(extractErrorMessage(err));
      }
    },
    [token, sessions, activeId, selectSession, newSession],
  );

  const handleSend = React.useCallback(async () => {
    const text = input.trim();
    if (!text || !token || !activeId || sending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: tempId,
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    voiceBaseInputRef.current = "";
    setError(null);
    setSending(true);

    try {
      const res = await apiSendMessage(token, activeId, text);
      setMessages((prev) => {
        const without = prev.filter((m) => m.id !== tempId);
        return [...without, res.userMessage, res.aiMessage];
      });
      setSessions((prev) => {
        const others = prev.filter((s) => s.id !== res.session.id);
        return [res.session, ...others];
      });
      speakAi(res.aiMessage.text);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);
      setError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
    // TODO: attachments — backend support-chat API doesn't accept attachments yet.
    // Once a dedicated upload endpoint exists, re-introduce the file picker UI and
    // post the upload reference alongside the message text.
  }, [input, token, activeId, sending, speakAi]);

  const grouped = React.useMemo(() => groupSessionsByDay(sessions), [sessions]);
  const showSignIn = mounted && !token;
  const canSend = Boolean(input.trim()) && !sending && Boolean(token) && Boolean(activeId);

  return (
    <>
      {/* Floating launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-brown-500 to-brown-700 text-white flex items-center justify-center shadow-lg shadow-brown-500/20 hover:shadow-xl hover:shadow-brown-500/30 transition-shadow cursor-pointer"
          >
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-forest-500 rounded-full border-2 border-white flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Centered modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl h-[80vh] max-h-[760px] mx-4 rounded-2xl bg-white shadow-2xl shadow-black/20 flex overflow-hidden border border-gray-100"
            >
              {/* History sidebar */}
              <AnimatePresence initial={false}>
                {historyOpen && (
                  <motion.aside
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 240, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 border-r border-gray-100 bg-gray-50 flex flex-col overflow-hidden"
                  >
                    <div className="px-3 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
                      <p className="text-[12px] font-semibold text-gray-700">Conversations</p>
                      <button
                        onClick={newSession}
                        disabled={!token}
                        className="text-[11px] text-brown-600 hover:text-brown-700 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-brown-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3" /> New
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 scroll-smooth">
                      {(["today", "yesterday", "earlier"] as const).map((bucket) => {
                        const items = grouped[bucket];
                        if (items.length === 0) return null;
                        const label =
                          bucket === "today"
                            ? "Today"
                            : bucket === "yesterday"
                              ? "Yesterday"
                              : "Earlier";
                        return (
                          <div key={bucket}>
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 px-2 mb-1">
                              {label}
                            </p>
                            <div className="space-y-0.5">
                              {items.map((s) => (
                                <div
                                  key={s.id}
                                  onClick={() => selectSession(s.id)}
                                  className={cn(
                                    "group flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-[12px] transition-colors",
                                    s.id === activeId
                                      ? "bg-brown-100/70 text-brown-800"
                                      : "text-gray-700 hover:bg-gray-100",
                                  )}
                                >
                                  <span className="flex-1 truncate">{s.title}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteSession(s.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                    title="Delete conversation"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                      {sessions.length === 0 && !bootstrapping && (
                        <p className="text-[11px] text-gray-400 px-2 py-1">
                          No conversations yet.
                        </p>
                      )}
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>

              {/* Main column */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Header */}
                <div className="px-5 py-4 bg-gradient-to-r from-brown-500 to-brown-600 text-white flex items-center gap-2 shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0 mr-1">
                    <p className="text-[13px] font-semibold">AI Support Assistant</p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-white/70">
                        Online — typically replies instantly
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setHistoryOpen((v) => !v)}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      historyOpen ? "bg-white/20" : "hover:bg-white/10",
                    )}
                    title="Conversations"
                  >
                    <History className="w-4 h-4" />
                  </button>
                  <button
                    onClick={newSession}
                    disabled={!token}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="New conversation"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {speechSynthesisAvailable && (
                    <button
                      onClick={() => setVoiceOut((v) => !v)}
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        voiceOut ? "bg-white/20" : "hover:bg-white/10",
                      )}
                      title={voiceOut ? "Mute voice replies" : "Enable voice replies"}
                    >
                      {voiceOut ? (
                        <Volume2 className="w-4 h-4" />
                      ) : (
                        <VolumeX className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setOpen(false)}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Messages */}
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0 scroll-smooth"
                >
                  {showSignIn ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[12px] text-gray-500">
                        Please sign in to start chatting with support.
                      </p>
                    </div>
                  ) : bootstrapping || (loadingSession && messages.length === 0) ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-5 h-5 text-brown-400 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) =>
                        msg.role === "ai" ? (
                          <div key={msg.id} className="flex gap-2.5 items-start">
                            <div className="w-7 h-7 rounded-lg bg-brown-50 flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles className="w-3.5 h-3.5 text-brown-500" />
                            </div>
                            <div className="space-y-1.5 max-w-[85%]">
                              <div className="bg-gray-50 rounded-2xl rounded-tl-md px-3.5 py-2.5">
                                <p className="text-[12px] text-gray-600 leading-relaxed whitespace-pre-wrap">
                                  {msg.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div key={msg.id} className="flex justify-end items-end gap-1.5">
                            <div className="space-y-1.5 max-w-[85%]">
                              <div className="bg-brown-500 rounded-2xl rounded-tr-md px-3.5 py-2.5">
                                <p className="text-[12px] text-white leading-relaxed whitespace-pre-wrap">
                                  {msg.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        ),
                      )}

                      {sending && (
                        <div className="flex gap-2.5 items-start">
                          <div className="w-7 h-7 rounded-lg bg-brown-50 flex items-center justify-center shrink-0 mt-0.5">
                            <Sparkles className="w-3.5 h-3.5 text-brown-500" />
                          </div>
                          <div className="bg-gray-50 rounded-2xl rounded-tl-md px-3.5 py-2.5 flex items-center gap-1">
                            <span
                              className="w-1.5 h-1.5 bg-brown-400 rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <span
                              className="w-1.5 h-1.5 bg-brown-400 rounded-full animate-bounce"
                              style={{ animationDelay: "120ms" }}
                            />
                            <span
                              className="w-1.5 h-1.5 bg-brown-400 rounded-full animate-bounce"
                              style={{ animationDelay: "240ms" }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
                  {error && (
                    <p className="text-[11px] text-red-600 mb-2 px-1">{error}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {speechRecognitionAvailable && (
                      <button
                        onClick={listening ? stopListening : startListening}
                        disabled={showSignIn || !activeId}
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                          listening
                            ? "bg-red-500 text-white animate-pulse"
                            : "text-gray-400 hover:text-brown-500 hover:bg-brown-50",
                          (showSignIn || !activeId) && "opacity-40 cursor-not-allowed",
                        )}
                        title={listening ? "Stop voice input" : "Voice input"}
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                    )}

                    <input
                      ref={inputRef}
                      type="text"
                      placeholder={showSignIn ? "Sign in to chat" : "Type your question..."}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                      }}
                      disabled={showSignIn || !activeId}
                      className="flex-1 text-[13px] text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-200 outline-none focus:border-brown-300 focus:ring-2 focus:ring-brown-100 transition-all placeholder:text-gray-400 disabled:opacity-60"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!canSend}
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0",
                        canSend
                          ? "bg-brown-500 text-white hover:bg-brown-600 cursor-pointer"
                          : "bg-gray-100 text-gray-300",
                      )}
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-[9px] text-gray-400 text-center mt-2">
                    AI may make mistakes. For critical issues, submit a ticket.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
