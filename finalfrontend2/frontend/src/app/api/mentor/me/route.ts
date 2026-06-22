import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/mentor/me  — proxied to real backend GET /api/v1/mentor/me.
 * Returns { profile, role, isSeniorOrLead, onboardingComplete }.
 */
export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/mentor/me");
}

/**
 * POST /api/mentor/me  — mark onboarding complete. Proxied straight to the real
 * backend (which authenticates via the injected session bearer). No Prisma /
 * local-store dependency — those caused a 500 when no DATABASE_URL is set.
 */
export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/v1/mentor/me");
}
