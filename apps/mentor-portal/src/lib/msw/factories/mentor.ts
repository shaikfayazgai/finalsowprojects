import type { ReviewQueueItem, MentorApplication, MentorOnboardingProfile, MentorImpactMetrics } from '@glimmora/types'
import { isoFuture, isoPast } from './common'

export function createMockApplication(overrides?: Partial<MentorApplication>): MentorApplication {
  return {
    id: 'app-001',
    expertiseAreas: ['TypeScript', 'React', 'Node.js'],
    credentials: 'Senior software engineer with 8 years experience. Led multiple code review programs. AWS certified solutions architect.',
    availability: '10h/week',
    status: 'approved',
    submittedAt: isoPast(168), // 7 days ago
    reviewedAt: isoPast(48), // 2 days ago
    ...overrides,
  }
}

export function createMockProfile(overrides?: Partial<MentorOnboardingProfile>): MentorOnboardingProfile {
  return {
    id: 'profile-001',
    mentorId: 'mentor-001',
    displayName: 'Alex Rivera',
    bio: 'Full-stack engineer passionate about code quality and mentoring junior developers.',
    tier: 'silver',
    expertiseSkillIds: ['typescript', 'react', 'node', 'system-design', 'api-design'],
    capacityHoursPerWeek: 10,
    isPaused: false,
    joinedAt: isoPast(720), // 30 days ago
    ...overrides,
  }
}

export function createMockMetrics(overrides?: Partial<MentorImpactMetrics>): MentorImpactMetrics {
  return {
    totalReviews: 47,
    averageReviewHours: 1.8,
    reworkRate: 0.23,
    appealsOverturnedRate: 0.04,
    pendingReviews: 3,
    ...overrides,
  }
}

export function createMockReviewQueue(): ReviewQueueItem[] {
  return [
    {
      id: 'review-001',
      taskId: 'task-101',
      taskTitle: 'Implement user authentication flow',
      submittedAt: isoPast(4),
      slaDeadline: isoFuture(20),
      status: 'pending',
      skillTags: ['TypeScript', 'React', 'Authentication'],
      submissionCount: 1,
    },
    {
      id: 'review-002',
      taskId: 'task-102',
      taskTitle: 'Design REST API for project management',
      submittedAt: isoPast(8),
      slaDeadline: isoFuture(16),
      status: 'pending',
      skillTags: ['API Design', 'Node.js', 'OpenAPI'],
      submissionCount: 2,
      hasSLAExtensionPending: true,
    },
    {
      id: 'review-003',
      taskId: 'task-103',
      taskTitle: 'Create responsive dashboard layout',
      submittedAt: isoPast(24),
      slaDeadline: isoFuture(0.5),
      status: 'in_progress',
      skillTags: ['React', 'CSS', 'Responsive Design'],
      submissionCount: 1,
      hasDraft: true,
    },
    {
      id: 'review-004',
      taskId: 'task-104',
      taskTitle: 'Write unit tests for payment module',
      submittedAt: isoPast(48),
      slaDeadline: isoFuture(8),
      status: 'in_progress',
      skillTags: ['TypeScript', 'Testing', 'Jest'],
      submissionCount: 3,
      hasDraft: true,
    },
    {
      id: 'review-005',
      taskId: 'task-105',
      taskTitle: 'Database schema migration for notifications',
      submittedAt: isoPast(72),
      slaDeadline: isoPast(24),
      status: 'completed',
      skillTags: ['Database Design', 'PostgreSQL', 'Migration'],
      submissionCount: 1,
    },
  ]
}
