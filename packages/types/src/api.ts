export interface APIResponse<T> {
  data: T
  meta?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  error?: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

export interface APGActivity {
  id: string
  type: 'task-assigned' | 'evidence-reviewed' | 'milestone-updated' | 'team-formed' | 'guidance-issued' | 'payment-triggered'
  message: string
  entityId: string
  entityType: 'task' | 'project' | 'evidence' | 'payment'
  timestamp: string
}
