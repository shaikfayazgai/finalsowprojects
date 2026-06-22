/** POST /api/contributor/mentorship/opt-in — proxied to the real backend. */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/contributor/mentorship/opt-in");
}
