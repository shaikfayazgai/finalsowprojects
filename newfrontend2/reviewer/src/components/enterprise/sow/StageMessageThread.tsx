"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquareDiff, Bot, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { useSowMessagesStore } from "@/lib/stores/sow-messages-store";
import { timeAgo } from "@/lib/utils/time";
import type { ApprovalMessage } from "@/types/enterprise";
import { cn } from "@/lib/utils/cn";
import { AURORA_ACCENT } from "@/app/admin/_shell/aurora";

const EMPTY_ARRAY: ApprovalMessage[] = [];

const TYPE_CONFIG = {
  stage_activated: {
    icon: Mail,
    label: "Stage Activated",
    color: "#2A6068",
    bg: "rgba(42,96,104,0.08)",
    border: "rgba(42,96,104,0.15)",
  },
  stage_approved: {
    icon: Send,
    label: "Approved",
    color: "#2A6045",
    bg: "rgba(42,96,69,0.08)",
    border: "rgba(42,96,69,0.15)",
  },
  changes_requested: {
    icon: MessageSquareDiff,
    label: "Changes Requested",
    color: "#A67763",
    bg: "rgba(166,119,99,0.08)",
    border: "rgba(166,119,99,0.2)",
  },
};

function MessageCard({ msg, onRead }: { msg: ApprovalMessage; onRead: () => void }) {
  const [expanded, setExpanded] = React.useState(false);
  const cfg = TYPE_CONFIG[msg.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={() => { onRead(); setExpanded(v => !v); }}
      className={cn(
        "cursor-pointer rounded-xl border transition-all duration-150 hover:shadow-sm",
        msg.read && "bg-white/50 border-white/55",
      )}
      style={
        msg.read
          ? undefined
          : { background: cfg.bg, borderColor: cfg.border }
      }
    >
      <div className="px-4 py-3 flex items-start gap-3">
        {/* icon */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
        </div>

        {/* content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={cn("text-[12px] font-semibold truncate", msg.read ? "text-text-secondary" : "text-foreground")}>
                {msg.subject}
              </p>
              <p className="text-[10px] text-text-tertiary mt-0.5">
                {msg.senderName} → {msg.recipientName}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {!msg.read && (
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.color }} />
              )}
              <span className="text-[10px] text-text-disabled tabular-nums">{timeAgo(msg.sentAt)}</span>
              {expanded
                ? <ChevronUp className="w-3 h-3 text-text-disabled" />
                : <ChevronDown className="w-3 h-3 text-text-disabled" />}
            </div>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <p className="text-[11.5px] text-text-secondary leading-relaxed mt-2 pt-2 border-t border-white/55">
                  {msg.body}
                </p>
                {msg.sectionRef && (
                  <p className="text-[10px] text-text-tertiary mt-1.5">
                    Section: <span className="font-medium text-text-secondary">{msg.sectionRef}</span>
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

interface StageMessageThreadProps {
  sowId: string;
  stageIndex: number;
}

export function StageMessageThread({ sowId, stageIndex }: StageMessageThreadProps) {
  // Select raw threads array — stable reference, no new array per render
  const thread = useSowMessagesStore((s) => s.threads[sowId] ?? EMPTY_ARRAY);
  const markRead = useSowMessagesStore((s) => s.markRead);
  const [showAll, setShowAll] = React.useState(false);

  const allMessages = thread;
  const messages = React.useMemo(
    () => thread.filter((m) => m.stageIndex === stageIndex),
    [thread, stageIndex]
  );

  const unread = messages.filter((m) => !m.read).length;
  const allUnread = allMessages.filter((m) => !m.read).length;

  if (allMessages.length === 0) return null;

  const displayed = showAll ? allMessages : allMessages.slice(0, 5);

  return (
    <div className="px-6 py-4 border-t border-white/55">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="w-3.5 h-3.5 text-teal-600" />
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
            Stage Messages
          </p>
          {allUnread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
              style={{ backgroundImage: AURORA_ACCENT }}>
              {allUnread} new
            </span>
          )}
        </div>
        <span className="text-[10px] text-text-disabled">{allMessages.length} total</span>
      </div>

      {/* messages */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {displayed.map((msg) => (
            <MessageCard
              key={msg.id}
              msg={msg}
              onRead={() => markRead(sowId, msg.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* show more/less */}
      {allMessages.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="mt-2 w-full text-[11px] font-medium text-text-tertiary hover:text-foreground transition-colors py-1"
        >
          {showAll ? "Show less" : `Show ${allMessages.length - 5} more`}
        </button>
      )}
    </div>
  );
}
