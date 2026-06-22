"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Send,
  FileEdit,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorStateChip,
  DeadlinePill,
  ReadinessBar,
} from "@/app/contributor/_shared/primitives";
import {
  formatReadinessLabel,
  type WorkroomTask,
} from "@/mocks/data/contributor-workroom-detail";

export type SubmissionStage = "prepare" | "review" | "confirm";

interface SubmissionHeaderProps {
  task: WorkroomTask;
  stage: SubmissionStage;
}

const stages: { key: SubmissionStage; label: string; caption: string; Icon: React.ElementType }[] = [
  { key: "prepare", label: "Prepare", caption: "Check readiness", Icon: FileEdit },
  { key: "review", label: "Review", caption: "What gets submitted", Icon: Eye },
  { key: "confirm", label: "Confirm", caption: "Send to mentor", Icon: Send },
];

/**
 * Submission Header — sticky, confidence-building entry point.
 *
 * Anchors the contributor in the submission flow:
 *   - Back to workroom (always one click away — never trapped)
 *   - Task identity and key signals (deadline, readiness, mentor)
 *   - 3-stage indicator (Prepare → Review → Confirm) reinforcing structure
 *
 * Tone is forward-looking and supportive, not gatekeeping.
 */
export function SubmissionHeader({ task, stage }: SubmissionHeaderProps) {
  const readinessLabel = formatReadinessLabel(task.readinessScore);
  const currentIdx = stages.findIndex((s) => s.key === stage);

  return (
    <header className="sticky top-0 z-30 -mx-8 px-8 bg-white/95 backdrop-blur-md border-b border-beige-200">
      {/* Breadcrumb back */}
      <div className="flex items-center justify-between gap-3 pt-3">
        <nav className="flex items-center gap-1.5 text-[11.5px] text-beige-700 min-w-0">
          <Link
            href={`/contributor/tasks/${task.id}`}
            className="inline-flex items-center gap-1 hover:text-brown-700"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to workroom
          </Link>
          <ChevronRight className="h-3 w-3 text-beige-400" />
          <span className="font-semibold text-brown-700 truncate">Submit · {task.id}</span>
        </nav>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10.5px] font-semibold text-teal-800">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500" />
          Submission flow
        </span>
      </div>

      {/* Title row */}
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-4 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <ContributorStateChip state={task.state} size="sm" />
            {task.reworkRound && (
              <span className="inline-flex items-center rounded-full border border-gold-200 bg-gold-50 px-2 py-[1px] text-[10px] font-semibold text-gold-800">
                Round {task.reworkRound} · v{task.reworkRound + 1}
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
            {task.project} · ready to send when you are
          </p>
        </div>
        <div className="flex items-stretch gap-2 shrink-0">
          <SummaryBlock label="Deadline">
            <DeadlinePill hoursRemaining={task.deadlineHoursRemaining} />
          </SummaryBlock>
          <SummaryBlock label="Mentor">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 border border-teal-200 text-[10px] font-bold text-teal-700">
                {task.mentor.initials}
              </span>
              <p className="text-[11.5px] font-semibold text-brown-950 leading-tight truncate">
                {task.mentor.name.split(" ")[0]}
              </p>
            </div>
          </SummaryBlock>
          <SummaryBlock label="Readiness" emphasis>
            <div className="w-36">
              <ReadinessBar value={task.readinessScore} size="sm" />
            </div>
            <p className="text-[9.5px] text-teal-700 font-semibold mt-1">{readinessLabel}</p>
          </SummaryBlock>
        </div>
      </div>

      {/* Stage indicator */}
      <div className="pb-3 -mx-2 px-2">
        <ol className="flex items-center gap-1.5 overflow-x-auto">
          {stages.map((s, idx) => {
            const passed = idx < currentIdx;
            const current = idx === currentIdx;
            const Icon = s.Icon;
            return (
              <React.Fragment key={s.key}>
                <li
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors min-w-[140px]",
                    current
                      ? "border-teal-300 bg-teal-50/60"
                      : passed
                      ? "border-forest-200 bg-forest-50/40"
                      : "border-beige-200 bg-white"
                  )}
                >
                  <span
                    className={cn(
                      "shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full border",
                      current
                        ? "border-teal-300 bg-teal-100 text-teal-800"
                        : passed
                        ? "border-forest-200 bg-forest-50 text-forest-700"
                        : "border-beige-200 bg-beige-50 text-beige-600"
                    )}
                  >
                    {passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-[10.5px] font-bold uppercase tracking-[0.14em]",
                        current ? "text-teal-800" : passed ? "text-forest-700" : "text-beige-600"
                      )}
                    >
                      Step {idx + 1}
                    </p>
                    <p
                      className={cn(
                        "text-[12px] font-semibold leading-tight",
                        current ? "text-brown-950" : passed ? "text-forest-800" : "text-beige-700"
                      )}
                    >
                      {s.label}
                    </p>
                  </div>
                </li>
                {idx < stages.length - 1 && (
                  <span aria-hidden className="shrink-0 inline-flex items-center">
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5",
                        idx < currentIdx ? "text-forest-500" : "text-beige-400"
                      )}
                    />
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </ol>
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
        "rounded-xl border bg-white px-3 py-2 min-w-[140px]",
        emphasis ? "border-teal-200 bg-teal-50/30" : "border-beige-200"
      )}
    >
      <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-beige-700">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

