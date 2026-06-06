/**
 *   PATCH  /api/mentor/notes/:noteId  → edit (author only)
 *   DELETE /api/mentor/notes/:noteId  → soft delete (author only)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import {
  MentorshipServiceError,
  softDeleteCoachingNote,
  updateCoachingNote,
} from "@/lib/mentorship";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const body = z.object({
  body: z.string().min(1).max(10_000).optional(),
  visibility: z.enum(["private", "shared", "public"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const { noteId } = await params;
  if (!noteId) return NextResponse.json({ error: "Missing noteId" }, { status: 400 });

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
      const u = await updateCoachingNote(tx, {
        noteId,
        actorUserId: ctx.userId,
        body: parsed.data.body,
        visibility: parsed.data.visibility,
      });
      await ctx.audit(
        {
          tenantId: u.tenantId,
          action: "mentorship.note.update",
          resource: { type: "mentorship_note", id: u.id },
          payload: { changed: Object.keys(parsed.data) },
          severity: "info",
        },
        { tx },
      );
      return u;
    });
    return NextResponse.json({ note }, { status: 200 });
  } catch (err) {
    return mapErr(err, "[mentor.notes.PATCH]");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const { noteId } = await params;
  if (!noteId) return NextResponse.json({ error: "Missing noteId" }, { status: 400 });

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

  try {
    await prisma.$transaction(async (tx) => {
      await softDeleteCoachingNote(tx, { noteId, actorUserId: ctx.userId });
      await ctx.audit(
        {
          tenantId: null,
          action: "mentorship.note.delete",
          resource: { type: "mentorship_note", id: noteId },
          payload: {},
          severity: "info",
        },
        { tx },
      );
    });
    return NextResponse.json({ deleted: true }, { status: 200 });
  } catch (err) {
    return mapErr(err, "[mentor.notes.DELETE]");
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
