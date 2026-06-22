import { NextRequest, NextResponse } from "next/server";
import { buildLocalMeResponse } from "@/lib/api/me-local";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // The super-admin backend mounts auth at /api/v1/auth (so /me → /api/v1/auth/me).
  // It returns role + a `roles` array (enterprise tenant admin → admin) + tenant,
  // which the per-portal RBAC reads.
  const proxied = await proxyToBackendService(req, "/api/v1/auth/me");
  if (proxied.status < 500 && proxied.status !== 404) return proxied;

  const local = await buildLocalMeResponse();
  if (local) return NextResponse.json(local);

  return proxied;
}
