"use client";

/**
 * KYC case detail — review identity evidence and record a decision.
 *
 * Workflow (top → bottom):
 *   1. Orient — status + SLA
 *   2. Decide — approve / request info / reject (when actionable)
 *   3. Review — identity → ID document → risk signals → prior decision
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  Gavel,
  SearchX,
  ShieldAlert,
} from "lucide-react";
import { useAdminKycCase, useKycPhotoReveal } from "@/lib/hooks/use-admin-kyc";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import { fullKycIdNumber, revealKycPhoto } from "@/lib/admin/mocks/kyc-service";
import type { KycStatus, KycTrack, MockKycCase } from "@/mocks/admin/kyc";
import { TenantEmptyState } from "@/app/admin/tenants/components/tenant-empty-state";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";
import { AdminModal, primaryStyle, secondaryBtnClass } from "../../_shell/aurora-ui";
import { KycDecisionModal } from "./kyc-decision-modal";

const BTN_PRIMARY_CLASS = cn(
  "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg",
  "font-body text-[13px] font-semibold text-on-brand hover:opacity-90 disabled:opacity-50",
);

type Risk = "high" | "medium" | "low";
type Tone = "success" | "info" | "warning" | "neutral" | "error";

const TRACK_LABEL: Record<KycTrack, string> = {
  "Women WF": "Women workforce",
  Student: "Student",
  Freelancer: "Freelancer",
  Internal: "Internal",
};

const STATUS_LABEL: Record<KycStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  awaiting_info: "Awaiting info",
  reuploaded: "Re-uploaded",
};

const STATUS_TONE: Record<KycStatus, Tone> = {
  pending: "warning",
  awaiting_info: "info",
  reuploaded: "info",
  approved: "success",
  rejected: "error",
};

const RISK_LABEL: Record<Risk, string> = { high: "High", medium: "Medium", low: "Low" };

const TONE_TEXT: Record<Tone, string> = {
  success: "var(--color-success-text)",
  info: "var(--color-info-text)",
  warning: "var(--color-warning-text)",
  neutral: "var(--color-text-secondary)",
  error: "var(--color-error-text)",
};

const TONE_SOFT: Record<Tone, string> = {
  success: "var(--color-success-subtle)",
  info: "var(--color-info-subtle)",
  warning: "var(--color-warning-subtle)",
  neutral: "var(--color-bg-subtle)",
  error: "var(--color-error-subtle)",
};

const BTN_SECONDARY = cn(
  "inline-flex items-center justify-center gap-2 h-9 px-3.5 rounded-lg",
  "border border-stroke-subtle bg-surface font-body text-[13px] font-medium text-foreground",
  "hover:bg-bg-subtle transition-colors",
);

function caseRisk(c: MockKycCase): Risk {
  if (c.autoChecks.some((chk) => chk.state === "fail")) return "high";
  if (c.autoChecks.some((chk) => chk.state === "warn")) return "medium";
  return "low";
}

function fmtDob(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtRelative(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function slaInfo(c: MockKycCase): { label: string; tone: Tone } {
  if (c.status !== "pending" && c.status !== "reuploaded") {
    return { label: "Complete", tone: "success" };
  }
  const remain = new Date(c.submittedAt).getTime() + c.slaHours * 3_600_000 - Date.now();
  if (remain <= 0) return { label: "Overdue", tone: "warning" };
  const h = Math.ceil(remain / 3_600_000);
  if (h <= 2) return { label: `${h}h left`, tone: "warning" };
  return { label: `${h}h left`, tone: "neutral" };
}

function isDecidable(c: MockKycCase): boolean {
  return c.status === "pending" || c.status === "reuploaded" || c.status === "awaiting_info";
}

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex h-[22px] items-center px-2.5 rounded-full font-body text-[11px] font-medium"
      style={{ color: TONE_TEXT[tone], background: TONE_SOFT[tone] }}
    >
      {children}
    </span>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <header className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
        <h2 className="font-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 font-body text-[12.5px] text-text-secondary">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}

function DetailRow({
  label,
  value,
  mono,
  className,
  suppressHydration,
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
  suppressHydration?: boolean;
}) {
  return (
    <div className={className}>
      <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">{label}</dt>
      <dd
        className={cn("mt-1 font-body text-[13.5px] text-foreground", mono && "font-mono text-[12.5px]")}
        suppressHydrationWarning={suppressHydration}
      >
        {value}
      </dd>
    </div>
  );
}

export function KycDetailWorkspace() {
  const params = useParams<{ caseId: string }>();
  const { profile } = useActiveAdmin();
  const canEdit = useAdminSectionCanEdit("kyc");
  const c = useAdminKycCase(params.caseId);
  const photoReveal = useKycPhotoReveal(params.caseId);

  const [photoOpen, setPhotoOpen] = React.useState(false);
  const [decisionOpen, setDecisionOpen] = React.useState(false);

  if (!c) {
    return (
      <div className="space-y-5 pb-4 animate-fade-in">
        <Link
          href="/admin/kyc"
          className="inline-flex items-center gap-1.5 font-body text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
          Back to KYC reviews
        </Link>
        <TenantEmptyState
          icon={SearchX}
          title="Case not found"
          description="This KYC case may have been removed or the ID is invalid."
          action={
            <Link href="/admin/kyc" className="font-body text-[13px] font-semibold text-text-link hover:underline underline-offset-2">
              Return to queue
            </Link>
          }
        />
      </div>
    );
  }

  const caseId = c.id;
  const sla = slaInfo(c);
  const decidable = isDecidable(c);
  const risk = caseRisk(c);
  const checksPass = c.autoChecks.filter((chk) => chk.state === "pass").length;
  const checksWarn = c.autoChecks.filter((chk) => chk.state === "warn").length;
  const checksFail = c.autoChecks.filter((chk) => chk.state === "fail").length;

  function handleRevealPhoto() {
    revealKycPhoto(caseId, profile.displayName);
    setPhotoOpen(true);
  }

  return (
    <div className="space-y-5 pb-4 animate-fade-in">
      <Link
        href="/admin/kyc"
        className="inline-flex items-center gap-1.5 font-body text-[13px] font-medium text-text-secondary hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} aria-hidden />
        Back to KYC reviews
      </Link>

      <header className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <Pill tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Pill>
          <Pill tone={risk === "high" ? "error" : risk === "medium" ? "warning" : "success"}>
            Risk · {RISK_LABEL[risk]}
          </Pill>
          <Pill tone={sla.tone}>{sla.label}</Pill>
        </div>
        <h1 className="font-display text-[26px] sm:text-[28px] font-semibold tracking-[-0.03em] text-foreground leading-tight">
          {c.contributorName}
        </h1>
        <p className="mt-1.5 font-body text-[14px] text-text-secondary">
          <span className="font-mono text-[12px]">{c.id}</span>
          <span aria-hidden className="mx-1.5 opacity-40">·</span>
          {TRACK_LABEL[c.track]}
          <span aria-hidden className="mx-1.5 opacity-40">·</span>
          Submitted <span suppressHydrationWarning>{fmtRelative(c.submittedAt)}</span>
          <span aria-hidden className="mx-1.5 opacity-40">·</span>
          {c.slaHours}h SLA
        </p>
      </header>

      {!canEdit ? (
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle/80 px-4 py-3 flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 shrink-0 text-text-tertiary mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] text-text-secondary">
            <span className="font-semibold text-foreground">View-only access.</span> KYC decisions require Platform
            Admin or Trust &amp; Safety.
          </p>
        </div>
      ) : null}

      {sla.label === "Overdue" && decidable ? (
        <div className="rounded-lg border border-warning-border bg-warning-subtle/50 px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 shrink-0 text-warning-text mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[13px] text-text-secondary">
            This submission exceeded the {c.slaHours}h review window — prioritize review.
          </p>
        </div>
      ) : null}

      {canEdit && decidable ? (
        <Card title="Decision required" description="Review evidence below, then record an outcome">
          <div className="px-4 sm:px-5 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="font-body text-[13px] text-text-secondary max-w-lg">
              Approve to unblock onboarding, request more info for re-upload, or reject if documents fail verification.
            </p>
            <button type="button" onClick={() => setDecisionOpen(true)} className={BTN_PRIMARY_CLASS} style={primaryStyle}>
              <Gavel className="h-4 w-4" strokeWidth={2.2} aria-hidden />
              Record decision
            </button>
          </div>
        </Card>
      ) : null}

      {c.decision ? (
        <Card title="Decision recorded" description="Final outcome for this submission">
          <dl className="px-4 sm:px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <DetailRow label="Outcome" value={c.decision.outcome.replace(/_/g, " ")} />
            <DetailRow label="By" value={c.decision.by} />
            <DetailRow label="At" value={new Date(c.decision.at).toLocaleString("en-US")} suppressHydration />
            {c.decision.reason ? <DetailRow label="Reason" value={c.decision.reason} className="sm:col-span-2" /> : null}
            {c.decision.note ? <DetailRow label="Note" value={c.decision.note} className="sm:col-span-2" /> : null}
          </dl>
        </Card>
      ) : null}

      <Card title="Verification snapshot" description="Automated checks on this submission">
        <dl className="px-4 sm:px-5 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">Passed</dt>
            <dd className="mt-1 font-display text-[22px] font-semibold text-success-text tabular-nums">{checksPass}</dd>
          </div>
          <div>
            <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">Warnings</dt>
            <dd className="mt-1 font-display text-[22px] font-semibold text-warning-text tabular-nums">{checksWarn}</dd>
          </div>
          <div>
            <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">Failures</dt>
            <dd className="mt-1 font-display text-[22px] font-semibold text-error-text tabular-nums">{checksFail}</dd>
          </div>
          <div>
            <dt className="font-body text-[10.5px] font-medium uppercase tracking-[0.1em] text-text-tertiary">ID type</dt>
            <dd className="mt-1 font-body text-[15px] font-semibold text-foreground">{c.idType}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Contributor identity" description="Profile details from onboarding">
        <dl className="px-4 sm:px-5 py-5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <DetailRow label="Name" value={c.contributorName} />
          <DetailRow label="Email" value={c.contributorEmail} />
          <DetailRow label="Date of birth" value={fmtDob(c.dob)} />
          <DetailRow label="Country" value={c.country} />
          <DetailRow label="Track" value={TRACK_LABEL[c.track]} />
        </dl>
      </Card>

      <Card title="ID document & evidence" description="Document submitted for verification">
        <div className="px-4 sm:px-5 py-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            <DetailRow label="Type" value={c.idType} />
            <DetailRow label="Number" value={`****-****-${c.idNumberLast4}`} mono />
            {photoReveal ? (
              <DetailRow label="Full number (revealed)" value={fullKycIdNumber(c)} mono className="sm:col-span-2" />
            ) : null}
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={handleRevealPhoto} className={BTN_SECONDARY}>
              <Eye className="h-4 w-4" strokeWidth={2} aria-hidden />
              View encrypted photo
            </button>
            <span className="font-body text-[11.5px] text-text-tertiary" suppressHydrationWarning>
              {photoReveal
                ? `Revealed ${new Date(photoReveal.revealedAt).toLocaleString("en-US")} · audited`
                : "Reveal is audited."}
            </span>
          </div>
        </div>
      </Card>

      <Card title="Risk signals" description="Results from the identity verification pipeline">
        <ul className="divide-y divide-stroke-subtle">
          {c.autoChecks.map((chk, i) => {
            const tone: Tone = chk.state === "pass" ? "success" : chk.state === "warn" ? "warning" : "error";
            const Icon = chk.state === "pass" ? CheckCircle2 : chk.state === "warn" ? AlertTriangle : AlertCircle;
            return (
              <li key={i} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} style={{ color: TONE_TEXT[tone] }} aria-hidden />
                <span className="font-body text-[13px] text-foreground flex-1 min-w-0">{chk.label}</span>
                <Pill tone={tone}>{chk.state}</Pill>
              </li>
            );
          })}
        </ul>
      </Card>

      <KycDecisionModal kycCase={c} open={decisionOpen} onClose={() => setDecisionOpen(false)} />

      <AdminModal
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        icon={FileText}
        tone="info"
        title={`ID photo · ${c.contributorName}`}
        description="Encrypted document view — access logged to audit trail"
        footer={
          <button type="button" data-testid="kyc-photo-dismiss" onClick={() => setPhotoOpen(false)} className={secondaryBtnClass}>
            Dismiss
          </button>
        }
      >
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle aspect-[4/3] flex items-center justify-center font-body text-[12px] text-text-tertiary">
          [ Encrypted ID photo placeholder · {c.idType} ]
        </div>
        <p className="mt-3 font-mono text-[11px] text-text-secondary">ID: {fullKycIdNumber(c)}</p>
      </AdminModal>
    </div>
  );
}
