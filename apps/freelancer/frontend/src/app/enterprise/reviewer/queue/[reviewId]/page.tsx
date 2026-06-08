"use client";

/**
 * QA review detail — single-column record view.
 *
 * Mentor scoring read-only; reviewer accepts / reworks / rejects.
 * Decision-first layout aligned with enterprise acceptance detail.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { MockReviewerItem } from "@/mocks/reviewer";
import { fetchReviewerReview, ReviewerApiError, submitReviewerDecision } from "@/lib/api/reviewer-mock";
import { ReviewNotFound } from "../../_components/review-not-found";
import { DashboardSection } from "@/components/meridian/dashboard";
import { ReviewerDetailSkeleton } from "@/components/enterprise/page-skeletons";
import { QaDecisionPanel, type QaDecision } from "./components/decision-panel";
import {
  CoverNoteSection,
  CriteriaSection,
  DeliveryFactsSection,
  EvidenceSection,
  FileScanSection,
  MentorVerdictSection,
  useScanWorstStatus,
  VersionDiffSection,
} from "./components/detail-sections";
import { cn } from "@/lib/utils/cn";

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtSlaRemaining(iso: string): { text: string; tone: "danger" | "warn" | "ok" } {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return { text: "Breached", tone: "danger" };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const text = h > 0 ? `${h}h ${m}m` : `${m}m`;
  if (ms < 4 * 3_600_000) return { text, tone: "warn" };
  return { text, tone: "ok" };
}

export default function ReviewerDetailPage() {
  const router = useRouter();
  const params = useParams<{ reviewId: string }>();
  const reviewId = params?.reviewId ?? "";

  const [review, setReview] = React.useState<MockReviewerItem | null>(null);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [nf, setNf] = React.useState(false);
  const [submitPending, setSubmitPending] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState<QaDecision | null>(null);

  React.useEffect(() => {
    if (!reviewId) return;
    const c = new AbortController();
    fetchReviewerReview(reviewId, c.signal)
      .then((res) => setReview(res.review))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        if (err instanceof ReviewerApiError && err.status === 404) setNf(true);
        else if (err instanceof ReviewerApiError && err.status === 410) {
          setLoadError("This review has already been decided.");
        } else {
          setLoadError(err instanceof Error ? err.message : "Could not load review.");
        }
      });
    return () => c.abort();
  }, [reviewId]);

  const scanWorst = useScanWorstStatus(reviewId);

  if (nf) {
    return <ReviewNotFound reviewId={reviewId} />;
  }

  const onSubmit = async (body: { decision: QaDecision; comment: string }) => {
    setActionError(null);
    if ((body.decision === "rework" || body.decision === "reject") && !body.comment) {
      setActionError("A comment is required for rework and reject decisions.");
      return;
    }
    setSubmitPending(true);
    try {
      await submitReviewerDecision(reviewId, {
        decision: body.decision,
        comment: body.comment || undefined,
      });
      setSubmitted(body.decision);
      setTimeout(() => router.push("/enterprise/reviewer"), 1200);
    } catch (err) {
      setActionError(
        err instanceof ReviewerApiError ? err.message : "Could not record decision.",
      );
    } finally {
      setSubmitPending(false);
    }
  };

  if (!review && !loadError) {
    return <ReviewerDetailSkeleton />;
  }

  if (submitted && review) {
    const label =
      submitted === "accept"
        ? "Accepted for enterprise"
        : submitted === "rework"
          ? "Sent back for rework"
          : "Rejected";
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div className="rounded-xl border border-success-border bg-success-subtle px-4 py-8 text-center">
          <CheckCircle2 className="h-8 w-8 text-success-text mx-auto mb-2" strokeWidth={2} aria-hidden />
          <p className="font-body text-[14px] font-semibold text-success-text">{label}</p>
          <p className="font-body text-[12px] text-text-secondary mt-1">Returning to QA review…</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{loadError}</p>
        </div>
      </div>
    );
  }

  const sla = fmtSlaRemaining(review.dueAt);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      {loadError && (
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{loadError}</p>
        </div>
      )}

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          QA Review · Round {review.round}
        </p>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          {review.taskTitle}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-brand-subtle text-brand-subtle-text">
            Awaiting QA sign-off
          </span>
          <span aria-hidden>·</span>
          <span>
            Contributor{" "}
            <span className="font-medium text-text-secondary">{review.contributorName}</span>
          </span>
          <span aria-hidden>·</span>
          <span>{review.project}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">Mentor accepted {timeAgo(review.mentorAcceptedAt)}</span>
          <span aria-hidden>·</span>
          <span
            className={cn(
              "tabular-nums font-medium",
              sla.tone === "danger"
                ? "text-error-text"
                : sla.tone === "warn"
                  ? "text-warning-text"
                  : "text-text-secondary",
            )}
          >
            SLA {sla.text}
          </span>
        </div>
        <RecordLinks />
      </header>

      {sla.tone === "danger" && (
        <ContextBanner tone="error" title="SLA breached">
          Escalated. Policy defaults to the mentor&apos;s decision after the grace period if no action is taken.
        </ContextBanner>
      )}

      {review.round >= 2 && (
        <ContextBanner tone="neutral" title={`Resubmission · round ${review.round}`}>
          Compare the version diff below — mentor already scored this round. You confirm quality before enterprise acceptance.
        </ContextBanner>
      )}

      {scanWorst !== "clean" && (
        <ContextBanner
          tone={scanWorst === "blocked" ? "error" : "neutral"}
          title={scanWorst === "blocked" ? "File scan blocked" : "File scan needs review"}
        >
          {scanWorst === "blocked"
            ? "At least one file failed security scanning. Review scan results before accepting."
            : "Similarity or security warnings were flagged — review file scan results below."}
        </ContextBanner>
      )}

      <ContextBanner tone="brand" title="Second-stage quality gate">
        Mentor has signed off — your decision routes accepted work to enterprise acceptance. You don&apos;t re-grade; confirm quality and scans.
      </ContextBanner>

      <DashboardSection
        title="QA decision"
        description="Accept forwards to enterprise · rework returns to contributor · reject closes the submission"
      >
        <QaDecisionPanel
          review={review}
          onSubmit={onSubmit}
          submitPending={submitPending}
          actionError={actionError}
        />
      </DashboardSection>

      <DashboardSection
        title="Mentor verdict"
        description={`${review.mentorName} · ${review.mentorOverall.toFixed(2)}/5 overall`}
      >
        <MentorVerdictSection review={review} />
      </DashboardSection>

      <DashboardSection
        title="Acceptance criteria"
        description={`${review.criteriaValidatedCount} of ${review.criteria.length} validated · mentor scores read-only`}
      >
        <CriteriaSection review={review} />
      </DashboardSection>

      <DashboardSection
        title="Evidence"
        description={`${review.evidence.length} file${review.evidence.length === 1 ? "" : "s"} in the package`}
      >
        <EvidenceSection review={review} />
      </DashboardSection>

      <DashboardSection title="File scan results" description="Virus + similarity checks on upload">
        <FileScanSection review={review} />
      </DashboardSection>

      {review.round >= 2 && (
        <DashboardSection
          title="Version diff"
          description={`v${review.round - 1} → v${review.round} changes`}
        >
          <VersionDiffSection review={review} />
        </DashboardSection>
      )}

      <DashboardSection title="Cover note" description="From the contributor">
        <CoverNoteSection review={review} />
      </DashboardSection>

      <DashboardSection title="Submission details" description="Task and delivery metadata">
        <DeliveryFactsSection review={review} />
      </DashboardSection>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/reviewer"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to QA review
    </Link>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/reviewer/history"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Decision history
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/reviewer/metrics"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        My metrics
      </Link>
    </p>
  );
}

function ContextBanner({
  tone,
  title,
  children,
}: {
  tone: "error" | "brand" | "neutral";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "error"
          ? "border-error-border bg-error-subtle"
          : tone === "brand"
            ? "border-brand/30 bg-brand-subtle/20"
            : "border-stroke-subtle bg-bg-subtle/50",
      )}
    >
      <p
        className={cn(
          "font-body text-[13px] font-semibold flex items-center gap-1.5",
          tone === "error" ? "text-error-text" : "text-foreground",
        )}
      >
        {tone === "error" && (
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        )}
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}
