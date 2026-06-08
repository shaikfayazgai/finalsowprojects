/**
 *   GET  /api/mentor/sessions    → list mentor's sessions (filters via query)
 *   POST /api/mentor/sessions    → schedule a new session
 *
 * Both gated by mentor.* / admin role + schedule.mentorship_session permission.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import {
  enrichSessions,
  listSessionsForMentor,
  MentorshipServiceError,
  scheduleSession,
  type SessionStatus,
} from "@/lib/mentorship";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createBody = z.object({
  contributorId: z.string().min(1),
  tenantId: z.string().min(1).nullish(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().min(1).max(480).optional(),
  agenda: z.string().max(5000).optional(),
  meetingLink: z.string().max(2000).optional(),
  timezone: z.string().max(100).optional(),
});

export async function GET(req: NextRequest) {
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

  const url = new URL(req.url);
  const statusParams = url.searchParams.getAll("status") as SessionStatus[];
  const upcomingOnly = url.searchParams.get("upcomingOnly") === "true";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? "50"), 1), 100);

  const items = await prisma.$transaction(async (tx) => {
    const sessions = await listSessionsForMentor(tx, {
      mentorUserId: ctx.userId,
      statuses: statusParams.length > 0 ? statusParams : undefined,
      upcomingOnly,
      limit,
    });
    return enrichSessions(tx, sessions);
  });
  return NextResponse.json({ items, total: items.length }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const ctx = await requireRequest({
    allowedRoles: ["mentor", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "schedule.mentorship_session"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:schedule.mentorship_session" },
      { status: 403 },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = createBody.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const session = await prisma.$transaction(async (tx) => {
      const s = await scheduleSession(tx, {
        createdBy: ctx.userId,
        input: {
          ...parsed.data,
          mentorId: ctx.userId,
          tenantId: parsed.data.tenantId ?? undefined,
        },
      });
      await ctx.audit(
        {
          tenantId: s.tenantId,
          action: "mentorship.session.schedule",
          resource: { type: "mentorship_session", id: s.id, label: s.agenda ?? "Session" },
          payload: {
            contributorId: s.contributorId,
            scheduledAt: s.scheduledAt,
            durationMinutes: s.durationMinutes,
          },
          severity: "info",
        },
        { tx },
      );
      return s;
    });
    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    if (err instanceof MentorshipServiceError) {
      const status =
        err.code === "not_found" ? 404 :
        err.code === "forbidden" ? 403 :
        err.code === "validation" || err.code === "invalid_state" ? 400 : 500;
      return NextResponse.json({ error: err.message, code: err.code }, { status });
    }
    // eslint-disable-next-line no-console
    console.error("[mentor.sessions.POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
