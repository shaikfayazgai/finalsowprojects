export type EarningStatus = 'pending' | 'released' | 'withdrawn'

export interface Earning {
  id: string
  taskId: string
  taskTitle: string
  amount: number
  currency: string
  status: EarningStatus
  earnedAt: string
  releasedAt?: string
}

export interface EarningsSummary {
  totalEarned: number
  pendingAmount: number
  releasedAmount: number
  withdrawnAmount: number
  currency: string
  earningsHistory: Earning[]
}
