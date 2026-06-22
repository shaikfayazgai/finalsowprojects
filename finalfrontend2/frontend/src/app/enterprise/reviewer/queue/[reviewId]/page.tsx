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
import { fetchReviewerReview, ReviewerApiError, submitReviewerDecision } from "@/lib/api/reviewer-real";
import { ReviewNotFound } from "../../_components/review-not-found";
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
import { SectionCard, Chip, TONE, type Tone } from "@/app/admin/_shell/aurora-ui";

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
        <div
          className="rounded-2xl border px-4 py-8 text-center backdrop-blur"
          style={{ background: TONE.success.soft, borderColor: TONE.success.border }}
        >
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2" strokeWidth={2} style={{ color: TONE.success.text }} aria-hidden />
          <p className="font-body text-[14px] font-semibold" style={{ color: TONE.success.text }}>{label}</p>
          <p className="font-body text-[12px] text-text-secondary mt-1">Returning to QA review…</p>
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div
          className="rounded-2xl border px-4 py-3 flex items-start gap-2.5 backdrop-blur"
          style={{ background: TONE.error.soft, borderColor: TONE.error.border }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.error.text }} aria-hidden />
          <p className="font-body text-[12.5px] flex-1" style={{ color: TONE.error.text }}>{loadError}</p>
        </div>
      </div>
    );
  }

  const sla = fmtSlaRemaining(review.dueAt);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      {loadError && (
        <div
          className="rounded-2xl border px-4 py-3 flex items-start gap-2.5 backdrop-blur"
          style={{ background: TONE.error.soft, borderColor: TONE.error.border }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.error.text }} aria-hidden />
          <p className="font-body text-[12.5px] flex-1" style={{ color: TONE.error.text }}>{loadError}</p>
        </div>
      )}

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          QA Review · Round {review.round}
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          {review.taskTitle}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
          <Chip tone="ai">Awaiting QA sign-off</Chip>
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
            className="tabular-nums font-medium"
            style={{
              color:
                sla.tone === "danger"
                  ? TONE.error.text
                  : sla.tone === "warn"
                    ? TONE.warning.text
                    : "var(--color-text-secondary)",
            }}
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

      <SectionCard
        title="QA decision"
        description="Accept forwards to enterprise · rework returns to contributor · reject closes the submission"
      >
        <div className="px-5 sm:px-6 py-5">
          <QaDecisionPanel
            review={review}
            onSubmit={onSubmit}
            submitPending={submitPending}
            actionError={actionError}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Mentor verdict"
        description={`${review.mentorName} · ${review.mentorOverall.toFixed(2)}/5 overall`}
      >
        <div className="px-5 sm:px-6 py-5">
          <MentorVerdictSection review={review} />
        </div>
      </SectionCard>

      <SectionCard
        title="Acceptance criteria"
        description={`${review.criteriaValidatedCount} of ${review.criteria.length} validated · mentor scores read-only`}
      >
        <div className="px-5 sm:px-6 py-5">
          <CriteriaSection review={review} />
        </div>
      </SectionCard>

      <SectionCard
        title="Evidence"
        description={`${review.evidence.length} file${review.evidence.length === 1 ? "" : "s"} in the package`}
      >
        <div className="px-5 sm:px-6 py-5">
          <EvidenceSection review={review} />
        </div>
      </SectionCard>

      <SectionCard title="File scan results" description="Virus + similarity checks on upload">
        <div className="px-5 sm:px-6 py-5">
          <FileScanSection review={review} />
        </div>
      </SectionCard>

      {review.round >= 2 && (
        <SectionCard
          title="Version diff"
          description={`v${review.round - 1} → v${review.round} changes`}
        >
          <div className="px-5 sm:px-6 py-5">
            <VersionDiffSection review={review} />
          </div>
        </SectionCard>
      )}

      <SectionCard title="Cover note" description="From the contributor">
        <div className="px-5 sm:px-6 py-5">
          <CoverNoteSection review={review} />
        </div>
      </SectionCard>

      <SectionCard title="Submission details" description="Task and delivery metadata">
        <div className="px-5 sm:px-6 py-5">
          <DeliveryFactsSection review={review} />
        </div>
      </SectionCard>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/reviewer"
      className="inline-flex items-center gap-1.5 font-body text-[12px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)] rounded-sm"
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
  const bannerTone: Tone = tone === "error" ? "error" : tone === "brand" ? "ai" : "neutral";
  return (
    <div
      className="rounded-2xl border px-4 py-3 backdrop-blur"
      style={{ background: TONE[bannerTone].soft, borderColor: TONE[bannerTone].border }}
    >
      <p
        className="font-body text-[13px] font-semibold flex items-center gap-1.5"
        style={tone === "error" ? { color: TONE.error.text } : { color: "var(--color-foreground)" }}
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
