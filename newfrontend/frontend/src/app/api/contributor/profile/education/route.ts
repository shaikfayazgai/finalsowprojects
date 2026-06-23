/**
 * GET/POST /api/contributor/profile/education — list + add education
 * (a gating section for profile completion). Proxies to the freelancer backend.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/education");
}
export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/profile/education");
}
