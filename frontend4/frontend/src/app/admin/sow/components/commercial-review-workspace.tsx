"use client";

/**
 * Commercial gate review — dedicated page (mirrors enterprise /sow/[id]/approve pattern).
 *
 *   · Full-width admin layout, DashboardSection panels
 *   · Decision-first header actions → Meridian confirm modal
 *   · Pipeline, checklist, scope, history below the fold
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
  Loader2,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useSow } from "@/lib/hooks/use-sow-v2";
import { useAdminSectionGuard } from "@/lib/hooks/use-admin-section-guard";
import { approveSow, declineSow, sendBackSow } from "@/lib/api/sow-v2";
import { STAGE_LABEL } from "@/lib/enterprise/mocks/approvers";
import {
  APPROVAL_STAGE_ORDER,
  type SowApprovalSummary,
  type SowDetail,
  type SowStage,
  type SowStatus,
} from "@/lib/sow/types";
import {
  CommercialDecisionModal,
  COMMERCIAL_CHECKLIST,
  type CommercialDecisionAction,
  type CommercialDecisionPayload,
} from "@/app/admin/sow/components/commercial-decision-modal";
import { cn } from "@/lib/utils/cn";

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function slaRemaining(deadline: string | null): { label: string; breached: boolean } {
  if (!deadline) return { label: "—", breached: false };
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms < 0) return { label: "SLA breached", breached: true };
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return { label: `${h}h ${m}m remaining`, breached: false };
}

type StageState = "approved" | "current" | "waiting" | "rejected" | "sent_back";

function resolveStageState(
  stage: SowStage,
  currentStage: SowStage | null,
  status: SowStatus,
  decision: SowApprovalSummary | undefined,
): StageState {
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

  const { data: sow, isLoading } = useSow(sowId);
  const [busy, setBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [decisionAction, setDecisionAction] = React.useState<CommercialDecisionAction | null>(null);

  const atCommercial = sow?.status === "approval" && sow.stage === "commercial";
  // The uploaded SOW document (Vercel Blob URL) lives in the version payload so
  // approvers can open the actual file before deciding.
  const sowPayload = (sow?.activeVersionDetail?.payload ?? {}) as Record<string, unknown>;
  const sowFileUrl =
    (typeof sowPayload.fileUrl === "string" && sowPayload.fileUrl) ||
    (typeof sowPayload.file_url === "string" && sowPayload.file_url) ||
    null;
  const commercialApproval = sow?.approvals.find((a) => a.stage === "commercial");
  const sla = slaRemaining(commercialApproval?.slaDeadline ?? null);

  const runDecision = async (action: CommercialDecisionAction, payload: CommercialDecisionPayload) => {
    setActionError(null);
    setBusy(true);
    try {
      const suffix = payload.notifySponsor ? " · Sponsor notified (demo)" : "";
      if (action === "approve") {
        // Glimmora assigns the mentor at this Commercial/platform stage — record
        // it in the approval comment (audit trail) per the locked flow.
        const mentorNote = payload.mentorName
          ? ` · Mentor assigned by Glimmora: ${payload.mentorName}`
          : "";
        await approveSow(sowId, "commercial", `${payload.comment}${mentorNote}${suffix}`);
      } else if (action === "send_back") {
        await sendBackSow(sowId, "commercial", "business", `${payload.comment}${suffix}`);
      } else {
        await declineSow(sowId, `${payload.comment}${suffix}`);
      }
      await qc.invalidateQueries({ queryKey: ["sow"] });
      setDecisionAction(null);
      const msg =
        action === "approve" ? "approved" : action === "send_back" ? "sent_back" : "rejected";
      router.push(`/admin/sow?msg=${msg}`);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (!allowed) return null;

  if (isLoading && !sow) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!sow) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <p className="font-body text-[13px] text-text-secondary">SOW not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Commercial gate · Final stage (5 of 5) · awaiting your sign-off · v{sow.activeVersion}
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {sow.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
            <span className="font-mono text-[10.5px] tabular-nums">{sowId}</span>
            <span aria-hidden>·</span>
            <span>{sow.tenantName ?? "—"}</span>
            <span aria-hidden>·</span>
            <span>{sow.ownerName ?? sow.ownerId}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <StatusPill label="In approval" tone="brand" />
            <StatusPill label="Commercial" tone="current" />
            <StatusPill label={sow.confidentiality} tone="neutral" />
          </div>
        </div>

        {atCommercial && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {sow.tenantId && (
              <Link href={`/admin/tenants/${sow.tenantId}`} className={secondaryBtnCls}>
                <Building2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                View tenant
              </Link>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => setDecisionAction("send_back")}
              className={secondaryBtnCls}
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Send back
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setDecisionAction("reject")}
              className={dangerOutlineBtnCls}
            >
              <XCircle className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Reject
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setDecisionAction("approve")}
              className={primaryBtnCls}
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} aria-hidden />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
              )}
              Approve Commercial
            </button>
          </div>
        )}
      </header>

      {actionError && (
        <div className="rounded-md border border-error-border bg-error-subtle px-3 py-2 font-body text-[12.5px] text-error-text">
          {actionError}
        </div>
      )}

      {!atCommercial && (
        <div className="rounded-xl border border-stroke-subtle bg-surface px-4 py-3 font-body text-[13px] text-text-secondary">
          This SOW is no longer at the Commercial gate
          {sow.stage ? ` (current stage: ${STAGE_LABEL[sow.stage as keyof typeof STAGE_LABEL] ?? sow.stage})` : ""}.
          {" "}
          <Link href="/admin/sow" className="font-semibold text-brand hover:underline">
            Return to queue
          </Link>
        </div>
      )}

      <div
        className={cn(
          "rounded-xl border px-4 py-3 flex items-start gap-2.5",
          sla.breached
            ? "border-warning-border bg-warning-subtle/40"
            : "border-stroke-subtle bg-surface",
        )}
      >
        {sla.breached ? (
          <AlertTriangle className="h-4 w-4 text-warning-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
        ) : (
          <Clock className="h-4 w-4 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
        )}
        <div className="min-w-0">
          <p className="font-body text-[12.5px] font-semibold text-foreground">
            Commercial SLA · {sla.label}
          </p>
          <p className="mt-0.5 font-body text-[11.5px] text-text-secondary leading-relaxed">
            Submitted {timeAgo(sow.submittedForApprovalAt)} · Finance stage signed off · advances
            to Legal on the enterprise side after your approval
          </p>
        </div>
      </div>

      {atCommercial && (
        <DashboardSection
          eyebrow="Stage 5 of 5"
          title="Commercial sign-off"
          description="Confirm staffing viability, rate alignment, and scope fit before advancing the pipeline."
        >
          <ul className="space-y-2">
            {COMMERCIAL_CHECKLIST.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-2.5 rounded-lg border border-stroke-subtle bg-bg-subtle/30 px-3 py-2.5"
              >
                <Check className="h-3.5 w-3.5 text-text-tertiary shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
                <span className="font-body text-[12.5px] text-text-secondary leading-snug">
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-body text-[11px] text-text-tertiary">
            Checklist is enforced when you approve — use the header actions to record your decision.
          </p>
        </DashboardSection>
      )}

      <DashboardSection
        title="Pipeline progress"
        description="Finance → Legal → Security → Final sign-off → Commercial"
      >
        <PipelineStepper sow={sow} />
      </DashboardSection>

      <DashboardSection title="Record details" description="Tenant scope and submission metadata">
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
          <DetailField label="Tenant" value={sow.tenantName ?? "—"} />
          <DetailField label="Sponsor" value={sow.ownerName ?? sow.ownerId} />
          <DetailField label="Version" value={`v${sow.activeVersion}`} />
          <DetailField label="Submitted" value={timeAgo(sow.submittedForApprovalAt)} />
          <DetailField label="Confidentiality" value={sow.confidentiality} />
          <DetailField label="Review stage" value="Glimmora Commercial" />
        </dl>
      </DashboardSection>

      <DashboardSection
        title="Scope"
        description="Active version body submitted for approval"
        actions={
          <div className="flex items-center gap-1.5">
            {sowFileUrl && (
              <a
                href={sowFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "inline-flex items-center gap-1 h-7 px-2.5 rounded-md",
                  "font-body text-[12px] font-semibold text-on-brand bg-brand",
                  "hover:bg-brand-hover transition-colors duration-fast",
                )}
              >
                View SOW document
                <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
              </a>
            )}
            <Link
              href={`/enterprise/sow/${sowId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1 h-7 px-2.5 rounded-md",
                "font-body text-[12px] font-medium text-text-secondary",
                "hover:bg-surface-hover hover:text-foreground transition-colors duration-fast",
              )}
            >
              Open record
              <ExternalLink className="h-3 w-3" strokeWidth={2} aria-hidden />
            </Link>
          </div>
        }
      >
        <pre className="whitespace-pre-wrap font-body text-[12.5px] text-text-secondary leading-relaxed rounded-lg border border-stroke-subtle bg-bg-subtle/30 p-4 max-h-[min(52vh,520px)] overflow-auto">
          {sow.activeVersionDetail?.body ?? "No scope body recorded."}
        </pre>
      </DashboardSection>

      <DashboardSection title="Decision history" description="Prior stage decisions on this SOW">
        <StageHistoryList approvals={sow.approvals} />
      </DashboardSection>

      {decisionAction && (
        <CommercialDecisionModal
          open
          action={decisionAction}
          sowTitle={sow.title}
          submitting={busy}
          onClose={() => !busy && setDecisionAction(null)}
          onConfirm={(payload) => runDecision(decisionAction, payload)}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/sow"
      className="inline-flex items-center gap-1.5 font-body text-[12px] text-text-tertiary hover:text-foreground transition-colors duration-fast"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Commercial gate
    </Link>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "brand" | "current" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex px-2 py-0.5 rounded-full font-body text-[10px] font-semibold capitalize",
        tone === "brand" && "bg-brand-subtle text-brand-subtle-text",
        tone === "current" && "bg-brand/15 text-brand-emphasis ring-1 ring-brand/25",
        tone === "neutral" && "bg-bg-subtle text-text-secondary border border-stroke-subtle",
      )}
    >
      {label}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd className="mt-0.5 font-body text-[12.5px] font-medium text-foreground capitalize">
        {value}
      </dd>
    </div>
  );
}

function PipelineStepper({ sow }: { sow: SowDetail }) {
  const decisionByStage = new Map<SowStage, SowApprovalSummary>();
  for (const a of sow.approvals) {
    const existing = decisionByStage.get(a.stage);
    if (!existing || new Date(a.createdAt) > new Date(existing.createdAt)) {
      decisionByStage.set(a.stage, a);
    }
  }

  return (
    <ol className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2">
      {APPROVAL_STAGE_ORDER.map((stage, i) => {
        const decision = decisionByStage.get(stage);
        const state = resolveStageState(stage, sow.stage, sow.status, decision);

        const Icon =
          state === "approved"
            ? CheckCircle2
            : state === "current"
              ? Clock
              : state === "rejected"
                ? XCircle
                : state === "sent_back"
                  ? AlertTriangle
                  : Circle;

        const iconCls =
          state === "approved"
            ? "text-success-text"
            : state === "current"
              ? "text-brand"
              : state === "rejected"
                ? "text-error-text"
                : state === "sent_back"
                  ? "text-warning-text"
                  : "text-text-disabled";

        const caption =
          state === "approved" && decision?.decidedAt
            ? `Approved · ${timeAgo(decision.decidedAt)}`
            : state === "current"
              ? "Your review"
              : state === "rejected"
                ? "Rejected"
                : state === "sent_back"
                  ? "Sent back"
                  : "Pending";

        return (
          <li key={stage} className="relative min-w-0">
            {i < APPROVAL_STAGE_ORDER.length - 1 && (
              <span
                aria-hidden
                className="hidden sm:block absolute top-3 left-[calc(50%+12px)] right-0 h-px bg-stroke-subtle"
              />
            )}
            <div className="flex sm:flex-col sm:items-center gap-2 sm:gap-1.5 sm:text-center">
              <span
                className={cn(
                  "grid place-items-center h-6 w-6 rounded-full border shrink-0",
                  state === "current" && "border-brand bg-brand-subtle",
                  state === "approved" && "border-success-border bg-success-subtle",
                  state === "waiting" && "border-stroke-subtle bg-surface",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", iconCls)} strokeWidth={2} aria-hidden />
              </span>
              <div className="min-w-0 flex-1 sm:flex-none">
                <p className="font-body text-[12px] font-semibold text-foreground">
                  {STAGE_LABEL[stage as keyof typeof STAGE_LABEL] ?? stage}
                </p>
                <p
                  className={cn(
                    "font-body text-[10.5px] truncate",
                    state === "current" ? "text-brand font-medium" : "text-text-tertiary",
                  )}
                >
                  {caption}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function StageHistoryList({ approvals }: { approvals: SowApprovalSummary[] }) {
  const decided = approvals.filter((a) => a.decision !== "pending");

  if (decided.length === 0) {
    return (
      <p className="font-body text-[12.5px] text-text-tertiary py-4 text-center">
        No prior decisions recorded.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke-subtle overflow-hidden">
      {decided.map((a) => (
        <li key={a.id} className="px-4 py-3 bg-surface">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-body text-[12.5px] font-semibold text-foreground">
              {STAGE_LABEL[a.stage as keyof typeof STAGE_LABEL] ?? a.stage}
            </span>
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-[0.06em]",
                a.decision === "approved"
                  ? "text-success-text"
                  : a.decision === "rejected"
                    ? "text-error-text"
                    : a.decision === "send_back"
                      ? "text-warning-text"
                      : "text-text-tertiary",
              )}
            >
              {a.decision.replace("_", " ")}
            </span>
            {a.decidedAt && (
              <span className="font-mono text-[10px] text-text-tertiary">{timeAgo(a.decidedAt)}</span>
            )}
          </div>
          {a.comment && (
            <p className="mt-1 font-body text-[11.5px] text-text-secondary leading-relaxed">
              &ldquo;{a.comment}&rdquo;
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

const secondaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke",
  "font-body text-[13px] font-semibold text-text-secondary",
  "hover:text-foreground hover:border-stroke-strong transition-colors duration-fast",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);

const dangerOutlineBtnCls = cn(
  secondaryBtnCls,
  "hover:text-error-text hover:border-error-border",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand text-on-brand",
  "font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
  "disabled:opacity-60 disabled:cursor-not-allowed",
);
