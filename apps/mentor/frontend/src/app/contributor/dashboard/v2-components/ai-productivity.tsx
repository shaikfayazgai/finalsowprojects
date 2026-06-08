"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Lightbulb,
  Sparkles,
  RotateCcw,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
  AiGlyph,
  AiSuggestionConfidence,
} from "@/app/contributor/_shared/primitives";
import { useContributorTasksStore } from "@/lib/stores/contributor-tasks-store";
import {
  deriveWorkloadAiInsights,
  type DerivedAiSuggestion,
} from "@/lib/contributor/derive-ai";

type DashboardSuggestion = {
  id: string;
  kind: DerivedAiSuggestion["kind"];
  title: string;
  detail: string;
  confidence: DerivedAiSuggestion["confidence"];
  cta?: string;
};

const kindMeta: Record<DerivedAiSuggestion["kind"], { label: string; Icon: LucideIcon }> = {
  submission_check: { label: "Submission check", Icon: Send },
  workflow_tip: { label: "Workflow tip", Icon: Lightbulb },
  fix_suggestion: { label: "Revision help", Icon: RotateCcw },
  next_step: { label: "Next step", Icon: Sparkles },
  evidence: { label: "Evidence", Icon: Lightbulb },
};

/**
 * AI Productivity Assistance — collapsed by default.
 *
 * The contract: AI is *summoned, not pushed*. The panel header is always
 * visible (so the contributor knows it's available), but the suggestions
 * collapse to a 1-line count. Click to expand. No chatbot, no avatar,
 * no nagging.
 */
export function AiProductivityPanel() {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const tasksById = useContributorTasksStore((s) => s.tasksById);
  const suggestions: DashboardSuggestion[] = React.useMemo(() => {
    const tasks = Object.values(tasksById);
    return deriveWorkloadAiInsights(tasks).map((s) => ({
      id: s.id,
      kind: s.kind,
      title: s.title,
      detail: s.detail,
      confidence: s.confidence,
      cta: s.cta,
    }));
  }, [tasksById]);
  const aiSuggestions = suggestions;

  return (
    <section>
      <ContributorCard
        padded={false}
        className={cn(
          "p-4 md:p-5 transition-shadow",
          expanded && "shadow-[0_4px_20px_-12px_rgba(91,155,162,0.3)]"
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="w-full flex items-center gap-3 text-left"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700">
            <AiGlyph className="h-3.5 w-3.5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-[15px] font-semibold text-brown-950 leading-tight">
              AI suggestions
            </p>
            <p className="text-[11.5px] text-beige-700 mt-0.5">
              <strong className="text-teal-700 tabular-nums">{aiSuggestions.length}</strong>{" "}
              {expanded ? "open below — auditable starting points" : "suggestions ready when you want them"}
            </p>
          </div>
          <div className="shrink-0 inline-flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-beige-200 bg-white px-2 py-[1px] text-[10px] font-semibold text-beige-700">
              Summoned · not pushed
            </span>
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-beige-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-beige-600" />
            )}
          </div>
        </button>

        {expanded && (
          <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiSuggestions.map((s) => (
              <li key={s.id}>
                <SuggestionCard suggestion={s} onAct={() => router.push("/contributor/tasks")} />
              </li>
            ))}
          </ul>
        )}

        {expanded && (
          <p className="mt-3 text-[10.5px] text-beige-600 italic leading-snug">
            Every suggestion above is a starting point. Take it or leave it — your work, your call. The AI
            never auto-submits or makes changes on your behalf.
          </p>
        )}
      </ContributorCard>
    </section>
  );
}

function SuggestionCard({
  suggestion,
  onAct,
}: {
  suggestion: DashboardSuggestion;
  onAct: () => void;
}) {
  const meta = kindMeta[suggestion.kind];
  const Icon = meta.Icon;
  return (
    <div className="rounded-xl border border-teal-200/80 bg-teal-50/30 px-4 py-3.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-2 py-[1px] text-[10px] font-bold uppercase tracking-wider text-teal-700">
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
        <AiSuggestionConfidence level={suggestion.confidence} />
      </div>

      <p className="mt-2 text-[13px] font-semibold text-brown-950 leading-snug">{suggestion.title}</p>
      <p className="mt-1 text-[11.5px] text-beige-800 leading-relaxed">{suggestion.detail}</p>

      {suggestion.cta && (
        <button
          type="button"
          onClick={onAct}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-teal-700"
        >
          {suggestion.cta}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
