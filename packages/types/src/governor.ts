export interface GovernorMetrics {
  institutionId: string
  institutionName: string
  totalActiveStudents: number
  totalTasksCompleted: number
  totalPoDLsIssued: number
  totalEarningsDistributed: number
  currency: string
  reportPeriod: string
}

export interface CohortTrend {
  cohortLabel: string
  completionRate: number
  averageTasksPerStudent: number
  podlIssuanceRate: number
  reportPeriod: string
}

export interface TaskCategory {
  id: string
  name: string
  description: string
  isEnabled: boolean
}
