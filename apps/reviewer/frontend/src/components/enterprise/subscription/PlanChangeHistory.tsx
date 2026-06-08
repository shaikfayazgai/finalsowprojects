"use client";

import { DashboardSection } from "@/components/meridian/dashboard";
import { Skeleton } from "@/components/meridian";
import type { PlanChangeRecord } from "@/lib/subscription/types";
import { PLAN_CATALOG } from "@/lib/subscription/plans";
import type { PlanCode } from "@/lib/subscription/types";

function planLabel(code: PlanCode | null): string {
  if (!code) return "—";
  return PLAN_CATALOG[code]?.label ?? code;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PlanChangeHistory({
  items,
  isLoading,
  emptyMessage = "No plan changes recorded yet.",
}: {
  items: PlanChangeRecord[] | undefined;
  isLoading?: boolean;
  emptyMessage?: string;
}) {
  return (
    <DashboardSection
      title="Plan change history"
      description="Sales-led upgrades and admin tier assignments — auditable record"
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : !items?.length ? (
        <p className="font-body text-[13px] text-text-tertiary text-center py-6">{emptyMessage}</p>
      ) : (
        <ul className="divide-y divide-stroke-subtle rounded-xl border border-stroke-subtle overflow-hidden">
          {items.map((row) => (
            <li
              key={row.id}
              className="px-4 py-3 bg-surface hover:bg-bg-subtle/30 transition-colors duration-fast"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-body text-[13px] font-semibold text-foreground">
                    {planLabel(row.fromPlan)} → {planLabel(row.toPlan)}
                  </p>
                  <p className="mt-0.5 font-body text-[11.5px] text-text-tertiary">
                    {row.changedByName ?? row.changedByUserId}
                    <span aria-hidden className="mx-1">·</span>
                    {row.changedByRole}
                    {row.contractRef ? (
                      <>
                        <span aria-hidden className="mx-1">·</span>
                        MSA {row.contractRef}
                      </>
                    ) : null}
                  </p>
                  {row.note ? (
                    <p className="mt-1 font-body text-[11px] text-text-secondary">{row.note}</p>
                  ) : null}
                </div>
                <time
                  dateTime={row.at}
                  className="font-mono text-[10.5px] text-text-tertiary shrink-0 tabular-nums"
                >
                  {formatWhen(row.at)}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}
