"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Send,
} from "lucide-react";
import { useSubmissionDetail, useTaskDetail } from "@/lib/hooks/use-contributor-tasks";
import { ContributorApiError } from "@/lib/api/contributor-tasks";
import { Skeleton } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { fmtMentorReviewWindow } from "@/app/contributor/tasks/lib/task-list-utils";
import { cn } from "@/lib/utils/cn";
import type { SubmissionDetail } from "@/lib/submissions/types";

const NEXT_STEPS = [
  {
    title: "Mentor pickup",
    body: "A mentor with matching skills takes your submission from the queue.",
  },
  {
    title: "Criteria review",
    body: "They check your notes and evidence against the acceptance criteria.",
  },
  {
    title: "Decision",
    body: "Accepted (payout + credential), revision requested, or rejected with rationale.",
  },
  {
    title: "Enterprise sign-off",
    body: "If accepted, an enterprise reviewer completes final business acceptance.",
  },
] as const;

const pageShell = "space-y-5 pb-12 animate-fade-in";

export default function SubmissionSuccessPage() {
  const params = useParams<{ taskId: string }>();
  const searchParams = useSearchParams();
  const taskId = params?.taskId ?? "";
  const submissionId = searchParams.get("submissionId") ?? "";

  const { data, isLoading, error } = useSubmissionDetail(submissionId || undefined);
  const { data: taskData } = useTaskDetail(taskId || undefined);
  const submission = data?.submission;
  const taskTitle = taskData?.task?.title ?? "Your task";

  if (isLoading && !submission) {
    return (
      <div className={pageShell}>
        <Skeleton className="h-4 w-36 rounded" />
        <Skeleton className="h-8 w-full max-w-lg rounded" />
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className={pageShell}>
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-4">
          <p className="font-body text-[13px] font-semibold text-error-text">
            {error instanceof ContributorApiError ? error.message : "Submission not found"}
          </p>
          <p className="mt-1 font-body text-[12.5px] text-error-text/85">
            This link may be stale. Open the task or your submissions list to continue.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <ActionLink href={`/contributor/tasks/${taskId}`} variant="outline">
              View task
            </ActionLink>
            <ActionLink href="/contributor/tasks/submissions" variant="ghost">
              My submissions
            </ActionLink>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SubmissionSuccessView taskId={taskId} taskTitle={taskTitle} submission={submission} />
  );
}

function SubmissionSuccessView({
  taskId,
  taskTitle,
  submission,
}: {
  taskId: string;
  taskTitle: string;
  submission: SubmissionDetail;
}) {
  const review = fmtMentorReviewWindow(submission.submittedAt, submission.status);
  const submittedLabel = submission.submittedAt
    ? new Date(submission.submittedAt).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

  return (
    <div className={pageShell}>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {taskTitle}
          </h1>
          <p className="mt-2 font-body text-[12.5px] text-text-secondary max-w-2xl">
            Round {submission.version} · Your deliverable is in the mentor review queue. You&apos;ll be notified when there&apos;s
            a decision.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <ActionLink href="/contributor/tasks/submissions" variant="primary" icon={Send}>
            Track in Submissions
          </ActionLink>
        </div>
      </header>

      <div className="rounded-xl border border-success-border bg-success-subtle/50 px-5 py-4 flex items-start gap-3">
        <CheckCircle2
          className="h-5 w-5 text-success-text shrink-0 mt-0.5"
          strokeWidth={2.25}
          aria-hidden
        />
        <div className="min-w-0">
          <p className="font-body text-[15px] font-semibold text-success-text">Submission received</p>
          <p className="mt-1 font-body text-[13px] text-text-secondary leading-relaxed">
            Nothing else is required from you right now. Track progress under{" "}
            <Link
              href="/contributor/tasks/submissions"
              className="font-medium text-brand hover:underline"
            >
              Submissions
            </Link>
            .
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <DashboardSection
            title="Submission summary"
            description="Snapshot at the time you submitted"
          >
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
              <SummaryFact label="Version" value={`v${submission.version}`} mono />
              <SummaryFact label="Submitted" value={submittedLabel} mono />
              <SummaryFact label="Status" value={statusLabel(submission.status)} />
              <SummaryFact
                label="Evidence"
                value={`${submission.artifacts.length} file${submission.artifacts.length === 1 ? "" : "s"} attached`}
              />
              {review.text !== "—" && (
                <SummaryFact
                  label="Mentor review window"
                  value={review.text}
                  mono
                  hint="Typical response time — not your coding deadline"
                  className="sm:col-span-2 lg:col-span-1"
                />
              )}
            </dl>
          </DashboardSection>

          <DashboardSection
            title="What happens next"
            description="Four stages from here to payout or revision"
          >
            <ol className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4">
              {NEXT_STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-4 py-3.5"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                        i === 0
                          ? "bg-brand text-on-brand ring-2 ring-brand/25"
                          : "border border-stroke bg-surface text-text-tertiary",
                      )}
                      aria-hidden
                    >
                      {i === 0 ? (
                        <Clock className="h-3.5 w-3.5" strokeWidth={2.25} />
                      ) : (
                        <span className="font-mono text-[11px] font-semibold tabular-nums">
                          {i + 1}
                        </span>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="font-body text-[13px] font-semibold text-foreground">
                        {step.title}
                      </p>
                      <p className="mt-0.5 font-body text-[12.5px] text-text-secondary leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </DashboardSection>
        </div>

        <aside className="xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1.5rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain self-start space-y-5">
          <DashboardSection title="Next actions" description="Where to go from here">
            <div className="flex flex-col gap-2">
              <ActionLink href={`/contributor/tasks/${taskId}`} variant="outline" icon={FileText} block>
                View task
              </ActionLink>
              <ActionLink href="/contributor/tasks" variant="ghost" block>
                Back to Assigned
              </ActionLink>
            </div>
          </DashboardSection>

          {review.text !== "—" && (
            <DashboardSection title="Review timing" description="Mentor queue expectations">
              <p className="font-body text-[13px] font-semibold text-foreground tabular-nums">
                {review.text}
              </p>
              <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">
                This is how long the mentor typically has to respond — not your coding deadline.
              </p>
            </DashboardSection>
          )}
        </aside>
      </div>
    </div>
  );
}

function SummaryFact({
  label,
  value,
  mono,
  hint,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="font-body text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-body text-[13px] text-foreground",
          mono && "font-mono tabular-nums",
        )}
      >
        {value}
      </dd>
      {hint && (
        <dd className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{hint}</dd>
      )}
    </div>
  );
}

function ActionLink({
  href,
  children,
  variant,
  icon: Icon,
  block,
}: {
  href: string;
  children: React.ReactNode;
  variant: "primary" | "outline" | "ghost";
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  block?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-md font-body text-[13px] font-semibold transition-colors duration-fast",
        block && "w-full",
        variant === "primary" &&
          "bg-brand text-on-brand shadow-xs hover:bg-brand-hover",
        variant === "outline" &&
          "bg-surface border border-stroke text-foreground hover:bg-surface-hover",
        variant === "ghost" &&
          "text-text-secondary hover:text-foreground hover:bg-bg-subtle border border-transparent",
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />}
      {children}
      {variant === "primary" && (
        <ArrowUpRight className="h-3.5 w-3.5 opacity-80 ml-auto" strokeWidth={2} aria-hidden />
      )}
    </Link>
  );
}

function statusLabel(s: string): string {
  if (s === "submitted") return "Submitted — under review";
  if (s === "resubmitted") return "Resubmitted — under review";
  if (s === "under_review") return "Under review";
  if (s === "feedback_requested") return "Revision requested";
  if (s === "accepted") return "Accepted";
  if (s === "rejected") return "Rejected";
  return s.replace(/_/g, " ");
}
