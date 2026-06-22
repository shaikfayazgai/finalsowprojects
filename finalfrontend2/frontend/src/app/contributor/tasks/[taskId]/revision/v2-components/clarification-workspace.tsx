"use client";

import * as React from "react";
import { MessageCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
} from "@/app/contributor/_shared/primitives";
import type { ClarificationThread } from "@/mocks/data/contributor-workroom-detail";

export function ClarificationWorkspace({
  thread,
  draftValue,
  draftFor,
  onDraftChange,
  onSend,
  onClearAnchor,
  mentorName,
}: {
  thread: ClarificationThread | undefined;
  draftValue: string;
  draftFor?: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onClearAnchor: () => void;
  mentorName: string;
}) {
  return (
    <ContributorCard>
      <ContributorSectionHeader
        title="Clarification & discussion"
        caption={`Ask ${mentorName} about anything that's unclear. SLA stays running unless mentor pauses it.`}
        trailing={
          thread && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                thread.status === "pending"
                  ? "border-gold-200 bg-gold-50 text-gold-800"
                  : thread.status === "answered"
                  ? "border-teal-200 bg-teal-50 text-teal-800"
                  : "border-forest-200 bg-forest-50 text-forest-800"
              )}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {thread.status === "pending"
                ? "Awaiting reply"
                : thread.status === "answered"
                ? "Mentor replied"
                : "Resolved"}
            </span>
          )
        }
      />

      {thread ? (
        <ul className="space-y-2.5">
          {thread.messages.map((m) => {
            const isMine = m.authorRole === "contributor";
            return (
              <li
                key={m.id}
                className={cn(
                  "rounded-xl px-3.5 py-2.5 border",
                  isMine
                    ? "border-teal-200 bg-teal-50/40 ml-6"
                    : "border-beige-200 bg-beige-50/30 mr-6"
                )}
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span
                    className={cn(
                      "text-[11px] font-bold",
                      isMine ? "text-teal-800" : "text-brown-900"
                    )}
                  >
                    {m.author}
                  </span>
                  <span className="text-[10.5px] text-beige-500">{m.at}</span>
                </div>
                <p className="text-[12.5px] text-brown-900 leading-relaxed">{m.body}</p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[12.5px] text-beige-600 italic">
          No clarification thread yet. Use the box below to start one.
        </p>
      )}

      <div className="mt-4 rounded-xl border border-beige-200 bg-white overflow-hidden">
        {draftFor && (
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-beige-100 bg-beige-50/50">
            <span className="text-[11px] text-beige-700">
              Asking about correction <strong className="text-brown-900">{draftFor}</strong>
            </span>
            <button
              type="button"
              onClick={onClearAnchor}
              className="text-[11px] font-semibold text-beige-700 hover:text-brown-900"
            >
              clear
            </button>
          </div>
        )}
        <textarea
          rows={3}
          value={draftValue}
          onChange={(e) => onDraftChange(e.target.value)}
          placeholder={`Write a quick question for ${mentorName}…`}
          className="w-full resize-none px-3.5 py-2.5 text-[13px] text-brown-950 placeholder:text-beige-500 focus:outline-none"
        />
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-beige-100 bg-beige-50/30">
          <span className="text-[10.5px] text-beige-600">
            Mentor replies typically within 4 hours.
          </span>
          <button
            type="button"
            onClick={onSend}
            disabled={draftValue.trim().length === 0}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
              draftValue.trim().length === 0
                ? "bg-beige-100 text-beige-500 cursor-not-allowed"
                : "bg-teal-600 text-white hover:bg-teal-700"
            )}
          >
            <Send className="h-3.5 w-3.5" />
            Send to mentor
          </button>
        </div>
      </div>
    </ContributorCard>
  );
}
