"use client";

/**
 * Enterprise acceptance detail — single-column record view.
 *
 *   Back link → header (title, meta, status)
 *   Context banners (mentor wait · criteria gaps · read-only)
 *   Decision section (pending) or recorded decision
 *   Sections: Mentor · Criteria · Evidence · Details · Lineage · Audit
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import { ArrowLeft, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  useReviewSubmission,
  useClaimReview,
  useDecideReview,
} from "@/lib/hooks/use-enterprise-review";
import { buildAcceptanceDetailContext } from "./acceptance-detail-context";
import { DecisionPanel } from "./components/decision-panel";
import {
  AuditSection,
  CriteriaSection,
  DeliveryFactsSection,
  EvidenceSection,
  LineageSection,
  MentorVerdictSection,
} from "./components/detail-sections";
import { AcceptanceDetailSkeleton } from "@/components/enterprise/page-skeletons";
import { cn } from "@/lib/utils/cn";
import { SectionCard, Chip, TONE, type Tone } from "@/app/admin/_shell/aurora-ui";

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function EnterpriseReviewDetailPage() {
  const router = useRouter();
  const params = useParams<{ submissionId: string }>();
  const submissionId = params?.submissionId ?? "";

  const { data, isLoading, error: loadError } = useReviewSubmission(submissionId);
  const item = data?.item;
  const decided = data?.decided ?? null;
  const readOnly = !!decided;

  const effectiveId = item?.submissionId ?? submissionId;
  const claim = useClaimReview(effectiveId);
  const decide = useDecideReview(effectiveId);

  React.useEffect(() => {
    if (item && submissionId !== item.submissionId) {
      router.replace(`/enterprise/review/${item.submissionId}`);
    }
  }, [item, submissionId, router]);

  const [actionError, setActionError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState<"accept" | "rework" | null>(null);

  const ctx = React.useMemo(
    () => (item ? buildAcceptanceDetailContext(item) : null),
    [item],
  );

  const unmetCriteria = ctx?.criteria.filter((c) => !c.met).length ?? 0;

  if (!isLoading && !loadError && data === null && !submitted) {
    notFound();
  }

  const onClaim = async () => {
    setActionError(null);
    try {
      await claim.mutateAsync();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not claim submission.");
    }
  };

  const onSubmit = async (body: { decision: "accept" | "rework"; note: string }) => {
    setActionError(null);
    if (body.decision === "rework" && !body.note) {
      setActionError("A note is required when requesting rework.");
      return;
    }
    try {
      if (item && !item.enterpriseReviewerId) {
        await claim.mutateAsync();
      }
      await decide.mutateAsync({
        decision: body.decision,
        note: body.note || undefined,
        deciderInitials: "SA",
      });
      setSubmitted(body.decision);
      setTimeout(() => router.push("/enterprise/review/history"), 1200);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Could not record decision.");
    }
  };

  if (isLoading || !item || !ctx) {
    return <AcceptanceDetailSkeleton />;
  }

  if (submitted) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div
          className="rounded-2xl border px-4 py-8 text-center backdrop-blur"
          style={{ background: TONE.success.soft, borderColor: TONE.success.border }}
        >
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2" strokeWidth={2} style={{ color: TONE.success.text }} aria-hidden />
          <p className="font-body text-[14px] font-semibold" style={{ color: TONE.success.text }}>
            {submitted === "accept" ? "Deliverable accepted" : "Rework requested"}
          </p>
          <p className="font-body text-[12px] text-text-secondary mt-1">
            Redirecting to decision history…
          </p>
        </div>
      </div>
    );
  }

  const statusLabel = readOnly
    ? decided?.decision === "accept"
      ? "Accepted"
      : "Rework requested"
    : "Awaiting decision";

  const statusTone: Tone = readOnly
    ? decided?.decision === "accept"
      ? "success"
      : "warning"
    : "ai";

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      {loadError && (
        <div
          className="rounded-2xl border px-4 py-3 flex items-start gap-2.5 backdrop-blur"
          style={{ background: TONE.error.soft, borderColor: TONE.error.border }}
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.error.text }} aria-hidden />
          <p className="font-body text-[12.5px] flex-1" style={{ color: TONE.error.text }}>
            {loadError instanceof Error ? loadError.message : "Could not load submission."}
          </p>
        </div>
      )}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Acceptance · v{item.version}
          </p>
          <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {item.taskTitle}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
            <Chip tone={statusTone}>{statusLabel}</Chip>
            <span aria-hidden>·</span>
            <span>
              Contributor{" "}
              <span className="font-medium text-text-secondary">{item.contributorName}</span>
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">Mentor approved {timeAgo(item.acceptedAt)}</span>
            <span aria-hidden>·</span>
            <span>{item.artifactCount} artifact{item.artifactCount === 1 ? "" : "s"}</span>
            {!readOnly && (
              <>
                <span aria-hidden>·</span>
                <span
                  className={item.enterpriseReviewerId ? "text-text-secondary" : "font-medium"}
                  style={item.enterpriseReviewerId ? undefined : { color: TONE.warning.text }}
                >
                  {item.enterpriseReviewerId ? "Claimed" : "Unclaimed"}
                </span>
              </>
            )}
          </div>
          <RecordLinks submissionId={item.submissionId} />
        </div>
      </header>

      {readOnly && (
        <ContextBanner tone="neutral" title="Read-only record">
          This submission was already decided — details below are for audit and billing reference.
        </ContextBanner>
      )}

      {!readOnly && (
        <ContextBanner tone="brand" title="Mentor signed off on quality">
          Your decision is the final business acceptance — accept to trigger billing eligibility,
          or request rework to return the work to the contributor.
        </ContextBanner>
      )}

      {!readOnly && unmetCriteria > 0 && (
        <ContextBanner tone="error" title={`${unmetCriteria} acceptance gap${unmetCriteria === 1 ? "" : "s"}`}>
          One or more criteria are not fully met. Review the checklist below before accepting.
        </ContextBanner>
      )}

      <SectionCard
        title={readOnly ? "Recorded decision" : "Enterprise decision"}
        description={
          readOnly
            ? "Final business outcome for this deliverable"
            : "Accept closes the loop · rework returns the task to the contributor"
        }
      >
        <div className="px-5 sm:px-6 py-5">
          <DecisionPanel
            item={item}
            decided={decided}
            readOnly={readOnly}
            onClaim={onClaim}
            onSubmit={onSubmit}
            claimPending={claim.isPending}
            submitPending={decide.isPending}
            actionError={actionError}
          />
        </div>
      </SectionCard>

      <SectionCard title="Mentor verdict" description={`${ctx.mentorName} recommended acceptance`}>
        <div className="px-5 sm:px-6 py-5">
          <MentorVerdictSection ctx={ctx} />
        </div>
      </SectionCard>

      <SectionCard
        title="Acceptance criteria"
        description={
          unmetCriteria > 0
            ? `${ctx.criteria.length - unmetCriteria} of ${ctx.criteria.length} met`
            : `All ${ctx.criteria.length} criteria met`
        }
      >
        <div className="px-5 sm:px-6 py-5">
          <CriteriaSection ctx={ctx} />
        </div>
      </SectionCard>

      <SectionCard
        title="Evidence"
        description={`${ctx.artifacts.length} file${ctx.artifacts.length === 1 ? "" : "s"} in the package`}
      >
        <div className="px-5 sm:px-6 py-5">
          <EvidenceSection ctx={ctx} />
        </div>
      </SectionCard>

      <SectionCard title="Delivery details" description="Submission metadata">
        <div className="px-5 sm:px-6 py-5">
          <DeliveryFactsSection item={item} ctx={ctx} />
        </div>
      </SectionCard>

      <SectionCard title="Lineage" description="SOW → plan → project → task → acceptance">
        <div className="px-5 sm:px-6 py-5">
          <LineageSection ctx={ctx} />
        </div>
      </SectionCard>

      <SectionCard
        title="Activity"
        description={`${ctx.auditEvents.length} recent event${ctx.auditEvents.length === 1 ? "" : "s"}`}
      >
        <div className="px-5 sm:px-6 py-5">
          <AuditSection ctx={ctx} submissionId={item.submissionId} />
        </div>
      </SectionCard>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/review"
      className="inline-flex items-center gap-1.5 font-body text-[12px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,92,246,0.32)] rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to acceptance
    </Link>
  );
}

function RecordLinks({ submissionId }: { submissionId: string }) {
  const auditHref = `/enterprise/audit?resourceType=submission&resourceId=${encodeURIComponent(submissionId)}`;

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href={auditHref}
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Audit trail
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/enterprise/review/history"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Decision history
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
        className={cn(
          "font-body text-[13px] font-semibold flex items-center gap-1.5",
        )}
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
