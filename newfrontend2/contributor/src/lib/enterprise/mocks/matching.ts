/**
 * Matching engine mock — fulfils master SOW §3.1.MVP.4 + §3.1.MVP.7
 * (Matching v1: ranked recommendations by skills × availability × quality,
 * with explainable "why matched" fields).
 *
 * Backend handoff:
 *   POST /api/matching/candidates  body: { taskId | requiredSkills, level?, region?, limit? }
 *     → { candidates: MatchedCandidate[] }
 *
 * The real backend should score candidates with the published rubric
 * documented in src/lib/enterprise/mocks/HANDOFF.md.
 */

export interface CandidateMatchSignal {
  /** 0..1 — used to render the green/amber bar in the UI. */
  score: number;
  label: string;
  detail: string;
}

export interface MatchedCandidate {
  id: string;
  name: string;
  email: string;
  /** Role label, e.g. "Designer L3". */
  roleLabel: string;
  region: string;
  /** Top-3 skills surfaced for "why matched" copy. */
  topSkills: Array<{ skill: string; proficiency: number }>;
  /** Aggregate "why match" score (0..1). */
  matchScore: number;
  /** Decomposed signals — drive the explainability rows. */
  signals: {
    skills: CandidateMatchSignal;
    availability: CandidateMatchSignal;
    quality: CandidateMatchSignal;
    reliability: CandidateMatchSignal;
  };
  /** Stats the operator wants to see (Phase 2 will use richer metrics). */
  stats: {
    acceptanceRate: number;       // 0..1
    avgTurnaroundHours: number;
    activeTasks: number;
    completedTasks: number;
  };
  /** Operator-friendly chips. */
  badges: string[];
}

interface CandidatePool extends MatchedCandidate {
  // Underlying skills with proficiencies for scoring.
  skills: Array<{ skill: string; proficiency: number }>;
  /** Workforce segment — drives DEI/sourcing chips. */
  segment: "general_workforce" | "women_workforce" | "student" | "internal";
}

const POOL: CandidatePool[] = [
  {
    id: "c-priya",   name: "Priya Raghav",   email: "priya@glimmora.dev",   roleLabel: "Designer L3", region: "India · Bengaluru",
    topSkills: [], skills: [
      { skill: "Figma", proficiency: 0.95 }, { skill: "Design Systems", proficiency: 0.92 }, { skill: "TypeScript", proficiency: 0.88 }, { skill: "React", proficiency: 0.86 }, { skill: "Motion", proficiency: 0.78 }, { skill: "Accessibility", proficiency: 0.84 },
    ],
    segment: "women_workforce",
    matchScore: 0.94,
    signals: {} as never,
    stats: { acceptanceRate: 0.96, avgTurnaroundHours: 18, activeTasks: 2, completedTasks: 47 },
    badges: ["★ Top 5%", "Women Workforce"],
  },
  {
    id: "c-amit",    name: "Amit Khanna",    email: "amit@glimmora.dev",    roleLabel: "Backend L3",  region: "India · Pune",
    topSkills: [], skills: [
      { skill: "Python", proficiency: 0.93 }, { skill: "OpenAPI", proficiency: 0.91 }, { skill: "Postgres", proficiency: 0.88 }, { skill: "SRE", proficiency: 0.74 },
    ],
    segment: "general_workforce",
    matchScore: 0.91,
    signals: {} as never,
    stats: { acceptanceRate: 0.94, avgTurnaroundHours: 22, activeTasks: 1, completedTasks: 58 },
    badges: ["★ Senior"],
  },
  {
    id: "c-divya",   name: "Divya Nair",     email: "divya@glimmora.dev",   roleLabel: "Designer L2", region: "India · Mumbai",
    topSkills: [], skills: [
      { skill: "Figma", proficiency: 0.87 }, { skill: "Research", proficiency: 0.82 }, { skill: "Prototyping", proficiency: 0.79 },
    ],
    segment: "women_workforce",
    matchScore: 0.88,
    signals: {} as never,
    stats: { acceptanceRate: 0.91, avgTurnaroundHours: 24, activeTasks: 0, completedTasks: 26 },
    badges: ["Available now", "Women Workforce"],
  },
  {
    id: "c-rohit",   name: "Rohit Banerjee", email: "rohit@glimmora.dev",   roleLabel: "Backend L3",  region: "India · Bengaluru",
    topSkills: [], skills: [
      { skill: "Go", proficiency: 0.86 }, { skill: "Python", proficiency: 0.82 }, { skill: "AWS", proficiency: 0.90 }, { skill: "Security", proficiency: 0.84 },
    ],
    segment: "general_workforce",
    matchScore: 0.86,
    signals: {} as never,
    stats: { acceptanceRate: 0.93, avgTurnaroundHours: 26, activeTasks: 3, completedTasks: 41 },
    badges: ["Security cleared"],
  },
  {
    id: "c-meera",   name: "Meera Joshi",    email: "meera@glimmora.dev",   roleLabel: "Frontend L3", region: "India · Hyderabad",
    topSkills: [], skills: [
      { skill: "TypeScript", proficiency: 0.93 }, { skill: "React", proficiency: 0.92 }, { skill: "Figma", proficiency: 0.71 }, { skill: "Testing", proficiency: 0.85 },
    ],
    segment: "general_workforce",
    matchScore: 0.85,
    signals: {} as never,
    stats: { acceptanceRate: 0.95, avgTurnaroundHours: 20, activeTasks: 2, completedTasks: 52 },
    badges: ["★ Top 10%"],
  },
  {
    id: "c-kavya",   name: "Kavya Shah",     email: "kavya@glimmora.dev",   roleLabel: "Frontend L2", region: "India · Bengaluru",
    topSkills: [], skills: [
      { skill: "TypeScript", proficiency: 0.83 }, { skill: "React", proficiency: 0.84 }, { skill: "Accessibility", proficiency: 0.78 },
    ],
    segment: "women_workforce",
    matchScore: 0.82,
    signals: {} as never,
    stats: { acceptanceRate: 0.90, avgTurnaroundHours: 28, activeTasks: 1, completedTasks: 19 },
    badges: ["Women Workforce"],
  },
  {
    id: "c-yusuf",   name: "Yusuf Omar",     email: "yusuf@glimmora.dev",   roleLabel: "Data L3",     region: "UAE · Dubai",
    topSkills: [], skills: [
      { skill: "Python", proficiency: 0.89 }, { skill: "SQL", proficiency: 0.93 }, { skill: "dbt", proficiency: 0.86 },
    ],
    segment: "general_workforce",
    matchScore: 0.80,
    signals: {} as never,
    stats: { acceptanceRate: 0.92, avgTurnaroundHours: 32, activeTasks: 1, completedTasks: 38 },
    badges: ["Multi-region"],
  },
  {
    id: "c-arjun",   name: "Arjun Thakur",   email: "arjun@glimmora.dev",   roleLabel: "SRE L3",      region: "India · Bengaluru",
    topSkills: [], skills: [
      { skill: "AWS", proficiency: 0.92 }, { skill: "Terraform", proficiency: 0.88 }, { skill: "Observability", proficiency: 0.86 }, { skill: "Python", proficiency: 0.78 },
    ],
    segment: "general_workforce",
    matchScore: 0.79,
    signals: {} as never,
    stats: { acceptanceRate: 0.94, avgTurnaroundHours: 24, activeTasks: 1, completedTasks: 31 },
    badges: [],
  },
  {
    id: "c-sneha",   name: "Sneha Mehta",    email: "sneha@glimmora.dev",   roleLabel: "Designer L2", region: "India · Bengaluru",
    topSkills: [], skills: [
      { skill: "Figma", proficiency: 0.81 }, { skill: "Motion", proficiency: 0.75 }, { skill: "Illustration", proficiency: 0.84 },
    ],
    segment: "student",
    matchScore: 0.71,
    signals: {} as never,
    stats: { acceptanceRate: 0.88, avgTurnaroundHours: 36, activeTasks: 0, completedTasks: 8 },
    badges: ["Student", "Available now"],
  },
  {
    id: "c-vikram",  name: "Vikram Patel",   email: "vikram@glimmora.dev",  roleLabel: "PM L3",       region: "India · Mumbai",
    topSkills: [], skills: [
      { skill: "Discovery", proficiency: 0.92 }, { skill: "Roadmaps", proficiency: 0.89 }, { skill: "OKRs", proficiency: 0.86 },
    ],
    segment: "general_workforce",
    matchScore: 0.69,
    signals: {} as never,
    stats: { acceptanceRate: 0.91, avgTurnaroundHours: 40, activeTasks: 3, completedTasks: 64 },
    badges: ["★ Senior"],
  },
];

/* ────────────────────── scoring ────────────────────── */

function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }

interface MatchInput {
  requiredSkills: string[];
  /** Optional level hint, e.g. "L3". Filters out below-L1. */
  level?: string;
  region?: string;
  /** How many to return. Defaults 8. */
  limit?: number;
}

function scoreCandidate(c: CandidatePool, input: MatchInput): MatchedCandidate {
  const need = input.requiredSkills.map((s) => s.toLowerCase());
  const matchedSkills = c.skills.filter((s) =>
    need.includes(s.skill.toLowerCase()),
  );
  const skillScore = need.length === 0
    ? 0.5
    : matchedSkills.length / need.length * (matchedSkills.reduce((a, s) => a + s.proficiency, 0) / Math.max(1, matchedSkills.length));

  // Availability: invert active workload.
  const availability = clamp01(1 - c.stats.activeTasks / 5);
  // Quality: blend acceptance rate + completed count proxy.
  const quality = clamp01(c.stats.acceptanceRate * 0.7 + (Math.log(c.stats.completedTasks + 1) / 5) * 0.3);
  // Reliability: faster turnaround = better.
  const reliability = clamp01(1 - c.stats.avgTurnaroundHours / 60);

  // Composite weight per master SOW (skills 50% · availability 20% · quality 20% · reliability 10%).
  const score = clamp01(skillScore * 0.5 + availability * 0.2 + quality * 0.2 + reliability * 0.1);

  const topSkills = c.skills
    .filter((s) => need.length === 0 || need.includes(s.skill.toLowerCase()))
    .sort((a, b) => b.proficiency - a.proficiency)
    .slice(0, 3);

  const signals = {
    skills: {
      score: clamp01(skillScore),
      label: "Skills",
      detail: matchedSkills.length === 0
        ? `Has ${c.skills.length} skills · no exact match on requested set`
        : `Matched ${matchedSkills.length}/${need.length} required skills · avg proficiency ${(matchedSkills.reduce((a, s) => a + s.proficiency, 0) / Math.max(1, matchedSkills.length) * 100).toFixed(0)}%`,
    },
    availability: {
      score: availability,
      label: "Availability",
      detail: c.stats.activeTasks === 0
        ? "Free for new work"
        : `${c.stats.activeTasks} active task${c.stats.activeTasks === 1 ? "" : "s"}`,
    },
    quality: {
      score: quality,
      label: "Quality",
      detail: `${(c.stats.acceptanceRate * 100).toFixed(0)}% acceptance · ${c.stats.completedTasks} completed`,
    },
    reliability: {
      score: reliability,
      label: "Reliability",
      detail: `Avg turnaround ${c.stats.avgTurnaroundHours}h`,
    },
  };

  return {
    id: c.id,
    name: c.name,
    email: c.email,
    roleLabel: c.roleLabel,
    region: c.region,
    topSkills,
    matchScore: score,
    signals,
    stats: c.stats,
    badges: c.badges,
  };
}

export function matchCandidatesMock(input: MatchInput): { candidates: MatchedCandidate[] } {
  const limit = input.limit ?? 6;
  const scored = POOL.map((c) => scoreCandidate(c, input));
  scored.sort((a, b) => b.matchScore - a.matchScore);
  return { candidates: scored.slice(0, limit) };
}
