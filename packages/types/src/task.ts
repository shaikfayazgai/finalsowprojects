export type TaskStatus =
  | 'open'
  | 'assigned'
  | 'in-progress'
  | 'evidence-submitted'
  | 'under-review'
  | 'rework-required'
  | 'approved'
  | 'rejected'
  | 'completed'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskType =
  | 'development'
  | 'design'
  | 'testing'
  | 'documentation'
  | 'research'
  | 'review'

export interface Task {
  id: string
  projectId: string
  milestoneId?: string
  title: string
  description: string
  type: TaskType
  status: TaskStatus
  priority: TaskPriority
  skillRequirements: string[]
  assignedContributorId?: string
  estimatedHours: number
  actualHours?: number
  dueDate: string
  apgGuidance?: string
  createdAt: string
  updatedAt: string
}
