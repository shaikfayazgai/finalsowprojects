"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Clock, MessageCircle, RefreshCw, User2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorStateChip,
  DeadlinePill,
} from "@/app/contributor/_shared/primitives";
import type { WorkroomTask } from "@/mocks/data/contributor-workroom-detail";

type Stage = "review" | "address" | "resubmit";

const STAGES: { id: Stage; label: string; helper: string }[] = [
  { id: "review", label: "Read feedback", helper: "What worked + what to fix" },
  { id: "address", label: "Address corrections", helper: "Mark each fix complete" },
  { id: "resubmit", label: "Resubmit", helper: "Ready check + send back" },
];

export function RevisionHeader({
  task,
  taskId,
  stage,
  resolvedCount,
  totalCount,
}: {
  task: WorkroomTask;
  taskId: string;
  stage: Stage;
  resolvedCount: number;
  totalCount: number;
}) {
  const round = task.reworkRound ?? 2;
  const total = task.totalRounds ?? 3;
  const stageIndex = STAGES.findIndex((s) => s.id === stage);

  return (
    <div className="sticky top-0 z-20 bg-gradient-to-b from-beige-50/95 via-beige-50/90 to-beige-50/0 backdrop-blur-sm border-b border-beige-200/70">
      <div className="px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Link
                href={`/contributor/tasks/${taskId}`}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-beige-700 hover:text-brown-900 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Workroom
              </Link>
              <span className="text-beige-300">·</span>
              <span className="inline-flex items-center gap-1 rounded-full border border-gold-200 bg-gold-50 px-2 py-[1px] text-[10.5px] font-bold uppercase tracking-[0.14em] text-gold-800">
                <RefreshCw className="h-2.5 w-2.5" />
                Revision · Round {round} of {total}
              </span>
              <ContributorStateChip state="revision_requested" size="sm" />
            </div>

            <h1 className="font-heading text-[22px] font-semibold text-brown-950 leading-tight">
              {task.title}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-beige-700">
              <span className="inline-flex items-center gap-1">
                <User2 className="h-3 w-3 text-beige-500" />
                {task.mentor.name} · {task.mentor.role}
              </span>
              <span className="text-beige-300">·</span>
              <DeadlinePill hoursRemaining={task.deadlineHoursRemaining} />
              <span className="text-beige-300">·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 text-beige-500" />
                Last activity {task.lastActivityAt}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-beige-600">
              Corrections
            </p>
            <p className="font-heading text-[20px] font-semibold text-brown-950 tabular-nums leading-none mt-0.5">
              {resolvedCount}
              <span className="text-beige-400"> / </span>
              {totalCount}
            </p>
            <p className="text-[10.5px] text-beige-600 mt-0.5">addressed</p>
          </div>
        </div>

        {/* Stage indicator */}
        <ol className="mt-4 grid grid-cols-3 gap-2.5">
          {STAGES.map((s, idx) => {
            const isDone = idx < stageIndex;
            const isCurrent = idx === stageIndex;
            return (
              <li
                key={s.id}
                className={cn(
                  "rounded-xl border px-3 py-2 transition-colors",
                  isCurrent
                    ? "border-teal-300 bg-teal-50/70"
                    : isDone
                    ? "border-forest-200 bg-forest-50/40"
                    : "border-beige-200 bg-white/60"
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold tabular-nums",
                      isCurrent
                        ? "bg-teal-600 text-white"
                        : isDone
                        ? "bg-forest-500 text-white"
                        : "bg-beige-200 text-beige-700"
                    )}
                  >
                    {isDone ? "✓" : idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-[12px] font-semibold leading-none",
                        isCurrent
                          ? "text-teal-900"
                          : isDone
                          ? "text-forest-800"
                          : "text-beige-700"
                      )}
                    >
                      {s.label}
                    </p>
                    <p className="text-[10.5px] text-beige-600 mt-0.5 truncate">
                      {s.helper}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {task.clarification && task.clarification.status !== "resolved" && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gold-200 bg-gold-50/60 px-2.5 py-1 text-[11px] text-gold-800">
            <MessageCircle className="h-3 w-3" />
            Open clarification thread with {task.mentor.name}
          </div>
        )}
      </div>
    </div>
  );
}
