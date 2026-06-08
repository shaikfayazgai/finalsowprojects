/* Contributor mock data for end-to-end workflow testing */

/* 1. Profile */
export const mockContributorProfile = {
  id: "",
  displayName: "",
  anonymousId: "",
  avatar: "",
  email: "",
  phone: "",
  track: "",
  verificationStatus: "",
  joinedAt: "",
  profileCompleteness: 0,
  timezone: "",
  weeklyHours: 0,
  availability: "",
  language: "",
  bio: "",
  country: "",
  city: "",
  skills: [] as Array<{
    name: string;
    proficiency: string;
    source: string;
    validatedCount: number;
    evidenceCount: number;
    lastValidatedAt?: string;
  }>,
  onboardingComplete: false,
  evidence: [] as Array<{ id: string; type: string; title: string; url?: string; uploadedAt: string }>,
  consents: [] as Array<{ id: string; type: string; acceptedAt: string; version: string }>,
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
  totalEarned: 0,
  eligible: 0,
  pending: 0,
  processing: 0,
  paidOut: 0,
  currency: "USD",
  currentMonth: 0,
  previousMonth: 0,
  lifetimeTasksCompleted: 0,
  averagePerTask: 0,
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
  contributorId: "",
  updatedAt: "",
  tasksCompleted: 0,
  totalSubmissions: 0,
  acceptanceRate: 0,
  onTimeDelivery: 0,
  slaCompliance: 0,
  averageReviewScore: 0,
  totalHoursLogged: 0,
  averageHoursPerTask: 0,
  skillGrowthRate: 0,
  reworkRate: 0,
  streakDays: 0,
  longestStreak: 0,
  topSkills: [] as Array<{ skill: string; tasksCompleted: number; avgScore: number }>,
  monthlyActivity: [] as Array<{ month: string; tasksCompleted: number; hoursLogged: number; earned: number }>,
  aiInsights: [] as string[],
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
  taskId: "",
  instructions: "",
  templates: [],
  uploads: [],
  links: [],
  qaMessages: [],
  evidenceChecklist: [],
};

/* 13. Onboarding reference data */
export const mockSkillsTaxonomy = [];

export const mockConsentItems = [];

export const mockUniversities = [];

export const mockOnboardingSteps = [];

/* 14. Message threads */
export const mockMessageThreads: Array<Record<string, any>> = [];
