"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
  ContributorStateChip,
} from "./primitives";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";
import { stateNextStep, urgencyForHours } from "./state-system";

/**
 * Cross-surface forward-motion widget.
 *
 * Surfaces the contributor's *next* operational action wherever they
 * are in the portal — Profile, Progress, Completed Work, settings, etc.
 *
 * The contributor should never feel stranded on a static surface; this
 * widget keeps the workflow one click away.
 *
 * Source of truth: it reads the contributor's task list and picks the
 * single highest-leverage forward step based on:
 *   1. revisions due (revision_requested)
 *   2. ready-to-submit (ready_for_submission)
 *   3. active in-progress (in_progress / blocked) sorted by deadline
 *   4. just-assigned (assigned)
 *
 * Falls back to a friendly empty state when nothing is in flight.
 */
export function NextStepCard({ variant = "default" }: { variant?: "default" | "compact" }) {
  const tasks = useContributorTaskList();
  const pick = React.useMemo(() => pickNextTask(tasks), [tasks]);

  if (!pick) {
    return (
      <ContributorCard variant="soft">
        <ContributorSectionHeader title="Up next" caption="Nothing in flight right now." />
        <div className="text-[12.5px] text-beige-700 leading-relaxed">
          You&apos;re all caught up. Browse open work to pick something next.
        </div>
        <Link
          href="/contributor/tasks"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-[12px] font-semibold text-teal-800 hover:bg-teal-100"
        >
          Browse assigned work
          <ArrowRight className="h-3 w-3" />
        </Link>
      </ContributorCard>
    );
  }

  const next = stateNextStep[pick.state];
  const href = next.href(pick.id);
  const urgency = urgencyForHours(pick.deadlineHoursRemaining);
  const urgencyTint =
    urgency === "due_now"
      ? "text-gold-800"
      : urgency === "due_soon"
      ? "text-teal-700"
      : "text-beige-700";

  if (variant === "compact") {
    return (
      <Link
        href={href}
        className="block rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/60 to-white px-3.5 py-2.5 hover:bg-teal-50 transition-colors"
      >
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-teal-700">
          Up next
        </p>
        <p className="font-heading text-[13px] font-semibold text-brown-950 leading-tight mt-0.5">
          {next.headline}
        </p>
        <p className="text-[11.5px] text-brown-800 mt-1 line-clamp-2 leading-snug">
          {pick.title}
        </p>
        <p className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-teal-700">
          {next.cta}
          <ArrowRight className="h-3 w-3" />
        </p>
      </Link>
    );
  }

  return (
    <ContributorCard variant="feature">
      <ContributorSectionHeader
        title="Up next"
        caption="One forward step — wherever you are in the portal."
        trailing={<ContributorStateChip state={pick.state} size="sm" />}
      />
      <div className="space-y-3">
        <div>
          <p className="font-heading text-[14px] font-semibold text-brown-950 leading-tight">
            {next.headline}
          </p>
          <p className="text-[12px] text-beige-700 mt-1 leading-relaxed">{next.helper}</p>
        </div>

        <div className="rounded-xl border border-beige-200 bg-white px-3 py-2.5">
          <p className="text-[12.5px] font-semibold text-brown-950 leading-tight">{pick.title}</p>
          <p className="text-[11px] text-beige-700 mt-0.5 truncate">
            {pick.project} · {pick.skill} {pick.skillLevel}
          </p>
          {typeof pick.deadlineHoursRemaining === "number" && (
            <p className={cn("mt-1 inline-flex items-center gap-1 text-[11px] font-semibold tabular-nums", urgencyTint)}>
              <Clock className="h-3 w-3" />
              {pick.deadlineHoursRemaining <= 0
                ? "Past deadline"
                : pick.deadlineHoursRemaining < 24
                ? `${pick.deadlineHoursRemaining}h left`
                : `${Math.floor(pick.deadlineHoursRemaining / 24)}d ${pick.deadlineHoursRemaining % 24}h`}
            </p>
          )}
        </div>

        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-teal-700"
        >
          {next.cta}
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </ContributorCard>
  );
}

function pickNextTask(tasks: ReturnType<typeof useContributorTaskList>) {
  // Priority order: revision_requested → ready_for_submission → in_progress → assigned
  const ordered = [
    ...tasks.filter((t) => t.state === "revision_requested"),
    ...tasks.filter((t) => t.state === "ready_for_submission"),
    ...tasks
      .filter((t) => t.state === "in_progress" || t.state === "blocked" || t.state === "awaiting_clarification")
      .sort((a, b) => (a.deadlineHoursRemaining ?? 9999) - (b.deadlineHoursRemaining ?? 9999)),
    ...tasks.filter((t) => t.state === "assigned"),
  ];

  return ordered[0];
}
