/* ══════════════════════════════════════════════════════════════
   Enterprise Admin Console — TypeScript Interfaces
   All mock entities cross-reference by ID for seamless drill-down
   ══════════════════════════════════════════════════════════════ */

export type SowStatus = "draft" | "approved";
export type ConfidentialityLevel = "public" | "internal" | "confidential" | "restricted";
export type PlanStatus = "draft" | "pending_review" | "approved" | "in_progress" | "completed";
export type TeamStatus = "forming" | "ready" | "approved" | "active" | "disbanded";
export type ProjectHealth = "on_track" | "at_risk" | "behind" | "completed";
export type TaskStatus = "backlog" | "in_progress" | "in_review" | "rework" | "accepted" | "rejected";
export type MilestoneStatus = "upcoming" | "in_progress" | "completed" | "overdue";
export type ReviewDecision = "approved" | "rejected" | "rework_requested";
export type InvoiceStatus = "draft" | "pending" | "paid" | "overdue" | "cancelled";
export type EscrowStatus = "held" | "partially_released" | "released" | "disputed";
export type AuditAction = "created" | "updated" | "approved" | "rejected" | "escalated" | "completed" | "archived";
export type UserRole = "owner" | "admin" | "manager" | "viewer";
export type NotificationChannel = "email" | "in_app" | "slack" | "webhook";

export interface SOW {
  id: string;
  title: string;
  client: string;
  status: SowStatus;
  confidentiality: ConfidentialityLevel;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  approvedBy?: string;
  fileSize: string;
  pages: number;
  parsedSections: number;
  totalSections: number;
  aiConfidence: number;
  tags: string[];
  estimatedBudget: number;
  estimatedDuration: string;
  planId?: string;
  stakeholders: string[];
  slaCompliance?: number;
}

export interface SOWSection {
  id: string;
  sowId: string;
  title: string;
  content: string;
  aiSuggestion?: string;
  confidence: number;
  order: number;
}

export interface DecompositionPlan {
  id: string;
  sowId: string;
  title: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  totalTasks: number;
  estimatedHours: number;
  estimatedCost: number;
  complexity: "low" | "medium" | "high" | "critical";
  teamId?: string;
  projectId?: string;
}

export interface DecompositionTask {
  id: string;
  planId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high" | "critical";
  estimatedHours: number;
  skillsRequired: string[];
  dependencies: string[];
  phase: number;
  order: number;
  assigneeId?: string;
}

export interface TeamPool {
  id: string;
  planId: string;
  name: string;
  status: TeamStatus;
  createdAt: string;
  matchScore: number;
  totalMembers: number;
  requiredSkills: string[];
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  anonymousId: string;
  displayName: string;
  avatar: string;
  skills: string[];
  matchScore: number;
  availability: "full_time" | "part_time" | "limited";
  track: "women" | "student" | "general";
  tasksCompleted: number;
  rating: number;
}

export interface Project {
  id: string;
  planId: string;
  sowId: string;
  teamId: string;
  title: string;
  client: string;
  health: ProjectHealth;
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  teamSize: number;
  milestones: Milestone[];
  tasksTotal: number;
  tasksCompleted: number;
  apgScore: number;
  escalations: number;
  slaCompliance: number;
  sowTitle: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  status: MilestoneStatus;
  dueDate: string;
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  deliverables: number;
  budget: number;
}

export interface Deliverable {
  id: string;
  projectId: string;
  milestoneId: string;
  taskId: string;
  title: string;
  submittedAt: string;
  submittedBy: string;
  status: "pending" | "approved" | "rejected" | "rework";
  evidenceFiles: number;
  reviewerNotes?: string;
  decision?: ReviewDecision;
  decidedAt?: string;
}

export interface Invoice {
  id: string;
  projectId: string;
  number: string;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  currency: string;
  lineItems: InvoiceLineItem[];
  milestoneId?: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface EscrowAccount {
  id: string;
  projectId: string;
  status: EscrowStatus;
  totalFunded: number;
  totalReleased: number;
  totalHeld: number;
  currency: string;
  releases: EscrowRelease[];
}

export interface EscrowRelease {
  id: string;
  milestoneId: string;
  amount: number;
  releasedAt: string;
  approvedBy: string;
  status: "pending" | "approved" | "released";
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: AuditAction;
  resource: string;
  resourceType: "sow" | "plan" | "team" | "project" | "review" | "billing" | "user" | "config";
  details: string;
  ipAddress: string;
}

export interface OrgUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: "active" | "invited" | "suspended";
  joinedAt: string;
  lastActive: string;
  avatar?: string;
  department?: string;
  projectsManaged: number;
  actionsCount: number;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
}

export interface APGRule {
  id: string;
  name: string;
  description: string;
  category: "quality" | "timeline" | "budget" | "escalation" | "sla";
  enabled: boolean;
  threshold: number;
  action: string;
}

export interface NotificationRule {
  id: string;
  event: string;
  channels: NotificationChannel[];
  enabled: boolean;
  recipients: string[];
}

export interface AnalyticsMetric {
  label: string;
  value: number;
  change: number;
  changeType: "positive" | "negative" | "neutral";
  unit?: string;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  label?: string;
}

export interface AnalyticsDataset {
  id: string;
  title: string;
  metrics: AnalyticsMetric[];
  timeSeries: TimeSeriesPoint[];
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  actor: string;
  initials: string;
  action: string;
  target: string;
  type: "task" | "review" | "payment" | "escalation" | "milestone" | "sow" | "team";
  color: string;
}
