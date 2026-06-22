/**
 * Enterprise acceptance / rework decision endpoint.
 *
 * The persistence half of the Phase 1B closure lifecycle. The unified
 * task store in the browser holds live operational state; this route
 * writes the audit-grade decision record that survives logout, cross-
 * device usage, and DB-level compliance reads.
 *
 * Request body:
 *   { decision: "accept", note?: string }
 *   { decision: "rework", reason: string }
 *
 * Response:
 *   200 → { id, decidedAt }
 *   400 → invalid body
 *   401 → unauthenticated / session invalid
 *   403 → no tenant context / insufficient role / tenant paused
 *   500 → persistence failure
 *
 * Phase 1 foundation chain (post-conversion):
 *   - validateSession() durable check
 *   - resolveTenantForUser() tenant binding
 *   - setTransactionTenant() inside withTx → RLS enforces tenant scope
 *   - auditEmit() inside same tx → atomic decision+audit
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireTenantRequest, requireRequest } from "@/lib/api/request-context";
import { dispatchNotification } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const acceptBody = z.object({
  decision: z.literal("accept"),
  note: z.string().max(2000).optional(),
  deciderInitials: z.string().max(8).optional(),
  /**
   * Contributor's User.id — recipient of the resulting notification.
   * Optional because the Task model isn't in Postgres yet (M9 pending);
   * when M9 lands we'll resolve from `task.contributorUserId` server-side
   * and stop trusting the client value.
   */
  recipientUserId: z.string().min(1).max(64).optional(),
  /** Display label for the task — used in notification copy. */
  taskTitle: z.string().max(200).optional(),
});

const reworkBody = z.object({
  decision: z.literal("rework"),
  reason: z.string().min(1, "Rework reason is required").max(2000),
  deciderInitials: z.string().max(8).optional(),
  recipientUserId: z.string().min(1).max(64).optional(),
  taskTitle: z.string().max(200).optional(),
});

const bodySchema = z.union([acceptBody, reworkBody]);

/* ─────────────────────────── POST ──────────────────────────────────── */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  }

  // Auth + tenant + role gate in one call. Tenant is required for writes.
  const ctx = await requireTenantRequest({
    allowedRoles: ["enterprise", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  // Body validation
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
  const body = parsed.data;

  // Persist + audit atomically. RLS enforces the new row's tenantId
  // matches the bound tenant; auditEmit shares the same tx so a failed
  // audit rolls back the decision.
  try {
    const decision = await ctx.withTx(async (tx) => {
      const created = await tx.acceptanceDecision.create({
        data: {
          taskId,
          decision: body.decision,
          note:
            body.decision === "accept"
              ? (body.note ?? null)
              : body.reason,
          deciderId: ctx.userId,
          deciderInitials: body.deciderInitials ?? null,
          tenantId: ctx.tenant.id,
        },
        select: { id: true, decidedAt: true },
      });

      await ctx.audit(
        {
          action:
            body.decision === "accept"
              ? "task.accept"
              : "task.rework",
          resource: {
            type: "task",
            id: taskId,
            label: body.taskTitle ?? `Task ${taskId}`,
          },
          payload: {
            decisionId: created.id,
            decision: body.decision,
            note: body.decision === "accept" ? body.note : body.reason,
            deciderInitials: body.deciderInitials ?? null,
          },
          severity: "info",
        },
        { tx },
      );

      // Best-effort notification to the contributor. Failure here MUST
      // NOT break the primary acceptance action — wrap in try/catch and
      // log on failure. When M9 lands, recipientUserId comes from the
      // Task row server-side and this becomes mandatory + atomic.
      if (body.recipientUserId) {
        try {
          await dispatchNotification(
            {
              recipientUserId: body.recipientUserId,
              tenantId: ctx.tenant.id,
              kind:
                body.decision === "accept"
                  ? "task.accepted_final"
                  : "task.revision_requested",
              title:
                body.decision === "accept"
                  ? `Your task was accepted${body.taskTitle ? ` — ${body.taskTitle}` : ""}`
                  : `Revision requested${body.taskTitle ? ` on ${body.taskTitle}` : ""}`,
              body:
                body.decision === "accept"
                  ? (body.note ??
                    "Your delivery passed enterprise review. Payout is now eligible.")
                  : body.reason,
              actionUrl: `/contributor/tasks/${taskId}`,
              actionLabel: "Open task",
              resourceType: "task",
              resourceId: taskId,
            },
            {
              tx,
              actor: {
                userId: ctx.userId,
                portalRole: ctx.role,
                sessionId: ctx.sessionId,
                ipAddress: ctx.ipAddress,
                userAgent: ctx.userAgent,
              },
            },
          );
        } catch (notifErr) {
          // eslint-disable-next-line no-console
          console.warn(
            "[acceptance.POST] notification dispatch failed; continuing",
            {
              recipientUserId: body.recipientUserId,
              decision: body.decision,
              error:
                notifErr instanceof Error
                  ? notifErr.message
                  : String(notifErr),
            },
          );
        }
      }

      return created;
    });

    return NextResponse.json(
      { id: decision.id, decidedAt: decision.decidedAt.toISOString() },
      { status: 200 },
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[acceptance.POST] persistence failure", err);
    return NextResponse.json(
      { error: "Failed to persist decision" },
      { status: 500 },
    );
  }
}

/* ─────────────────────────── GET ───────────────────────────────────── */

/**
 * Decision history for one task, newest first.
 *
 * Tenant context is required so RLS filters rows correctly. Mentors
 * (cross-tenant) reading task history will need a future variant that
 * resolves tenant from the task itself; Phase 1 limits this endpoint
 * to tenant-bound enterprise users.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const { taskId } = await params;

  // For now: tenant-bound enterprise users only. Mentor read path will
  // come when M9 (decomposition + Task model) lands and we can derive
  // tenant from task.tenantId.
  const ctx = await requireTenantRequest({
    allowedRoles: ["enterprise", "admin", "super_admin", "reviewer"],
  });
  if (ctx instanceof NextResponse) return ctx;

  // Use a tenant-bound query — RLS guarantees only this tenant's decisions
  // return even if the query somehow omitted a WHERE tenantId clause.
  // (Belt-and-suspenders: the explicit WHERE is still here.)
  try {
    const decisions = await ctx.withTx(async (tx) => {
      return tx.acceptanceDecision.findMany({
        where: { taskId, tenantId: ctx.tenant.id },
        orderBy: { decidedAt: "desc" },
        take: 20,
        select: {
          id: true,
          decision: true,
          note: true,
          deciderInitials: true,
          decidedAt: true,
        },
      });
    });

    return NextResponse.json({ decisions }, { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[acceptance.GET] history read failure", err);
    return NextResponse.json(
      { error: "Failed to load decision history" },
      { status: 500 },
    );
  }
}

// `requireRequest` is imported above for parity with the request-context
// helper API but unused here intentionally — kept as a hint to future
// route authors who may want the non-tenant variant.
void requireRequest;
