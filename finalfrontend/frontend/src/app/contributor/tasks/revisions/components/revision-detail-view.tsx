"use client";

/**
 * Revision detail — full-width workroom pattern (matches submission detail).
 * Main column: mentor feedback, corrections checklist, working notes.
 * Sticky rail: progress, resubmit-by, save / resubmit actions.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  GitCompare,
  Save,
  Send,
} from "lucide-react";
import type { MockSubmission, MockTask } from "@/mocks/contributor";
import { ContributorApiError } from "@/lib/api/contributor-tasks";
import {
  ContributorApiError as MockApiError,
  fetchTask,
} from "@/lib/api/contributor-mock";
import {
  useSubmitSubmission,
  useUpdateSubmission,
} from "@/lib/hooks/use-contributor-tasks";
import { DashboardSection } from "@/components/meridian/dashboard";
import { Skeleton, StatusChip } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { fmtRelative, fmtRevisionDue } from "../lib/revision-ui-utils";
import { RevisionCompareModal } from "./revision-compare-modal";

interface RevisionDetailViewProps {
  taskId: string;
}

export function RevisionDetailView({ taskId }: RevisionDetailViewProps) {
  const router = useRouter();
  const [task, setTask] = React.useState<MockTask | null>(null);
  const [submission, setSubmission] = React.useState<MockSubmission | null>(null);
  const [loadErr, setLoadErr] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const submissionId = submission?.id ?? "";
  const submit = useSubmitSubmission(submissionId);
  const update = useUpdateSubmission(submissionId);

  const [addressed, setAddressed] = React.useState<boolean[]>([]);
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [openNotesFor, setOpenNotesFor] = React.useState<string | null>(null);
  const [workingNotes, setWorkingNotes] = React.useState("");
  const [diffOpen, setDiffOpen] = React.useState(false);

  React.useEffect(() => {
    if (!taskId) return;
    const c = new AbortController();
    setLoading(true);
    setLoadErr(null);
    fetchTask(taskId, c.signal)
      .then((res) => {
        setTask(res.task);
        setSubmission(res.submission);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        if (err instanceof MockApiError && err.status === 404) {
          setLoadErr("Revision not found.");
        } else {
          setLoadErr(err instanceof Error ? err.message : "Could not load revision.");
        }
      })
      .finally(() => setLoading(false));
    return () => c.abort();
  }, [taskId]);

  React.useEffect(() => {
    if (submission?.feedback) {
      setAddressed(submission.feedback.requiredCorrections.map((c) => c.addressed));
    }
  }, [submission]);

  if (loading) return <DetailSkeleton />;

  if (loadErr) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 font-body text-[12.5px] text-error-text">
          {loadErr}
        </div>
      </div>
    );
  }

  if (!task || !submission?.feedback) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 font-body text-[12.5px] text-error-text">
          No mentor feedback found for this task.
        </div>
      </div>
    );
  }

  const feedback = submission.feedback;
  const correctionsTotal = feedback.requiredCorrections.length;
  const addressedCount = addressed.filter(Boolean).length;
  const allAddressed = correctionsTotal > 0 && addressed.every(Boolean);
  const pct =
    correctionsTotal > 0 ? Math.round((addressedCount / correctionsTotal) * 100) : 0;
  const isFinalRound = task.round >= task.totalRounds;
  const due = fmtRevisionDue(task.dueAt);
  const feedbackAt = submission.decidedAt ?? submission.submittedAt;
  const mentor = submission.reviewerName ?? task.mentor.name;

  const doSaveDraft = async () => {
    setActionError(null);
    try {
      await update.mutateAsync({ body: workingNotes.trim() || undefined });
    } catch (e) {
      setActionError(e instanceof ContributorApiError ? e.message : (e as Error).message);
    }
  };

  const doResubmit = async () => {
    setActionError(null);
    if (!allAddressed) return;
    try {
      if (workingNotes.trim()) {
        await update.mutateAsync({ body: workingNotes.trim() });
      }
      const result = await submit.mutateAsync();
      router.push(
        `/contributor/tasks/${taskId}/submit/success?submissionId=${result.submission.id}`,
      );
    } catch (e) {
      setActionError(e instanceof ContributorApiError ? e.message : (e as Error).message);
    }
  };

  const actionPending = submit.isPending || update.isPending;

  return (
    <div className="pb-12 animate-fade-in">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="space-y-5 min-w-0">
          <header className="border-b border-stroke-subtle pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
                  {task.title}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-body text-[12.5px] text-text-secondary">
                  <StatusChip status="warning" size="sm">
                    Revision requested
                  </StatusChip>
                  <span aria-hidden className="opacity-40">·</span>
                  <span className="tabular-nums">
                    Round {task.round} of {task.totalRounds}
                  </span>
                  <span aria-hidden className="opacity-40">·</span>
                  <span>{mentor}</span>
                  {feedbackAt && (
                    <>
                      <span aria-hidden className="opacity-40">·</span>
                      <span>Feedback {fmtRelative(feedbackAt)}</span>
                    </>
                  )}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setDiffOpen(true)}
                  className={outlineBtnCls}
                >
                  <GitCompare className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  Compare v{submission.version} ↔ working
                </button>
                <button
                  type="button"
                  onClick={doSaveDraft}
                  disabled={actionPending}
                  className={outlineBtnCls}
                >
                  <Save className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  {update.isPending ? "Saving…" : "Save draft"}
                </button>
                <button
                  type="button"
                  onClick={doResubmit}
                  disabled={!allAddressed || actionPending}
                  className={primaryBtnCls}
                >
                  {submit.isPending ? "Resubmitting…" : "Resubmit"}
                  <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </div>
          </header>

          {isFinalRound && (
            <div className="flex gap-3 rounded-lg border border-warning-border bg-warning-subtle/40 px-4 py-3">
              <AlertTriangle
                className="h-4 w-4 text-warning-text shrink-0 mt-0.5"
                strokeWidth={2}
                aria-hidden
              />
              <p className="font-body text-[12.5px] text-warning-text leading-relaxed">
                Final revision round — unaddressed corrections are likely to result in rejection.
                Mark each item complete before resubmitting.
              </p>
            </div>
          )}

          <DashboardSection
            title="What worked"
            description={`From ${mentor} · round ${submission.version} feedback`}
          >
            <p className="font-body text-[12.5px] text-foreground leading-relaxed whitespace-pre-wrap">
              {feedback.whatWorked}
            </p>
          </DashboardSection>

          <DashboardSection
            title={`Required corrections (${correctionsTotal})`}
            description="Mark each item addressed and add a resolution note where helpful"
          >
            <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke overflow-hidden">
              {feedback.requiredCorrections.map((c, i) => {
                const isOpen = openNotesFor === c.id;
                const note = notes[c.id] ?? c.resolutionNote ?? "";
                const isDone = addressed[i];

                return (
                  <li
                    key={c.id}
                    className={cn(
                      "px-3 py-3 transition-colors duration-fast",
                      isDone ? "bg-success-subtle/10" : "hover:bg-bg-subtle/60",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <label className="mt-0.5 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={(e) => {
                            const next = [...addressed];
                            next[i] = e.target.checked;
                            setAddressed(next);
                          }}
                          className="sr-only peer"
                        />
                        <span
                          aria-hidden
                          className={cn(
                            "inline-flex h-4 w-4 items-center justify-center rounded-sm border",
                            "transition-colors duration-fast",
                            isDone
                              ? "border-success-border bg-success-subtle text-success-text"
                              : "border-stroke bg-surface text-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-stroke-focus",
                          )}
                        >
                          {isDone && <Check className="h-3 w-3" strokeWidth={2.5} />}
                        </span>
                        <span className="sr-only">Mark {c.criterion} as addressed</span>
                      </label>

                      <div className="min-w-0 flex-1">
                        <p className="font-body text-[12.5px] font-semibold text-foreground leading-snug">
                          {c.criterion}
                          <SeverityBadge severity={c.severity} />
                        </p>
                        <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">
                          {c.description}
                        </p>
                        <button
                          type="button"
                          onClick={() => setOpenNotesFor(isOpen ? null : c.id)}
                          className="mt-1.5 font-body text-[11px] font-semibold text-text-link hover:underline"
                        >
                          {isOpen
                            ? "Hide note"
                            : note
                              ? "Edit resolution note"
                              : "Add resolution note"}
                        </button>
                        {isOpen && (
                          <textarea
                            value={note}
                            onChange={(e) => setNotes({ ...notes, [c.id]: e.target.value })}
                            rows={2}
                            placeholder="How did you address this correction?"
                            className={cn(
                              "mt-2 w-full rounded-md border border-stroke bg-surface px-2.5 py-1.5",
                              "font-body text-[12px] text-foreground placeholder:text-text-disabled",
                              "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
                            )}
                          />
                        )}
                        {!isOpen && note && (
                          <p className="mt-2 font-body text-[11.5px] text-text-secondary italic border-l-2 border-stroke-subtle pl-2.5 leading-relaxed">
                            {note}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </DashboardSection>

          {feedback.suggestions.length > 0 && (
            <DashboardSection
              title={`Optional suggestions (${feedback.suggestions.length})`}
              description="Not required for resubmit — consider if you have bandwidth"
            >
              <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke overflow-hidden">
                {feedback.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="px-3 py-2.5 font-body text-[12.5px] text-text-secondary leading-relaxed"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </DashboardSection>
          )}

          <DashboardSection
            title="Working notes"
            description="Summarize what changed in this revision round for your mentor"
          >
            <textarea
              value={workingNotes}
              onChange={(e) => setWorkingNotes(e.target.value)}
              rows={8}
              placeholder="Describe what you changed for this round."
              className={cn(
                "w-full rounded-lg border border-stroke bg-surface px-3 py-2.5",
                "font-body text-[12.5px] text-foreground placeholder:text-text-disabled leading-relaxed",
                "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
              )}
            />
            <p className="mt-1.5 font-mono text-[10.5px] text-text-tertiary tabular-nums">
              {workingNotes.length} / 5000
            </p>
          </DashboardSection>

          {actionError && (
            <p className="rounded-md border border-error-border bg-error-subtle px-3 py-2 font-body text-[12px] text-error-text">
              {actionError}
            </p>
          )}
        </div>

        <aside className="xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain space-y-4">
          <DashboardSection title="Revision progress" description="Track corrections before resubmit">
            <dl className="space-y-3">
              <RailItem label="Status">
                <StatusChip status={allAddressed ? "success" : "warning"} size="sm">
                  {allAddressed ? "Ready to resubmit" : "Addressing feedback"}
                </StatusChip>
              </RailItem>
              <RailItem label="Mentor">{mentor}</RailItem>
              <RailItem label="Round">
                <span className="font-mono text-[12px] tabular-nums">
                  {task.round} / {task.totalRounds}
                </span>
              </RailItem>
              {feedbackAt && (
                <RailItem label="Feedback received">{fmtRelative(feedbackAt)}</RailItem>
              )}
              <RailItem label="Resubmit-by">
                <span
                  className={cn(
                    "font-body text-[12.5px] font-medium tabular-nums",
                    due.overdue
                      ? "text-error-text"
                      : due.warn
                        ? "text-warning-text"
                        : "text-foreground",
                  )}
                >
                  {due.text}
                </span>
              </RailItem>
              <RailItem label="Corrections">
                <span className="font-mono text-[12px] tabular-nums">
                  {addressedCount} / {correctionsTotal}
                </span>
              </RailItem>
            </dl>

            <div className="mt-4 pt-4 border-t border-stroke-subtle">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-body text-[11px] text-text-tertiary">Completion</span>
                <span className="font-mono text-[11px] text-text-secondary tabular-nums">{pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-bg-subtle overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-fast",
                    allAddressed ? "bg-success-text" : "bg-brand",
                  )}
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              </div>
              {!allAddressed && (
                <p className="mt-2 font-body text-[11.5px] text-text-secondary leading-relaxed">
                  Mark all required corrections before resubmitting.
                </p>
              )}
            </div>
          </DashboardSection>
        </aside>
      </div>

      {diffOpen && (
        <RevisionCompareModal
          open={diffOpen}
          onClose={() => setDiffOpen(false)}
          fromVersion={submission.version}
          submission={submission}
          task={task}
        />
      )}
    </div>
  );
}

function RailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="font-body text-[11px] text-text-tertiary shrink-0">{label}</dt>
      <dd className="font-body text-[12.5px] text-foreground text-right min-w-0">{children}</dd>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "major" | "minor" }) {
  return (
    <span
      className={cn(
        "ml-2 inline-flex items-center px-1.5 py-0 rounded-sm font-body text-[10px] font-semibold uppercase tracking-wide",
        severity === "major"
          ? "bg-error-subtle text-error-text"
          : "bg-bg-subtle text-text-tertiary",
      )}
    >
      {severity}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] pb-12">
      <div className="space-y-5">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-8 w-96 max-w-full rounded" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl hidden xl:block" />
    </div>
  );
}

const outlineBtnCls = cn(
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);

const primaryBtnCls = cn(
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-50 disabled:cursor-not-allowed",
);
