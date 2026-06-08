"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorPageHeader,
  ContributorSectionHeader,
} from "./primitives";

/**
 * Operational placeholder primitive.
 *
 * Drop-in for surfaces whose deep IA is approved but full screen hasn't
 * landed yet. Visually presents as a real operational page (KPI tiles,
 * manages list, next-action CTAs, related workflows) — never reads as
 * "Coming soon." The contributor sees a working surface, not a waiting
 * room.
 */

export interface OperationalSummaryCard {
  label: string;
  value: string;
  helper: string;
  tone?: "teal" | "forest" | "gold" | "beige" | "brown";
  Icon?: LucideIcon;
}

export interface OperationalAction {
  label: string;
  helper: string;
  href: string;
  Icon?: LucideIcon;
  primary?: boolean;
}

export interface OperationalRelated {
  label: string;
  href: string;
}

export interface OperationalPlaceholderProps {
  section: string;
  title: string;
  purpose: string;
  summaryCards?: OperationalSummaryCard[];
  manages: string[];
  nextActions: OperationalAction[];
  relatedWorkflows?: OperationalRelated[];
  helperNote?: string;
}

export function OperationalPlaceholder({
  section,
  title,
  purpose,
  summaryCards = [],
  manages,
  nextActions,
  relatedWorkflows = [],
  helperNote,
}: OperationalPlaceholderProps) {
  return (
    <div className="space-y-6 pb-12">
      <ContributorPageHeader eyebrow={section} title={title} subtitle={purpose} />

      {/* Summary cards */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summaryCards.map((c) => (
            <SummaryTile key={c.label} card={c} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6">
        {/* What this manages */}
        <ContributorCard>
          <ContributorSectionHeader
            title={`What ${title} manages`}
            caption="Operational responsibilities this surface owns."
          />
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {manages.map((m) => (
              <li
                key={m}
                className="flex items-start gap-2 text-[12.5px] text-brown-900 leading-snug"
              >
                <span className="mt-[7px] h-1 w-1 rounded-full bg-teal-500 shrink-0" />
                {m}
              </li>
            ))}
          </ul>
          {helperNote && (
            <p className="mt-5 pt-4 border-t border-beige-100 text-[12px] text-beige-700 leading-relaxed">
              {helperNote}
            </p>
          )}
        </ContributorCard>

        {/* Next actions */}
        <ContributorCard>
          <ContributorSectionHeader
            title="Next actions"
            caption="Where you can move from here right now."
          />
          <ul className="space-y-1.5">
            {nextActions.map((a) => {
              const Icon = a.Icon;
              return (
                <li key={a.label}>
                  <Link
                    href={a.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 transition-colors group",
                      a.primary
                        ? "border-teal-200 bg-teal-50/40 hover:bg-teal-50 hover:border-teal-300"
                        : "border-beige-100 bg-beige-50/30 hover:bg-beige-50 hover:border-beige-200",
                    )}
                  >
                    {Icon && (
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                          a.primary
                            ? "bg-teal-100 text-teal-700"
                            : "bg-white border border-beige-200 text-brown-700",
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-brown-950 leading-tight">
                        {a.label}
                      </p>
                      <p className="text-[10.5px] text-beige-600 mt-0.5 leading-snug">
                        {a.helper}
                      </p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-beige-400 group-hover:text-beige-700 transition-colors shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </ContributorCard>
      </div>

      {/* Related workflows */}
      {relatedWorkflows.length > 0 && (
        <ContributorCard variant="soft">
          <ContributorSectionHeader
            title="Related workflows"
            caption="Pages in the contributor portal that touch this surface."
          />
          <div className="flex flex-wrap gap-2">
            {relatedWorkflows.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-brown-900 hover:border-teal-300 hover:bg-teal-50/40"
              >
                {r.label}
                <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </ContributorCard>
      )}
    </div>
  );
}

function SummaryTile({ card }: { card: OperationalSummaryCard }) {
  const tone = card.tone ?? "teal";
  const palette = {
    teal: { border: "border-teal-200", ring: "ring-teal-200 bg-teal-50", tint: "text-teal-700" },
    forest: { border: "border-forest-200", ring: "ring-forest-200 bg-forest-50", tint: "text-forest-700" },
    gold: { border: "border-gold-200", ring: "ring-gold-200 bg-gold-50", tint: "text-gold-800" },
    beige: { border: "border-beige-200", ring: "ring-beige-200 bg-beige-50", tint: "text-beige-700" },
    brown: { border: "border-brown-200", ring: "ring-brown-200 bg-brown-50", tint: "text-brown-800" },
  }[tone];
  const Icon = card.Icon;
  return (
    <div className={cn("rounded-xl border bg-white px-3.5 py-3 flex items-start gap-2.5", palette.border)}>
      {Icon && (
        <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl ring-2 ring-white shrink-0", palette.ring)}>
          <Icon className={cn("h-4 w-4", palette.tint)} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-beige-600">
          {card.label}
        </p>
        <p className="font-heading text-[20px] font-semibold text-brown-950 mt-0.5 leading-none tabular-nums">
          {card.value}
        </p>
        <p className="text-[10.5px] text-beige-600 mt-1 leading-snug">{card.helper}</p>
      </div>
    </div>
  );
}
