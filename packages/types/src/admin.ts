// ---- Admin Auth ----
export type AdminRole = 'standard_admin' | 'super_admin'

export interface AdminUser {
  id: string
  displayName: string
  email: string
  avatarUrl?: string
  adminRole: AdminRole
  isActive: boolean
  createdAt: string
  lastLoginAt: string
}

// ---- Platform Dashboard ----
export interface PlatformStats {
  totalActiveUsers: number
  activeProjects: number
  pendingReviews: number
  openDisputes: number
  paymentsHeld: number
  paymentsHeldCurrency: string
  systemHealthScore: number
  verificationQueueCount: number
  pendingEscalations: number
}

export type SystemAlertSeverity = 'info' | 'warning' | 'critical'
export type SystemAlertEntityType = 'user' | 'project' | 'dispute' | 'payment' | 'system'

export interface SystemAlert {
  id: string
  severity: SystemAlertSeverity
  title: string
  message: string
  entityType: SystemAlertEntityType
  entityId?: string
  entityHref?: string
  createdAt: string
  dismissedAt?: string
}

// ---- User Management ----
export type AdminUserType =
  | 'woman-contributor'
  | 'community-support-lead'
  | 'student-contributor'
  | 'alumni-contributor'
  | 'enterprise-requester'
  | 'mentor-reviewer'

export type UserAccountStatus = 'active' | 'suspended' | 'pending_verification' | 'deactivated'

export interface AdminUserListItem {
  id: string
  displayName: string
  email: string
  userType: AdminUserType
  accountStatus: UserAccountStatus
  createdAt: string
  lastActiveAt: string
  projectCount: number
  podlCount: number
}

export interface VerificationQueueItem {
  id: string
  userId: string
  userName: string
  userType: AdminUserType
  verificationType: 'identity' | 'organization' | 'university' | 'mentor_credentials'
  submittedAt: string
  documentsCount: number
}

export type AdminActionType =
  | 'suspend'
  | 'reactivate'
  | 'approve_verification'
  | 'reject_verification'
  | 'force_password_reset'
  | 'modify_tier'

export interface AdminAction {
  actionType: AdminActionType
  reason: string
  performedBy: string
  performedAt: string
}

// ---- Disputes ----
export type DisputeType = 'payment' | 'quality' | 'conduct' | 'technical' | 'safety'
export type DisputeSeverity = 'low' | 'medium' | 'high' | 'critical'
export type DisputeStatus = 'open' | 'under_review' | 'awaiting_evidence' | 'resolved' | 'escalated'
export type DisputeDecisionType =
  | 'resolved_favor_requester'
  | 'resolved_favor_contributor'
  | 'partial_resolution'
  | 'escalated_to_safety'
  | 'dismissed'

export interface Dispute {
  id: string
  type: DisputeType
  severity: DisputeSeverity
  status: DisputeStatus
  title: string
  description: string
  projectId: string
  projectName: string
  requesterId: string
  requesterName: string
  contributorSeed: string
  createdAt: string
  updatedAt: string
  assignedAdminId?: string
  isSafetyCase: boolean
}

export interface DisputeEvidence {
  id: string
  disputeId: string
  submittedBy: 'requester' | 'contributor' | 'admin' | 'system'
  type: 'text' | 'file' | 'screenshot' | 'log'
  content: string
  fileUrl?: string
  submittedAt: string
}

export interface DisputeMessage {
  id: string
  disputeId: string
  senderRole: 'requester' | 'contributor' | 'admin'
  content: string
  sentAt: string
}

export interface DisputeDecision {
  disputeId: string
  decisionType: DisputeDecisionType
  summary: string
  detailedReasoning: string
  financialResolution?: {
    refundAmount?: number
    additionalPayment?: number
    currency: string
  }
  adminId: string
  decidedAt: string
}

// ---- Safety Case (extends Dispute) ----
export interface SafetyCase extends Dispute {
  isSafetyCase: true
  type: 'safety'
  severity: 'critical'
  privacyRestricted: boolean
  evidencePreserved: boolean
  accessRestrictions: string[]
}

// ---- Admin Interventions (Projects) ----
export type InterventionType =
  | 'project_freeze'
  | 'project_unfreeze'
  | 'contributor_reassignment'
  | 'milestone_override'
  | 'payment_hold'
  | 'payment_release'
  | 'escalation_created'

export interface AdminIntervention {
  id: string
  projectId: string
  interventionType: InterventionType
  reason: string
  details?: string
  performedBy: string
  performedAt: string
  isImmutable: true
}

// ---- Reports ----
export type ReportType = 'platform_overview' | 'user_activity' | 'project_delivery' | 'financial' | 'skill_growth'

export interface ReportConfig {
  type: ReportType
  title: string
  description: string
  dateRange: { from: string; to: string }
  filters?: Record<string, string>
}

export interface PlatformReportData {
  reportType: ReportType
  generatedAt: string
  dateRange: { from: string; to: string }
  metrics: Record<string, number | string>
  chartData?: Array<Record<string, unknown>>
}

// ---- Skill Taxonomy ----
export interface SkillTaxonomyTag {
  id: string
  name: string
  category: string
  parentId?: string
  isActive: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

// ---- APG Configuration (Super Admin) ----
export type APGConfigDomain = 'thresholds' | 'auto_approval_rules' | 'escalation_triggers'

export interface APGConfigEntry {
  id: string
  domain: APGConfigDomain
  key: string
  label: string
  value: string | number | boolean
  description: string
  updatedBy: string
  updatedAt: string
}

// ---- Platform Audit Log ----
export type AuditActionCategory =
  | 'user_management'
  | 'project_intervention'
  | 'dispute_resolution'
  | 'content_management'
  | 'apg_configuration'
  | 'system'

export interface PlatformAuditEntry {
  id: string
  timestamp: string
  actorId: string
  actorName: string
  actionCategory: AuditActionCategory
  actionType: string
  affectedEntityType: 'user' | 'project' | 'dispute' | 'config' | 'content'
  affectedEntityId: string
  reason: string
  metadata?: Record<string, unknown>
  isImmutable: true
}

// ---- Platform Announcements ----
export type AnnouncementAudience = 'all' | 'contributors' | 'enterprise' | 'mentors' | 'admins'
export type AnnouncementStatus = 'draft' | 'published' | 'archived'

export interface PlatformAnnouncement {
  id: string
  title: string
  content: string
  audience: AnnouncementAudience
  status: AnnouncementStatus
  publishedAt?: string
  createdBy: string
  createdAt: string
}

// ---- Resource Library ----
export type ResourceItemType = 'guide' | 'policy' | 'template' | 'training'

export interface ResourceItem {
  id: string
  title: string
  type: ResourceItemType
  fileUrl?: string
  description?: string
  audience: AnnouncementAudience
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}
