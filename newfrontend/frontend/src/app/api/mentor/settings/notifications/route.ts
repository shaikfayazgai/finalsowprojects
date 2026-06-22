/**
 * Mentor notification settings — persisted (was in-memory). Proxies to the
 * shared account-settings store: /api/v1/prefs/mentor_notifications.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/prefs/mentor_notifications");
}

export async function PATCH(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/prefs/mentor_notifications");
}
