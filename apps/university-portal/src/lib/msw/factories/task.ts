import type { Task } from '@glimmora/types'
import { isoNow } from './common'

let taskCounter = 1

export function createMockTask(overrides: Partial<Task> = {}): Task {
  const id = overrides.id ?? `task-${String(taskCounter++).padStart(3, '0')}`
  return {
    id,
    projectId: 'proj-001',
    title: `UI Component Implementation: ${id}`,
    description:
      'Implement the specified UI component following the design system guidelines and accessibility requirements.',
    type: 'development',
    status: 'open',
    priority: 'medium',
    skillRequirements: ['React', 'TypeScript', 'Tailwind CSS'],
    estimatedHours: 8,
    dueDate: '2026-04-01T00:00:00Z',
    apgGuidance:
      'Focus on accessibility and responsive behavior. Use existing design system components where possible.',
    createdAt: isoNow(),
    updatedAt: isoNow(),
    ...overrides,
  }
}

export function createMockDiscoverableTasks(): Task[] {
  return [
    createMockTask({
      title: 'Build Responsive Dashboard Widgets',
      status: 'open',
      priority: 'high',
      skillRequirements: ['React', 'TypeScript', 'CSS'],
      estimatedHours: 12,
    }),
    createMockTask({
      title: 'Implement REST API Client Module',
      status: 'open',
      priority: 'medium',
      skillRequirements: ['TypeScript', 'REST APIs', 'Node.js'],
      estimatedHours: 10,
    }),
    createMockTask({
      title: 'Create Data Visualization Charts',
      status: 'open',
      priority: 'medium',
      skillRequirements: ['React', 'D3.js', 'Data Analysis'],
      estimatedHours: 15,
    }),
    createMockTask({
      title: 'Write API Documentation',
      status: 'open',
      priority: 'low',
      skillRequirements: ['Technical Writing', 'Markdown', 'API Docs'],
      estimatedHours: 6,
    }),
  ]
}

export function createMockAcceptedTasks(): Task[] {
  return [
    createMockTask({
      title: 'Build User Profile Card Component',
      status: 'in-progress',
      priority: 'high',
      skillRequirements: ['React', 'TypeScript', 'CSS'],
      assignedContributorId: 'student-001',
    }),
    createMockTask({
      title: 'Implement Search Filters API',
      status: 'evidence-submitted',
      priority: 'medium',
      skillRequirements: ['Node.js', 'TypeScript', 'SQL'],
      assignedContributorId: 'student-001',
    }),
    createMockTask({
      title: 'Write Unit Tests for Auth Module',
      status: 'under-review',
      priority: 'high',
      skillRequirements: ['Testing', 'TypeScript', 'Jest'],
      assignedContributorId: 'student-001',
    }),
    createMockTask({
      title: 'Optimize Image Loading Pipeline',
      status: 'approved',
      priority: 'medium',
      skillRequirements: ['Performance', 'React', 'CDN'],
      assignedContributorId: 'student-001',
    }),
    createMockTask({
      title: 'Implement Dark Mode Toggle',
      status: 'completed',
      priority: 'low',
      skillRequirements: ['CSS', 'React', 'Tailwind'],
      assignedContributorId: 'student-001',
    }),
  ]
}
