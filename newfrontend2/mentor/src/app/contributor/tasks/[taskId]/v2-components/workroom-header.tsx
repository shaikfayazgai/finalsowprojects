"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  PauseCircle,
  Maximize2,
  Minimize2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorStateChip,
  DeadlinePill,
  PriorityChip,
  ReadinessBar,
} from "@/app/contributor/_shared/primitives";
import {
  formatReadinessLabel,
  type WorkroomTask,
} from "@/mocks/data/contributor-workroom-detail";

interface WorkroomHeaderProps {
  task: WorkroomTask;
  focusMode: boolean;
  onToggleFocus: () => void;
}

/**
 * Workroom Header — sticky, focused, productivity-oriented.
 *
 * Distinct from the mentor portal's operational header: softer chip palette,
 * larger title, mentor identity visible (not severity rails), readiness as
 * the primary progress signal (not SLA urgency).
 */
export function WorkroomHeader({ task, focusMode, onToggleFocus }: WorkroomHeaderProps) {
  const FocusIcon = focusMode ? Minimize2 : Maximize2;
  const readinessLabel = formatReadinessLabel(task.readinessScore);

  return (
    <header className="sticky top-0 z-30 -mx-8 px-8 bg-white/95 backdrop-blur-md border-b border-beige-200">
      {/* Breadcrumb + workspace controls */}
      <div className="flex items-center justify-between gap-3 pt-3">
        <nav className="flex items-center gap-1.5 text-[11.5px] text-beige-700 min-w-0">
          <Link href="/contributor/dashboard" className="inline-flex items-center gap-1 hover:text-brown-700">
            <ChevronLeft className="h-3 w-3" />
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-beige-400" />
          <Link href="/contributor/tasks" className="hover:text-brown-700">My work</Link>
          <ChevronRight className="h-3 w-3 text-beige-400" />
          <span className="font-semibold text-brown-700 truncate">{task.id}</span>
        </nav>
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold",
              task.draft.autosaveStatus === "saved"
                ? "border-forest-200 bg-forest-50 text-forest-700"
                : task.draft.autosaveStatus === "saving"
                ? "border-teal-200 bg-teal-50 text-teal-700"
                : "border-beige-200 bg-beige-50 text-beige-700"
            )}
          >
            <Save className="h-3 w-3" />
            {task.draft.autosaveStatus === "saved"
              ? `Saved · ${task.draft.lastSavedAt}`
              : task.draft.autosaveStatus === "saving"
              ? "Saving…"
              : "Unsaved"}
          </span>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-2.5 text-[11.5px] font-semibold text-brown-900 hover:bg-beige-50/60"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Ask mentor
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-2.5 text-[11.5px] font-semibold text-brown-900 hover:bg-beige-50/60"
          >
            <PauseCircle className="h-3.5 w-3.5" />
            Pause
          </button>
          <button
            type="button"
            onClick={onToggleFocus}
            title={focusMode ? "Exit focus mode" : "Enter focus mode"}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11.5px] font-semibold transition-colors",
              focusMode
                ? "border-teal-300 bg-teal-50 text-teal-800"
                : "border-beige-200 bg-white text-brown-900 hover:bg-beige-50/60"
            )}
          >
            <FocusIcon className="h-3.5 w-3.5" />
            {focusMode ? "Exit focus" : "Focus mode"}
          </button>
        </div>
      </div>

      {/* Title row */}
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-4 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ContributorStateChip state={task.state} size="sm" />
            <PriorityChip priority={task.priority} />
            {task.reworkRound && (
              <span className="inline-flex items-center rounded-full border border-gold-200 bg-gold-50 px-2 py-[1px] text-[10px] font-semibold text-gold-800">
                Round {task.reworkRound} of {task.totalRounds}
              </span>
            )}
            <span className="text-[11px] text-beige-700">
              {task.skill} {task.skillLevel}
            </span>
          </div>
          <h1 className="font-heading text-[22px] font-semibold text-brown-950 mt-1.5 leading-tight truncate">
            {task.title}
          </h1>
          <p className="mt-1 text-[12px] text-beige-700 truncate">
            {task.project} · {task.portfolio} · last activity {task.lastActivityAt}
          </p>
        </div>

        {/* Right summary stack */}
        <div className="flex items-stretch gap-2 shrink-0">
          <SummaryBlock label="Deadline">
            <DeadlinePill hoursRemaining={task.deadlineHoursRemaining} />
          </SummaryBlock>
          <SummaryBlock label="Mentor">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 border border-teal-200 text-[10px] font-bold text-teal-700">
                {task.mentor.initials}
              </span>
              <div className="min-w-0">
                <p className="text-[11.5px] font-semibold text-brown-950 leading-tight truncate">
                  {task.mentor.name.split(" ")[0]}
                </p>
                <p className="text-[9.5px] text-beige-600 truncate">{task.mentor.role.split("·")[0].trim()}</p>
              </div>
            </div>
          </SummaryBlock>
          <SummaryBlock label="Payout">
            <p className="text-[14px] font-bold text-brown-950 tabular-nums">{task.payoutAmount}</p>
          </SummaryBlock>
          <SummaryBlock label="Readiness" emphasis>
            <div className="w-32">
              <ReadinessBar value={task.readinessScore} size="sm" />
            </div>
            <p className="text-[9.5px] text-teal-700 font-semibold mt-1">{readinessLabel}</p>
          </SummaryBlock>
        </div>
      </div>
    </header>
  );
}

function SummaryBlock({
  label,
  children,
  emphasis = false,
}: {
  label: string;
  children: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white px-3 py-2 min-w-[120px]",
        emphasis ? "border-teal-200 bg-teal-50/30" : "border-beige-200"
      )}
    >
      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-beige-700">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

