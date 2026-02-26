export type ProjectStatus =
  | 'draft'
  | 'blueprint-review'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived'
  | 'frozen'

export type ProjectHealthStatus = 'on-track' | 'at-risk' | 'delayed' | 'critical'

export interface Project {
  id: string
  sowId: string
  name: string
  description: string
  status: ProjectStatus
  health: ProjectHealthStatus
  organizationId: string
  completionPercentage: number
  totalTasks: number
  completedTasks: number
  startDate: string
  targetEndDate: string
  actualEndDate?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectMilestone {
  id: string
  projectId: string
  name: string
  description: string
  targetDate: string
  completedDate?: string
  status: 'pending' | 'in-progress' | 'completed' | 'overdue'
  taskIds: string[]
}
