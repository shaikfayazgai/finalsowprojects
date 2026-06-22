import type { TenantSubscriptionSnapshot, UsageMetricKey } from "./types";

const METRIC_LABELS: Record<UsageMetricKey, string> = {
  activeSows: "Active SOWs",
  activeProjects: "Active projects",
  seats: "Seats",
  aiInvocationsMonth: "AI invocations",
};

export interface SubscriptionUsageWarning {
  metricKey: UsageMetricKey;
  label: string;
  used: number;
  limit: number;
  percent: number;
}

/** Highest-usage metric at or above threshold (default 85%). */
export function getSubscriptionUsageWarning(
  subscription: TenantSubscriptionSnapshot,
  thresholdPercent = 85,
): SubscriptionUsageWarning | null {
  const metrics: UsageMetricKey[] = [
    "seats",
    "activeSows",
    "activeProjects",
    "aiInvocationsMonth",
  ];

  let worst: SubscriptionUsageWarning | null = null;

  for (const key of metrics) {
    const used = subscription.usage[key];
    const limit = subscription.plan.limits[key];
    if (limit == null || limit <= 0) continue;

    const percent = Math.min(100, Math.round((used / limit) * 100));
    if (percent < thresholdPercent) continue;

    if (!worst || percent > worst.percent) {
      worst = {
        metricKey: key,
        label: METRIC_LABELS[key],
        used,
        limit,
        percent,
      };
    }
  }

  return worst;
}
