"use client";

/**
 * Enterprise · SOW payments. The enterprise pays Glimmora PER SOW — full (all
 * delivered work) or a partial/manual amount. It sees ONLY its budget (client
 * price) — never contributor pay or Glimmora margin. Releasing persists to the DB
 * (payouts: requested → released) so Glimmora can then pay the contributors.
 * Each row links to the SOW payment detail page.
 */

import * as React from "react";
import Link from "next/link";
import { Banknote, CheckCircle2, ChevronRight } from "lucide-react";
import { usePlanList } from "@/lib/hooks/use-decomposition-v2";
import { releasePayment } from "@/lib/api/decomposition-v2";

type Delivery = {
  total: number; delivered: number; paid: number; progressPct: number;
  paymentPhase: string; payoutCounts: Record<string, number>;
  budgetMinor?: number; sowBudgetMinor?: number; requestedMinor?: number; releasedMinor?: number; paidMinor?: number;
};
type Plan = { id: string; sowId: string; sowTitle?: string; delivery?: Delivery };

const inr = (m: number) => "₹" + (m / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 });
const toMinor = (s: string) => Math.round((parseFloat(s) || 0) * 100);

export function BudgetReleasePanel() {
  const { data, refetch } = usePlanList(
    { status: ["active", "approved"], limit: 300 },
    { staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: true },
  );
  const [busy, setBusy] = React.useState<string | null>(null);
  const [err, setErr] = React.useState("");
  const [manual, setManual] = React.useState<Record<string, string>>({});

  const plans = (data?.items ?? []) as Plan[];
  const active = plans.filter((p) => {
    const d = p.delivery;
    // Show a SOW once it's priced (sowBudgetMinor) so it can be PRE-FUNDED up front,
    // as well as once there's delivered work / a Glimmora payment request.
    return !!d && ((d.sowBudgetMinor || 0) > 0 || (d.delivered || 0) > 0 || (d.requestedMinor || 0) > 0 || (d.releasedMinor || 0) > 0 || (d.paidMinor || 0) > 0);
  });

  const doRelease = async (id: string, amountMinor?: number) => {
    setBusy(id); setErr("");
    try {
      await releasePayment(id, amountMinor);
      setManual((m) => ({ ...m, [id]: "" }));
      await refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Release failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-2xl border border-stroke-subtle bg-surface p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Banknote className="h-4 w-4 text-text-tertiary" aria-hidden />
        <h2 className="font-body text-[14px] font-semibold text-foreground">SOW payments</h2>
        <span className="ml-auto text-[11px] text-text-tertiary">Pay Glimmora per SOW · your budget only</span>
      </div>
      {err ? <p className="font-body text-[11.5px] text-error-text">{err}</p> : null}

      {active.length === 0 ? (
        <p className="font-body text-[12.5px] text-text-tertiary py-3">
          No SOW payments yet. Once a SOW is priced it appears here to pre-fund Glimmora (full or partial); Glimmora&apos;s payment requests for delivered work also show here.
        </p>
      ) : (
        active.map((p) => {
          const d = p.delivery!;
          const awaiting = d.requestedMinor || 0;
          const released = d.releasedMinor || 0;
          const paid = d.paidMinor || 0;
          const href = `/enterprise/billing/payouts/sow/${p.id}`;
          const manualVal = manual[p.id] ?? "";
          return (
            <div key={p.id} className="rounded-xl border border-stroke-subtle bg-bg-subtle/30 px-3.5 py-3 space-y-2.5">
              <div className="flex flex-wrap items-start gap-3">
                <Link href={href} className="min-w-0 flex-1 group">
                  <p className="font-body text-[13px] font-semibold text-foreground truncate group-hover:underline">{p.sowTitle || p.sowId}</p>
                  <p className="font-mono text-[10.5px] text-text-tertiary truncate">{p.sowId}</p>
                  <p className="font-body text-[11.5px] text-text-tertiary mt-0.5">
                    {d.delivered}/{d.total} tasks delivered
                    {paid ? ` · ${inr(paid)} paid` : ""}
                    {released ? ` · ${inr(released)} released` : ""}
                  </p>
                </Link>
                <Link href={href} className="inline-flex items-center gap-1 text-[11.5px] text-text-tertiary hover:text-foreground shrink-0">
                  Details <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {awaiting > 0 ? (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stroke-subtle/60">
                  <span className="font-body text-[11.5px] font-medium text-warning-text">Awaiting your release: {inr(awaiting)}</span>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="font-body text-[11px] text-text-tertiary">₹</span>
                      <input
                        type="number" min="0" inputMode="decimal"
                        value={manualVal}
                        onChange={(e) => setManual((m) => ({ ...m, [p.id]: e.target.value }))}
                        placeholder="partial"
                        className="h-9 w-24 rounded-lg border border-stroke-subtle bg-surface px-2 font-body text-[12px] tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/30"
                      />
                      <button
                        type="button"
                        disabled={busy === p.id || toMinor(manualVal) <= 0}
                        onClick={() => doRelease(p.id, toMinor(manualVal))}
                        className="inline-flex items-center h-9 px-3 rounded-lg border border-stroke-subtle bg-bg-subtle font-body text-[12px] font-semibold text-text-secondary hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Release a partial amount (pays whole delivered tasks up to this)"
                      >
                        Release
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={busy === p.id}
                      onClick={() => doRelease(p.id)}
                      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-on-brand font-body text-[12.5px] font-semibold hover:opacity-90 disabled:opacity-50"
                    >
                      <Banknote className="h-3.5 w-3.5" /> {busy === p.id ? "Releasing…" : `Pay completed (${inr(awaiting)})`}
                    </button>
                  </div>
                </div>
              ) : released > 0 || paid > 0 ? (
                <div className="flex items-center gap-2 pt-2 border-t border-stroke-subtle/60">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-text" />
                  <span className="font-body text-[11.5px] text-success-text">
                    {released === 0 && paid > 0 ? "Fully paid" : "Budget released to Glimmora"}
                  </span>
                </div>
              ) : (d.sowBudgetMinor || 0) > 0 ? (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stroke-subtle/60">
                  <span className="font-body text-[11.5px] text-text-tertiary">SOW budget {inr(d.sowBudgetMinor || 0)} — pre-fund Glimmora now (full or partial) or pay on delivery.</span>
                  <Link href={href} className="ml-auto inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand text-on-brand font-body text-[12.5px] font-semibold hover:opacity-90">
                    <Banknote className="h-3.5 w-3.5" /> Release budget →
                  </Link>
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </section>
  );
}
