import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

/**
 * Enterprise Team — list + create tenant members.
 * Proxies to the backend `/api/v1/enterprise/team` (the proxy injects the
 * admin's backend JWT). Backend scopes everything to the caller's tenant.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/team");
}

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/enterprise/team");
}
