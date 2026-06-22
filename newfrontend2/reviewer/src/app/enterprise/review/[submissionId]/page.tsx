"use client";

/**
 * Enterprise acceptance detail — scorecard cockpit + tabbed review + decision card.
 *   Header → vital-signs scorecard (mentor · criteria · SLA/outcome · artifacts) →
 *   tabbed review material → enterprise decision card.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, notFound } from "next/navigation";
import { ArrowLeft, AlertCircle, AlertTriangle, CheckCircle2, ClipboardCheck, Clock, FileText, ListChecks, RotateCcw, Star } from "lucide-react";
import { useReviewSubmission, useClaimReview, useDecideReview } from "@/lib/hooks/use-enterprise-review";
import { buildAcceptanceDetailContext } from "./acceptance-detail-context";
import { DecisionPanel } from "./components/decision-panel";
import { AuditSection, CriteriaSection, DeliveryFactsSection, EvidenceSection, LineageSection, MentorVerdictSection } from "./components/detail-sections";
import { AcceptanceDetailSkeleton } from "@/components/enterprise/page-skeletons";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, TONE, type Tone } from "@/app/admin/_shell/aurora-ui";

const SLA_BREACH_H = 48;
const SLA_WATCH_H = 24;

function hoursSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000));
}
function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

type TabKey = "overview" | "criteria" | "evidence" | "lineage" | "details" | "activity";

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
  const [tab, setTab] = React.useState<TabKey>("overview");

  const ctx = React.useMemo(() => (item ? buildAcceptanceDetailContext(item) : null), [item]);
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
      await decide.mutateAsync({ decision: body.decision, note: body.note || undefined, deciderInitials: "SA" });
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
        <div className="rounded-lg border px-4 py-8 text-center" style={{ background: TONE.success.soft, borderColor: TONE.success.border }}>
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2" strokeWidth={2} style={{ color: TONE.success.text }} aria-hidden />
          <p className="font-body text-[14px] font-semibold" style={{ color: TONE.success.text }}>
            {submitted === "accept" ? "Deliverable accepted" : "Rework requested"}
          </p>
          <p className="font-body text-[12px] text-text-secondary mt-1">Redirecting to decision history…</p>
        </div>
      </div>
    );
  }

  const statusLabel = readOnly ? (decided?.decision === "accept" ? "Accepted" : "Rework requested") : "Awaiting decision";
  const statusTone: Tone = readOnly ? (decided?.decision === "accept" ? "success" : "warning") : "ai";

  const total = ctx.criteria.length;
  const met = total - unmetCriteria;
  const h = hoursSince(item.acceptedAt);
  const overdue = h >= SLA_BREACH_H;
  const slaLeft = Math.max(0, SLA_BREACH_H - h);
  const slaTone: Tone = overdue ? "error" : h >= SLA_WATCH_H ? "warning" : "success";

  const TABS: Array<{ key: TabKey; label: string; count?: React.ReactNode }> = [
    { key: "overview", label: "Overview" },
    { key: "criteria", label: "Criteria", count: `${met}/${total}` },
    { key: "evidence", label: "Evidence", count: ctx.artifacts.length },
    { key: "lineage", label: "Lineage" },
    { key: "details", label: "Details" },
    { key: "activity", label: "Activity", count: ctx.auditEvents.length },
  ];
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "overview";

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      {loadError ? (
        <div className="rounded-lg border px-4 py-3 flex items-start gap-2.5" style={{ background: TONE.error.soft, borderColor: TONE.error.border }}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} style={{ color: TONE.error.text }} aria-hidden />
          <p className="font-body text-[12.5px] flex-1" style={{ color: TONE.error.text }}>
            {loadError instanceof Error ? loadError.message : "Could not load submission."}
          </p>
        </div>
      ) : null}

      {/* Identity header */}
      <header className={cn(DASH_CARD, "p-5 flex items-start gap-4")}>
        <span className="grid place-items-center h-12 w-12 rounded-lg text-white shrink-0" style={GLASS_GRADIENT} aria-hidden>
          <ClipboardCheck className="h-5 w-5" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">Acceptance · v{item.version}</p>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">{item.taskTitle}</h1>
            <Chip tone={statusTone}>{statusLabel}</Chip>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
            <span>
              Contributor <span className="font-medium text-text-secondary">{item.contributorName}</span>
            </span>
            <span aria-hidden>·</span>
            <span className="tabular-nums">Mentor approved {timeAgo(item.acceptedAt)}</span>
            {!readOnly ? (
              <>
                <span aria-hidden>·</span>
                <span className={item.enterpriseReviewerId ? "text-text-secondary" : "font-semibold text-warning-text"}>
                  {item.enterpriseReviewerId ? "Claimed" : "Unclaimed"}
                </span>
              </>
            ) : null}
          </div>
          <RecordLinks submissionId={item.submissionId} />
        </div>
      </header>

      {/* Alerts */}
      {readOnly ? (
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/40 px-4 py-3">
          <p className="font-body text-[12.5px] text-text-secondary">
            <span className="font-semibold text-foreground">Read-only record</span> — this submission was already decided. Details below are for audit and billing reference.
          </p>
        </div>
      ) : unmetCriteria > 0 ? (
        <SlimAlert tone="warning" title={`${unmetCriteria} acceptance gap${unmetCriteria === 1 ? "" : "s"}`}>
          one or more criteria aren&apos;t fully met. Open the Criteria tab before accepting.
        </SlimAlert>
      ) : null}

      {/* Vital-signs scorecard */}
      <section aria-label="Submission scorecard" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Mentor score" value={`${ctx.mentorStars}/5`} icon={Star} hint="recommended accept" />
        <StatCard label="Criteria" value={`${met}/${total}`} icon={ListChecks} hint={unmetCriteria > 0 ? `${unmetCriteria} gap${unmetCriteria === 1 ? "" : "s"}` : "all met"} hintTone={unmetCriteria > 0 ? "warning" : "success"} />
        {readOnly ? (
          <StatCard label="Outcome" value={decided?.decision === "accept" ? "Accepted" : "Rework"} icon={decided?.decision === "accept" ? CheckCircle2 : RotateCcw} hint="recorded" hintTone={decided?.decision === "accept" ? "success" : "warning"} />
        ) : (
          <StatCard label="SLA" value={overdue ? "Overdue" : `${slaLeft}h`} icon={Clock} hint={overdue ? "breached" : "until 48h SLA"} hintTone={slaTone} />
        )}
        <StatCard label="Artifacts" value={item.artifactCount} icon={FileText} hint="evidence files" />
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
          {activeTab === "overview" ? <MentorVerdictSection ctx={ctx} /> : null}
          {activeTab === "criteria" ? <CriteriaSection ctx={ctx} /> : null}
          {activeTab === "evidence" ? <EvidenceSection ctx={ctx} /> : null}
          {activeTab === "lineage" ? <LineageSection ctx={ctx} /> : null}
          {activeTab === "details" ? <DeliveryFactsSection item={item} ctx={ctx} /> : null}
          {activeTab === "activity" ? <AuditSection ctx={ctx} submissionId={item.submissionId} /> : null}
        </div>
      </div>

      {/* Enterprise decision */}
      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">{readOnly ? "Recorded decision" : "Enterprise decision"}</h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">{readOnly ? "Final business outcome for this deliverable" : "Accept closes the loop and triggers billing · rework returns the task to the contributor"}</p>
        </div>
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
      </section>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/enterprise/review" className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm">
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Back to acceptance
    </Link>
  );
}

function RecordLinks({ submissionId }: { submissionId: string }) {
  const auditHref = `/enterprise/audit?resourceType=submission&resourceId=${encodeURIComponent(submissionId)}`;
  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link href={auditHref} className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast">
        Audit trail
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link href="/enterprise/review/history" className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast">
        Decision history
      </Link>
    </p>
  );
}
