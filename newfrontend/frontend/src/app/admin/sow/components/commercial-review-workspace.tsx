"use client";

/**
 * Commercial gate review — decide on one SOW at the platform gate.
 *
 * Workflow (top → bottom):
 *   1. Orient — context + SLA
 *   2. Decide — approve / send back / reject (when actionable)
 *   3. Review — economics → scope → pipeline → prior decisions → mentor
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  RotateCcw,
  ScrollText,
  SearchX,
  XCircle,
} from "lucide-react";
import { useAdminSow } from "@/lib/hooks/use-admin-sow";
import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";
import { APPROVAL_STAGE_ORDER, STAGE_LABEL, STAGE_SLA_HOURS } from "@/lib/sow/approval-pipeline";
import type { SowApprovalSummary, SowDetail, SowStage, SowStatus } from "@/lib/sow/types";
import {
  CommercialDecisionModal,
  type CommercialDecisionAction,
  type CommercialDecisionPayload,
} from "@/app/admin/sow/components/commercial-decision-modal";
import { AssignMentorPanel } from "@/app/admin/sow/components/assign-mentor-panel";
import { SowPlatformPricingPanel } from "@/app/admin/sow/components/sow-platform-pricing-panel";
import { CommercialReviewSkeleton } from "@/app/admin/sow/components/commercial-review-skeleton";
import { TenantEmptyState } from "@/app/admin/tenants/components/tenant-empty-state";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { primaryBtnClass, primaryStyle } from "../../_shell/aurora-ui";

const SLA_HOURS = STAGE_SLA_HOURS.platform;
const RISK_WINDOW_HOURS = 12;

type Tone = "warning" | "neutral" | "success" | "info";

const TONE_TEXT: Record<Tone, string> = {
  warning: "var(--color-warning-text)",
  neutral: "var(--color-text-secondary)",
  success: "var(--color-success-text)",
  info: "var(--color-info-text)",
};

const TONE_SOFT: Record<Tone, string> = {
  warning: "var(--color-warning-subtle)",
  neutral: "var(--color-bg-subtle)",
  success: "var(--color-success-subtle)",
  info: "var(--color-info-subtle)",
};

const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg",
  "border border-stroke-subtle bg-surface font-body text-[13px] font-medium text-foreground",
  "hover:bg-bg-subtle transition-colors disabled:opacity-50",
);

const BTN_DANGER = cn(
  "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg",
  "border border-stroke-subtle bg-surface font-body text-[13px] font-medium text-foreground",
  "hover:bg-error-subtle/40 transition-colors disabled:opacity-50",
);

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtDur(hours: number): string {
  const h = Math.max(0, hours);
  if (h >= 48) return `${Math.round(h / 24)}d`;
  if (h >= 1) return `${Math.floor(h)}h`;
  return `${Math.max(1, Math.round(h * 60))}m`;
}

interface SlaInfo {
  label: string;
  tone: Tone;
}

function slaInfo(deadline: string | null, submittedAt: string | null): SlaInfo {
  const target = deadline ? new Date(deadline).getTime() : submittedAt ? new Date(submittedAt).getTime() + SLA_HOURS * 3_600_000 : null;
  if (target == null) return { label: "—", tone: "neutral" };
  const hoursLeft = (target - Date.now()) / 3_600_000;
  if (hoursLeft <= 0) return { label: `Overdue ${fmtDur(-hoursLeft)}`, tone: "warning" };
  if (hoursLeft <= RISK_WINDOW_HOURS) return { label: `${fmtDur(hoursLeft)} left`, tone: "warning" };
  return { label: `${fmtDur(hoursLeft)} left`, tone: "neutral" };
}

type StageState = "approved" | "current" | "waiting" | "rejected" | "sent_back";

function resolveStageState(stage: SowStage, currentStage: SowStage | null, status: SowStatus, decision: SowApprovalSummary | undefined): StageState {
  if (decision?.decision === "approved") return "approved";
  if (decision?.decision === "rejected") return "rejected";
  if (decision?.decision === "send_back") return "sent_back";
  if (status === "approval" && currentStage === stage) return "current";
  return "waiting";
}

export function CommercialReviewWorkspace() {
  const allowed = useAdminSectionGuard("commercialGate");
  const params = useParams<{ sowId: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const sowId = params.sowId;

  const { data: sow, isLoading } = useAdminSow(sowId);
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [decisionAction, setDecisionAction] = React.useState<CommercialDecisionAction | null>(null);

  const atCommercial = sow?.status === "approval" && sow.stage === "platform";
  const commercialApproval = sow?.approvals.find((a) => a.stage === "platform");
  const sla = slaInfo(commercialApproval?.slaDeadline ?? null, sow?.submittedForApprovalAt ?? null);

  const runDecision = async (action: CommercialDecisionAction, payload: CommercialDecisionPayload) => {
    setActionError(null);
    setBusy(true);
    try {
      const suffix = payload.notifySponsor ? " · Sponsor notified" : "";
      // Approver's signature (typed name) — folded into the audit comment for
      // visibility and sent as a structured `signature` field for the backend.
      const signed = action === "approve" && payload.signature ? ` · Signed: ${payload.signature}` : "";
      // Backend commercial gate accepts approve | reject; send-back returns the
      // SOW to the tenant for correction (recorded as a rejection + comment).
      const decision = action === "approve" ? "approve" : "reject";
      const res = await fetch(`/api/admin/sow/${sowId}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comment: `${payload.comment}${suffix}${signed}`, signature: payload.signature }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || err?.message || `Decision failed (${res.status})`);
      }
      // If a delivery mentor was picked in the approval modal, assign it now.
      if (action === "approve" && payload.mentorId) {
        await fetch(`/api/superadmin/sows/${sowId}/assign-mentor`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mentorId: payload.mentorId,
            mentorName: payload.mentorName,
            mentorEmail: payload.mentorEmail,
          }),
        }).catch(() => {/* non-fatal — mentor can be set from the panel */});
      }
      await qc.invalidateQueries({ queryKey: ["sow"] });
      setDecisionAction(null);
      const msg = action === "approve" ? "approved" : action === "send_back" ? "sent_back" : "rejected";
      router.push(`/admin/sow?msg=${msg}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!allowed) return null;
  if (isLoading && !sow) return <CommercialReviewSkeleton />;

  if (!sow) {
    return (
      <div className="space-y-5 pb-4 animate-fade-in">
        <BackLink />
        <div className={DASH_CARD}>
          <TenantEmptyState
            icon={SearchX}
            title="SOW not found"
            description="This record may have been removed or the link is incorrect."
            action={
              <Link href="/admin/sow" className={cn(BTN_SECONDARY, "h-10 px-4")}>
                Back to queue
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <BackLink />

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
              {sow.title}
            </h1>
            {atCommercial ? <StatusChip tone="info">Awaiting your decision</StatusChip> : <StatusChip tone="neutral">Not at Super admin</StatusChip>}
          </div>
          <p className="font-body text-[14px] text-text-secondary">
            {sow.tenantName ?? "—"}
            <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
            {sow.ownerName ?? sow.ownerId}
            <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
            v{sow.activeVersion}
            <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
            <span className="font-mono text-[12px]">{sowId}</span>
          </p>
          <p className="mt-1 font-body text-[13px] text-text-tertiary">
            Submitted <span suppressHydrationWarning>{timeAgo(sow.submittedForApprovalAt)}</span>
            <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
            Enterprise security, finance, legal, and tenant-admin gates passed
            <span aria-hidden className="mx-1.5 text-text-disabled">·</span>
            SLA <SlaChip sla={sla} inline />
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {sow.tenantId ? (
            <Link href={`/admin/tenants/${sow.tenantId}`} className={BTN_SECONDARY}>
              <Building2 className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
              View tenant
            </Link>
          ) : null}
          <Link
            href={`/enterprise/sow/${sowId}`}
            target="_blank"
            rel="noopener noreferrer"
            className={BTN_SECONDARY}
          >
            <ExternalLink className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
            Enterprise record
          </Link>
        </div>
      </header>

      {actionError ? (
        <div role="alert" className="rounded-lg border border-error-border bg-error-subtle/50 px-4 py-3 font-body text-[13px] text-error-text">
          {actionError}
        </div>
      ) : null}

      {!atCommercial ? (
        <section className={cn(DASH_CARD, "px-4 sm:px-5 py-4")}>
          <p className="font-body text-[13px] text-text-secondary">
            This SOW is no longer waiting on platform commercial review
            {sow.stage ? ` — current stage: ${STAGE_LABEL[sow.stage] ?? sow.stage}` : sow.status === "approved" ? " — already approved" : ""}.
            {" "}
            <Link href="/admin/sow" className="font-semibold text-text-link hover:underline underline-offset-2">
              Return to queue
            </Link>
          </p>
        </section>
      ) : (
        <section className={cn(DASH_CARD, "overflow-hidden")}>
          <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
            <h2 className="font-body text-[13px] font-semibold text-foreground">Your decision</h2>
            <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
              Final Super admin approval — sign off to mark the SOW ready for delivery setup
            </p>
          </div>
          <div className="px-4 sm:px-5 py-5 space-y-4">
            <ul className="space-y-2 font-body text-[13px] text-text-secondary">
              <li className="flex gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success-text mt-0.5" strokeWidth={2} aria-hidden />
                <span><strong className="font-medium text-foreground">Approve</strong> — SOW becomes approved; mentor and delivery can proceed.</span>
              </li>
              <li className="flex gap-2">
                <RotateCcw className="h-4 w-4 shrink-0 text-text-tertiary mt-0.5" strokeWidth={2} aria-hidden />
                <span><strong className="font-medium text-foreground">Send back</strong> — return to enterprise sponsor for revision; resubmit as a new version.</span>
              </li>
              <li className="flex gap-2">
                <XCircle className="h-4 w-4 shrink-0 text-text-tertiary mt-0.5" strokeWidth={2} aria-hidden />
                <span><strong className="font-medium text-foreground">Reject</strong> — stop this approval attempt; sponsor must start over.</span>
              </li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" disabled={busy} onClick={() => setDecisionAction("approve")} className={cn(primaryBtnClass, "px-5")} style={primaryStyle}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} aria-hidden /> : <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden />}
                Approve commercial
              </button>
              <button type="button" disabled={busy} onClick={() => setDecisionAction("send_back")} className={BTN_SECONDARY}>
                <RotateCcw className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                Send back
              </button>
              <button type="button" disabled={busy} onClick={() => setDecisionAction("reject")} className={BTN_DANGER}>
                <XCircle className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
                Reject
              </button>
            </div>
          </div>
        </section>
      )}

      <SowPlatformPricingPanel payload={sow.activeVersionDetail?.payload} />

      <ScopePanel payload={sow.activeVersionDetail?.payload} body={sow.activeVersionDetail?.body} />

      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
          <h2 className="font-body text-[13px] font-semibold text-foreground">Approval pipeline</h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Security → Finance → Legal → Tenant admin → Super admin</p>
        </div>
        <PipelineTimeline sow={sow} />
      </section>

      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
          <h2 className="font-body text-[13px] font-semibold text-foreground">Prior stage decisions</h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Comments from enterprise and Super admin gates</p>
        </div>
        <StageHistoryList approvals={sow.approvals} />
      </section>

      {(atCommercial || sow.status === "approved") && <AssignMentorPanel sowId={sowId} />}

      {decisionAction ? (
        <CommercialDecisionModal
          open
          action={decisionAction}
          sowTitle={sow.title}
          submitting={busy}
          onClose={() => !busy && setDecisionAction(null)}
          onConfirm={(payload) => runDecision(decisionAction, payload)}
        />
      ) : null}
    </div>
  );
}

/** Read structured scope from the SOW payload — objectives, deliverables,
 *  acceptance criteria, skills, key facts, and the attached document link. */
function ScopePanel({
  payload,
  body,
}: {
  payload: Record<string, unknown> | null | undefined;
  body: string | null | undefined;
}) {
  const p = (payload ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const num = (v: unknown) => (typeof v === "number" && v > 0 ? v : null);
  const list = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0) : [];
  const scope = (p.scope && typeof p.scope === "object" ? p.scope : {}) as Record<string, unknown>;

  const fileUrl = str(p.fileUrl);
  const fileName = str(p.fileName) ?? "Attached document";
  const objectives = str(scope.objectives) ?? str(p.objectives);
  const acceptance = str(scope.acceptanceCriteria) ?? str(p.acceptanceCriteria);
  const assumptions = str(scope.assumptions);
  const exclusions = str(scope.exclusions);
  const deliverables = list(p.deliverables);
  const skills = list(p.requiredSkills);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const fmtDate = (v: unknown) => {
    const s = str(v);
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  const facts: Array<[string, string]> = [];
  const pr = str(p.priority);
  const eng = str(p.engagementType);
  const eff = num(p.effortHours);
  const wks = num(p.durationWeeks);
  const start = fmtDate(p.startDate);
  const end = fmtDate(p.endDate);
  const confid = str(p.confidentiality);
  const created = fmtDate(p.createdAt) ?? fmtDate(p.created_at);
  if (pr) facts.push(["Priority", cap(pr)]);
  if (eng) facts.push(["Engagement", cap(eng)]);
  if (eff) facts.push(["Effort", `${eff} hrs`]);
  if (wks) facts.push(["Duration", `${wks} wks`]);
  if (start) facts.push(["Start date", start]);
  if (end) facts.push(["End date", end]);
  if (confid) facts.push(["Confidentiality", cap(confid)]);
  if (created) facts.push(["Created", created]);

  // Enterprise-assigned reviewer (read-only on the admin side).
  const reviewerRaw = (p.reviewer && typeof p.reviewer === "object" ? p.reviewer : null) as Record<string, unknown> | null;
  const reviewerName = reviewerRaw ? str(reviewerRaw.name) : null;
  const reviewerEmail = reviewerRaw ? str(reviewerRaw.email) : null;

  const hasStructured =
    !!(objectives || acceptance || assumptions || exclusions) ||
    deliverables.length > 0 ||
    skills.length > 0 ||
    facts.length > 0 ||
    !!reviewerName;

  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle">
        <div>
          <h2 className="font-body text-[13px] font-semibold text-foreground">Scope &amp; details</h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Reviewer, timeline, skills, and scope for this SOW</p>
        </div>
        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={BTN_SECONDARY}
            title={fileName}
          >
            <FileText className="h-4 w-4 text-text-tertiary" strokeWidth={2} aria-hidden />
            View document
          </a>
        ) : null}
      </div>

      <div className="px-4 sm:px-5 py-5 space-y-5">
        {fileUrl ? (
          <p className="font-body text-[12px] text-text-tertiary">
            Attached: <span className="font-medium text-text-secondary">{fileName}</span>
          </p>
        ) : null}

        {facts.length > 0 ? (
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt className="font-body text-[11px] font-medium text-text-tertiary mb-0.5">{label}</dt>
                <dd className="font-body text-[13px] text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <ScopeBlock label="Reviewer (enterprise-assigned)">
          {reviewerName ? (
            <p className="font-body text-[13px] text-foreground">
              <span className="font-semibold">{reviewerName}</span>
              {reviewerEmail ? <span className="text-text-tertiary"> · {reviewerEmail}</span> : null}
            </p>
          ) : (
            <p className="font-body text-[12.5px] text-text-tertiary italic">No reviewer assigned by the enterprise yet.</p>
          )}
        </ScopeBlock>

        {skills.length > 0 ? (
          <ScopeBlock label="Required skills">
            <div className="flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex h-[22px] items-center px-2.5 rounded-full bg-bg-subtle font-body text-[11px] font-medium text-text-secondary"
                >
                  {s}
                </span>
              ))}
            </div>
          </ScopeBlock>
        ) : null}

        {objectives ? (
          <ScopeBlock label="Objectives">
            <p className="font-body text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">{objectives}</p>
          </ScopeBlock>
        ) : null}

        {deliverables.length > 0 ? (
          <ScopeBlock label="Deliverables">
            <ul className="space-y-1.5">
              {deliverables.map((d) => (
                <li key={d} className="flex gap-2 font-body text-[13px] text-text-secondary">
                  <Check className="h-3.5 w-3.5 shrink-0 text-success-text mt-0.5" strokeWidth={2} aria-hidden />
                  {d}
                </li>
              ))}
            </ul>
          </ScopeBlock>
        ) : null}

        {acceptance ? (
          <ScopeBlock label="Acceptance criteria">
            <p className="font-body text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">{acceptance}</p>
          </ScopeBlock>
        ) : null}

        {assumptions ? (
          <ScopeBlock label="Assumptions">
            <p className="font-body text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">{assumptions}</p>
          </ScopeBlock>
        ) : null}

        {exclusions ? (
          <ScopeBlock label="Exclusions">
            <p className="font-body text-[13px] text-text-secondary leading-relaxed whitespace-pre-wrap">{exclusions}</p>
          </ScopeBlock>
        ) : null}

        {!hasStructured ? (
          body ? (
            <pre className="whitespace-pre-wrap font-body text-[13px] text-text-secondary leading-relaxed rounded-lg border border-stroke-subtle bg-bg-subtle/50 p-4 max-h-[min(50vh,480px)] overflow-auto">
              {body}
            </pre>
          ) : (
            <p className="font-body text-[13px] text-text-tertiary">
              {fileUrl
                ? "No structured scope was entered — see the attached document above."
                : "No scope recorded for this SOW."}
            </p>
          )
        ) : null}
      </div>
    </section>
  );
}

function ScopeBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-body text-[11px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-2">{label}</p>
      {children}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin/sow" className="inline-flex items-center gap-1.5 font-body text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors">
      <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
      Commercial gate
    </Link>
  );
}

function StatusChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex h-[22px] items-center px-2.5 rounded-full font-body text-[11px] font-medium whitespace-nowrap"
      style={{ color: TONE_TEXT[tone], background: TONE_SOFT[tone] }}
    >
      {children}
    </span>
  );
}

function SlaChip({ sla, inline }: { sla: SlaInfo; inline?: boolean }) {
  const chip = (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-body text-[11px] font-medium whitespace-nowrap",
        !inline && "h-[22px] px-2.5 rounded-full",
      )}
      style={inline ? { color: TONE_TEXT[sla.tone] } : { color: TONE_TEXT[sla.tone], background: TONE_SOFT[sla.tone] }}
    >
      <Clock className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
      {sla.label}
    </span>
  );
  return chip;
}

function PipelineTimeline({ sow }: { sow: SowDetail }) {
  const decisionByStage = new Map<SowStage, SowApprovalSummary>();
  for (const a of sow.approvals) {
    const existing = decisionByStage.get(a.stage);
    if (!existing || new Date(a.createdAt) > new Date(existing.createdAt)) decisionByStage.set(a.stage, a);
  }

  return (
    <ol className="px-4 sm:px-5 py-5">
      {APPROVAL_STAGE_ORDER.map((stage, index) => {
        const decision = decisionByStage.get(stage);
        const state = resolveStageState(stage, sow.stage, sow.status, decision);
        const isLast = index === APPROVAL_STAGE_ORDER.length - 1;

        return (
          <li key={stage} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast ? (
              <span
                aria-hidden
                className={cn(
                  "absolute left-[13px] top-7 bottom-0 w-px",
                  state === "approved" ? "bg-brand/40" : "bg-stroke-subtle",
                )}
              />
            ) : null}
            <StageMarker state={state} />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className={cn("font-body text-[13px] font-medium", state === "current" ? "text-foreground" : "text-text-secondary")}>
                  {STAGE_LABEL[stage]}
                  {state === "current" ? (
                    <span className="ml-2 inline-flex h-[18px] items-center px-2 rounded-full bg-brand-subtle font-body text-[10px] font-semibold text-brand-emphasis align-middle">
                      Current
                    </span>
                  ) : null}
                </p>
                <StageCaption state={state} decision={decision} />
              </div>
              {decision?.comment && state !== "waiting" ? (
                <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed line-clamp-2">&ldquo;{decision.comment}&rdquo;</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StageMarker({ state }: { state: StageState }) {
  if (state === "approved") {
    return (
      <span aria-hidden className="relative z-10 grid place-items-center h-7 w-7 rounded-full bg-brand text-on-brand ring-4 ring-surface shrink-0">
        <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
      </span>
    );
  }
  if (state === "rejected") {
    return (
      <span aria-hidden className="relative z-10 grid place-items-center h-7 w-7 rounded-full bg-warning-subtle text-warning-text ring-4 ring-surface shrink-0">
        <XCircle className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (state === "sent_back") {
    return (
      <span aria-hidden className="relative z-10 grid place-items-center h-7 w-7 rounded-full bg-bg-subtle text-text-secondary ring-4 ring-surface shrink-0 border border-stroke-subtle">
        <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span aria-hidden className="relative z-10 grid place-items-center h-7 w-7 rounded-full bg-info-subtle text-info-text ring-4 ring-surface shrink-0">
        <Circle className="h-2 w-2 fill-current" strokeWidth={0} />
      </span>
    );
  }
  return (
    <span aria-hidden className="relative z-10 grid place-items-center h-7 w-7 rounded-full bg-bg-subtle text-text-tertiary ring-4 ring-surface shrink-0 border border-stroke-subtle">
      <Circle className="h-2 w-2 fill-current" strokeWidth={0} />
    </span>
  );
}

function StageCaption({ state, decision }: { state: StageState; decision: SowApprovalSummary | undefined }) {
  if (state === "approved" && decision?.decidedAt) {
    return (
      <span className="font-mono text-[11px] text-text-tertiary tabular-nums" suppressHydrationWarning>
        Approved · {timeAgo(decision.decidedAt)}
      </span>
    );
  }
  if (state === "current") return <span className="font-body text-[11px] text-info-text font-medium">Your review</span>;
  if (state === "rejected") return <span className="font-body text-[11px] text-warning-text">Rejected</span>;
  if (state === "sent_back") return <span className="font-body text-[11px] text-text-tertiary">Sent back</span>;
  return <span className="font-body text-[11px] text-text-disabled">Pending</span>;
}

function StageHistoryList({ approvals }: { approvals: SowApprovalSummary[] }) {
  const decided = approvals.filter((a) => a.decision !== "pending");

  if (decided.length === 0) {
    return (
      <TenantEmptyState
        compact
        icon={ScrollText}
        title="No prior decisions"
        description="Stage decisions will appear here as approvers sign off."
        className="py-8"
      />
    );
  }

  return (
    <ul className="divide-y divide-stroke-subtle">
      {decided.map((a) => (
        <li key={a.id} className="px-4 sm:px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-body text-[13px] font-semibold text-foreground">{STAGE_LABEL[a.stage] ?? a.stage}</span>
            <DecisionChip decision={a.decision} />
            {a.decidedAt ? (
              <span className="font-mono text-[11px] text-text-tertiary tabular-nums" suppressHydrationWarning>
                {timeAgo(a.decidedAt)}
              </span>
            ) : null}
          </div>
          {a.comment ? <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">&ldquo;{a.comment}&rdquo;</p> : null}
        </li>
      ))}
    </ul>
  );
}

function DecisionChip({ decision }: { decision: string }) {
  const tone: Tone =
    decision === "approved" ? "success" : decision === "rejected" ? "warning" : decision === "send_back" ? "neutral" : "neutral";
  const label = decision.replace("_", " ");
  return (
    <span
      className="inline-flex h-[20px] items-center px-2 rounded-full font-body text-[10px] font-medium capitalize"
      style={{ color: TONE_TEXT[tone], background: TONE_SOFT[tone] }}
    >
      {label}
    </span>
  );
}
