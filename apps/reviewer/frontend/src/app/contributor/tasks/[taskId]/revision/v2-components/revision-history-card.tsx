"use client";

import * as React from "react";
import { Clock3 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
} from "@/app/contributor/_shared/primitives";
import type { RevisionRoundSummary } from "@/mocks/data/contributor-workroom-detail";

const outcomeTone = {
  passed: { chip: "border-forest-200 bg-forest-50 text-forest-700", label: "Accepted" },
  failed: { chip: "border-gold-200 bg-gold-50 text-gold-800", label: "Revision requested" },
  in_revision: { chip: "border-teal-200 bg-teal-50 text-teal-800", label: "In revision" },
  withdrawn: { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "Withdrawn" },
} as const;

export function RevisionHistoryCard({
  rounds,
}: {
  rounds: RevisionRoundSummary[];
}) {
  return (
    <ContributorCard>
      <ContributorSectionHeader
        title="Submission history"
        caption="What you delivered each round."
        trailing={
          <span className="inline-flex items-center gap-1 rounded-full border border-beige-200 bg-beige-50 px-2 py-[1px] text-[10.5px] font-semibold text-beige-700">
            <Clock3 className="h-3 w-3" />
            {rounds.length} {rounds.length === 1 ? "round" : "rounds"}
          </span>
        }
      />
      <ol className="space-y-3">
        {rounds.map((r) => {
          const tone = outcomeTone[r.outcome];
          return (
            <li
              key={r.round}
              className="rounded-xl border border-beige-200 bg-beige-50/30 px-3.5 py-3"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-heading text-[13px] font-semibold text-brown-950">
                  Round {r.round}
                </p>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-[1px] text-[10px] font-semibold tracking-wide",
                    tone.chip
                  )}
                >
                  {tone.label}
                </span>
              </div>
              <p className="text-[11px] text-beige-600">{r.submittedAt}</p>
              {r.mentorNote && (
                <p className="text-[12px] text-brown-900 mt-1.5 leading-relaxed italic">
                  &ldquo;{r.mentorNote}&rdquo;
                </p>
              )}
              {r.changedAreas.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {r.changedAreas.map((c, i) => (
                    <li key={i} className="text-[11.5px] text-brown-900 leading-snug">
                      · {c}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>
    </ContributorCard>
  );
}
