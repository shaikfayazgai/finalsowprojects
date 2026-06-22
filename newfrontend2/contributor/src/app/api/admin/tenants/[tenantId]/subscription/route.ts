import { NextResponse } from "next/server";
import { z } from "zod";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { getPlan, PLAN_CATALOG } from "@/lib/subscription/plans";
import {
  recordSubscriptionPlanChange,
  resolveFromPlanForTenant,
} from "@/lib/subscription/plan-history";
import {
  resolveSubscriptionForTenantId,
  type UsageCountersJson,
} from "@/lib/subscription/resolve";
import { updateTenantSubscription } from "@/lib/subscription/service";
import type { PlanCode } from "@/lib/subscription/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  planCode: z.enum(["trial", "pilot", "growth", "enterprise"]),
  contractRef: z.string().optional(),
  trialDays: z.number().int().min(1).max(90).optional(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  const guard = await requireRole(["admin", "super_admin"]);
  if (guard instanceof Response) return guard;

  const { tenantId } = await ctx.params;

  try {
    const sub = await resolveSubscriptionForTenantId(tenantId);
    if (sub) return NextResponse.json(sub);
  } catch {
    /* fall through */
  }

  return NextResponse.json(
    {
      tenantId,
      plan: getPlan("pilot"),
      availablePlans: Object.values(PLAN_CATALOG),
      source: "mock",
    },
    { status: 200 },
  );
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  const guard = await requireRole(["admin", "super_admin"]);
  if (guard instanceof Response) return guard;

  const { tenantId } = await ctx.params;
  const body = patchSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "invalid_body", details: body.error.flatten() }, { status: 400 });
  }

  const { planCode, contractRef, trialDays } = body.data;

  const session = await auth();
  const reqHeaders = await headers();
  const actor = session?.user?.id
    ? {
        userId: session.user.id,
        portalRole: session.user.role ?? "admin",
        name: session.user.name ?? null,
        sessionId: (session.user as { sessionId?: string }).sessionId ?? null,
        ipAddress:
          reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          reqHeaders.get("x-real-ip") ??
          null,
        userAgent: reqHeaders.get("user-agent") ?? null,
      }
    : undefined;

  try {
    const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (existing) {
      await updateTenantSubscription({
        tenantId,
        planCode,
        contractRef,
        trialDays,
        actor,
      });
      const sub = await resolveSubscriptionForTenantId(tenantId);
      return NextResponse.json(sub);
    }
  } catch (err) {
    console.error("[subscription PATCH]", err);
  }

  const fromPlan = (await resolveFromPlanForTenant(tenantId)) ?? null;
  if (actor) {
    await recordSubscriptionPlanChange({
      tenantId,
      fromPlan,
      toPlan: planCode,
      actor,
      contractRef: contractRef ?? null,
      source: "admin",
      note: "Mock tenant — tier saved in admin UI store only.",
      persistAudit: false,
    });
  }

  return NextResponse.json({
    tenantId,
    planCode,
    plan: getPlan(planCode as PlanCode),
    persisted: false,
    message: "Tenant not in database — tier saved in admin UI store only.",
  });
}

/** POST increment usage (internal / demo hooks). */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ tenantId: string }> },
) {
  const guard = await requireRole(["admin", "super_admin", "enterprise"]);
  if (guard instanceof Response) return guard;

  const { tenantId } = await ctx.params;
  const json = (await req.json()) as { metric?: string; delta?: number };
  const metric = json.metric as keyof UsageCountersJson | undefined;
  const delta = json.delta ?? 1;

  if (!metric) {
    return NextResponse.json({ error: "metric_required" }, { status: 400 });
  }

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { usageCounters: true, subscriptionTier: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "tenant_not_found" }, { status: 404 });
    }

    const current = (tenant.usageCounters as UsageCountersJson | null) ?? {};
    const currentMonth = new Date().toISOString().slice(0, 7);
    const next: UsageCountersJson = { ...current };

    if (metric === "aiInvocationsMonth") {
      if (current.aiInvocationsPeriod !== currentMonth) {
        next.aiInvocationsPeriod = currentMonth;
        next.aiInvocationsMonth = delta;
      } else {
        next.aiInvocationsMonth = (next.aiInvocationsMonth ?? 0) + delta;
      }
    } else if (metric in next || ["activeSows", "activeProjects", "seats"].includes(metric)) {
      const key = metric as "activeSows" | "activeProjects" | "seats";
      next[key] = (next[key] ?? 0) + delta;
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { usageCounters: next as Prisma.InputJsonValue },
    });

    const sub = await resolveSubscriptionForTenantId(tenantId);
    return NextResponse.json(sub);
  } catch (err) {
    console.error("[subscription POST usage]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
