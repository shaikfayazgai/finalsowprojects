"use client";

/**
 * Submission detail — full-width workroom pattern.
 * Main column: packet (cover note, evidence, criteria).
 * Sticky rail: review status, mentor window, routing, actions.
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  Circle,
  ExternalLink,
  File as FileIcon,
  RotateCcw,
  Trophy,
} from "lucide-react";
import {
  useSubmissionDetail,
  useTaskDetail,
  useWithdrawSubmission,
} from "@/lib/hooks/use-contributor-tasks";
import { ContributorApiError } from "@/lib/api/contributor-tasks";
import { getMockSubmissionMeta } from "@/lib/contributor/mock-task-bridge";
import { DashboardSection } from "@/components/meridian/dashboard";
import { Skeleton, StatusChip } from "@/components/meridian";
import { fmtMentorReviewWindow } from "@/app/contributor/tasks/lib/task-list-utils";
import type { SubmissionArtifactDetail, SubmissionDetail } from "@/lib/submissions/types";
import { cn } from "@/lib/utils/cn";
import {
  fmtRelative,
  fmtSize,
  fmtSubmittedAt,
  reviewerLabel,
  splitCriteria,
  submissionStatusChip,
  submissionStatusLabel,
} from "../lib/submission-ui-utils";

interface SubmissionDetailViewProps {
  submissionId: string;
}

export function SubmissionDetailView({ submissionId }: SubmissionDetailViewProps) {
  const router = useRouter();
  const { data, isLoading, error } = useSubmissionDetail(submissionId);
  const submission = data?.submission;
  const taskQuery = useTaskDetail(submission?.taskDefinitionId ?? "");
  const task = taskQuery.data?.task;

  const withdraw = useWithdrawSubmission(submissionId);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const mockMeta = React.useMemo(
    () => (submission ? getMockSubmissionMeta(submission.id) : null),
    [submission],
  );

  if (isLoading && !submission) {
    return <DetailSkeleton />;
  }

  if (error || !submission) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 font-body text-[12.5px] text-error-text">
          {error instanceof ContributorApiError ? error.message : "Submission not found"}
        </div>
      </div>
    );
  }

  const taskTitle = task?.title ?? "Submission";
  const taskId = submission.taskDefinitionId;
  const criteria = splitCriteria(task?.acceptanceCriteria ?? null);
  const mentor = reviewerLabel(mockMeta?.reviewerName, submission.reviewerId);
  const sla = fmtMentorReviewWindow(submission.submittedAt, submission.status);
  const canWithdraw =
    submission.status === "submitted" ||
    submission.status === "under_review" ||
    submission.status === "resubmitted";
  const routingLabel =
    mockMeta?.routing === "mentor_client" ? "Mentor → Client" : "Mentor review";

  const doWithdraw = async () => {
    setActionError(null);
    try {
      await withdraw.mutateAsync();
      setConfirmOpen(false);
      router.push(`/contributor/tasks/${taskId}`);
    } catch (e) {
      setActionError(e instanceof ContributorApiError ? e.message : (e as Error).message);
    }
  };

  return (
    <div className="pb-12 animate-fade-in">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        {/* Main column */}
        <div className="space-y-5 min-w-0">
          <header className="border-b border-stroke-subtle pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
                  {taskTitle}
                </h1>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 font-body text-[12.5px] text-text-secondary">
                  <StatusChip status={submissionStatusChip(submission.status)} size="sm">
                    {submissionStatusLabel(submission.status)}
                  </StatusChip>
                  <span aria-hidden className="opacity-40">·</span>
                  <span>Round {submission.version}</span>
                  {submission.submittedAt && (
                    <>
                      <span aria-hidden className="opacity-40">·</span>
                      <span>Submitted {fmtRelative(submission.submittedAt)}</span>
                    </>
                  )}
                </p>
              </div>
              <Link
                href={`/contributor/tasks/${taskId}`}
                className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover shrink-0"
              >
                Open workroom
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </Link>
            </div>
          </header>

          {submission.status === "feedback_requested" && (
            <StatusBanner
              tone="warning"
              title="Revision requested"
              description="Your mentor returned structured feedback. Open the revision workroom to address required corrections."
              href={`/contributor/tasks/revisions/${taskId}`}
              cta="Open revision workroom"
              icon={RotateCcw}
            />
          )}
          {submission.status === "accepted" && (
            <StatusBanner
              tone="success"
              title="Accepted"
              description="Payout becomes eligible and your credential (if applicable) is issued after platform processing."
              href={`/contributor/tasks/completed/${taskId}`}
              cta="View completed task"
              icon={Trophy}
            />
          )}
          {submission.status === "rejected" && submission.decisionRationale && (
            <div className="rounded-lg border border-error-border bg-error-subtle/50 px-4 py-3">
              <h2 className="font-body text-[12.5px] font-semibold text-error-text">
                Reviewer rationale
              </h2>
              <p className="mt-1.5 font-body text-[12.5px] text-foreground whitespace-pre-wrap leading-relaxed">
                {submission.decisionRationale}
              </p>
            </div>
          )}

          <DashboardSection title="Cover note" description="Context you attached at submit time">
            {submission.body ? (
              <pre className="whitespace-pre-wrap rounded-lg bg-bg-subtle px-4 py-3 font-body text-[12.5px] text-foreground leading-relaxed">
                {submission.body}
              </pre>
            ) : (
              <p className="font-body text-[12.5px] text-text-tertiary italic">No note attached.</p>
            )}
          </DashboardSection>

          <DashboardSection
            title={`Evidence${submission.artifacts.length > 0 ? ` (${submission.artifacts.length})` : ""}`}
            description="Files and links included in this packet"
          >
            {submission.artifacts.length === 0 ? (
              <p className="font-body text-[12.5px] text-text-tertiary italic">No evidence attached.</p>
            ) : (
              <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke overflow-hidden">
                {submission.artifacts.map((a) => (
                  <ArtifactRow key={a.id} artifact={a} />
                ))}
              </ul>
            )}
          </DashboardSection>

          <DashboardSection
            title={`Acceptance criteria${criteria.length > 0 ? ` (${criteria.length})` : ""}`}
            description="Task definition at time of submit — per-criterion addressed state is not stored in Phase 1"
          >
            {criteria.length === 0 ? (
              <p className="font-body text-[12.5px] text-text-tertiary italic">
                No criteria defined for this task.
              </p>
            ) : (
              <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke overflow-hidden">
                {criteria.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-bg-subtle transition-colors duration-fast"
                  >
                    <Circle
                      className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="font-body text-[12.5px] text-foreground leading-snug">{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>

          {actionError && (
            <p className="rounded-md border border-error-border bg-error-subtle px-3 py-2 font-body text-[12px] text-error-text">
              {actionError}
            </p>
          )}
        </div>

        {/* Context rail */}
        <aside className="xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain space-y-4">
          <DashboardSection title="Review status" description="Where this packet sits in the queue">
            <dl className="space-y-3">
              <RailItem label="Status">
                <StatusChip status={submissionStatusChip(submission.status)} size="sm">
                  {submissionStatusLabel(submission.status)}
                </StatusChip>
              </RailItem>
              <RailItem label="Mentor">{mentor}</RailItem>
              {submission.submittedAt && (
                <RailItem label="Submitted">{fmtSubmittedAt(submission.submittedAt)}</RailItem>
              )}
              {canWithdraw && submission.submittedAt && (
                <RailItem label="Review window">
                  <span
                    className={cn(
                      "font-body text-[12.5px] font-medium tabular-nums",
                      sla.overdue
                        ? "text-error-text"
                        : sla.warn
                          ? "text-warning-text"
                          : "text-foreground",
                    )}
                  >
                    {sla.text}
                  </span>
                </RailItem>
              )}
              {submission.decidedAt && (
                <RailItem label="Decided">{fmtSubmittedAt(submission.decidedAt)}</RailItem>
              )}
              <RailItem label="Routing">{routingLabel}</RailItem>
              <RailItem label="Version">
                <span className="font-mono text-[12px] tabular-nums">v{submission.version}</span>
              </RailItem>
            </dl>
          </DashboardSection>

          {canWithdraw && (
            <div className="rounded-xl border border-stroke-subtle bg-surface p-4">
              <p className="font-body text-[12.5px] font-semibold text-foreground">
                Need to make changes?
              </p>
              <p className="mt-1 font-body text-[11.5px] text-text-secondary leading-relaxed">
                Withdraw returns this packet to draft in your workroom. The mentor won&apos;t see it
                until you resubmit.
              </p>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={withdraw.isPending}
                className={cn(
                  "mt-3 w-full inline-flex items-center justify-center h-9 px-3.5 rounded-md",
                  "bg-surface border border-stroke",
                  "font-body text-[13px] font-semibold text-foreground",
                  "hover:text-error-text hover:border-error-border transition-colors duration-fast",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                )}
              >
                Withdraw submission
              </button>
            </div>
          )}
        </aside>
      </div>

      {confirmOpen && (
        <WithdrawModal
          submission={submission}
          pending={withdraw.isPending}
          onConfirm={doWithdraw}
          onCancel={() => setConfirmOpen(false)}
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

function StatusBanner({
  tone,
  title,
  description,
  href,
  cta,
  icon: Icon,
}: {
  tone: "warning" | "success";
  title: string;
  description: string;
  href: string;
  cta: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
}) {
  const styles =
    tone === "warning"
      ? "border-warning-border bg-warning-subtle/40"
      : "border-success-border bg-success-subtle/40";
  const text = tone === "warning" ? "text-warning-text" : "text-success-text";

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg border px-4 py-3.5 hover:opacity-95 transition-opacity duration-fast",
        styles,
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn("h-4 w-4 shrink-0 mt-0.5", text)} strokeWidth={2} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className={cn("font-body text-[13px] font-semibold", text)}>{title}</p>
          <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">{description}</p>
          <span className={cn("mt-2 inline-flex items-center gap-1 font-body text-[12px] font-semibold", text)}>
            {cta}
            <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ArtifactRow({ artifact }: { artifact: SubmissionArtifactDetail }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 hover:bg-bg-subtle transition-colors duration-fast">
      <FileIcon className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
      <a
        href={artifact.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 min-w-0 font-body text-[12.5px] font-medium text-foreground hover:underline truncate"
      >
        {artifact.name}
      </a>
      <span className="font-mono text-[11px] text-text-tertiary tabular-nums shrink-0">
        {fmtSize(artifact.sizeBytes)}
      </span>
      <span
        className={cn(
          "font-body text-[10.5px] font-semibold shrink-0",
          artifact.scanCleared
            ? "text-success-text"
            : artifact.scanError
              ? "text-error-text"
              : "text-text-tertiary italic",
        )}
      >
        {artifact.scanCleared ? (
          <span className="inline-flex items-center gap-0.5">
            <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden />
            scan
          </span>
        ) : artifact.scanError ? (
          "flagged"
        ) : (
          "pending"
        )}
      </span>
      <ExternalLink className="h-3 w-3 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
    </li>
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

function WithdrawModal({
  submission,
  pending,
  onConfirm,
  onCancel,
}: {
  submission: SubmissionDetail;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-title"
      className="fixed inset-0 z-modal flex items-center justify-center bg-black/40 p-4"
      onClick={pending ? undefined : onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-surface shadow-lg border border-stroke"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 py-3 border-b border-stroke-subtle">
          <h3 id="withdraw-title" className="font-body text-[14px] font-semibold text-foreground">
            Withdraw this submission?
          </h3>
        </header>
        <div className="px-4 py-3">
          <p className="font-body text-[12.5px] text-text-secondary leading-relaxed">
            The reviewer won&apos;t see it. You can edit and resubmit from the workroom.
          </p>
          <p className="mt-2 font-mono text-[11px] text-text-tertiary tabular-nums">
            v{submission.version}
            {submission.submittedAt ? ` · submitted ${fmtRelative(submission.submittedAt)}` : ""}
          </p>
        </div>
        <footer className="flex items-center justify-end gap-2 px-4 py-3 border-t border-stroke-subtle bg-bg-subtle">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="inline-flex items-center h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              "inline-flex items-center h-9 px-3.5 rounded-md shadow-xs",
              "bg-error-text text-white",
              "font-body text-[13px] font-semibold",
              "hover:opacity-90 transition-opacity duration-fast",
              "disabled:opacity-60 disabled:cursor-not-allowed",
            )}
          >
            {pending ? "Withdrawing…" : "Withdraw"}
          </button>
        </footer>
      </div>
    </div>
  );
}
