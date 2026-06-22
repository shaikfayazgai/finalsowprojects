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
    id: "ctr-7402",
    fullName: "Amelia Stone",
    initials: "AS",
    handle: "amelia.stone",
    email: "amelia.stone@glimmora.team",
    pronouns: "she/her",
    headline: "Frontend engineer · accessibility specialist",
    specialization: "React · TypeScript · WCAG 2.2 AA · design systems",
    location: "Bengaluru, IN",
    timezone: "Asia/Kolkata · UTC+5:30",
    joinedAt: "Joined Aug 2024 · 9 months",
    workingHoursLocal: "Typically online 10:00 – 18:30 IST",
    responsiveness: "fast",
    operationalStatus: "focused",
    statusDetail: "Working on accessible date picker · expects to ship today",
    preferredLanguages: ["English", "Hindi"],
    spokenLanguages: ["English", "Hindi", "Kannada"],
    bio:
      "Frontend engineer drawn to the boring parts of a11y. I like writing tests that disagree with me. Most of my recent work is on the Helios design system — components that have to feel right for keyboard users first.",
  },

  trust: {
    overall: 86,
    band: "Trusted",
    tenureMonths: 9,
    acceptedSubmissions: 47,
    firstTryAcceptRate: 0.78,
    averageRevisionRounds: 1.4,
    lastBandChange: "Moved to Trusted · 6 weeks ago",
  },

  reliability: [
    {
      id: "rel-consistency",
      label: "Completion consistency",
      value: 92,
      delta: 4,
      caption: "47 of 51 commitments delivered on or before deadline",
      movement: "improving",
      helper: "Measured across the last 90 days, weighted toward recent work.",
    },
    {
      id: "rel-quality",
      label: "Submission quality",
      value: 88,
      delta: 3,
      caption: "Quality trend up · fewer polish items per submission",
      movement: "improving",
      helper: "Composite of mentor's quality ratings + acceptance signals.",
    },
    {
      id: "rel-responsiveness",
      label: "Responsiveness",
      value: 95,
      delta: 1,
      caption: "Average reply time to mentor: 1h 42m",
      movement: "steady",
      helper: "Excludes off-hours · pauses during marked OOO.",
    },
    {
      id: "rel-revision",
      label: "Revision frequency",
      value: 81,
      delta: 6,
      caption: "1.4 rounds avg · trending down quarter-over-quarter",
      movement: "improving",
      helper: "Lower is better. Single-round acceptance counts strongest.",
    },
    {
      id: "rel-workflow",
      label: "Workflow reliability",
      value: 90,
      delta: 0,
      caption: "Evidence completeness + clarification follow-through",
      movement: "steady",
      helper: "Are required deliverables attached when work is submitted.",
    },
  ],

  mentorPulse: {
    windowLabel: "last 30 days",
    acknowledgments: 9,
    observations: [
      "Mentors note your evidence is unusually complete for L3 work.",
      "Clarification questions are tightly scoped — saves review cycles.",
      "Recent submissions read more confident than 60 days ago.",
    ],
    representativeQuote: {
      mentor: "Rajesh Verma",
      quote:
        "Strong component composition. Idiomatic hooks. The v1 → v2 diff is tight and addresses prior feedback well.",
    },
  },

  skills: [
    {
      id: "sk-react",
      name: "React",
      level: "L3",
      category: "Engineering",
      verifiedBy: "Rajesh Verma",
      verifiedAt: "Mar 2026",
      evidenceCount: 14,
      nextLevelProgress: 62,
    },
    {
      id: "sk-typescript",
      name: "TypeScript",
      level: "L3",
      category: "Engineering",
      verifiedBy: "Priya Iyer",
      verifiedAt: "Feb 2026",
      evidenceCount: 18,
      nextLevelProgress: 71,
    },
    {
      id: "sk-a11y",
      name: "Accessibility (WCAG 2.2)",
      level: "L3",
      category: "Engineering",
      verifiedBy: "Rajesh Verma",
      verifiedAt: "Apr 2026",
      evidenceCount: 9,
      nextLevelProgress: 48,
    },
    {
      id: "sk-design-systems",
      name: "Design Systems",
      level: "L2",
      category: "Engineering",
      verifiedBy: "Hana Park",
      verifiedAt: "Jan 2026",
      evidenceCount: 6,
      nextLevelProgress: 55,
    },
    {
      id: "sk-testing",
      name: "Frontend Testing",
      level: "L2",
      category: "Quality",
      verifiedBy: "Rajesh Verma",
      verifiedAt: "Mar 2026",
      evidenceCount: 7,
      nextLevelProgress: 40,
    },
    {
      id: "sk-docs",
      name: "Component Documentation",
      level: "L1",
      category: "Documentation",
      verifiedBy: "Hana Park",
      verifiedAt: "Feb 2026",
      evidenceCount: 4,
      nextLevelProgress: 80,
    },
  ],

  aiCapabilityInsights: [
    {
      id: "cap-1",
      pattern: "You ship a11y-strong components faster than the cohort",
      detail:
        "Across 9 accessibility-flagged tasks, your first-try acceptance is 89% — well above the L3 cohort median (61%).",
      confidence: "high",
      signal: "Mentor acceptance history · last 90 days",
    },
    {
      id: "cap-2",
      pattern: "Documentation is your fastest-growing skill",
      detail:
        "Three accepted docs submissions in the last six weeks — pace suggests you'll cross L2 in a month at current cadence.",
      confidence: "medium",
      signal: "Skill levelup trajectory · 6-week window",
    },
    {
      id: "cap-3",
      pattern: "Best work tends to land in afternoon submissions",
      detail:
        "Submissions sent between 14:00–17:00 IST have a 92% first-try acceptance vs 71% for late-night sends. Worth noticing.",
      confidence: "low",
      signal: "Submission timing vs acceptance · suggestive, not conclusive",
    },
  ],

  contributionCategories: [
    { id: "cat-fe", label: "Frontend components", share: 0.42, count: 20 },
    { id: "cat-a11y", label: "Accessibility work", share: 0.21, count: 10 },
    { id: "cat-design-sys", label: "Design system contributions", share: 0.17, count: 8 },
    { id: "cat-testing", label: "Testing & QA", share: 0.12, count: 6 },
    { id: "cat-docs", label: "Documentation", share: 0.08, count: 4 },
  ],

  history: [
    {
      id: "h-1",
      at: "Today · 11:14",
      kind: "revision_resolved",
      title: "Marked 2 corrections addressed on Date Picker",
      detail: "Ready for resubmission · round 2 of 3",
      project: "Acme-Helios",
      mentor: "Rajesh Verma",
    },
    {
      id: "h-2",
      at: "Yesterday",
      kind: "mentor_ack",
      title: "Mentor acknowledgment from Rajesh",
      detail:
        "\"v1 → v2 diff is tight and addresses prior feedback well.\"",
      mentor: "Rajesh Verma",
    },
    {
      id: "h-3",
      at: "May 18, 2026",
      kind: "submission_accepted",
      title: "Auth Modal accepted on first try",
      detail: "L3 React · single round, no revision",
      project: "Acme-Helios",
      mentor: "Priya Iyer",
      badge: "First-try accept",
    },
    {
      id: "h-4",
      at: "May 14, 2026",
      kind: "credential_issued",
      title: "Credential issued · Accessible Component Authoring",
      detail: "Public credential · shareable link active",
    },
    {
      id: "h-5",
      at: "May 8, 2026",
      kind: "skill_levelup",
      title: "Leveled up · TypeScript to L3",
      detail: "Verified by Priya Iyer · 18 evidence submissions",
      badge: "Skill levelup",
    },
    {
      id: "h-6",
      at: "May 2, 2026",
      kind: "streak",
      title: "5 consecutive clean accepts",
      detail: "Streak active · current best 5",
      badge: "Streak · 5",
    },
    {
      id: "h-7",
      at: "Apr 28, 2026",
      kind: "milestone",
      title: "Crossed 40 accepted submissions",
      detail: "Trust band lifted Foundational → Trusted",
    },
    {
      id: "h-8",
      at: "Apr 20, 2026",
      kind: "submission_accepted",
      title: "Helios button system accepted",
      project: "Acme-Helios",
      mentor: "Hana Park",
    },
  ],

  trends: [
    { month: "Dec", delivered: 4, acceptanceRate: 0.62, avgRevisionRounds: 1.9 },
    { month: "Jan", delivered: 5, acceptanceRate: 0.68, avgRevisionRounds: 1.8 },
    { month: "Feb", delivered: 6, acceptanceRate: 0.71, avgRevisionRounds: 1.7 },
    { month: "Mar", delivered: 7, acceptanceRate: 0.75, avgRevisionRounds: 1.6 },
    { month: "Apr", delivered: 8, acceptanceRate: 0.78, avgRevisionRounds: 1.5 },
    { month: "May", delivered: 9, acceptanceRate: 0.82, avgRevisionRounds: 1.4 },
  ],

  growthInsights: [
    {
      id: "g-1",
      label: "Delivery volume",
      delta: "+28% vs Q1",
      detail: "Averaging 9 tasks/month — sustained for two quarters.",
      tone: "positive",
    },
    {
      id: "g-2",
      label: "First-try acceptance",
      delta: "+13 pts vs Q1",
      detail: "Climbed from 65% to 78% — the cleanest gain of any metric.",
      tone: "positive",
    },
    {
      id: "g-3",
      label: "Average revision rounds",
      delta: "-0.5 rounds",
      detail: "Tighter submissions on the first try. Polish items per task halved.",
      tone: "positive",
    },
    {
      id: "g-4",
      label: "Workload balance",
      delta: "steady",
      detail: "Capacity holds at 78–84% of typical week — sustainable cadence.",
      tone: "steady",
    },
  ],

  aiInsights: [
    {
      id: "ai-1",
      kind: "growth",
      title: "You're one accessibility evidence stack from L4",
      detail:
        "Three more accepted L3+ a11y submissions with formal verification artifacts would put you at the L4 threshold. The current Date Picker counts if it ships clean.",
      confidence: "high",
      cta: "See L4 criteria",
      source: "Skill ladder · cohort comparison",
    },
    {
      id: "ai-2",
      kind: "skill",
      title: "Documentation is closing fast",
      detail:
        "At your current cadence, you'll hit L2 documentation in ~4 weeks. Worth tagging one upcoming task as a docs-heavy pick.",
      confidence: "medium",
      cta: "Filter docs-eligible tasks",
      source: "Levelup trajectory · 6-week trend",
    },
    {
      id: "ai-3",
      kind: "productivity",
      title: "Your sweet spot is one P0 plus two P1 in flight",
      detail:
        "Acceptance dips ~7 pts when you carry two P0s simultaneously. The current load (1 P0, 2 P1) tracks your peak window.",
      confidence: "medium",
      cta: "Inspect workload",
      source: "Workload vs acceptance · last 6 months",
    },
    {
      id: "ai-4",
      kind: "strength",
      title: "Mentors give you cleaner feedback than most",
      detail:
        "Average correction count on your revisions is 1.8 vs the L3 median of 3.2. Mentors are treating your work as senior-level.",
      confidence: "medium",
      source: "Mentor feedback patterns",
    },
  ],

  achievements: [
    {
      id: "ach-1",
      label: "Trusted band",
      kind: "reliability",
      earnedAt: "6 weeks ago",
      detail: "Crossed 40 accepted submissions with rev. avg < 1.5",
    },
    {
      id: "ach-2",
      label: "5-streak · clean accepts",
      kind: "streak",
      earnedAt: "May 2, 2026",
      detail: "Five consecutive single-round acceptances",
    },
    {
      id: "ach-3",
      label: "A11y specialist",
      kind: "skill",
      earnedAt: "Apr 2026",
      detail: "9 a11y submissions accepted · public credential issued",
      rare: true,
    },
    {
      id: "ach-4",
      label: "First-try L3 hit",
      kind: "recognition",
      earnedAt: "May 18, 2026",
      detail: "L3 task accepted on first submission — Auth Modal",
    },
    {
      id: "ach-5",
      label: "Documentation rising",
      kind: "skill",
      earnedAt: "May 14, 2026",
      detail: "Three accepted docs submissions in six weeks",
    },
    {
      id: "ach-6",
      label: "Helios contributor",
      kind: "recognition",
      earnedAt: "Mar 2026",
      detail: "Recognized for sustained Helios design-system work",
    },
  ],

  streak: {
    current: 5,
    best: 5,
    lastClean: "Auth Modal · May 18, 2026",
    active: true,
  },

  workload: {
    active: 3,
    inRevision: 1,
    awaitingMentor: 1,
    blocked: 0,
    capacityPctWeek: 78,
    completionVelocity: "2.3 tasks / week",
    inFlightCriticalPath: "Date Picker · v3 due May 26 EOD",
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
