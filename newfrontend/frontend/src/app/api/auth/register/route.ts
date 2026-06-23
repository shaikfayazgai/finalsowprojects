/**
 * POST /api/auth/register — freelancer (contributor) self-signup. Proxies to the
 * backend's contributor register endpoint (/api/v1/auth/register/contributor),
 * which honours the `track` field (freelancer / women / student). The bare
 * /api/v1/auth/register path does not exist on the backend (404).
 */

import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/auth/register/contributor");
}
