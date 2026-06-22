"use client";

/**
 * Compliance overview — dashboard posture.
 *   Use-case: operator checks "are we compliant?" at a glance.
 *   Layout: KPI strip (consent % · missing · pending deletions · fulfilled) →
 *           alert banners → DASH_CARD controls registry → attention table.
 *
 *   De-glassed: DASH_CARD, GLASS_GRADIENT tabs, solid inputs, no backdrop-blur.
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  Clock,
  Shield,
  Trash2,
  Users,
} from "lucide-react";
import { useComplianceOverview } from "@/lib/hooks/use-enterprise-compliance";
import { useConsentInventory } from "@/lib/hooks/use-enterprise-consent";
import { ComplianceApiError } from "@/lib/api/enterprise-compliance";
import { Skeleton } from "@/components/meridian";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD, GLASS_GRADIENT } from "@/app/admin/_shell/aurora";
import { Chip, StatCard, TONE } from "@/app/admin/_shell/aurora-ui";

const MISSING_LABEL: Record<string, string> = {
  acceptTos: "T&Cs",
  acceptPrivacy: "Privacy",
  acceptCoc: "Code of conduct",
  ndaAccepted: "NDA",
  acceptFee: "Fee schedule",
  acceptAhp: "AHP",
};

type ControlTone = "success" | "warning" | "neutral";

export function ComplianceWorkspace() {
  const { data, isLoading, error } = useComplianceOverview();
  const { data: missingConsent } = useConsentInventory({ missing: true, limit: 5 });

  const consentPct =
    data && data.consent.totalContributors > 0
      ? Math.round((data.consent.withConsent / data.consent.totalContributors) * 100)
      : 0;

  const consentTone: ControlTone =
    data && data.consent.missingConsent > 0 ? "warning" : "success";
  const deletionTone: ControlTone =
    data && data.deletionRequests.pending > 0 ? "warning" : "neutral";

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      {/* Page header */}
      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Enterprise · Governance · Compliance
        </p>
        <h1 className="font-display text-[24px] font-bold text-foreground tracking-[-0.025em] leading-none">
          Compliance
        </h1>
        <p className="mt-2 font-body text-[12.5px] text-text-tertiary max-w-2xl">
          Phase 1 baseline — consent inventory, data retention floors, and deletion request handling.
        </p>
        <RecordLinks />
      </header>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {error instanceof ComplianceApiError ? error.message : "Failed to load compliance overview"}
          </p>
        </div>
      )}

      {/* Warning banners */}
      {data && data.consent.missingConsent > 0 && (
        <ContextBanner
          title={`${data.consent.missingConsent} contributor${data.consent.missingConsent === 1 ? "" : "s"} missing required consent`}
        >
          <Link
            href="/enterprise/compliance/consent?missing=1"
            className="font-semibold text-warning-text underline underline-offset-2 hover:opacity-80"
          >
            Review consent inventory
          </Link>
        </ContextBanner>
      )}

      {data && data.deletionRequests.pending > 0 && (
        <ContextBanner
          title={`${data.deletionRequests.pending} deletion request${data.deletionRequests.pending === 1 ? "" : "s"} pending review`}
        >
          <Link
            href="/enterprise/audit?actionPrefix=user.delete"
            className="font-semibold text-warning-text underline underline-offset-2 hover:opacity-80"
          >
            Review in audit log
          </Link>
        </ContextBanner>
      )}

      {/* KPI strip */}
      <section aria-label="Compliance posture" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Consent complete"
          value={isLoading || !data ? "—" : `${consentPct}%`}
          icon={Users}
          hint={data ? `${data.consent.withConsent} of ${data.consent.totalContributors}` : undefined}
          hintTone={data && consentPct >= 95 ? "success" : "neutral"}
        />
        <StatCard
          label="Missing required"
          value={isLoading || !data ? "—" : String(data.consent.missingConsent)}
          icon={AlertTriangle}
          hint={data && data.consent.missingConsent > 0 ? "blocks task assignment" : undefined}
          hintTone={data && data.consent.missingConsent > 0 ? "error" : "neutral"}
        />
        <StatCard
          label="Pending deletions"
          value={isLoading || !data ? "—" : String(data.deletionRequests.pending)}
          icon={Trash2}
          hint={data && data.deletionRequests.pending > 0 ? "awaiting review" : undefined}
          hintTone={data && data.deletionRequests.pending > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Fulfilled (30d)"
          value={isLoading || !data ? "—" : String(data.deletionRequests.completedLast30Days)}
          icon={Shield}
          hint="deletion requests completed"
        />
      </section>

      {/* Controls registry */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">
            Compliance controls
          </h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
            Manage each baseline control — changes emit signed audit events.
          </p>
        </div>

        {isLoading || !data ? (
          <div className="divide-y divide-stroke-subtle">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-5 sm:px-6 py-4 flex items-center gap-4">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-40 mb-1.5" />
                  <Skeleton className="h-3.5 w-72" />
                </div>
                <Skeleton className="h-[22px] w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-stroke-subtle">
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
              tone={consentTone}
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
              tone={deletionTone}
            />
          </ul>
        )}
      </div>

      {/* Attention table — contributors missing consent */}
      {missingConsent && missingConsent.rows.length > 0 && (
        <div className={cn(DASH_CARD, "overflow-hidden")}>
          <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">
                Requires attention
              </h2>
              <p className="mt-0.5 font-body text-[12px] text-text-tertiary">
                {missingConsent.missing} contributor{missingConsent.missing === 1 ? "" : "s"} with incomplete required consents
              </p>
            </div>
            <Link
              href="/enterprise/compliance/consent?missing=1"
              className="font-body text-[12.5px] font-semibold text-text-secondary hover:text-foreground transition-colors duration-fast shrink-0"
            >
              View all missing
            </Link>
          </div>

          <ul className="divide-y divide-stroke-subtle">
            {missingConsent.rows.map((row) => (
              <li key={row.contributorId}>
                <Link
                  href={`/enterprise/compliance/consent?missing=1&q=${encodeURIComponent(row.email)}`}
                  className="flex items-center justify-between gap-4 px-5 sm:px-6 py-3 min-h-[52px] hover:bg-bg-subtle/60 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus"
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
        </div>
      )}

      {/* Phase 2 roadmap */}
      <div className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
          <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">Phase 2 roadmap</h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Planned for a later release</p>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-stroke-subtle">
          {[
            { label: "ESG reporting", detail: "Environmental and social governance metrics" },
            { label: "PODL evidence", detail: "Proof-of-delivery lineage packs" },
            { label: "Evidence packs", detail: "Auditor-ready export bundles" },
          ].map((item) => (
            <li key={item.label} className="px-5 sm:px-6 py-4">
              <p className="font-body text-[13px] font-semibold text-text-secondary">{item.label}</p>
              <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── helpers ─── */

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
  tone: ControlTone;
  progress?: number;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-start gap-4 px-5 sm:px-6 py-4 min-h-[72px] hover:bg-bg-subtle/60 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stroke-focus"
      >
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
          style={{
            background: tone === "neutral" ? "var(--color-bg-subtle)" : TONE[tone].soft,
            borderColor: tone === "neutral" ? "var(--color-stroke-subtle)" : TONE[tone].border,
            color: TONE[tone].text,
          }}
        >
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-body text-[13.5px] font-semibold text-foreground">{title}</span>
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

        <ChevronRight
          className="h-4 w-4 text-text-disabled opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
          strokeWidth={2}
          aria-hidden
        />
      </Link>
    </li>
  );
}

function RecordLinks() {
  return (
    <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/audit"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Audit log
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/enterprise/settings/policies"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Governance policies
      </Link>
      <span aria-hidden className="text-text-disabled">·</span>
      <Link
        href="/enterprise/audit/export"
        className="font-semibold text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Export audit
      </Link>
    </p>
  );
}

function ContextBanner({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border px-4 py-3 flex items-start gap-3"
      style={{ background: TONE.warning.soft, borderColor: TONE.warning.border }}
    >
      <AlertTriangle
        className="h-4 w-4 shrink-0 mt-0.5"
        strokeWidth={2}
        style={{ color: TONE.warning.text }}
        aria-hidden
      />
      <div className="flex-1 min-w-0">
        <p className="font-body text-[13px] font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 font-body text-[12.5px] text-text-secondary leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
