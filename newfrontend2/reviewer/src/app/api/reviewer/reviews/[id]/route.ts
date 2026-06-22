/**
 * GET /api/reviewer/reviews/[id] — a single QA queue item.
 * Proxies to BE GET /api/v1/reviewer/queue/{id} → { review: MockReviewerItem }.
 */
import { reviewerBackendProxy } from "@/lib/api/reviewer-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return reviewerBackendProxy(`/api/v1/reviewer/queue/${encodeURIComponent(id)}`);
}
