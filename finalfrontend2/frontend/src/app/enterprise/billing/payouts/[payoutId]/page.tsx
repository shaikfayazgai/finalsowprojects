"use client";

/**
 * Payout detail — single-column record view.
 */

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, AlertCircle, AlertTriangle } from "lucide-react";
import { useTenantPayouts } from "@/lib/hooks/use-enterprise-billing";
import { PayoutDetailSkeleton } from "@/components/enterprise/page-skeletons";
import {
  ComputationSection,
  fmtINRMinor,
  formatContributor,
  LedgerSection,
  LineageSection,
  PayoutFactsSection,
  statusLabel,
  statusTone,
} from "./components/detail-sections";
import { SectionCard, Chip } from "@/app/admin/_shell/aurora-ui";
import { cn } from "@/lib/utils/cn";

export default function PayoutDetailPage() {
  const params = useParams<{ payoutId: string }>();
  const payoutId = params?.payoutId ?? "";

  const { data, isLoading, error } = useTenantPayouts({});
  const payout = (data?.items ?? []).find((p) => p.id === payoutId);

  if (isLoading) {
    return <PayoutDetailSkeleton />;
  }

  if (error || !payout) {
    return (
      <div className="space-y-5 pb-12 animate-fade-in">
        <BackLink />
        <div className="rounded-2xl border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5 backdrop-blur">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">
            {error instanceof Error ? error.message : "Payout not found"}
            {payoutId ? (
              <span className="block mt-1 font-mono text-[11px] opacity-80">{payoutId}</span>
            ) : null}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <BackLink />

      <header>
        <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.14em] text-text-tertiary mb-1.5">
          Finance · Payout · {payout.id}
        </p>
        <h1 className="font-display text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight tabular-nums">
          {fmtINRMinor(payout.amountMinor, payout.currency)}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-[12px] text-text-tertiary">
          <Chip tone={statusTone(payout.status)} className="capitalize">
            {statusLabel(payout.status)}
          </Chip>
          <span aria-hidden>·</span>
          <span>
            Contributor{" "}
            <span className="font-medium text-text-secondary">
              {formatContributor(payout.contributorId)}
            </span>
          </span>
          <span aria-hidden>·</span>
          <span className="font-mono tabular-nums">{payout.taskDefinitionId}</span>
        </div>
        <RecordLinks payoutId={payout.id} submissionId={payout.submissionId} />
      </header>

      {payout.status === "eligible" && (
        <ContextBanner tone="brand" title="Ready for batch release">
          This payout is eligible — it will move when you release the pending batch from the payouts
          ledger.
        </ContextBanner>
      )}

      {(payout.status === "requested" || payout.status === "processing") && (
        <ContextBanner tone="neutral" title="Payout in flight">
          Funds are being processed. The ledger trail below updates as each stage completes.
        </ContextBanner>
      )}

      {payout.status === "sent" && (
        <ContextBanner tone="neutral" title="Funds sent">
          This payout completed successfully
          {payout.externalRef ? (
            <>
              {" "}
              — reference{" "}
              <span className="font-mono tabular-nums">{payout.externalRef}</span>
            </>
          ) : (
            "."
          )}
        </ContextBanner>
      )}

      {payout.status === "on_hold" && (
        <ContextBanner tone="error" title="Payout on hold">
          Compliance or KYC review is blocking release. Resolve the hold before batch release.
        </ContextBanner>
      )}

      {payout.status === "failed" && (
        <ContextBanner tone="error" title="Payout failed">
          {payout.failureReason ?? "Transfer failed — contributor may need to update payout method."}
        </ContextBanner>
      )}

      <SectionCard
        title="Ledger trail"
        description="Eligible → requested → processing → sent"
      >
        <div className="px-5 py-5">
          <LedgerSection payout={payout} />
        </div>
      </SectionCard>

      <SectionCard
        title="Amount breakdown"
        description={`${payout.computation.hoursBilled}h billed at platform rate`}
      >
        <div className="px-5 sm:px-6 py-5">
          <ComputationSection payout={payout} />
        </div>
      </SectionCard>

      <SectionCard title="Payout details" description="Identifiers and routing">
        <div className="px-5 sm:px-6 py-5">
          <PayoutFactsSection payout={payout} />
        </div>
      </SectionCard>

      <SectionCard title="Lineage" description="Upstream delivery record">
        <div className="px-5 py-5">
          <LineageSection payout={payout} />
        </div>
      </SectionCard>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/enterprise/billing/payouts"
      className="inline-flex items-center gap-1 font-body text-[12px] font-medium text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stroke-focus rounded-sm"
    >
      <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
      Back to payouts
    </Link>
  );
}

function RecordLinks({
  payoutId,
  submissionId,
}: {
  payoutId: string;
  submissionId: string;
}) {
  const auditHref = `/enterprise/audit?resourceType=payout&resourceId=${encodeURIComponent(payoutId)}`;

  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-body text-[12px]">
      <Link
        href="/enterprise/billing"
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Billing overview
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
      <Link
        href={`/enterprise/review/${submissionId}`}
        className="text-text-secondary hover:text-foreground underline-offset-2 hover:underline transition-colors duration-fast"
      >
        Acceptance record
      </Link>
      <span aria-hidden className="text-text-disabled">
        ·
      </span>
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
  tone: "error" | "brand" | "neutral";
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 backdrop-blur",
        tone === "error"
          ? "border-error-border bg-error-subtle"
          : tone === "brand"
            ? "border-ai-border bg-ai-surface"
            : "border-white/55 bg-white/45",
      )}
    >
      <p
        className={cn(
          "font-body text-[13px] font-semibold flex items-center gap-1.5",
          tone === "error" ? "text-error-text" : "text-foreground",
        )}
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
