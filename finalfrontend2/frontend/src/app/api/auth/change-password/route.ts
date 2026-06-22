/**
 * POST /api/auth/change-password — proxied to the backend.
 * Sets a new password for the logged-in user. Used by the forced first-login
 * reset (default/temp password) — backend only checks the old password if one
 * is supplied, so { new_password } alone is valid for the forced flow.
 * Backend: POST /api/v1/auth/password/change (auth via injected session bearer).
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/auth/password/change");
}
