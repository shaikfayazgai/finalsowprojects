/**
 * Contributor Portal V2 — Profile & Reliability mock.
 *
 * Powers `/contributor/profile` — the enterprise contributor identity,
 * trust, growth, and operational reputation surface.
 *
 * Frontend-only. Backend integration is Phase 2+.
 */

/* ─────────────────────── Identity ─────────────────────── */

export interface ContributorIdentity {
  id: string;
  fullName: string;
  initials: string;
  handle: string;
  email: string;
  pronouns?: string;
  headline: string;
  specialization: string;
  location: string;
  timezone: string;
  joinedAt: string;
  workingHoursLocal: string;
  responsiveness: "fast" | "steady" | "thoughtful";
  operationalStatus:
    | "available"
    | "focused"
    | "deep_work"
    | "out_of_office"
    | "limited";
  statusDetail?: string;
  preferredLanguages: string[];
  bio: string;
  spokenLanguages: string[];
}

/* ─────────────────────── Trust & Reliability ─────────────────────── */

export interface ReliabilityMetric {
  id: string;
  label: string;
  value: number; // 0–100
  delta: number; // pts vs last 30 days, can be negative
  caption: string;
  movement: "improving" | "steady" | "watch";
  helper: string;
}

export interface MentorFeedbackPulse {
  windowLabel: string; // e.g. "last 30 days"
  acknowledgments: number;
  observations: string[];
  representativeQuote: { mentor: string; quote: string };
}

export interface TrustScore {
  overall: number; // 0–100
  band: "Foundational" | "Trusted" | "Proven" | "Anchor";
  tenureMonths: number;
  acceptedSubmissions: number;
  firstTryAcceptRate: number; // 0–1
  averageRevisionRounds: number;
  lastBandChange?: string;
}

/* ─────────────────────── Skills & Expertise ─────────────────────── */

export interface VerifiedSkill {
  id: string;
  name: string;
  level: "L1" | "L2" | "L3" | "L4";
  category: "Engineering" | "Design" | "Research" | "Documentation" | "Quality";
  verifiedBy: string; // mentor name
  verifiedAt: string;
  evidenceCount: number;
  nextLevelProgress: number; // 0–100
}

export interface AiCapabilityInsight {
  id: string;
  pattern: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  signal: string; // what AI observed
}

export interface ContributionCategory {
  id: string;
  label: string;
  share: number; // 0–1 of work volume
  count: number;
}

/* ─────────────────────── Contribution History ─────────────────────── */

export type HistoryEventKind =
  | "submission_accepted"
  | "revision_resolved"
  | "mentor_ack"
  | "skill_levelup"
  | "milestone"
  | "credential_issued"
  | "streak";

export interface HistoryEvent {
  id: string;
  at: string;
  kind: HistoryEventKind;
  title: string;
  detail?: string;
  badge?: string;
  project?: string;
  mentor?: string;
}

/* ─────────────────────── Performance & Growth ─────────────────────── */

export interface MonthlyTrend {
  month: string; // short label
  delivered: number;
  acceptanceRate: number; // 0–1
  avgRevisionRounds: number;
}

export interface GrowthInsight {
  id: string;
  label: string;
  delta: string; // e.g. "+12% vs Q1"
  detail: string;
  tone: "positive" | "steady" | "watch";
}

/* ─────────────────────── AI Insights ─────────────────────── */

export interface AiInsight {
  id: string;
  kind: "growth" | "skill" | "productivity" | "strength" | "workload";
  title: string;
  detail: string;
  confidence: "high" | "medium" | "low";
  cta?: string;
  source: string;
}

/* ─────────────────────── Achievements ─────────────────────── */

export interface Achievement {
  id: string;
  label: string;
  kind: "reliability" | "skill" | "streak" | "recognition";
  earnedAt: string;
  detail: string;
  rare?: boolean;
}

export interface CompletionStreak {
  current: number;
  best: number;
  lastClean: string;
  active: boolean;
}

/* ─────────────────────── Workload Summary ─────────────────────── */

export interface WorkloadSnapshot {
  active: number;
  inRevision: number;
  awaitingMentor: number;
  blocked: number;
  capacityPctWeek: number; // 0–100 of typical week
  completionVelocity: string; // "2.3 tasks/wk"
  inFlightCriticalPath?: string;
}

/* ─────────────────────── Aggregate ─────────────────────── */

export interface ContributorProfileMock {
  identity: ContributorIdentity;
  trust: TrustScore;
  reliability: ReliabilityMetric[];
  mentorPulse: MentorFeedbackPulse;
  skills: VerifiedSkill[];
  aiCapabilityInsights: AiCapabilityInsight[];
  contributionCategories: ContributionCategory[];
  history: HistoryEvent[];
  trends: MonthlyTrend[];
  growthInsights: GrowthInsight[];
  aiInsights: AiInsight[];
  achievements: Achievement[];
  streak: CompletionStreak;
  workload: WorkloadSnapshot;
}

/* ─────────────────────── Canonical mock ─────────────────────── */

export const contributorProfile: ContributorProfileMock = {
  identity: {
    id: "",
    fullName: "",
    initials: "",
    handle: "",
    email: "",
    headline: "",
    specialization: "",
    location: "",
    timezone: "",
    joinedAt: "",
    workingHoursLocal: "",
    responsiveness: "steady",
    operationalStatus: "available",
    preferredLanguages: [],
    spokenLanguages: [],
    bio: "",
  },

  trust: {
    overall: 0,
    band: "Foundational",
    tenureMonths: 0,
    acceptedSubmissions: 0,
    firstTryAcceptRate: 0,
    averageRevisionRounds: 0,
  },

  reliability: [],

  mentorPulse: {
    windowLabel: "",
    acknowledgments: 0,
    observations: [],
    representativeQuote: {
      mentor: "",
      quote: "",
    },
  },

  skills: [],

  aiCapabilityInsights: [],

  contributionCategories: [],

  history: [],

  trends: [],

  growthInsights: [],

  aiInsights: [],

  achievements: [],

  streak: {
    current: 0,
    best: 0,
    lastClean: "",
    active: false,
  },

  workload: {
    active: 0,
    inRevision: 0,
    awaitingMentor: 0,
    blocked: 0,
    capacityPctWeek: 0,
    completionVelocity: "",
  },
};

/* ─────────────────────── Helpers ─────────────────────── */

export function trustBandTone(band: TrustScore["band"]): {
  chip: string;
  dot: string;
  label: string;
} {
  switch (band) {
    case "Anchor":
      return { chip: "border-forest-300 bg-forest-100 text-forest-800", dot: "bg-forest-600", label: "Anchor contributor" };
    case "Proven":
      return { chip: "border-forest-200 bg-forest-50 text-forest-700", dot: "bg-forest-500", label: "Proven" };
    case "Trusted":
      return { chip: "border-teal-200 bg-teal-50 text-teal-800", dot: "bg-teal-600", label: "Trusted" };
    default:
      return { chip: "border-beige-200 bg-beige-50 text-beige-800", dot: "bg-beige-500", label: "Foundational" };
  }
}

export function operationalStatusTone(
  s: ContributorIdentity["operationalStatus"],
): { dot: string; label: string; tint: string } {
  switch (s) {
    case "available":
      return { dot: "bg-forest-500", label: "Available", tint: "text-forest-700" };
    case "focused":
      return { dot: "bg-teal-500", label: "Focused", tint: "text-teal-700" };
    case "deep_work":
      return { dot: "bg-brown-500", label: "Deep work", tint: "text-brown-700" };
    case "out_of_office":
      return { dot: "bg-beige-400", label: "Out of office", tint: "text-beige-700" };
    case "limited":
      return { dot: "bg-gold-500", label: "Limited capacity", tint: "text-gold-700" };
  }
}

export function movementTone(m: ReliabilityMetric["movement"]): {
  chip: string;
  label: string;
} {
  if (m === "improving") return { chip: "border-forest-200 bg-forest-50 text-forest-700", label: "Improving" };
  if (m === "watch") return { chip: "border-gold-200 bg-gold-50 text-gold-800", label: "Worth watching" };
  return { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "Steady" };
}

export function skillLevelTone(l: VerifiedSkill["level"]): { chip: string; label: string } {
  switch (l) {
    case "L4":
      return { chip: "border-forest-300 bg-forest-50 text-forest-800", label: "L4 · Anchor" };
    case "L3":
      return { chip: "border-teal-300 bg-teal-50 text-teal-800", label: "L3 · Senior" };
    case "L2":
      return { chip: "border-teal-200 bg-teal-50 text-teal-700", label: "L2 · Capable" };
    default:
      return { chip: "border-beige-200 bg-beige-50 text-beige-700", label: "L1 · Foundational" };
  }
}
