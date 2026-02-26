export type MentorApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected'
export type MentorTier = 'bronze' | 'silver' | 'gold' | 'elite'
export type ReviewDecisionType = 'approve' | 'rework_required' | 'reject'
export type SLAStatus = 'normal' | 'warning' | 'urgent' | 'overdue'

export interface MentorApplication {
  id: string
  expertiseAreas: string[]
  credentials: string
  availability: string
  status: MentorApplicationStatus
  submittedAt: string
  reviewedAt?: string
  rejectionReason?: string
}

export interface MentorProfile {
  id: string
  mentorId: string
  displayName: string
  bio: string
  tier: MentorTier
  expertiseSkillIds: string[]
  capacityHoursPerWeek: number
  isPaused: boolean
  joinedAt: string
}

export interface MentorImpactMetrics {
  totalReviews: number
  averageReviewHours: number
  reworkRate: number
  appealsOverturnedRate: number
  pendingReviews: number
}

export interface ReviewQueueItem {
  id: string
  taskId: string
  taskTitle: string
  submittedAt: string
  slaDeadline: string
  status: 'pending' | 'in_progress' | 'completed'
  skillTags: string[]
  submissionCount: number
  hasDraft?: boolean
  hasSLAExtensionPending?: boolean
}

export interface ReviewDecision {
  reviewId: string
  type: ReviewDecisionType
  feedbackComment?: string
  reworkItems?: string
  guidanceNotes?: string
  rejectionReason?: string
  nonComplianceEvidence?: string
}

export interface SkillTagVerificationRequest {
  id: string
  contributorSeed: string
  skillTag: string
  evidenceIds: string[]
  status: 'pending' | 'verified' | 'disputed'
  submittedAt: string
}

export interface MentorConversation {
  id: string
  subject: string
  lastMessage: string
  lastMessageAt: string
  unread: boolean
}
