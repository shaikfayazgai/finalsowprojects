import { NextRequest, NextResponse } from "next/server";
import { buildLocalMeResponse } from "@/lib/api/me-local";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const proxied = await proxyToBackendService(req, "/api/v1/me");
  if (proxied.status < 500) return proxied;

  const local = await buildLocalMeResponse();
  if (local) return NextResponse.json(local);

  return proxied;
}
