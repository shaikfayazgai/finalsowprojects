/**
 *   GET  /api/enterprise/rate-cards   → read tenant rate-card config
 *   PUT  /api/enterprise/rate-cards   → replace tenant rate-card config
 *
 * Tenant-bound (requireTenantRequest). Permissions:
 *   - GET requires `read.rate_card`
 *   - PUT requires `manage.rate_card`
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireTenantRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const segmentSchema = z
  .object({
    student: z.number().min(0).max(1_000_000).optional(),
    women_workforce: z.number().min(0).max(1_000_000).optional(),
    general_workforce: z.number().min(0).max(1_000_000).optional(),
    internal: z.number().min(0).max(1_000_000).optional(),
  })
  .strict();

const bodySchema = z.object({
  currency: z.string().min(3).max(3),
  default: z.number().min(0).max(1_000_000),
  bySegment: segmentSchema.optional(),
});

export async function GET() {
  const ctx = await requireTenantRequest({
    allowedRoles: ["enterprise", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "read.rate_card"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:read.rate_card" },
      { status: 403 },
    );
  }

  return NextResponse.json(
    {
      tenantId: ctx.tenant.id,
      tenantCurrency: ctx.tenant.currency,
      rateCards: ctx.tenant.rateCards ?? null,
    },
    { status: 200 },
  );
}

export async function PUT(req: NextRequest) {
  const ctx = await requireTenantRequest({
    allowedRoles: ["enterprise", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "manage.rate_card"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:manage.rate_card" },
      { status: 403 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const updated = await ctx.withTx(async (tx) => {
      const before = await tx.tenant.findUnique({
        where: { id: ctx.tenant.id },
        select: { rateCards: true },
      });
      const next = await tx.tenant.update({
        where: { id: ctx.tenant.id },
        data: { rateCards: parsed.data as unknown as Prisma.InputJsonValue },
        select: { rateCards: true },
      });
      await ctx.audit(
        {
          action: "tenant.rate_cards.update",
          resource: { type: "tenant", id: ctx.tenant.id, label: ctx.tenant.name },
          payload: { currency: parsed.data.currency, default: parsed.data.default },
          before: (before?.rateCards ?? null) as Record<string, unknown> | null,
          after: parsed.data as unknown as Record<string, unknown>,
          severity: "info",
        },
        { tx },
      );
      return next;
    });
    return NextResponse.json(
      { tenantId: ctx.tenant.id, rateCards: updated.rateCards },
      { status: 200 },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[rate-cards.PUT]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
