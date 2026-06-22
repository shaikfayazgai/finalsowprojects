"use client";

import * as React from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  MessageCircle,
  Send,
  Sparkle,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AiGlyph, AiSuggestionConfidence } from "@/app/contributor/_shared/primitives";
import type { MentorCorrection } from "@/mocks/data/contributor-workspace";
import type { CorrectionAiHint } from "@/mocks/data/contributor-workroom-detail";

type Correction = MentorCorrection;
type Severity = MentorCorrection["severity"];

const severityTone: Record<Severity, { chip: string; label: string }> = {
  blocker: {
    chip: "border-brown-300 bg-brown-50 text-brown-800",
    label: "Must fix",
  },
  major: {
    chip: "border-gold-200 bg-gold-50 text-gold-800",
    label: "Required",
  },
  nit: {
    chip: "border-beige-200 bg-beige-50 text-beige-600",
    label: "Nit",
  },
};

export function CorrectionCard({
  index,
  correction,
  hint,
  resolved,
  expanded,
  onToggleExpand,
  onToggleResolved,
  onAskClarification,
  mentorInitials,
}: {
  index: number;
  correction: Correction;
  hint?: CorrectionAiHint;
  resolved: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleResolved: () => void;
  onAskClarification: (correctionId: string) => void;
  mentorInitials: string;
}) {
  const tone = severityTone[correction.severity];
  const [showAi, setShowAi] = React.useState(false);

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white transition-colors",
        resolved
          ? "border-forest-200 bg-forest-50/30"
          : "border-beige-200 hover:border-beige-300"
      )}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full text-left px-5 py-4 flex items-start gap-3"
      >
        {/* Resolved toggle (stops propagation) */}
        <span
          role="checkbox"
          aria-checked={resolved}
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onToggleResolved();
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              e.stopPropagation();
              onToggleResolved();
            }
          }}
          className={cn(
            "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md border-2 shrink-0 cursor-pointer transition-colors",
            resolved
              ? "border-forest-500 bg-forest-500 text-white"
              : "border-beige-300 bg-white hover:border-teal-400"
          )}
        >
          {resolved && <Check className="h-3 w-3" strokeWidth={3.5} />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-500 tabular-nums">
              Correction {index}
            </span>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-[1px] text-[10px] font-semibold tracking-wide",
                tone.chip
              )}
            >
              {tone.label}
            </span>
            <span className="inline-flex items-center rounded-full border border-beige-200 bg-beige-50 px-2 py-[1px] text-[10px] font-semibold text-beige-700">
              {correction.criterion}
            </span>
            {resolved && (
              <span className="inline-flex items-center gap-1 rounded-full border border-forest-200 bg-forest-50 px-2 py-[1px] text-[10px] font-semibold text-forest-700">
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
                Marked addressed
              </span>
            )}
          </div>

          <p
            className={cn(
              "mt-2 text-[13.5px] leading-relaxed",
              resolved ? "text-forest-900" : "text-brown-950"
            )}
          >
            {correction.description}
          </p>

          {!expanded && hint && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-teal-700">
              <AiGlyph className="h-2.5 w-2.5" />
              AI fix hint available — open to view
            </p>
          )}
        </div>

        <span
          className="shrink-0 mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-md text-beige-500"
          aria-hidden
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-5 -mt-1 space-y-3">
          {/* Mentor anchor */}
          <div className="rounded-xl border border-beige-200 bg-beige-50/50 px-3 py-2.5 flex items-start gap-2.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brown-100 text-brown-700 text-[10.5px] font-bold shrink-0">
              {mentorInitials}
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-beige-600">
                Anchor in mentor feedback
              </p>
              <p className="text-[12.5px] text-brown-900 leading-relaxed mt-0.5">
                <CornerDownRight className="inline h-3 w-3 text-beige-500 mr-1" />
                Tied to <strong className="text-brown-950">{correction.criterion}</strong>
                {" · "}severity <em className="not-italic text-beige-700">{correction.severity}</em>
              </p>
            </div>
          </div>

          {/* AI fix hint */}
          {hint && (
            <div className="rounded-xl border border-teal-200 bg-teal-50/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAi((v) => !v)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between gap-2 text-left"
              >
                <span className="inline-flex items-center gap-2">
                  <AiGlyph />
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">
                    AI fix pattern · summoned
                  </span>
                  <AiSuggestionConfidence level={hint.confidence} />
                </span>
                <span className="text-[11px] text-teal-700 inline-flex items-center gap-0.5">
                  <Sparkle className="h-3 w-3" />
                  {showAi ? "Hide" : "Show pattern"}
                </span>
              </button>
              {showAi && (
                <div className="px-3.5 pb-3 pt-1 space-y-2.5">
                  <p className="text-[12.5px] font-semibold text-brown-950">{hint.pattern}</p>
                  <p className="text-[12.5px] text-brown-900 leading-relaxed">{hint.detail}</p>
                  {hint.example && (
                    <pre className="rounded-lg bg-brown-950 text-beige-50 text-[11.5px] leading-relaxed px-3 py-2.5 overflow-x-auto font-mono whitespace-pre">
{hint.example}
                    </pre>
                  )}
                  {hint.source && (
                    <p className="text-[10.5px] text-teal-700 italic">
                      Source · {hint.source}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onToggleResolved}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors",
                resolved
                  ? "bg-beige-100 text-beige-800 hover:bg-beige-200"
                  : "bg-forest-600 text-white hover:bg-forest-700"
              )}
            >
              <Check className="h-3.5 w-3.5" />
              {resolved ? "Mark not addressed" : "Mark addressed"}
            </button>
            <button
              type="button"
              onClick={() => onAskClarification(correction.id)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-brown-900 hover:border-beige-300 transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Ask mentor
            </button>
            <a
              href="#evidence"
              className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-brown-900 hover:border-beige-300 transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
              Jump to evidence
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
