/**
 * Enterprise projects — real-backend client.
 *
 * Fetches from /api/enterprise/projects (Next.js proxy → enterprise backend
 * GET /api/v1/projects) and maps to the ProjectSummary / ProjectDetail types
 * that the components already consume (from projects-mock.ts).
 *
 * No mock fallback: if the backend is unreachable the pages show an empty
 * state so users always know when real data is missing.
 */

import { fetchInternal } from "@/lib/api/client";
import type {
  ProjectDetail,
  ProjectSummary,
} from "@/lib/projects/projects-mock";

// ── raw shape from GET /api/v1/projects ──────────────────────────────────────

interface RawProjectSummary {
  id: string;
  name?: string;
  projectTitle?: string;
  clientOrganisation?: string;
  sponsor?: string;
  ownerEmail?: string;
  pmo?: string;
  startedAt?: string;
  createdAt?: string;
  dueAt?: string;
  progress?: number;
  health?: string;
  completedAt?: string;
  sowId?: string;
  planId?: string;
  status?: string;
}

interface RawProjectDetail extends RawProjectSummary {
  slaAtRiskCount?: number;
  qualityAcceptanceRate?: number;
  budgetBurnMinor?: number;
  budgetTotalMinor?: number;
  milestones?: unknown[];
  recentActivity?: unknown[];
  aiSignals?: unknown[];
  contributors?: unknown[];
  reviewers?: unknown[];
  openExceptions?: unknown[];
  resolvedExceptions?: unknown[];
  budget?: unknown;
  tasks?: unknown[];
  audit?: unknown[];
}

// ── mappers ──────────────────────────────────────────────────────────────────

function mapSummary(raw: RawProjectSummary): ProjectSummary {
  const now = new Date().toISOString();
  return {
    id: raw.id,
    name: raw.name ?? raw.projectTitle ?? raw.clientOrganisation ?? "Unnamed project",
    sponsor: raw.sponsor ?? raw.ownerEmail ?? "",
    pmo: raw.pmo ?? raw.ownerEmail ?? "",
    startedAt: raw.startedAt ?? raw.createdAt ?? now,
    dueAt: raw.dueAt ?? now,
    progress: raw.progress ?? 0,
    health: (raw.health as ProjectSummary["health"]) ?? "on_track",
    completedAt: raw.completedAt,
    sowId: raw.sowId,
    planId: raw.planId,
  };
}

function mapDetail(raw: RawProjectDetail): ProjectDetail {
  const summary = mapSummary(raw);
  return {
    ...summary,
    slaAtRiskCount: raw.slaAtRiskCount ?? 0,
    qualityAcceptanceRate: raw.qualityAcceptanceRate ?? 1,
    budgetBurnMinor: raw.budgetBurnMinor ?? 0,
    budgetTotalMinor: raw.budgetTotalMinor ?? 0,
    milestones: (raw.milestones ?? []) as ProjectDetail["milestones"],
    recentActivity: (raw.recentActivity ?? []) as ProjectDetail["recentActivity"],
    aiSignals: (raw.aiSignals ?? []) as ProjectDetail["aiSignals"],
    contributors: (raw.contributors ?? []) as ProjectDetail["contributors"],
    reviewers: (raw.reviewers ?? []) as ProjectDetail["reviewers"],
    openExceptions: (raw.openExceptions ?? []) as ProjectDetail["openExceptions"],
    resolvedExceptions: (raw.resolvedExceptions ?? []) as ProjectDetail["resolvedExceptions"],
    budget: (raw.budget ?? {
      budgetMinor: 0,
      committedMinor: 0,
      paidMinor: 0,
      pendingMinor: 0,
      forecastMinor: 0,
      forecastDeltaPct: 0,
      byMilestone: [],
      byRole: [],
    }) as ProjectDetail["budget"],
    tasks: (raw.tasks ?? []) as ProjectDetail["tasks"],
    audit: (raw.audit ?? []) as ProjectDetail["audit"],
  };
}

// ── API functions ─────────────────────────────────────────────────────────────

export class EnterpriseProjectsError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "EnterpriseProjectsError";
  }
}

async function parseOk<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string; detail?: string };
      message = body.error ?? body.detail ?? message;
    } catch {
      // keep statusText
    }
    throw new EnterpriseProjectsError(message, res.status);
  }
  return (await res.json()) as T;
}

/**
 * Fetch all active projects (and completed ones are filtered client-side by
 * checking project.health === "done" || project.completedAt).
 */
export async function listEnterpriseProjects(): Promise<{
  active: ProjectSummary[];
  completed: ProjectSummary[];
}> {
  const res = await fetchInternal("/api/enterprise/projects", { cache: "no-store" });
  const body = await parseOk<{ projects: RawProjectSummary[] }>(res);
  const all = (body.projects ?? []).map(mapSummary);

  const active = all.filter(
    (p) => p.health !== "done" && !p.completedAt,
  );
  const completed = all.filter(
    (p) => p.health === "done" || !!p.completedAt,
  );
  return { active, completed };
}

/**
 * Fetch a single project by id mapped to ProjectDetail.
 * Returns null when the project does not exist (404).
 */
export async function getEnterpriseProject(
  projectId: string,
): Promise<ProjectDetail | null> {
  const res = await fetchInternal(
    `/api/enterprise/projects/${encodeURIComponent(projectId)}`,
    { cache: "no-store" },
  );
  if (res.status === 404) return null;
  const raw = await parseOk<RawProjectDetail>(res);
  return mapDetail(raw);
}
