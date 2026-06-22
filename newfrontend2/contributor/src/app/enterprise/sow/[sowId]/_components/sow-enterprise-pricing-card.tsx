"use client";

/**
 * Enterprise SOW pricing — what the customer is allowed to see.
 *
 * Three numbers: client price (excl. GST), GST (18%), enterprise total payable.
 * Never margin, never contributor payout, never cost basis. Those are
 * literally absent from the `EnterpriseSowPriceView` type returned by
 * `sowPriceForEnterprise`.
 */

import * as React from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { DASH_CARD } from "@/app/admin/_shell/aurora";
import {
  formatINR,
  readSowPricing,
  sowPriceForEnterprise,
} from "@/lib/pricing";

interface Props {
  payload: Record<string, unknown> | null | undefined;
}

export function SowEnterprisePricingCard({ payload }: Props) {
  const pricing = readSowPricing(payload);
  if (!pricing) return null;
  const view = sowPriceForEnterprise(pricing);

  return (
    <section className={cn(DASH_CARD, "overflow-hidden")}>
      <div className="px-5 sm:px-6 py-4 border-b border-stroke-subtle">
        <h2 className="font-display text-[14px] font-bold tracking-[-0.01em] text-foreground">Commercial summary</h2>
        <p className="mt-0.5 font-body text-[12px] text-text-tertiary">What your organization is billed for this SOW</p>
      </div>
      <div className="px-5 sm:px-6 py-5">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-4">
          <PriceCell label="Client price (excl. GST)" value={formatINR(view.clientPrice)} emphasis />
          <PriceCell label="GST (18%)" value={formatINR(view.gst)} />
          <PriceCell label="Total payable" value={formatINR(view.total)} />
        </dl>
        {view.locked ? (
          <p className="mt-3 inline-flex items-center gap-1.5 font-body text-[11.5px] text-text-tertiary">
            <Lock className="h-3 w-3" strokeWidth={2} aria-hidden />
            Locked at SOW approval — changes require a new version.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function PriceCell({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary mb-1">
        {label}
      </dt>
      <dd
        className={
          "tabular-nums " +
          (emphasis
            ? "font-display text-[18px] font-semibold text-foreground"
            : "font-body text-[15px] text-text-secondary")
        }
      >
        {value}
      </dd>
    </div>
  );
}
