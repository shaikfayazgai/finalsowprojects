"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Sparkle } from "lucide-react";
import {
  AiGlyph,
  AiSuggestionConfidence,
  ContributorCard,
} from "@/app/contributor/_shared/primitives";
import {
  correctionStats,
  urgencyOf,
  type RevisionRow,
} from "@/mocks/data/contributor-revision-queue";

interface CrossInsight {
  id: string;
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  source: string;
}

function buildCrossInsights(rows: RevisionRow[]): CrossInsight[] {
  const insights: CrossInsight[] = [];
  const urgent = rows.filter((r) => urgencyOf(r) === "due_today");
  if (urgent.length > 0) {
    insights.push({
      id: "due-today",
      title: `${urgent.length} revision${urgent.length === 1 ? "" : "s"} due in the next 24h`,
      detail: `Start with ${urgent[0].title} · ${urgent[0].nextRequiredAction.toLowerCase()}.`,
      confidence: "high",
      source: "Due-window scan",
    });
  }

  const stuck = rows.filter((r) => r.state === "awaiting_clarification");
  if (stuck.length > 0) {
    insights.push({
      id: "stuck",
      title: `${stuck.length} revision${stuck.length === 1 ? " is" : "s are"} blocked on mentor reply`,
      detail: `SLA paused. Pick another correction or pre-draft the fix while you wait — first one to come back: ${stuck[0].title}.`,
      confidence: "medium",
      source: "Clarification state",
    });
  }

  const ready = rows.filter((r) => r.state === "ready_for_resubmission");
  if (ready.length > 0) {
    insights.push({
      id: "ready",
      title: `${ready.length} revision${ready.length === 1 ? " is" : "s are"} ready to resubmit`,
      detail: `Send ${ready[0].title} when you're confident — readiness score ${ready[0].readinessScore}.`,
      confidence: "high",
      source: "Readiness scan",
    });
  }

  const heavyLoad = rows
    .filter((r) => r.state !== "resubmitted_under_review")
    .map((r) => ({ r, ...correctionStats(r) }))
    .sort((a, b) => b.unresolved - a.unresolved)[0];
  if (heavyLoad && heavyLoad.unresolved > 1) {
    insights.push({
      id: "heavy",
      title: `${heavyLoad.r.title} has the most unresolved corrections`,
      detail: `${heavyLoad.unresolved} of ${heavyLoad.total} still open. Address them in severity order — must-fix first.`,
      confidence: "medium",
      source: "Correction count · severity weighted",
    });
  }

  insights.push({
    id: "pattern",
    title: "Your accepted-on-first-try pattern is rising",
    detail:
      "Three of your last five revisions closed in a single round. Tightening tests on first submit is the cleanest lever.",
    confidence: "low",
    source: "Last 5 revisions trend",
  });

  return insights;
}

export function RevisionsAiHelper({ rows }: { rows: RevisionRow[] }) {
  const [open, setOpen] = React.useState(false);
  const insights = React.useMemo(() => buildCrossInsights(rows), [rows]);

  return (
    <ContributorCard variant="feature" padded={false} className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <AiGlyph />
          <div className="min-w-0">
            <p className="font-heading text-[14px] font-semibold text-brown-950 leading-tight">
              AI revision assistance
            </p>
            <p className="text-[11.5px] text-beige-700">
              {insights.length} cross-revision observations · summoned, never pushed
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700">
          {open ? (
            <>
              <ChevronDown className="h-4 w-4" /> Hide
            </>
          ) : (
            <>
              <ChevronRight className="h-4 w-4" /> Show
            </>
          )}
        </span>
      </button>

      {open && (
        <ul className="px-5 pb-5 -mt-1 space-y-2.5">
          {insights.map((i) => (
            <li
              key={i.id}
              className="rounded-xl border border-teal-200/70 bg-white px-3.5 py-2.5"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-[13px] font-semibold text-brown-950 inline-flex items-center gap-1.5 leading-tight">
                  <Sparkle className="h-3 w-3 text-teal-600" />
                  {i.title}
                </p>
                <AiSuggestionConfidence level={i.confidence} />
              </div>
              <p className="text-[12px] text-brown-900 leading-relaxed">{i.detail}</p>
              <p className="text-[10.5px] text-teal-700 italic mt-1">Source · {i.source}</p>
            </li>
          ))}
        </ul>
      )}
    </ContributorCard>
  );
}
