/**
 * GET /api/reviewer/reviews — the reviewer's open QA queue.
 * Proxies (with the session bearer) to BE GET /api/v1/reviewer/queue, which
 * already returns the { items: MockReviewerItem[], total } shape the UI expects.
 */
import { reviewerBackendProxy } from "@/lib/api/reviewer-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return reviewerBackendProxy("/api/v1/reviewer/queue");
}
