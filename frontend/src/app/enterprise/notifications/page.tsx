"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, CheckCheck, AlertCircle, Info, Minus,
  Search, X, ChevronRight, FolderKanban, ClipboardCheck,
  CheckCircle2, Inbox, Sparkles, Send, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { stagger, fadeUp, scaleIn } from "@/lib/utils/motion-variants";
import { useNotificationStore } from "@/lib/stores/notification-store";
import type { AppNotification, NotificationSeverity } from "@/types/enterprise";

/* ══════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════ */

function timeAgo(ts: string) {
  const ms = Date.now() - new Date(ts).getTime();
  const m  = Math.floor(ms / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatFull(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function getDateGroup(ts: string) {
  const d   = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

/* ══════════════════════════════════════════
   SEVERITY CONFIG
   ══════════════════════════════════════════ */

const SEV: Record<NotificationSeverity, {
  dot: string; iconBg: string; icon: React.ElementType;
  badgeBg: string; badgeText: string; label: string; rowGlow: string;
}> = {
  high: {
    dot: "bg-red-500",
    iconBg: "bg-gradient-to-br from-red-400 to-red-600",
    icon: AlertCircle,
    badgeBg: "bg-red-50", badgeText: "text-red-700",
    label: "High",
    rowGlow: "hover:bg-red-50/30",
  },
  medium: {
    dot: "bg-gold-500",
    iconBg: "bg-gradient-to-br from-gold-400 to-gold-600",
    icon: Info,
    badgeBg: "bg-gold-50", badgeText: "text-gold-700",
    label: "Medium",
    rowGlow: "hover:bg-gold-50/30",
  },
  low: {
    dot: "bg-gray-300",
    iconBg: "bg-gradient-to-br from-beige-300 to-beige-400",
    icon: Minus,
    badgeBg: "bg-beige-50", badgeText: "text-beige-600",
    label: "Low",
    rowGlow: "hover:bg-black/[0.02]",
  },
};

/* ══════════════════════════════════════════
   METRIC TILE  (mirrors dashboard metric-tiles)
   ══════════════════════════════════════════ */

function MetricTile({
  label, value, sub, iconBg, icon: Icon,
}: {
  label: string; value: number | string; sub: string;
  iconBg: string; icon: React.ElementType;
}) {
  return (
    <motion.div variants={scaleIn} className="card-parchment px-5 py-5">
      <div className="flex items-center gap-4">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</div>
          <div className="text-[28px] font-semibold text-gray-900 leading-none mt-0.5 tabular-nums">{value}</div>
          <div className="text-[11px] text-gray-400 mt-1">{sub}</div>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   FILTER CHIP
   ══════════════════════════════════════════ */

function FilterChip({
  label, count, active, onClick,
}: {
  label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-medium transition-all",
        active
          ? "bg-brown-50 text-brown-800 border border-brown-100"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
      )}
    >
      <span>{label}</span>
      <span className={cn(
        "text-[10px] font-bold px-1.5 py-px rounded-full min-w-[20px] text-center",
        active ? "bg-brown-200 text-brown-700" : "bg-gray-100 text-gray-400",
      )}>
        {count}
      </span>
    </button>
  );
}

/* ══════════════════════════════════════════
   AI INSIGHT CARD
   ══════════════════════════════════════════ */

const AI_INSIGHTS: Record<NotificationSeverity, string> = {
  high:   "This is a high-priority alert that may require immediate action. I recommend reviewing the related SOW or project item as soon as possible and looping in the relevant stakeholders. Would you like me to draft a response or summarise the next steps?",
  medium: "This notification is worth addressing in your next working session. I can help you identify the impacted area, suggest a remediation plan, or prepare a summary for your team.",
  low:    "This is a routine update — no urgent action needed. Let me know if you'd like a brief summary or want to log this against a project for record-keeping.",
};

function AiNotifCard({
  n, onClose,
}: {
  n: AppNotification; onClose: () => void;
}) {
  const [input, setInput]       = React.useState("");
  const [messages, setMessages] = React.useState<{ role: "ai" | "user"; text: string }[]>([
    { role: "ai", text: AI_INSIGHTS[n.severity] },
  ]);
  const [thinking, setThinking] = React.useState(false);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setThinking(true);
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "ai",
          text: `Understood. Based on the notification "${n.title}", here is what I'd suggest: review the associated record, confirm the details with your team, and take the appropriate next steps. Is there anything more specific I can help with?`,
        },
      ]);
      setThinking(false);
    }, 1200);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="mt-2 rounded-xl border border-brown-100 bg-gradient-to-br from-white to-beige-50/60 shadow-sm overflow-hidden"
      style={{ boxShadow: "0 2px 12px rgba(120,80,40,0.07)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-beige-100 bg-brown-50/40">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center">
            <Bot className="w-3 h-3 text-white" />
          </div>
          <span className="text-[11px] font-semibold text-brown-700">AI Assistant</span>
          <span className="text-[9px] font-medium text-brown-400 uppercase tracking-wide border border-brown-200 rounded-full px-1.5 py-px">Beta</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Context pill */}
      <div className="px-4 pt-3 pb-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-beige-100 text-[10px] text-beige-700 font-medium max-w-full truncate">
          <Info className="w-3 h-3 shrink-0" />
          <span className="truncate">{n.title}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="px-4 py-2 max-h-44 overflow-y-auto space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
            {m.role === "ai" && (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            <div className={cn(
              "text-[12px] leading-relaxed rounded-xl px-3 py-2 max-w-[85%]",
              m.role === "ai"
                ? "bg-white border border-beige-100 text-gray-700"
                : "bg-brown-500 text-white",
            )}>
              {m.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brown-400 to-brown-600 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-2.5 h-2.5 text-white" />
            </div>
            <div className="text-[12px] rounded-xl px-3 py-2 bg-white border border-beige-100 text-gray-400 italic">
              Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-3 pt-1">
        <div className="flex items-center gap-2 rounded-lg border border-beige-200 bg-white px-3 py-1.5 focus-within:border-brown-300 focus-within:ring-1 focus-within:ring-brown-100 transition-all">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask a follow-up…"
            className="flex-1 text-[12px] bg-transparent outline-none text-gray-700 placeholder:text-gray-400"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="shrink-0 disabled:opacity-40 text-brown-500 hover:text-brown-700 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   NOTIFICATION ROW  (mirrors attention-panel rows)
   ══════════════════════════════════════════ */

function NotifRow({
  n, isLast, onMarkRead,
}: {
  n: AppNotification; isLast: boolean; onMarkRead: (id: string) => void;
}) {
  const cfg = SEV[n.severity];
  const Icon = cfg.icon;
  const [aiOpen, setAiOpen] = React.useState(false);

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-5 py-3.5 transition-colors cursor-default",
        n.read ? "hover:bg-black/[0.02]" : cfg.rowGlow,
        !isLast && "border-b border-gray-100",
      )}
    >
      {/* Urgency dot */}
      <span className={cn(
        "w-1.5 h-1.5 rounded-full shrink-0 mt-[6px]",
        n.read ? "bg-gray-200" : cfg.dot,
      )} />

      {/* Icon square */}
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
        n.read ? "bg-gray-100" : cfg.iconBg,
      )}>
        <Icon className={cn("w-3.5 h-3.5", n.read ? "text-gray-400" : "text-white")} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            "text-[13px] font-medium leading-snug",
            n.read ? "text-gray-500" : "text-gray-800",
          )}>
            {n.title}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {!n.read && (
              <button
                onClick={() => onMarkRead(n.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium text-brown-500 hover:text-brown-700 flex items-center gap-1"
              >
                <CheckCheck className="w-3 h-3" /> Read
              </button>
            )}
            <button
              onClick={() => setAiOpen((v) => !v)}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-all text-[11px] font-medium flex items-center gap-1 px-2 py-0.5 rounded-full border",
                aiOpen
                  ? "opacity-100 bg-brown-500 text-white border-brown-500"
                  : "text-brown-500 hover:text-brown-700 border-brown-200 hover:bg-brown-50",
              )}
            >
              <Sparkles className="w-3 h-3" /> AI
            </button>
            <span className={cn(
              "text-[9px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full",
              cfg.badgeBg, cfg.badgeText,
            )}>
              {cfg.label}
            </span>
          </div>
        </div>

        <p className={cn(
          "text-[12px] mt-0.5 leading-relaxed",
          n.read ? "text-gray-400" : "text-gray-500",
        )}>
          {n.body}
        </p>

        <p className="text-[10px] text-gray-400 mt-1 tabular-nums">
          {timeAgo(n.timestamp)} · {formatFull(n.timestamp)}
        </p>

        {/* AI Card */}
        <AnimatePresence>
          {aiOpen && <AiNotifCard n={n} onClose={() => setAiOpen(false)} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   PAGE
   ══════════════════════════════════════════ */

type FilterTab = "all" | "unread" | "high" | "medium" | "low";

export default function NotificationsPage() {
  const { notifications, markRead, markAllRead } = useNotificationStore();
  const [tab, setTab]       = React.useState<FilterTab>("all");
  const [search, setSearch] = React.useState("");

  const total     = notifications.length;
  const unread    = notifications.filter((n) => !n.read).length;
  const highCount = notifications.filter((n) => n.severity === "high").length;
  const read      = notifications.filter((n) => n.read).length;

  const counts: Record<FilterTab, number> = {
    all:    total,
    unread: unread,
    high:   highCount,
    medium: notifications.filter((n) => n.severity === "medium").length,
    low:    notifications.filter((n) => n.severity === "low").length,
  };

  const filtered = notifications
    .filter((n) => {
      if (tab === "unread") return !n.read;
      if (tab === "high")   return n.severity === "high";
      if (tab === "medium") return n.severity === "medium";
      if (tab === "low")    return n.severity === "low";
      return true;
    })
    .filter((n) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    });

  /* Group by date */
  const groups = React.useMemo(() => {
    const map = new Map<string, AppNotification[]>();
    for (const n of filtered) {
      const key = getDateGroup(n.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    return map;
  }, [filtered]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* ═══ PAGE HEADER ═══ */}
      <motion.div variants={fadeUp} className="flex items-end justify-between mb-7">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
            Enterprise Console
          </div>
          <h1 className="font-heading text-[26px] font-semibold tracking-tight text-gray-900 leading-tight">
            Notification <span className="text-brown-500">Centre</span>
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">
            {unread > 0
              ? <>You have <span className="font-medium text-gray-700">{unread} unread</span> notification{unread > 1 ? "s" : ""} requiring attention.</>
              : "You're all caught up — no unread notifications."}
          </p>
        </div>

        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-beige-200 bg-white text-[12px] font-medium text-brown-600 hover:bg-brown-50 hover:border-brown-200 transition-all"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </motion.div>

      {/* ═══ METRIC TILES ═══ */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        <MetricTile label="Total"         value={total}     sub="All notifications"           iconBg="bg-gradient-to-br from-brown-400 to-brown-600"   icon={Bell} />
        <MetricTile label="Unread"        value={unread}    sub={unread === 0 ? "All caught up" : `${highCount} high priority`}  iconBg={unread > 0 ? "bg-gradient-to-br from-gold-400 to-gold-600" : "bg-gradient-to-br from-forest-400 to-forest-600"} icon={unread > 0 ? Bell : CheckCircle2} />
        <MetricTile label="High Priority" value={highCount} sub="Needs immediate action"      iconBg="bg-gradient-to-br from-red-400 to-red-600"       icon={AlertCircle} />
        <MetricTile label="Read"          value={read}      sub="Acknowledged"                iconBg="bg-gradient-to-br from-teal-400 to-teal-600"     icon={CheckCheck} />
      </motion.div>

      {/* ═══ BODY: SIDEBAR + FEED ═══ */}
      <motion.div variants={fadeUp} className="flex gap-5 items-start">

        {/* ── LEFT SIDEBAR ── */}
        <div className="hidden lg:flex flex-col gap-3 w-52 shrink-0">

          {/* Filter panel */}
          <div className="card-parchment overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Filter</span>
            </div>
            <div className="p-2 space-y-0.5">
              <p className="text-[9px] font-bold uppercase tracking-widest text-beige-400 px-3 pt-2 pb-1">Status</p>
              {(["all", "unread"] as FilterTab[]).map((key) => (
                <FilterChip
                  key={key}
                  label={key === "all" ? "All" : "Unread"}
                  count={counts[key]}
                  active={tab === key}
                  onClick={() => setTab(key)}
                />
              ))}
              <p className="text-[9px] font-bold uppercase tracking-widest text-beige-400 px-3 pt-3 pb-1">Priority</p>
              {(["high", "medium", "low"] as FilterTab[]).map((key) => (
                <FilterChip
                  key={key}
                  label={key.charAt(0).toUpperCase() + key.slice(1)}
                  count={counts[key]}
                  active={tab === key}
                  onClick={() => setTab(key)}
                />
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="card-parchment p-4 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-2">Priority key</span>
            {(["high", "medium", "low"] as NotificationSeverity[]).map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full shrink-0", SEV[s].dot)} />
                <span className="text-[11px] text-gray-600 capitalize">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── MAIN FEED ── */}
        <div className="flex-1 min-w-0">
          {/* Feed card */}
          <div className="card-parchment overflow-hidden">

            {/* Card header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-semibold text-gray-800">Activity Feed</h2>
                {unread > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[9px] font-bold">
                    {unread}
                  </span>
                )}
              </div>

              {/* Search */}
              <div className="relative w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="w-full h-8 pl-9 pr-7 text-[12px] bg-gray-50 border border-gray-100 rounded-lg text-gray-700 placeholder:text-gray-400 outline-none focus:bg-white focus:border-brown-200 focus:ring-1 focus:ring-brown-100 transition-all"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Mobile filter tabs */}
            <div className="flex lg:hidden gap-1 px-4 py-2.5 border-b border-gray-100 overflow-x-auto">
              {(["all", "unread", "high", "medium", "low"] as FilterTab[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all",
                    tab === key
                      ? "bg-brown-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200",
                  )}
                >
                  {key === "all" ? "All" : key.charAt(0).toUpperCase() + key.slice(1)}
                  <span className={cn("text-[9px] font-bold", tab === key ? "text-white/70" : "text-gray-400")}>
                    {counts[key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Feed body */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <BellOff className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-[14px] font-semibold text-gray-700">
                  {search ? "No results found" : "No notifications here"}
                </p>
                <p className="text-[12px] text-gray-400 mt-1">
                  {search ? `No notifications match "${search}"` : "You're all caught up."}
                </p>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="mt-3 text-[12px] font-medium text-brown-500 hover:text-brown-700 underline underline-offset-2"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div>
                {Array.from(groups.entries()).map(([dateLabel, items]) => (
                  <div key={dateLabel}>
                    {/* Date divider */}
                    <div className="flex items-center gap-3 px-5 py-2 bg-beige-50/60 border-b border-gray-100">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        {dateLabel}
                      </span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">{items.length} notification{items.length !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Rows */}
                    {items.map((n, i) => (
                      <NotifRow
                        key={n.id}
                        n={n}
                        isLast={i === items.length - 1}
                        onMarkRead={markRead}
                      />
                    ))}
                  </div>
                ))}

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-beige-50/30">
                  <span className="text-[11px] text-gray-400">
                    Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of{" "}
                    <span className="font-semibold text-gray-600">{total}</span> notifications
                  </span>
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-[11px] font-medium text-brown-500 hover:text-brown-700 flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck className="w-3 h-3" /> Mark all read
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
}
