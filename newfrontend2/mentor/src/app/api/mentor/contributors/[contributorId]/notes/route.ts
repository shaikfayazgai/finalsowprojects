/**
 * GET /api/mentor/contributors/:contributorId/notes
 *
 * Coaching notes for a specific contributor, visibility-scoped from the caller's
 * perspective (shared + public + own private). Proxies the mentor FastAPI
 * service (`/api/mentor/contributors/:id/notes`).
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRequest } from "@/lib/api/request-context";
import { callMentorBackend } from "@/lib/api/mentor-backend";
import { adaptNote, type BackendNote } from "../../../notes/adapt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ contributorId: string }> },
) {
  const { contributorId } = await params;
  if (!contributorId) return NextResponse.json({ error: "Missing contributorId" }, { status: 400 });

  const ctx = await requireRequest({
    allowedRoles: ["mentor", "reviewer", "admin", "super_admin"],
  });
  if (ctx instanceof NextResponse) return ctx;

  const token = (ctx.session.user as { accessToken?: string }).accessToken;
  const res = await callMentorBackend<{ items?: BackendNote[] }>(
    token,
    `/api/mentor/contributors/${encodeURIComponent(contributorId)}/notes`,
  );
  if (!res.ok) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
  const items = (res.data?.items ?? []).map(adaptNote);
  return NextResponse.json({ items }, { status: 200 });
}
