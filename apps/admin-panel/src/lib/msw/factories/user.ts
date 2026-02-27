import type {
  AdminUserListItem,
  AdminUserType,
  UserAccountStatus,
  VerificationQueueItem,
} from '@glimmora/types'
import { isoPast } from './common'

// ---- User List ----
export function createMockAdminUserList(): AdminUserListItem[] {
  return [
    // 4 woman-contributor (2 active, 1 suspended, 1 pending_verification)
    {
      id: 'usr-001',
      displayName: 'Fatima Al-Hassan',
      email: 'fatima.alhassan@example.com',
      userType: 'woman-contributor',
      accountStatus: 'active',
      createdAt: isoPast(120),
      lastActiveAt: isoPast(0),
      projectCount: 5,
      podlCount: 12,
    },
    {
      id: 'usr-002',
      displayName: 'Amira Khan',
      email: 'amira.khan@example.com',
      userType: 'woman-contributor',
      accountStatus: 'active',
      createdAt: isoPast(90),
      lastActiveAt: isoPast(1),
      projectCount: 3,
      podlCount: 7,
    },
    {
      id: 'usr-003',
      displayName: 'Nadia Begum',
      email: 'nadia.begum@example.com',
      userType: 'woman-contributor',
      accountStatus: 'suspended',
      createdAt: isoPast(200),
      lastActiveAt: isoPast(15),
      projectCount: 1,
      podlCount: 2,
    },
    {
      id: 'usr-004',
      displayName: 'Zara Ahmed',
      email: 'zara.ahmed@example.com',
      userType: 'woman-contributor',
      accountStatus: 'pending_verification',
      createdAt: isoPast(3),
      lastActiveAt: isoPast(3),
      projectCount: 0,
      podlCount: 0,
    },
    // 2 community-support-lead (both active)
    {
      id: 'usr-005',
      displayName: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      userType: 'community-support-lead',
      accountStatus: 'active',
      createdAt: isoPast(180),
      lastActiveAt: isoPast(0),
      projectCount: 0,
      podlCount: 0,
    },
    {
      id: 'usr-006',
      displayName: 'Meera Patel',
      email: 'meera.patel@example.com',
      userType: 'community-support-lead',
      accountStatus: 'active',
      createdAt: isoPast(160),
      lastActiveAt: isoPast(1),
      projectCount: 0,
      podlCount: 0,
    },
    // 4 student-contributor (3 active, 1 pending_verification)
    {
      id: 'usr-007',
      displayName: 'Arjun Mehta',
      email: 'arjun.mehta@university.edu',
      userType: 'student-contributor',
      accountStatus: 'active',
      createdAt: isoPast(60),
      lastActiveAt: isoPast(0),
      projectCount: 4,
      podlCount: 9,
    },
    {
      id: 'usr-008',
      displayName: 'Raj Kumar',
      email: 'raj.kumar@university.edu',
      userType: 'student-contributor',
      accountStatus: 'active',
      createdAt: isoPast(45),
      lastActiveAt: isoPast(2),
      projectCount: 2,
      podlCount: 4,
    },
    {
      id: 'usr-009',
      displayName: 'Deepak Singh',
      email: 'deepak.singh@university.edu',
      userType: 'student-contributor',
      accountStatus: 'active',
      createdAt: isoPast(30),
      lastActiveAt: isoPast(1),
      projectCount: 1,
      podlCount: 2,
    },
    {
      id: 'usr-010',
      displayName: 'Vikram Patel',
      email: 'vikram.patel@university.edu',
      userType: 'student-contributor',
      accountStatus: 'pending_verification',
      createdAt: isoPast(2),
      lastActiveAt: isoPast(2),
      projectCount: 0,
      podlCount: 0,
    },
    // 2 alumni-contributor (1 active, 1 deactivated)
    {
      id: 'usr-011',
      displayName: 'Anil Reddy',
      email: 'anil.reddy@alumni.edu',
      userType: 'alumni-contributor',
      accountStatus: 'active',
      createdAt: isoPast(300),
      lastActiveAt: isoPast(5),
      projectCount: 8,
      podlCount: 18,
    },
    {
      id: 'usr-012',
      displayName: 'Suresh Naidu',
      email: 'suresh.naidu@alumni.edu',
      userType: 'alumni-contributor',
      accountStatus: 'deactivated',
      createdAt: isoPast(350),
      lastActiveAt: isoPast(90),
      projectCount: 2,
      podlCount: 3,
    },
    // 3 enterprise-requester (2 active, 1 suspended)
    {
      id: 'usr-013',
      displayName: 'Priya Nair',
      email: 'priya.nair@techcorp.com',
      userType: 'enterprise-requester',
      accountStatus: 'active',
      createdAt: isoPast(150),
      lastActiveAt: isoPast(0),
      projectCount: 6,
      podlCount: 0,
    },
    {
      id: 'usr-014',
      displayName: 'Ravi Deshmukh',
      email: 'ravi.deshmukh@globalsoft.com',
      userType: 'enterprise-requester',
      accountStatus: 'active',
      createdAt: isoPast(100),
      lastActiveAt: isoPast(3),
      projectCount: 3,
      podlCount: 0,
    },
    {
      id: 'usr-015',
      displayName: 'Sanjay Gupta',
      email: 'sanjay.gupta@infratech.com',
      userType: 'enterprise-requester',
      accountStatus: 'suspended',
      createdAt: isoPast(200),
      lastActiveAt: isoPast(30),
      projectCount: 1,
      podlCount: 0,
    },
    // 3 mentor-reviewer (2 active, 1 pending_verification)
    {
      id: 'usr-016',
      displayName: 'Dr. Ananya Roy',
      email: 'ananya.roy@mentor.org',
      userType: 'mentor-reviewer',
      accountStatus: 'active',
      createdAt: isoPast(250),
      lastActiveAt: isoPast(0),
      projectCount: 0,
      podlCount: 0,
    },
    {
      id: 'usr-017',
      displayName: 'Prof. Karthik Iyer',
      email: 'karthik.iyer@mentor.org',
      userType: 'mentor-reviewer',
      accountStatus: 'active',
      createdAt: isoPast(220),
      lastActiveAt: isoPast(1),
      projectCount: 0,
      podlCount: 0,
    },
    {
      id: 'usr-018',
      displayName: 'Dr. Sunita Verma',
      email: 'sunita.verma@mentor.org',
      userType: 'mentor-reviewer',
      accountStatus: 'pending_verification',
      createdAt: isoPast(5),
      lastActiveAt: isoPast(5),
      projectCount: 0,
      podlCount: 0,
    },
  ]
}

// ---- User Detail ----
export interface UserDetailData {
  id: string
  displayName: string
  email: string
  userType: AdminUserType
  accountStatus: UserAccountStatus
  createdAt: string
  lastActiveAt: string
  projectCount: number
  podlCount: number
  // Profile-specific
  phone?: string
  organizationName?: string
  universityName?: string
  mentorTier?: string
  bio?: string
  // Verification
  verificationStatus: 'verified' | 'pending' | 'not_submitted'
  verificationDocuments: Array<{
    id: string
    type: string
    fileName: string
    submittedAt: string
    status: 'approved' | 'pending' | 'rejected'
  }>
}

const userTypeExtras: Record<AdminUserType, Partial<UserDetailData>> = {
  'woman-contributor': { phone: '+92-300-1234567' },
  'community-support-lead': { phone: '+91-98765-43210' },
  'student-contributor': { universityName: 'Indian Institute of Technology, Bangalore' },
  'alumni-contributor': { universityName: 'Indian Institute of Technology, Delhi' },
  'enterprise-requester': { organizationName: 'TechCorp Solutions Pvt. Ltd.' },
  'mentor-reviewer': { mentorTier: 'senior', organizationName: 'Academic Research Institute' },
}

export function createMockUserDetail(userId: string): UserDetailData {
  const allUsers = createMockAdminUserList()
  const user = allUsers.find((u) => u.id === userId) ?? allUsers[0]
  const extras = userTypeExtras[user.userType]

  const isPending = user.accountStatus === 'pending_verification'

  return {
    ...user,
    ...extras,
    bio: `Experienced ${user.userType.replace(/-/g, ' ')} with a focus on quality delivery and continuous learning.`,
    verificationStatus: isPending ? 'pending' : 'verified',
    verificationDocuments: isPending
      ? [
          {
            id: 'doc-001',
            type: 'National ID Card',
            fileName: 'national-id-scan.pdf',
            submittedAt: isoPast(2),
            status: 'pending',
          },
          {
            id: 'doc-002',
            type: 'Address Proof',
            fileName: 'utility-bill.pdf',
            submittedAt: isoPast(2),
            status: 'pending',
          },
        ]
      : [
          {
            id: 'doc-001',
            type: 'National ID Card',
            fileName: 'national-id-scan.pdf',
            submittedAt: isoPast(100),
            status: 'approved',
          },
        ],
  }
}

// ---- Activity Timeline ----
export interface UserActivityEvent {
  id: string
  timestamp: string
  action: string
  description: string
  entityType?: string
  entityId?: string
}

export function createMockUserActivity(_userId: string): UserActivityEvent[] {
  return [
    { id: 'act-001', timestamp: isoPast(0), action: 'login', description: 'Signed in from Chrome on Windows' },
    { id: 'act-002', timestamp: isoPast(0), action: 'task_submitted', description: 'Submitted evidence for task "API Integration"', entityType: 'task', entityId: 'task-042' },
    { id: 'act-003', timestamp: isoPast(1), action: 'project_joined', description: 'Joined project "E-Commerce Platform Migration"', entityType: 'project', entityId: 'proj-007' },
    { id: 'act-004', timestamp: isoPast(1), action: 'skill_updated', description: 'Skill "React" advanced to Developing tier' },
    { id: 'act-005', timestamp: isoPast(2), action: 'task_completed', description: 'Task "Database Schema Design" marked as complete', entityType: 'task', entityId: 'task-038' },
    { id: 'act-006', timestamp: isoPast(3), action: 'payment_received', description: 'Payment of $250 released for milestone "Phase 1 Delivery"', entityType: 'payment', entityId: 'pay-015' },
    { id: 'act-007', timestamp: isoPast(4), action: 'login', description: 'Signed in from Safari on macOS' },
    { id: 'act-008', timestamp: isoPast(5), action: 'podl_earned', description: 'PoDL credential earned for "Full-Stack Development"', entityType: 'podl', entityId: 'podl-008' },
    { id: 'act-009', timestamp: isoPast(7), action: 'task_submitted', description: 'Submitted evidence for task "UI Component Library"', entityType: 'task', entityId: 'task-035' },
    { id: 'act-010', timestamp: isoPast(10), action: 'project_joined', description: 'Joined project "Healthcare Dashboard"', entityType: 'project', entityId: 'proj-005' },
    { id: 'act-011', timestamp: isoPast(14), action: 'profile_updated', description: 'Updated profile bio and skills' },
    { id: 'act-012', timestamp: isoPast(20), action: 'login', description: 'Signed in from mobile device' },
  ]
}

// ---- User Projects ----
export interface UserProject {
  id: string
  name: string
  role: string
  status: 'active' | 'completed' | 'paused'
  joinedAt: string
  tasksCompleted: number
  totalTasks: number
}

export function createMockUserProjects(_userId: string): UserProject[] {
  return [
    {
      id: 'proj-007',
      name: 'E-Commerce Platform Migration',
      role: 'Frontend Developer',
      status: 'active',
      joinedAt: isoPast(30),
      tasksCompleted: 4,
      totalTasks: 8,
    },
    {
      id: 'proj-005',
      name: 'Healthcare Dashboard',
      role: 'Full-Stack Developer',
      status: 'active',
      joinedAt: isoPast(60),
      tasksCompleted: 6,
      totalTasks: 10,
    },
    {
      id: 'proj-003',
      name: 'Inventory Management System',
      role: 'Backend Developer',
      status: 'completed',
      joinedAt: isoPast(120),
      tasksCompleted: 12,
      totalTasks: 12,
    },
    {
      id: 'proj-001',
      name: 'Mobile Banking App',
      role: 'UI Developer',
      status: 'completed',
      joinedAt: isoPast(200),
      tasksCompleted: 5,
      totalTasks: 5,
    },
  ]
}

// ---- User Payments ----
export interface UserPayment {
  id: string
  projectName: string
  amount: number
  currency: string
  status: 'released' | 'pending' | 'held'
  date: string
  transactionId?: string
}

export function createMockUserPayments(_userId: string): UserPayment[] {
  return [
    { id: 'pay-020', projectName: 'E-Commerce Platform Migration', amount: 450, currency: 'USD', status: 'pending', date: isoPast(0) },
    { id: 'pay-018', projectName: 'Healthcare Dashboard', amount: 350, currency: 'USD', status: 'released', date: isoPast(5), transactionId: 'TXN-2026-0218' },
    { id: 'pay-015', projectName: 'Healthcare Dashboard', amount: 250, currency: 'USD', status: 'released', date: isoPast(15), transactionId: 'TXN-2026-0215' },
    { id: 'pay-012', projectName: 'Inventory Management System', amount: 600, currency: 'USD', status: 'released', date: isoPast(30), transactionId: 'TXN-2026-0212' },
    { id: 'pay-009', projectName: 'Inventory Management System', amount: 500, currency: 'USD', status: 'released', date: isoPast(60), transactionId: 'TXN-2026-0209' },
    { id: 'pay-006', projectName: 'Mobile Banking App', amount: 300, currency: 'USD', status: 'released', date: isoPast(120), transactionId: 'TXN-2025-0306' },
    { id: 'pay-003', projectName: 'Mobile Banking App', amount: 200, currency: 'USD', status: 'released', date: isoPast(150), transactionId: 'TXN-2025-0203' },
    { id: 'pay-001', projectName: 'Mobile Banking App', amount: 150, currency: 'USD', status: 'held', date: isoPast(180) },
  ]
}

// ---- User Skills ----
export interface UserSkillEntry {
  name: string
  tier: 'emerging' | 'developing' | 'proficient' | 'expert'
  evidenceCount: number
  progress: number
  verified: boolean
}

export function createMockUserSkills(_userId: string): UserSkillEntry[] {
  return [
    { name: 'React', tier: 'proficient', evidenceCount: 14, progress: 70, verified: true },
    { name: 'TypeScript', tier: 'proficient', evidenceCount: 12, progress: 60, verified: true },
    { name: 'Node.js', tier: 'developing', evidenceCount: 8, progress: 80, verified: false },
    { name: 'PostgreSQL', tier: 'developing', evidenceCount: 6, progress: 50, verified: false },
    { name: 'REST API Design', tier: 'proficient', evidenceCount: 10, progress: 40, verified: true },
    { name: 'CSS/Tailwind', tier: 'emerging', evidenceCount: 3, progress: 60, verified: false },
    { name: 'Docker', tier: 'emerging', evidenceCount: 2, progress: 30, verified: false },
  ]
}

// ---- User Audit Log ----
export interface UserAuditEntry {
  id: string
  timestamp: string
  action: string
  performedBy: string
  reason: string
}

export function createMockUserAudit(_userId: string): UserAuditEntry[] {
  return [
    { id: 'aud-010', timestamp: isoPast(0), action: 'Profile viewed by admin', performedBy: 'Admin Sarah', reason: 'Routine account review' },
    { id: 'aud-009', timestamp: isoPast(5), action: 'Payment released', performedBy: 'System (APG)', reason: 'Auto-release on evidence approval' },
    { id: 'aud-008', timestamp: isoPast(10), action: 'Account reactivated', performedBy: 'Admin Sarah', reason: 'Suspension period completed, user submitted additional verification' },
    { id: 'aud-007', timestamp: isoPast(15), action: 'Account suspended', performedBy: 'Admin John', reason: 'Incomplete identity verification within 7-day window' },
    { id: 'aud-006', timestamp: isoPast(30), action: 'Verification approved', performedBy: 'Admin Sarah', reason: 'National ID and address proof validated' },
    { id: 'aud-005', timestamp: isoPast(31), action: 'Verification documents submitted', performedBy: 'User', reason: 'Initial identity verification' },
    { id: 'aud-004', timestamp: isoPast(60), action: 'Project assignment', performedBy: 'System (APG)', reason: 'Auto-matched to project based on skill genome' },
    { id: 'aud-003', timestamp: isoPast(90), action: 'Skill tier updated', performedBy: 'System (APG)', reason: 'React skill advanced from Developing to Proficient based on 10+ evidence deliveries' },
    { id: 'aud-002', timestamp: isoPast(120), action: 'Account created', performedBy: 'System', reason: 'User completed onboarding via WhatsApp entry point' },
    { id: 'aud-001', timestamp: isoPast(120), action: 'Terms accepted', performedBy: 'User', reason: 'Accepted platform terms of service v2.1' },
  ]
}

// ---- Verification Queue ----
export function createMockVerificationQueue(): VerificationQueueItem[] {
  return [
    {
      id: 'vq-001',
      userId: 'usr-004',
      userName: 'Zara Ahmed',
      userType: 'woman-contributor',
      verificationType: 'identity',
      submittedAt: isoPast(2),
      documentsCount: 2,
    },
    {
      id: 'vq-002',
      userId: 'usr-010',
      userName: 'Vikram Patel',
      userType: 'student-contributor',
      verificationType: 'university',
      submittedAt: isoPast(3),
      documentsCount: 3,
    },
    {
      id: 'vq-003',
      userId: 'usr-018',
      userName: 'Dr. Sunita Verma',
      userType: 'mentor-reviewer',
      verificationType: 'mentor_credentials',
      submittedAt: isoPast(4),
      documentsCount: 4,
    },
    {
      id: 'vq-004',
      userId: 'usr-019',
      userName: 'Kavitha Reddy',
      userType: 'woman-contributor',
      verificationType: 'identity',
      submittedAt: isoPast(1),
      documentsCount: 2,
    },
    {
      id: 'vq-005',
      userId: 'usr-020',
      userName: 'GlobalTech Industries',
      userType: 'enterprise-requester',
      verificationType: 'organization',
      submittedAt: isoPast(5),
      documentsCount: 5,
    },
    {
      id: 'vq-006',
      userId: 'usr-021',
      userName: 'Rohit Sharma',
      userType: 'student-contributor',
      verificationType: 'university',
      submittedAt: isoPast(1),
      documentsCount: 2,
    },
  ]
}
