/**
 * GET /api/reviewer/profile — real reviewer identity for the profile page.
 * Proxies (session-authenticated) to BE GET /api/v1/reviewer/profile →
 * { name, email, role, roleLabel, title, workspace, joinedAt, stats }.
 */
import { reviewerBackendProxy } from "@/lib/api/reviewer-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return reviewerBackendProxy("/api/v1/reviewer/profile");
}
