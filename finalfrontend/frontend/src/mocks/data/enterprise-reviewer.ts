/* ══════════════════════════════════════════════════════════════
   Enterprise reviewer mock data — emptied. Pages should treat these
   as placeholders until real APIs are wired in.
   ══════════════════════════════════════════════════════════════ */

export const mockReviewer = {
  id: "",
  name: "",
  email: "",
  role: "reviewer",
  assignedProjects: [] as string[],
  slaComplianceRate: 0,
  recommendationAcceptanceRate: 0,
  averageReviewTimeHours: 0,
  reviewsCompleted: 0,
};

export const mockReviewQueue: Array<Record<string, any>> = [];

export const mockTaskMonitor: Array<Record<string, any>> = [];

export const mockQAMessages: Array<Record<string, any>> = [];

export const mockReviewHistory: Array<Record<string, any>> = [];

export const mockMentoringLog: Array<Record<string, any>> = [];

export const mockMyMetrics = {
  slaCompliance: { current: 0, previous: 0, target: 0 },
  recommendationAcceptanceRate: { current: 0, previous: 0, target: 0 },
  averageReviewTimeHours: { current: 0, previous: 0, target: 0 },
  reviewsCompleted: { thisWeek: 0, thisMonth: 0, total: 0 },
  overrideRate: { reviewerAcceptEnterpriseRework: 0, reviewerReworkEnterpriseAccept: 0 },
  rubricScoresByDimension: [] as Array<{ dimension: string; averageScore: number }>,
};

export const mockReviewerNotifications: Array<Record<string, any>> = [];
