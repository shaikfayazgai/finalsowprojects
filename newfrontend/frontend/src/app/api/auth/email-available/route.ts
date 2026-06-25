/**
 * GET /api/auth/email-available?email=... — proxied to the standalone backend.
 *
 * Wraps the backend's public pre-signup existence check
 * (GET /api/v1/auth/email-available) which returns { available, exists }.
 *
 * Used by the login screens to decide, AFTER a failed email/password sign-in,
 * whether the failure was "no such account" (→ send to sign-up) vs "wrong
 * password for an existing account" (→ keep the invalid-credentials error).
 * The backend's /login + /validate return an identical generic 401 for both
 * cases (anti-enumeration), so this dedicated endpoint is the only safe signal.
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/auth/email-available");
}
