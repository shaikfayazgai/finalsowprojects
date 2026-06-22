/**
 * GET /api/reviewer/notifications — the reviewer's notification feed.
 * Proxies (session-authenticated) to BE GET /api/v1/reviewer/notifications →
 * { items: ReviewerNotification[], total, unread }.
 */
import { reviewerBackendProxy } from "@/lib/api/reviewer-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return reviewerBackendProxy("/api/v1/reviewer/notifications");
}
