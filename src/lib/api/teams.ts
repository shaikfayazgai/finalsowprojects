/**
 * Teams API client — project-scoped team composition, skill coverage,
 * and skill review requests.
 *
 * Calls go through the shared /api/decomposition/proxy route which
 * handles enterprise token acquisition (including MFA-skipped flows).
 */

import { ApiError } from "./client";

// ── Response types (mirror OpenAPI schemas) ──────────────────────────────

export type TaskExecutionStatus = "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "DONE";

export interface TeamTaskItem {
  task_id: string;
  task_title: string;
  contributors: string[];
  skills: string[];
  execution_status: TaskExecutionStatus;
}

export interface TeamCompositionResponse {
  project_id: string;
  tasks: TeamTaskItem[];
}

export interface SkillCoverageRow {
  skill: string;
  task_count: number;
}

export interface SkillCoverageResponse {
  project_id: string;
  skills: SkillCoverageRow[];
}

export interface SkillReviewRequestBody {
  note?: string | null;
}

export interface SkillReviewRequestResponse {
  request_id: string;
  project_id: string;
  status: string;
  created_at: string;
  message: string;
}

export type ProjectStatus =
  | "BACKLOG" | "IN_PROGRESS" | "IN_REVIEW" | "ACCEPTED" | "ON_HOLD"
  | "active" | "draft" | "archived" | "REWORK" | "completed";

export type ProjectHealth = "OK" | "AT_RISK" | "BEHIND";
export type ProjectMilestone = "ON_TRACK" | "M1_DUE" | "M2_OVERDUE";

export interface ProjectDashboardItem {
  id: string;
  name: string;
  summary?: string | null;
  status: ProjectStatus;
  health: ProjectHealth;
  milestone: ProjectMilestone;
  completion_pct: number;
  updated_at: string;
}

export interface ProjectListResponse {
  projects: ProjectDashboardItem[];
}

// ── Proxy helper ────────────────────────────────────────────────────────

async function teamsCall<T>(
  path: string,
  method: string = "GET",
  payload?: unknown,
): Promise<T> {
  const res = await fetch("/api/decomposition/proxy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, method, ...(payload !== undefined ? { payload } : {}) }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error(`[Teams API] ${method} ${path} → ${res.status}`, data);

    if (data?.errors && Array.isArray(data.errors)) {
      const fieldErrors = data.errors
        .map((e: { field?: string; message?: string }) => {
          const field = e.field?.split(" → ").pop() ?? e.field ?? "";
          return `${field}: ${e.message}`;
        })
        .join("; ");
      throw new ApiError(res.status, fieldErrors || data.message || "Validation failed");
    }

    const msg = data?.detail?.message ?? data?.detail ?? data?.error ?? data?.message ?? `API error ${res.status}`;
    throw new ApiError(res.status, typeof msg === "string" ? msg : JSON.stringify(msg));
  }

  return data as T;
}

// ── Teams API ────────────────────────────────────────────────────────────

export const teamsApi = {
  /** GET /api/v1/portfolio/projects — list all enterprise projects */
  listProjects(): Promise<ProjectListResponse> {
    return teamsCall<ProjectListResponse>("/api/v1/portfolio/projects");
  },

  /** GET /api/v1/projects/{project_id}/team-composition */
  getTeamComposition(projectId: string): Promise<TeamCompositionResponse> {
    return teamsCall<TeamCompositionResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/team-composition`,
    );
  },

  /** GET /api/v1/projects/{project_id}/skill-coverage */
  getSkillCoverage(projectId: string): Promise<SkillCoverageResponse> {
    return teamsCall<SkillCoverageResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/skill-coverage`,
    );
  },

  /** POST /api/v1/projects/{project_id}/skill-review-request */
  postSkillReviewRequest(
    projectId: string,
    body?: SkillReviewRequestBody,
  ): Promise<SkillReviewRequestResponse> {
    return teamsCall<SkillReviewRequestResponse>(
      `/api/v1/projects/${encodeURIComponent(projectId)}/skill-review-request`,
      "POST",
      body ?? {},
    );
  },
};
