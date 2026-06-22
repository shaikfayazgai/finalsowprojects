"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  Send,
  Lightbulb,
  Sparkles,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  AiGlyph,
  AiSuggestionConfidence,
} from "@/app/contributor/_shared/primitives";

interface WorkloadAiSuggestion {
  id: string;
  kind: "priority" | "deadline_risk" | "ready_to_submit" | "next_task";
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  cta?: string;
  taskId?: string;
}

const kindMeta: Record<
  WorkloadAiSuggestion["kind"],
  { label: string; Icon: LucideIcon }
> = {
  priority: { label: "What to tackle first", Icon: Lightbulb },
  deadline_risk: { label: "Watch the clock", Icon: Clock },
  ready_to_submit: { label: "Ready to submit", Icon: Send },
  next_task: { label: "After this", Icon: Sparkles },
};

const workloadSuggestions: WorkloadAiSuggestion[] = [
  {
    id: "ws1",
    kind: "ready_to_submit",
    title: "Stripe webhook handler · 8 hours to deadline",
    detail:
      "Readiness is at 92% with all criteria addressed. A quick final review and you can submit — best ROI on your morning.",
    confidence: "high",
    cta: "Review and submit",
    taskId: "t-6710",
  },
  {
    id: "ws2",
    kind: "priority",
    title: "Focus the date picker before the SDK",
    detail:
      "P0 priority + a mentor revision waiting + 56h to deadline. Tackling this first protects momentum on both.",
    confidence: "high",
    cta: "Open workroom",
    taskId: "t-4821",
  },
  {
    id: "ws3",
    kind: "deadline_risk",
    title: "Auth tokens script — 24h, awaiting clarification",
    detail:
      "If the mentor reply slips past tomorrow morning, consider pausing the SLA from inside the workroom.",
    confidence: "medium",
    cta: "Open conversation",
    taskId: "t-4480",
  },
  {
    id: "ws4",
    kind: "next_task",
    title: "Dashboard charting matches your React L2 strength",
    detail:
      "Once you clear the Stripe webhook, this is a 3-hour task that aligns with your accepted work pattern.",
    confidence: "medium",
    cta: "Review task",
    taskId: "t-2516",
  },
];

/**
 * AI Workload Assistance — summoned, not pushed.
 *
 * Lives at the bottom of the workload page in a collapsed-by-default card.
 * Surfaces AI's view on prioritization, deadline risk, ready-to-submit
 * candidates, and next-task suggestions. Every claim is a starting point,
 * never a directive.
 */
export function AiWorkloadAssistance() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <section>
      <ContributorCard
        padded={false}
        className={cn(
          "p-4 md:p-5 transition-shadow",
          open && "shadow-[0_4px_20px_-12px_rgba(91,155,162,0.3)]"
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="w-full flex items-center gap-3 text-left"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700">
            <AiGlyph className="h-3.5 w-3.5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-heading text-[15px] font-semibold text-brown-950 leading-tight">
              How AI sees your workload
            </p>
            <p className="text-[11.5px] text-beige-700 mt-0.5">
              <strong className="text-teal-700 tabular-nums">{workloadSuggestions.length}</strong>{" "}
              {open ? "starting points below — each one is yours to take or leave" : "starting points ready when you want them"}
            </p>
          </div>
          <div className="shrink-0 inline-flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-beige-200 bg-white px-2 py-[1px] text-[10px] font-semibold text-beige-700">
              Summoned · not pushed
            </span>
            {open ? (
              <ChevronDown className="h-4 w-4 text-beige-600" />
            ) : (
              <ChevronRight className="h-4 w-4 text-beige-600" />
            )}
          </div>
        </button>

        {open && (
          <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {workloadSuggestions.map((s) => (
              <li key={s.id}>
                <SuggestionCard
                  suggestion={s}
                  onAct={(id) => router.push(`/contributor/tasks/${id}`)}
                />
              </li>
            ))}
          </ul>
        )}

        {open && (
          <p className="mt-3 text-[10.5px] text-beige-600 italic leading-snug">
            AI never makes choices for you — it shares observations and a starting point. Your judgment,
            your work, your call.
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
  suggestion: WorkloadAiSuggestion;
  onAct: (id: string) => void;
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

      {suggestion.cta && suggestion.taskId && (
        <button
          type="button"
          onClick={() => onAct(suggestion.taskId!)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-[11.5px] font-semibold text-white hover:bg-teal-700"
        >
          {suggestion.cta}
          <ArrowRight className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
