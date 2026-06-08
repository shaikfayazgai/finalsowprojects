/**
 * Contributor Portal V2 — Progress & Earnings mock.
 *
 * Powers `/contributor/progress` — the enterprise contributor growth,
 * momentum, reward, and operational contribution visibility system.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

/* ─────────────────────── Earnings ─────────────────────── */

export interface EarningsTotals {
  lifetime: number; // USD cents
  thisYear: number;
  thisQuarter: number;
  thisMonth: number;
  pending: number;
  nextPayoutAmount: number;
  nextPayoutDate: string;
  currency: string;
}

export interface PayoutRow {
  id: string;
  status: "paid" | "processing" | "scheduled" | "pending_review";
  amount: number;
  currency: string;
  taskCount: number;
  windowLabel: string; // e.g. "May 1 – May 15"
  paidAt?: string;
  scheduledFor?: string;
  reference?: string;
  method: "bank_transfer" | "wallet" | "stripe";
}

export interface ContributionEarning {
  id: string;
  taskTitle: string;
  project: string;
  acceptedAt: string;
  amount: number;
  payoutStatus: "paid" | "pending" | "scheduled";
  bonus?: { label: string; amount: number };
}

export interface MilestoneReward {
  id: string;
  label: string;
  threshold: string;
  reward: string;
  status: "earned" | "active" | "upcoming";
  progressPct: number;
  earnedAt?: string;
}

/* ─────────────────────── Progress & Momentum ─────────────────────── */

export interface ProgressMonth {
  month: string;
  delivered: number;
  accepted: number;
  earnings: number;
  acceptanceRate: number;
  avgRevisionRounds: number;
}

export interface MomentumSignal {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "steady" | "watch";
  Icon?: never; // icon resolved in component
}

export interface MilestoneProgression {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  reward?: string;
  tone: "near" | "active" | "stretch";
}

export interface ConsistencyBand {
  weeks: number[]; // each week's completion (0–100)
  label: string;
  helper: string;
}

/* ─────────────────────── Insights ─────────────────────── */

export interface InsightCard {
  id: string;
  category: "Productivity" | "Quality" | "Workload" | "Consistency";
  title: string;
  detail: string;
  delta: string;
  tone: "positive" | "steady" | "watch";
}

export interface AiGrowthHint {
  id: string;
  kind: "productivity" | "workload" | "growth" | "milestone" | "improvement";
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  cta?: string;
  source: string;
}

/* ─────────────────────── Recognition ─────────────────────── */

export interface RecognitionEvent {
  id: string;
  at: string;
  kind: "mentor_ack" | "milestone" | "credential" | "streak" | "first_try" | "level_up";
  title: string;
  detail: string;
  fromMentor?: string;
}

export interface WorkloadAnalytics {
  active: number;
  inRevision: number;
  awaitingMentor: number;
  blocked: number;
  completedThisWeek: number;
  completedThisMonth: number;
  completedThisQuarter: number;
  averageTaskDays: number;
  capacityPctWeek: number;
}

/* ─────────────────────── Aggregate ─────────────────────── */

export interface ProgressMock {
  earnings: EarningsTotals;
  payouts: PayoutRow[];
  recentContributions: ContributionEarning[];
  milestoneRewards: MilestoneReward[];
  months: ProgressMonth[];
  momentum: MomentumSignal[];
  milestoneProgression: MilestoneProgression[];
  consistency: ConsistencyBand;
  insights: InsightCard[];
  aiHints: AiGrowthHint[];
  recognition: RecognitionEvent[];
  workload: WorkloadAnalytics;
}

/* ─────────────────────── Canonical mock ─────────────────────── */

const cents = (n: number) => Math.round(n * 100);

export const contributorProgress: ProgressMock = {
  earnings: {
    lifetime: cents(0),
    thisYear: cents(0),
    thisQuarter: cents(0),
    thisMonth: cents(0),
    pending: cents(0),
    nextPayoutAmount: cents(0),
    nextPayoutDate: "",
    currency: "USD",
  },

  payouts: [
    {
      id: "po-2026-05-15",
      status: "processing",
      amount: cents(820),
      currency: "USD",
      taskCount: 4,
      windowLabel: "May 1 – May 15, 2026",
      scheduledFor: "Jun 1, 2026",
      method: "bank_transfer",
    },
    {
      id: "po-2026-04-30",
      status: "paid",
      amount: cents(960),
      currency: "USD",
      taskCount: 5,
      windowLabel: "Apr 16 – Apr 30, 2026",
      paidAt: "May 1, 2026",
      reference: "TRX-3019",
      method: "bank_transfer",
    },
    {
      id: "po-2026-04-15",
      status: "paid",
      amount: cents(720),
      currency: "USD",
      taskCount: 4,
      windowLabel: "Apr 1 – Apr 15, 2026",
      paidAt: "Apr 16, 2026",
      reference: "TRX-2988",
      method: "bank_transfer",
    },
    {
      id: "po-2026-03-31",
      status: "paid",
      amount: cents(940),
      currency: "USD",
      taskCount: 6,
      windowLabel: "Mar 16 – Mar 31, 2026",
      paidAt: "Apr 1, 2026",
      reference: "TRX-2912",
      method: "bank_transfer",
    },
    {
      id: "po-2026-03-15",
      status: "paid",
      amount: cents(780),
      currency: "USD",
      taskCount: 5,
      windowLabel: "Mar 1 – Mar 15, 2026",
      paidAt: "Mar 16, 2026",
      reference: "TRX-2841",
      method: "bank_transfer",
    },
  ],

  recentContributions: [
    {
      id: "ce-1",
      taskTitle: "Auth Modal · keyboard nav",
      project: "Acme-Helios",
      acceptedAt: "May 18, 2026",
      amount: cents(200),
      payoutStatus: "pending",
      bonus: { label: "First-try accept", amount: cents(40) },
    },
    {
      id: "ce-2",
      taskTitle: "Helios button system",
      project: "Acme-Helios",
      acceptedAt: "May 12, 2026",
      amount: cents(220),
      payoutStatus: "pending",
    },
    {
      id: "ce-3",
      taskTitle: "Empty-state illustrations · set",
      project: "Acme-Helios",
      acceptedAt: "May 8, 2026",
      amount: cents(180),
      payoutStatus: "pending",
      bonus: { label: "A11y credential", amount: cents(40) },
    },
    {
      id: "ce-4",
      taskTitle: "Search shortcuts · v2",
      project: "Helios-Core",
      acceptedAt: "May 5, 2026",
      amount: cents(200),
      payoutStatus: "pending",
    },
    {
      id: "ce-5",
      taskTitle: "Reporting CSV export · v1",
      project: "Lighthouse-Ops",
      acceptedAt: "Apr 28, 2026",
      amount: cents(160),
      payoutStatus: "paid",
    },
    {
      id: "ce-6",
      taskTitle: "Onboarding tooltips",
      project: "Stratum-Pay",
      acceptedAt: "Apr 22, 2026",
      amount: cents(140),
      payoutStatus: "paid",
    },
  ],

  milestoneRewards: [
    {
      id: "mr-1",
      label: "50 accepted submissions",
      threshold: "Across all projects",
      reward: "$120 bonus + Anchor credential",
      status: "active",
      progressPct: 94,
    },
    {
      id: "mr-2",
      label: "10 first-try accepts in a quarter",
      threshold: "Q2 2026",
      reward: "$80 bonus + dashboard badge",
      status: "active",
      progressPct: 70,
    },
    {
      id: "mr-3",
      label: "Trusted band reached",
      threshold: "40 accepts · rev avg < 1.5",
      reward: "$60 bonus issued",
      status: "earned",
      progressPct: 100,
      earnedAt: "6 weeks ago",
    },
    {
      id: "mr-4",
      label: "Anchor band stretch",
      threshold: "80 accepts · 90% first-try",
      reward: "$200 bonus + featured profile",
      status: "upcoming",
      progressPct: 38,
    },
  ],

  months: [
    { month: "Dec", delivered: 4, accepted: 4, earnings: cents(560), acceptanceRate: 0.62, avgRevisionRounds: 1.9 },
    { month: "Jan", delivered: 5, accepted: 5, earnings: cents(640), acceptanceRate: 0.68, avgRevisionRounds: 1.8 },
    { month: "Feb", delivered: 6, accepted: 6, earnings: cents(720), acceptanceRate: 0.71, avgRevisionRounds: 1.7 },
    { month: "Mar", delivered: 7, accepted: 7, earnings: cents(820), acceptanceRate: 0.75, avgRevisionRounds: 1.6 },
    { month: "Apr", delivered: 8, accepted: 8, earnings: cents(900), acceptanceRate: 0.78, avgRevisionRounds: 1.5 },
    { month: "May", delivered: 9, accepted: 9, earnings: cents(960), acceptanceRate: 0.82, avgRevisionRounds: 1.4 },
  ],

  momentum: [
    {
      id: "mo-streak",
      label: "Clean accepts streak",
      value: "5 in a row",
      detail: "Best 5 · matches your personal best",
      tone: "positive",
    },
    {
      id: "mo-velocity",
      label: "Completion velocity",
      value: "2.3 tasks / wk",
      detail: "Steady over Q1–Q2 · sustainable pace",
      tone: "steady",
    },
    {
      id: "mo-consistency",
      label: "Weekly consistency",
      value: "12 of 13 weeks",
      detail: "Delivered something every week this quarter",
      tone: "positive",
    },
    {
      id: "mo-revisions",
      label: "Revision rounds (avg)",
      value: "1.4",
      detail: "Down from 1.9 · cleaner first submissions",
      tone: "positive",
    },
  ],

  milestoneProgression: [
    {
      id: "pr-1",
      title: "50 accepts",
      description: "Three more accepts unlocks the Anchor credential.",
      current: 47,
      target: 50,
      unit: "accepts",
      reward: "$120 + Anchor credential",
      tone: "near",
    },
    {
      id: "pr-2",
      title: "10 first-try in Q2",
      description: "Seven of ten complete · cleaner submissions paying off.",
      current: 7,
      target: 10,
      unit: "first-try",
      reward: "$80 quarterly bonus",
      tone: "active",
    },
    {
      id: "pr-3",
      title: "L4 React",
      description: "Two more accepted L3+ a11y submissions with verification.",
      current: 4,
      target: 6,
      unit: "evidence",
      tone: "stretch",
    },
  ],

  consistency: {
    // 13 weeks · each is the % of committed work delivered in that week
    weeks: [85, 100, 100, 90, 100, 75, 100, 100, 100, 100, 95, 100, 92],
    label: "13-week consistency",
    helper: "Delivered something every week except one — that's the operational rhythm.",
  },

  insights: [
    {
      id: "ins-1",
      category: "Productivity",
      title: "Delivery volume sustained two quarters in a row",
      detail: "9 tasks/month avg · the cadence isn't drifting up or down — it's sustained.",
      delta: "+28% vs Q1",
      tone: "positive",
    },
    {
      id: "ins-2",
      category: "Quality",
      title: "First-try acceptance up sharply",
      detail: "Climbed from 62% to 82% across six months — the cleanest gain of any metric.",
      delta: "+20 pts",
      tone: "positive",
    },
    {
      id: "ins-3",
      category: "Quality",
      title: "Average revision rounds halved",
      detail: "1.9 → 1.4. The polish items per submission dropped in step.",
      delta: "-0.5 rounds",
      tone: "positive",
    },
    {
      id: "ins-4",
      category: "Workload",
      title: "Capacity holding sustainable",
      detail: "Running 78–84% of typical week — room for one P0 spike without strain.",
      delta: "steady",
      tone: "steady",
    },
    {
      id: "ins-5",
      category: "Consistency",
      title: "Twelve of thirteen weeks delivered",
      detail: "One soft week (75%) · otherwise every week landed at or above commitment.",
      delta: "12 / 13",
      tone: "positive",
    },
  ],

  aiHints: [
    {
      id: "ai-1",
      kind: "milestone",
      title: "Three accepts from the 50-mark",
      detail:
        "Lock in the Date Picker, the Onboarding wizard revision, and one P1 from your queue and you'll cross the Anchor threshold this month.",
      confidence: "high",
      cta: "Pick a queue task",
      source: "Milestone scan",
    },
    {
      id: "ai-2",
      kind: "productivity",
      title: "Your acceptance peaks at 1 P0 + 2 P1",
      detail:
        "Carrying two P0s simultaneously drops acceptance ~7 pts. The current 1 P0 + 2 P1 mix is your sweet spot — protect it.",
      confidence: "medium",
      cta: "Inspect workload",
      source: "Workload vs acceptance · last 6 months",
    },
    {
      id: "ai-3",
      kind: "improvement",
      title: "Tighten tests on first submit for a steady gain",
      detail:
        "Across the last 5 revisions, 60% asked for more tests. Adding 2-3 cases per field on first submit would close that gap.",
      confidence: "medium",
      cta: "Browse test templates",
      source: "Revision pattern · last 5",
    },
    {
      id: "ai-4",
      kind: "workload",
      title: "Afternoon submissions land cleaner",
      detail:
        "14:00–17:00 IST submissions hit 92% first-try vs 71% late night. Worth noticing if your schedule allows.",
      confidence: "low",
      source: "Submission timing · suggestive",
    },
  ],

  recognition: [
    {
      id: "r-1",
      at: "May 18, 2026",
      kind: "first_try",
      title: "First-try accept · Auth Modal",
      detail: "Single-round acceptance · counted toward Q2 bonus.",
      fromMentor: "",
    },
    {
      id: "r-2",
      at: "May 14, 2026",
      kind: "credential",
      title: "Credential · Accessible Component Authoring",
      detail: "Public credential issued · shareable link active.",
    },
    {
      id: "r-3",
      at: "May 12, 2026",
      kind: "mentor_ack",
      title: "Mentor acknowledgment from Rajesh",
      detail: "\"Tight v1 → v2 diff. Addresses prior feedback well.\"",
      fromMentor: "",
    },
    {
      id: "r-4",
      at: "May 8, 2026",
      kind: "level_up",
      title: "TypeScript · L3",
      detail: "",
      fromMentor: "",
    },
    {
      id: "r-5",
      at: "May 2, 2026",
      kind: "streak",
      title: "5 consecutive clean accepts",
      detail: "Streak active · matches personal best.",
    },
    {
      id: "r-6",
      at: "Apr 28, 2026",
      kind: "milestone",
      title: "40 accepts crossed · Trusted band",
      detail: "Bonus $60 issued · band lifted Foundational → Trusted.",
    },
  ],

  workload: {
    active: 3,
    inRevision: 1,
    awaitingMentor: 1,
    blocked: 0,
    completedThisWeek: 2,
    completedThisMonth: 9,
    completedThisQuarter: 24,
    averageTaskDays: 3.2,
    capacityPctWeek: 78,
  },
};

/* ─────────────────────── Formatters / helpers ─────────────────────── */

export function formatMoney(cents: number, currency = "USD"): string {
  const value = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatMoneyDetailed(cents: number, currency = "USD"): string {
  const value = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function payoutStatusTone(s: PayoutRow["status"]): { chip: string; label: string } {
  switch (s) {
    case "paid":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", label: "Paid" };
    case "processing":
      return { chip: "border-teal-200 bg-teal-50 text-teal-800", label: "Processing" };
    case "scheduled":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "Scheduled" };
    case "pending_review":
      return { chip: "border-gold-200 bg-gold-50 text-gold-800", label: "Pending review" };
  }
}

export function milestoneRewardTone(s: MilestoneReward["status"]): {
  chip: string;
  label: string;
} {
  switch (s) {
    case "earned":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", label: "Earned" };
    case "active":
      return { chip: "border-teal-200 bg-teal-50 text-teal-800", label: "In progress" };
    case "upcoming":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "Upcoming" };
  }
}

export function progressionTone(t: MilestoneProgression["tone"]): {
  chip: string;
  bar: string;
  label: string;
} {
  switch (t) {
    case "near":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", bar: "bg-forest-500", label: "Within reach" };
    case "active":
      return { chip: "border-teal-200 bg-teal-50 text-teal-800", bar: "bg-teal-500", label: "Active goal" };
    case "stretch":
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", bar: "bg-beige-400", label: "Stretch goal" };
  }
}
