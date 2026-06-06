import { apiCall, ApiError } from "./client";

export interface ReviewerDashboardData {
  assignedTaskCount: number;
  pendingEvidenceReviews: number;
  completedLast30Days: number;
  evidenceRecommendationsAccept: number;
  evidenceRecommendationsRework: number;
  evidenceApprovalRatePercent: number | null;
}

export interface ReviewerAssignment {
  id: string;
  title: string;
  status: string;
  assignedAt?: string | null;
  taskKind?: string | null;
  relatedId?: string | null;
  notes?: string | null;
}

function unwrapData<T>(raw: { data?: T; success?: boolean }): T {
  if (raw?.data === undefined || raw?.data === null) {
    throw new ApiError(500, "Unexpected API response (missing data).");
  }
  return raw.data as T;
}

export const reviewerApi = {
  async getDashboard(accessToken: string): Promise<ReviewerDashboardData> {
    const raw = await apiCall<{ data: ReviewerDashboardData }>("/api/v1/reviewer/dashboard", {
      method: "GET",
      token: accessToken,
    });
    return unwrapData(raw);
  },

  async listAssignments(accessToken: string): Promise<ReviewerAssignment[]> {
    const raw = await apiCall<{ data: ReviewerAssignment[] }>("/api/v1/reviewer/projects", {
      method: "GET",
      token: accessToken,
    });
    return unwrapData(raw);
  },

  async updateAssignmentStatus(
    accessToken: string,
    assignmentId: string,
    status: "pending" | "in_progress" | "completed",
  ): Promise<ReviewerAssignment> {
    const raw = await apiCall<{ data: ReviewerAssignment }>(
      `/api/v1/reviewer/assignments/${encodeURIComponent(assignmentId)}`,
      {
        method: "PATCH",
        token: accessToken,
        body: JSON.stringify({ status }),
      },
    );
    return unwrapData(raw);
  },

  async recommendEvidence(
    accessToken: string,
    evidenceId: string,
    body: { score: number; comment: string; recommendation: "ACCEPT" | "REWORK" },
  ): Promise<{ evidenceId: string; score: number; recommendation: string }> {
    const raw = await apiCall<{ data: { evidenceId: string; score: number; recommendation: string } }>(
      `/api/v1/reviewer/evidence/${encodeURIComponent(evidenceId)}/recommend`,
      {
        method: "POST",
        token: accessToken,
        body: JSON.stringify(body),
      },
    );
    return unwrapData(raw);
  },
};
