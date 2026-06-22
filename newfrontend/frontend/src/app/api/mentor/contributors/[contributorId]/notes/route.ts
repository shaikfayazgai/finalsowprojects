/**
 * GET /api/mentor/contributors/:contributorId/notes
 *
 * Coaching notes for a specific contributor, visibility-scoped from
 * the mentor's perspective: the caller sees `shared` + `public` notes
 * (any mentor's) + their own `private` notes.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { userHasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { listNotesForContributor } from "@/lib/mentorship";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ contributorId: string }> },
) {
  const { contributorId } = await params;
  if (!contributorId) return NextResponse.json({ error: "Missing contributorId" }, { status: 400 });

  const ctx = await requireRequest({
    allowedRoles: ["reviewer", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  if (!(await userHasPermission(ctx.userId, "read.coaching_note"))) {
    return NextResponse.json(
      { error: "forbidden", reason: "missing_permission:read.coaching_note" },
      { status: 403 },
    );
  }

  const items = await prisma.$transaction((tx) =>
    listNotesForContributor(tx, {
      contributorUserId: contributorId,
      as: "mentor",
      mentorUserId: ctx.userId,
    }),
  );
  return NextResponse.json({ items }, { status: 200 });
}
