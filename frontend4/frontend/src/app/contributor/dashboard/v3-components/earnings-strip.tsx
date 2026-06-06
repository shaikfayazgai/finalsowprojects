"use client";

/**
 * Zone D · Earnings + growth (compact)
 *
 * Four small tiles — earnings this week, this month, acceptance rate,
 * streak. Connected band style (hairline dividers, no card chrome per
 * tile). Same visual weight as a single section, not a hero.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useDerivedEarnings } from "@/lib/contributor/use-derived-earnings";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";

function formatMoney(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function EarningsStrip() {
  const { totals } = useDerivedEarnings();
  const tasks = useContributorTaskList();

  // Accepted-this-week — naive derivation from acceptedAt being within 7 days
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const acceptedThisWeek = tasks.filter((t) => {
    const accepted = t.state === "approved" || t.state === "completed";
    if (!accepted) return false;
    const ts = new Date(t.lastActivityAt).getTime();
    return ts >= oneWeekAgo;
  }).length;

  const totalAccepted = tasks.filter(
    (t) => t.state === "approved" || t.state === "completed",
  ).length;
  const totalReviewed =
    totalAccepted +
    tasks.filter(
      (t) => t.state === "revision_requested" || t.state === "blocked",
    ).length;
  const acceptanceRate =
    totalReviewed > 0 ? Math.round((totalAccepted / totalReviewed) * 100) : 100;

  // Streak — count consecutive accepted tasks from the most-recent end
  const streak = Math.max(0, totalAccepted); // simple approximation

  const tiles = [
    {
      label: "This week",
      value: acceptedThisWeek > 0 ? `${acceptedThisWeek} accepted` : "—",
      hint: acceptedThisWeek > 0 ? "tasks accepted" : "no accepts yet",
    },
    {
      label: "This month",
      value: formatMoney(totals.thisMonth),
      hint: `of ${formatMoney(totals.thisQuarter)} quarter`,
    },
    {
      label: "Acceptance rate",
      value: `${acceptanceRate}%`,
      hint:
        totalReviewed > 0
          ? `${totalAccepted} of ${totalReviewed} reviewed`
          : "no reviews yet",
    },
    {
      label: "Streak",
      value: streak > 0 ? `${streak} clean` : "—",
      hint: streak > 0 ? "accepts in a row" : "build your first",
    },
  ];

  return (
    <section aria-label="Earnings and growth" className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-body text-[14px] font-semibold text-foreground tracking-tight">
          Earnings &amp; growth
        </h2>
        <Link
          href="/contributor/progress"
          className="font-body text-[11.5px] font-semibold text-[var(--color-brand)] hover:text-foreground transition-colors inline-flex items-center gap-1"
        >
          Open progress
          <ArrowRight className="w-3 h-3" strokeWidth={2} aria-hidden />
        </Link>
      </div>

      <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x-0 lg:divide-x divide-stroke-subtle">
        {tiles.map((t) => (
          <Tile key={t.label} {...t} />
        ))}
      </div>
    </section>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="px-5 py-4">
      <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary leading-none">
        {label}
      </p>
      <p className="mt-2.5 font-body text-[20px] font-semibold text-foreground leading-none tracking-[-0.02em] tabular-nums">
        {value}
      </p>
      <p className="mt-1.5 font-body text-[11px] text-text-tertiary leading-tight truncate">
        {hint}
      </p>
    </div>
  );
}
