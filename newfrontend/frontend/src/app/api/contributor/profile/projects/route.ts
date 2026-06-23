/**
 * GET/POST /api/contributor/profile/projects — list + add portfolio projects
 * (one of the gating sections for profile completion). Proxies to the freelancer
 * backend; auth token injected by the proxy.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/projects");
}
export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/projects");
}
