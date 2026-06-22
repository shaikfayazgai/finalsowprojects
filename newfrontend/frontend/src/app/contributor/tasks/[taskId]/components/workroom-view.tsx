"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  Send,
  Save,
} from "lucide-react";
import {
  useAcceptTask,
  useCreateDraft,
  useUpdateSubmission,
  useSubmitSubmission,
} from "@/lib/hooks/use-contributor-tasks";
import { ContributorApiError, type ContributorTaskDetail } from "@/lib/api/contributor-tasks";
import {
  ContributorStatusBadge,
  deriveContributorStatus,
} from "@/components/contributor/task-status-badge";
import { WorkroomArtifacts } from "@/components/contributor/workroom-artifacts";
import { DashboardSection } from "@/components/meridian/dashboard";
import {
  CONTRIBUTOR_PAYMENT_NOTE,
  fmtDeliveryDeadline,
  fmtEstimatedPayoutOnAcceptance,
  fmtPayout,
  isRevisionLaneTask,
  isSubmissionLaneTask,
} from "@/app/contributor/tasks/lib/task-list-utils";
import { cn } from "@/lib/utils/cn";

const PROGRESS_STAGES = [
  { key: "assigned", label: "Assigned" },
  { key: "in_progress", label: "In progress" },
  { key: "revision", label: "Revision" },
  { key: "submitted", label: "Submitted" },
  { key: "accepted", label: "Accepted" },
] as const;

type ProgressStage = (typeof PROGRESS_STAGES)[number]["key"];

function currentStage(taskStatus: string, submissionStatus: string | undefined): ProgressStage {
  if (submissionStatus === "accepted") return "accepted";
  if (submissionStatus === "feedback_requested") return "revision";
  if (
    submissionStatus === "submitted" ||
    submissionStatus === "under_review" ||
    submissionStatus === "resubmitted"
  ) {
    return "submitted";
  }
  if (taskStatus === "in_progress" || submissionStatus === "draft") return "in_progress";
  return "assigned";
}

/** Verify the deliverable link is a real GitHub repo/PR URL (github.com/org/repo…). */
function isGithubUrl(s: string): boolean {
  const v = s.trim();
  if (!v) return false;
  try {
    const u = new URL(v);
    const okProto = u.protocol === "https:" || u.protocol === "http:";
    const okHost = /(^|\.)github\.com$/i.test(u.hostname);
    const segs = u.pathname.split("/").filter(Boolean); // [org, repo, ...]
    return okProto && okHost && segs.length >= 2;
  } catch {
    return false;
  }
}

function splitCriteria(s: string | null): string[] {
  if (!s) return [];
  return s
    .split(/\r?\n|(?:^|\s)[•·▪►-]\s+/g)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

function taskAsSummary(task: ContributorTaskDetail) {
  return task;
}

interface WorkroomViewProps {
  task: ContributorTaskDetail;
  taskId: string;
}

export function WorkroomView({ task, taskId }: WorkroomViewProps) {
  const router = useRouter();
  const accept = useAcceptTask(taskId);
  const create = useCreateDraft();

  const submission = task.submissions?.[0] ?? null;
  const isEditable =
    submission?.status === "draft" || submission?.status === "feedback_requested";

  const [bodyDraft, setBodyDraft] = React.useState("");
  const [githubUrl, setGithubUrl] = React.useState("");
  const [completionPct, setCompletionPct] = React.useState(100);
  const [dirty, setDirty] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (submission && !dirty) {
      setBodyDraft(submission.body ?? "");
      setGithubUrl(
        submission.githubUrl ?? ((submission.payload?.githubUrl as string | undefined) ?? ""),
      );
      const pct = submission.completionPct ?? (submission.payload?.completionPct as number | undefined);
      setCompletionPct(typeof pct === "number" ? pct : 100);
    }
  }, [submission, submission?.id, dirty]);
  React.useEffect(() => {
    setDirty(false);
  }, [submission?.id]);

  const update = useUpdateSubmission(submission?.id ?? "");
  const submit = useSubmitSubmission(submission?.id ?? "");

  const summaryForLane = React.useMemo(
    () => ({
      ...task,
      latestSubmission: submission
        ? {
            id: submission.id,
            version: submission.version,
            status: submission.status,
            submittedAt: submission.submittedAt,
            decidedAt: submission.decidedAt,
          }
        : null,
    }),
    [task, submission],
  );

  const inSubmissionLane = isSubmissionLaneTask(summaryForLane);
  const inRevisionLane = isRevisionLaneTask(summaryForLane);

  const criteria = splitCriteria(task.acceptanceCriteria);
  const stage = currentStage(task.status, submission?.status);
  const delivery = fmtDeliveryDeadline(taskAsSummary(task));
  const payoutLabel = fmtEstimatedPayoutOnAcceptance(taskAsSummary(task));
  const contributorLabel = deriveContributorStatus(task.status, submission?.status);

  const readiness =
    stage === "accepted"
      ? 100
      : stage === "submitted"
        ? 100
        : stage === "revision"
          ? 60
          : stage === "in_progress"
            ? dirty || bodyDraft
              ? 50
              : 25
            : 0;

  const doAccept = async () => {
    setActionError(null);
    try {
      await accept.mutateAsync();
    } catch (e) {
      setActionError(e instanceof ContributorApiError ? e.message : (e as Error).message);
    }
  };

  const doStartDraft = async () => {
    setActionError(null);
    try {
      await create.mutateAsync({ taskDefinitionId: taskId, body: "" });
    } catch (e) {
      setActionError(e instanceof ContributorApiError ? e.message : (e as Error).message);
    }
  };

  // The GitHub deliverable link is REQUIRED + verified; notes and files are optional.
  const githubOk = isGithubUrl(githubUrl);

  const doSave = async () => {
    setActionError(null);
    if (!submission) return;
    try {
      await update.mutateAsync({ body: bodyDraft, payload: { githubUrl: githubUrl.trim(), completionPct } });
      setDirty(false);
    } catch (e) {
      setActionError(e instanceof ContributorApiError ? e.message : (e as Error).message);
    }
  };

  const doSubmit = async () => {
    setActionError(null);
    if (!submission) return;
    if (!githubOk) {
      setActionError("A valid GitHub repository or pull-request link is required to submit (e.g. https://github.com/org/repo).");
      return;
    }
    // Persist link + notes + completion % before submitting.
    try {
      await update.mutateAsync({ body: bodyDraft, payload: { githubUrl: githubUrl.trim(), completionPct } });
      setDirty(false);
    } catch (e) {
      setActionError(e instanceof ContributorApiError ? e.message : (e as Error).message);
      return;
    }
    try {
      await submit.mutateAsync();
      router.push(`/contributor/tasks/${taskId}/submit/success?submissionId=${submission.id}`);
    } catch (e) {
      setActionError(e instanceof ContributorApiError ? e.message : (e as Error).message);
    }
  };

  const showAccept = task.status === "matched" && !submission;
  const showOpenDraft = task.status === "in_progress" && !submission;

  return (
    <div className="space-y-5 pb-24 animate-fade-in">
      <BackLink />

      {inSubmissionLane && (
        <LaneBanner
          tone="info"
          title="This task is in review"
          href="/contributor/tasks/submissions"
          linkLabel="Open submissions"
        >
          Your work has been submitted. Track mentor review progress from the Submissions view.
        </LaneBanner>
      )}

      {inRevisionLane && (
        <LaneBanner
          tone="warning"
          title="Revision requested"
          href={`/contributor/tasks/revisions/${taskId}`}
          linkLabel="Open revision workroom"
        >
          Mentor feedback is waiting. Continue in the Revisions workroom to address corrections.
        </LaneBanner>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {task.title}
          </h1>
          {(task.taskRef || submission?.submissionRef) && (
            <p className="mt-1 font-mono text-[11px] text-text-tertiary tabular-nums inline-flex items-center gap-2 flex-wrap">
              {task.taskRef && <span>Task {task.taskRef}</span>}
              {task.taskRef && submission?.submissionRef && <span aria-hidden className="opacity-50">·</span>}
              {submission?.submissionRef && <span>Submission {submission.submissionRef}</span>}
            </p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
            <ContributorStatusBadge
              taskStatus={task.status}
              submissionStatus={submission?.status}
            />
            {submission && submission.version > 0 && (
              <>
                <span aria-hidden>·</span>
                <span className="tabular-nums">Round {submission.version}</span>
              </>
            )}
            {task.sow?.title && (
              <>
                <span aria-hidden>·</span>
                <span className="font-medium text-text-secondary">{task.sow.title}</span>
              </>
            )}
            {task.milestone && (
              <>
                <span aria-hidden>·</span>
                <span>{task.milestone.name}</span>
              </>
            )}
            {delivery.text !== "—" && (
              <>
                <span aria-hidden>·</span>
                <span
                  className={cn(
                    "tabular-nums",
                    delivery.overdue && "font-medium text-error-text",
                  )}
                  title="Delivery deadline — when you should submit, based on agreed estimate"
                >
                  {delivery.text}
                </span>
              </>
            )}
          </div>
          {payoutLabel && (
            <p className="mt-2 font-body text-[12px] text-text-secondary">{payoutLabel}</p>
          )}
          <p className="mt-1 font-body text-[11.5px] text-text-tertiary leading-relaxed max-w-xl">
            {CONTRIBUTOR_PAYMENT_NOTE}
            {showAccept && (
              <>
                {" "}
                Accept the assignment above to unlock drafting and evidence upload.
              </>
            )}
            {showOpenDraft && (
              <>
                {" "}
                Open draft above to start working notes and evidence.
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {showAccept && (
            <button
              type="button"
              onClick={doAccept}
              disabled={accept.isPending}
              className={primaryBtnCls}
            >
              {accept.isPending ? "Accepting..." : "Accept & start"}
            </button>
          )}
          {showOpenDraft && (
            <button
              type="button"
              onClick={doStartDraft}
              disabled={create.isPending}
              className={primaryBtnCls}
            >
              {create.isPending ? "Opening…" : "Open draft"}
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          <DashboardSection title="Brief" description="What you are delivering and why it matters">
            {task.description ? (
              <p className="font-body text-[13px] text-foreground leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            ) : (
              <p className="font-body text-[13px] text-text-tertiary italic">
                No brief content yet. The reviewer is preparing it.
              </p>
            )}
          </DashboardSection>

          {task.referenceFiles && task.referenceFiles.length > 0 && (
            <DashboardSection
              title="Reference files"
              description="Materials the enterprise attached to this task — download to get started"
            >
              <ul className="divide-y divide-stroke-subtle -mx-5">
                {task.referenceFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-5 py-2.5 min-h-[44px]">
                    <span className="font-body text-[13px] text-foreground truncate min-w-0">
                      {f.name || "file"}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      {f.sizeBytes ? (
                        <span className="font-mono text-[10.5px] text-text-tertiary tabular-nums">
                          {(f.sizeBytes / 1024).toFixed(0)} KB
                        </span>
                      ) : null}
                      {f.url ? (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-stroke font-body text-[11.5px] font-semibold text-foreground hover:bg-surface-hover"
                        >
                          <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden />
                          Download
                        </a>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </DashboardSection>
          )}

          <DashboardSection
            title="Acceptance criteria"
            description={
              criteria.length > 0
                ? `${criteria.length} checkpoints before you submit`
                : "Criteria will appear when the brief is finalized"
            }
          >
            {criteria.length === 0 ? (
              <p className="font-body text-[13px] text-text-tertiary italic">No criteria defined.</p>
            ) : (
              <ul className="space-y-2">
                {criteria.map((c, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Circle
                      className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="font-body text-[13px] text-foreground leading-snug">{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>

          {submission?.decisionRationale &&
            (submission.status === "feedback_requested" || submission.status === "rejected") && (
              <DashboardSection
                title="Reviewer feedback"
                description={
                  submission.status === "rejected"
                    ? "Submission was rejected"
                    : "Address before resubmitting"
                }
              >
                <p className="font-body text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                  {submission.decisionRationale}
                </p>
              </DashboardSection>
            )}

          {submission && (
            <DashboardSection
              title="Deliverable link (required)"
              description="Your GitHub repository or pull-request link — verified before submit"
            >
              {isEditable ? (
                <>
                  <input
                    type="url"
                    inputMode="url"
                    value={githubUrl}
                    onChange={(e) => {
                      setGithubUrl(e.target.value);
                      setDirty(true);
                    }}
                    placeholder="https://github.com/your-org/your-repo"
                    className={cn(
                      "w-full rounded-lg border bg-surface px-3 py-2.5 font-body text-[13px] text-foreground placeholder:text-text-disabled",
                      "focus-visible:outline-none focus-visible:ring-2",
                      githubUrl && !githubOk
                        ? "border-error-border focus-visible:border-error-border focus-visible:ring-error-border/25"
                        : githubOk
                          ? "border-success-text/50 focus-visible:border-success-text focus-visible:ring-success-text/25"
                          : "border-stroke focus-visible:border-brand focus-visible:ring-brand/25",
                    )}
                  />
                  {githubOk ? (
                    <p className="mt-1.5 font-body text-[11px] font-medium text-success-text inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                      Verified GitHub link
                    </p>
                  ) : (
                    <p className="mt-1.5 font-body text-[11px] text-text-tertiary">
                      {githubUrl
                        ? "Not a valid GitHub link — use https://github.com/org/repo"
                        : "Required. Paste your GitHub repository or pull-request link — the mentor opens it to review your work."}
                    </p>
                  )}
                </>
              ) : githubUrl ? (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-body text-[13px] font-medium text-text-link hover:underline break-all"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
                  {githubUrl}
                </a>
              ) : (
                <p className="font-body text-[13px] text-text-tertiary">No link provided.</p>
              )}
            </DashboardSection>
          )}

          {submission && (
            <DashboardSection
              title="Task completion"
              description="How complete is your work? Shown to the mentor and reviewer."
            >
              {isEditable ? (
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={completionPct}
                    onChange={(e) => {
                      setCompletionPct(Number(e.target.value));
                      setDirty(true);
                    }}
                    className="flex-1 accent-brand"
                    aria-label="Task completion percentage"
                  />
                  <span className="font-body text-[15px] font-semibold text-foreground tabular-nums w-12 text-right">
                    {completionPct}%
                  </span>
                </div>
              ) : (
                <p className="font-body text-[15px] font-semibold text-foreground tabular-nums">
                  {completionPct}% complete
                </p>
              )}
            </DashboardSection>
          )}

          {submission && (
            <DashboardSection
              title="Working notes"
              description="Explain how your deliverable meets each criterion"
              actions={
                <span className="font-mono text-[11px] text-text-tertiary tabular-nums">
                  v{submission.version}
                </span>
              }
            >
              {isEditable ? (
                <>
                  <textarea
                    value={bodyDraft}
                    onChange={(e) => {
                      setBodyDraft(e.target.value);
                      setDirty(true);
                    }}
                    rows={10}
                    placeholder="Describe what you built and how it satisfies the acceptance criteria."
                    className={cn(
                      "w-full rounded-lg border border-stroke bg-surface px-3 py-2.5",
                      "font-body text-[13px] text-foreground placeholder:text-text-disabled",
                      "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25",
                    )}
                  />
                  <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-text-tertiary tabular-nums">
                    <span>{bodyDraft.length} / 5000</span>
                    {dirty && <span className="text-warning-text font-medium">Unsaved changes</span>}
                  </div>
                </>
              ) : (
                <pre className="whitespace-pre-wrap rounded-lg bg-bg-subtle px-3 py-2.5 font-body text-[13px] text-foreground">
                  {submission.body || "(no notes)"}
                </pre>
              )}
            </DashboardSection>
          )}

          {submission && (
            <DashboardSection
              title="Evidence (optional)"
              description={
                submission.artifacts?.length
                  ? `${submission.artifacts.length} file${submission.artifacts.length === 1 ? "" : "s"} attached`
                  : "Optionally upload files (screenshots, docs) that support your submission"
              }
            >
              <WorkroomArtifacts
                submissionId={submission.id}
                taskId={taskId}
                artifacts={submission.artifacts}
                readOnly={!isEditable}
              />
            </DashboardSection>
          )}

          {actionError && (
            <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 font-body text-[13px] text-error-text">
              {actionError}
            </div>
          )}
        </div>

        <aside className="xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1.5rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain self-start space-y-5">
          <DashboardSection
            title="Progress"
            description={`Step ${PROGRESS_STAGES.findIndex((s) => s.key === stage) + 1} of ${PROGRESS_STAGES.length}`}
          >
            <ProgressTimeline stage={stage} />
          </DashboardSection>

          <DashboardSection title="Context" description="Assignment metadata">
            <dl className="grid grid-cols-1 gap-3">
              <Fact label="Status" value={contributorLabel.replace(/_/g, " ")} />
              {task.estimatedHours != null && (
                <Fact label="Agreed estimate" value={`${task.estimatedHours}h`} mono />
              )}
              {task.payNetMinor != null && task.payNetMinor > 0 ? (
                <Fact
                  label="Your pay (take-home)"
                  value={`${(task.payCurrency ?? "INR") === "INR" ? "₹" : `${task.payCurrency ?? ""} `}${((task.payNetMinor ?? 0) / 100).toLocaleString("en-IN")}`}
                  mono
                  hint="Paid in full · set by Glimmora · GST is never deducted from you"
                />
              ) : fmtPayout(taskAsSummary(task)) ? (
                <Fact
                  label="Payout on acceptance"
                  value={fmtPayout(taskAsSummary(task))!}
                  mono
                  hint="Fixed scope — not a timesheet"
                />
              ) : null}
              {task.sow?.tenantName && <Fact label="Client" value={task.sow.tenantName} />}
              {task.requiredSkills.length > 0 && (
                <Fact label="Skills" value={task.requiredSkills.join(", ")} />
              )}
              <Fact
                label="Readiness"
                value={`${readiness}%`}
                mono
                hint={
                  readiness >= 80
                    ? "Almost ready to submit"
                    : criteria.length > 0
                      ? `${criteria.length} criteria to address`
                      : "Complete your draft notes"
                }
              />
            </dl>
          </DashboardSection>
        </aside>
      </div>

      {submission && isEditable && !inRevisionLane && (
        <footer className="fixed bottom-0 left-0 lg:left-[256px] right-0 z-sticky border-t border-stroke bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/90 shadow-xs">
          <div className="flex flex-col gap-2.5 px-5 sm:px-6 py-3 sm:flex-row sm:items-center sm:gap-4">
            <div
              className="flex items-center gap-3 min-w-0 w-full sm:flex-1"
              role="progressbar"
              aria-valuenow={readiness}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Submission readiness"
            >
              <div className="flex-1 h-2 rounded-full bg-bg-subtle overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all duration-fast"
                  style={{ width: `${readiness}%` }}
                />
              </div>
              <span className="font-body text-[12px] font-medium text-foreground whitespace-nowrap shrink-0 tabular-nums">
                {readiness}%
              </span>
            </div>
            <p className="font-body text-[11.5px] text-text-secondary sm:hidden">
              Readiness to submit — complete notes and evidence before submitting.
            </p>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={doSave}
                disabled={!dirty || update.isPending}
                className={cn(
                  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
                  "bg-surface border border-stroke",
                  "font-body text-[13px] font-semibold text-foreground",
                  "hover:bg-surface-hover transition-colors duration-fast",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
              >
                <Save className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {update.isPending ? "Saving…" : "Save draft"}
              </button>
              <button
                type="button"
                onClick={doSubmit}
                disabled={submit.isPending || !githubOk}
                title={!githubOk ? "Add a valid GitHub link first" : undefined}
                className={primaryBtnCls}
              >
                {submit.isPending ? "Submitting…" : "Submit"}
                <Send className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/contributor/tasks"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary hover:text-foreground transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to assigned
    </Link>
  );
}

function LaneBanner({
  tone,
  title,
  href,
  linkLabel,
  children,
}: {
  tone: "info" | "warning";
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  const cls =
    tone === "warning"
      ? "border-warning-border bg-warning-subtle"
      : "border-brand/30 bg-brand-subtle/40";
  const titleCls = tone === "warning" ? "text-warning-text" : "text-brand-subtle-text";
  const bodyCls = tone === "warning" ? "text-warning-text/90" : "text-text-secondary";

  return (
    <div className={cn("rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3", cls)}>
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        <AlertTriangle
          className={cn("h-4 w-4 shrink-0 mt-0.5", titleCls)}
          strokeWidth={2}
          aria-hidden
        />
        <div className="min-w-0">
          <p className={cn("font-body text-[13px] font-semibold", titleCls)}>{title}</p>
          <p className={cn("mt-0.5 font-body text-[12.5px] leading-relaxed", bodyCls)}>{children}</p>
        </div>
      </div>
      <Link
        href={href}
        className={cn(
          "inline-flex items-center gap-1 h-8 px-3 rounded-md shrink-0",
          "bg-surface border border-stroke font-body text-[12.5px] font-semibold text-foreground",
          "hover:bg-surface-hover transition-colors duration-fast",
        )}
      >
        {linkLabel}
        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}

const STAGE_HINT: Record<ProgressStage, string> = {
  assigned: "Review the brief and accept the assignment",
  in_progress: "Draft your notes and attach evidence",
  revision: "Address mentor feedback and resubmit",
  submitted: "Waiting for reviewer decision",
  accepted: "Work approved — payout follows",
};

function ProgressTimeline({ stage }: { stage: ProgressStage }) {
  const currentIdx = PROGRESS_STAGES.findIndex((s) => s.key === stage);
  const current = PROGRESS_STAGES[currentIdx];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-brand/30 bg-brand-subtle/30 px-3.5 py-2.5">
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-subtle-text">
          Current step
        </p>
        <p className="mt-0.5 font-body text-[14px] font-semibold text-foreground leading-snug">
          {current?.label ?? stage}
        </p>
        <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">
          {STAGE_HINT[stage]}
        </p>
      </div>

      <ol className="space-y-0" aria-label="Task lifecycle">
        {PROGRESS_STAGES.map((s, i) => {
          const done = i < currentIdx;
          const isCurrent = i === currentIdx;
          const upcoming = i > currentIdx;

          return (
            <li key={s.key} className="relative flex gap-3 pb-4 last:pb-0">
              {i < PROGRESS_STAGES.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[11px] top-6 bottom-0 w-px",
                    done ? "bg-foreground/25" : "bg-stroke-subtle",
                  )}
                />
              )}

              <span
                className={cn(
                  "relative z-[1] flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  isCurrent && "bg-brand text-on-brand ring-2 ring-brand/25",
                  done && !isCurrent && "bg-foreground text-bg",
                  upcoming && "border border-stroke bg-surface text-text-tertiary",
                )}
                aria-hidden
              >
                {done && !isCurrent ? (
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                ) : (
                  <span className="font-mono text-[11px] font-semibold tabular-nums leading-none">
                    {i + 1}
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <p
                  className={cn(
                    "font-body text-[13px] leading-snug",
                    isCurrent
                      ? "font-semibold text-foreground"
                      : done
                        ? "font-medium text-text-secondary"
                        : "text-text-tertiary",
                  )}
                >
                  {s.label}
                  {isCurrent && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-brand-subtle px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-brand-subtle-text align-middle">
                      Now
                    </span>
                  )}
                </p>
                <p
                  className={cn(
                    "mt-0.5 font-body text-[12px] leading-relaxed",
                    isCurrent ? "text-text-secondary" : "text-text-tertiary",
                  )}
                >
                  {STAGE_HINT[s.key]}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Fact({
  label,
  value,
  mono,
  hint,
}: {
  label: string;
  value: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <dt className="font-body text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-0.5 font-body text-[13px] text-foreground capitalize",
          mono && "font-mono tabular-nums normal-case",
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

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-60 disabled:cursor-not-allowed",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
);
