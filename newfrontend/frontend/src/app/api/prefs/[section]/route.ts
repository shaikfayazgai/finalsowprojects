/**
 * Generic per-account settings proxy → the backend account-settings store.
 *   GET   /api/prefs/{section}  → that section's saved object ({} if unset)
 *   PATCH /api/prefs/{section}  → shallow-merge + persist
 * Used by every role's settings page (admin_notifications, ent_security,
 * reviewer_notifications, …). Account-scoped server-side via the JWT.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ section: string }> },
) {
  const { section } = await params;
  return proxyToBackendService(req, `/api/v1/prefs/${encodeURIComponent(section)}`);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ section: string }> },
) {
  const { section } = await params;
  return proxyToBackendService(req, `/api/v1/prefs/${encodeURIComponent(section)}`);
}
