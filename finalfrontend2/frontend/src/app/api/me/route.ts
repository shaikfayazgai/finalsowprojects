import { NextRequest, NextResponse } from "next/server";
import { buildLocalMeResponse } from "@/lib/api/me-local";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // The backend exposes the current user at /api/v1/auth/me (not /api/v1/me).
  const proxied = await proxyToBackendService(req, "/api/v1/auth/me");
  if (proxied.ok) return proxied;

  // Fall back to a locally-derived me-response on ANY upstream failure (4xx/5xx)
  // so the portal shell renders instead of retry-looping on a 404.
  const local = await buildLocalMeResponse();
  if (local) return NextResponse.json(local);

  return proxied;
}
