/**
 *   PATCH /api/mentor/settings/availability
 *
 *   Proxied to mentor backend :8101  PATCH /api/mentor/settings
 *   The backend stores arbitrary JSON in the mentor_profiles.settings JSONB column.
 *   The availability payload is forwarded as-is; the backend merges it into settings.
 */

import { NextRequest, NextResponse } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  // Wrap the availability body into the { settings: {...} } shape the backend expects.
  let raw: Record<string, unknown> = {};
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const wrapped = JSON.stringify({ settings: { availability: raw } });

  // Build a new request with the wrapped body so proxyToBackendService forwards it.
  const proxied = new NextRequest(req.url, {
    method: "PATCH",
    headers: req.headers,
    body: wrapped,
  });

  return proxyToBackendService(proxied, "/api/mentor/settings");
}
