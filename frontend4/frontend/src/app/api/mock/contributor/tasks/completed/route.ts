/**
 * Mock backend — completed-tasks list. Joins task, payout, and credential
 * mocks server-side so the page just renders.
 */

import { NextResponse } from "next/server";
import { MOCK_TASKS } from "@/mocks/contributor/tasks";
import { MOCK_PAYOUTS } from "@/mocks/contributor/payouts";
import { MOCK_CREDENTIALS } from "@/mocks/contributor/credentials";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));
  const items = MOCK_TASKS
    .filter((t) => t.status === "completed")
    .map((t) => {
      const payout = MOCK_PAYOUTS.find((p) => p.taskId === t.id);
      const credential = MOCK_CREDENTIALS.find((c) => c.taskId === t.id);
      return {
        task: t,
        payoutMinor: payout?.amountMinor ?? Math.round(t.estimatedHours * t.agreedRatePerHour * 100),
        payoutStatus: payout?.status ?? "eligible",
        credentialId: credential?.id,
      };
    });
  const totalEarnedMinor = items.reduce((a, r) => a + r.payoutMinor, 0);
  return NextResponse.json({ items, total: items.length, totalEarnedMinor });
}
