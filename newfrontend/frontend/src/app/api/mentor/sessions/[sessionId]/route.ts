/**
 *   GET  /api/mentor/sessions/:sessionId  → session detail (enriched)
 *   POST /api/mentor/sessions/:sessionId  → action (held / no_show / cancel / reschedule)
 *
 * Proxies to the real mentor backend (`/api/mentor/sessions/:id`,
 * notes_sessions router). No Prisma, no mock — backend JWT bridged by the proxy.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  return proxyToBackendService(req, `/api/mentor/sessions/${encodeURIComponent(sessionId)}`);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  return proxyToBackendService(req, `/api/mentor/sessions/${encodeURIComponent(sessionId)}`);
}
