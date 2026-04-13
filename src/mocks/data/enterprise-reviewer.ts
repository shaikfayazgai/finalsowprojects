import type { SkillTag } from "@/types/enterprise";

/* ── Helpers ── */
const skill = (name: string): SkillTag => ({ name, source: "ai", confidence: 0.9 });

/* ══════════════════════════════════════════════════════════════
   REVIEWER PROFILE
   ══════════════════════════════════════════════════════════════ */
export const mockReviewer = {
  id: "reviewer-001",
  name: "Battula Leela Krishna",
  email: "leelakrishnabattula@gmail.com",
  role: "reviewer",
  assignedProjects: ["proj-001", "proj-002", "proj-005"],
  slaComplianceRate: 94,
  recommendationAcceptanceRate: 88,
  averageReviewTimeHours: 18,
  reviewsCompleted: 42,
};

/* ══════════════════════════════════════════════════════════════
   REVIEW QUEUE ITEMS
   ══════════════════════════════════════════════════════════════ */
export const mockReviewQueue = [
  {
    id: "rq-001",
    taskId: "task-004",
    taskTitle: "Finance module — General Ledger",
    projectName: "ERP Platform Decomposition",
    projectId: "proj-001",
    contributorId: "Contributor-D2M",
    submittedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    slaDeadline: new Date(Date.now() + 36 * 3600000).toISOString(),
    status: "submitted",
    reworkRound: 1,
    totalRounds: 3,
    evidenceFiles: 4,
    acceptanceCriteria: [
      "Chart of accounts CRUD",
      "Double-entry journal posting",
      "Trial balance generation",
      "P&L and balance sheet reports",
    ],
    submissionNotes: "All acceptance criteria implemented. Unit tests passing at 94% coverage.",
    aiSuggestedScores: [4, 3, 4, 3],
  },
  {
    id: "rq-002",
    taskId: "task-005",
    taskTitle: "Finance module — Accounts Payable",
    projectName: "ERP Platform Decomposition",
    projectId: "proj-001",
    contributorId: "Contributor-A7X",
    submittedAt: new Date(Date.now() - 36 * 3600000).toISOString(),
    slaDeadline: new Date(Date.now() + 4 * 3600000).toISOString(),
    status: "submitted",
    reworkRound: 1,
    totalRounds: 3,
    evidenceFiles: 5,
    acceptanceCriteria: [
      "Vendor CRUD with approval flow",
      "Invoice OCR processing",
      "Payment scheduling with reminders",
      "Three-way matching",
    ],
    submissionNotes: "Vendor management and invoice processing complete. Payment scheduling in progress.",
    aiSuggestedScores: [5, 4, 3, 4],
  },
  {
    id: "rq-003",
    taskId: "task-hp-003",
    taskTitle: "Patient registration and profile",
    projectName: "Healthcare Portal Decomposition",
    projectId: "proj-005",
    contributorId: "Contributor-P4R",
    submittedAt: new Date(Date.now() - 50 * 3600000).toISOString(),
    slaDeadline: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: "overdue",
    reworkRound: 2,
    totalRounds: 3,
    evidenceFiles: 3,
    acceptanceCriteria: [
      "Patient registration with ID verification",
      "Health history intake form",
      "Profile photo and document upload",
      "Consent management flow",
    ],
    submissionNotes: "Rework completed as per feedback. ID verification now includes OTP.",
    aiSuggestedScores: [4, 4, 3, 5],
  },
];

/* ══════════════════════════════════════════════════════════════
   TASK MONITOR ITEMS
   ══════════════════════════════════════════════════════════════ */
export const mockTaskMonitor = [
  {
    id: "tm-001",
    taskId: "task-004",
    taskTitle: "Finance module — General Ledger",
    projectName: "ERP Platform Decomposition",
    milestoneTitle: "Finance Module Core",
    contributorId: "Contributor-D2M",
    status: "submitted",
    deadline: new Date(Date.now() + 5 * 24 * 3600000).toISOString(),
    lastReviewerActivity: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    needsAttention: true,
    attentionReason: "Submission awaiting review",
  },
  {
    id: "tm-002",
    taskId: "task-006",
    taskTitle: "HR module — Employee records",
    projectName: "ERP Platform Decomposition",
    milestoneTitle: "HR & Workforce Management",
    contributorId: "Contributor-E5L",
    status: "in_progress",
    deadline: new Date(Date.now() + 10 * 24 * 3600000).toISOString(),
    lastReviewerActivity: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    needsAttention: true,
    attentionReason: "Midpoint checkpoint pending",
  },
  {
    id: "tm-003",
    taskId: "task-hp-004",
    taskTitle: "Appointment booking system",
    projectName: "Healthcare Portal Decomposition",
    milestoneTitle: "Patient Portal Development",
    contributorId: "Contributor-P4R",
    status: "in_progress",
    deadline: new Date(Date.now() + 7 * 24 * 3600000).toISOString(),
    lastReviewerActivity: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    needsAttention: false,
    attentionReason: "",
  },
  {
    id: "tm-004",
    taskId: "task-005",
    taskTitle: "Finance module — Accounts Payable",
    projectName: "ERP Platform Decomposition",
    milestoneTitle: "Finance Module Core",
    contributorId: "Contributor-A7X",
    status: "rework",
    deadline: new Date(Date.now() + 3 * 24 * 3600000).toISOString(),
    lastReviewerActivity: new Date(Date.now() - 3600000).toISOString(),
    needsAttention: true,
    attentionReason: "Rework coordination needed",
  },
  {
    id: "tm-005",
    taskId: "task-001",
    taskTitle: "Setup monorepo infrastructure",
    projectName: "ERP Platform Decomposition",
    milestoneTitle: "Infrastructure & Auth Foundation",
    contributorId: "Contributor-C9R",
    status: "accepted",
    deadline: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    lastReviewerActivity: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    needsAttention: false,
    attentionReason: "",
  },
];

/* ══════════════════════════════════════════════════════════════
   Q&A INBOX MESSAGES
   ══════════════════════════════════════════════════════════════ */
export const mockQAMessages = [
  {
    id: "qa-001",
    taskId: "task-006",
    taskTitle: "HR module — Employee records",
    projectName: "ERP Platform Decomposition",
    contributorId: "Contributor-E5L",
    messages: [
      {
        id: "msg-001",
        from: "contributor",
        text: "Hi Reviewer, I have a question about the org chart acceptance criteria. Should the chart support unlimited nesting or is 5 levels sufficient?",
        timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
        read: false,
      },
      {
        id: "msg-002",
        from: "contributor",
        text: "Also, should document management support versioning from day 1 or is this a phase 2 feature?",
        timestamp: new Date(Date.now() - 1 * 3600000).toISOString(),
        read: false,
      },
    ],
    isCRFlagged: false,
  },
  {
    id: "qa-002",
    taskId: "task-hp-004",
    taskTitle: "Appointment booking system",
    projectName: "Healthcare Portal Decomposition",
    contributorId: "Contributor-P4R",
    messages: [
      {
        id: "msg-003",
        from: "contributor",
        text: "The waitlist management feature — should patients be automatically notified when a slot opens, or is manual notification acceptable?",
        timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
        read: false,
      },
    ],
    isCRFlagged: true,
  },
  {
    id: "qa-003",
    taskId: "task-004",
    taskTitle: "Finance module — General Ledger",
    projectName: "ERP Platform Decomposition",
    contributorId: "Contributor-D2M",
    messages: [
      {
        id: "msg-004",
        from: "reviewer",
        text: "Good progress on the journal entries. Please ensure the trial balance export includes both monthly and YTD figures.",
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
        read: true,
      },
      {
        id: "msg-005",
        from: "contributor",
        text: "Understood. I will add both monthly and YTD figures to the trial balance export.",
        timestamp: new Date(Date.now() - 20 * 3600000).toISOString(),
        read: true,
      },
    ],
    isCRFlagged: false,
  },
];

/* ══════════════════════════════════════════════════════════════
   REVIEW HISTORY
   ══════════════════════════════════════════════════════════════ */
export const mockReviewHistory = [
  {
    id: "rh-001",
    taskId: "task-001",
    taskTitle: "Setup monorepo infrastructure",
    projectName: "ERP Platform Decomposition",
    reviewedAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    recommendation: "recommend_accept",
    enterpriseOutcome: "accepted",
    reworkRound: 1,
    rubricScores: [5, 5, 4, 5],
    overallAssessment: "Excellent infrastructure setup with comprehensive CI/CD pipeline. All acceptance criteria met and exceeded.",
    agreement: true,
  },
  {
    id: "rh-002",
    taskId: "task-002",
    taskTitle: "Auth service with Keycloak",
    projectName: "ERP Platform Decomposition",
    reviewedAt: new Date(Date.now() - 8 * 24 * 3600000).toISOString(),
    recommendation: "recommend_rework",
    enterpriseOutcome: "rework_required",
    reworkRound: 1,
    rubricScores: [4, 2, 3, 3],
    overallAssessment: "OIDC flow is solid but MFA edge cases need refinement. Session management incomplete.",
    agreement: true,
    reworkItems: [
      "MFA flow needs to handle SMS delivery failures gracefully",
      "Session refresh token rotation not implemented",
    ],
  },
  {
    id: "rh-003",
    taskId: "task-002",
    taskTitle: "Auth service with Keycloak",
    projectName: "ERP Platform Decomposition",
    reviewedAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    recommendation: "recommend_accept",
    enterpriseOutcome: "accepted",
    reworkRound: 2,
    rubricScores: [4, 4, 4, 4],
    overallAssessment: "All rework items addressed. MFA flow is now robust and session management is complete.",
    agreement: true,
  },
  {
    id: "rh-004",
    taskId: "task-008",
    taskTitle: "Frontend design system",
    projectName: "ERP Platform Decomposition",
    reviewedAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    recommendation: "recommend_accept",
    enterpriseOutcome: "rework_required",
    reworkRound: 1,
    rubricScores: [5, 4, 5, 4],
    overallAssessment: "Outstanding design system with excellent accessibility compliance.",
    agreement: false,
    overrideJustification: "Client requested additional dark mode variants before acceptance.",
  },
];

/* ══════════════════════════════════════════════════════════════
   MENTORING LOG
   ══════════════════════════════════════════════════════════════ */
export const mockMentoringLog = [
  {
    id: "mentor-001",
    contributorId: "Contributor-E5L",
    tasksCompleted: 3,
    acceptanceRate: 78,
    notes: [
      {
        id: "note-001",
        date: new Date(Date.now() - 7 * 24 * 3600000).toISOString(),
        context: "task-006",
        contextLabel: "HR module — Employee records",
        note: "Contributor shows strong React skills but needs guidance on API design patterns. Suggested reviewing RESTful best practices before next submission.",
      },
      {
        id: "note-002",
        date: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
        context: "general",
        contextLabel: "General mentoring",
        note: "Good improvement in code quality. Encouraged to add more unit tests and focus on edge case handling.",
      },
    ],
  },
  {
    id: "mentor-002",
    contributorId: "Contributor-K7Q",
    tasksCompleted: 2,
    acceptanceRate: 65,
    notes: [
      {
        id: "note-003",
        date: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
        context: "task-016",
        contextLabel: "Biometric authentication",
        note: "First submission showed unfamiliarity with native module bridging. Provided documentation links and suggested code examples.",
      },
    ],
  },
];

/* ══════════════════════════════════════════════════════════════
   MY METRICS
   ══════════════════════════════════════════════════════════════ */
export const mockMyMetrics = {
  slaCompliance: { current: 94, previous: 89, target: 90 },
  recommendationAcceptanceRate: { current: 88, previous: 91, target: 85 },
  averageReviewTimeHours: { current: 18, previous: 22, target: 24 },
  reviewsCompleted: { thisWeek: 3, thisMonth: 12, total: 42 },
  overrideRate: { reviewerAcceptEnterpriseRework: 8, reviewerReworkEnterpriseAccept: 4 },
  rubricScoresByDimension: [
    { dimension: "Functionality", averageScore: 3.8 },
    { dimension: "Code Quality", averageScore: 3.5 },
    { dimension: "Testing", averageScore: 3.2 },
    { dimension: "Documentation", averageScore: 3.9 },
  ],
};

/* ══════════════════════════════════════════════════════════════
   NOTIFICATIONS
   ══════════════════════════════════════════════════════════════ */
export const mockReviewerNotifications = [
  {
    id: "notif-001",
    priority: "high",
    type: "submission_received",
    title: "Submission received for Finance module — General Ledger",
    message: "Review due by " + new Date(Date.now() + 36 * 3600000).toLocaleDateString() + " (48 hours).",
    taskId: "task-004",
    read: false,
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "notif-002",
    priority: "high",
    type: "sla_warning",
    title: "Review due in 4 hours — Accounts Payable",
    message: "Finance module — Accounts Payable review SLA expires soon.",
    taskId: "task-005",
    read: false,
    createdAt: new Date(Date.now() - 44 * 3600000).toISOString(),
  },
  {
    id: "notif-003",
    priority: "medium",
    type: "midpoint_checkpoint",
    title: "Midpoint checkpoint — HR module Employee records",
    message: "Contributor is at approximately 50% effort. Review draft work.",
    taskId: "task-006",
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
  },
  {
    id: "notif-004",
    priority: "high",
    type: "override",
    title: "Enterprise Admin overrode your recommendation",
    message: "Frontend design system accepted despite your recommend rework. Justification: Client requested additional dark mode variants.",
    taskId: "task-008",
    read: false,
    createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
  },
];