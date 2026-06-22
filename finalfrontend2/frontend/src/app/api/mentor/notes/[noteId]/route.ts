/**
 *   PATCH  /api/mentor/notes/:noteId  → edit (author only)
 *   DELETE /api/mentor/notes/:noteId  → soft delete (author only)
 *
 *   Proxied to mentor backend :8101  /api/mentor/notes/{noteId}
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const { noteId } = await params;
  return proxyToBackendService(req, `/api/mentor/notes/${encodeURIComponent(noteId)}`);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> },
) {
  const { noteId } = await params;
  return proxyToBackendService(req, `/api/mentor/notes/${encodeURIComponent(noteId)}`);
}
