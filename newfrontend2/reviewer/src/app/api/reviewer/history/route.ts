/**
 * GET /api/reviewer/history — completed QA decisions + 30-day metrics.
 * Proxies to BE GET /api/v1/reviewer/history → { items, total, metrics },
 * matching the HistoryResponse shape the history + metrics pages consume.
 */
import { reviewerBackendProxy } from "@/lib/api/reviewer-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return reviewerBackendProxy("/api/v1/reviewer/history");
}
