"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ExternalLink,
  Heart,
  Quote,
  Sparkle,
  Share2,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
} from "@/app/contributor/_shared/primitives";
import type { CompletedWorkItem } from "@/mocks/data/contributor-completed-work";

export function CompletedGrid({ items }: { items: CompletedWorkItem[] }) {
  if (items.length === 0) {
    return (
      <ContributorCard variant="soft">
        <div className="py-8 text-center">
          <p className="font-heading text-[14px] font-semibold text-brown-950">
            Nothing matches that filter
          </p>
          <p className="text-[12.5px] text-beige-700 mt-1">
            Clear the search or relax a filter to see more delivered work.
          </p>
        </div>
      </ContributorCard>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((c) => (
        <ItemCard key={c.id} item={c} />
      ))}
    </div>
  );
}

function ItemCard({ item: c }: { item: CompletedWorkItem }) {
  return (
    <article className="rounded-2xl border border-beige-200 bg-white px-5 py-4 hover:border-beige-300 transition-colors flex flex-col">
      <header className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="inline-flex items-center rounded-full border border-forest-200 bg-forest-50 px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wide text-forest-700">
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
              Accepted
            </span>
            {c.firstTryAccept && (
              <span className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-1.5 py-[1px] text-[9.5px] font-bold uppercase tracking-wide text-teal-800">
                <Sparkle className="h-2.5 w-2.5 mr-0.5" />
                First-try
              </span>
            )}
            <span className="text-[10.5px] text-beige-600 tabular-nums">{c.acceptedAt}</span>
          </div>
          <h3 className="font-heading text-[14px] font-semibold text-brown-950 leading-tight">
            {c.title}
          </h3>
          <p className="text-[11.5px] text-beige-700 mt-0.5 leading-snug">{c.shortSummary}</p>
        </div>
        <Link
          href={`/contributor/tasks/${c.taskId}`}
          className="inline-flex items-center gap-1 rounded-lg border border-beige-200 bg-white px-2 py-1 text-[11px] font-semibold text-brown-900 hover:border-teal-300 hover:bg-teal-50/40 shrink-0"
          title="Open original workroom"
        >
          <ExternalLink className="h-3 w-3" />
        </Link>
      </header>

      {/* Mentor quote */}
      <div className="rounded-xl border border-forest-200/70 bg-forest-50/30 px-3 py-2.5 mb-3">
        <div className="flex items-start gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-forest-100 text-forest-700 shrink-0">
            <Heart className="h-3 w-3" fill="currentColor" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-forest-700 inline-flex items-center gap-1">
              <Quote className="h-2.5 w-2.5" />
              What worked · {c.mentor.name}
            </p>
            <p className="text-[12px] text-brown-900 italic mt-1 leading-relaxed">
              &ldquo;{c.whatWorked}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Meta row */}
      <dl className="grid grid-cols-2 gap-2 text-[10.5px] mb-3">
        <Meta label="Project" value={c.project} />
        <Meta label="Skill" value={`${c.skill} · ${c.skillLevel}`} />
        <Meta label="Portfolio" value={c.portfolio} />
        <Meta label="Rounds" value={`${c.rounds} ${c.rounds === 1 ? "round" : "rounds"}`} />
      </dl>

      {/* Footer */}
      <footer className="mt-auto pt-3 border-t border-beige-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {c.credential && (
            <Link
              href={`/contributor/credentials/${c.credential.shareId ?? ""}`}
              className="inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2 py-[1px] text-[10.5px] font-semibold text-teal-800 hover:bg-teal-100"
            >
              <Award className="h-3 w-3" />
              {c.credential.name}
            </Link>
          )}
          {c.portfolioEligible && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-[1px] text-[10.5px] font-semibold",
                c.portfolioShared
                  ? "border-forest-200 bg-forest-50 text-forest-700"
                  : "border-beige-200 bg-beige-50 text-beige-700",
              )}
            >
              <Share2 className="h-3 w-3" />
              {c.portfolioShared ? "Public" : "Eligible"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brown-900 tabular-nums">
            <Wallet className="h-3 w-3 text-beige-500" />
            {c.payoutAmount}
          </span>
          <Link
            href={`/contributor/tasks/${c.taskId}`}
            className="inline-flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-teal-700"
          >
            Workroom
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </footer>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-beige-50/40 border border-beige-100 px-2 py-1.5">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-beige-600">{label}</dt>
      <dd className="text-[11.5px] font-semibold text-brown-900 leading-tight truncate">{value}</dd>
    </div>
  );
}
