import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { resolveSubscriptionForUserId, resolveSubscriptionForTenantId } from "@/lib/subscription/resolve";
import { checkFeatureAccess, checkUsageLimit } from "@/lib/subscription/enforce";
import type { SubscriptionFeature, UsageMetricKey } from "@/lib/subscription/types";

export async function requireEnterpriseSubscription(): Promise<
  | { session: Session; subscription: Awaited<ReturnType<typeof resolveSubscriptionForUserId>> }
  | NextResponse
> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (session.user.role !== "enterprise" && session.user.role !== "admin" && session.user.role !== "super_admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const subscription = await resolveSubscriptionForUserId(session.user.id);
  if (!subscription) {
    return NextResponse.json({ error: "no_tenant" }, { status: 404 });
  }

  return { session, subscription };
}

export function featureDeniedResponse(
  check: ReturnType<typeof checkFeatureAccess>,
): NextResponse {
  return NextResponse.json(
    {
      error: "plan_denied",
      reason: check.reason,
      message: check.message,
      upgradePlan: check.upgradePlan,
    },
    { status: 402 },
  );
}

export async function requireSubscriptionFeature(
  feature: SubscriptionFeature,
): Promise<
  | {
      session: Session;
      subscription: NonNullable<Awaited<ReturnType<typeof resolveSubscriptionForUserId>>>;
    }
  | NextResponse
> {
  const result = await requireEnterpriseSubscription();
  if (result instanceof NextResponse) return result;
  const { subscription } = result;
  if (!subscription) {
    return NextResponse.json({ error: "no_tenant" }, { status: 404 });
  }
  const check = checkFeatureAccess(subscription, feature);
  if (!check.allowed) return featureDeniedResponse(check);
  return { session: result.session, subscription };
}

export async function requireUsageHeadroom(
  metric: UsageMetricKey,
  increment = 1,
): Promise<
  | {
      session: Session;
      subscription: NonNullable<Awaited<ReturnType<typeof resolveSubscriptionForUserId>>>;
    }
  | NextResponse
> {
  const result = await requireEnterpriseSubscription();
  if (result instanceof NextResponse) return result;
  const { subscription } = result;
  if (!subscription) {
    return NextResponse.json({ error: "no_tenant" }, { status: 404 });
  }
  const check = checkUsageLimit(subscription, metric, increment);
  if (!check.allowed) return featureDeniedResponse(check);
  return { session: result.session, subscription };
}

/** Tenant-scoped checks for routes that already resolved `ctx.tenant.id`. */
export async function requireTenantSubscriptionFeature(
  tenantId: string,
  feature: SubscriptionFeature,
): Promise<
  | { subscription: NonNullable<Awaited<ReturnType<typeof resolveSubscriptionForTenantId>>> }
  | NextResponse
> {
  const subscription = await resolveSubscriptionForTenantId(tenantId);
  if (!subscription) {
    return NextResponse.json({ error: "no_tenant" }, { status: 404 });
  }
  const check = checkFeatureAccess(subscription, feature);
  if (!check.allowed) return featureDeniedResponse(check);
  return { subscription };
}

export async function requireTenantUsageHeadroom(
  tenantId: string,
  metric: UsageMetricKey,
  increment = 1,
): Promise<
  | { subscription: NonNullable<Awaited<ReturnType<typeof resolveSubscriptionForTenantId>>> }
  | NextResponse
> {
  const subscription = await resolveSubscriptionForTenantId(tenantId);
  if (!subscription) {
    return NextResponse.json({ error: "no_tenant" }, { status: 404 });
  }
  const check = checkUsageLimit(subscription, metric, increment);
  if (!check.allowed) return featureDeniedResponse(check);
  return { subscription };
}
