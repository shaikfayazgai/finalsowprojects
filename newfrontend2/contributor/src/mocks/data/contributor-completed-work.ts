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

export const completedWork: CompletedWorkItem[] = [
  {
    id: "cw-2026-05-18",
    taskId: "t-4912",
    title: "Auth modal · keyboard nav",
    shortSummary: "Full keyboard reachability across modal + focus trap on open.",
    project: "Acme-Helios",
    portfolio: "Enterprise Foundations",
    skill: "React",
    skillLevel: "L3",
    acceptedAt: "May 18, 2026",
    payoutAmount: "$200",
    payoutReference: "TRX-3019",
    rounds: 1,
    mentor: { name: "Priya Iyer", initials: "PI" },
    whatWorked:
      "First-try accept. Test coverage was thorough; aria-live announcements landed on the first pass.",
    credential: { name: "Accessible component authoring", shareId: "share-axe-1" },
    portfolioEligible: true,
    portfolioShared: true,
    evidenceCount: 5,
    yearMonth: "2026-05",
    firstTryAccept: true,
  },
  {
    id: "cw-2026-05-12",
    taskId: "t-4711",
    title: "Helios button system",
    shortSummary: "Primary, secondary, ghost, destructive — with loading states.",
    project: "Acme-Helios",
    portfolio: "Enterprise Foundations",
    skill: "Design Systems",
    skillLevel: "L2",
    acceptedAt: "May 12, 2026",
    payoutAmount: "$220",
    payoutReference: "TRX-3019",
    rounds: 2,
    mentor: { name: "Hana Park", initials: "HP" },
    whatWorked:
      "Tokenized the right things. Storybook stories were genuinely useful — that's the bar.",
    portfolioEligible: true,
    portfolioShared: false,
    evidenceCount: 7,
    yearMonth: "2026-05",
    firstTryAccept: false,
  },
  {
    id: "cw-2026-05-08",
    taskId: "t-4622",
    title: "Empty-state illustrations · set",
    shortSummary: "Eight empty states for the Helios design system.",
    project: "Acme-Helios",
    portfolio: "Enterprise Foundations",
    skill: "Design",
    skillLevel: "L2",
    acceptedAt: "May 8, 2026",
    payoutAmount: "$220",
    payoutReference: "TRX-3019",
    rounds: 2,
    mentor: { name: "Priya Iyer", initials: "PI" },
    whatWorked:
      "Tone is consistent across all eight. Calm color choices read exactly to brief.",
    credential: { name: "Design system contribution", shareId: "share-helios-1" },
    portfolioEligible: true,
    portfolioShared: true,
    evidenceCount: 8,
    yearMonth: "2026-05",
    firstTryAccept: false,
  },
  {
    id: "cw-2026-05-05",
    taskId: "t-4188",
    title: "Search shortcuts · v2",
    shortSummary: "Cmd-K invocation with arrow nav and recent searches caching.",
    project: "Helios-Core",
    portfolio: "Enterprise Foundations",
    skill: "React",
    skillLevel: "L3",
    acceptedAt: "May 5, 2026",
    payoutAmount: "$200",
    payoutReference: "TRX-3019",
    rounds: 2,
    mentor: { name: "Rajesh Verma", initials: "RV" },
    whatWorked:
      "Smooth Cmd-K invocation. Recent searches caching landed cleanly with strong test coverage.",
    portfolioEligible: false,
    portfolioShared: false,
    evidenceCount: 4,
    yearMonth: "2026-05",
    firstTryAccept: false,
  },
  {
    id: "cw-2026-04-28",
    taskId: "t-4055",
    title: "Reporting CSV export · v1",
    shortSummary: "Export current view with filters as CSV.",
    project: "Lighthouse-Ops",
    portfolio: "Reporting",
    skill: "TypeScript",
    skillLevel: "L3",
    acceptedAt: "Apr 28, 2026",
    payoutAmount: "$160",
    payoutReference: "TRX-2988",
    rounds: 1,
    mentor: { name: "Hana Park", initials: "HP" },
    whatWorked:
      "Filters respected the on-screen view exactly. Locale-aware dates worked on the first try.",
    portfolioEligible: false,
    evidenceCount: 3,
    yearMonth: "2026-04",
    firstTryAccept: true,
  },
  {
    id: "cw-2026-04-22",
    taskId: "t-3970",
    title: "Onboarding tooltips",
    shortSummary: "Sequenced product tour for the onboarding wizard.",
    project: "Stratum-Pay",
    portfolio: "Onboarding",
    skill: "React",
    skillLevel: "L2",
    acceptedAt: "Apr 22, 2026",
    payoutAmount: "$140",
    payoutReference: "TRX-2988",
    rounds: 1,
    mentor: { name: "Rajesh Verma", initials: "RV" },
    whatWorked:
      "Tour skipped cleanly when the user pressed Esc. Returning users didn't get re-prompted.",
    portfolioEligible: true,
    portfolioShared: false,
    evidenceCount: 4,
    yearMonth: "2026-04",
    firstTryAccept: true,
  },
  {
    id: "cw-2026-04-15",
    taskId: "t-3812",
    title: "Helios input variants",
    shortSummary: "Default, error, success, disabled states — tokenized.",
    project: "Acme-Helios",
    portfolio: "Enterprise Foundations",
    skill: "Design Systems",
    skillLevel: "L2",
    acceptedAt: "Apr 15, 2026",
    payoutAmount: "$180",
    payoutReference: "TRX-2912",
    rounds: 2,
    mentor: { name: "Hana Park", initials: "HP" },
    whatWorked:
      "Error state contrast met WCAG AA on the first pass. Disabled state communicated clearly.",
    portfolioEligible: true,
    portfolioShared: true,
    evidenceCount: 6,
    yearMonth: "2026-04",
    firstTryAccept: false,
  },
  {
    id: "cw-2026-04-08",
    taskId: "t-3711",
    title: "Notification center",
    shortSummary: "Real-time notification feed with read/unread state.",
    project: "Atlas-Insights",
    portfolio: "Engagement",
    skill: "React",
    skillLevel: "L3",
    acceptedAt: "Apr 8, 2026",
    payoutAmount: "$240",
    payoutReference: "TRX-2912",
    rounds: 2,
    mentor: { name: "Priya Iyer", initials: "PI" },
    whatWorked:
      "Optimistic mark-as-read with rollback on failure. Empty state was thoughtful.",
    portfolioEligible: true,
    portfolioShared: false,
    evidenceCount: 5,
    yearMonth: "2026-04",
    firstTryAccept: false,
  },
  {
    id: "cw-2026-03-30",
    taskId: "t-3601",
    title: "Mobile push notifications",
    shortSummary: "FCM + APNS adapter with retry on transient failures.",
    project: "Atlas-Insights",
    portfolio: "Mobile",
    skill: "Mobile",
    skillLevel: "L3",
    acceptedAt: "Mar 30, 2026",
    payoutAmount: "$190",
    payoutReference: "TRX-2841",
    rounds: 2,
    mentor: { name: "Rajesh Verma", initials: "RV" },
    whatWorked:
      "Retry policy was sensible — exponential backoff with caps. Logging was the right level of detail.",
    portfolioEligible: false,
    evidenceCount: 5,
    yearMonth: "2026-03",
    firstTryAccept: false,
  },
  {
    id: "cw-2026-03-22",
    taskId: "t-3522",
    title: "API rate limit dashboard",
    shortSummary: "Per-route limits, current usage, and historical chart.",
    project: "Lighthouse-Ops",
    portfolio: "Platform",
    skill: "TypeScript",
    skillLevel: "L3",
    acceptedAt: "Mar 22, 2026",
    payoutAmount: "$220",
    payoutReference: "TRX-2841",
    rounds: 1,
    mentor: { name: "Hana Park", initials: "HP" },
    whatWorked:
      "First-try. Sparkline aggregations matched the underlying data. Filter UX was clean.",
    portfolioEligible: true,
    portfolioShared: false,
    evidenceCount: 6,
    yearMonth: "2026-03",
    firstTryAccept: true,
  },
  {
    id: "cw-2026-03-14",
    taskId: "t-3411",
    title: "Inline form validation patterns",
    shortSummary: "Pattern library: when to show errors, where to anchor them.",
    project: "Stratum-Pay",
    portfolio: "Onboarding",
    skill: "Documentation",
    skillLevel: "L1",
    acceptedAt: "Mar 14, 2026",
    payoutAmount: "$120",
    payoutReference: "TRX-2841",
    rounds: 2,
    mentor: { name: "Priya Iyer", initials: "PI" },
    whatWorked:
      "Documentation was unusually concrete — every pattern had a counterexample. Easy to apply.",
    portfolioEligible: true,
    portfolioShared: true,
    evidenceCount: 3,
    yearMonth: "2026-03",
    firstTryAccept: false,
  },
  {
    id: "cw-2026-02-28",
    taskId: "t-3201",
    title: "Helios card system",
    shortSummary: "Card variants and density modes.",
    project: "Acme-Helios",
    portfolio: "Enterprise Foundations",
    skill: "Design Systems",
    skillLevel: "L2",
    acceptedAt: "Feb 28, 2026",
    payoutAmount: "$200",
    payoutReference: "TRX-2722",
    rounds: 2,
    mentor: { name: "Hana Park", initials: "HP" },
    whatWorked:
      "Density modes weren't an afterthought. Compact mode actually felt different, not just smaller.",
    portfolioEligible: true,
    portfolioShared: true,
    evidenceCount: 7,
    yearMonth: "2026-02",
    firstTryAccept: false,
  },
];

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
