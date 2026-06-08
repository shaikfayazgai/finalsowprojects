/**
 * Mock backend — combined dashboard payload. One round-trip:
 *   pending count, SLA risk count, next-review hero, today sessions,
 *   open escalations, team-load (lead only — but always returned to keep
 *   the API shape stable; the page decides whether to render).
 */

import { NextResponse } from "next/server";
import { MOCK_SESSIONS, MOCK_ESCALATIONS, MOCK_TEAM_LOAD } from "@/mocks/mentor";
import { listOpenReviews } from "@/lib/mentor/runtime-store";

const SIMULATED_LATENCY_MS = 220;

export async function GET() {
  await new Promise((r) => setTimeout(r, SIMULATED_LATENCY_MS));

  const pending = listOpenReviews();
  const slaRisk = pending.filter((r) => r.slaTier === "critical" || r.slaTier === "warning" || r.slaTier === "breached");
  const hero = [...pending].sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())[0] ?? null;

  const today = new Date();
  const todaySessions = MOCK_SESSIONS.filter((s) => {
    const d = new Date(s.scheduledAt);
    return d.toDateString() === today.toDateString() && s.status === "scheduled";
  });

  const openEscalations = MOCK_ESCALATIONS.filter((e) => e.status === "open");

  return NextResponse.json({
    pendingCount: pending.length,
    slaRiskCount: slaRisk.length,
    hero,
    todaySessions,
    openEscalations,
    teamLoad: MOCK_TEAM_LOAD,
    queueGlance: {
      pending: pending.length,
      slaRisk: slaRisk.length,
      done7d: 18,
      avgTimeMin: 22,
    },
  });
}
