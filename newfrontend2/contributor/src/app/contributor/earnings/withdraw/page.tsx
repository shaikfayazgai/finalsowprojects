"use client";

/**
 * Withdraw request — uses demo/real payout APIs (milestone-pay overlay).
 */

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { useMyPayoutMethods, useMyPayouts, useRequestWithdrawal } from "@/lib/hooks/use-contributor-payouts";
import { earningsSummaryFromPayouts } from "@/lib/enterprise/mocks/demo-payout-bridge";
import { cn } from "@/lib/utils/cn";

const MIN_MINOR = 50000;
const FEE_MINOR = 1000;

function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

export default function WithdrawRequestPage() {
  const router = useRouter();
  const { data: payoutsData, isLoading } = useMyPayouts();
  const { data: methodsData } = useMyPayoutMethods();

  const items = payoutsData?.items ?? [];
  const summary = earningsSummaryFromPayouts(items);
  const methods = methodsData?.items ?? [];
  const method = methods.find((m) => m.isDefault) ?? methods[0];
  const eligible = items.filter((p) => p.status === "eligible");
  const firstEligible = eligible[0];

  const [amountRupees, setAmountRupees] = React.useState("0");
  const [submitting, setSubmitting] = React.useState(false);
  const [loadErr, setLoadErr] = React.useState<string | null>(null);

  const safeBalance = summary.withdrawableMinor;
  React.useEffect(() => {
    if (safeBalance > 0) {
      setAmountRupees(String(Math.floor(safeBalance / 100)));
    }
  }, [safeBalance]);

  const withdraw = useRequestWithdrawal(firstEligible?.id ?? "—");

  const amountMinor = Math.max(0, Math.floor((parseFloat(amountRupees || "0") || 0) * 100));
  const tooLow = amountMinor > 0 && amountMinor < MIN_MINOR;
  const tooHigh = amountMinor > safeBalance;
  const valid = !!method && !!firstEligible && amountMinor >= MIN_MINOR && amountMinor <= safeBalance;

  const total = Math.max(0, amountMinor - FEE_MINOR);

  const onSubmit = async () => {
    if (!valid || !firstEligible) return;
    setSubmitting(true);
    setLoadErr(null);
    try {
      await withdraw.mutateAsync(method?.id);
      const ref = `WD-${Date.now().toString().slice(-8)}`;
      router.push(`/contributor/earnings/withdraw/success?ref=${ref}&amount=${amountMinor}`);
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : "Withdrawal failed");
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-10 font-body text-[13px] text-text-secondary">Loading withdraw…</div>
    );
  }

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <header>
        <h1 className="font-body text-[22px] font-semibold text-foreground tracking-[-0.015em] leading-tight">
          Withdraw
        </h1>
        <p className="mt-1 font-body text-[12px] text-text-secondary">
          Hourly payout from accepted milestone work · {eligible.length} eligible line{eligible.length === 1 ? "" : "s"}
        </p>
      </header>

      {loadErr && (
        <div className="rounded-lg border border-error-border bg-error-subtle px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-error-text shrink-0 mt-0.5" strokeWidth={2} aria-hidden />
          <p className="font-body text-[12.5px] text-error-text flex-1">{loadErr}</p>
        </div>
      )}

      {!firstEligible && (
        <div className="rounded-lg border border-stroke bg-surface px-4 py-6 text-center">
          <p className="font-body text-[13px] text-text-secondary">No eligible balance to withdraw yet.</p>
        </div>
      )}

      {firstEligible && (
        <section className="rounded-lg border border-stroke bg-surface shadow-xs">
          <div className="px-4 py-4 space-y-4">
            <div>
              <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">Available</p>
              <p className="mt-0.5 font-display text-[22px] font-semibold text-foreground tabular-nums leading-none">{fmtINR(safeBalance)}</p>
            </div>

            <div>
              <label className="block font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1">Amount (₹)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={amountRupees}
                  onChange={(e) => setAmountRupees(e.target.value)}
                  min={0}
                  max={Math.floor(safeBalance / 100)}
                  className="w-40 h-9 px-3 rounded-md bg-surface border border-stroke font-mono text-[14px] text-foreground tabular-nums focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/25"
                />
                <button
                  type="button"
                  onClick={() => setAmountRupees(String(Math.floor(safeBalance / 100)))}
                  className="inline-flex items-center h-9 px-3 rounded-md bg-surface border border-stroke font-body text-[12px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
                >
                  Withdraw all
                </button>
              </div>
              {tooLow && (
                <p className="mt-1.5 font-body text-[11.5px] text-error-text">Minimum {fmtINR(MIN_MINOR)} to withdraw.</p>
              )}
              {tooHigh && (
                <p className="mt-1.5 font-body text-[11.5px] text-error-text">Amount exceeds available balance.</p>
              )}
            </div>

            <dl className="rounded-md bg-bg-subtle px-3 py-2.5 space-y-1.5 border border-stroke-subtle">
              <Row k="Amount" v={fmtINR(amountMinor)} />
              <Row k="Platform fee" v={`− ${fmtINR(FEE_MINOR)}`} />
              <div className="h-px bg-stroke-subtle my-1" aria-hidden />
              <Row k="You'll receive" v={fmtINR(total)} strong />
              <Row k="ETA" v="1–2 business days" />
            </dl>

            <div>
              <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1">To</p>
              {method ? (
                <div className="flex items-center justify-between gap-3 rounded-md bg-surface border border-stroke-subtle px-3 py-2">
                  <div>
                    <p className="font-body text-[12.5px] font-semibold text-foreground">{method.nickname ?? "Bank account"}</p>
                    <p className="font-body text-[11px] text-text-tertiary">{method.kind.replace("_", " ")} · INR</p>
                  </div>
                  <Link href="/contributor/earnings/payout-method" className="font-body text-[11.5px] font-semibold text-text-link hover:underline">Change →</Link>
                </div>
              ) : (
                <p className="rounded-md bg-warning-subtle border border-warning-border px-3 py-2 font-body text-[12px] text-warning-text">
                  No payout method on file. <Link href="/contributor/earnings/payout-method/new" className="underline font-semibold">Add one</Link>.
                </p>
              )}
            </div>
          </div>
          <footer className="flex items-center justify-end gap-2 px-4 py-3 border-t border-stroke-subtle bg-bg-subtle">
            <Link
              href="/contributor/earnings"
              className="inline-flex items-center h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!valid || submitting}
              className={cn(
                "inline-flex items-center h-9 px-3.5 rounded-md shadow-xs",
                "bg-brand text-on-brand",
                "font-body text-[13px] font-semibold",
                "hover:bg-brand-hover transition-colors duration-fast",
                "disabled:opacity-60 disabled:cursor-not-allowed",
              )}
            >
              {submitting ? "Submitting…" : "Withdraw"}
            </button>
          </footer>
        </section>
      )}
    </div>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={cn("font-body text-[12px]", strong ? "text-foreground font-semibold" : "text-text-secondary")}>{k}</dt>
      <dd className={cn("font-mono text-[12px] tabular-nums", strong ? "text-foreground font-semibold" : "text-text-secondary")}>{v}</dd>
    </div>
  );
}
