"use client";

import * as React from "react";
import { Paperclip, Send, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type {
  ClarificationMessage,
  ClarificationThread as Thread,
} from "@/mocks/data/mentor-rework-escalation";

const roleTone: Record<
  ClarificationMessage["authorRole"],
  { label: string; chip: string; bubble: string }
> = {
  mentor: {
    label: "Mentor",
    chip: "border-brown-200 bg-brown-50 text-brown-700",
    bubble: "bg-brown-50/40 border-brown-200",
  },
  reviewer: {
    label: "Reviewer",
    chip: "border-teal-200 bg-teal-50 text-teal-700",
    bubble: "bg-teal-50/30 border-teal-200",
  },
  contributor: {
    label: "Contributor",
    chip: "border-gray-200 bg-gray-50 text-gray-700",
    bubble: "bg-white border-gray-200",
  },
};

const statusTone = {
  pending: { label: "Pending", chip: "border-gold-200 bg-gold-50 text-gold-700" },
  answered: { label: "Answered", chip: "border-teal-200 bg-teal-50 text-teal-700" },
  resolved: { label: "Resolved", chip: "border-forest-200 bg-forest-50 text-forest-700" },
  expired: { label: "Expired", chip: "border-red-200 bg-red-50 text-red-700" },
} as const;

/**
 * Clarification thread — operational discussion between mentor/reviewer
 * and contributor about a specific review item. Threaded, contributor-visible,
 * audit-logged. The thread carries an SLA-pause flag so operators can stop
 * the clock while awaiting a reply.
 */
export function ClarificationThread({
  thread,
  onSend,
}: {
  thread: Thread;
  onSend?: (body: string) => void;
}) {
  const [draft, setDraft] = React.useState("");
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-brown-700">
            Clarification thread
          </p>
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wider",
              statusTone[thread.status].chip
            )}
          >
            {statusTone[thread.status].label}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-1.5 py-[1px] text-[9.5px] font-semibold tracking-wider",
              thread.pauseSla
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-gray-200 bg-white text-gray-600"
            )}
            title={thread.pauseSla ? "SLA timer paused" : "SLA timer running"}
          >
            {thread.pauseSla ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
            {thread.pauseSla ? "SLA paused" : "SLA running"}
          </span>
        </div>
        <span className="text-[10.5px] text-gray-500 tabular-nums">
          Expected by {thread.expectedBy.slice(0, 10)}
        </span>
      </div>

      <ol className="px-4 py-3 space-y-3 max-h-[280px] overflow-y-auto">
        {thread.messages.map((m) => {
          const t = roleTone[m.authorRole];
          return (
            <li
              key={m.id}
              className={cn(
                "rounded-md border px-3 py-2",
                t.bubble
              )}
            >
              <div className="flex items-center gap-2 flex-wrap text-[11.5px]">
                <span
                  className={cn(
                    "inline-flex items-center rounded border px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wider",
                    t.chip
                  )}
                >
                  {t.label}
                </span>
                <span className="font-semibold text-brown-950">{m.author}</span>
                <span className="text-[10.5px] font-mono text-gray-400 tabular-nums ml-auto">
                  {m.timestamp}
                </span>
              </div>
              <p className="mt-1 text-[12.5px] text-gray-800 leading-relaxed">{m.body}</p>
              {m.attachments && m.attachments.length > 0 && (
                <ul className="mt-1.5 flex flex-wrap gap-1">
                  {m.attachments.map((a) => (
                    <li
                      key={a.label}
                      className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-1.5 py-[1px] text-[10.5px] text-gray-700"
                    >
                      <Paperclip className="h-2.5 w-2.5" />
                      {a.label}
                      {a.size && <span className="text-gray-400">· {a.size}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      <div className="border-t border-gray-200 p-3 bg-gray-50/40">
        <div className="flex items-start gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Reply to the contributor. Audit-logged. Contributor-visible."
            className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-[12px] outline-none focus:border-brown-300 focus:ring-2 focus:ring-brown-100"
          />
          <button
            type="button"
            onClick={() => {
              if (draft.trim()) {
                onSend?.(draft);
                setDraft("");
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-brown-500 px-3 py-2 text-[12px] font-bold text-white hover:bg-brown-600"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </div>
        <p className="mt-1 text-[10.5px] text-gray-500">
          {draft.length} chars · audited · contributor-visible
        </p>
      </div>
    </div>
  );
}
