/**
 * Mock backend — earnings summary used by the overview page.
 * Returns withdrawable balance + 3-window KPIs + pending + recent.
 */

import { NextResponse } from "next/server";
import { MOCK_PAYOUTS, withdrawableMinor } from "@/mocks/contributor/payouts";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));

  const now = Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  const thisWeek = MOCK_PAYOUTS
    .filter((p) => p.paidAt && new Date(p.paidAt).getTime() >= weekAgo)
    .reduce((a, p) => a + p.amountMinor, 0);
  const thisMonth = MOCK_PAYOUTS
    .filter((p) => p.paidAt && new Date(p.paidAt).getTime() >= monthStart)
    .reduce((a, p) => a + p.amountMinor, 0);
  const allTime = MOCK_PAYOUTS
    .filter((p) => p.status === "paid")
    .reduce((a, p) => a + p.amountMinor, 0);

  const pending = MOCK_PAYOUTS.filter((p) => p.status === "pending" || p.status === "eligible");
  const recent = [...MOCK_PAYOUTS]
    .filter((p) => p.status === "paid")
    .sort((a, b) => new Date(b.paidAt ?? 0).getTime() - new Date(a.paidAt ?? 0).getTime())
    .slice(0, 5);

  return NextResponse.json({
    withdrawableMinor: withdrawableMinor(),
    kpis: { thisWeekMinor: thisWeek, thisMonthMinor: thisMonth, allTimeMinor: allTime },
    pending,
    recent,
  });
}
