/**
 *   POST /api/mentor/notes    → write a coaching note
 *   Body: { sessionId? | contributorId, body, visibility, tenantId? }
 *
 * Permission: write.coaching_note. Service enforces session-ownership
 * when sessionId is supplied.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import {
  MentorshipServiceError,
  writeCoachingNote,
} from "@/lib/mentorship";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  sessionId: z.string().min(1).optional(),
  contributorId: z.string().min(1).optional(),
  body: z.string().min(1).max(10_000),
  visibility: z.enum(["private", "shared", "public"]),
  tenantId: z.string().min(1).nullish(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireRequest({
    allowedRoles: ["mentor", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "write.coaching_note"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:write.coaching_note" },
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
    const note = await prisma.$transaction(async (tx) => {
      const n = await writeCoachingNote(tx, {
        mentorUserId: ctx.userId,
        input: {
          sessionId: parsed.data.sessionId,
          contributorId: parsed.data.contributorId,
          body: parsed.data.body,
          visibility: parsed.data.visibility,
          tenantId: parsed.data.tenantId ?? undefined,
        },
      });
      await ctx.audit(
        {
          tenantId: n.tenantId,
          action: "mentorship.note.write",
          resource: { type: "mentorship_note", id: n.id },
          payload: {
            sessionId: n.sessionId,
            contributorId: n.contributorId,
            visibility: n.visibility,
          },
          severity: "info",
        },
        { tx },
      );
      return n;
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (err) {
    return mapErr(err, "[mentor.notes.POST]");
  }
}

function mapErr(err: unknown, tag: string): NextResponse {
  if (err instanceof MentorshipServiceError) {
    const status =
      err.code === "not_found" ? 404 :
      err.code === "forbidden" ? 403 :
      err.code === "validation" || err.code === "invalid_state" ? 400 : 500;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  // eslint-disable-next-line no-console
  console.error(tag, err);
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
