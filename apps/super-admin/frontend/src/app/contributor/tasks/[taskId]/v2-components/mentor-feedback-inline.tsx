"use client";

import * as React from "react";
import Link from "next/link";
import {
  Heart,
  CheckCircle2,
  Circle,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
  AiGlyph,
} from "@/app/contributor/_shared/primitives";
import type { WorkroomTask } from "@/mocks/data/contributor-workroom-detail";

interface MentorFeedbackInlineProps {
  task: WorkroomTask;
}

/**
 * Mentor Feedback Inline — three-block structure inside the workroom.
 *
 * 1. What worked (forest, italics)
 * 2. To polish (checklist with checkboxes per correction)
 * 3. Optional suggestions (neutral)
 *
 * This is the contributor's interpretation of mentor feedback. The data is
 * the same as what the mentor wrote — the framing is different.
 */
export function MentorFeedbackInline({ task }: MentorFeedbackInlineProps) {
  const fb = task.mentorFeedback;
  if (!fb?.received) return null;

  const corrections = fb.requiredCorrections ?? [];
  const addressed = corrections.filter((c) => c.addressed).length;

  return (
    <ContributorCard padded={false} className="p-5">
      <ContributorSectionHeader
        title="Feedback from your mentor"
        caption={`${fb.mentorName} · ${fb.receivedAt}`}
        trailing={
          <div className="flex items-center gap-1.5">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-brown-900 hover:bg-beige-50/60">
              <MessageSquare className="h-3.5 w-3.5" />
              Ask a clarifying question
            </button>
            {corrections.length > 0 && (
              <Link
                href={`/contributor/tasks/${task.id}/revision`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-teal-700"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Open revision flow
              </Link>
            )}
          </div>
        }
      />

      {/* What worked */}
      {fb.whatWorked && (
        <div className="rounded-xl border border-forest-200 bg-forest-50/40 px-4 py-3">
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-forest-700">
            <Heart className="h-3 w-3" />
            What worked
          </p>
          <p className="mt-1.5 text-[12.5px] text-brown-900 leading-relaxed italic">
            &ldquo;{fb.whatWorked}&rdquo;
          </p>
        </div>
      )}

      {/* Corrections checklist */}
      {corrections.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700">
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
                  "rounded-lg border px-3.5 py-2.5 transition-colors",
                  c.addressed
                    ? "border-forest-200 bg-forest-50/30"
                    : "border-beige-200 bg-white"
                )}
              >
                <div className="flex items-start gap-2.5">
                  <button
                    type="button"
                    className={cn(
                      "shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
                      c.addressed
                        ? "border-forest-300 bg-forest-100 text-forest-700"
                        : "border-beige-300 bg-white text-beige-400 hover:border-beige-400"
                    )}
                    aria-label="Toggle correction addressed"
                  >
                    {c.addressed ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-[12.5px] font-semibold",
                        c.addressed ? "text-forest-800" : "text-brown-950"
                      )}
                    >
                      {c.criterion}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[12px] leading-relaxed",
                        c.addressed ? "text-forest-700" : "text-brown-800"
                      )}
                    >
                      {c.description}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Optional suggestions */}
      {fb.suggestions && fb.suggestions.length > 0 && (
        <div className="mt-3">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700 mb-1.5">
            Optional suggestions
          </p>
          <ul className="space-y-1">
            {fb.suggestions.map((s, i) => (
              <li
                key={i}
                className="rounded-lg border border-beige-200 bg-beige-50/40 px-3 py-2 text-[12px] text-brown-800"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI starting point */}
      <div className="mt-4 pt-3 border-t border-beige-200/70 flex items-start gap-2 text-[12px] text-brown-800">
        <AiGlyph className="mt-0.5 shrink-0" />
        <span className="leading-snug">
          <span className="font-semibold text-teal-800">Tip: </span>
          You can tick each correction off as you address it. Your checkmarks are private — they help you track
          progress, but they don't reach the mentor.
        </span>
      </div>
    </ContributorCard>
  );
}
