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
    lifetime: 0,
    thisYear: 0,
    thisQuarter: 0,
    thisMonth: 0,
    pending: 0,
    nextPayoutAmount: 0,
    nextPayoutDate: "",
    currency: "USD",
  },

  payouts: [],

  recentContributions: [],

  milestoneRewards: [],

  months: [],

  momentum: [],

  milestoneProgression: [],

  consistency: {
    weeks: [],
    label: "",
    helper: "",
  },

  insights: [],

  aiHints: [],

  recognition: [],

  workload: {
    active: 0,
    inRevision: 0,
    awaitingMentor: 0,
    blocked: 0,
    completedThisWeek: 0,
    completedThisMonth: 0,
    completedThisQuarter: 0,
    averageTaskDays: 0,
    capacityPctWeek: 0,
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
