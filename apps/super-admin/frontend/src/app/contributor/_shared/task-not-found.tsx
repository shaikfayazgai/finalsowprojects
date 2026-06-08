"use client";

import Link from "next/link";
import { ArrowLeft, FileSearch } from "lucide-react";
import { ContributorCard } from "./primitives";

/**
 * Reusable empty-state for when a route URL points at a taskId that no
 * longer exists in the contributor's task store.
 */
export function TaskNotFound({
  taskId,
  context = "task",
}: {
  taskId: string;
  context?: "task" | "revision" | "submission";
}) {
  const label =
    context === "revision"
      ? "Revision not found"
      : context === "submission"
      ? "Submission flow not available"
      : "Task not found";
  const helper =
    context === "revision"
      ? "This task isn't currently in a revision state — open the revisions workspace to pick one that is."
      : context === "submission"
      ? "This task isn't ready for submission yet. Open the workroom to continue working on it."
      : "This task isn't in your current workload. It may have been completed, withdrawn, or removed.";

  return (
    <div className="px-6 py-10">
      <ContributorCard variant="soft" className="max-w-2xl mx-auto">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-beige-200 bg-white text-beige-700 shrink-0">
            <FileSearch className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-beige-600">
              Task ID · {taskId}
            </p>
            <h1 className="font-heading text-[18px] font-semibold text-brown-950 mt-1 leading-tight">
              {label}
            </h1>
            <p className="text-[13px] text-beige-700 mt-1.5 leading-relaxed">{helper}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/contributor/tasks"
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-teal-700"
              >
                <ArrowLeft className="h-3 w-3" />
                Open assigned work
              </Link>
              <Link
                href="/contributor/dashboard"
                className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-brown-900 hover:border-beige-300"
              >
                Back to dashboard
              </Link>
              <Link
                href="/contributor/tasks/revisions"
                className="inline-flex items-center gap-1.5 rounded-lg border border-beige-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-brown-900 hover:border-beige-300"
              >
                Revisions workspace
              </Link>
            </div>
          </div>
        </div>
      </ContributorCard>
    </div>
  );
}
