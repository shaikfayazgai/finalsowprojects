"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { AURORA_ACCENT, DASH_CARD } from "@/app/admin/_shell/aurora";
import type { PlanLimits, TenantSubscriptionSnapshot, UsageMetricKey } from "@/lib/subscription/types";

const METRIC_LABELS: Record<UsageMetricKey, string> = {
  activeSows: "Active SOWs",
  activeProjects: "Active projects",
  seats: "Workspace seats",
  aiInvocationsMonth: "AI invocations (month)",
};

function usagePercent(used: number, limit: number | null): number | null {
  if (limit == null || limit <= 0) return null;
  return Math.min(100, Math.round((used / limit) * 100));
}

export function PlanUsageStrip({
  subscription,
  className,
}: {
  subscription: TenantSubscriptionSnapshot;
  className?: string;
}) {
  const metrics: UsageMetricKey[] = ["activeSows", "activeProjects", "seats", "aiInvocationsMonth"];

  return (
    <div className={cn(DASH_CARD, "overflow-hidden", className)}>
      <div className="px-4 py-3 border-b border-stroke-subtle flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-body text-[13px] font-semibold text-foreground">
            {subscription.plan.label} plan
          </p>
          <p className="font-body text-[11.5px] text-text-tertiary">
            {subscription.trialEndsAt && !subscription.trialExpired
              ? `Trial ends ${new Date(subscription.trialEndsAt).toLocaleDateString()}`
              : subscription.contractRef
                ? `MSA ${subscription.contractRef}`
                : "Usage against plan limits"}
          </p>
        </div>
        <Link
          href="/enterprise/settings/plan"
          className="font-body text-[12px] font-semibold text-brand-emphasis hover:text-brand"
        >
          Manage plan →
        </Link>
      </div>
      <dl className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-stroke-subtle">
        {metrics.map((key) => (
          <UsageCell
            key={key}
            label={METRIC_LABELS[key]}
            used={subscription.usage[key]}
            limit={subscription.plan.limits[key]}
          />
        ))}
      </dl>
    </div>
  );
}

function UsageCell({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: PlanLimits[UsageMetricKey];
}) {
  const pct = usagePercent(used, limit);
  const warn = pct != null && pct >= 85;

  return (
    <div className="px-4 py-3">
      <dt className="font-body text-[10.5px] font-bold uppercase tracking-[0.1em] text-text-tertiary">
        {label}
      </dt>
      <dd className="mt-1 font-body text-[18px] font-semibold tabular-nums text-foreground">
        {used}
        <span className="text-[13px] font-medium text-text-tertiary">
          {limit != null ? ` / ${limit}` : " · unlimited"}
        </span>
      </dd>
      {pct != null && (
        <div className="mt-2 h-1 rounded-full bg-foreground/[0.08] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, backgroundImage: warn ? undefined : AURORA_ACCENT, backgroundColor: warn ? "var(--color-warning-solid)" : undefined }}
          />
        </div>
      )}
    </div>
  );
}
