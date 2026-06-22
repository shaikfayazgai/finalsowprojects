"use client";

/**
 * Compliance workspace — Phase 1 baseline posture: consent, retention,
 * and deletion request rollups with deep-links into sub-surfaces.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Clock,
  Trash2,
  Users,
} from "lucide-react";
import { useComplianceOverview } from "@/lib/hooks/use-enterprise-compliance";
import { useConsentInventory } from "@/lib/hooks/use-enterprise-consent";
import { ComplianceApiError } from "@/lib/api/enterprise-compliance";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { ACCENT_TEXT, AURORA_ACCENT, GLASS_CARD, GLASS_SHADOW } from "@/app/admin/_shell/aurora";
import { SectionCard, ProgressBar, TONE } from "@/app/admin/_shell/aurora-ui";

const MISSING_LABEL: Record<string, string> = {
  acceptTos: "T&Cs",
  acceptPrivacy: "Privacy",
  acceptCoc: "Code of conduct",
  ndaAccepted: "NDA",
  acceptFee: "Fee schedule",
  acceptAhp: "AHP",
};

export function ComplianceWorkspace() {
  const { data, isLoading, error } = useComplianceOverview();
  const { data: missingConsent } = useConsentInventory({ missing: true, limit: 5 });

  const consentPct =
    data && data.consent.totalContributors > 0
      ? Math.round((data.consent.withConsent / data.consent.totalContributors) * 100)
      : 0;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Governance · Compliance
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Compliance
        </h1>
        <p className="mt-1.5 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Phase 1 baseline — consent inventory, data retention floors, and deletion request handling. Full ESG and evidence packs land in Phase 2.
        </p>
        <RecordLinks />
      </header>

      {error && (
        <div
          className="rounded-2xl border px-4 py-3 flex items-start gap-2.5 backdrop-blur"
          style={{ background: TONE.error.soft, borderColor: TONE.error.border }}
        >
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {error instanceof ComplianceApiError ? error.message : "Failed to load compliance overview"}
          </p>
        </div>
      )}

      {data && data.consent.missingConsent > 0 && (
        <ContextBanner tone="warning" title={`${data.consent.missingConsent} contributor${data.consent.missingConsent === 1 ? "" : "s"} missing required consent`}>
          <Link
            href="/enterprise/compliance/consent?missing=1"
            className="font-semibold text-warning-text underline underline-offset-2 hover:opacity-80"
          >
            Review consent inventory
          </Link>
        </ContextBanner>
      )}

      {data && data.deletionRequests.pending > 0 && (
        <ContextBanner tone="warning" title={`${data.deletionRequests.pending} deletion request${data.deletionRequests.pending === 1 ? "" : "s"} pending review`}>
          <Link
            href="/enterprise/audit?actionPrefix=user.delete"
            className="font-semibold text-warning-text underline underline-offset-2 hover:opacity-80"
          >
            Review in audit log
          </Link>
        </ContextBanner>
      )}

      <SectionCard
        title="Posture summary"
        description={isLoading ? "Loading tenant baseline…" : "Consent, retention, and erasure controls for this tenant"}
      >
        <dl className="px-5 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat
            label="Consent complete"
            value={isLoading || !data ? null : `${consentPct}%`}
            caption={
              data
                ? `${data.consent.withConsent} of ${data.consent.totalContributors} contributors`
                : undefined
            }
            highlight={Boolean(data && consentPct >= 95)}
          />
          <SummaryStat
            label="Missing required"
            value={isLoading || !data ? null : String(data.consent.missingConsent)}
            alert={Boolean(data && data.consent.missingConsent > 0)}
          />
          <SummaryStat
            label="Pending deletions"
            value={isLoading || !data ? null : String(data.deletionRequests.pending)}
            alert={Boolean(data && data.deletionRequests.pending > 0)}
          />
          <SummaryStat
            label="Completed (30d)"
            value={isLoading || !data ? null : String(data.deletionRequests.completedLast30Days)}
            caption="Deletion requests fulfilled"
          />
        </dl>
      </SectionCard>

      <section className={cn(GLASS_CARD, "overflow-hidden")} style={GLASS_SHADOW}>
        <div className="px-5 sm:px-6 pt-4 pb-4 border-b border-white/55">
          <h2 className="font-display text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Compliance controls
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Manage each baseline control — changes emit signed audit events.
          </p>
        </div>

        {isLoading || !data ? (
          <div className="divide-y divide-white/60">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-white/60">
            <ControlRow
              icon={Users}
              title="Consent inventory"
              href="/enterprise/compliance/consent"
              actionLabel="Manage"
              primary={`${data.consent.withConsent} with consent on file`}
              secondary={
                data.consent.missingConsent === 0
                  ? "All required consents captured · T&Cs, Privacy, CoC, NDA"
                  : `${data.consent.missingConsent} missing required · blocks task assignment`
              }
              tone={data.consent.missingConsent > 0 ? "warning" : "success"}
              progress={consentPct}
            />
            <ControlRow
              icon={Clock}
              title="Data retention"
              href="/enterprise/compliance/retention"
              actionLabel="Configure"
              primary="Platform retention floor in force"
              secondary={`Audit ${data.retention.auditEvents} · Evidence ${data.retention.taskEvidence} · Withdrawn ${data.retention.withdrawnSubmissions}`}
              tone="neutral"
            />
            <ControlRow
              icon={Trash2}
              title="Deletion requests"
              href="/enterprise/audit?actionPrefix=user.delete"
              actionLabel="Review"
              primary={`${data.deletionRequests.pending} pending`}
              secondary={`${data.deletionRequests.completedLast30Days} completed in the last 30 days · sourced from audit log`}
              tone={data.deletionRequests.pending > 0 ? "warning" : "neutral"}
            />
          </ul>
        )}
      </section>

      {missingConsent && missingConsent.rows.length > 0 && (
        <SectionCard
          title="Requires attention"
          description={`${missingConsent.missing} contributor${missingConsent.missing === 1 ? "" : "s"} with incomplete required consents`}
          action={
            <Link
              href="/enterprise/compliance/consent?missing=1"
              className="inline-flex items-center gap-1 font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast shrink-0"
            >
              View all missing
            </Link>
          }
        >
          <ul className="divide-y divide-white/60">
            {missingConsent.rows.map((row) => (
              <li key={row.contributorId}>
                <Link
                  href={`/enterprise/compliance/consent?missing=1&q=${encodeURIComponent(row.email)}`}
                  className={cn(
                    "flex items-center justify-between gap-4 px-5 sm:px-6 py-2.5 min-h-[44px]",
                    "hover:bg-white/50 transition-colors duration-fast",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="font-body text-[13px] font-medium text-foreground truncate block">
                      {row.name || row.email}
                    </span>
                    <span className="font-body text-[11px] text-text-tertiary truncate block mt-0.5">
                      Missing:{" "}
                      {row.missingRequired.map((k) => MISSING_LABEL[k] ?? k).join(", ")}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0" strokeWidth={2} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard title="Phase 2 roadmap" description="Planned for a later release">
        <ul className="px-5 sm:px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "ESG reporting", detail: "Environmental and social governance metrics" },
            { label: "PODL evidence", detail: "Proof-of-delivery lineage packs" },
            { label: "Evidence packs", detail: "Auditor-ready export bundles" },
          ].map((item) => (
            <li
              key={item.label}
              className="rounded-2xl border border-dashed border-white/60 bg-white/35 px-4 py-3"
            >
              <p className="font-body text-[13px] font-semibold text-text-secondary">{item.label}</p>
              <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{item.detail}</p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function ControlRow({
  icon: Icon,
  title,
  href,
  actionLabel,
  primary,
  secondary,
  tone,
  progress,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  href: string;
  actionLabel: string;
  primary: string;
  secondary: string;
  tone: "success" | "warning" | "neutral";
  progress?: number;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-start gap-4 px-5 sm:px-6 py-4 min-h-[72px]",
          "hover:bg-white/50 transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus",
        )}
      >
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border backdrop-blur"
          style={{
            background: tone === "neutral" ? "rgba(255,255,255,0.5)" : TONE[tone].soft,
            borderColor: tone === "neutral" ? "rgba(255,255,255,0.7)" : TONE[tone].border,
            color: TONE[tone].text,
          }}
        >
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-body text-[14px] font-semibold text-foreground">{title}</span>
            <span className="inline-flex items-center gap-1 font-body text-[11.5px] font-semibold text-text-secondary">
              {actionLabel}
              <ArrowRight className="h-3 w-3" strokeWidth={2} aria-hidden />
            </span>
          </span>
          <span className="font-body text-[13px] font-medium text-foreground block mt-1">{primary}</span>
          <span className="font-body text-[12px] text-text-secondary block mt-0.5 leading-snug">{secondary}</span>
          {progress !== undefined && (
            <span className="mt-2.5 block max-w-xs">
              <span className="flex items-center justify-between font-body text-[10.5px] text-text-tertiary mb-1">
                <span>Completion</span>
                <span className="font-mono tabular-nums">{progress}%</span>
              </span>
              <span className="block h-1.5 rounded-full bg-foreground/[0.08] overflow-hidden">
                <span
                  className="block h-full rounded-full transition-all duration-fast"
                  style={{
                    width: `${Math.min(100, progress)}%`,
                    background:
                      progress >= 95
                        ? "var(--color-success-solid)"
                        : progress >= 80
                          ? "var(--color-warning-solid)"
                          : "var(--color-error-solid)",
                  }}
                />
              </span>
            </span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 text-text-tertiary shrink-0 mt-1" strokeWidth={2} aria-hidden />
      </Link>
    </li>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/audit"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Audit log
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/settings/policies"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Governance policies
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href="/enterprise/audit/export"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Export audit
      </Link>
    </p>
  );
}

function SummaryStat({
  label,
  value,
  caption,
  highlight,
  alert,
}: {
  label: string;
  value: string | null;
  caption?: string;
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
          "mt-1 font-display text-[20px] font-semibold tabular-nums tracking-tight",
          alert ? "text-error-text" : "text-foreground",
        )}
        style={highlight && !alert ? ACCENT_TEXT : undefined}
      >
        {value === null ? <Skeleton className="h-6 w-16 rounded inline-block" /> : value}
      </dd>
      {caption && (
        <dd className="mt-0.5 font-body text-[11px] text-text-tertiary">{caption}</dd>
      )}
    </div>
  );
}

function ContextBanner({
  tone,
  title,
  children,
}: {
  tone: "warning";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-3 backdrop-blur"
      style={{ background: TONE.warning.soft, borderColor: TONE.warning.border }}
    >
      <p className="font-body text-[13px] font-semibold flex items-center gap-1.5 text-foreground">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} style={{ color: TONE.warning.text }} aria-hidden />
        {title}
      </p>
      <p className="mt-1 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
    </div>
  );
}
