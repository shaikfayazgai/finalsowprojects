"use client";

/**
 * Withdraw success — spec doc 01 §5.L.6.
 * Green check + amount + ETA + reference. Two CTAs: View history / Done.
 */

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import type { MockPayoutMethod } from "@/mocks/contributor";
import { fetchPayoutMethods } from "@/lib/api/contributor-mock";
import { cn } from "@/lib/utils/cn";

function fmtINR(minor: number): string {
  return `₹${Math.round(minor / 100).toLocaleString("en-IN")}`;
}

export default function WithdrawSuccessPage() {
  const params = useSearchParams();
  const ref = params.get("ref") ?? "WD-PENDING";
  const amount = Number(params.get("amount") ?? "0");

  const [methods, setMethods] = React.useState<MockPayoutMethod[] | null>(null);
  React.useEffect(() => {
    const c = new AbortController();
    fetchPayoutMethods(c.signal).then((r) => setMethods(r.items)).catch(() => { /* non-critical */ });
    return () => c.abort();
  }, []);
  const method = methods?.find((m) => m.primary) ?? methods?.[0];

  return (
    <div className="pb-12 animate-fade-in flex justify-center">
      <section className="w-full max-w-[480px] rounded-lg border border-stroke bg-surface shadow-xs">
        <div className="px-6 py-6 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-success-subtle flex items-center justify-center mb-3" aria-hidden>
            <CheckCircle2 className="h-6 w-6 text-success-text" strokeWidth={2} />
          </div>
          <h1 className="font-body text-[18px] font-semibold text-foreground tracking-[-0.01em]">
            Withdrawal requested
          </h1>
          <p className="mt-1 font-body text-[12.5px] text-text-secondary">
            Your payout is on the way.
          </p>

          <dl className="mt-5 text-left rounded-md bg-bg-subtle border border-stroke-subtle px-3 py-2.5 space-y-1.5">
            <Row k="Amount" v={fmtINR(amount)} strong />
            <Row k="To" v={method?.label ?? "—"} />
            <Row k="ETA" v="1–2 business days" />
            <Row k="Reference" v={ref} mono />
          </dl>
        </div>
        <footer className="flex items-center justify-end gap-2 px-4 py-3 border-t border-stroke-subtle bg-bg-subtle">
          <Link
            href="/contributor/earnings/history"
            className="inline-flex items-center h-9 px-3.5 rounded-md bg-surface border border-stroke font-body text-[13px] font-semibold text-foreground hover:bg-surface-hover transition-colors duration-fast"
          >
            View history
          </Link>
          <Link
            href="/contributor/earnings"
            className={cn(
              "inline-flex items-center h-9 px-3.5 rounded-md shadow-xs",
              "bg-brand text-on-brand",
              "font-body text-[13px] font-semibold",
              "hover:bg-brand-hover transition-colors duration-fast",
            )}
          >
            Done
          </Link>
        </footer>
      </section>
    </div>
  );
}

function Row({ k, v, strong, mono }: { k: string; v: string; strong?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={cn("font-body text-[12px]", strong ? "text-foreground font-semibold" : "text-text-secondary")}>{k}</dt>
      <dd className={cn(
        mono ? "font-mono text-[11.5px] tabular-nums" : "font-mono text-[12px] tabular-nums",
        strong ? "text-foreground font-semibold" : "text-text-secondary",
      )}>{v}</dd>
    </div>
  );
}
