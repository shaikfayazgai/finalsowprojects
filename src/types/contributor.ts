/* ══════════════════════════════════════════════════════════════
   Contributor Portal — TypeScript Interfaces
   44 flows across 11 sections (UX Flow 04)
   All mock entities cross-reference by ID for seamless drill-down
   ══════════════════════════════════════════════════════════════ */

/* ── Shared Enums & Literal Unions ── */

export type ContributorTrack = "general" | "student" | "women";
export type VerificationStatus = "unverified" | "pending" | "verified" | "expired";
export type AvailabilityStatus = "available" | "busy" | "away" | "offline";
export type ProficiencyLevel = "beginner" | "intermediate" | "advanced" | "expert";
export type SkillSourceType = "self_declared" | "delivery_validated";
export type ContributorTaskStatus = "available" | "assigned" | "in_progress" | "submitted" | "in_review" | "accepted" | "rework" | "rejected";
export type TaskComplexity = "low" | "medium" | "high" | "critical";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type SubmissionStatus = "draft" | "submitted" | "in_review" | "accepted" | "rework" | "rejected";
export type ReviewStage = "ai_review" | "peer_review" | "mentor_review" | "final_review";
export type EarningStatus = "pending" | "eligible" | "processing" | "paid" | "failed";
export type PayoutStatus = "pending" | "processing" | "completed" | "failed";
export type PayoutMethod = "bank_transfer" | "mobile_money" | "paypal" | "crypto" | "upi";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "waiting_on_user" | "resolved" | "closed";
export type TicketCategory = "task_issue" | "payment" | "technical" | "account" | "dispute" | "other";
export type NotificationType = "task_assigned" | "task_deadline" | "review_complete" | "payment_received" | "credential_earned" | "learning_suggestion" | "system" | "support_reply" | "rework_requested" | "sla_warning";
export type LearningRecommendationType = "task" | "skill" | "pathway";
export type DemandIndicator = "low" | "medium" | "high" | "trending";

/* ── 1. Contributor Profile ── */

export interface ContributorConsent {
  id: string;
  type: "terms_of_service" | "privacy_policy" | "data_processing" | "communications" | "track_specific";
  acceptedAt: string;
  version: string;
}

export interface ContributorEvidence {
  id: string;
  type: "portfolio" | "certificate" | "github" | "project_link" | "document";
  title: string;
  url?: string;
  fileKey?: string;
  uploadedAt: string;
  verified: boolean;
}

export type AccountStatus =
  | "pending_assessment"
  | "assessment_in_progress"
  | "active"
  | "suspended"
  | "deactivated";
export type KycStatus =
  | "not_started"
  | "pending"
  | "verified"
  | "rejected"
  | "expired";
export type DesignationLevel =
  | "junior"
  | "mid"
  | "senior"
  | "lead"
  | "principal";

export interface ContributorProfile {
  id: string;
  displayName: string;
  anonymousId: string;
  avatar: string;
  email: string;
  phone?: string;
  track: ContributorTrack;
  verificationStatus: VerificationStatus;
  joinedAt: string;
  profileCompleteness: number; /* 0–100 */
  timezone: string;
  weeklyHours: number;
  availability: AvailabilityStatus;
  language: string;
  preferredLanguages?: string[];
  skills: ContributorSkill[];
  evidence: ContributorEvidence[];
  consents: ContributorConsent[];
  onboardingComplete: boolean;
  activationDate?: string; /* 72-hour target for women track */
  mentorId?: string;
  bio?: string;
  country?: string;
  city?: string;
  /* ── FSD Gap additions ── */
  accountStatus: AccountStatus;
  designation?: string;
  designationLevel?: DesignationLevel;
  kycStatus: KycStatus;
  lastAvailabilityReviewedAt?: string;
  assessmentStartedAt?: string;
  assessmentCompletedAt?: string;
}

/* ── 2. Skills ── */

export interface ContributorSkill {
  name: string;
  proficiency: ProficiencyLevel;
  source: SkillSourceType;
  validatedCount: number;
  evidenceCount: number;
  lastValidatedAt?: string;
  demandLevel?: DemandIndicator;
  category?: string;
}

export interface SkillGapAnalysis {
  skillName: string;
  currentProficiency: ProficiencyLevel | null;
  requiredProficiency: ProficiencyLevel;
  gap: number; /* 0–4 scale */
  recommendedTasks: string[]; /* task IDs */
}

/* ── 3. Tasks ── */

export interface TaskPricing {
  amount: number;
  currency: string;
  model: "fixed" | "hourly" | "milestone";
  estimatedTotal?: number;
}

export interface TaskDeliverable {
  id: string;
  title: string;
  description: string;
  required: boolean;
  format?: string; /* e.g. "pdf", "figma", "zip" */
}

export interface ContributorTask {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  requiredSkills: string[];
  estimatedHours: number;
  pricing: TaskPricing;
  dueDate: string;
  slaDeadline: string;
  matchScore: number; /* 0–100 */
  matchExplanation: string;
  status: ContributorTaskStatus;
  complexity: TaskComplexity;
  priority: TaskPriority;
  phase: number;
  acceptanceCriteria: string[];
  deliverables: TaskDeliverable[];
  assignedAt?: string;
  submittedAt?: string;
  completedAt?: string;
  milestoneId?: string;
  milestoneTitle?: string;
  teamId?: string;
  dependsOn?: string[]; /* task IDs that must complete first */
  tags?: string[];
}

/* ── 4. Workroom ── */

export interface WorkroomTemplate {
  id: string;
  name: string;
  description: string;
  fileUrl: string;
  fileType: string;
}

export interface WorkroomUpload {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
  category: "deliverable" | "reference" | "evidence" | "draft";
}

export interface WorkroomLink {
  id: string;
  title: string;
  url: string;
  type: "reference" | "tool" | "documentation" | "external";
  addedBy: string;
  addedAt: string;
}

export interface EvidenceChecklistItem {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  completed: boolean;
  completedAt?: string;
  evidenceFileId?: string;
}

export interface WorkroomData {
  taskId: string;
  instructions: string;
  templates: WorkroomTemplate[];
  uploads: WorkroomUpload[];
  links: WorkroomLink[];
  qaMessages: QAMessage[];
  evidenceChecklist: EvidenceChecklistItem[];
  submissionStatus: SubmissionStatus;
  lastActivityAt: string;
  timeSpent: number; /* hours */
  progressPercent: number; /* 0–100 */
}

/* ── 5. Submissions ── */

export interface SubmissionFile {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedAt: string;
}

export interface StructuredResponse {
  id: string;
  question: string;
  answer: string;
  fieldType: "text" | "textarea" | "select" | "checkbox" | "file";
}

export interface EvidenceItem {
  id: string;
  checklistItemId: string;
  label: string;
  description?: string;
  fileId?: string;
  url?: string;
  verified: boolean;
  verifiedAt?: string;
}

export interface RubricScore {
  criterion: string;
  maxScore: number;
  score: number;
  feedback?: string;
}

export interface ReviewerFeedback {
  reviewerId: string;
  reviewerName: string;
  stage: ReviewStage;
  decision: "approved" | "rejected" | "rework_requested";
  overallComment: string;
  rubricScores: RubricScore[];
  submittedAt: string;
}

export interface Submission {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  submittedAt: string;
  status: SubmissionStatus;
  version: number;
  files: SubmissionFile[];
  structuredResponses: StructuredResponse[];
  evidenceItems: EvidenceItem[];
  reviewStage: ReviewStage | null;
  reviewerFeedback: ReviewerFeedback[];
  rubricScores: RubricScore[];
  reworkCount: number;
  finalDecisionAt?: string;
  notes?: string;
}

/* ── 6. Earnings & Payouts ── */

export interface EarningsRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  currency: string;
  status: EarningStatus;
  acceptedAt: string;
  paidAt?: string;
  payoutId?: string;
}

export interface PayoutRecord {
  id: string;
  date: string;
  amount: number;
  currency: string;
  method: PayoutMethod;
  status: PayoutStatus;
  tasksCount: number;
  transactionRef: string;
  earningIds: string[]; /* references to EarningsRecord.id */
  failureReason?: string;
}

export interface EarningsSummary {
  totalEarned: number;
  eligible: number;
  pending: number;
  paidOut: number;
  currency: string;
  lifetimeTasksCompleted: number;
  currentMonthEarned: number;
  previousMonthEarned: number;
}

export interface PayoutPreferences {
  preferredMethod: PayoutMethod;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingCode: string;
    country: string;
  };
  mobileMoneyDetails?: {
    provider: string;
    phoneNumber: string;
  };
  paypalEmail?: string;
  upiId?: string;
  minimumPayoutAmount: number;
  autoPayout: boolean;
}

/* ── 7. Credentials (PoDL — Proof-of-Delivery Ledger) ── */

export interface AcademicMapping {
  institution: string;
  courseCode: string;
  courseName: string;
  credits: number;
  semester?: string;
  verified: boolean;
}

export interface Credential {
  id: string;
  title: string;
  description: string;
  skillsValidated: string[];
  proficiencyLevel: ProficiencyLevel;
  dateEarned: string;
  issuingContext: string; /* e.g. "Completed 3 React tasks with 95% acceptance" */
  taskId: string;
  projectId: string;
  projectName: string;
  certificateUrl: string;
  verificationHash?: string; /* blockchain/ledger verification */
  academicMapping?: AcademicMapping;
  expiresAt?: string;
  shareableUrl?: string;
}

/* ── 8. Learning ── */

export interface LearningRecommendation {
  id: string;
  type: LearningRecommendationType;
  title: string;
  description: string;
  skillsDeveloped: string[];
  matchReason: string;
  demandIndicator: DemandIndicator;
  estimatedHours: number;
  taskId?: string; /* if type is "task" */
  pathwaySteps?: number; /* if type is "pathway" */
  difficulty?: ProficiencyLevel;
  relevanceScore?: number; /* 0–100 */
}

export interface LearningPathway {
  id: string;
  title: string;
  description: string;
  targetSkill: string;
  targetProficiency: ProficiencyLevel;
  steps: LearningPathwayStep[];
  estimatedTotalHours: number;
  completedSteps: number;
  startedAt?: string;
}

export interface LearningPathwayStep {
  id: string;
  order: number;
  title: string;
  type: "task" | "resource" | "assessment";
  description: string;
  estimatedHours: number;
  completed: boolean;
  completedAt?: string;
  taskId?: string;
  resourceUrl?: string;
}

/* ── 9. Support ── */

export interface QAMessage {
  id: string;
  sender: string;
  senderRole: "contributor" | "mentor" | "reviewer" | "ai_assistant" | "support";
  content: string;
  timestamp: string;
  isAI: boolean;
  attachments?: SubmissionFile[];
}

export interface SupportTicketMessage {
  id: string;
  sender: string;
  senderRole: "contributor" | "support_agent" | "ai_assistant";
  content: string;
  timestamp: string;
  attachments?: SubmissionFile[];
}

export interface SupportTicket {
  id: string;
  subject: string;
  category: TicketCategory;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  messages: SupportTicketMessage[];
  relatedTaskId?: string;
  relatedProjectId?: string;
  assignedAgent?: string;
}

/* ── 10. Notifications ── */

export interface ContributorNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, string>;
}

export interface NotificationPreferences {
  channels: {
    inApp: boolean;
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
  quietHoursStart?: string; /* HH:mm */
  quietHoursEnd?: string; /* HH:mm */
  taskAssigned: boolean;
  reviewComplete: boolean;
  paymentReceived: boolean;
  credentialEarned: boolean;
  slaWarning: boolean;
  learningSuggestion: boolean;
  systemAnnouncements: boolean;
}

/* ── 11. Digital Twin (Skill Genome + Performance Mirror) ── */

export interface DigitalTwin {
  contributorId: string;
  tasksCompleted: number;
  totalSubmissions: number;
  acceptanceRate: number; /* 0–100 */
  onTimeDeliveryPct: number; /* 0–100 */
  slaCompliancePct: number; /* 0–100 */
  reworkRate: number; /* 0–100 */
  learningVelocity: number; /* tasks-per-month or skills-per-quarter */
  verifiedSkills: ContributorSkill[];
  reliabilityScore: number; /* 0–100 */
  strengthAreas: string[];
  growthAreas: string[];
  recentTrend: "improving" | "stable" | "declining";
  lastUpdatedAt: string;
}

export interface DigitalTwinSnapshot {
  date: string;
  acceptanceRate: number;
  onTimeDeliveryPct: number;
  slaCompliancePct: number;
  reworkRate: number;
  reliabilityScore: number;
  tasksCompleted: number;
}

/* ── Dashboard Aggregates ── */

export interface ContributorDashboard {
  profile: ContributorProfile;
  activeTasks: ContributorTask[];
  availableTasks: ContributorTask[];
  recentSubmissions: Submission[];
  earningsSummary: EarningsSummary;
  credentials: Credential[];
  learningRecommendations: LearningRecommendation[];
  notifications: ContributorNotification[];
  digitalTwin: DigitalTwin;
  unreadNotifications: number;
  openTickets: number;
}

/* ── Onboarding (Track-Specific) ── */

export interface OnboardingStep {
  id: string;
  order: number;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  required: boolean;
  track: ContributorTrack | "all";
}

export interface OnboardingProgress {
  contributorId: string;
  track: ContributorTrack;
  steps: OnboardingStep[];
  completedCount: number;
  totalRequired: number;
  startedAt: string;
  completedAt?: string;
  activatedAt?: string; /* for 72-hour tracking on women track */
}

/* ── Task Matching & Discovery ── */

export interface TaskMatchFilters {
  skills?: string[];
  complexity?: TaskComplexity[];
  minMatchScore?: number;
  maxEstimatedHours?: number;
  sortBy?: "match_score" | "due_date" | "pricing" | "complexity";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface TaskMatchResult {
  task: ContributorTask;
  matchScore: number;
  matchBreakdown: {
    skillMatch: number;
    availabilityMatch: number;
    trackFit: number;
    performanceBonus: number;
  };
}

/* ── FSD §5: Three-Part Assessment Composite ── */

export type AssessmentComponentStatus =
  | "not_started"
  | "in_progress"
  | "completed"
  | "expired";

export interface AssessmentComponent {
  id: string;
  type: "mcq" | "work_sample" | "adaptive";
  title: string;
  description: string;
  status: AssessmentComponentStatus;
  weight: number;
  score?: number;
  startedAt?: string;
  completedAt?: string;
  deadline?: string;
  totalQuestions?: number;
  answeredQuestions?: number;
  timeLimit?: number;
  timeRemaining?: number;
}

export interface AssessmentComposite {
  contributorId: string;
  status:
    | "not_started"
    | "in_progress"
    | "completed"
    | "expired"
    | "borderline_review";
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  components: AssessmentComponent[];
  compositeScore?: number;
  passed?: boolean;
  designationConfirmed?: string;
  seniorityConfirmed?: DesignationLevel;
  retakeEligibleAt?: string;
  attemptNumber: number;
}

/* ── FSD §10.3: KYC Verification ── */

export interface KycVerification {
  contributorId: string;
  status: KycStatus;
  documents: {
    type: "government_id" | "proof_of_address" | "tax_id" | "bank_statement";
    fileName: string;
    uploadedAt: string;
    status: "pending" | "approved" | "rejected";
    rejectionReason?: string;
  }[];
  submittedAt?: string;
  verifiedAt?: string;
  expiresAt?: string;
  blockedAmount: number;
}

/* ── FSD §7.4: Workload Impact ── */

export interface WorkloadImpact {
  currentWeeklyHours: number;
  maxWeeklyHours: number;
  activeTasks: number;
  newTaskHours: number;
  projectedUtilization: number;
  slaOverlapWarnings: string[];
  capacityAvailable: boolean;
}
