"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
function formatMoney(cents: number): string {
  return `₹${Math.round(cents / 100).toLocaleString("en-IN")}`;
}
import type { PayoutOverview } from "@/lib/enterprise/use-payout-overview";

interface PayoutKpiBandProps {
  overview: PayoutOverview;
}

export const PayoutKpiBand: React.FC<PayoutKpiBandProps> = ({ overview }) => {
  const cells = [
    {
      label: "Ready to send",
      value: String(overview.readyCount),
      helper: formatMoney(overview.readyCents),
      dot: "success" as const,
    },
    {
      label: "In flight",
      value: String(overview.inFlightCount),
      helper: formatMoney(overview.inFlightCents),
      dot: "info" as const,
    },
    {
      label: "Failed",
      value: String(overview.failedCount),
      helper: overview.failedCount === 0 ? "No failed transfers" : "Action needed",
      dot: overview.failedCount > 0 ? ("error" as const) : ("neutral" as const),
    },
    {
      label: "On hold",
      value: String(overview.onHoldCount),
      helper: overview.onHoldCount === 0 ? "No holds" : "KYC / compliance",
      dot: overview.onHoldCount > 0 ? ("warning" as const) : ("neutral" as const),
    },
    {
      label: "Contributors",
      value: String(overview.totalContributors),
      helper: "Touched this cycle",
      dot: "neutral" as const,
    },
  ];

  return (
    <div className="rounded-xl bg-surface ring-1 ring-stroke-subtle overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-stroke-subtle">
        {cells.map((c) => (
          <div key={c.label} className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span
                aria-hidden
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  c.dot === "success"
                    ? "bg-[var(--color-success)]"
                    : c.dot === "warning"
                      ? "bg-[var(--color-warning)]"
                      : c.dot === "error"
                        ? "bg-[var(--color-error)]"
                        : c.dot === "info"
                          ? "bg-[var(--color-brand)]"
                          : "bg-stroke-strong",
                )}
              />
              <p className="font-body text-[10.5px] font-bold uppercase tracking-[0.12em] text-text-tertiary">
                {c.label}
              </p>
            </div>
            <p className="font-body text-[20px] font-semibold text-foreground leading-none tabular-nums">
              {c.value}
            </p>
            <p className="font-body text-[11px] text-text-tertiary mt-2 leading-snug">
              {c.helper}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
