/**
 * Contributor Portal V2 — Completed Work archive mock.
 *
 * Powers `/contributor/tasks/completed` — the operational archive of
 * accepted submissions. Different from the recent-contributions slice
 * shown in earnings: this is the long-form, browsable, portfolio-ready
 * record.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

export interface CompletedWorkItem {
  id: string;
  taskId: string;
  title: string;
  shortSummary: string;
  project: string;
  portfolio: string;
  skill: string;
  skillLevel: "L1" | "L2" | "L3" | "L4";
  acceptedAt: string;
  payoutAmount: string;
  payoutReference?: string;
  rounds: number;
  mentor: { name: string; initials: string };
  whatWorked: string;
  credential?: { name: string; shareId?: string };
  portfolioEligible: boolean;
  portfolioShared?: boolean;
  evidenceCount: number;
  yearMonth: string; // "2026-05"
  firstTryAccept: boolean;
}

/* ─────────────────────── Canonical archive ─────────────────────── */

export const completedWork: CompletedWorkItem[] = [];

/* ─────────────────────── Aggregations ─────────────────────── */

export interface CompletedSummary {
  totalAccepted: number;
  firstTryAccepts: number;
  credentialsIssued: number;
  portfolioShared: number;
  portfolioEligible: number;
  lifetimePayout: string;
  uniqueProjects: number;
}

export function completedSummary(): CompletedSummary {
  const totalCents = completedWork.reduce((acc, c) => {
    const value = Number(c.payoutAmount.replace(/[^0-9]/g, "")) || 0;
    return acc + value;
  }, 0);

  return {
    totalAccepted: completedWork.length,
    firstTryAccepts: completedWork.filter((c) => c.firstTryAccept).length,
    credentialsIssued: completedWork.filter((c) => !!c.credential).length,
    portfolioShared: completedWork.filter((c) => c.portfolioShared).length,
    portfolioEligible: completedWork.filter((c) => c.portfolioEligible).length,
    lifetimePayout: `$${totalCents.toLocaleString()}`,
    uniqueProjects: new Set(completedWork.map((c) => c.project)).size,
  };
}

export function monthlyRhythm(): { month: string; count: number }[] {
  const map = new Map<string, number>();
  for (const c of completedWork) {
    map.set(c.yearMonth, (map.get(c.yearMonth) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([yearMonth, count]) => {
      const [, m] = yearMonth.split("-");
      const monthLabel = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][
        Number(m) - 1
      ];
      return { month: monthLabel, count };
    });
}
