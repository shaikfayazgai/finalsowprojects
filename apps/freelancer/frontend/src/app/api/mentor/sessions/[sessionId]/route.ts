/**
 *   POST /api/mentor/sessions/:sessionId  → action endpoint (held / no_show / cancel)
 *   Body: { action: 'held' | 'no_show' | 'cancel', reason?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import {
  cancelSession,
  enrichSession,
  getSessionDetail,
  markSessionHeld,
  markSessionNoShow,
  MentorshipServiceError,
} from "@/lib/mentorship";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  action: z.enum(["held", "no_show", "cancel"]),
  reason: z.string().max(2000).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const ctx = await requireRequest({
    allowedRoles: ["mentor", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "read.mentorship_session"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:read.mentorship_session" },
      { status: 403 },
    );
  }

  try {
    const session = await prisma.$transaction(async (tx) => {
      const detail = await getSessionDetail(tx, sessionId);
      if (!detail) return null;
      if (detail.mentorId !== ctx.userId && ctx.role !== "admin" && ctx.role !== "super_admin") {
        throw new MentorshipServiceError("Forbidden", "forbidden");
      }
      return enrichSession(tx, detail);
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ session }, { status: 200 });
  } catch (err) {
    if (err instanceof MentorshipServiceError && err.code === "forbidden") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const ctx = await requireRequest({
    allowedRoles: ["mentor", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "hold.mentorship_session"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:hold.mentorship_session" },
      { status: 403 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const session = await prisma.$transaction(async (tx) => {
      let result;
      if (parsed.data.action === "held") {
        result = await markSessionHeld(tx, { sessionId, actorUserId: ctx.userId });
      } else if (parsed.data.action === "no_show") {
        result = await markSessionNoShow(tx, { sessionId, actorUserId: ctx.userId });
      } else {
        result = await cancelSession(tx, {
          sessionId,
          actorUserId: ctx.userId,
          reason: parsed.data.reason,
        });
      }
      await ctx.audit(
        {
          tenantId: result.tenantId,
          action: `mentorship.session.${parsed.data.action}`,
          resource: { type: "mentorship_session", id: sessionId },
          payload: { reason: parsed.data.reason ?? null },
          severity: parsed.data.action === "cancel" ? "warning" : "info",
        },
        { tx },
      );
      return result;
    });
    return NextResponse.json({ session }, { status: 200 });
  } catch (err) {
    if (err instanceof MentorshipServiceError) {
      const status =
        err.code === "not_found" ? 404 :
        err.code === "forbidden" ? 403 :
        err.code === "invalid_state" || err.code === "validation" ? 400 : 500;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    // eslint-disable-next-line no-console
    console.error("[mentor.sessions.action]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
