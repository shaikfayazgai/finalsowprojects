"use client";

import * as React from "react";
import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import {
  ContributorCard,
  ContributorSectionHeader,
  ReadinessBar,
} from "@/app/contributor/_shared/primitives";
import type { MentorCorrection } from "@/mocks/data/contributor-workspace";

export function RevisionProgressCard({
  corrections,
  resolvedMap,
}: {
  corrections: MentorCorrection[];
  resolvedMap: Record<string, boolean>;
}) {
  const total = corrections.length;
  const done = corrections.filter((c) => resolvedMap[c.id]).length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <ContributorCard>
      <ContributorSectionHeader
        title="Correction progress"
        caption={
          done === total
            ? "All addressed — finish the readiness check below."
            : `${total - done} remaining`
        }
        trailing={
          <span className="inline-flex items-center gap-1 rounded-full border border-beige-200 bg-beige-50 px-2 py-[1px] text-[10.5px] font-semibold text-beige-700">
            <ListChecks className="h-3 w-3" />
            {done} / {total}
          </span>
        }
      />
      <ReadinessBar value={pct} />
      <ul className="mt-4 space-y-2">
        {corrections.map((c) => {
          const resolved = !!resolvedMap[c.id];
          return (
            <li key={c.id} className="flex items-start gap-2.5">
              {resolved ? (
                <CheckCircle2 className="h-4 w-4 text-forest-600 shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-4 w-4 text-beige-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-brown-900 leading-tight">
                  {c.criterion}
                </p>
                <p className="text-[11px] text-beige-600 leading-snug truncate">
                  {c.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </ContributorCard>
  );
}
