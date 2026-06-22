"use client";

import * as React from "react";
import { Construction, ArrowRight } from "lucide-react";
import {
  ContributorPageHeader,
  ContributorContextChip,
  ContributorCard,
  AiGlyph,
} from "./primitives";

interface ContributorPlaceholderProps {
  /** Section label (e.g., "Work Execution", "Growth"). */
  section: string;
  /** Page title (e.g., "Revisions", "Skill Ladder"). */
  title: string;
  /** Short, friendly description of what the page will do. */
  description: string;
  /** Bullet list of what the page will surface when built. */
  willInclude: string[];
  /** Optional related links to nudge the contributor to existing surfaces. */
  relatedLinks?: { label: string; href: string }[];
  /** Optional friendly note to the contributor (e.g., AI tip). */
  helperNote?: string;
}

/**
 * Shared placeholder for every reorganized Contributor Portal V2 route that
 * hasn't been built yet. Keeps the page header + chip system + warm
 * card-forward layout consistent across the portal during the rollout.
 *
 * Tone is friendly and forward-looking — never apologetic.
 */
export function ContributorPlaceholder({
  section,
  title,
  description,
  willInclude,
  relatedLinks,
  helperNote,
}: ContributorPlaceholderProps) {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <ContributorPageHeader
        eyebrow={section}
        title={title}
        subtitle={description}
        contextChips={
          <>
            <ContributorContextChip label="Section" value={section} active />
            <ContributorContextChip label="Phase" value="Coming soon" />
          </>
        }
      />

      <ContributorCard padded={false} className="p-6 md:p-8">
        <div className="flex items-start gap-4">
          <span className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-200 bg-teal-50 text-teal-700">
            <Construction className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-teal-700">
              Coming next · Contributor Portal V2
            </p>
            <h2 className="font-heading text-[18px] font-semibold text-brown-950 mt-1.5 leading-tight">
              We&rsquo;re polishing this surface
            </h2>
            <p className="mt-2 text-[13px] text-beige-800 max-w-2xl leading-relaxed">
              The shape of this page is approved — the actual screen lands in the next implementation
              phase. Until then, the dashboard, workload queue, workroom, and submission flow cover the
              core daily workflow.
            </p>

            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-beige-700">
                What this page will include
              </p>
              <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5">
                {willInclude.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-[12.5px] text-brown-900">
                    <span className="mt-1.5 h-1 w-1 rounded-full bg-teal-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {helperNote && (
              <div className="mt-5 flex items-start gap-2 text-[12px] text-brown-800">
                <AiGlyph className="mt-0.5 shrink-0" />
                <span className="leading-relaxed">{helperNote}</span>
              </div>
            )}

            {relatedLinks && relatedLinks.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {relatedLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50/60 px-3 py-1.5 text-[12px] font-semibold text-teal-800 hover:bg-teal-100"
                  >
                    {l.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </ContributorCard>
    </div>
  );
}
