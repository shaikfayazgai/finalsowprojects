/* Contributor mock data for end-to-end workflow testing */

/* 1. Profile */
export const mockContributorProfile = {
  id: "contrib-1001",
  displayName: "Chirag Kumar",
  anonymousId: "glim-c72f1",
  avatar: "https://i.pravatar.cc/200?img=12",
  email: "chirag.kumar@example.com",
  phone: "+91-9876543210",
  track: "software_engineering",
  verificationStatus: "verified",
  joinedAt: "2025-10-12T09:10:00.000Z",
  profileCompleteness: 92,
  timezone: "Asia/Kolkata",
  weeklyHours: 22,
  availability: "available",
  language: "en",
  bio: "Contributor focused on frontend workflows, QA handoff quality, and review-friendly delivery.",
  country: "India",
  city: "Pune",
  skills: [
    { name: "React", proficiency: "advanced", source: "self_assessed", validatedCount: 14, evidenceCount: 8, lastValidatedAt: "2026-03-11T08:30:00.000Z" },
    { name: "Next.js", proficiency: "advanced", source: "task_history", validatedCount: 11, evidenceCount: 6, lastValidatedAt: "2026-03-15T11:25:00.000Z" },
    { name: "TypeScript", proficiency: "intermediate", source: "review_feedback", validatedCount: 9, evidenceCount: 5, lastValidatedAt: "2026-03-06T17:40:00.000Z" },
    { name: "UI Testing", proficiency: "intermediate", source: "task_history", validatedCount: 7, evidenceCount: 4, lastValidatedAt: "2026-03-01T09:15:00.000Z" },
  ] as Array<{
    name: string;
    proficiency: string;
    source: string;
    validatedCount: number;
    evidenceCount: number;
    lastValidatedAt?: string;
  }>,
  onboardingComplete: true,
  evidence: [
    { id: "ev-100", type: "portfolio", title: "Contributor dashboard redesign", url: "https://example.com/portfolio/1", uploadedAt: "2026-02-10T08:00:00.000Z" },
    { id: "ev-101", type: "certificate", title: "Frontend Engineering Certificate", url: "https://example.com/certificate/1", uploadedAt: "2026-01-20T10:30:00.000Z" },
  ] as Array<{ id: string; type: string; title: string; url?: string; uploadedAt: string }>,
  consents: [
    { id: "consent-tos", type: "terms_of_service", acceptedAt: "2025-10-12T09:20:00.000Z", version: "1.0" },
    { id: "consent-privacy", type: "privacy_policy", acceptedAt: "2025-10-12T09:20:00.000Z", version: "1.0" },
    { id: "consent-data", type: "data_processing", acceptedAt: "2025-10-12T09:20:00.000Z", version: "1.0" },
  ] as Array<{ id: string; type: string; acceptedAt: string; version: string }>,
};

/* 2. Tasks */
export const mockContributorTasks: Array<Record<string, any>> = [];

/* 3. Submissions */
export const mockSubmissions: Array<Record<string, any>> = [];

/* 4. Earnings records */
export const mockEarnings: Array<Record<string, any>> = [];

/* 5. Payouts */
export const mockPayouts: Array<Record<string, any>> = [];

/* 6. Earnings summary */
export const mockEarningsSummary = {
  totalEarned: 544.75,
  eligible: 224.75,
  pending: 200,
  processing: 0,
  paidOut: 120,
  currency: "USD",
  currentMonth: 424.75,
  previousMonth: 112,
  lifetimeTasksCompleted: 5,
  averagePerTask: 108.95,
};

/* 7. Credentials */
export const mockCredentials: Array<Record<string, any>> = [];

/* 8. Learning recommendations */
export const mockLearningRecommendations: Array<Record<string, any>> = [];

/* 9. Support tickets */
export const mockSupportTickets: Array<Record<string, any>> = [];

/* 10. Notifications */
export const mockNotifications: Array<Record<string, any>> = [];

/* 11. Digital twin */
export const mockDigitalTwin = {
  contributorId: "contrib-1001",
  updatedAt: "2026-04-24T12:15:00.000Z",
  tasksCompleted: 19,
  totalSubmissions: 26,
  acceptanceRate: 0.81,
  onTimeDelivery: 0.93,
  slaCompliance: 0.95,
  averageReviewScore: 4.4,
  totalHoursLogged: 77.5,
  averageHoursPerTask: 4.08,
  skillGrowthRate: 0.21,
  reworkRate: 0.14,
  streakDays: 9,
  longestStreak: 22,
  topSkills: [
    { skill: "React", tasksCompleted: 10, avgScore: 4.6 },
    { skill: "Quality Review", tasksCompleted: 8, avgScore: 4.3 },
    { skill: "Prompting", tasksCompleted: 6, avgScore: 4.2 },
  ] as Array<{ skill: string; tasksCompleted: number; avgScore: number }>,
  monthlyActivity: [
    { month: "Jan", tasksCompleted: 4, hoursLogged: 14, earned: 120 },
    { month: "Feb", tasksCompleted: 5, hoursLogged: 19, earned: 165 },
    { month: "Mar", tasksCompleted: 4, hoursLogged: 17, earned: 138 },
    { month: "Apr", tasksCompleted: 6, hoursLogged: 27.5, earned: 175 },
  ] as Array<{ month: string; tasksCompleted: number; hoursLogged: number; earned: number }>,
  aiInsights: [
    "You perform best on short-cycle tasks with clear rubric criteria.",
    "Acceptance increases when examples are attached in first submission.",
    "Completing recommended learning improves average score by 7%.",
  ] as string[],
};

/* 12. Workroom */
export const mockWorkroomData: {
  taskId: string;
  instructions: string;
  templates: Array<Record<string, any>>;
  uploads: Array<Record<string, any>>;
  links: Array<Record<string, any>>;
  qaMessages: Array<Record<string, any>>;
  evidenceChecklist: Array<Record<string, any>>;
} = {
  taskId: "task-501",
  instructions: "Annotate each screenshot with UI issue category, severity, and one-line evidence note.",
  templates: [
    { id: "tpl-1", name: "Annotation CSV Template", format: "csv", url: "https://example.com/templates/annotation.csv" },
    { id: "tpl-2", name: "Severity Guidelines", format: "pdf", url: "https://example.com/templates/severity.pdf" },
  ],
  uploads: [
    { id: "upl-1", filename: "batchA-annot-v1.csv", sizeBytes: 81234, uploadedAt: "2026-04-24T11:30:00.000Z" },
  ],
  links: [
    { id: "lnk-1", label: "Reference board", url: "https://example.com/board/retail-cx" },
  ],
  qaMessages: [
    { id: "qa-1", sender: "reviewer", body: "Please include confidence score column.", sentAt: "2026-04-24T09:45:00.000Z" },
    { id: "qa-2", sender: "contributor", body: "Done, added as final column in CSV.", sentAt: "2026-04-24T10:10:00.000Z" },
  ],
  evidenceChecklist: [
    { id: "chk-1", label: "All rows have category", done: true },
    { id: "chk-2", label: "Severity included", done: true },
    { id: "chk-3", label: "Evidence notes non-empty", done: false },
  ],
};

/* 13. Onboarding reference data */
export const mockSkillsTaxonomy = [];

export const mockConsentItems = [];

export const mockUniversities = [];

export const mockOnboardingSteps = [];

/* 14. Message threads */
export const mockMessageThreads: Array<Record<string, any>> = [];
