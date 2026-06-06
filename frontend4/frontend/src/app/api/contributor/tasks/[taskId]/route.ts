/**
 * GET /api/contributor/tasks/:taskId
 *
 * Returns full task detail for a task the caller is assigned to.
 * Refuses with 404 if the task isn't theirs (RLS would also block it
 * via the tenant scope but contributors are cross-tenant, so we filter
 * by assignedContributorId).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  if (!taskId) return NextResponse.json({ error: "Missing taskId" }, { status: 400 });

  const ctx = await requireRequest();
  if (ctx instanceof NextResponse) return ctx;

  const task = await prisma.taskDefinition.findFirst({
    where: { id: taskId, assignedContributorId: ctx.userId },
    include: {
      plan: {
        select: {
          id: true,
          version: true,
          sow: {
            select: {
              id: true,
              title: true,
              tenant: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      },
      milestone: { select: { id: true, name: true, description: true, order: true } },
      submissions: {
        where: { contributorId: ctx.userId, deletedAt: null },
        orderBy: { version: "desc" },
        include: {
          artifacts: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      task: {
        id: task.id,
        title: task.title,
        externalKey: task.externalKey,
        description: task.description,
        status: task.status,
        requiredSkills: task.requiredSkills,
        estimatedHours: task.estimatedHours,
        complexity: task.complexity,
        acceptanceCriteria: task.acceptanceCriteria,
        agreedRatePerHour: task.agreedRatePerHour,
        agreedCurrency: task.agreedCurrency,
        assignedAt: task.assignedAt?.toISOString() ?? null,
        acceptedAt: task.acceptedAt?.toISOString() ?? null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        plan: task.plan,
        milestone: task.milestone,
        sow: task.plan?.sow
          ? {
              id: task.plan.sow.id,
              title: task.plan.sow.title,
              tenantId: task.plan.sow.tenant?.id,
              tenantName: task.plan.sow.tenant?.name,
              tenantSlug: task.plan.sow.tenant?.slug,
            }
          : null,
        submissions: task.submissions.map((s) => ({
          id: s.id,
          version: s.version,
          status: s.status,
          body: s.body,
          payload: s.payload,
          submittedAt: s.submittedAt?.toISOString() ?? null,
          decidedAt: s.decidedAt?.toISOString() ?? null,
          decisionRationale: s.decisionRationale,
          artifacts: s.artifacts.map((a) => ({
            id: a.id,
            kind: a.kind,
            name: a.name,
            url: a.url,
            mimeType: a.mimeType,
            sizeBytes: a.sizeBytes,
            caption: a.caption,
            scanCleared: a.scanCleared,
            scanAttemptedAt: a.scanAttemptedAt?.toISOString() ?? null,
            scanError: a.scanError,
            createdAt: a.createdAt.toISOString(),
          })),
        })),
      },
    },
    { status: 200 },
  );
}
