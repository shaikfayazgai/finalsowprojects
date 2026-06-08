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
export const mockSkillsTaxonomy = [
  { category: "Frontend", skills: ["React", "Vue.js", "Angular", "Next.js", "TypeScript", "HTML/CSS", "Tailwind CSS", "Svelte"] },
  { category: "Backend", skills: ["Node.js", "Python", "Java", "Go", "Ruby", "PHP", "Rust", "C#"] },
  { category: "Database", skills: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "DynamoDB"] },
  { category: "DevOps", skills: ["Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "CI/CD", "Linux"] },
  { category: "Mobile", skills: ["React Native", "Flutter", "Swift", "Kotlin", "Ionic"] },
  { category: "Data & AI", skills: ["Machine Learning", "Data Analysis", "TensorFlow", "PyTorch", "NLP", "Computer Vision"] },
  { category: "Design", skills: ["Figma", "UI/UX Design", "Prototyping", "User Research", "Design Systems"] },
  { category: "Other", skills: ["Technical Writing", "Project Management", "QA/Testing", "Security", "Blockchain"] },
];

export const mockConsentItems = [
  { id: "consent-tos", type: "terms_of_service" as const, title: "Terms of Service", description: "I agree to the GlimmoraTeam Terms of Service, including task delivery obligations and quality standards.", required: true, version: "1.0" },
  { id: "consent-privacy", type: "privacy_policy" as const, title: "Privacy Policy", description: "I understand how my data is collected, used, and protected as described in the Privacy Policy.", required: true, version: "1.0" },
  { id: "consent-data", type: "data_processing" as const, title: "Data Processing Agreement", description: "I consent to the processing of my performance data for skill validation, match scoring, and digital twin analytics.", required: true, version: "1.0" },
  { id: "consent-code", type: "communications" as const, title: "Code of Conduct", description: "I agree to maintain professional conduct, respect confidentiality, and uphold platform integrity standards.", required: true, version: "1.0" },
  { id: "consent-comm", type: "communications" as const, title: "Communications", description: "I agree to receive task notifications, review updates, and platform announcements via email and in-app messaging.", required: false, version: "1.0" },
];

export const mockUniversities = [
  { id: "uni-001", name: "Indian Institute of Technology, Bangalore", country: "India" },
  { id: "uni-002", name: "Indian Institute of Technology, Delhi", country: "India" },
  { id: "uni-003", name: "Indian Institute of Technology, Mumbai", country: "India" },
  { id: "uni-004", name: "LUMS — Lahore University of Management Sciences", country: "Pakistan" },
  { id: "uni-005", name: "NUST — National University of Sciences & Technology", country: "Pakistan" },
  { id: "uni-006", name: "University of the Philippines, Diliman", country: "Philippines" },
  { id: "uni-007", name: "Universiti Malaya", country: "Malaysia" },
  { id: "uni-008", name: "National University of Singapore", country: "Singapore" },
  { id: "uni-009", name: "University of Lagos", country: "Nigeria" },
  { id: "uni-010", name: "University of Cape Town", country: "South Africa" },
];

export const mockOnboardingSteps = [
  { id: "step-register", order: 1, title: "Welcome", path: "/onboarding", track: "all" as const },
  { id: "step-verify", order: 2, title: "Verify Identity", path: "/onboarding/verify", track: "all" as const },
  { id: "step-consent", order: 3, title: "Consent", path: "/onboarding/consent", track: "all" as const },
  { id: "step-skills", order: 4, title: "Skills", path: "/onboarding/skills", track: "all" as const },
  { id: "step-evidence", order: 5, title: "Evidence", path: "/onboarding/evidence", track: "all" as const },
  { id: "step-availability", order: 6, title: "Availability", path: "/onboarding/availability", track: "all" as const },
  { id: "step-track", order: 7, title: "Track Setup", path: "", track: "all" as const },
  { id: "step-complete", order: 8, title: "Complete", path: "/onboarding/complete", track: "all" as const },
];

/* 14. Message threads */
export const mockMessageThreads: Array<Record<string, any>> = [];
