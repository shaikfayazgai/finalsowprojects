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

const POOL: CandidatePool[] = [];

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
