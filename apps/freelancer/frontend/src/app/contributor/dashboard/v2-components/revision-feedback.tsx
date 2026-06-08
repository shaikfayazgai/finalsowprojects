"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  CheckCircle2,
  Circle,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
  ContributorStateChip,
  AiGlyph,
} from "@/app/contributor/_shared/primitives";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";

/**
 * Revision & Feedback Panel — supportive, confidence-preserving.
 *
 * Lead with what worked. Surface required corrections as a checklist, not a
 * verdict. AI offers a starting point per correction. This is the contributor
 * portal's interpretation of a mentor's review — *guidance, not grading*.
 */
export function RevisionFeedbackPanel() {
  const contributorTasks = useContributorTaskList();
  const router = useRouter();
  const revisions = contributorTasks.filter((t) => t.state === "revision_requested");

  if (revisions.length === 0) {
    return (
      <section>
        <ContributorSectionHeader
          title="Feedback & revisions"
          caption="When mentors leave notes, you'll see them here in a calm, structured way."
        />
        <ContributorCard variant="soft" padded={false} className="p-5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-forest-200 bg-forest-50 text-forest-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-brown-950">No revisions waiting</p>
              <p className="text-[11.5px] text-beige-700">
                You&rsquo;re all clear — keep momentum on your active work.
              </p>
            </div>
          </div>
        </ContributorCard>
      </section>
    );
  }

  return (
    <section>
      <ContributorSectionHeader
        title="Feedback & revisions"
        caption="Polish notes from your mentors — what worked, what to refine."
        trailing={
          <button
            type="button"
            onClick={() => router.push("/contributor/tasks")}
            className="text-[11.5px] font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
          >
            See all
            <ArrowRight className="h-3 w-3" />
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {revisions.map((task) => {
          const feedback = task.mentorFeedback;
          if (!feedback?.received) return null;
          const corrections = feedback.requiredCorrections ?? [];
          const addressed = corrections.filter((c) => c.addressed).length;

          return (
            <ContributorCard key={task.id} padded={false} className="p-5">
              {/* Header */}
              <div className="flex items-center gap-2 flex-wrap">
                <ContributorStateChip state={task.state} size="sm" />
                {task.reworkRound && (
                  <span className="inline-flex items-center rounded-full border border-gold-200 bg-gold-50 px-2 py-[1px] text-[10px] font-semibold text-gold-800">
                    Round {task.reworkRound}/{task.totalRounds}
                  </span>
                )}
                <span className="text-[10.5px] text-beige-600 ml-auto">
                  from {feedback.mentorName} · {feedback.receivedAt}
                </span>
              </div>

              <h3 className="font-heading text-[15.5px] font-semibold text-brown-950 mt-2 leading-tight">
                {task.title}
              </h3>
              <p className="text-[11.5px] text-beige-700 mt-0.5">{task.project}</p>

              {/* What worked — leads */}
              {feedback.whatWorked && (
                <div className="mt-3 rounded-lg border border-forest-200 bg-forest-50/40 px-3.5 py-2.5">
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-forest-700">
                    <Heart className="h-3 w-3" />
                    What worked
                  </p>
                  <p className="mt-1 text-[12px] text-brown-900 leading-relaxed italic">
                    &ldquo;{feedback.whatWorked}&rdquo;
                  </p>
                </div>
              )}

              {/* Required corrections */}
              {corrections.length > 0 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-beige-700">
                      To polish · {corrections.length} item{corrections.length === 1 ? "" : "s"}
                    </p>
                    <span className="text-[10.5px] tabular-nums text-beige-700">
                      {addressed} of {corrections.length} done
                    </span>
                  </div>
                  <ul className="space-y-1.5">
                    {corrections.map((c) => (
                      <li
                        key={c.id}
                        className={cn(
                          "rounded-lg border px-3 py-2",
                          c.addressed
                            ? "border-forest-200 bg-forest-50/30"
                            : "border-beige-200 bg-beige-50/40"
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {c.addressed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-forest-600 shrink-0" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 mt-0.5 text-beige-500 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-brown-900">{c.criterion}</p>
                            <p className="text-[11.5px] text-beige-800 mt-0.5 leading-snug">
                              {c.description}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI helper hint */}
              {task.aiNextAction && (
                <div className="mt-3 flex items-start gap-2 text-[11.5px] text-brown-800">
                  <AiGlyph className="mt-0.5 shrink-0" />
                  <span className="leading-snug">
                    <span className="font-semibold text-teal-800">Starting point: </span>
                    {task.aiNextAction}
                  </span>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-beige-200/70 flex items-center justify-between">
                <p className="text-[11px] text-beige-700">
                  Estimated <strong className="text-brown-900">{Math.round(task.estimatedMinutesRemaining / 60 * 10) / 10}h</strong> of focused work
                </p>
                <button
                  type="button"
                  onClick={() => router.push(`/contributor/tasks/${task.id}/revision`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-teal-700"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Open revision
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </ContributorCard>
          );
        })}
      </div>
    </section>
  );
}
