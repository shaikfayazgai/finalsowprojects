"use client";

/**
 * SOW detail — record view.
 *
 *   Identity header card (title · status · primary action)
 *   Approval pipeline (prominent) · pricing · staffing
 *   Two-column record: scope / intake / approvals  +  details / risk
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
  Workflow,
} from "lucide-react";
import { useSow } from "@/lib/hooks/use-sow-v2";
import { useEnterpriseAccess } from "@/lib/hooks/use-enterprise-access";
import { Skeleton } from "@/components/meridian";
import { canViewSowByConfidentiality } from "@/lib/sow/confidentiality-access";
import { SowStaffingSection } from "./_components/sow-staffing-section";
import { SowEnterprisePricingCard } from "./_components/sow-enterprise-pricing-card";
import type {
  SowApprovalSummary,
  SowDetail,
  SowStage,
  SowStatus,
} from "@/lib/sow/types";
import { APPROVAL_STAGE_ORDER, STAGE_LABEL, isEnterpriseStage } from "@/lib/sow/types";
import {
  parseIntakePayload,
  approverDisplayName,
  type IntakeSubmissionPayload,
  type RiskBreakdownPayload,
} from "@/lib/sow/intake-payload";
import { cn } from "@/lib/utils/cn";
import { AURORA_ACCENT, DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, TONE, primaryBtnClass, primaryStyle, secondaryBtnClass, type Tone } from "@/app/admin/_shell/aurora-ui";

const STATUS_LABEL: Record<SowStatus, string> = {
  draft: "Draft",
  approval: "In approval",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

const STATUS_TONE: Record<SowStatus, Tone> = {
  draft: "neutral",
  approval: "info",
  approved: "success",
  rejected: "error",
  withdrawn: "neutral",
  archived: "neutral",
};

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
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
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
        <div className="rounded-lg border px-4 py-3 flex items-start gap-2.5" style={{ background: TONE.error.soft, borderColor: TONE.error.border }}>
          <AlertTriangle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <div className="min-w-0">
            <p className="font-body text-[13px] font-semibold text-error-text">Couldn&apos;t load this SOW</p>
            <p className="mt-0.5 font-body text-[12px] text-error-text/85">{(error as Error).message ?? "Unknown error"}</p>
          </div>
        </div>
      </div>
    );
  }
  if (!sow) notFound();

  return <SowDetailView sow={sow} />;
}

function SowDetailView({ sow }: { sow: SowDetail }) {
  const { canActOnStage, isSowOwner, roles, email, meLoading } = useEnterpriseAccess();
  const rawPayload = sow.activeVersionDetail?.payload ?? ({} as Record<string, unknown>);
  const canView = canViewSowByConfidentiality({
    confidentiality: sow.confidentiality,
    roles,
    actorEmail: email,
    ownerId: sow.ownerId,
    payload: rawPayload,
  });

  if (meLoading) return <DetailSkeleton />;
  if (!canView) return <ConfidentialityRestrictedView />;

  const intake = parseIntakePayload(rawPayload);

  const startDate = intake.startDate;
  const endDate = intake.endDate;
  const sponsor = intake.sponsor;
  const stakeholders = intake.stakeholders;
  const risk = (intake.riskBreakdown ?? null) as RiskBreakdown | null;
  const extraction = intake.extraction;
  const sourceFile = intake.sourceFile;
  const initiative = intake.initiative;
  // The uploaded SOW document lives at the top level (file→Blob); fall back to
  // the version payload for older rows. Drives the "View document" link.
  const sowFile = sow as unknown as { fileUrl?: string | null; fileName?: string | null };
  const documentUrl =
    sowFile.fileUrl ?? (rawPayload.fileUrl as string | undefined) ?? null;
  const documentName = sowFile.fileName ?? sourceFile?.name ?? "SOW document";
  const submission = intake.submission;

  const isRejected = sow.status === "rejected";
  const isDraft = sow.status === "draft";
  const inApproval = sow.status === "approval";
  const isApproved = sow.status === "approved";
  const stale = inApproval && hoursSince(sow.updatedAt) > 48;
  const platformWait = inApproval && sow.stage === "platform";
  const atEnterpriseGate = inApproval && sow.stage != null && isEnterpriseStage(sow.stage);
  const canSignOff = atEnterpriseGate && sow.stage != null && canActOnStage(sow.ownerId, sow.stage);
  const ownerAwaitingAdmin = atEnterpriseGate && isSowOwner(sow.ownerId);

  const primaryAction = isDraft
    ? { href: `/enterprise/sow/${sow.id}/approve`, label: "Submit for approval", icon: Send }
    : canSignOff
      ? { href: `/enterprise/sow/${sow.id}/approve`, label: "Record gate decision", icon: CheckCircle2 }
      : ownerAwaitingAdmin || platformWait
        ? { href: `/enterprise/sow/${sow.id}/approve`, label: "Open approval workflow", icon: Clock }
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

      {/* Identity header */}
      <header className={cn(DASH_CARD, "p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between")}>
        <div className="flex items-start gap-4 min-w-0">
          <span className="grid place-items-center h-12 w-12 rounded-lg text-white shrink-0" style={GLASS_GRADIENT} aria-hidden>
            <FileText className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
              SOW · Version {sow.activeVersion}
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-[22px] sm:text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
                {sow.title}
              </h1>
              <Chip tone={STATUS_TONE[sow.status]}>{STATUS_LABEL[sow.status]}</Chip>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
              {sow.stage && inApproval ? (
                <span>
                  Stage <span className="font-medium text-text-secondary">{STAGE_LABEL[sow.stage]}</span>
                </span>
              ) : null}
              {stale ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="font-semibold text-warning-text">Overdue · &gt;48h</span>
                </>
              ) : null}
              {sow.stage && inApproval ? <span aria-hidden>·</span> : null}
              <span className="tabular-nums">Updated {timeAgo(sow.updatedAt)}</span>
            </div>
            <RecordLinks sow={sow} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {documentUrl ? (
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={secondaryBtnClass}
              title={documentName}
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              View document
            </a>
          ) : null}
          {isDraft ? (
            <Link href={`/enterprise/sow/${sow.id}/edit`} className={secondaryBtnClass}>
              <Edit3 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
              Edit draft
            </Link>
          ) : null}
          {primaryAction ? (
            <Link href={primaryAction.href} style={primaryStyle} className={cn(primaryBtnClass, "px-5")}>
              {React.createElement(primaryAction.icon, { className: "h-4 w-4", strokeWidth: 2.25, "aria-hidden": true })}
              {primaryAction.label}
            </Link>
          ) : null}
        </div>
      </header>

      {isRejected ? (
        <ContextBanner tone="error" title="SOW rejected">
          See the approvals log below for the reason. A new draft version is required before resubmitting.
        </ContextBanner>
      ) : null}

      {platformWait ? (
        <ContextBanner tone="brand" title="Awaiting Super admin">
          All enterprise gates (incl. tenant-admin sign-off) have passed. The Super admin performs the final approval before delivery.
        </ContextBanner>
      ) : null}

      {ownerAwaitingAdmin && sow.stage ? (
        <ContextBanner tone="brand" title={`Awaiting ${STAGE_LABEL[sow.stage]}`}>
          You submitted this SOW. Each enterprise internal gate is approved by its reviewer (four-eyes) — you cannot approve your own submission.
        </ContextBanner>
      ) : null}

      {/* Approval pipeline */}
      <Section title="Approval progress" description="Security → Finance → Legal → Tenant admin → Super admin">
        <div className="px-5 sm:px-6 py-5">
          <ApprovalStepper approvals={sow.approvals} currentStage={sow.stage} status={sow.status} submission={submission} />
        </div>
      </Section>

      <SowEnterprisePricingCard payload={rawPayload} />

      {inApproval || isApproved ? (
        <SowStaffingSection
          sowId={sow.id}
          reviewer={(rawPayload?.reviewer as { id?: string; name?: string; email?: string } | null) ?? null}
          mentor={(rawPayload?.mentor as { name?: string; email?: string } | null) ?? null}
        />
      ) : null}

      {/* Two-column record */}
      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-5 min-w-0">
          {sow.activeVersionDetail?.body ? (
            <Section
              title="Scope"
              description={sow.activeVersionDetail.changeNote ? `Change note: ${sow.activeVersionDetail.changeNote}` : "Active version body"}
            >
              <div className="px-5 sm:px-6 py-5 font-body text-[13px] text-foreground whitespace-pre-wrap leading-relaxed">
                {sow.activeVersionDetail.body}
              </div>
            </Section>
          ) : null}

          {hasIntakeExtras ? (
            <Section title="Intake artifacts" description="Uploaded source and extraction output">
              <div className="px-5 sm:px-6 py-5 space-y-4">
                {sourceFile ? (
                  <div className="flex items-start gap-3">
                    <span className="grid place-items-center h-9 w-9 rounded-lg border border-stroke-subtle bg-bg-subtle/40 text-text-tertiary shrink-0">
                      <FileText className="h-4 w-4" strokeWidth={2} aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <p className="font-body text-[13px] font-semibold text-foreground truncate">{sourceFile.name}</p>
                      <p className="font-mono text-[10.5px] text-text-tertiary tabular-nums mt-0.5">
                        {(sourceFile.sizeBytes / 1024).toFixed(0)} KB{sourceFile.type ? ` · ${sourceFile.type}` : ""}
                      </p>
                      {intake.intakeMode === "upload" && extraction ? (
                        <p className="mt-1 font-body text-[11px] text-text-secondary">
                          Extraction confidence <span className="font-mono tabular-nums font-semibold">{Math.round(extraction.confidence * 100)}%</span>
                          {extraction.ocrApplied ? " · OCR applied" : ""}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {extraction && extraction.deliverables.length > 0 ? (
                  <div>
                    <p className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-2">
                      Deliverables · {extraction.deliverables.length}
                    </p>
                    <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke-subtle overflow-hidden">
                      {extraction.deliverables.map((d, i) => (
                        <li key={d.id} className="flex items-center gap-2 px-3 py-2.5 bg-bg-subtle/30">
                          <span className="font-mono text-[10px] text-text-tertiary tabular-nums w-6">D{String(i + 1).padStart(2, "0")}</span>
                          <span className="font-body text-[12.5px] text-foreground">{d.title}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {extraction && extraction.riskFlags.length > 0 ? (
                  <div>
                    <p className="font-body text-[10.5px] font-semibold uppercase tracking-[0.1em] text-text-tertiary mb-2">Intake risk flags</p>
                    <ul className="divide-y divide-stroke-subtle rounded-lg border border-stroke-subtle overflow-hidden">
                      {extraction.riskFlags.map((r) => (
                        <li key={r.id} className="px-3 py-2.5 bg-bg-subtle/30">
                          <p className="font-body text-[12.5px] font-medium text-foreground">
                            <span className="font-mono text-[10px] uppercase text-text-tertiary mr-1.5">{r.severity}</span>
                            {r.message}
                          </p>
                          <p className="mt-0.5 font-body text-[11.5px] text-text-secondary">{r.suggestion}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Section>
          ) : null}

          <Section
            title="Approvals log"
            description={sow.approvals.length === 0 ? "No decisions yet" : `${sow.approvals.length} decision${sow.approvals.length === 1 ? "" : "s"} on record`}
          >
            <ApprovalsLog approvals={sow.approvals} submission={submission} />
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Details" description="Core metadata">
            <dl className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <Fact label="Owner" value={ownerLabel(sow.ownerId)} />
              <Fact label="Confidentiality" value={sow.confidentiality} mono />
              {initiative ? <Fact label="Initiative" value={initiative} /> : null}
              {startDate || endDate ? <Fact label="Timeline" value={`${formatDate(startDate)} → ${formatDate(endDate)}`} mono className="sm:col-span-2" /> : null}
              {sponsor ? <Fact label="Sponsor" value={sponsor} /> : null}
              {stakeholders.length > 0 ? <Fact label="Stakeholders" value={stakeholders.join(", ")} className="sm:col-span-2" /> : null}
              <Fact label="Created" value={formatDate(sow.createdAt)} mono />
              <Fact label="Last updated" value={timeAgo(sow.updatedAt)} mono />
            </dl>
          </Section>

          <ProjectDetailsSection payload={rawPayload} />

          {risk ? <RiskSection risk={risk} /> : null}
        </div>
      </div>
    </div>
  );
}

function ConfidentialityRestrictedView() {
  return (
    <div className="space-y-4 pb-12 animate-fade-in">
      <BackLink />
      <div className="rounded-lg border px-4 py-3" style={{ background: TONE.warning.soft, borderColor: TONE.warning.border }}>
        <p className="font-body text-[13px] font-semibold text-foreground">Restricted SOW visibility</p>
        <p className="mt-1 font-body text-[12px] text-text-secondary">
          You do not have access to this SOW based on its confidentiality level.
        </p>
      </div>
    </div>
  );
}

/* ─── Primitives ─── */

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-stroke-subtle">
        <div className="min-w-0">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 font-body text-[12px] text-text-tertiary">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/sow"
      className="inline-flex items-center gap-1.5 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.2} aria-hidden />
      Back to workspace
    </Link>
  );
}

function RecordLinks({ sow }: { sow: SowDetail }) {
  const hasVersionHistory = sow.activeVersion > 1;
  const auditHref = `/enterprise/audit?resourceType=sow&resourceId=${encodeURIComponent(sow.id)}&action=sow`;

  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      {hasVersionHistory ? (
        <>
          <Link href={`/enterprise/sow/${sow.id}/versions`} className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast">
            Version history
          </Link>
          <span aria-hidden className="text-text-disabled">·</span>
        </>
      ) : null}
      <Link href={auditHref} className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast">
        Audit trail
      </Link>
    </p>
  );
}

function ContextBanner({ tone, title, children }: { tone: "error" | "brand"; title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg border px-4 py-3"
      style={{
        background: tone === "error" ? TONE.error.soft : TONE.info.soft,
        borderColor: tone === "error" ? TONE.error.border : TONE.info.border,
      }}
    >
      <p className={cn("font-body text-[13px] font-semibold", tone === "error" ? "text-error-text" : "text-foreground")}>{title}</p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}

function Fact({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd className={cn("mt-1 font-body text-[13px] text-foreground break-words", mono && "font-mono text-[12px] tabular-nums")}>{value}</dd>
    </div>
  );
}

/**
 * Collapsible "View details" panel — surfaces everything captured at intake that the
 * compact Core-metadata block leaves out (priority, engagement, duration/weeks,
 * effort, budget, required skills, deliverables, and the scope blocks). Reads the
 * raw SOW row exposed on `sow.payload`.
 */
function ProjectDetailsSection({ payload }: { payload: Record<string, unknown> }) {
  const [open, setOpen] = React.useState(false);
  const p = payload || {};
  const str = (k: string): string | null => {
    const v = p[k];
    return v == null || v === "" ? null : String(v);
  };
  const num = (k: string): number | null => {
    const v = p[k];
    if (typeof v === "number") return v;
    const n = v == null || v === "" ? NaN : Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const arr = (k: string): string[] => {
    const v = p[k];
    return Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];
  };
  const scope = (p.scope && typeof p.scope === "object" ? p.scope : {}) as Record<string, unknown>;
  const scopeStr = (k: string): string | null => {
    const v = scope[k];
    return v == null || v === "" ? null : String(v);
  };

  const skills = arr("requiredSkills");
  const deliverables = arr("deliverables").length ? arr("deliverables") : arr("deliverableList");
  const weeks = num("durationWeeks");
  const hours = num("effortHours") ?? num("estimatedHours");
  const budget = num("budgetAmount") ?? num("estimatedBudget");
  const cur = str("budgetCurrency") || "INR";

  const facts: Array<{ label: string; value: string }> = [];
  const days = num("durationDays");
  const pri = str("priority"); if (pri) facts.push({ label: "Priority", value: pri });
  const eng = str("engagementType"); if (eng) facts.push({ label: "Engagement", value: eng });
  if (weeks != null && weeks > 0) facts.push({ label: "Duration", value: `${weeks} week${weeks === 1 ? "" : "s"}` });
  else if (days != null && days > 0) facts.push({ label: "Duration", value: `${days} day${days === 1 ? "" : "s"}` });
  if (hours != null) facts.push({ label: "Effort", value: `${hours} hrs` });
  if (budget != null) facts.push({ label: "Budget", value: `${cur === "INR" ? "₹" : `${cur} `}${budget.toLocaleString("en-IN")}` });

  const blocks: Array<{ label: string; value: string }> = [];
  if (skills.length) blocks.push({ label: "Required skills", value: skills.join(", ") });
  const obj = scopeStr("objectives"); if (obj) blocks.push({ label: "Objectives", value: obj });
  const asm = scopeStr("assumptions"); if (asm) blocks.push({ label: "Assumptions", value: asm });
  const exc = scopeStr("exclusions"); if (exc) blocks.push({ label: "Exclusions", value: exc });
  const acc = scopeStr("acceptanceCriteria"); if (acc) blocks.push({ label: "Acceptance criteria", value: acc });

  const total = facts.length + blocks.length + (deliverables.length ? 1 : 0);
  if (total === 0) return null;

  return (
    <Section
      title="Project details"
      description="Everything captured at intake"
      action={
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="rounded-md border border-stroke-subtle px-3 py-1.5 font-body text-[12px] font-semibold text-foreground hover:bg-stroke-subtle/30 transition-colors"
        >
          {open ? "Hide details" : "View details"}
        </button>
      }
    >
      {open ? (
        <div className="px-5 sm:px-6 py-5 space-y-5">
          {facts.length ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {facts.map((f) => (
                <Fact key={f.label} label={f.label} value={f.value} />
              ))}
            </dl>
          ) : null}
          {deliverables.length ? (
            <div>
              <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Deliverables</p>
              <ul className="mt-1.5 list-disc pl-5 space-y-1 font-body text-[13px] text-foreground">
                {deliverables.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {blocks.map((b) => (
            <div key={b.label}>
              <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">{b.label}</p>
              <p className="mt-1 font-body text-[13px] text-foreground whitespace-pre-wrap break-words">{b.value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-5 sm:px-6 py-4 font-body text-[12px] text-text-tertiary">
          {total} detail field{total === 1 ? "" : "s"} captured — click “View details” to expand.
        </div>
      )}
    </Section>
  );
}

/* ─── Approval stepper ─── */

type StageState = "approved" | "current" | "waiting" | "rejected" | "sent_back";

function resolveStageState(stage: SowStage, currentStage: SowStage | null, status: SowStatus, decision: SowApprovalSummary | undefined): StageState {
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
    return <p className="font-body text-[13px] text-text-tertiary">Submit this draft to start the approval flow.</p>;
  }

  return (
    <ol className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2">
      {APPROVAL_STAGE_ORDER.map((stage, i) => {
        const decision = decisionByStage.get(stage);
        const state = resolveStageState(stage, currentStage, status, decision);
        const assignedName = approverDisplayName(decision?.approverId, submission, stage) ?? submission?.approvers[stage]?.name ?? null;

        return (
          <li key={stage} className="relative min-w-0">
            {i < APPROVAL_STAGE_ORDER.length - 1 ? (
              <span aria-hidden className="hidden sm:block absolute top-3 left-[calc(50%+12px)] right-0 h-px bg-foreground/[0.10]" />
            ) : null}
            <StageNode label={STAGE_LABEL[stage]} state={state} decision={decision} assignedName={assignedName} />
          </li>
        );
      })}
    </ol>
  );
}

function StageNode({ label, state, decision, assignedName }: { label: string; state: StageState; decision: SowApprovalSummary | undefined; assignedName: string | null }) {
  const Icon =
    state === "approved" ? CheckCircle2 : state === "current" ? Clock : state === "rejected" ? XCircle : state === "sent_back" ? AlertTriangle : Circle;

  const iconCls =
    state === "approved"
      ? "text-success-text"
      : state === "current"
        ? "text-info-text"
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
          state === "current" && "border-info-border bg-info-subtle",
          state === "approved" && "border-success-border bg-success-subtle",
          state === "waiting" && "border-stroke-subtle bg-bg-subtle",
          (state === "rejected" || state === "sent_back") && "border-stroke-subtle bg-bg-subtle",
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", iconCls)} strokeWidth={2} aria-hidden />
      </span>
      <div className="min-w-0 flex-1 sm:flex-none">
        <p className="font-body text-[12px] font-semibold text-foreground">{label}</p>
        <p className={cn("font-body text-[10.5px] truncate", state === "current" ? "text-info-text font-medium" : "text-text-tertiary")}>{caption}</p>
      </div>
    </div>
  );
}

/* ─── Approvals log ─── */

function ApprovalsLog({ approvals, submission }: { approvals: SowApprovalSummary[]; submission: IntakeSubmissionPayload | null }) {
  if (approvals.length === 0) {
    return <p className="px-5 sm:px-6 py-4 font-body text-[13px] text-text-tertiary">No approval decisions yet. Submit the draft to start the pipeline.</p>;
  }

  const sorted = [...approvals].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <ul className="divide-y divide-stroke-subtle">
      {sorted.map((a) => {
        const meta = [
          a.decision.replace(/_/g, " "),
          a.decidedAt ? timeAgo(a.decidedAt) : "pending",
          a.approverId ? approverDisplayName(a.approverId, submission, a.stage) ?? ownerLabel(a.approverId) : submission?.approvers[a.stage]?.name,
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <li key={a.id} className="px-5 sm:px-6 py-2.5 hover:bg-bg-subtle/60 transition-colors duration-fast">
            <div className="flex items-center justify-between gap-4 min-h-[44px]">
              <span className="font-body text-[13px] font-medium text-foreground">
                {STAGE_LABEL[a.stage]}
                <span className="ml-2 font-mono text-[10px] text-text-tertiary">v{a.sowVersion}</span>
              </span>
              <span
                className={cn(
                  "font-body text-[11px] text-right truncate max-w-[50%]",
                  a.decision === "rejected" || a.decision === "send_back" ? "text-warning-text font-medium" : "text-text-tertiary",
                )}
              >
                {meta}
              </span>
            </div>
            {a.comment ? <p className="mt-1 font-body text-[12px] text-text-secondary leading-relaxed">{a.comment}</p> : null}
            {a.slaDeadline && a.decision === "pending" ? <p className="mt-1 font-body text-[11px] text-warning-text">SLA · decide by {formatDate(a.slaDeadline)}</p> : null}
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

  const barStyle = (v: number | undefined): React.CSSProperties =>
    v === undefined
      ? { backgroundColor: "var(--color-text-disabled)" }
      : v >= 80
        ? { backgroundColor: "var(--color-success-solid)" }
        : v >= 60
          ? { backgroundImage: AURORA_ACCENT }
          : v >= 40
            ? { backgroundColor: "var(--color-warning-solid)" }
            : { backgroundColor: "var(--color-error-solid)" };

  const overallTone: Tone = risk.overall === "low" ? "success" : risk.overall === "medium" ? "warning" : "error";

  return (
    <Section title="Risk scores" description={risk.overall ? `Overall · ${risk.overall}` : "Parsed from intake"} action={risk.overall ? <Chip tone={overallTone}>{risk.overall}</Chip> : undefined}>
      <ul className="px-5 sm:px-6 py-5 space-y-3">
        {rows.map((r) => {
          const val = Math.round(typeof r.value === "number" ? r.value : 0);
          return (
            <li key={r.label} className="grid grid-cols-[100px_1fr_40px] items-center gap-3">
              <span className="font-body text-[12px] text-text-secondary">{r.label}</span>
              <div className="h-1.5 rounded-full bg-foreground/[0.08] overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${val}%`, ...barStyle(r.value) }} aria-hidden />
              </div>
              <span className="font-mono text-[11px] text-text-tertiary tabular-nums text-right">{typeof r.value === "number" ? `${val}%` : "—"}</span>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ─── Skeleton ─── */

function SkeletonCard({ rows = 3, children }: { rows?: number; children?: React.ReactNode }) {
  return (
    <div className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-2.5 w-48" />
      </div>
      {children ?? (
        <div className="px-5 sm:px-6 py-5 space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className={cn("h-3.5", i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-2/3")} />
          ))}
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Skeleton className="h-4 w-28" />

      {/* Identity header */}
      <div className={cn(DASH_CARD, "p-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between")}>
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-lg" />
          <div className="space-y-2.5">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-6 w-56 sm:w-72" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Skeleton className="h-10 w-44 rounded-lg" />
      </div>

      {/* Approval progress */}
      <SkeletonCard>
        <div className="px-5 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-2.5 w-12" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* Commercial summary */}
      <SkeletonCard>
        <div className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </SkeletonCard>

      {/* Two-column record */}
      <div className="grid gap-5 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-5">
          <SkeletonCard rows={4} />
          <SkeletonCard rows={3} />
        </div>
        <div className="space-y-5">
          <SkeletonCard rows={5} />
        </div>
      </div>
    </div>
  );
}
