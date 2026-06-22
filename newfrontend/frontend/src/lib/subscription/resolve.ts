import { prisma } from "@/lib/db";
import { getPlan } from "./plans";
import { planCodeFromPrismaTier } from "./tier-map";
import { isTrialExpired } from "./enforce";
import type { PlanCode, SubscriptionFeature, TenantSubscriptionSnapshot, UsageSnapshot } from "./types";

export interface UsageCountersJson {
  activeSows?: number;
  activeProjects?: number;
  seats?: number;
  aiInvocationsMonth?: number;
  aiInvocationsPeriod?: string;
}

const DEFAULT_USAGE: UsageSnapshot = {
  activeSows: 0,
  activeProjects: 0,
  seats: 1,
  aiInvocationsMonth: 0,
};

function parseUsageCounters(raw: unknown, tenantId: string): UsageSnapshot {
  const base = { ...DEFAULT_USAGE };
  if (!raw || typeof raw !== "object") return base;
  const c = raw as UsageCountersJson;
  const period = c.aiInvocationsPeriod;
  const currentMonth = new Date().toISOString().slice(0, 7);
  return {
    activeSows: typeof c.activeSows === "number" ? c.activeSows : base.activeSows,
    activeProjects:
      typeof c.activeProjects === "number" ? c.activeProjects : base.activeProjects,
    seats: typeof c.seats === "number" ? c.seats : base.seats,
    aiInvocationsMonth:
      period === currentMonth && typeof c.aiInvocationsMonth === "number"
        ? c.aiInvocationsMonth
        : 0,
  };
}

async function countActiveSowsFromDb(tenantId: string): Promise<number | null> {
  try {
    const count = await prisma.sow.count({
      where: {
        tenantId,
        status: { in: ["draft", "parsing", "review", "approval", "approved"] },
      },
    });
    return count;
  } catch {
    return null;
  }
}

async function countSeatsFromDb(tenantId: string): Promise<number | null> {
  try {
    const count = await prisma.user.count({ where: { tenantId } });
    return count;
  } catch {
    return null;
  }
}

export async function resolveSubscriptionForTenantId(
  tenantId: string,
): Promise<TenantSubscriptionSnapshot | null> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || tenant.deletedAt) return null;

  const planCode = planCodeFromPrismaTier(tenant.subscriptionTier) as PlanCode;
  const plan = getPlan(planCode);

  const counters = parseUsageCounters(tenant.usageCounters, tenantId);
  const dbSows = await countActiveSowsFromDb(tenantId);
  const dbSeats = await countSeatsFromDb(tenantId);

  const usage: UsageSnapshot = {
    ...counters,
    activeSows: dbSows ?? counters.activeSows,
    seats: dbSeats ?? counters.seats,
  };

  const trialEndsAt = tenant.trialEndsAt?.toISOString() ?? null;
  const trialExpired =
    planCode === "trial" && isTrialExpired(trialEndsAt);

  const enabledFeatures: SubscriptionFeature[] = trialExpired
    ? ["sow.manual"]
    : [...plan.features];

  return {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    tenantStatus: tenant.status,
    plan,
    subscriptionStartedAt: tenant.subscriptionStartedAt?.toISOString() ?? null,
    trialEndsAt,
    trialExpired,
    usage,
    contractRef: tenant.contractRef,
    enabledFeatures: [...enabledFeatures],
  };
}

export async function resolveSubscriptionForUserId(
  userId: string,
): Promise<TenantSubscriptionSnapshot | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true },
  });
  if (!user?.tenantId) return null;
  return resolveSubscriptionForTenantId(user.tenantId);
}

/** Demo fallback when no DB tenant — enterprise demo / local dev. */
export function demoSubscriptionSnapshot(
  tenantId = "demo-tenant",
): TenantSubscriptionSnapshot {
  const plan = getPlan("growth");
  return {
    tenantId,
    tenantName: "Demo Workspace",
    tenantSlug: "demo",
    tenantStatus: "active",
    plan,
    subscriptionStartedAt: new Date().toISOString(),
    trialEndsAt: null,
    trialExpired: false,
    usage: { activeSows: 2, activeProjects: 1, seats: 3, aiInvocationsMonth: 120 },
    contractRef: null,
    enabledFeatures: [...plan.features],
  };
}
