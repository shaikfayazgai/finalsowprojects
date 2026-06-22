"use client";

/**
 * QA review detail — scorecard cockpit + tabbed review + decision card.
 *   Header → vital-signs scorecard (mentor · criteria · scan · round) →
 *   tabbed review material (compact) → prominent QA decision card.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, AlertTriangle, CheckCircle2, ClipboardCheck, Layers, ListChecks, ShieldCheck, Star } from "lucide-react";
import type { MockReviewerItem } from "@/mocks/reviewer";
import { fetchReviewerReview, ReviewerApiError, submitReviewerDecision } from "@/lib/api/reviewer-mock";
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
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, TONE, type Tone } from "@/app/admin/_shell/aurora-ui";

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function slaInfo(iso: string): { label: string; tone: Tone } {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms < 0) return { label: "SLA breached", tone: "error" };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const text = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return { label: `SLA ${text}`, tone: ms < 4 * 3_600_000 ? "warning" : "success" };
}

type TabKey = "overview" | "criteria" | "evidence" | "scans" | "diff" | "details";

function SlimAlert({ tone, title, children }: { tone: Tone; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border px-4 py-3 flex items-start gap-2.5" style={{ background: TONE[tone].soft, borderColor: TONE[tone].border }}>
      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE[tone].text }} aria-hidden />
      <p className="font-body text-[12.5px] text-text-secondary">
        <span className="font-semibold text-foreground">{title}</span> — {children}
      </p>
    </div>
  );
}

function TabPill({ label, count, active, onClick }: { label: string; count?: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={active ? GLASS_GRADIENT : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg font-body text-[13px] font-semibold whitespace-nowrap transition-colors",
        active ? "text-white" : "text-text-secondary hover:text-foreground hover:bg-bg-subtle",
      )}
    >
      {label}
      {count != null ? (
        <span className={cn("inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-md font-mono text-[10px] font-bold tabular-nums", active ? "bg-white/25 text-white" : "bg-bg-subtle text-text-tertiary")}>
          {count}
        </span>
      ) : null}
    </button>
  );
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
  const [tab, setTab] = React.useState<TabKey>("overview");

  React.useEffect(() => {
    if (!reviewId) return;
    const c = new AbortController();
    fetchReviewerReview(reviewId, c.signal)
      .then((res) => setReview(res.review))
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "AbortError") return;
        if (err instanceof ReviewerApiError && err.status === 404) setNf(true);
        else if (err instanceof ReviewerApiError && err.status === 410) setLoadError("This review has already been decided.");
        else setLoadError(err instanceof Error ? err.message : "Could not load review.");
      });
    return () => c.abort();
  }, [reviewId]);

  const scanWorst = useScanWorstStatus(reviewId);

  if (nf) return <ReviewNotFound reviewId={reviewId} />;

  const onSubmit = async (body: { decision: QaDecision; comment: string }) => {
    setActionError(null);
    if ((body.decision === "rework" || body.decision === "reject") && !body.comment) {
      setActionError("A comment is required for rework and reject decisions.");
      return;
    }
    setSubmitPending(true);
    try {
      await submitReviewerDecision(reviewId, { decision: body.decision, comment: body.comment || undefined });
      setSubmitted(body.decision);
      setTimeout(() => router.push("/enterprise/reviewer"), 1200);
    } catch (err) {
      setActionError(err instanceof ReviewerApiError ? err.message : "Could not record decision.");
    } finally {
      setSubmitPending(false);
    }
  };

  if (!review && !loadError) return <ReviewerDetailSkeleton />;

  if (submitted && review) {
    const label = submitted === "accept" ? "Accepted for enterprise" : submitted === "rework" ? "Sent back for rework" : "Rejected";
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div className="rounded-lg border px-4 py-8 text-center" style={{ background: TONE.success.soft, borderColor: TONE.success.border }}>
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
        <div className="rounded-lg border px-4 py-3 flex items-start gap-2.5" style={{ background: TONE.error.soft, borderColor: TONE.error.border }}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.error.text }} aria-hidden />
          <p className="font-body text-[12.5px] flex-1" style={{ color: TONE.error.text }}>{loadError}</p>
        </div>
      </div>
    );
  }

  const sla = slaInfo(review.dueAt);
  const total = review.criteria.length;
  const validated = review.criteriaValidatedCount;
  const scanLabel = scanWorst === "clean" ? "Clean" : scanWorst === "warning" ? "Review" : "Blocked";
  const scanTone: Tone = scanWorst === "clean" ? "success" : scanWorst === "warning" ? "warning" : "error";

  const TABS: Array<{ key: TabKey; label: string; count?: React.ReactNode }> = [
    { key: "overview", label: "Overview" },
    { key: "criteria", label: "Criteria", count: `${validated}/${total}` },
    { key: "evidence", label: "Evidence", count: review.evidence.length },
    { key: "scans", label: "Scans" },
    ...(review.round >= 2 ? [{ key: "diff" as TabKey, label: "Version diff" }] : []),
    { key: "details", label: "Details" },
  ];
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "overview";

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      {/* Identity header */}
      <header className={cn(DASH_CARD, "p-5 flex items-start gap-4")}>
        <span className="grid place-items-center h-12 w-12 rounded-lg text-white shrink-0" style={GLASS_GRADIENT} aria-hidden>
          <ClipboardCheck className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">QA Review · Round {review.round}</p>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">{review.taskTitle}</h1>
            <Chip tone="ai">Awaiting QA sign-off</Chip>
            <Chip tone={sla.tone}>{sla.label}</Chip>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
            <span>
              Contributor <span className="font-medium text-text-secondary">{review.contributorName}</span>
            </span>
            <span aria-hidden>·</span>
            <span>{review.project}</span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">Mentor accepted {timeAgo(review.mentorAcceptedAt)}</span>
          </div>
          <RecordLinks />
        </div>
      </header>

      {/* Alerts */}
      {sla.tone === "error" ? (
        <SlimAlert tone="error" title="SLA breached">escalated. Policy defaults to the mentor&apos;s decision after the grace period if no action is taken.</SlimAlert>
      ) : null}
      {scanWorst !== "clean" ? (
        <SlimAlert tone={scanWorst === "blocked" ? "error" : "warning"} title={scanWorst === "blocked" ? "File scan blocked" : "File scan needs review"}>
          {scanWorst === "blocked" ? "a file failed security scanning — review scan results before accepting." : "similarity or security warnings were flagged — open the Scans tab."}
        </SlimAlert>
      ) : null}

      {/* Vital-signs scorecard */}
      <section aria-label="Submission scorecard" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mentor score" value={`${review.mentorOverall.toFixed(1)}`} icon={Star} hint="of 5 overall" />
        <StatCard label="Criteria" value={`${validated}/${total}`} icon={ListChecks} hint={validated < total ? `${total - validated} open` : "all validated"} hintTone={validated < total ? "warning" : "success"} />
        <StatCard label="File scan" value={scanLabel} icon={ShieldCheck} hint="virus + similarity" hintTone={scanTone} />
        <StatCard label="Round" value={`R${review.round}/${review.totalRounds}`} icon={Layers} hint={review.round >= 2 ? "resubmission" : "first pass"} hintTone="neutral" />
      </section>

      {/* Tabbed review material */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="border-b border-stroke-subtle px-3 sm:px-4 py-2.5">
          <nav aria-label="Review material" className="flex flex-wrap gap-1.5">
            {TABS.map((t) => (
              <TabPill key={t.key} label={t.label} count={t.count} active={activeTab === t.key} onClick={() => setTab(t.key)} />
            ))}
          </nav>
        </div>

        <div className="px-5 sm:px-6 py-5">
          {activeTab === "overview" ? (
            <div className="space-y-5">
              <MentorVerdictSection review={review} />
              <div className="pt-5 border-t border-stroke-subtle">
                <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">Cover note · from the contributor</p>
                <CoverNoteSection review={review} />
              </div>
            </div>
          ) : null}
          {activeTab === "criteria" ? <CriteriaSection review={review} /> : null}
          {activeTab === "evidence" ? <EvidenceSection review={review} /> : null}
          {activeTab === "scans" ? <FileScanSection review={review} /> : null}
          {activeTab === "diff" && review.round >= 2 ? <VersionDiffSection review={review} /> : null}
          {activeTab === "details" ? <DeliveryFactsSection review={review} /> : null}
        </div>
      </div>

      {/* QA decision */}
      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">Your QA decision</h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Accept forwards to enterprise · rework returns to contributor · reject closes it</p>
        </div>
        <div className="px-5 sm:px-6 py-5">
          <QaDecisionPanel review={review} onSubmit={onSubmit} submitPending={submitPending} actionError={actionError} />
        </div>
      </section>

      {loadError ? (
        <div className="rounded-lg border px-4 py-3 flex items-start gap-2.5" style={{ background: TONE.error.soft, borderColor: TONE.error.border }}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.error.text }} aria-hidden />
          <p className="font-body text-[12.5px] flex-1" style={{ color: TONE.error.text }}>{loadError}</p>
        </div>
      ) : null}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/enterprise/reviewer" className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm">
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Back to QA review
    </Link>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link href="/enterprise/reviewer/history" className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors">
        Decision history
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link href="/enterprise/reviewer/metrics" className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors">
        My metrics
      </Link>
    </p>
  );
}
