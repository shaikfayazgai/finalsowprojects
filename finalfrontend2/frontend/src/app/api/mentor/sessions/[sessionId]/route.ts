/**
 *   GET  /api/mentor/sessions/:sessionId  → session detail
 *   POST /api/mentor/sessions/:sessionId  → session action (held | no_show | cancel | reschedule)
 *
 *   Proxied to mentor backend :8101  /api/mentor/sessions/{sessionId}
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
