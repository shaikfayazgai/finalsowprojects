import { getPlan, minimumPlanForFeature, planIncludesFeature } from "./plans";
import type {
  FeatureCheckResult,
  PlanCode,
  SubscriptionFeature,
  TenantSubscriptionSnapshot,
  UsageMetricKey,
} from "./types";

export function isTrialExpired(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false;
  return Date.now() > new Date(trialEndsAt).getTime();
}

export function checkFeatureAccess(
  sub: TenantSubscriptionSnapshot,
  feature: SubscriptionFeature,
): FeatureCheckResult {
  if (sub.tenantStatus === "paused") {
    return {
      allowed: false,
      reason: "tenant_paused",
      message: "This workspace is paused. Contact your Glimmora account team.",
    };
  }
  if (sub.tenantStatus === "closed") {
    return {
      allowed: false,
      reason: "tenant_closed",
      message: "This workspace is closed.",
    };
  }
  if (sub.trialExpired) {
    return {
      allowed: false,
      reason: "trial_expired",
      message: "Your trial has ended. Upgrade to continue using Glimmora.",
      upgradePlan: "pilot",
    };
  }
  if (!planIncludesFeature(sub.plan, feature)) {
    const upgrade = minimumPlanForFeature(feature);
    return {
      allowed: false,
      reason: "feature_not_in_plan",
      message: `${sub.plan.label} plan does not include this capability. Upgrade to ${getPlan(upgrade).label}.`,
      upgradePlan: upgrade,
    };
  }
  return { allowed: true };
}

export function checkUsageLimit(
  sub: TenantSubscriptionSnapshot,
  metric: UsageMetricKey,
  increment = 0,
): FeatureCheckResult {
  const limit = sub.plan.limits[metric];
  if (limit == null) return { allowed: true };
  const current = sub.usage[metric];
  if (current + increment > limit) {
    const upgrade: PlanCode =
      sub.plan.code === "trial"
        ? "pilot"
        : sub.plan.code === "pilot"
          ? "growth"
          : "enterprise";
    return {
      allowed: false,
      reason: "limit_reached",
      message: `You've reached the ${metric.replace(/([A-Z])/g, " $1").toLowerCase()} limit (${limit}) on the ${sub.plan.label} plan.`,
      upgradePlan: upgrade,
    };
  }
  return { allowed: true };
}

export function canUseFeature(
  sub: TenantSubscriptionSnapshot,
  feature: SubscriptionFeature,
): boolean {
  return checkFeatureAccess(sub, feature).allowed;
}
