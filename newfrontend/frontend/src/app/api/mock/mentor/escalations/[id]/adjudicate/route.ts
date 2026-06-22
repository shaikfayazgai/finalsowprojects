/**
 * POST /api/mock/mentor/escalations/:id/adjudicate
 *
 * Proxies to the real mentor backend
 * (`/api/mentor/portal/escalations/:id/adjudicate`), which resolves the
 * escalation (status='resolved'), appends the adjudication to its timeline, and
 * writes an audit event. No mock.
 */
import { NextRequest } from "next/server";
import { proxyToBackendService } from "@/lib/api/backend-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyToBackendService(
    req,
    `/api/mentor/portal/escalations/${encodeURIComponent(id)}/adjudicate`,
  );
}
