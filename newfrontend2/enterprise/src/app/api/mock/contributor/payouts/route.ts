/**
 * Mock backend — paginated payout list for the earnings history page.
 * Each row is annotated with the originating task's project name so the
 * client doesn't have to cross-reference task mocks.
 */

import { NextResponse } from "next/server";
import { MOCK_PAYOUTS } from "@/mocks/contributor/payouts";
import { MOCK_TASKS } from "@/mocks/contributor/tasks";

const SIMULATED_LATENCY_MS = 220;

export async function GET(req: Request) {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));

  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "25")));

  const sorted = [...MOCK_PAYOUTS].sort(
    (a, b) => new Date(b.paidAt ?? b.eligibleAt).getTime() - new Date(a.paidAt ?? a.eligibleAt).getTime(),
  );
  const annotated = sorted.map((p) => ({
    ...p,
    project: MOCK_TASKS.find((t) => t.id === p.taskId)?.sow.tenantName ?? "—",
  }));

  const total = annotated.length;
  const start = (page - 1) * limit;
  const items = annotated.slice(start, start + limit);

  return NextResponse.json({ items, total, page, limit });
}
