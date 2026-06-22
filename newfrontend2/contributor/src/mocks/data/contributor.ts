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
export const mockContributorTasks: Array<Record<string, any>> = [
  { id: "task-501", title: "Annotate mobile UX screenshots", projectTitle: "Retail CX Insight", milestoneTitle: "Batch A", status: "in_progress", priority: "high", dueAt: "2026-04-26T17:30:00.000Z", payoutAmount: 48, payoutCurrency: "USD", estimatedHours: 4.5, tags: ["ui", "annotation"] },
  { id: "task-502", title: "Review model response quality", projectTitle: "Support AI Tuning", milestoneTitle: "SFT Pass 3", status: "assigned", priority: "medium", dueAt: "2026-04-27T12:00:00.000Z", payoutAmount: 35, payoutCurrency: "USD", estimatedHours: 3, tags: ["evaluation", "quality"] },
  { id: "task-503", title: "Summarize policy docs", projectTitle: "Compliance CoPilot", milestoneTitle: "Iteration 5", status: "submitted", priority: "medium", dueAt: "2026-04-24T18:00:00.000Z", payoutAmount: 42, payoutCurrency: "USD", estimatedHours: 3.5, tags: ["summarization", "policy"] },
  { id: "task-504", title: "Build edge-case prompt set", projectTitle: "Prompt Safety", milestoneTitle: "Safety Sweep", status: "rework_requested", priority: "high", dueAt: "2026-04-25T16:00:00.000Z", payoutAmount: 55, payoutCurrency: "USD", estimatedHours: 5, tags: ["prompting", "safety"] },
  { id: "task-505", title: "Entity extraction QA", projectTitle: "Invoice Parser", milestoneTitle: "Validation", status: "completed", priority: "low", dueAt: "2026-04-20T13:00:00.000Z", payoutAmount: 30, payoutCurrency: "USD", estimatedHours: 2.5, tags: ["nlp", "qa"] },
];

/* 3. Submissions */
export const mockSubmissions: Array<Record<string, any>> = [
  { id: "sub-9001", taskId: "task-503", title: "Policy summary draft v1", status: "accepted", submittedAt: "2026-04-23T14:10:00.000Z", score: 94, version: 2, reviewerNotes: "Great structure and concise language." },
  { id: "sub-9002", taskId: "task-504", title: "Prompt safety set draft", status: "needs_revision", submittedAt: "2026-04-24T10:45:00.000Z", score: 71, version: 1, reviewerNotes: "Add 15 more adversarial edge cases." },
  { id: "sub-9003", taskId: "task-505", title: "Invoice QA report", status: "accepted", submittedAt: "2026-04-20T11:18:00.000Z", score: 90, version: 1, reviewerNotes: "Good coverage and evidence links." },
  { id: "sub-9004", taskId: "task-501", title: "Screenshot annotation draft", status: "draft", submittedAt: "2026-04-24T12:05:00.000Z", score: null, version: 1, reviewerNotes: null },
];

/* 4. Earnings records */
export const mockEarnings: Array<Record<string, any>> = [
  {
    id: "ern_003", task_id: "tsk_c3", task_title: "Audio transcription QC",
    project_title: "Speech", amount: "44.00", currency: "USD", status: "earned",
    acceptance_date: "2026-04-01", earned_at: "2026-04-01T16:45:00Z",
    paid_at: null, estimated_eligible_date: "2026-04-10",
    expected_payment_date: "2026-04-14", payment_reference: null, payout_id: null,
  },
  {
    id: "ern_004", task_id: "tsk_d4", task_title: "Edge case tagging",
    project_title: "Vision QA", amount: "200.00", currency: "USD", status: "on_hold",
    acceptance_date: "2026-04-02", earned_at: "2026-04-02T10:00:00Z",
    paid_at: null, estimated_eligible_date: "2026-04-08",
    expected_payment_date: "2026-04-16", payment_reference: null, payout_id: "po_002",
  },
  {
    id: "ern_001", task_id: "tsk_a1", task_title: "Label dataset batch 12",
    project_title: "Vision QA", amount: "120.00", currency: "USD", status: "paid",
    acceptance_date: "2026-03-10", earned_at: "2026-03-10T14:30:00Z",
    paid_at: "2026-03-15T09:00:00Z", estimated_eligible_date: null,
    expected_payment_date: null, payment_reference: "PO-2026-0001", payout_id: "po_001",
  },
  {
    id: "ern_demo_extra", task_id: "tsk_006", task_title: "Large migration script (over-cap test)",
    project_title: "Finance", amount: "95.25", currency: "USD", status: "earned",
    acceptance_date: "2026-04-05", earned_at: "2026-04-05T09:00:00Z",
    paid_at: null, estimated_eligible_date: "2026-04-12",
    expected_payment_date: "2026-04-18", payment_reference: null, payout_id: null,
  },
  {
    id: "ern_002", task_id: "tsk_b2", task_title: "Review annotations",
    project_title: "NLP Assist", amount: "85.50", currency: "USD", status: "earned",
    acceptance_date: "2026-03-28", earned_at: "2026-03-28T11:00:00Z",
    paid_at: null, estimated_eligible_date: "2026-04-05",
    expected_payment_date: "2026-04-09", payment_reference: null, payout_id: null,
  },
];

/* 5. Payouts */
export const mockPayouts: Array<Record<string, any>> = [
  { id: "payout-3001", reference: "PO-77421", amount: 30, currency: "USD", method: "upi", status: "completed", initiatedAt: "2026-04-21T09:00:00.000Z", completedAt: "2026-04-21T09:14:00.000Z" },
  { id: "payout-3002", reference: "PO-77457", amount: 42, currency: "USD", method: "bank_transfer", status: "processing", initiatedAt: "2026-04-24T08:30:00.000Z", completedAt: null },
];

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
export const mockCredentials: Array<Record<string, any>> = [
  { id: "cred-001", name: "Frontend Quality Specialist", issuer: "Glimmora Academy", status: "active", level: "advanced", issuedAt: "2026-01-30T12:00:00.000Z", expiresAt: "2027-01-30T12:00:00.000Z" },
  { id: "cred-002", name: "Prompt Safety Reviewer", issuer: "Glimmora Academy", status: "active", level: "intermediate", issuedAt: "2026-02-10T12:00:00.000Z", expiresAt: "2027-02-10T12:00:00.000Z" },
  { id: "cred-003", name: "NLP Data Annotator", issuer: "Glimmora Academy", status: "renewal_due", level: "intermediate", issuedAt: "2025-05-01T12:00:00.000Z", expiresAt: "2026-05-01T12:00:00.000Z" },
];

/* 8. Learning recommendations */
export const mockLearningRecommendations: Array<Record<string, any>> = [
  { id: "learn-101", title: "Advanced rubric-based reviews", provider: "Glimmora Learn", kind: "course", durationMinutes: 35, status: "new", matchScore: 94, reason: "Improves acceptance consistency for current task stream.", url: "https://example.com/learning/rubric-reviews" },
  { id: "learn-102", title: "Detecting annotation drift", provider: "Glimmora Learn", kind: "guide", durationMinutes: 18, status: "in_progress", matchScore: 88, reason: "Recommended from recent screenshot annotation tasks.", url: "https://example.com/learning/annotation-drift" },
  { id: "learn-103", title: "Prompt red-team checklist", provider: "Glimmora Learn", kind: "template", durationMinutes: 12, status: "new", matchScore: 91, reason: "Supports rework items in safety prompts.", url: "https://example.com/learning/red-team-checklist" },
];

/* 9. Support tickets */
export const mockSupportTickets: Array<Record<string, any>> = [
  { id: "sup-7001", subject: "Task 504 deadline clarification", category: "task_support", priority: "high", status: "open", createdAt: "2026-04-24T09:25:00.000Z", updatedAt: "2026-04-24T10:00:00.000Z", lastMessage: "Please confirm if extension to Apr 26 is allowed." },
  { id: "sup-7002", subject: "Payout processing timeline", category: "payout", priority: "medium", status: "resolved", createdAt: "2026-04-22T11:00:00.000Z", updatedAt: "2026-04-23T16:30:00.000Z", lastMessage: "Payout moved to processing queue and will complete in 24h." },
];

/* 10. Notifications */
export const mockNotifications: Array<Record<string, any>> = [
  { id: "note-1", type: "task", title: "New task assigned", body: "Task 502 has been assigned to you.", read: false, createdAt: "2026-04-24T06:20:00.000Z" },
  { id: "note-2", type: "review", title: "Rework requested", body: "Task 504 needs additional edge-case prompts.", read: false, createdAt: "2026-04-24T08:10:00.000Z" },
  { id: "note-3", type: "earning", title: "Earnings unlocked", body: "Task 503 is now eligible for payout.", read: true, createdAt: "2026-04-23T15:40:00.000Z" },
];

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
export const mockMessageThreads: Array<Record<string, any>> = [
  {
    id: "thr-5001",
    subject: "Task 504 review notes",
    participantName: "Aisha (Reviewer)",
    unreadCount: 1,
    updatedAt: "2026-04-24T08:12:00.000Z",
    messages: [
      { id: "msg-1", sender: "reviewer", body: "Please add failure-mode prompts around ambiguity handling.", sentAt: "2026-04-24T08:00:00.000Z" },
      { id: "msg-2", sender: "contributor", body: "Got it, I will submit updated set in 2 hours.", sentAt: "2026-04-24T08:12:00.000Z" },
    ],
  },
  {
    id: "thr-5002",
    subject: "Payout method verification",
    participantName: "Finance Support",
    unreadCount: 0,
    updatedAt: "2026-04-23T16:30:00.000Z",
    messages: [
      { id: "msg-3", sender: "support", body: "UPI handle verified. Future payouts will use this method.", sentAt: "2026-04-23T16:30:00.000Z" },
    ],
  },
];
