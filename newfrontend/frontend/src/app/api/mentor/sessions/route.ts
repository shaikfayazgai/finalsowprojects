/**
 *   GET  /api/mentor/sessions    → list the mentor's sessions (filters via query)
 *   POST /api/mentor/sessions    → schedule a new session
 *
 * Proxies to the real mentor backend (`/api/mentor/sessions`, notes_sessions
 * router) which reads/writes the `mentor_sessions` table and returns the
 * enriched SessionDetailEnriched shape. No Prisma, no mock — the backend JWT is
 * bridged from the NextAuth session by the proxy.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return proxyToBackendService(req, "/api/mentor/sessions");
}

export async function POST(req: NextRequest) {
  return proxyToBackendService(req, "/api/mentor/sessions");
}
