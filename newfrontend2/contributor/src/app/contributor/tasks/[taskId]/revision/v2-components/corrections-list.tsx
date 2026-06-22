"use client";

import * as React from "react";
import { ListChecks } from "lucide-react";
import { ContributorSectionHeader } from "@/app/contributor/_shared/primitives";
import type { MentorCorrection } from "@/mocks/data/contributor-workspace";
import type { CorrectionAiHint } from "@/mocks/data/contributor-workroom-detail";
import { CorrectionCard } from "./correction-card";

export function CorrectionsList({
  corrections,
  hints,
  resolvedMap,
  expandedMap,
  onToggleExpand,
  onToggleResolved,
  onAskClarification,
  mentorInitials,
}: {
  corrections: MentorCorrection[];
  hints: CorrectionAiHint[];
  resolvedMap: Record<string, boolean>;
  expandedMap: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  onToggleResolved: (id: string) => void;
  onAskClarification: (id: string) => void;
  mentorInitials: string;
}) {
  const resolvedCount = corrections.filter((c) => resolvedMap[c.id]).length;
  const remaining = corrections.length - resolvedCount;

  return (
    <section>
      <ContributorSectionHeader
        title="Required corrections"
        caption={
          remaining === 0
            ? "All corrections marked addressed. Move on to the readiness check."
            : `${remaining} still to address · take it one at a time`
        }
        trailing={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-beige-200 bg-beige-50 px-2.5 py-1 text-[11px] font-semibold text-beige-700">
            <ListChecks className="h-3.5 w-3.5" />
            {resolvedCount} / {corrections.length}
          </span>
        }
      />
      <div className="space-y-3">
        {corrections.map((c, idx) => (
          <CorrectionCard
            key={c.id}
            index={idx + 1}
            correction={c}
            hint={hints.find((h) => h.correctionId === c.id)}
            resolved={!!resolvedMap[c.id]}
            expanded={!!expandedMap[c.id]}
            onToggleExpand={() => onToggleExpand(c.id)}
            onToggleResolved={() => onToggleResolved(c.id)}
            onAskClarification={onAskClarification}
            mentorInitials={mentorInitials}
          />
        ))}
      </div>
    </section>
  );
}
