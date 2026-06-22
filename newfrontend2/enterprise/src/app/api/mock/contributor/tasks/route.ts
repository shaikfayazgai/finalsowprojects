/**
 * Mock backend — task list filtered by status.
 *
 * Accepts ?status=assigned|in_progress|under_review|revisions|completed
 * (comma-separated for multiple). Default returns everything.
 */

import { NextResponse } from "next/server";
import { MOCK_TASKS } from "@/mocks/contributor/tasks";

const SIMULATED_LATENCY_MS = 220;

const STATUS_GROUPS: Record<string, string[]> = {
  assigned:     ["matched", "assigned", "accepted"],
  in_progress:  ["in_progress"],
  under_review: ["under_review"],
  revisions:    ["revisions_requested"],
  completed:    ["completed"],
};

export async function GET(req: Request) {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status");
  const groups = statusParam ? statusParam.split(",").map((s) => s.trim()).filter(Boolean) : [];

  let items = MOCK_TASKS;
  if (groups.length > 0) {
    const allowed = new Set<string>();
    for (const g of groups) (STATUS_GROUPS[g] ?? [g]).forEach((s) => allowed.add(s));
    items = items.filter((t) => allowed.has(t.status));
  }

  return NextResponse.json({ items, total: items.length });
}
