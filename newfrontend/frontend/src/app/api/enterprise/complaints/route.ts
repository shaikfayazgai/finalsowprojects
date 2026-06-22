import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Enterprise Complaints — submit a complaint / contact the platform admin,
 * and list the tenant's own complaints (to track resolution status).
 * Proxies to backend `/api/v1/enterprise/complaints` (JWT injected server-side;
 * backend scopes to the caller's tenant).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/complaints");
}

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/complaints");
}
