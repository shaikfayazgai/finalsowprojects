/**
 * Mock backend — single task with its latest submission attached when present.
 */

import { NextResponse } from "next/server";
import { getMockTask } from "@/mocks/contributor/tasks";
import { getMockSubmissionForTask } from "@/mocks/contributor/submissions";

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
  const submission = getMockSubmissionForTask(id) ?? null;
  return NextResponse.json({ task, submission });
}
