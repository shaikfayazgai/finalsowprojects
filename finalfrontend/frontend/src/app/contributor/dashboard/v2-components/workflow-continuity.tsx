"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  PlayCircle,
  FileEdit,
  MessageCircleQuestion,
  Pause,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import {
  ContributorCard,
  ContributorSectionHeader,
  ContributorStateChip,
  ReadinessBar,
} from "@/app/contributor/_shared/primitives";
import type { ContributorTask } from "@/mocks/data/contributor-workspace";
import { useContributorTaskList } from "@/lib/contributor/use-contributor-tasks";

/**
 * Workflow Continuity Panel — "pick up where you left off".
 *
 * The single biggest productivity lever for a contributor is restoring
 * context with zero friction. This panel surfaces:
 *   - the last actively worked-on task (most prominent)
 *   - drafts in progress
 *   - awaiting-clarification items
 *   - paused / blocked items
 * with one-click resume.
 */
export function WorkflowContinuity() {
  const contributorTasks = useContributorTaskList();
  const router = useRouter();

  const lastActive = contributorTasks
    .filter((t) => t.state === "in_progress" || t.state === "accepted")
    .sort((a, b) =>
      // crude ordering for mock — "an hour ago" sorts before "3 hours ago"
      (a.lastActivityAt.length - b.lastActivityAt.length) || a.title.localeCompare(b.title)
    )[0];

  const drafts = contributorTasks.filter((t) => t.state === "in_progress" && t.id !== lastActive?.id);
  const awaiting = contributorTasks.filter((t) => t.state === "awaiting_clarification");
  const paused = contributorTasks.filter((t) => t.state === "blocked");

  return (
    <section>
      <ContributorSectionHeader
        title="Continue your work"
        caption="The platform remembered where you stopped — pick up in one click."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3">
        {/* Featured: last active */}
        {lastActive ? (
          <ContributorCard variant="feature" padded={false} className="p-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-2 py-[1px] text-[10px] font-bold uppercase tracking-wider text-teal-700">
                <PlayCircle className="h-3 w-3" />
                Last active
              </span>
              <ContributorStateChip state={lastActive.state} size="sm" />
            </div>
            <h3 className="font-heading text-[18px] font-semibold text-brown-950 mt-2 leading-tight">
              {lastActive.title}
            </h3>
            <p className="text-[12px] text-beige-700 mt-1">
              {lastActive.project} · last activity {lastActive.lastActivityAt}
            </p>

            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-beige-700 mb-1.5">
                <span>Progress</span>
                <span>{lastActive.estimatedMinutesRemaining}min remaining</span>
              </div>
              <ReadinessBar value={lastActive.progressPct} />
            </div>

            {lastActive.aiNextAction && (
              <p className="mt-4 text-[12.5px] text-brown-900">
                <span className="font-semibold text-teal-800">Next: </span>
                {lastActive.aiNextAction}
              </p>
            )}

            <button
              type="button"
              onClick={() => router.push(`/contributor/tasks/${lastActive.id}`)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-teal-700 transition-colors"
            >
              <PlayCircle className="h-4 w-4" />
              Resume workroom
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </ContributorCard>
        ) : (
          <ContributorCard variant="soft" padded={false} className="p-5">
            <p className="text-[12.5px] text-beige-700">
              Nothing in active progress right now. When you start a task, this card resumes it in one click.
            </p>
          </ContributorCard>
        )}

        {/* Right column: continuity inventory */}
        <div className="space-y-3">
          <ContinuityList
            label="Drafts in progress"
            icon={FileEdit}
            tasks={drafts}
            emptyLabel="No drafts saved"
            onSelect={(id) => router.push(`/contributor/tasks/${id}`)}
          />
          <ContinuityList
            label="Awaiting reply"
            icon={MessageCircleQuestion}
            tasks={awaiting}
            emptyLabel="No pending replies"
            onSelect={(id) => router.push(`/contributor/tasks/${id}`)}
          />
          <ContinuityList
            label="Paused"
            icon={Pause}
            tasks={paused}
            emptyLabel="Nothing paused"
            onSelect={(id) => router.push(`/contributor/tasks/${id}`)}
          />
        </div>
      </div>
    </section>
  );
}

function ContinuityList({
  label,
  icon: Icon,
  tasks,
  emptyLabel,
  onSelect,
}: {
  label: string;
  icon: React.ElementType;
  tasks: ContributorTask[];
  emptyLabel: string;
  onSelect: (id: string) => void;
}) {
  return (
    <ContributorCard padded={false} className="p-3.5">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-beige-200 bg-beige-50 text-beige-700">
          <Icon className="h-3 w-3" />
        </span>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-beige-700">{label}</p>
        <span className="ml-auto text-[10.5px] tabular-nums text-beige-600">{tasks.length}</span>
      </div>
      {tasks.length === 0 ? (
        <p className="text-[11px] text-beige-600 italic px-1">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1">
          {tasks.slice(0, 3).map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onSelect(t.id)}
                className="w-full text-left rounded-md px-2 py-1.5 hover:bg-beige-50 transition-colors"
              >
                <p className="text-[12px] font-semibold text-brown-900 truncate">{t.title}</p>
                <p className="text-[10.5px] text-beige-600 truncate">
                  {t.project} · {t.lastActivityAt}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ContributorCard>
  );
}
