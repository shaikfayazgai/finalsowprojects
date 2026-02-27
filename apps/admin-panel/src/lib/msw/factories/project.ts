import type { Project, ProjectMilestone } from '@glimmora/types'
import type { AdminIntervention } from '@glimmora/types'
import { randomId, isoPast, isoFuture } from './common'

// ---- Admin Project List ----
export function createMockAdminProjectList(): Project[] {
  return [
    {
      id: 'proj-001',
      sowId: 'sow-001',
      name: 'E-Commerce Platform Redesign',
      description: 'Full redesign of the B2C platform with modern UX patterns',
      status: 'active',
      health: 'on-track',
      organizationId: 'org-001',
      completionPercentage: 68,
      totalTasks: 24,
      completedTasks: 16,
      startDate: isoPast(45),
      targetEndDate: isoFuture(30),
      createdAt: isoPast(50),
      updatedAt: isoPast(1),
    },
    {
      id: 'proj-002',
      sowId: 'sow-002',
      name: 'Mobile Banking App',
      description: 'Cross-platform mobile banking solution with biometric auth',
      status: 'active',
      health: 'at-risk',
      organizationId: 'org-002',
      completionPercentage: 42,
      totalTasks: 32,
      completedTasks: 13,
      startDate: isoPast(30),
      targetEndDate: isoFuture(15),
      createdAt: isoPast(35),
      updatedAt: isoPast(0),
    },
    {
      id: 'proj-003',
      sowId: 'sow-003',
      name: 'Supply Chain Dashboard',
      description: 'Real-time analytics dashboard for supply chain operations',
      status: 'completed',
      health: 'on-track',
      organizationId: 'org-003',
      completionPercentage: 100,
      totalTasks: 18,
      completedTasks: 18,
      startDate: isoPast(90),
      targetEndDate: isoPast(10),
      actualEndDate: isoPast(12),
      createdAt: isoPast(95),
      updatedAt: isoPast(10),
    },
    {
      id: 'proj-004',
      sowId: 'sow-004',
      name: 'Healthcare Patient Portal',
      description: 'HIPAA-compliant patient portal with telemedicine integration',
      status: 'frozen',
      health: 'critical',
      organizationId: 'org-004',
      completionPercentage: 35,
      totalTasks: 28,
      completedTasks: 10,
      startDate: isoPast(60),
      targetEndDate: isoFuture(20),
      createdAt: isoPast(65),
      updatedAt: isoPast(3),
    },
    {
      id: 'proj-005',
      sowId: 'sow-005',
      name: 'AI Content Moderation System',
      description: 'ML-powered content moderation with human-in-the-loop review',
      status: 'active',
      health: 'on-track',
      organizationId: 'org-005',
      completionPercentage: 85,
      totalTasks: 20,
      completedTasks: 17,
      startDate: isoPast(75),
      targetEndDate: isoFuture(5),
      createdAt: isoPast(80),
      updatedAt: isoPast(0),
    },
    {
      id: 'proj-006',
      sowId: 'sow-006',
      name: 'IoT Fleet Management',
      description: 'Real-time fleet tracking and predictive maintenance platform',
      status: 'paused',
      health: 'delayed',
      organizationId: 'org-001',
      completionPercentage: 22,
      totalTasks: 36,
      completedTasks: 8,
      startDate: isoPast(40),
      targetEndDate: isoFuture(45),
      createdAt: isoPast(45),
      updatedAt: isoPast(7),
    },
    {
      id: 'proj-007',
      sowId: 'sow-007',
      name: 'Digital Learning Platform',
      description: 'LMS with adaptive learning paths and skills assessment',
      status: 'active',
      health: 'on-track',
      organizationId: 'org-006',
      completionPercentage: 55,
      totalTasks: 22,
      completedTasks: 12,
      startDate: isoPast(35),
      targetEndDate: isoFuture(25),
      createdAt: isoPast(40),
      updatedAt: isoPast(2),
    },
    {
      id: 'proj-008',
      sowId: 'sow-008',
      name: 'HR Onboarding Automation',
      description: 'Automated employee onboarding workflow with document management',
      status: 'active',
      health: 'at-risk',
      organizationId: 'org-007',
      completionPercentage: 60,
      totalTasks: 16,
      completedTasks: 10,
      startDate: isoPast(28),
      targetEndDate: isoFuture(8),
      createdAt: isoPast(32),
      updatedAt: isoPast(1),
    },
    {
      id: 'proj-009',
      sowId: 'sow-009',
      name: 'Compliance Reporting Suite',
      description: 'Automated regulatory compliance reporting for financial services',
      status: 'completed',
      health: 'on-track',
      organizationId: 'org-003',
      completionPercentage: 100,
      totalTasks: 14,
      completedTasks: 14,
      startDate: isoPast(120),
      targetEndDate: isoPast(30),
      actualEndDate: isoPast(32),
      createdAt: isoPast(125),
      updatedAt: isoPast(30),
    },
  ]
}

// ---- Project Detail ----
export function createMockAdminProjectDetail(id: string): Project {
  const list = createMockAdminProjectList()
  return list.find((p) => p.id === id) ?? list[0]
}

// ---- Organization name mapping ----
export function getOrganizationName(orgId: string): string {
  const orgs: Record<string, string> = {
    'org-001': 'TechCorp Industries',
    'org-002': 'FinServe Global',
    'org-003': 'MegaRetail Inc.',
    'org-004': 'HealthFirst Solutions',
    'org-005': 'DataGuard AI',
    'org-006': 'EduTech Partners',
    'org-007': 'PeopleFirst HR',
  }
  return orgs[orgId] ?? 'Unknown Organization'
}

// ---- APG Activity ----
interface APGAction {
  id: string
  type: 'task_assigned' | 'review_requested' | 'milestone_completed' | 'risk_detected' | 'team_formed' | 'payment_triggered'
  title: string
  description: string
  timestamp: string
  detail?: string
}

export function createMockAPGActivity(_projectId: string): APGAction[] {
  return [
    {
      id: randomId('apg'),
      type: 'team_formed',
      title: 'Initial Team Formation',
      description: 'APG assembled a 6-member team based on skill matching and availability',
      timestamp: isoPast(40),
      detail: 'Selected contributors with 92% skill match. Average tier: developing. Team diversity score: 0.85.',
    },
    {
      id: randomId('apg'),
      type: 'task_assigned',
      title: 'Sprint 1 Tasks Distributed',
      description: 'Assigned 8 tasks across 4 contributors based on skill alignment',
      timestamp: isoPast(38),
    },
    {
      id: randomId('apg'),
      type: 'review_requested',
      title: 'Evidence Pack Auto-Routed',
      description: 'Milestone 1 evidence pack sent to mentor for review (confidence: 94%)',
      timestamp: isoPast(25),
      detail: 'Evidence quality score: 4.2/5. Auto-routed based on mentor specialization match.',
    },
    {
      id: randomId('apg'),
      type: 'milestone_completed',
      title: 'Milestone 1 Completed',
      description: 'All tasks in milestone 1 verified and approved',
      timestamp: isoPast(20),
    },
    {
      id: randomId('apg'),
      type: 'risk_detected',
      title: 'Delivery Risk Detected',
      description: 'Milestone 3 at risk -- 2 tasks behind schedule by 3 days',
      timestamp: isoPast(12),
      detail: 'Contributing factors: contributor availability dropped 20%. Recommended action: redistribute 1 task to available contributor.',
    },
    {
      id: randomId('apg'),
      type: 'task_assigned',
      title: 'Task Redistribution',
      description: 'Reassigned task-015 to contributor with higher availability',
      timestamp: isoPast(11),
    },
    {
      id: randomId('apg'),
      type: 'payment_triggered',
      title: 'Payment Auto-Released',
      description: 'Milestone 2 payment of $28,000 released after evidence approval',
      timestamp: isoPast(8),
      detail: 'Payment mode: auto-on-approval. Evidence approved by mentor with 5/5 quality score.',
    },
    {
      id: randomId('apg'),
      type: 'review_requested',
      title: 'Evidence Pack Auto-Routed',
      description: 'Milestone 3 evidence pack sent to mentor for review (confidence: 88%)',
      timestamp: isoPast(3),
    },
    {
      id: randomId('apg'),
      type: 'task_assigned',
      title: 'Sprint 4 Tasks Distributed',
      description: 'Assigned 6 final tasks across 3 contributors',
      timestamp: isoPast(2),
    },
    {
      id: randomId('apg'),
      type: 'milestone_completed',
      title: 'Milestone 3 Completed',
      description: 'Milestone 3 tasks completed after redistribution -- back on track',
      timestamp: isoPast(1),
    },
  ]
}

// ---- Admin Interventions ----
export function createMockInterventions(_projectId: string): AdminIntervention[] {
  return [
    {
      id: randomId('intv'),
      projectId: 'proj-001',
      interventionType: 'payment_hold',
      reason: 'Pending compliance review on milestone 2 deliverables',
      details: 'Finance team flagged unusually fast completion. Holding payment until quality audit complete.',
      performedBy: 'Admin Sarah Chen',
      performedAt: isoPast(15),
      isImmutable: true,
    },
    {
      id: randomId('intv'),
      projectId: 'proj-001',
      interventionType: 'payment_release',
      reason: 'Compliance review passed -- releasing held payment',
      details: 'Quality audit confirmed all deliverables meet acceptance criteria.',
      performedBy: 'Admin Sarah Chen',
      performedAt: isoPast(12),
      isImmutable: true,
    },
    {
      id: randomId('intv'),
      projectId: 'proj-001',
      interventionType: 'contributor_reassignment',
      reason: 'Contributor availability dropped below 40% threshold',
      details: 'Reassigned 2 tasks from contributor-seed-alpha to contributor-seed-beta. APG recommended this action.',
      performedBy: 'Admin Ravi Kumar',
      performedAt: isoPast(8),
      isImmutable: true,
    },
    {
      id: randomId('intv'),
      projectId: 'proj-001',
      interventionType: 'escalation_created',
      reason: 'Enterprise requester disputed evidence quality for task-018',
      details: 'Created escalation for mentor review. Evidence pack EP-007 flagged for insufficient documentation.',
      performedBy: 'Admin Sarah Chen',
      performedAt: isoPast(5),
      isImmutable: true,
    },
    {
      id: randomId('intv'),
      projectId: 'proj-001',
      interventionType: 'milestone_override',
      reason: 'Extended milestone 4 deadline by 5 days due to scope change',
      details: 'Enterprise requested additional API endpoints. Scope change approved, deadline adjusted from Mar 15 to Mar 20.',
      performedBy: 'Admin Ravi Kumar',
      performedAt: isoPast(2),
      isImmutable: true,
    },
  ]
}

// ---- Freeze History ----
export interface FreezeHistoryEntry {
  id: string
  action: 'freeze' | 'unfreeze'
  reason: string
  performedBy: string
  performedAt: string
}

export function createMockFreezeHistory(_projectId: string): FreezeHistoryEntry[] {
  return [
    {
      id: randomId('fh'),
      action: 'freeze',
      reason: 'Security audit required -- potential data handling concern in milestone 3 deliverables',
      performedBy: 'Admin Sarah Chen',
      performedAt: isoPast(20),
    },
    {
      id: randomId('fh'),
      action: 'unfreeze',
      reason: 'Security audit completed -- no issues found. Resuming project activity.',
      performedBy: 'Admin Sarah Chen',
      performedAt: isoPast(17),
    },
    {
      id: randomId('fh'),
      action: 'freeze',
      reason: 'Enterprise requester requested project pause for internal restructuring',
      performedBy: 'Admin Ravi Kumar',
      performedAt: isoPast(3),
    },
  ]
}

// ---- Timeline / Milestones ----
export function createMockProjectTimeline(_projectId: string): ProjectMilestone[] {
  return [
    {
      id: 'ms-001',
      projectId: 'proj-001',
      name: 'Foundation & Architecture',
      description: 'Project setup, architecture design, and infrastructure',
      targetDate: isoPast(30),
      completedDate: isoPast(32),
      status: 'completed',
      taskIds: ['task-001', 'task-002', 'task-003', 'task-004'],
    },
    {
      id: 'ms-002',
      projectId: 'proj-001',
      name: 'Core Feature Development',
      description: 'Implementation of primary business logic and APIs',
      targetDate: isoPast(15),
      completedDate: isoPast(14),
      status: 'completed',
      taskIds: ['task-005', 'task-006', 'task-007', 'task-008', 'task-009'],
    },
    {
      id: 'ms-003',
      projectId: 'proj-001',
      name: 'UI Implementation',
      description: 'Frontend components, pages, and responsive design',
      targetDate: isoPast(2),
      status: 'in-progress',
      taskIds: ['task-010', 'task-011', 'task-012', 'task-013', 'task-014', 'task-015'],
    },
    {
      id: 'ms-004',
      projectId: 'proj-001',
      name: 'Integration & Testing',
      description: 'System integration, E2E testing, and performance optimization',
      targetDate: isoFuture(15),
      status: 'pending',
      taskIds: ['task-016', 'task-017', 'task-018', 'task-019'],
    },
    {
      id: 'ms-005',
      projectId: 'proj-001',
      name: 'Deployment & Handoff',
      description: 'Production deployment, documentation, and knowledge transfer',
      targetDate: isoFuture(30),
      status: 'pending',
      taskIds: ['task-020', 'task-021', 'task-022', 'task-023', 'task-024'],
    },
  ]
}

// ---- Team Members ----
export interface AdminTeamMember {
  seed: string
  role: string
  skills: string[]
  tier: 'emerging' | 'developing' | 'proficient' | 'expert'
  tasksAssigned: number
}

export function createMockProjectTeam(): AdminTeamMember[] {
  return [
    {
      seed: 'contributor-alpha-7f3',
      role: 'Frontend Developer',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'GraphQL'],
      tier: 'proficient',
      tasksAssigned: 5,
    },
    {
      seed: 'contributor-beta-2a1',
      role: 'Backend Developer',
      skills: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis'],
      tier: 'expert',
      tasksAssigned: 6,
    },
    {
      seed: 'contributor-gamma-9c4',
      role: 'Full Stack Developer',
      skills: ['React', 'Node.js', 'TypeScript', 'Docker', 'AWS'],
      tier: 'developing',
      tasksAssigned: 4,
    },
    {
      seed: 'contributor-delta-5e8',
      role: 'UI/UX Developer',
      skills: ['Figma', 'CSS', 'React', 'Animation'],
      tier: 'proficient',
      tasksAssigned: 3,
    },
    {
      seed: 'contributor-epsilon-1b6',
      role: 'DevOps Engineer',
      skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'Monitoring'],
      tier: 'developing',
      tasksAssigned: 4,
    },
    {
      seed: 'contributor-zeta-8d2',
      role: 'QA Engineer',
      skills: ['Cypress', 'Jest', 'Performance Testing'],
      tier: 'emerging',
      tasksAssigned: 2,
    },
  ]
}

// ---- Evidence Packs ----
export interface AdminEvidencePack {
  id: string
  taskName: string
  milestoneName: string
  submittedAt: string
  status: 'pending' | 'under_review' | 'approved' | 'rejected'
  reviewerRole: string
  decisionDate?: string
}

export function createMockProjectEvidence(_projectId: string): AdminEvidencePack[] {
  return [
    {
      id: 'ep-001',
      taskName: 'Architecture Design Document',
      milestoneName: 'Foundation & Architecture',
      submittedAt: isoPast(33),
      status: 'approved',
      reviewerRole: 'Mentor',
      decisionDate: isoPast(32),
    },
    {
      id: 'ep-002',
      taskName: 'Database Schema Implementation',
      milestoneName: 'Foundation & Architecture',
      submittedAt: isoPast(31),
      status: 'approved',
      reviewerRole: 'Mentor',
      decisionDate: isoPast(30),
    },
    {
      id: 'ep-003',
      taskName: 'API Endpoints Implementation',
      milestoneName: 'Core Feature Development',
      submittedAt: isoPast(16),
      status: 'approved',
      reviewerRole: 'Mentor',
      decisionDate: isoPast(15),
    },
    {
      id: 'ep-004',
      taskName: 'Authentication Flow',
      milestoneName: 'Core Feature Development',
      submittedAt: isoPast(14),
      status: 'approved',
      reviewerRole: 'Mentor',
      decisionDate: isoPast(13),
    },
    {
      id: 'ep-005',
      taskName: 'Dashboard Components',
      milestoneName: 'UI Implementation',
      submittedAt: isoPast(5),
      status: 'under_review',
      reviewerRole: 'Mentor',
    },
    {
      id: 'ep-006',
      taskName: 'Responsive Layout System',
      milestoneName: 'UI Implementation',
      submittedAt: isoPast(2),
      status: 'pending',
      reviewerRole: '--',
    },
  ]
}

// ---- Rework Requests ----
export interface AdminReworkRequest {
  id: string
  taskName: string
  requestedByRole: string
  reason: string
  status: 'pending' | 'in_progress' | 'completed'
  createdAt: string
}

export function createMockProjectReworks(_projectId: string): AdminReworkRequest[] {
  return [
    {
      id: randomId('rw'),
      taskName: 'API Endpoints Implementation',
      requestedByRole: 'Enterprise Requester',
      reason: 'Missing pagination on list endpoints. Needs cursor-based pagination for large datasets.',
      status: 'completed',
      createdAt: isoPast(18),
    },
    {
      id: randomId('rw'),
      taskName: 'Authentication Flow',
      requestedByRole: 'Mentor',
      reason: 'Token refresh logic does not handle concurrent requests correctly. Needs queue-based refresh.',
      status: 'completed',
      createdAt: isoPast(15),
    },
    {
      id: randomId('rw'),
      taskName: 'Dashboard Components',
      requestedByRole: 'Enterprise Requester',
      reason: 'Chart accessibility improvements needed -- missing ARIA labels and keyboard navigation.',
      status: 'pending',
      createdAt: isoPast(4),
    },
    {
      id: randomId('rw'),
      taskName: 'Responsive Layout System',
      requestedByRole: 'Mentor',
      reason: 'Layout breaks on tablet portrait mode. Needs intermediate breakpoint handling.',
      status: 'in_progress',
      createdAt: isoPast(1),
    },
  ]
}

// ---- Escalations ----
export interface AdminEscalation {
  id: string
  taskName: string
  escalatedByRole: string
  type: 'quality' | 'timeline' | 'conduct'
  status: 'open' | 'resolved'
  createdAt: string
  disputeId?: string
}

export function createMockProjectEscalations(_projectId: string): AdminEscalation[] {
  return [
    {
      id: randomId('esc'),
      taskName: 'API Endpoints Implementation',
      escalatedByRole: 'Enterprise Requester',
      type: 'quality',
      status: 'resolved',
      createdAt: isoPast(17),
    },
    {
      id: randomId('esc'),
      taskName: 'Dashboard Components',
      escalatedByRole: 'Mentor',
      type: 'timeline',
      status: 'open',
      createdAt: isoPast(4),
      disputeId: 'dispute-003',
    },
    {
      id: randomId('esc'),
      taskName: 'Responsive Layout System',
      escalatedByRole: 'Enterprise Requester',
      type: 'quality',
      status: 'open',
      createdAt: isoPast(1),
    },
  ]
}

// ---- Payment Records ----
export interface AdminPaymentRecord {
  id: string
  milestoneName: string
  amount: number
  currency: string
  status: 'released' | 'pending' | 'held'
  releaseMode: string
  releasedAt?: string
  transactionId?: string
}

export function createMockProjectPayments(_projectId: string): AdminPaymentRecord[] {
  return [
    {
      id: randomId('pay'),
      milestoneName: 'Foundation & Architecture',
      amount: 35000,
      currency: 'USD',
      status: 'released',
      releaseMode: 'manual',
      releasedAt: isoPast(30),
      transactionId: 'TXN-7842',
    },
    {
      id: randomId('pay'),
      milestoneName: 'Core Feature Development',
      amount: 28000,
      currency: 'USD',
      status: 'released',
      releaseMode: 'auto-on-approval',
      releasedAt: isoPast(14),
      transactionId: 'TXN-8103',
    },
    {
      id: randomId('pay'),
      milestoneName: 'UI Implementation (Phase 1)',
      amount: 15000,
      currency: 'USD',
      status: 'released',
      releaseMode: 'apg-silent',
      releasedAt: isoPast(5),
      transactionId: 'TXN-8291',
    },
    {
      id: randomId('pay'),
      milestoneName: 'UI Implementation (Phase 2)',
      amount: 22000,
      currency: 'USD',
      status: 'pending',
      releaseMode: 'manual',
    },
    {
      id: randomId('pay'),
      milestoneName: 'Integration & Testing',
      amount: 45000,
      currency: 'USD',
      status: 'pending',
      releaseMode: 'manual',
    },
    {
      id: randomId('pay'),
      milestoneName: 'Performance Optimization',
      amount: 18000,
      currency: 'USD',
      status: 'held',
      releaseMode: 'manual',
    },
    {
      id: randomId('pay'),
      milestoneName: 'Deployment & Handoff',
      amount: 37000,
      currency: 'USD',
      status: 'pending',
      releaseMode: 'manual',
    },
  ]
}
