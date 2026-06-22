import { apiCall } from "./client";
import type {
  PortfolioProjectsResponse,
  PortfolioSummaryMetrics,
  ProjectCardSummary,
  ProjectDetail,
  ProjectOverviewResponse,
  ProjectActivitiesResponse,
  ProjectTimelineResponse,
  TimelineView,
  EvidencePacksResponse,
  EvidencePackStatus,
  ReworkRequestsResponse,
  ReworkRequestStatus,
  ExceptionsResponse,
  ProjectException,
  ExceptionCreateRequest,
  ProjectStatusUpdateRequest,
} from "@/types/enterprise";

const BASE = "/api/v1";

/* ══════════════════════════════════════════════════════════════
   PORTFOLIO ENDPOINTS
   ══════════════════════════════════════════════════════════════ */

export interface PortfolioProjectsParams {
  health?: string;
  status?: string;
  milestone?: string;
  sort_by?: string;
}

export async function getPortfolioProjects(
  params?: PortfolioProjectsParams,
): Promise<PortfolioProjectsResponse> {
  const query = new URLSearchParams();
  if (params?.health) query.set("health", params.health);
  if (params?.status) query.set("status", params.status);
  if (params?.milestone) query.set("milestone", params.milestone);
  if (params?.sort_by) query.set("sort_by", params.sort_by);
  const qs = query.toString();
  return apiCall<PortfolioProjectsResponse>(
    `${BASE}/portfolio/projects${qs ? `?${qs}` : ""}`,
  );
}

export async function getPortfolioSummaryMetrics(): Promise<PortfolioSummaryMetrics> {
  return apiCall<PortfolioSummaryMetrics>(`${BASE}/portfolio/summary-metrics`);
}

export async function getProjectCardSummary(
  projectId: string,
): Promise<ProjectCardSummary> {
  return apiCall<ProjectCardSummary>(
    `${BASE}/portfolio/project-summary/${projectId}`,
  );
}

export async function exportPortfolio(): Promise<Blob> {
  const baseUrl =
    process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL;
  const res = await fetch(`${baseUrl}${BASE}/portfolio/export`);
  if (!res.ok) throw new Error(`Export failed: ${res.status}`);
  return res.blob();
}

/* ══════════════════════════════════════════════════════════════
   PROJECT ENDPOINTS
   ══════════════════════════════════════════════════════════════ */

export async function getProjectDetail(
  projectId: string,
): Promise<ProjectDetail> {
  return apiCall<ProjectDetail>(`${BASE}/projects/${projectId}`);
}

export async function getProjectOverview(
  projectId: string,
): Promise<ProjectOverviewResponse> {
  return apiCall<ProjectOverviewResponse>(
    `${BASE}/projects/${projectId}/overview`,
  );
}

export async function getProjectActivities(
  projectId: string,
): Promise<ProjectActivitiesResponse> {
  return apiCall<ProjectActivitiesResponse>(
    `${BASE}/projects/${projectId}/activities`,
  );
}

export async function getProjectTimeline(
  projectId: string,
  view: TimelineView = "gantt",
): Promise<ProjectTimelineResponse> {
  return apiCall<ProjectTimelineResponse>(
    `${BASE}/projects/${projectId}/timeline?view=${view}`,
  );
}

export async function getCompletedProjects(): Promise<PortfolioProjectsResponse> {
  return apiCall<PortfolioProjectsResponse>(`${BASE}/projects/completed`);
}

/* ── Evidence Packs ── */

export interface EvidencePacksParams {
  status?: EvidencePackStatus;
  milestone_id?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export async function getEvidencePacks(
  projectId: string,
  params?: EvidencePacksParams,
): Promise<EvidencePacksResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.milestone_id) query.set("milestone_id", params.milestone_id);
  if (params?.start_date) query.set("start_date", params.start_date);
  if (params?.end_date) query.set("end_date", params.end_date);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiCall<EvidencePacksResponse>(
    `${BASE}/projects/${projectId}/evidence-packs${qs ? `?${qs}` : ""}`,
  );
}

/* ── Rework Requests ── */

export interface ReworkRequestsParams {
  status?: ReworkRequestStatus;
  milestone_id?: string;
  round?: number;
  task?: string;
  deadline_from?: string;
  deadline_to?: string;
  page?: number;
  limit?: number;
}

export async function getReworkRequests(
  projectId: string,
  params?: ReworkRequestsParams,
): Promise<ReworkRequestsResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.milestone_id) query.set("milestone_id", params.milestone_id);
  if (params?.round) query.set("round", String(params.round));
  if (params?.task) query.set("task", params.task);
  if (params?.deadline_from) query.set("deadline_from", params.deadline_from);
  if (params?.deadline_to) query.set("deadline_to", params.deadline_to);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiCall<ReworkRequestsResponse>(
    `${BASE}/projects/${projectId}/rework-requests${qs ? `?${qs}` : ""}`,
  );
}

/* ── Exceptions ── */

export async function getProjectExceptions(
  projectId: string,
): Promise<ExceptionsResponse> {
  return apiCall<ExceptionsResponse>(
    `${BASE}/projects/${projectId}/exceptions`,
  );
}

export async function createProjectException(
  projectId: string,
  body: ExceptionCreateRequest,
): Promise<ProjectException> {
  return apiCall<ProjectException>(
    `${BASE}/projects/${projectId}/exceptions`,
    { method: "POST", body: JSON.stringify(body) },
  );
}

/* ── Project Actions ── */

export async function updateProjectStatus(
  projectId: string,
  body: ProjectStatusUpdateRequest,
): Promise<ProjectDetail> {
  return apiCall<ProjectDetail>(`${BASE}/projects/${projectId}/status`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function holdProject(projectId: string): Promise<ProjectDetail> {
  return apiCall<ProjectDetail>(`${BASE}/projects/${projectId}/hold`, {
    method: "POST",
  });
}

export async function resumeProject(
  projectId: string,
): Promise<ProjectDetail> {
  return apiCall<ProjectDetail>(`${BASE}/projects/${projectId}/resume`, {
    method: "POST",
  });
}

export async function kickoffProject(
  body: Record<string, unknown>,
): Promise<ProjectDetail> {
  return apiCall<ProjectDetail>(`${BASE}/projects/kickoff`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function downloadProjectReport(
  projectId: string,
): Promise<Blob> {
  const baseUrl =
    process.env.NEXT_PUBLIC_GLIMMORA_API_URL ?? process.env.GLIMMORA_API_URL;
  const res = await fetch(`${baseUrl}${BASE}/projects/${projectId}/report`);
  if (!res.ok) throw new Error(`Report download failed: ${res.status}`);
  return res.blob();
}

/* ── Grouped export ── */

export const portfolioApi = {
  getPortfolioProjects,
  getPortfolioSummaryMetrics,
  getProjectCardSummary,
  exportPortfolio,
  getProjectDetail,
  getProjectOverview,
  getProjectActivities,
  getProjectTimeline,
  getCompletedProjects,
  getEvidencePacks,
  getReworkRequests,
  getProjectExceptions,
  createProjectException,
  updateProjectStatus,
  holdProject,
  resumeProject,
  kickoffProject,
  downloadProjectReport,
};
