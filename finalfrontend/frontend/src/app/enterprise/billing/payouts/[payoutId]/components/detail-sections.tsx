"use client";

import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import type { PayoutDetail, PayoutStatus } from "@/lib/payouts/types";
import { type Tone } from "@/app/admin/_shell/aurora-ui";
import { cn } from "@/lib/utils/cn";

export function formatContributor(id: string): string {
  const slug = id.replace(/^u-/, "");
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function fmtINRMinor(minor: number, currency: string): string {
  const symbol =
    currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function statusLabel(status: PayoutStatus): string {
  return status.replace(/_/g, " ");
}

export function statusTone(status: PayoutStatus): Tone {
  switch (status) {
    case "sent":
      return "success";
    case "failed":
    case "on_hold":
      return "error";
    case "requested":
    case "processing":
      return "warning";
    case "eligible":
    default:
      return "ai";
  }
}

export function LedgerSection({ payout }: { payout: PayoutDetail }) {
  const steps: Array<{
    key: string;
    label: string;
    at: string | null;
    tone?: "success" | "warning" | "error" | "muted";
  }> = [
    { key: "eligible", label: "Eligible", at: payout.eligibleAt, tone: "success" },
    { key: "requested", label: "Requested", at: payout.requestedAt },
    { key: "processing", label: "Processing", at: payout.processingAt },
    { key: "sent", label: "Sent", at: payout.sentAt, tone: payout.sentAt ? "success" : undefined },
  ];

  if (payout.onHoldAt) {
    steps.push({
      key: "on_hold",
      label: "On hold",
      at: payout.onHoldAt,
      tone: "warning",
    });
  }
  if (payout.failedAt) {
    steps.push({
      key: "failed",
      label: "Failed",
      at: payout.failedAt,
      tone: "error",
    });
  }

  return (
    <>
      <ol className="divide-y divide-white/60 -mx-5">
        {steps.map((step) => {
          const done = !!step.at;
          const Icon = done ? CheckCircle2 : Circle;
          const iconCls =
            step.tone === "error"
              ? "text-error-text"
              : step.tone === "warning"
                ? "text-warning-text"
                : done
                  ? "text-success-text"
                  : "text-text-disabled";

          return (
            <li
              key={step.key}
              className="px-5 py-2.5 min-h-[44px] flex items-center gap-3"
            >
              <Icon className={cn("h-4 w-4 shrink-0", iconCls)} strokeWidth={2} aria-hidden />
              <span className="font-body text-[13px] font-medium text-foreground flex-1 min-w-0">
                {step.label}
              </span>
              <span className="font-mono text-[11px] text-text-tertiary tabular-nums shrink-0">
                {step.at ? fmtDateTime(step.at) : "Pending"}
              </span>
            </li>
          );
        })}
      </ol>
      {payout.failureReason && (
        <p className="mt-3 font-body text-[12.5px] text-error-text -mx-5 px-5">
          {payout.failureReason}
        </p>
      )}
      {payout.externalRef && (
        <p className="mt-2 font-body text-[12px] text-text-secondary -mx-5 px-5">
          External reference:{" "}
          <span className="font-mono tabular-nums">{payout.externalRef}</span>
        </p>
      )}
    </>
  );
}

export function ComputationSection({ payout }: { payout: PayoutDetail }) {
  const c = payout.computation;

  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      <Fact label="Hours billed" value={String(c.hoursBilled)} mono />
      <Fact
        label="Rate per hour"
        value={fmtINRMinor(c.ratePerHour * c.minorMultiplier, c.currency)}
        mono
      />
      <Fact label="Currency" value={c.currency} mono />
      <Fact
        label="Payout amount"
        value={fmtINRMinor(c.amountMinor, c.currency)}
        mono
        emphasized
      />
      {c.notes ? (
        <div className="sm:col-span-2">
          <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
            Notes
          </dt>
          <dd className="mt-1 font-body text-[13px] text-text-secondary leading-relaxed">
            {c.notes}
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

export function PayoutFactsSection({ payout }: { payout: PayoutDetail }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
      <Fact label="Payout ID" value={payout.id} mono />
      <Fact label="Contributor" value={formatContributor(payout.contributorId)} />
      <Fact label="Contributor ID" value={payout.contributorId} mono />
      <Fact label="Task ID" value={payout.taskDefinitionId} mono />
      <Fact label="Submission ID" value={payout.submissionId} mono />
      <Fact label="Tenant" value={payout.tenantId} mono />
      <Fact
        label="Payout method"
        value={payout.payoutMethodId ?? "Not assigned"}
        mono
      />
      <Fact
        label="Last updated"
        value={fmtDateTime(payout.updatedAt)}
      />
    </dl>
  );
}

export function LineageSection({ payout }: { payout: PayoutDetail }) {
  const auditHref = `/enterprise/audit?resourceType=payout&resourceId=${encodeURIComponent(payout.id)}`;

  return (
    <>
      <ol className="divide-y divide-white/60 -mx-5">
        <LineageRow
          stage="Submission"
          label={payout.submissionId}
          href={`/enterprise/review/${payout.submissionId}`}
        />
        <LineageRow stage="Task" label={payout.taskDefinitionId} />
        <LineageRow stage="Contributor" label={formatContributor(payout.contributorId)} />
      </ol>
      <p className="mt-3 font-body text-[12px] -mx-5 px-5">
        <Link
          href={auditHref}
          className="text-text-secondary font-medium hover:text-foreground hover:underline underline-offset-2 transition-colors duration-fast"
        >
          Audit trail for this payout
        </Link>
      </p>
    </>
  );
}

function LineageRow({
  stage,
  label,
  href,
}: {
  stage: string;
  label: string;
  href?: string;
}) {
  return (
    <li className="px-5 py-2.5 min-h-[44px] flex items-center justify-between gap-3">
      <span className="min-w-0">
        <span className="font-body text-[10px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
          {stage}
        </span>
        {href ? (
          <Link
            href={href}
            className="block font-body text-[13px] font-medium text-foreground hover:text-text-secondary truncate transition-colors duration-fast"
          >
            {label}
          </Link>
        ) : (
          <span className="block font-body text-[13px] font-medium text-foreground truncate">
            {label}
          </span>
        )}
      </span>
    </li>
  );
}

function Fact({
  label,
  value,
  mono,
  emphasized,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasized?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-body text-[13px] text-foreground",
          mono && "font-mono text-[12.5px] tabular-nums",
          emphasized && "text-[18px] font-semibold",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
