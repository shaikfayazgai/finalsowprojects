/**
 * GET /api/contributor/tasks
 *
 * Lists the contributor's own assigned tasks across all tenants.
 * Permission: read.submission (covers contributor self-view of their
 * task feed). Contributors are cross-tenant; this endpoint uses
 * requireRequest (no tenant binding).
 *
 * Query params:
 *   - status: filter by TaskDefinition.status (matched|in_progress|submitted|reviewed|accepted|cancelled)
 *   - limit: max 100
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ctx = await requireRequest();
  if (ctx instanceof NextResponse) return ctx;

  const url = new URL(req.url);
  const statusParams = url.searchParams.getAll("status");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "50"), 1), 100);

  const tasks = await prisma.taskDefinition.findMany({
    where: {
      assignedContributorId: ctx.userId,
      ...(statusParams.length > 0 ? { status: { in: statusParams } } : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    take: limit,
    include: {
      plan: {
        select: {
          sow: { select: { id: true, title: true, tenant: { select: { id: true, name: true, slug: true } } } },
        },
      },
      milestone: { select: { id: true, name: true } },
      submissions: {
        where: { contributorId: ctx.userId, deletedAt: null },
        orderBy: { version: "desc" },
        take: 1,
        select: { id: true, version: true, status: true, submittedAt: true, decidedAt: true },
      },
    },
  });

  const items = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    externalKey: t.externalKey,
    status: t.status,
    requiredSkills: t.requiredSkills,
    estimatedHours: t.estimatedHours,
    complexity: t.complexity,
    acceptanceCriteria: t.acceptanceCriteria,
    agreedRatePerHour: t.agreedRatePerHour,
    agreedCurrency: t.agreedCurrency,
    assignedAt: t.assignedAt?.toISOString() ?? null,
    acceptedAt: t.acceptedAt?.toISOString() ?? null,
    updatedAt: t.updatedAt.toISOString(),
    sow: t.plan?.sow
      ? {
          id: t.plan.sow.id,
          title: t.plan.sow.title,
          tenantId: t.plan.sow.tenant?.id,
          tenantName: t.plan.sow.tenant?.name,
          tenantSlug: t.plan.sow.tenant?.slug,
        }
      : null,
    milestone: t.milestone,
    latestSubmission: t.submissions[0]
      ? {
          id: t.submissions[0].id,
          version: t.submissions[0].version,
          status: t.submissions[0].status,
          submittedAt: t.submissions[0].submittedAt?.toISOString() ?? null,
          decidedAt: t.submissions[0].decidedAt?.toISOString() ?? null,
        }
      : null,
  }));

  return NextResponse.json({ items }, { status: 200 });
}
