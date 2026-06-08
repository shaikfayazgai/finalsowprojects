"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Circle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  AiGlyph,
  AiSuggestionConfidence,
} from "@/app/contributor/_shared/primitives";
import type { WorkroomTask } from "@/mocks/data/contributor-workroom-detail";

interface AiSubmissionCheckProps {
  task: WorkroomTask;
}

interface PreSubmitCheck {
  id: string;
  kind: "coverage" | "evidence" | "polish" | "consistency" | "tone";
  status: "ok" | "watch" | "suggest";
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
}

const kindMeta: Record<
  PreSubmitCheck["kind"],
  { label: string; Icon: LucideIcon }
> = {
  coverage: { label: "Spec coverage", Icon: CheckCircle2 },
  evidence: { label: "Evidence", Icon: Sparkles },
  polish: { label: "Polish", Icon: Sparkles },
  consistency: { label: "Consistency", Icon: Sparkles },
  tone: { label: "Tone", Icon: Sparkles },
};

/**
 * AI Submission Check — summoned, not pushed.
 *
 * Mirrors the mentor portal's audit-grade AI but reframed for contributor
 * confidence: scans the submission against acceptance criteria, identifies
 * polish opportunities, surfaces consistency notes. Every claim is a
 * starting point — never a block.
 */
export function AiSubmissionCheck({ task }: AiSubmissionCheckProps) {
  const [open, setOpen] = React.useState(false);

  const checks = React.useMemo<PreSubmitCheck[]>(
    () => buildChecks(task),
    [task]
  );

  const okCount = checks.filter((c) => c.status === "ok").length;
  const watchCount = checks.filter((c) => c.status === "watch").length;
  const suggestCount = checks.filter((c) => c.status === "suggest").length;

  return (
    <ContributorCard
      padded={false}
      className={cn(
        "p-5 transition-shadow",
        open && "shadow-[0_4px_20px_-12px_rgba(91,155,162,0.3)]"
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 text-left"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-teal-700">
          <AiGlyph className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-[15.5px] font-semibold text-brown-950 leading-tight">
            Pre-submit check from AI
          </p>
          <p className="text-[11.5px] text-beige-700 mt-0.5">
            <span className="tabular-nums font-semibold text-teal-700">{checks.length}</span> observations ·{" "}
            <span className="tabular-nums font-semibold text-forest-700">{okCount}</span> looking good,{" "}
            <span className="tabular-nums font-semibold text-gold-700">{watchCount}</span> worth a glance,{" "}
            <span className="tabular-nums font-semibold text-beige-700">{suggestCount}</span> polish ideas
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
        <>
          <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {checks.map((c) => (
              <li key={c.id}>
                <CheckCard check={c} />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10.5px] text-beige-600 italic leading-snug">
            None of these block submission. They're a friend reading over your shoulder — take what's helpful,
            ignore the rest.
          </p>
        </>
      )}
    </ContributorCard>
  );
}

function CheckCard({ check }: { check: PreSubmitCheck }) {
  const meta = kindMeta[check.kind];
  const Icon = meta.Icon;
  const tone =
    check.status === "ok"
      ? {
          border: "border-forest-200",
          bg: "bg-forest-50/30",
          chip: "border-forest-200 bg-forest-50 text-forest-700",
          statusIcon: CheckCircle2,
          statusColor: "text-forest-600",
        }
      : check.status === "watch"
      ? {
          border: "border-gold-200",
          bg: "bg-gold-50/30",
          chip: "border-gold-200 bg-gold-50 text-gold-800",
          statusIcon: AlertCircle,
          statusColor: "text-gold-600",
        }
      : {
          border: "border-teal-200",
          bg: "bg-teal-50/30",
          chip: "border-teal-200 bg-teal-50 text-teal-700",
          statusIcon: Circle,
          statusColor: "text-teal-600",
        };
  const StatusIcon = tone.statusIcon;

  return (
    <div className={cn("rounded-xl border px-3.5 py-3", tone.border, tone.bg)}>
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wider",
            tone.chip
          )}
        >
          <Icon className="h-2.5 w-2.5" />
          {meta.label}
        </span>
        <AiSuggestionConfidence level={check.confidence} />
      </div>
      <div className="mt-2 flex items-start gap-2">
        <StatusIcon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", tone.statusColor)} />
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-semibold text-brown-950 leading-snug">{check.title}</p>
          <p className="mt-1 text-[11.5px] text-beige-800 leading-relaxed">{check.detail}</p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Heuristics ─────────────────────── */

/**
 * Build the AI checks from the task. In Phase 2 this becomes a model call;
 * for now it's deterministic heuristics over the mock shape.
 */
function buildChecks(task: WorkroomTask): PreSubmitCheck[] {
  const checks: PreSubmitCheck[] = [];

  const addressedCriteria = task.acceptanceCriteria.filter((c) => c.addressed).length;
  const coveragePct = Math.round((addressedCriteria / task.acceptanceCriteria.length) * 100);
  checks.push({
    id: "coverage",
    kind: "coverage",
    status: coveragePct >= 85 ? "ok" : coveragePct >= 60 ? "watch" : "suggest",
    title: `Spec coverage at ${coveragePct}%`,
    detail:
      coveragePct >= 85
        ? "You've covered most of the acceptance criteria. Strong signal for a clean accept."
        : coveragePct >= 60
        ? "Worth a final pass to make sure the remaining criteria have at least a draft."
        : "Plenty submitted at lower coverage — but the unaddressed criteria are usually the fastest accept wins.",
    confidence: coveragePct >= 85 ? "high" : "medium",
  });

  const evidencePct = Math.round(
    (task.evidence.completeCount / task.evidence.requiredCount) * 100
  );
  checks.push({
    id: "evidence",
    kind: "evidence",
    status: evidencePct >= 80 ? "ok" : evidencePct >= 50 ? "watch" : "suggest",
    title: `${task.evidence.artifacts.length} artifact${
      task.evidence.artifacts.length === 1 ? "" : "s"
    } in the evidence package`,
    detail:
      evidencePct >= 80
        ? "Mentors usually accept evidence packs like this on the first review."
        : "A couple more required artifacts would put this comfortably in 'clean accept' territory.",
    confidence: "high",
  });

  if (task.mentorFeedback?.received) {
    const open = task.mentorFeedback.requiredCorrections?.filter((c) => !c.addressed).length ?? 0;
    checks.push({
      id: "polish",
      kind: "polish",
      status: open === 0 ? "ok" : "watch",
      title:
        open === 0
          ? "All mentor polish items addressed"
          : `${open} polish item${open === 1 ? "" : "s"} still open`,
      detail:
        open === 0
          ? "Every required correction from the previous round is marked done. Strong v3 setup."
          : "Submitting with open polish items is fine — your mentor will see your progress and respond.",
      confidence: "high",
    });
  }

  if (task.draft.notes && task.draft.notes.length > 30) {
    checks.push({
      id: "consistency",
      kind: "consistency",
      status: "ok",
      title: "Working notes will be shared (if you've opted in)",
      detail:
        "Mentors often find working notes give helpful context — toggle the share option in the workroom if you want to include them.",
      confidence: "medium",
    });
  }

  checks.push({
    id: "tone",
    kind: "tone",
    status: "suggest",
    title: "A short note to your mentor can boost confidence",
    detail:
      "One line about what you focused on or any tradeoffs you made tends to land well — totally optional.",
    confidence: "low",
  });

  return checks;
}
