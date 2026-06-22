/**
 * Mentor availability settings — persisted (was in-memory). Proxies to the
 * shared account-settings store: /api/v1/prefs/mentor_availability.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/prefs/mentor_availability");
}

export async function PATCH(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/prefs/mentor_availability");
}
