/**
 * Mock backend — completed task detail, joined with submission + payout +
 * credential to keep the page render path simple.
 */

import { NextResponse } from "next/server";
import { getMockTask } from "@/mocks/contributor/tasks";
import { MOCK_SUBMISSIONS } from "@/mocks/contributor/submissions";
import { MOCK_PAYOUTS } from "@/mocks/contributor/payouts";
import { MOCK_CREDENTIALS } from "@/mocks/contributor/credentials";

const SIMULATED_LATENCY_MS = 220;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const task = getMockTask(id);
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({
    task,
    submission: MOCK_SUBMISSIONS.find((s) => s.taskId === id) ?? null,
    payout: MOCK_PAYOUTS.find((p) => p.taskId === id) ?? null,
    credential: MOCK_CREDENTIALS.find((c) => c.taskId === id) ?? null,
  });
}
