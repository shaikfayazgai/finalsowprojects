import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { recordSubscriptionPlanChange } from "./plan-history";
import {
  adminTierFromPlanCode,
  planCodeFromAdminTier,
  planCodeFromPrismaTier,
  prismaTierFromPlanCode,
} from "./tier-map";
import type { PlanCode, UsageMetricKey } from "./types";
import type { UsageCountersJson } from "./resolve";

export async function updateTenantSubscription(input: {
  tenantId: string;
  planCode: PlanCode;
  contractRef?: string;
  trialDays?: number;
  actor?: {
    userId: string;
    portalRole: string;
    name?: string | null;
    sessionId?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
}): Promise<void> {
  const existing = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { subscriptionTier: true, contractRef: true },
  });
  if (!existing) return;

  const fromPlan = planCodeFromPrismaTier(existing.subscriptionTier) as PlanCode;
  const now = new Date();
  const trialEndsAt =
    input.planCode === "trial"
      ? new Date(now.getTime() + (input.trialDays ?? 14) * 86_400_000)
      : null;

  await prisma.tenant.update({
    where: { id: input.tenantId },
    data: {
      subscriptionTier: prismaTierFromPlanCode(input.planCode),
      subscriptionStartedAt: now,
      trialEndsAt,
      ...(input.contractRef != null ? { contractRef: input.contractRef } : {}),
    },
  });

  if (input.actor && fromPlan !== input.planCode) {
    await recordSubscriptionPlanChange({
      tenantId: input.tenantId,
      fromPlan,
      toPlan: input.planCode,
      actor: input.actor,
      contractRef: input.contractRef ?? existing.contractRef,
      source: "admin",
    });
  }
}

export async function incrementUsageCounter(
  tenantId: string,
  metric: UsageMetricKey,
  delta = 1,
): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { usageCounters: true },
  });
  if (!tenant) return;

  const current = (tenant.usageCounters as UsageCountersJson | null) ?? {};
  const currentMonth = new Date().toISOString().slice(0, 7);
  const period = current.aiInvocationsPeriod ?? currentMonth;

  const next: UsageCountersJson = { ...current };

  if (metric === "aiInvocationsMonth") {
    if (period !== currentMonth) {
      next.aiInvocationsPeriod = currentMonth;
      next.aiInvocationsMonth = delta;
    } else {
      next.aiInvocationsMonth = (next.aiInvocationsMonth ?? 0) + delta;
    }
  } else {
    next[metric] = (next[metric] ?? 0) + delta;
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { usageCounters: next as Prisma.InputJsonValue },
  });
}

export { adminTierFromPlanCode, planCodeFromAdminTier };
