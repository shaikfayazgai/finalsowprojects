"use client";

/**
 * Platform admin pricing — client price, cost basis, margin (admin-only).
 */

import * as React from "react";
import { Calculator, Lock, Sparkles, TrendingUp } from "lucide-react";
import { formatINR, formatPct, readSowPricingOrBudget, sowPriceForPlatform } from "@/lib/pricing";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "../../_shell/aurora";

interface Props {
  payload: Record<string, unknown> | null | undefined;
}

export function SowPlatformPricingPanel({ payload }: Props) {
  const pricing = readSowPricingOrBudget(payload);

  // Live platform rates (super-admin-set commission % + GST %). Used to project
  // the split from the given budget at approval time, before decomposition.
  const [commissionPct, setCommissionPct] = React.useState(15);
  const [gstPct, setGstPct] = React.useState(18);
  React.useEffect(() => {
    fetch("/api/admin/commission", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data?.commissionPct != null) setCommissionPct(Number(j.data.commissionPct));
        if (j?.data?.gstPct != null) setGstPct(Number(j.data.gstPct));
      })
      .catch(() => {});
  }, []);

  if (!pricing) {
    return (
      <section className={cn(DASH_CARD, "overflow-hidden")}>
        <div className="px-4 sm:px-5 py-4 border-b border-stroke-subtle">
          <h2 className="font-body text-[13px] font-semibold text-foreground">Commercial economics</h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Platform admin view · pricing at intake</p>
        </div>
        <p className="px-4 sm:px-5 py-5 font-body text-[13px] text-text-secondary">
          No commercial pricing was captured at intake. Margin cannot be computed until pricing is set on this SOW.
        </p>
      </section>
    );
  }

  const view = sowPriceForPlatform(pricing);
  const costKnown = view.actualCost > 0;
  const marginTone =
    !costKnown ? "text-text-secondary" : view.marginPct >= 30 ? "text-success-text" : view.marginPct >= 15 ? "text-warning-text" : "text-warning-text";

  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="flex flex-wrap items-start justify-between gap-3 px-4 sm:px-5 py-4 border-b border-stroke-subtle">
        <div>
          <h2 className="font-body text-[13px] font-semibold text-foreground">Commercial economics</h2>
          <p className="mt-0.5 font-body text-[12px] text-text-tertiary">Verify rate cards, effort, and payment terms against these figures</p>
        </div>
        <ModePill mode={view.mode} />
      </div>

      <div className="px-4 sm:px-5 py-5">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
          <PriceCell label="Client price (excl. GST)" value={formatINR(view.clientPrice)} emphasis />
          <PriceCell label="Actual cost basis" value={costKnown ? formatINR(view.actualCost) : "Not yet set"} />
          <PriceCell
            label="Gross margin"
            value={costKnown ? `${formatINR(view.marginAmount)} · ${formatPct(view.marginPct)}` : "Pending decomposition"}
            className={marginTone}
            emphasis
          />
        </dl>

        {!costKnown ? (
          <p className="mt-3 font-body text-[12px] text-text-tertiary">
            Margin finalizes once the SOW is decomposed and contributor payouts are set.
          </p>
        ) : null}

        <div className="mt-4 rounded-lg border border-stroke-subtle bg-bg-subtle/60 px-4 py-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="font-body text-[11px] font-medium text-text-tertiary">GST ({gstPct}% pass-through)</span>
          <span className="font-body text-[13px] tabular-nums text-text-secondary">{formatINR(Math.round(view.clientPrice * gstPct / 100))}</span>
          <span aria-hidden className="text-text-disabled">·</span>
          <span className="font-body text-[11px] font-medium text-text-tertiary">Enterprise total payable</span>
          <span className="font-body text-[13px] font-semibold tabular-nums text-foreground">{formatINR(view.clientPrice + Math.round(view.clientPrice * gstPct / 100))}</span>
        </div>

        {/* Projected split from the given budget at the live commission % + GST %. */}
        {(() => {
          const cf = Math.max(0, Math.min(commissionPct, 89)) / 100;
          const gf = Math.max(0, Math.min(gstPct, 50)) / 100;
          const budget = view.clientPrice;                 // the client price (given budget, excl. GST)
          const margin = Math.round(budget * cf);          // Glimmora keeps this
          const contributorPool = budget - margin;         // contributor pay — PAID IN FULL (GST is never deducted from the contributor)
          const gst = Math.round(budget * gf);
          const enterpriseTotal = budget + gst;
          return (
            <div className="mt-4 rounded-lg border border-stroke-subtle bg-surface overflow-hidden">
              <div className="px-4 py-2.5 border-b border-stroke-subtle flex items-center justify-between gap-3">
                <p className="font-body text-[12px] font-semibold text-foreground">Projected split at this budget</p>
                <span className="font-body text-[10.5px] text-text-tertiary">commission {commissionPct}% · GST {gstPct}% (estimate — finalizes at decomposition)</span>
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-3 px-4 py-3 font-body text-[12px] tabular-nums">
                <div><dt className="text-text-tertiary">Given budget (client price)</dt><dd className="font-semibold text-foreground">{formatINR(budget)}</dd></div>
                <div><dt className="text-text-tertiary">Glimmora margin ({commissionPct}%)</dt><dd className="font-semibold text-success-text">{formatINR(margin)}</dd></div>
                <div><dt className="text-text-tertiary">Contributor payout (paid in full)</dt><dd className="font-semibold text-foreground">{formatINR(contributorPool)}</dd></div>
                <div><dt className="text-text-tertiary">Enterprise pays (+{gstPct}% GST)</dt><dd className="font-semibold text-foreground">{formatINR(enterpriseTotal)}</dd></div>
              </dl>
            </div>
          );
        })()}

        {view.mode === "manual" && view.manual ? (
          <BreakdownGrid
            title="Manual mode inputs"
            rows={[
              ["Enterprise proposed value", formatINR(view.manual.enterpriseProposed)],
              ["Glimmora platform fee", formatINR(view.manual.platformFeeAmount)],
            ]}
          />
        ) : view.mode === "ai" && view.ai ? (
          <BreakdownGrid
            title="AI quote components"
            rows={[
              ["AI base price", formatINR(view.ai.aiBasePrice)],
              ["SOW processing cost", formatINR(view.ai.sowProcessingCost)],
              ["Uplift", formatINR(view.ai.uplift)],
            ]}
          />
        ) : null}

        {view.locked ? (
          <p className="mt-3 inline-flex items-center gap-1.5 font-body text-[12px] text-text-tertiary">
            <Lock className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Pricing locked at approval — frozen for audit.
          </p>
        ) : (
          <p className="mt-3 inline-flex items-center gap-1.5 font-body text-[12px] text-warning-text">
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
            Not yet locked — figures may change until you approve.
          </p>
        )}
      </div>
    </section>
  );
}

function ModePill({ mode }: { mode: "manual" | "ai" }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-[22px] px-2.5 rounded-full bg-bg-subtle font-body text-[11px] font-medium text-text-secondary">
      {mode === "manual" ? <Calculator className="h-3 w-3" strokeWidth={2} aria-hidden /> : <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />}
      {mode === "manual" ? "Manual pricing" : "AI quote"}
    </span>
  );
}

function PriceCell({
  label,
  value,
  emphasis = false,
  className,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div>
      <dt className="font-body text-[11px] font-medium text-text-tertiary mb-1">{label}</dt>
      <dd className={cn("font-body tabular-nums", emphasis ? "text-[18px] font-semibold text-foreground" : "text-[15px] text-text-secondary", className)}>
        {value}
      </dd>
    </div>
  );
}

function BreakdownGrid({ title, rows }: { title: string; rows: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div className="mt-4">
      <p className="font-body text-[11px] font-medium text-text-tertiary mb-2">{title}</p>
      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="font-body text-[11px] text-text-tertiary">{label}</dt>
            <dd className="font-body text-[13px] tabular-nums text-text-secondary">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
