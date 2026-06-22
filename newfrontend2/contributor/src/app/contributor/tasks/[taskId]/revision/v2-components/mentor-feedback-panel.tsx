"use client";

import * as React from "react";
import { Heart, Lightbulb, Quote } from "lucide-react";
import { ContributorCard } from "@/app/contributor/_shared/primitives";
import type { MentorFeedback } from "@/mocks/data/contributor-workspace";

export function MentorFeedbackPanel({
  feedback,
}: {
  feedback: MentorFeedback;
}) {
  return (
    <ContributorCard className="overflow-hidden p-0">
      {/* What worked — leads */}
      <div className="border-b border-forest-100 bg-gradient-to-br from-forest-50/60 to-white px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-forest-100 text-forest-700 shrink-0">
            <Heart className="h-4 w-4" fill="currentColor" />
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-forest-700">
              What worked
            </p>
            <p className="font-heading text-[14px] font-semibold text-brown-950 mt-0.5 leading-tight">
              {feedback.mentorName} called this out as strong
            </p>
            <p className="text-[13px] text-brown-900 mt-2 leading-relaxed">
              {feedback.whatWorked}
            </p>
          </div>
        </div>
      </div>

      {/* Mentor note context */}
      <div className="px-5 py-3 bg-beige-50/40 border-b border-beige-100">
        <div className="flex items-start gap-2">
          <Quote className="h-3.5 w-3.5 text-beige-500 shrink-0 mt-0.5" />
          <p className="text-[12px] text-beige-700 leading-relaxed">
            Two specific changes needed below. The plan reads supportive — these
            are addressable, not show-stoppers. Take it correction by correction.
          </p>
        </div>
      </div>

      {/* Optional suggestions */}
      {(feedback.suggestions?.length ?? 0) > 0 && (
        <div className="px-5 py-4">
          <div className="flex items-start gap-2.5">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 text-teal-700 shrink-0">
              <Lightbulb className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal-700">
                Optional · suggestions
              </p>
              <p className="text-[12px] text-beige-600 mt-0.5">
                Worth considering — won&apos;t block resubmission.
              </p>
              <ul className="mt-2 space-y-1.5">
                {(feedback.suggestions ?? []).map((s, i) => (
                  <li key={i} className="text-[12.5px] text-brown-900 leading-relaxed">
                    · {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </ContributorCard>
  );
}
