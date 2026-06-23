/**
 * GET/POST /api/contributor/profile/experience — list + add work experience
 * (a gating section for profile completion). Proxies to the freelancer backend.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/experience");
}
export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/experience");
}
