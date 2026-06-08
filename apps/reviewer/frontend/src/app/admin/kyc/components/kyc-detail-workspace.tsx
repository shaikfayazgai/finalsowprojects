"use client";

/**
 * KYC case detail — aligned with governance case detail patterns.
 */

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  ShieldAlert,
} from "lucide-react";
import { Modal, StatusChip } from "@/components/meridian";
import { DashboardSection } from "@/components/meridian/dashboard";
import { useAdminKycCase, useKycPhotoReveal } from "@/lib/hooks/use-admin-kyc";
import { useActiveAdmin } from "@/lib/hooks/use-active-admin";
import { useAdminSectionCanEdit } from "@/lib/hooks/use-admin-section-edit";
import {
  fullKycIdNumber,
  revealKycPhoto,
  submitKycDecision,
  type KycDecisionOutcome,
} from "@/lib/admin/mocks/kyc-service";
import { markContributorKycVerifiedAction } from "@/lib/actions/kyc-verification";
import { decideRealKyc } from "@/lib/api/admin-kyc";
import type { KycStatus, KycTrack, MockKycCase } from "@/mocks/admin/kyc";
import { cn } from "@/lib/utils/cn";

type Tab = "overview" | "verification" | "decision";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "verification", label: "Verification" },
  { key: "decision", label: "Decision" },
];

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

function statusChip(s: KycStatus): "success" | "warning" | "error" | "pending" | "neutral" | "info" {
  switch (s) {
    case "pending":
      return "warning";
    case "reuploaded":
    case "awaiting_info":
      return "info";
    case "approved":
      return "success";
    case "rejected":
      return "error";
  }
}

function fmtDob(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function fmtRel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.round(ms / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d}d ago`;
}

function slaInfo(c: MockKycCase): { label: string; overdue: boolean } {
  const remain = new Date(c.submittedAt).getTime() + c.slaHours * 3_600_000 - Date.now();
  if (c.status !== "pending" && c.status !== "reuploaded") {
    return { label: "Complete", overdue: false };
  }
  if (remain <= 0) return { label: "Overdue", overdue: true };
  return { label: `${Math.ceil(remain / 3_600_000)}h remaining`, overdue: false };
}

function isDecidable(c: MockKycCase): boolean {
  return c.status === "pending" || c.status === "reuploaded" || c.status === "awaiting_info";
}

export function KycDetailWorkspace() {
  const params = useParams<{ caseId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { profile } = useActiveAdmin();
  const canEdit = useAdminSectionCanEdit("kyc");
  const { case: c, loading: caseLoading } = useAdminKycCase(params.caseId);
  const photoReveal = useKycPhotoReveal(params.caseId);

  const tab = (searchParams.get("tab") as Tab | null) ?? "overview";
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "overview";

  const [decision, setDecision] = React.useState<KycDecisionOutcome | "">("");
  const [note, setNote] = React.useState("");
  const [photoOpen, setPhotoOpen] = React.useState(false);
  const [toast, setToast] = React.useState<string | null>(
    searchParams.get("decided") === "1" ? "Decision recorded." : null,
  );

  React.useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const setTab = React.useCallback(
    (next: Tab) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (next === "overview") nextParams.delete("tab");
      else nextParams.set("tab", next);
      nextParams.delete("decided");
      const qs = nextParams.toString();
      router.replace(
        qs ? `/admin/kyc/${params.caseId}?${qs}` : `/admin/kyc/${params.caseId}`,
        { scroll: false },
      );
    },
    [router, searchParams, params.caseId],
  );

  if (!c) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <Link
          href="/admin/kyc"
          className="inline-flex items-center gap-1 font-body text-[12px] text-text-tertiary hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> KYC reviews
        </Link>
        <p className="font-body text-[13px] text-text-secondary">
          {caseLoading ? "Loading case…" : "Case not found."}
        </p>
      </div>
    );
  }

  const caseId = c.id;
  const caseTrack = c.track;
  const caseEmail = c.contributorEmail;
  const sla = slaInfo(c);
  const decidable = isDecidable(c);
  const checksPass = c.autoChecks.filter((chk) => chk.state === "pass").length;
  const checksWarn = c.autoChecks.filter((chk) => chk.state === "warn").length;
  const checksFail = c.autoChecks.filter((chk) => chk.state === "fail").length;

  const canSubmit =
    canEdit &&
    decidable &&
    decision !== "" &&
    (decision === "approved" || note.trim().length > 4);

  function handleRevealPhoto() {
    revealKycPhoto(caseId, profile.displayName);
    setPhotoOpen(true);
  }

  function handleSubmit() {
    if (!canSubmit || !decision) return;
    // Update local mock store for instant UI (no-op for real backend cases).
    submitKycDecision(caseId, decision, note, profile.displayName);

    // Use the narrowed case fields for track/email (works for mock + real).
    const track = caseTrack;
    const email = caseEmail;

    // 1) Tell the BACKEND — flips contributor_kyc.status + login_accounts
    //    .approval_status so the applicant can actually log in after approval.
    //    (caseId is the backend accountId for real cases.)
    void decideRealKyc(
      caseId,
      decision === "approved" ? "approve" : "reject",
      note || (decision === "approved" ? "Approved" : "Rejected"),
    ).then((r) => {
      if (!r.ok) console.error("[kyc decision → backend]", r.error);
    });

    // 2) On approval, sync the frontend Prisma gate (kycVerifiedAt) so the
    //    dashboard unlocks for Freelancer / Women WF tracks.
    if (decision === "approved" && (track === "Freelancer" || track === "Women WF")) {
      void markContributorKycVerifiedAction(email).then((result) => {
        if (!result.success) {
          console.error("[kyc approve → prisma]", result.error);
        }
      });
    }

    router.push("/admin/kyc?decided=1");
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {toast && (
        <div
          role="status"
          className="rounded-xl border border-success-border bg-success-subtle px-4 py-2.5 font-body text-[12.5px] text-success-text"
        >
          {toast}
        </div>
      )}

      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1 font-body text-[12px] text-text-tertiary"
      >
        <Link
          href="/admin/kyc"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:text-foreground hover:bg-bg-subtle transition-colors duration-fast"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />{" "}
          <span>KYC reviews</span>
        </Link>
        <span aria-hidden className="opacity-60">/</span>
        <span className="text-text-secondary font-mono text-[11.5px]">{c.id}</span>
      </nav>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
            Platform · Identity verification
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
              {c.contributorName}
            </h1>
            <StatusChip status={statusChip(c.status)} size="sm">
              {STATUS_LABEL[c.status]}
            </StatusChip>
            {sla.overdue && (
              <StatusChip status="error" size="sm" showDot>
                SLA overdue
              </StatusChip>
            )}
          </div>
          <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary">
            <span className="font-mono text-[12px]">{c.id}</span>
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            {TRACK_LABEL[c.track]}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            Submitted {fmtRel(c.submittedAt)}
            <span aria-hidden className="opacity-50 mx-1.5">·</span>
            SLA {c.slaHours}h ({sla.label})
          </p>
        </div>

        {canEdit && decidable && (
          <button type="button" onClick={() => setTab("decision")} className={primaryBtnCls}>
            Record decision
          </button>
        )}
      </header>

      {!canEdit && (
        <ContextBanner icon={ShieldAlert} title="View-only access">
          KYC decisions require Platform Admin or Trust &amp; Safety.
        </ContextBanner>
      )}

      {sla.overdue && decidable && (
        <ContextBanner icon={AlertTriangle} title="Past SLA" variant="warning">
          This submission exceeded the {c.slaHours}h review window — prioritize review.
        </ContextBanner>
      )}

      <DashboardSection title="Verification snapshot" description="Automated checks and document summary">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Checks passed" value={String(checksPass)} highlight={checksPass > 0} />
          <SummaryStat label="Warnings" value={String(checksWarn)} alert={checksWarn > 0} />
          <SummaryStat label="Failures" value={String(checksFail)} alert={checksFail > 0} />
          <SummaryStat label="ID type" value={c.idType} />
        </dl>
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <nav
          aria-label="Case sections"
          className="flex flex-wrap gap-x-1 px-5 pt-3 border-b border-stroke-subtle"
        >
          {TABS.map((t) => {
            const active = activeTab === t.key;
            const badge =
              t.key === "verification"
                ? c.autoChecks.length
                : t.key === "decision" && c.decision
                  ? 1
                  : null;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-2.5",
                  "font-body text-[13px] font-medium whitespace-nowrap",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-t-sm",
                  active ? "text-foreground" : "text-text-secondary",
                )}
              >
                {t.label}
                {badge != null && badge > 0 && (
                  <span className="font-mono text-[10px] tabular-nums text-text-tertiary">
                    {badge}
                  </span>
                )}
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-px h-0.5 bg-brand rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-5 space-y-5">
          {activeTab === "overview" && <OverviewTab govCase={c} />}
          {activeTab === "verification" && (
            <VerificationTab
              govCase={c}
              photoReveal={photoReveal}
              onRevealPhoto={handleRevealPhoto}
            />
          )}
          {activeTab === "decision" && (
            <DecisionTab
              govCase={c}
              canEdit={canEdit}
              decidable={decidable}
              decision={decision}
              setDecision={setDecision}
              note={note}
              setNote={setNote}
              canSubmit={canSubmit}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      </section>

      <Modal
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        title={`ID photo · ${c.contributorName}`}
        description="Encrypted document view — access logged to audit trail"
        footer={
          <button
            type="button"
            data-testid="kyc-photo-dismiss"
            onClick={() => setPhotoOpen(false)}
            className={primaryBtnCls}
          >
            Dismiss
          </button>
        }
      >
        <div className="rounded-lg border border-stroke-subtle bg-bg-subtle aspect-[4/3] flex items-center justify-center font-body text-[12px] text-text-tertiary">
          [ Encrypted ID photo placeholder · {c.idType} ]
        </div>
        <p className="mt-3 font-mono text-[11px] text-text-secondary">
          ID: {fullKycIdNumber(c)}
        </p>
      </Modal>
    </div>
  );
}

function OverviewTab({ govCase: c }: { govCase: MockKycCase }) {
  return (
    <Panel title="Contributor identity" description="Profile details from onboarding">
      <dl className="space-y-3">
        <DetailRow label="Name" value={c.contributorName} />
        <DetailRow label="Email" value={c.contributorEmail} />
        <DetailRow label="Date of birth" value={fmtDob(c.dob)} />
        <DetailRow label="Country" value={c.country} />
        <DetailRow label="Track" value={TRACK_LABEL[c.track]} />
      </dl>
    </Panel>
  );
}

function VerificationTab({
  govCase: c,
  photoReveal,
  onRevealPhoto,
}: {
  govCase: MockKycCase;
  photoReveal?: { revealedAt: string; by: string };
  onRevealPhoto: () => void;
}) {
  return (
    <>
      <Panel title="ID upload" description="Document submitted for verification">
        <dl className="space-y-3">
          <DetailRow label="Type" value={c.idType} />
          <DetailRow label="Number" value={`****-****-${c.idNumberLast4}`} />
          {photoReveal && (
            <DetailRow label="Full number (revealed)" value={fullKycIdNumber(c)} />
          )}
        </dl>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" onClick={onRevealPhoto} className={actionBtnCls}>
            <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            View encrypted photo
          </button>
          <span className="font-body text-[11px] text-text-tertiary">
            {photoReveal
              ? `Revealed ${new Date(photoReveal.revealedAt).toLocaleString()} · audited`
              : "Reveal is audited."}
          </span>
        </div>
      </Panel>

      <Panel title="Automated checks" description="Results from identity verification pipeline">
        <ul className="space-y-2">
          {c.autoChecks.map((chk, i) => (
            <li key={i} className="flex items-center gap-2.5 font-body text-[13px]">
              {chk.state === "pass" ? (
                <CheckCircle2 className="h-4 w-4 text-success-text shrink-0" strokeWidth={2} aria-hidden />
              ) : chk.state === "warn" ? (
                <AlertTriangle className="h-4 w-4 text-warning-text shrink-0" strokeWidth={2} aria-hidden />
              ) : (
                <AlertCircle className="h-4 w-4 text-error-text shrink-0" strokeWidth={2} aria-hidden />
              )}
              <span className="text-foreground">{chk.label}</span>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}

function DecisionTab({
  govCase: c,
  canEdit,
  decidable,
  decision,
  setDecision,
  note,
  setNote,
  canSubmit,
  onSubmit,
}: {
  govCase: MockKycCase;
  canEdit: boolean;
  decidable: boolean;
  decision: KycDecisionOutcome | "";
  setDecision: (v: KycDecisionOutcome | "") => void;
  note: string;
  setNote: (v: string) => void;
  canSubmit: boolean;
  onSubmit: () => void;
}) {
  if (c.decision) {
    return (
      <Panel title="Decision recorded" description="Final outcome for this submission">
        <dl className="space-y-3">
          <DetailRow label="Outcome" value={c.decision.outcome.replace(/_/g, " ")} />
          {c.decision.reason && <DetailRow label="Reason" value={c.decision.reason} />}
          <DetailRow
            label="By"
            value={`${c.decision.by} · ${new Date(c.decision.at).toLocaleString()}`}
          />
        </dl>
      </Panel>
    );
  }

  if (!canEdit || !decidable) {
    return (
      <div className="rounded-xl border border-dashed border-stroke-subtle bg-bg-subtle/30 px-5 py-8 text-center">
        <p className="font-body text-[13px] text-text-secondary">No decision recorded yet.</p>
      </div>
    );
  }

  return (
    <Panel title="Record decision" description="Approve, request more info, or reject this submission">
      <fieldset className="space-y-2">
        <legend className="font-body text-[11.5px] font-semibold text-foreground mb-2">
          Outcome
        </legend>
        <Radio
          name="kyc-decision"
          checked={decision === "approved"}
          onChange={() => setDecision("approved")}
        >
          Approve
        </Radio>
        <Radio
          name="kyc-decision"
          checked={decision === "more_info"}
          onChange={() => setDecision("more_info")}
        >
          Request more info (specify what)
        </Radio>
        <Radio
          name="kyc-decision"
          checked={decision === "rejected"}
          onChange={() => setDecision("rejected")}
        >
          Reject (specify reason)
        </Radio>
      </fieldset>

      <label className="block mt-5">
        <span className="block font-body text-[11.5px] font-semibold text-foreground mb-1.5">
          Note{" "}
          <span className="font-normal text-text-tertiary">
            (audit + visible to contributor on approval/rejection)
          </span>
        </span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className={textareaCls} />
      </label>

      <footer className="mt-5 pt-4 border-t border-stroke-subtle flex items-center justify-between gap-3">
        <Link
          href="/admin/kyc"
          className="font-body text-[13px] text-text-secondary hover:text-foreground transition-colors"
        >
          Back to queue
        </Link>
        <button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className={cn(primaryBtnCls, !canSubmit && "opacity-50 cursor-not-allowed hover:bg-brand")}
        >
          Submit decision
        </button>
      </footer>
    </Panel>
  );
}

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-bg-subtle/20 overflow-hidden">
      <header className="px-4 py-3 border-b border-stroke-subtle">
        <h2 className="font-body text-[13px] font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{description}</p>
        )}
      </header>
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
      <dt className="sm:w-40 shrink-0 font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd className="font-body text-[13px] text-foreground">{value}</dd>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  alert,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  alert?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[20px] font-semibold tabular-nums tracking-tight",
          alert ? "text-warning-text" : highlight ? "text-foreground" : "text-text-secondary",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function ContextBanner({
  icon: Icon,
  title,
  children,
  variant = "neutral",
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  title: string;
  children: React.ReactNode;
  variant?: "neutral" | "warning";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        variant === "warning"
          ? "border-warning-border/60 bg-warning-subtle/30"
          : "border-stroke-subtle bg-bg-subtle/50",
      )}
    >
      <p
        className={cn(
          "font-body text-[12px] font-semibold flex items-center gap-1.5",
          variant === "warning" ? "text-warning-text" : "text-text-secondary",
        )}
      >
        <Icon
          className={cn("h-3.5 w-3.5 shrink-0", variant === "warning" ? "" : "text-text-tertiary")}
          strokeWidth={2}
          aria-hidden
        />
        {title}
      </p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary leading-relaxed">{children}</p>
    </div>
  );
}

function Radio({
  name,
  checked,
  onChange,
  children,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-2.5 font-body text-[12.5px] text-foreground cursor-pointer">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 border-stroke text-brand focus:ring-brand"
      />
      <span className="leading-relaxed">{children}</span>
    </label>
  );
}

const actionBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md",
  "bg-surface border border-stroke-subtle shadow-xs",
  "font-body text-[13px] font-medium text-foreground",
  "hover:bg-surface-hover transition-colors duration-fast",
);

const primaryBtnCls = cn(
  "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md shadow-xs",
  "bg-brand text-on-brand font-body text-[13px] font-semibold",
  "hover:bg-brand-hover transition-colors duration-fast",
);

const textareaCls = cn(
  "block w-full px-3 py-2.5 rounded-md border border-stroke-subtle bg-surface",
  "font-body text-[13px] text-foreground leading-relaxed",
  "focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand",
);
