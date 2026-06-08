"use client";

/**
 * Payout methods — enterprise settings view (matches Earnings workspace pattern).
 */

import * as React from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CreditCard,
  Landmark,
  Plus,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react";
import { DashboardSection } from "@/components/meridian/dashboard";
import { Skeleton, StatusChip } from "@/components/meridian";
import {
  useDeletePayoutMethod,
  useMyPayoutMethods,
  useSetDefaultMethod,
} from "@/lib/hooks/use-contributor-payouts";
import type { PayoutMethodDetail, PayoutMethodKind } from "@/lib/payouts/types";
import { cn } from "@/lib/utils/cn";
import {
  fmtVerifiedDate,
  methodDisplayName,
  methodKindLabel,
  methodMetaLine,
  methodVerificationChip,
  methodVerificationLabel,
} from "../lib/payout-method-ui-utils";

export function PayoutMethodView() {
  const { data, isLoading, error, refetch } = useMyPayoutMethods();
  const methods = data?.items ?? [];
  const loading = isLoading && methods.length === 0;

  const sorted = React.useMemo(
    () =>
      [...methods].sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }),
    [methods],
  );

  const stats = React.useMemo(() => {
    const verified = methods.filter((m) => m.verifiedAt).length;
    const pending = methods.filter((m) => !m.verifiedAt && !m.verificationError).length;
    const failed = methods.filter((m) => m.verificationError).length;
    const defaultMethod = methods.find((m) => m.isDefault) ?? methods[0];
    return {
      total: methods.length,
      verified,
      pending,
      failed,
      defaultLabel: defaultMethod ? methodDisplayName(defaultMethod) : "None set",
      ready: verified > 0,
    };
  }, [methods]);

  if (loading) {
    return (
      <div className="space-y-4 pb-12">
        <SummarySkeleton />
        <PanelSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {error ? (
        <ErrorPanel message={(error as Error).message} onRetry={() => void refetch()} />
      ) : null}

      <DashboardSection
        title="Payout setup"
        description="Your default method receives all withdrawal transfers"
        actions={
          <Link
            href="/contributor/earnings/payout-method/new"
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-3 rounded-md",
              "bg-brand text-on-brand shadow-xs",
              "font-body text-[12px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
            )}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Add method
          </Link>
        }
      >
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-4">
          <SummaryStat label="Methods" value={String(stats.total)} highlight={stats.total > 0} />
          <SummaryStat
            label="Default"
            value={stats.defaultLabel}
            highlight={stats.total > 0}
            compact
          />
          <SummaryStat
            label="Verified"
            value={String(stats.verified)}
            highlight={stats.verified > 0}
          />
          <SummaryStat
            label="Status"
            value={stats.ready ? "Ready" : stats.pending > 0 ? "Pending" : "Not set up"}
            highlight={stats.ready}
          />
        </dl>

        {stats.failed > 0 ? (
          <p className="mt-4 pt-4 border-t border-stroke-subtle font-body text-[11.5px] text-error-text">
            {stats.failed} method{stats.failed === 1 ? "" : "s"} failed verification — update details
            or remove and add again.
          </p>
        ) : stats.pending > 0 ? (
          <p className="mt-4 pt-4 border-t border-stroke-subtle font-body text-[11.5px] text-text-secondary">
            {stats.pending} method{stats.pending === 1 ? "" : "s"} awaiting penny-drop verification.
          </p>
        ) : stats.total === 0 ? (
          <p className="mt-4 pt-4 border-t border-stroke-subtle font-body text-[11.5px] text-text-secondary">
            Add a bank account or UPI ID before your first withdrawal from Earnings.
          </p>
        ) : null}
      </DashboardSection>

      <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
        <div className="px-5 py-4 border-b border-stroke-subtle">
          <h2 className="font-body text-[15.5px] font-semibold text-foreground tracking-[-0.01em]">
            Your methods
          </h2>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            {sorted.length === 0
              ? "No payout methods yet"
              : `${sorted.length} saved · default used for withdrawals`}
          </p>
        </div>

        {sorted.length === 0 ? (
          <EmptyState />
        ) : (
          <ul role="list" className="divide-y divide-stroke-subtle">
            {sorted.map((method) => (
              <MethodRow key={method.id} method={method} canRemove={sorted.length > 1} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MethodRow({ method, canRemove }: { method: PayoutMethodDetail; canRemove: boolean }) {
  const setDefault = useSetDefaultMethod();
  const removeMethod = useDeletePayoutMethod();
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [actionMsg, setActionMsg] = React.useState<string | null>(null);
  const [actionErr, setActionErr] = React.useState<string | null>(null);

  const busy = setDefault.isPending || removeMethod.isPending || verifying;

  const onVerifyAgain = async () => {
    setActionErr(null);
    setActionMsg(null);
    setVerifying(true);
    await new Promise((r) => setTimeout(r, 800));
    setVerifying(false);
    setActionMsg("Penny verification initiated — usually completes within a few minutes.");
  };

  const onSetPrimary = async () => {
    setActionErr(null);
    setActionMsg(null);
    try {
      await setDefault.mutateAsync(method.id);
      setActionMsg(`${methodDisplayName(method)} is now your default payout method.`);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Could not update default method.");
    }
  };

  const onRemove = async () => {
    setActionErr(null);
    setActionMsg(null);
    try {
      await removeMethod.mutateAsync(method.id);
      setConfirmRemove(false);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : "Could not remove method.");
    }
  };

  const Icon = kindIcon(method.kind);
  const needsAttention = !!method.verificationError || (!method.verifiedAt && !verifying);

  return (
    <li>
      <div
        className={cn(
          "px-5 py-4",
          needsAttention && "bg-warning-subtle/25",
          method.isDefault && "bg-brand-subtle/20",
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <span
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                method.isDefault
                  ? "border-brand/25 bg-brand-subtle text-brand-subtle-text"
                  : "border-stroke-subtle bg-bg-subtle text-text-secondary",
              )}
              aria-hidden
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-body text-[13.5px] font-semibold text-foreground truncate">
                  {methodDisplayName(method)}
                </p>
                {method.isDefault ? (
                  <StatusChip status="info" size="sm">
                    Default
                  </StatusChip>
                ) : null}
                <StatusChip status={methodVerificationChip(method)} size="sm">
                  {methodVerificationLabel(method)}
                </StatusChip>
              </div>
              <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary truncate">
                {methodMetaLine(method)}
              </p>
              {method.verifiedAt ? (
                <p className="mt-1 inline-flex items-center gap-1 font-body text-[11px] text-success-text">
                  <ShieldCheck className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
                  Verified {fmtVerifiedDate(method.verifiedAt)} · India · INR
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!method.isDefault ? (
              <button
                type="button"
                disabled={busy || !method.verifiedAt}
                onClick={() => void onSetPrimary()}
                className="h-8 px-3 rounded-md font-body text-[12px] font-semibold text-text-link hover:bg-bg-subtle disabled:text-text-disabled disabled:hover:bg-transparent transition-colors duration-fast"
              >
                Set as default
              </button>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void onVerifyAgain()}
              className={cn(
                "inline-flex items-center h-8 px-3 rounded-md border border-stroke bg-surface",
                "font-body text-[12px] font-semibold text-foreground",
                "hover:bg-surface-hover transition-colors duration-fast",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            >
              {verifying ? "Verifying…" : "Verify again"}
            </button>
            {canRemove ? (
              confirmRemove ? (
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onRemove()}
                    className="h-8 px-3 rounded-md bg-error-subtle border border-error-border font-body text-[12px] font-semibold text-error-text hover:bg-error-subtle/80 disabled:opacity-60"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmRemove(false)}
                    className="h-8 px-3 rounded-md font-body text-[12px] font-semibold text-text-secondary hover:bg-bg-subtle"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy || method.isDefault}
                  onClick={() => setConfirmRemove(true)}
                  className="h-8 px-3 rounded-md font-body text-[12px] font-semibold text-error-text hover:bg-bg-subtle disabled:text-text-disabled disabled:hover:bg-transparent transition-colors duration-fast"
                  title={method.isDefault ? "Set another method as default before removing" : undefined}
                >
                  Remove
                </button>
              )
            ) : null}
          </div>
        </div>

        {actionMsg ? (
          <p className="mt-3 rounded-md border border-success-border bg-success-subtle px-3 py-2 font-body text-[11.5px] text-success-text">
            {actionMsg}
          </p>
        ) : null}
        {actionErr ? (
          <p className="mt-3 rounded-md border border-error-border bg-error-subtle px-3 py-2 font-body text-[11.5px] text-error-text">
            {actionErr}
          </p>
        ) : null}
      </div>
    </li>
  );
}

function kindIcon(kind: PayoutMethodKind) {
  switch (kind) {
    case "bank_in":
      return Landmark;
    case "upi":
      return Smartphone;
    case "paypal":
      return Wallet;
    case "razorpay_x":
      return Building2;
    default:
      return CreditCard;
  }
}

function EmptyState() {
  return (
    <div className="px-5 py-12 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-stroke-subtle bg-bg-subtle text-text-tertiary mb-3">
        <CreditCard className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <p className="font-body text-[13px] font-semibold text-foreground">No payout method yet</p>
      <p className="mt-1 font-body text-[12px] text-text-tertiary max-w-sm mx-auto">
        Add a verified bank account or UPI ID to receive milestone pay when you withdraw from
        Earnings.
      </p>
      <Link
        href="/contributor/earnings/payout-method/new"
        className={cn(
          "mt-4 inline-flex items-center gap-1.5 h-9 px-4 rounded-md shadow-xs",
          "bg-brand text-on-brand font-body text-[13px] font-semibold",
          "hover:bg-brand-hover transition-colors duration-fast",
        )}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        Add payout method
      </Link>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
  compact,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 font-semibold tracking-[-0.02em] truncate",
          compact ? "font-body text-[14px]" : "font-body text-[20px] tabular-nums",
          highlight ? "text-foreground" : "text-text-secondary",
        )}
        title={compact ? value : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex flex-wrap items-center gap-3">
      <AlertCircle className="h-4 w-4 text-error-text shrink-0" strokeWidth={2} aria-hidden />
      <p className="font-body text-[12.5px] text-error-text flex-1">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="h-8 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover"
      >
        Retry
      </button>
    </div>
  );
}

function SummarySkeleton() {
  return (
    <div className="rounded-xl border border-stroke-subtle bg-surface p-5">
      <Skeleton className="h-4 w-28 rounded mb-1" />
      <Skeleton className="h-3 w-56 rounded mb-5" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <section className="rounded-xl border border-stroke-subtle bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-stroke-subtle space-y-2">
        <Skeleton className="h-4 w-24 rounded" />
        <Skeleton className="h-3 w-40 rounded" />
      </div>
      <div className="p-5 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </section>
  );
}
