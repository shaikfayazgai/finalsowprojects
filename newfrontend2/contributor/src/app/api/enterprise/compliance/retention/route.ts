/**
 *   GET  /api/enterprise/compliance/retention  → read tenant retention rules + floors
 *   PUT  /api/enterprise/compliance/retention  → replace tenant retention rules
 *
 * Tenant-bound (requireTenantRequest). Permissions:
 *   - GET requires `read.retention`
 *   - PUT requires `manage.retention`
 *
 * PUT enforces the platform floor: any submitted rule whose mode='days'
 * AND days < floor is rejected. mode='indefinite' is always accepted.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { requireTenantRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import {
  RETENTION_ENTITIES,
  RETENTION_FLOORS,
  type RetentionEntity,
  type RetentionRuleSet,
} from "@/lib/retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ruleSchema = z
  .object({
    mode: z.enum(["indefinite", "days"]),
    days: z.number().int().min(1).max(50 * 365).optional(),
  })
  .refine((r) => r.mode === "indefinite" || typeof r.days === "number", {
    message: "days is required when mode='days'",
  });

const bodySchema = z
  .object({
    audit_event: ruleSchema.optional(),
    task_evidence: ruleSchema.optional(),
    submission_withdrawn: ruleSchema.optional(),
    mentor_notes: ruleSchema.optional(),
    kyc_records: ruleSchema.optional(),
  })
  .strict();

export async function GET() {
  const ctx = await requireTenantRequest({
    allowedRoles: ["enterprise", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "read.retention"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:read.retention" },
      { status: 403 },
    );
  }

  return NextResponse.json(
    {
      tenantId: ctx.tenant.id,
      rules: (ctx.tenant.retentionRules ?? null) as RetentionRuleSet | null,
      floors: RETENTION_FLOORS,
    },
    { status: 200 },
  );
}

export async function PUT(req: NextRequest) {
  const ctx = await requireTenantRequest({
    allowedRoles: ["enterprise", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "manage.retention"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:manage.retention" },
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

  // Enforce platform floor: any 'days' rule below the entity's floor is rejected.
  const violations: Array<{ entity: string; floorDays: number; submittedDays: number }> = [];
  for (const entity of RETENTION_ENTITIES) {
    const rule = (parsed.data as RetentionRuleSet)[entity];
    if (!rule) continue;
    if (rule.mode === "days" && typeof rule.days === "number") {
      const floor = RETENTION_FLOORS[entity].floorDays;
      if (rule.days < floor) {
        violations.push({ entity, floorDays: floor, submittedDays: rule.days });
      }
    }
  }
  if (violations.length > 0) {
    return NextResponse.json(
      { error: "Retention below platform floor", violations },
      { status: 422 },
    );
  }

  const result = await ctx.withTx(async (tx) => {
    const before = await tx.tenant.findUnique({
      where: { id: ctx.tenant.id },
      select: { retentionRules: true },
    });
    const updated = await tx.tenant.update({
      where: { id: ctx.tenant.id },
      data: {
        retentionRules: parsed.data as unknown as Prisma.InputJsonValue,
      },
      select: { id: true, retentionRules: true },
    });
    await ctx.audit(
      {
        action: "retention_rules.update",
        resource: { type: "tenant", id: ctx.tenant.id, label: ctx.tenant.name },
        payload: { byUserId: ctx.userId },
        before: (before?.retentionRules ?? null) as Record<string, unknown> | null,
        after: parsed.data as unknown as Record<string, unknown>,
        severity: "info",
      },
      { tx },
    );
    return updated;
  });

  return NextResponse.json(
    {
      tenantId: result.id,
      rules: result.retentionRules as RetentionRuleSet,
      floors: RETENTION_FLOORS,
    },
    { status: 200 },
  );
}
