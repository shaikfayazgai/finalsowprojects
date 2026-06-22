/**
 *   GET   /api/mentor/profile  → read mentor profile
 *   PATCH /api/mentor/profile  → update mentor profile fields
 *
 *   Proxied to mentor backend :8101  /api/mentor/profile
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/mentor/profile");
}

export async function PATCH(req: NextRequest) {
  return proxyToBackendService(req, "/api/mentor/profile");
}
