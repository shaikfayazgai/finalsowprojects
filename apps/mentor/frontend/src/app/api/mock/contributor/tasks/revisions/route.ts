/**
 * Mock backend — revisions queue. Joins tasks in `revisions_requested`
 * status with their latest submission so the page can render counts +
 * "ready to resubmit" hero.
 */

import { NextResponse } from "next/server";
import { MOCK_TASKS } from "@/mocks/contributor/tasks";
import { MOCK_SUBMISSIONS } from "@/mocks/contributor/submissions";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const items = MOCK_TASKS
    .filter((t) => t.status === "feedback_requested" || t.status === "resubmitted")
    .map((t) => {
      const submission = MOCK_SUBMISSIONS.find((s) => s.taskId === t.id);
      if (!submission || !submission.feedback) return null;
      const corrections = submission.feedback.requiredCorrections;
      const addressed = corrections.filter((c) => c.addressed).length;
      return {
        task: t,
        submission,
        readyToResubmit: corrections.length > 0 && addressed === corrections.length,
        correctionsTotal: corrections.length,
        correctionsAddressed: addressed,
      };
    })
    .filter(Boolean);
  return NextResponse.json({ items, total: items.length });
}
