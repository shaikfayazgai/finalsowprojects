/**
 *   PATCH  /api/mentor/notes/:noteId  → edit (author only)
 *   DELETE /api/mentor/notes/:noteId  → soft delete (author only)
 *
 * Proxies the mentor FastAPI service (`/api/mentor/notes/:id`).
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRequest } from "@/lib/api/request-context";
import { callMentorBackend } from "@/lib/api/mentor-backend";
import { adaptNote, type BackendNote } from "../adapt";

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

  const ctx = await requireRequest({ allowedRoles: ["mentor", "admin", "super_admin"] });
  if (ctx instanceof NextResponse) return ctx;

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

  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  const res = await callMentorBackend<{ note?: BackendNote }>(
    token,
    `/api/mentor/notes/${encodeURIComponent(noteId)}`,
    { method: "PATCH", body: parsed.data },
  );
  if (res.status === 404) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  if (res.status === 403) return NextResponse.json({ error: "Forbidden: not your note" }, { status: 403 });
  if (!res.ok || !res.data?.note) {
    return NextResponse.json({ error: "Could not update the note." }, { status: res.status || 500 });
  }
  return NextResponse.json({ note: adaptNote(res.data.note) }, { status: 200 });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const { noteId } = await params;
  if (!noteId) return NextResponse.json({ error: "Missing noteId" }, { status: 400 });

  const ctx = await requireRequest({ allowedRoles: ["mentor", "admin", "super_admin"] });
  if (ctx instanceof NextResponse) return ctx;

  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  const res = await callMentorBackend<{ deleted?: boolean }>(
    token,
    `/api/mentor/notes/${encodeURIComponent(noteId)}`,
    { method: "DELETE" },
  );
  if (res.status === 404) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  if (res.status === 403) return NextResponse.json({ error: "Forbidden: not your note" }, { status: 403 });
  if (!res.ok) {
    return NextResponse.json({ error: "Could not delete the note." }, { status: res.status || 500 });
  }
  return NextResponse.json({ deleted: true }, { status: 200 });
}
