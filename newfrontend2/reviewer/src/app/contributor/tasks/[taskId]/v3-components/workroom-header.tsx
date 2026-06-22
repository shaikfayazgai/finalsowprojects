"use client";

/**
 * Workroom Header V3 — calm, compact, sticky
 *
 * Strict info hierarchy:
 *   row 1   breadcrumb · autosave
 *   row 2   state chip · title · due-chip · revision badge (if any)
 *
 * No summary blocks. No button bar. Save/Submit live in the action footer
 * where the eye expects primary CTAs. This header just orients.
 */

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Save } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { WorkroomTask } from "@/mocks/data/contributor-workroom-detail";

interface WorkroomHeaderProps {
  task: WorkroomTask;
}

const STATE_CHIP: Record<string, { label: string; tone: string }> = {
  assigned: { label: "Assigned", tone: "bg-bg-subtle text-text-secondary" },
  accepted: { label: "Accepted", tone: "bg-bg-subtle text-text-secondary" },
  in_progress: { label: "In progress", tone: "bg-info-subtle text-info-text" },
  ready_for_submission: { label: "Ready", tone: "bg-success-subtle text-success-text" },
  awaiting_clarification: { label: "Awaiting reply", tone: "bg-bg-subtle text-text-secondary" },
  under_review: { label: "In review", tone: "bg-info-subtle text-info-text" },
  revision_requested: { label: "Revision", tone: "bg-warning-subtle text-warning-text" },
  blocked: { label: "Blocked", tone: "bg-error-subtle text-error-text" },
  approved: { label: "Accepted", tone: "bg-success-subtle text-success-text" },
  completed: { label: "Closed", tone: "bg-success-subtle text-success-text" },
};

export function WorkroomHeader({ task }: WorkroomHeaderProps) {
  const chip = STATE_CHIP[task.state] ?? STATE_CHIP.in_progress;
  const due = formatDue(task.deadlineHoursRemaining);
  const auto = task.draft.autosaveStatus;

  return (
    <header className="sticky top-[60px] z-30 bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80 border-b border-stroke-subtle">
      <div className="py-3 space-y-1.5">
        {/* row 1 — breadcrumb + autosave */}
        <div className="flex items-center justify-between gap-3">
          <nav className="flex items-center gap-1.5 font-body text-[11.5px] text-text-tertiary min-w-0">
            <Link href="/contributor/dashboard" className="hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="h-3 w-3 text-text-disabled" strokeWidth={2} aria-hidden />
            <Link href="/contributor/tasks" className="hover:text-foreground transition-colors">
              My work
            </Link>
            <ChevronRight className="h-3 w-3 text-text-disabled" strokeWidth={2} aria-hidden />
            <span className="font-mono text-[11px] text-foreground truncate">{task.id}</span>
          </nav>

          <AutosaveIndicator status={auto} lastSavedAt={task.draft.lastSavedAt} />
        </div>

        {/* row 2 — title row */}
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center justify-center h-[18px] px-1.5 rounded font-body text-[10px] font-bold uppercase tracking-wide leading-none",
                  chip.tone,
                )}
              >
                {chip.label}
              </span>
              {task.reworkRound != null && task.reworkRound > 0 && (
                <span className="inline-flex items-center justify-center h-[18px] px-1.5 rounded bg-warning-subtle text-warning-text font-body text-[10px] font-bold uppercase tracking-wide leading-none">
                  Round {task.reworkRound}
                  {task.totalRounds ? ` of ${task.totalRounds}` : ""}
                </span>
              )}
              <span className="font-body text-[11px] text-text-tertiary">
                {task.project} · {task.skill} {task.skillLevel}
              </span>
            </div>
            <h1 className="mt-1 font-body text-[20px] sm:text-[22px] font-semibold text-foreground leading-tight tracking-[-0.015em] truncate">
              {task.title}
            </h1>
          </div>

          <DueChip hours={task.deadlineHoursRemaining} label={due.label} tone={due.tone} />
        </div>
      </div>
    </header>
  );
}

/* ── Autosave ── */

function AutosaveIndicator({
  status,
  lastSavedAt,
}: {
  status: "saved" | "saving" | "unsaved";
  lastSavedAt: string;
}) {
  const label =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? `Saved · ${lastSavedAt}`
        : "Unsaved";
  const tone =
    status === "saving"
      ? "text-info-text"
      : status === "saved"
        ? "text-text-tertiary"
        : "text-warning-text";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-body text-[11px] tabular-nums whitespace-nowrap",
        tone,
      )}
    >
      <Save className="h-3 w-3" strokeWidth={2} aria-hidden />
      {label}
    </span>
  );
}

/* ── Due chip ── */

function DueChip({
  hours,
  label,
  tone,
}: {
  hours: number;
  label: string;
  tone: "neutral" | "watch" | "breach";
}) {
  void hours;
  const cls =
    tone === "breach"
      ? "bg-error-subtle text-error-text"
      : tone === "watch"
        ? "bg-warning-subtle text-warning-text"
        : "bg-bg-subtle text-text-secondary";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center h-[24px] px-2.5 rounded-md font-body text-[11.5px] font-semibold tabular-nums leading-none",
        cls,
      )}
    >
      {label}
    </span>
  );
}

function formatDue(hours: number): {
  label: string;
  tone: "neutral" | "watch" | "breach";
} {
  if (hours < 0) {
    return {
      label: `${Math.abs(Math.round(hours))}h overdue`,
      tone: "breach",
    };
  }
  if (hours < 24) {
    return {
      label: `Due in ${Math.max(1, Math.round(hours))}h`,
      tone: "watch",
    };
  }
  const days = Math.round(hours / 24);
  return {
    label: `Due in ${days}d`,
    tone: "neutral",
  };
}
