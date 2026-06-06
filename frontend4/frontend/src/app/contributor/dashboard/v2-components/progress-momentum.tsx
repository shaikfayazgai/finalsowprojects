"use client";

import * as React from "react";
import {
  TrendingUp,
  Award,
  Flame,
  Wallet,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
} from "@/app/contributor/_shared/primitives";
import { momentumSignals } from "@/mocks/data/contributor-workspace";

/**
 * Progress & Momentum — quiet motivation.
 *
 * The momentum stack: focus / velocity / trajectory, layered from most
 * specific to most general. Streaks appear only when ≥5. No confetti, no
 * shouty deltas, no leaderboards. Professional contributors prefer dignity.
 */
export function ProgressMomentum() {
  const m = momentumSignals;
  const weekDelta = m.acceptedThisWeek - m.acceptedLastWeek;

  return (
    <section>
      <ContributorSectionHeader
        title="Your momentum"
        caption="Trajectory across the week — quietly tracked."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Velocity card */}
        <ContributorCard padded={false} className="p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-teal-200 bg-teal-50 text-teal-700">
              <TrendingUp className="h-4 w-4" />
            </span>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700">
              This week
            </p>
          </div>
          <p className="mt-3 font-heading text-[28px] leading-none font-bold tracking-tight text-brown-950 tabular-nums">
            {m.acceptedThisWeek}
            <span className="text-[14px] text-beige-600 font-semibold ml-1">accepted</span>
          </p>
          {weekDelta !== 0 && (
            <p
              className={cn(
                "mt-2 text-[11px] font-semibold",
                weekDelta > 0 ? "text-teal-700" : "text-beige-700"
              )}
            >
              {weekDelta > 0 ? "+" : ""}
              {weekDelta} vs last week
            </p>
          )}
          {m.streak >= 5 && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold-200 bg-gold-50 px-2.5 py-1 text-[11px] font-semibold text-gold-800">
              <Flame className="h-3 w-3" />
              {m.streak} clean accepts in a row — strong week
            </div>
          )}
        </ContributorCard>

        {/* Reliability + earnings */}
        <ContributorCard padded={false} className="p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-forest-200 bg-forest-50 text-forest-700">
              <Award className="h-4 w-4" />
            </span>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700">
              Reliability
            </p>
          </div>
          <p className="mt-3 font-heading text-[28px] leading-none font-bold tracking-tight text-brown-950 tabular-nums">
            {m.reliability}
            <span className="text-[14px] text-beige-600 font-semibold ml-1">/ 100</span>
          </p>
          <p className="mt-2 text-[11px] font-semibold text-teal-700">
            ▲ {m.reliabilityTrend} this quarter
          </p>
          <div className="mt-3 pt-3 border-t border-beige-200/70 flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-beige-600" />
            <span className="text-[11px] text-beige-700">
              <strong className="text-brown-900 tabular-nums">$1,420</strong> pending payouts
            </span>
          </div>
        </ContributorCard>

        {/* Skill ladder */}
        <ContributorCard padded={false} className="p-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-beige-200 bg-beige-50 text-beige-700">
              <Award className="h-4 w-4" />
            </span>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-beige-700">
              Skill ladder
            </p>
          </div>
          <ul className="mt-3 space-y-2">
            {m.skillProgress.map((s) => (
              <li key={s.skill}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-brown-900 font-semibold">
                    {s.skill}{" "}
                    <span className="font-normal text-beige-600">{s.level}</span>
                  </span>
                  <span className="text-[10.5px] tabular-nums text-beige-700">
                    {s.nextLevelProgress}%
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-beige-100 overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      s.nextLevelProgress >= 80
                        ? "bg-teal-500"
                        : s.nextLevelProgress >= 50
                        ? "bg-teal-400"
                        : "bg-beige-400"
                    )}
                    style={{ width: `${s.nextLevelProgress}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </ContributorCard>
      </div>

      {/* Recent wins */}
      <ContributorCard padded={false} className="mt-3 p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-beige-700">
            Recent wins
          </p>
          <button className="text-[11px] font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1">
            See completed work <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {m.recentWins.map((w, i) => (
            <li
              key={i}
              className="rounded-lg border border-forest-100 bg-forest-50/30 px-3 py-2"
            >
              <p className="text-[12px] font-semibold text-brown-950 truncate">{w.taskTitle}</p>
              <p className="text-[10.5px] text-beige-700 mt-0.5">
                accepted {w.acceptedAt} ·{" "}
                <span className="font-semibold text-brown-900 tabular-nums">{w.payout}</span>
              </p>
            </li>
          ))}
        </ul>
      </ContributorCard>
    </section>
  );
}
