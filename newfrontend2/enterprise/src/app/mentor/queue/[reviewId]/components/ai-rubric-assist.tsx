"use client";

/**
 * AI rubric assist — Mentor portal consumer of the `review-assistant`
 * agent.
 *
 * Calls POST /api/ai/invoke with the task brief, criteria, and evidence.
 * Renders one suggestion per criterion: AI-suggested score (1-5),
 * confidence band, sources used, and an "Apply" button that pipes the
 * score into the mentor's manual rubric state.
 *
 * Spec: doc 03 §5.D.1 (review cockpit) + doc 05 §5 (orchestrator).
 * Graceful degrade per locked decision #7 — hides entirely on failure.
 */

import * as React from "react";
import { Sparkles, Wand2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useAgent } from "@/lib/hooks/use-agent";
import type { ReviewAssistantInput, ReviewAssistantOutput } from "@/lib/ai";

export interface AiRubricAssistProps {
  /** Used as part of the cache key. */
  reviewId: string;
  taskBrief: string;
  criteria: Array<{ id: string; label: string }>;
  evidence: Array<{ name: string; size: number }>;
  /** Mentor's current scores — used to dim already-matched suggestions. */
  appliedScores: Record<string, number>;
  /** Pipe a suggestion into the mentor's rubric state. */
  onApplySuggestion: (criterionId: string, score: number) => void;
}

function confidenceBand(c: number): "high" | "medium" | "low" {
  return c >= 0.85 ? "high" : c >= 0.65 ? "medium" : "low";
}

function bandTone(band: "high" | "medium" | "low") {
  switch (band) {
    case "high":
      return "bg-forest-50 text-forest-700 ring-forest-200";
    case "medium":
      return "bg-gold-50 text-gold-700 ring-gold-200";
    case "low":
      return "bg-gray-50 text-gray-500 ring-gray-200";
  }
}

export function AiRubricAssist(props: AiRubricAssistProps) {
  const {
    reviewId,
    taskBrief,
    criteria,
    evidence,
    appliedScores,
    onApplySuggestion,
  } = props;

  // Cache key — re-fetches when criteria or evidence change meaningfully.
  const requestId = `review-${reviewId}-c${criteria.length}-e${evidence.length}`;

  const { data, isFetching } = useAgent<
    ReviewAssistantInput,
    ReviewAssistantOutput
  >({
    agentId: "review-assistant",
    promptName: "score-rubric",
    variables: {
      taskBrief,
      criteria: criteria.map((c) => ({ id: c.id, label: c.label })),
      evidence: evidence.map((e) => ({ name: e.name, size: e.size })),
    },
    requestId,
    enabled: Boolean(reviewId) && criteria.length > 0,
  });

  // Hide until first successful response — per "summoned, not pushed."
  if (!data || !data.ok) return null;
  const suggestions = data.response.output.suggestions ?? [];
  if (suggestions.length === 0) return null;

  const overallBand = confidenceBand(data.response.confidence);

  // Map criterion id → label for nicer display
  const labelById = new Map(criteria.map((c) => [c.id, c.label]));

  // Apply-all helper: only for criteria not yet manually scored
  const unscoredSuggestions = suggestions.filter(
    (s) => appliedScores[s.criterionId] === undefined,
  );
  function applyAll() {
    unscoredSuggestions.forEach((s) => {
      onApplySuggestion(s.criterionId, s.score);
    });
  }

  return (
    <div
      className="card-parchment"
      style={{
        background:
          "linear-gradient(180deg, var(--color-teal-50) 0%, white 100%)",
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid var(--border-soft)" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-teal-100 text-teal-700"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={2} />
          </span>
          <span className="text-sm font-semibold text-gray-800">
            AI rubric assist
          </span>
          <span
            className={cn(
              "inline-flex items-center text-[9.5px] font-bold uppercase tracking-wide px-1.5 h-[18px] rounded leading-none ring-1",
              bandTone(overallBand),
            )}
            title={`Agent confidence: ${(data.response.confidence * 100).toFixed(0)}%`}
          >
            {overallBand}
          </span>
          {isFetching && (
            <span className="text-[10.5px] text-gray-400">refreshing…</span>
          )}
        </div>
        {unscoredSuggestions.length > 1 && (
          <button
            type="button"
            onClick={applyAll}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-800 transition-colors"
          >
            <Wand2 className="w-3 h-3" strokeWidth={2} />
            Apply all {unscoredSuggestions.length}
          </button>
        )}
      </div>

      <div className="py-1">
        {suggestions.map((s, i) => {
          const label = labelById.get(s.criterionId) ?? s.criterionId;
          const applied = appliedScores[s.criterionId] === s.score;
          const overridden =
            appliedScores[s.criterionId] !== undefined &&
            appliedScores[s.criterionId] !== s.score;
          const band = confidenceBand(s.confidence);
          return (
            <div
              key={s.criterionId}
              className="flex items-center gap-3 px-5 py-3"
              style={{
                borderBottom:
                  i < suggestions.length - 1
                    ? "1px solid var(--border-hair)"
                    : undefined,
              }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12.5px] font-semibold text-gray-700 truncate">
                    {label}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center text-[9.5px] font-bold uppercase tracking-wide px-1.5 h-[16px] rounded leading-none ring-1",
                      bandTone(band),
                    )}
                    title={`Confidence: ${(s.confidence * 100).toFixed(0)}%`}
                  >
                    {band}
                  </span>
                  {overridden && (
                    <span className="text-[9.5px] font-semibold uppercase tracking-wide text-gold-700">
                      overridden
                    </span>
                  )}
                </div>
                {s.sources && s.sources.length > 0 && (
                  <div className="mt-0.5 text-[10.5px] text-gray-400 truncate">
                    Sources: {s.sources.slice(0, 3).join(" · ")}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[20px] font-semibold text-gray-700 tabular-nums leading-none">
                  {s.score}
                </span>
                <button
                  type="button"
                  onClick={() => onApplySuggestion(s.criterionId, s.score)}
                  disabled={applied}
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg ring-1 transition-colors",
                    applied
                      ? "bg-forest-50 text-forest-700 ring-forest-200 cursor-default"
                      : "bg-white text-teal-700 ring-teal-200 hover:bg-teal-50",
                  )}
                  title={applied ? "Applied" : "Apply AI suggestion"}
                >
                  {applied ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                      Applied
                    </>
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {data.response.coverageGaps && data.response.coverageGaps.length > 0 && (
        <div
          className="px-5 py-2.5 text-[10.5px] text-gray-500"
          style={{ borderTop: "1px solid var(--border-hair)" }}
        >
          <span className="font-semibold text-gray-600">Coverage gaps:</span>{" "}
          {data.response.coverageGaps.join(" · ")}
        </div>
      )}
    </div>
  );
}
