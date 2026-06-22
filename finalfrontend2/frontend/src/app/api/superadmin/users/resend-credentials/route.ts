/**
 * POST /api/superadmin/users/resend-credentials
 * Super-admin action: regenerate a default/temp password for a provisioned
 * account, email it, and force must_change_password. Proxied to the backend
 * (admin auth enforced there via the injected session bearer).
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/superadmin/users/resend-credentials");
}
