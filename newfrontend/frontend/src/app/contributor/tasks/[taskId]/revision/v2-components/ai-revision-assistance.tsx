"use client";

import * as React from "react";
import { ChevronDown, ChevronRight, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  AiGlyph,
  AiSuggestionConfidence,
  ContributorCard,
  ContributorSectionHeader,
} from "@/app/contributor/_shared/primitives";
import type { WorkroomAiSuggestion } from "@/mocks/data/contributor-workroom-detail";

export function AiRevisionAssistance({
  suggestions,
}: {
  suggestions: WorkroomAiSuggestion[];
}) {
  const [open, setOpen] = React.useState(false);

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
              {suggestions.length} suggestions · summoned, never pushed
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
        <div className="px-5 pb-5 -mt-1 space-y-2.5">
          <ContributorSectionHeader
            title="Suggestions for this revision"
            caption="Each one is sourced and overridable. Take what helps, ignore the rest."
            trailing={
              <span className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-[1px] text-[10.5px] font-semibold text-teal-800">
                <Wand2 className="h-3 w-3" />
                Sourced
              </span>
            }
          />
          <ul className="space-y-2.5">
            {suggestions.map((s) => (
              <li
                key={s.id}
                className={cn(
                  "rounded-xl border border-teal-200/70 bg-white px-3.5 py-2.5"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[13px] font-semibold text-brown-950 leading-tight">
                    {s.title}
                  </p>
                  <AiSuggestionConfidence level={s.confidence} />
                </div>
                <p className="text-[12.5px] text-brown-900 leading-relaxed">{s.detail}</p>
                {s.cta && (
                  <button
                    type="button"
                    className="mt-2 text-[11.5px] font-semibold text-teal-700 hover:text-teal-800"
                  >
                    {s.cta} →
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </ContributorCard>
  );
}
