"use client";

/**
 * SOW detail — single-column record view aligned with workspace list UX.
 *
 *   Header (title, meta, primary action)
 *   Context banners (rejected / commercial wait only)
 *   Approval progress (compact stepper)
 *   Sections: Details · Scope · Intake · Risk · Approvals
 */

import * as React from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  Send,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  ExternalLink,
  Workflow,
} from "lucide-react";
import { useSow } from "@/lib/hooks/use-sow-v2";
import { Skeleton } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import type {
  SowApprovalSummary,
  SowDetail,
  SowStage,
  SowStatus,
} from "@/lib/sow/types";
import { APPROVAL_STAGE_ORDER } from "@/lib/sow/types";
import {
  parseIntakePayload,
  approverDisplayName,
  type IntakeSubmissionPayload,
  type RiskBreakdownPayload,
} from "@/lib/sow/intake-payload";
import { cn } from "@/lib/utils/cn";

const STATUS_LABEL: Record<SowStatus, string> = {
  draft: "Draft",
  approval: "In approval",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

const STAGE_LABEL: Record<SowStage, string> = {
  business: "Finance",
  commercial: "Commercial",
  legal: "Legal",
  security: "Security",
  final: "Final sign-off",
};

function statusPillCls(s: SowStatus): string {
  switch (s) {
    case "draft":
      return "bg-bg-subtle text-text-secondary";
    case "approval":
      return "bg-brand-subtle text-brand-subtle-text";
    case "approved":
      return "bg-success-subtle text-success-text";
    case "rejected":
      return "bg-error-subtle text-error-text";
    default:
      return "bg-bg-subtle text-text-tertiary";
  }
}

function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3_600_000;
}

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ownerLabel(ownerId: string): string {
  if (ownerId.includes("@")) return ownerId.split("@")[0];
  if (ownerId.length <= 14) return ownerId;
  return `${ownerId.slice(0, 12)}…`;
}

export default function SowDetailPage() {
  const params = useParams<{ sowId: string }>();
  const sowId = params?.sowId ?? "";
  const { data: sow, isLoading, error } = useSow(sowId);

  if (isLoading && !sow) return <DetailSkeleton />;
  if (error) {
    return (
      <div className="space-y-4 pb-12 animate-fade-in">
        <BackLink />
        <div className="rounded-xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <div className="min-w-0">
            <p className="font-body text-[13px] font-semibold text-error-text">Couldn&apos;t load this SOW</p>
            <p className="mt-0.5 font-body text-[12px] text-error-text/85">
              {(error as Error).message ?? "Unknown error"}
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (!sow) notFound();

  return <SowDetailView sow={sow} />;
}

function SowDetailView({ sow }: { sow: SowDetail }) {
  const rawPayload = sow.activeVersionDetail?.payload ?? ({} as Record<string, unknown>);
  const intake = parseIntakePayload(rawPayload);

  const startDate = intake.startDate;
  const endDate = intake.endDate;
  const sponsor = intake.sponsor;
  const stakeholders = intake.stakeholders;
  const risk = (intake.riskBreakdown ?? null) as RiskBreakdown | null;
  const extraction = intake.extraction;
  const sourceFile = intake.sourceFile;
  // Vercel Blob URL of the uploaded SOW document (backend-persisted SOWs).
  const sowFileUrl =
    (typeof rawPayload.fileUrl === "string" && rawPayload.fileUrl) ||
    (typeof rawPayload.file_url === "string" && rawPayload.file_url) ||
    null;
  const initiative = intake.initiative;
  const submission = intake.submission;

  const isRejected = sow.status === "rejected";
  const isDraft = sow.status === "draft";
  const inApproval = sow.status === "approval";
  const isApproved = sow.status === "approved";
  const stale = inApproval && hoursSince(sow.updatedAt) > 48;
  const commercialWait = inApproval && sow.stage === "commercial";
  /** Enterprise can approve every stage except Commercial (Glimmora ops). */
  const canEnterpriseSignOff =
    inApproval && sow.stage != null && sow.stage !== "commercial";

  const primaryAction = isDraft
    ? { href: `/enterprise/sow/${sow.id}/approve`, label: "Submit for approval", icon: Send }
    : canEnterpriseSignOff && sow.stage
      ? {
          href: `/enterprise/sow/${sow.id}/approve`,
          label: `Sign off ${STAGE_LABEL[sow.stage]}`,
          icon: CheckCircle2,
        }
      : isApproved
        ? { href: "/enterprise/decomposition", label: "Decompose SOW", icon: Workflow }
        : null;

  const hasIntakeExtras =
    Boolean(sourceFile) ||
    Boolean(extraction && extraction.deliverables.length > 0) ||
    Boolean(extraction && extraction.riskFlags.length > 0);

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            SOW · Version {sow.activeVersion}
          </p>
          <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
            {sow.title}
          </h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
            <span
              className={cn(
                "inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold",
                statusPillCls(sow.status),
              )}
            >
              {STATUS_LABEL[sow.status]}
            </span>
            {sow.stage && inApproval && (
              <>
                <span aria-hidden>·</span>
                <span>
                  Stage{" "}
                  <span className="font-medium text-text-secondary">{STAGE_LABEL[sow.stage]}</span>
                </span>
              </>
            )}
            {stale && (
              <>
                <span aria-hidden>·</span>
                <span className="font-medium text-warning-text">Overdue · &gt;48h</span>
              </>
            )}
            <span aria-hidden>·</span>
            <span className="tabular-nums">Updated {timeAgo(sow.updatedAt)}</span>
          </div>
          <RecordLinks sow={sow} />
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isDraft && (
            <Link
              href={`/enterprise/sow/${sow.id}/edit`}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-stroke",
                "bg-surface font-body text-[13px] font-semibold text-foreground",
                "hover:bg-surface-hover transition-colors duration-fast",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              )}
            >
              <Edit3 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Edit draft
            </Link>
          )}
          {primaryAction && (
            <Link
              href={primaryAction.href}
              className={cn(
                "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
                "bg-brand text-on-brand font-body text-[13px] font-semibold",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus",
              )}
            >
              {React.createElement(primaryAction.icon, {
                className: "h-3.5 w-3.5",
                strokeWidth: 2.25,
                "aria-hidden": true,
              })}
              {primaryAction.label}
            </Link>
          )}
        </div>
      </header>

      {isRejected && (
        <ContextBanner tone="error" title="SOW rejected">
          See the approvals log below for the reason. A new draft version is required before resubmitting.
        </ContextBanner>
      )}

      {commercialWait && (
        <ContextBanner tone="brand" title="Awaiting Glimmora Commercial">
          All enterprise gates are signed off. Glimmora Commercial does the final
          confirmation of staffing, rates, and scope viability to close the SOW.
        </ContextBanner>
      )}

      {/* Approval progress */}
      <DashboardSection
        title="Approval progress"
        description="Finance → Legal → Security → Final sign-off → Commercial"
      >
        <ApprovalStepper
          approvals={sow.approvals}
          currentStage={sow.stage}
          status={sow.status}
          submission={submission}
        />
      </DashboardSection>

      {/* Details */}
      <DashboardSection title="Details" description="Core metadata for this statement of work">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <Fact label="Owner" value={ownerLabel(sow.ownerId)} />
          <Fact label="Confidentiality" value={sow.confidentiality} mono />
          {initiative && <Fact label="Initiative" value={initiative} />}
          {(startDate || endDate) && (
            <Fact
              label="Timeline"
              value={`${formatDate(startDate)} → ${formatDate(endDate)}`}
              mono
            />
          )}
          {sponsor && <Fact label="Sponsor" value={sponsor} />}
          {stakeholders.length > 0 && (
            <Fact label="Stakeholders" value={stakeholders.join(", ")} className="sm:col-span-2" />
          )}
          <Fact label="Created" value={formatDate(sow.createdAt)} mono />
          <Fact label="Last updated" value={timeAgo(sow.updatedAt)} mono />
        </dl>
      </DashboardSection>

      {sow.activeVersionDetail?.body && (
        <DashboardSection
          title="Scope"
          description={
            sow.activeVersionDetail.changeNote
              ? `Change note: ${sow.activeVersionDetail.changeNote}`
              : "Active version body"
          }
        >
          <div className="font-body text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
            {sow.activeVersionDetail.body}
          </div>
        </DashboardSection>
      )}

      {hasIntakeExtras && (
        <DashboardSection title="Intake artifacts" description="Uploaded source and extraction output">
          <div className="space-y-4">
            {sourceFile && (
              <div className="flex items-start gap-3 pb-4 border-b border-stroke-subtle last:border-0 last:pb-0">
                <span className="grid place-items-center h-9 w-9 rounded-lg border border-stroke-subtle text-text-tertiary shrink-0">
                  <FileText className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <div className="min-w-0">
                  {sowFileUrl ? (
                    <a
                      href={sowFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-body text-[13px] font-semibold text-brand hover:underline truncate inline-flex items-center gap-1"
                    >
                      {sourceFile.name}
                      <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                    </a>
                  ) : (
                    <p className="font-body text-[13px] font-semibold text-foreground truncate">
                      {sourceFile.name}
                    </p>
                  )}
                  <p className="font-mono text-[10.5px] text-text-tertiary tabular-nums mt-0.5">
                    {(sourceFile.sizeBytes / 1024).toFixed(0)} KB
                    {sourceFile.type ? ` · ${sourceFile.type}` : ""}
                  </p>
                  {intake.intakeMode === "upload" && extraction && (
                    <p className="mt-1 font-body text-[11px] text-text-secondary">
                      Extraction confidence{" "}
                      <span className="font-mono tabular-nums font-semibold">
                        {Math.round(extraction.confidence * 100)}%
                      </span>
                      {extraction.ocrApplied ? " · OCR applied" : ""}
                    </p>
                  )}
                </div>
              </div>
            )}

            {extraction && extraction.deliverables.length > 0 && (
              <div>
                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-2">
                  Deliverables · {extraction.deliverables.length}
                </p>
                <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke-subtle overflow-hidden">
                  {extraction.deliverables.map((d, i) => (
                    <li
                      key={d.id}
                      className="flex items-center gap-2 px-3 py-2.5 bg-surface"
                    >
                      <span className="font-mono text-[10px] text-text-tertiary tabular-nums w-6">
                        D{String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-body text-[12.5px] text-foreground">{d.title}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {extraction && extraction.riskFlags.length > 0 && (
              <div>
                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-2">
                  Intake risk flags
                </p>
                <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke-subtle overflow-hidden">
                  {extraction.riskFlags.map((r) => (
                    <li key={r.id} className="px-3 py-2.5 bg-surface">
                      <p className="font-body text-[12.5px] font-medium text-foreground">
                        <span className="font-mono text-[10px] uppercase text-text-tertiary mr-1.5">
                          {r.severity}
                        </span>
                        {r.message}
                      </p>
                      <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">{r.suggestion}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DashboardSection>
      )}

      {risk && <RiskSection risk={risk} />}

      <DashboardSection
        title="Approvals log"
        description={
          sow.approvals.length === 0
            ? "No decisions yet"
            : `${sow.approvals.length} decision${sow.approvals.length === 1 ? "" : "s"} on record`
        }
      >
        <ApprovalsLog approvals={sow.approvals} submission={submission} />
      </DashboardSection>
    </div>
  );
}

/* ─── Primitives ─── */

function BackLink() {
  return (
    <Link
      href="/enterprise/sow"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to workspace
    </Link>
  );
}

function RecordLinks({ sow }: { sow: SowDetail }) {
  const hasVersionHistory = sow.activeVersion > 1;
  const auditHref = `/enterprise/audit?resourceType=sow&resourceId=${encodeURIComponent(sow.id)}&action=sow`;

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      {hasVersionHistory && (
        <>
          <Link
            href={`/enterprise/sow/${sow.id}/versions`}
            className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
          >
            Version history
          </Link>
          <span aria-hidden className="text-text-disabled">
            ·
          </span>
        </>
      )}
      <Link
        href={auditHref}
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Audit trail
      </Link>
    </p>
  );
}

function ContextBanner({
  tone,
  title,
  children,
}: {
  tone: "error" | "brand";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        tone === "error"
          ? "border-error-border bg-error-subtle"
          : "border-brand/30 bg-brand-subtle/20",
      )}
    >
      <p
        className={cn(
          "font-body text-[13px] font-semibold",
          tone === "error" ? "text-error-text" : "text-foreground",
        )}
      >
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function Fact({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12px] tabular-nums",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

/* ─── Approval stepper ─── */

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

function ApprovalStepper({
  approvals,
  currentStage,
  status,
  submission,
}: {
  approvals: SowApprovalSummary[];
  currentStage: SowStage | null;
  status: SowStatus;
  submission: IntakeSubmissionPayload | null;
}) {
  const decisionByStage = new Map<SowStage, SowApprovalSummary>();
  for (const a of approvals) {
    const existing = decisionByStage.get(a.stage);
    if (!existing || new Date(a.createdAt) > new Date(existing.createdAt)) {
      decisionByStage.set(a.stage, a);
    }
  }

  if (status === "draft") {
    return (
      <p className="font-body text-[13px] text-text-tertiary">
        Submit this draft to start the five-stage approval pipeline.
      </p>
    );
  }

  return (
    <ol className="grid grid-cols-1 sm:grid-cols-5 gap-4 sm:gap-2">
      {APPROVAL_STAGE_ORDER.map((stage, i) => {
        const decision = decisionByStage.get(stage);
        const state = resolveStageState(stage, currentStage, status, decision);
        const assignedName =
          approverDisplayName(decision?.approverId, submission, stage) ??
          submission?.approvers[stage]?.name ??
          null;

        return (
          <li key={stage} className="relative min-w-0">
            {i < APPROVAL_STAGE_ORDER.length - 1 && (
              <span
                aria-hidden
                className="hidden sm:block absolute top-3 left-[calc(50%+12px)] right-0 h-px bg-stroke-subtle"
              />
            )}
            <StageNode
              label={STAGE_LABEL[stage]}
              state={state}
              decision={decision}
              assignedName={assignedName}
            />
          </li>
        );
      })}
    </ol>
  );
}

function StageNode({
  label,
  state,
  decision,
  assignedName,
}: {
  label: string;
  state: StageState;
  decision: SowApprovalSummary | undefined;
  assignedName: string | null;
}) {
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
        ? assignedName ? `Waiting · ${assignedName}` : "In progress"
        : state === "rejected"
          ? "Rejected"
          : state === "sent_back"
            ? "Sent back"
            : assignedName
              ? assignedName
              : "Pending";

  return (
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
        <p className="font-body text-[12px] font-semibold text-foreground">{label}</p>
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
  );
}

/* ─── Approvals log ─── */

function ApprovalsLog({
  approvals,
  submission,
}: {
  approvals: SowApprovalSummary[];
  submission: IntakeSubmissionPayload | null;
}) {
  if (approvals.length === 0) {
    return (
      <p className="font-body text-[13px] text-text-tertiary py-2">
        No approval decisions yet. Submit the draft to start the pipeline.
      </p>
    );
  }

  const sorted = [...approvals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <ul className="divide-y divide-stroke-subtle -mx-5">
      {sorted.map((a) => {
        const meta = [
          a.decision.replace(/_/g, " "),
          a.decidedAt ? timeAgo(a.decidedAt) : "pending",
          a.approverId
            ? approverDisplayName(a.approverId, submission, a.stage) ?? ownerLabel(a.approverId)
            : submission?.approvers[a.stage]?.name,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <li key={a.id} className="px-5 py-2.5">
            <div className="flex items-center justify-between gap-4 min-h-[44px]">
              <span className="font-body text-[13px] font-medium text-foreground">
                {STAGE_LABEL[a.stage]}
                <span className="ml-2 font-mono text-[10px] text-text-tertiary">v{a.sowVersion}</span>
              </span>
              <span
                className={cn(
                  "font-body text-[11px] text-right truncate max-w-[50%]",
                  a.decision === "rejected" || a.decision === "send_back"
                    ? "text-warning-text font-medium"
                    : "text-text-tertiary",
                )}
              >
                {meta}
              </span>
            </div>
            {a.comment && (
              <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed pl-0">
                {a.comment}
              </p>
            )}
            {a.slaDeadline && a.decision === "pending" && (
              <p className="mt-1 font-body text-[11px] text-warning-text">
                SLA · decide by {formatDate(a.slaDeadline)}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ─── Risk ─── */

interface RiskBreakdown extends RiskBreakdownPayload {}

function RiskSection({ risk }: { risk: RiskBreakdown }) {
  const rows: Array<{ label: string; value: number | undefined }> = [
    { label: "Completeness", value: risk.completeness },
    { label: "Confidence", value: risk.confidence },
    { label: "Compliance", value: risk.compliance },
    { label: "Pattern match", value: risk.patternMatch },
  ];

  const barTone = (v: number | undefined) =>
    v === undefined
      ? "bg-stroke"
      : v >= 80
        ? "bg-success"
        : v >= 60
          ? "bg-brand"
          : v >= 40
            ? "bg-warning-solid"
            : "bg-error-text";

  return (
    <DashboardSection
      title="Risk scores"
      description={risk.overall ? `Overall · ${risk.overall}` : "Parsed from intake"}
      actions={
        risk.overall ? (
          <span
            className={cn(
              "inline-flex px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase",
              risk.overall === "low"
                ? "bg-success-subtle text-success-text"
                : risk.overall === "medium"
                  ? "bg-warning-subtle text-warning-text"
                  : "bg-error-subtle text-error-text",
            )}
          >
            {risk.overall}
          </span>
        ) : undefined
      }
    >
      <ul className="space-y-3">
        {rows.map((r) => {
          const val = Math.round(typeof r.value === "number" ? r.value : 0);
          return (
            <li key={r.label} className="grid grid-cols-[120px_1fr_40px] items-center gap-3">
              <span className="font-body text-[12px] text-text-secondary">{r.label}</span>
              <div className="h-1.5 rounded-full bg-bg-subtle overflow-hidden">
                <div
                  className={cn("h-full rounded-full", barTone(r.value))}
                  style={{ width: `${val}%` }}
                  aria-hidden
                />
              </div>
              <span className="font-mono text-[11px] text-text-tertiary tabular-nums text-right">
                {typeof r.value === "number" ? `${val}%` : "—"}
              </span>
            </li>
          );
        })}
      </ul>
    </DashboardSection>
  );
}

/* ─── Skeleton ─── */

function DetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-2/3 max-w-lg" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-40 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  );
}
