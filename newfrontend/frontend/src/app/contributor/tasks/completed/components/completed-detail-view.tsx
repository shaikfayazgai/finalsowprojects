"use client";

/**
 * Completed task detail — full-width workroom pattern (matches submission / revision).
 */

import * as React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Award,
  Check,
  CheckCircle2,
  ExternalLink,
  File as FileIcon,
} from "lucide-react";
import { type CompletedTaskDetailResponse } from "@/lib/api/contributor-mock";
import {
  getCompletedTaskDetail,
  getTaskHistory,
  type TaskHistory,
} from "@/lib/api/contributor-task-views";
import { TaskHistoryPanel } from "./task-history-panel";
import { DashboardSection } from "@/components/meridian/dashboard";
import { Skeleton, StatusChip } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import {
  fmtAcceptedDate,
  fmtINR,
  fmtRelative,
  fmtSize,
  payoutStatusChip,
  payoutStatusLabel,
} from "../lib/completed-ui-utils";
import { CompletedCredentialModal } from "./completed-credential-modal";

interface CompletedDetailViewProps {
  taskId: string;
  showCredentialModal: boolean;
  onCloseCredentialModal: () => void;
}

export function CompletedDetailView({
  taskId,
  showCredentialModal,
  onCloseCredentialModal,
}: CompletedDetailViewProps) {
  const [data, setData] = React.useState<CompletedTaskDetailResponse | null>(null);
  const [history, setHistory] = React.useState<TaskHistory | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [notFound, setNotFound] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [inPortfolio, setInPortfolio] = React.useState(true);

  React.useEffect(() => {
    if (!taskId) return;
    const c = new AbortController();
    setLoading(true);
    setError(null);
    setNotFound(false);
    // History + ratings load independently (best-effort) — never blocks the page.
    getTaskHistory(taskId)
      .then((h) => {
        if (!c.signal.aborted) setHistory(h);
      })
      .catch(() => {});
    getCompletedTaskDetail(taskId)
      .then((res) => {
        if (!c.signal.aborted) setData(res);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        if ((err as { status?: number }).status === 404) setNotFound(true);
        else setError(err instanceof Error ? err.message : "Could not load task.");
      })
      .finally(() => {
        if (!c.signal.aborted) setLoading(false);
      });
    return () => c.abort();
  }, [taskId]);

  if (loading) return <DetailSkeleton />;

  if (notFound || error) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 font-body text-[12.5px] text-error-text">
          {notFound ? "Task not found." : error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { task, submission, payout, credential } = data;
  const payoutMinor =
    payout?.amountMinor ?? Math.round(task.estimatedHours * task.agreedRatePerHour * 100);
  const payoutStatus = payout?.status ?? "eligible";
  const mentor = submission?.reviewerName ?? task.mentor.name;
  const acceptedAt = task.decidedAt ?? submission?.decidedAt ?? null;

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
                  <StatusChip status="success" size="sm">
                    Accepted
                  </StatusChip>
                  <span aria-hidden className="opacity-40">·</span>
                  <span>{task.sow.tenantName}</span>
                  {acceptedAt && (
                    <>
                      <span aria-hidden className="opacity-40">·</span>
                      <span>Accepted {fmtRelative(acceptedAt)}</span>
                    </>
                  )}
                  <span aria-hidden className="opacity-40">·</span>
                  <span className="tabular-nums">Round {task.round}</span>
                </p>
              </div>

              {credential && (
                <Link
                  href={`/contributor/credentials/${credential.id}`}
                  className="inline-flex h-9 items-center gap-1.5 px-3.5 rounded-md bg-brand text-on-brand font-body text-[13px] font-semibold hover:bg-brand-hover shrink-0"
                >
                  View credential
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </Link>
              )}
            </div>
          </header>

          {submission?.feedback?.whatWorked && (
            <div className="rounded-lg border border-success-border bg-success-subtle/40 px-4 py-3.5">
              <p className="font-body text-[12px] font-semibold text-success-text">
                What worked · {mentor}
              </p>
              <p className="mt-1.5 font-body text-[12.5px] text-foreground leading-relaxed whitespace-pre-wrap">
                {submission.feedback.whatWorked}
              </p>
            </div>
          )}

          <DashboardSection title="Cover note" description="Final submission context at acceptance">
            {submission?.body ? (
              <pre className="whitespace-pre-wrap rounded-lg bg-bg-subtle px-4 py-3 font-body text-[12.5px] text-foreground leading-relaxed">
                {submission.body}
              </pre>
            ) : (
              <p className="font-body text-[12.5px] text-text-tertiary italic">No note attached.</p>
            )}
          </DashboardSection>

          <DashboardSection
            title={`Evidence${submission?.artifacts.length ? ` (${submission.artifacts.length})` : ""}`}
            description="Files and links included in the accepted packet"
          >
            {!submission || submission.artifacts.length === 0 ? (
              <p className="font-body text-[12.5px] text-text-tertiary italic">No evidence attached.</p>
            ) : (
              <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke overflow-hidden">
                {submission.artifacts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-bg-subtle transition-colors duration-fast"
                  >
                    <FileIcon className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0 font-body text-[12.5px] font-medium text-foreground hover:underline truncate"
                    >
                      {a.name}
                    </a>
                    <span className="font-mono text-[11px] text-text-tertiary tabular-nums shrink-0">
                      {fmtSize(a.sizeBytes)}
                    </span>
                    <span className="inline-flex items-center gap-0.5 font-body text-[10.5px] font-semibold text-success-text shrink-0">
                      <CheckCircle2 className="h-3 w-3" strokeWidth={2} aria-hidden />
                      scan
                    </span>
                    <ExternalLink className="h-3 w-3 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>

          <DashboardSection
            title={`Acceptance criteria (${task.acceptanceCriteria.length})`}
            description="All criteria met at acceptance"
          >
            {task.acceptanceCriteria.length === 0 ? (
              <p className="font-body text-[12.5px] text-text-tertiary italic">No criteria defined.</p>
            ) : (
              <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke overflow-hidden">
                {task.acceptanceCriteria.map((c, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 px-3 py-2.5 bg-success-subtle/5"
                  >
                    <span
                      aria-hidden
                      className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-sm border border-success-border bg-success-subtle text-success-text shrink-0"
                    >
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    </span>
                    <span className="font-body text-[12.5px] text-foreground leading-snug">{c}</span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardSection>

          {history && <TaskHistoryPanel history={history} />}
        </div>

        <aside className="xl:sticky xl:top-[calc(var(--shell-topbar-height,52px)+1rem)] xl:self-start xl:max-h-[calc(100dvh-var(--shell-topbar-height,52px)-2rem)] xl:overflow-y-auto xl:overscroll-y-contain space-y-4">
          <DashboardSection title="Acceptance record" description="Final decision on this task">
            <dl className="space-y-3">
              <RailItem label="Status">
                <StatusChip status="success" size="sm">
                  Accepted
                </StatusChip>
              </RailItem>
              <RailItem label="Mentor">{mentor}</RailItem>
              <RailItem label="Project">{task.sow.title}</RailItem>
              {acceptedAt && (
                <RailItem label="Accepted">{fmtAcceptedDate(acceptedAt)}</RailItem>
              )}
              <RailItem label="Round">
                <span className="font-mono text-[12px] tabular-nums">{task.round}</span>
              </RailItem>
            </dl>
          </DashboardSection>

          <DashboardSection title="Payout" description="Fixed scope amount on acceptance">
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-body text-[11px] text-text-tertiary">Amount</span>
                <span className="font-body text-[20px] font-semibold text-foreground tabular-nums tracking-[-0.02em]">
                  {fmtINR(payoutMinor)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-body text-[11px] text-text-tertiary">Status</span>
                <StatusChip status={payoutStatusChip(payoutStatus)} size="sm">
                  {payoutStatusLabel(payoutStatus)}
                </StatusChip>
              </div>
              {payout?.externalRef && (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-body text-[11px] text-text-tertiary">Reference</span>
                  <span className="font-mono text-[11px] text-text-secondary tabular-nums truncate max-w-[160px]">
                    {payout.externalRef}
                  </span>
                </div>
              )}
              {payout?.paidAt && (
                <div className="flex items-center justify-between gap-3">
                  <span className="font-body text-[11px] text-text-tertiary">Paid</span>
                  <span className="font-body text-[12.5px] text-foreground tabular-nums">
                    {fmtAcceptedDate(payout.paidAt)}
                  </span>
                </div>
              )}
            </div>
          </DashboardSection>

          {credential && (
            <DashboardSection title="Credential" description="Skill credential issued for this work">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-subtle text-brand shrink-0">
                  <Award className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[13px] font-semibold text-foreground">
                    {credential.skill} · {credential.level}
                  </p>
                  <p className="mt-0.5 font-body text-[11.5px] text-text-secondary leading-relaxed">
                    Issued {fmtAcceptedDate(credential.issuedAt)} · {credential.verifierOrg}
                  </p>
                  <Link
                    href={`/contributor/credentials/${credential.id}`}
                    className="mt-2 inline-flex items-center gap-1 font-body text-[12px] font-semibold text-text-link hover:opacity-80"
                  >
                    Open credential wallet
                    <ArrowUpRight className="h-3 w-3" strokeWidth={2} aria-hidden />
                  </Link>
                </div>
              </div>
            </DashboardSection>
          )}

          <div className="rounded-xl border border-stroke-subtle bg-surface p-4">
            <p className="font-body text-[12.5px] font-semibold text-foreground">Public portfolio</p>
            <label className="mt-2 flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={inPortfolio}
                onChange={(e) => setInPortfolio(e.target.checked)}
                className="mt-0.5 h-3.5 w-3.5 accent-brand rounded-sm"
              />
              <span className="font-body text-[12px] text-text-secondary leading-relaxed">
                Include in my public portfolio — visible on shared credential links.
              </span>
            </label>
          </div>
        </aside>
      </div>

      {credential && (
        <CompletedCredentialModal
          open={showCredentialModal}
          onClose={onCloseCredentialModal}
          credential={credential}
          taskTitle={task.title}
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

function DetailSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] pb-12">
      <div className="space-y-5">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-8 w-96 max-w-full rounded" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl hidden xl:block" />
    </div>
  );
}
