"use client";

import * as React from "react";
import { GitCompare, MessageCircle, Save, Send, Upload } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function RevisionFooter({
  resolvedCount,
  totalCount,
  draftSavedAt,
  ready,
  onSaveDraft,
  onCompare,
  onAsk,
  onUploadEvidence,
  onResubmit,
}: {
  resolvedCount: number;
  totalCount: number;
  draftSavedAt: string;
  ready: boolean;
  onSaveDraft: () => void;
  onCompare: () => void;
  onAsk: () => void;
  onUploadEvidence: () => void;
  onResubmit: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-beige-200 bg-white/95 backdrop-blur-sm">
      <div className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 text-[11.5px] text-beige-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-forest-500" />
            Draft saved {draftSavedAt}
          </span>
          <span className="text-beige-300">·</span>
          <span className="tabular-nums">
            <strong className="text-brown-900">{resolvedCount}</strong>
            <span className="text-beige-400"> / </span>
            {totalCount} corrections marked
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSaveDraft}
            className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-brown-900 hover:border-beige-300"
          >
            <Save className="h-3.5 w-3.5" />
            Save draft
          </button>
          <button
            type="button"
            onClick={onCompare}
            className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-brown-900 hover:border-beige-300"
          >
            <GitCompare className="h-3.5 w-3.5" />
            Compare changes
          </button>
          <button
            type="button"
            onClick={onAsk}
            className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-brown-900 hover:border-beige-300"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Ask mentor
          </button>
          <button
            type="button"
            onClick={onUploadEvidence}
            className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-[12px] font-semibold text-teal-800 hover:bg-teal-100"
          >
            <Upload className="h-3.5 w-3.5" />
            Upload evidence
          </button>
          <button
            type="button"
            onClick={onResubmit}
            disabled={!ready}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors",
              ready
                ? "bg-forest-600 text-white hover:bg-forest-700"
                : "bg-beige-200 text-beige-600 cursor-not-allowed"
            )}
          >
            <Send className="h-3.5 w-3.5" />
            {ready ? "Resubmit for review" : "Resubmit · checks pending"}
          </button>
        </div>
      </div>
    </div>
  );
}
