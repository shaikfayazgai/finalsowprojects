import type { EarningsSummary } from '@glimmora/types'
import { randomId } from './common'

export function createMockEarningsSummary(): EarningsSummary {
  return {
    totalEarned: 1920,
    pendingAmount: 240,
    releasedAmount: 1680,
    withdrawnAmount: 160,
    currency: 'USD',
    earningsHistory: [
      { id: randomId('earn'), taskId: 'task-008', taskTitle: 'Dark Mode Toggle Implementation', amount: 120, currency: 'USD', status: 'released', earnedAt: '2026-02-15T10:00:00Z', releasedAt: '2026-02-18T10:00:00Z' },
      { id: randomId('earn'), taskId: 'task-006', taskTitle: 'Image Loading Pipeline Optimization', amount: 200, currency: 'USD', status: 'released', earnedAt: '2026-02-10T10:00:00Z', releasedAt: '2026-02-14T10:00:00Z' },
      { id: randomId('earn'), taskId: 'task-004', taskTitle: 'Responsive Navigation Component', amount: 160, currency: 'USD', status: 'withdrawn', earnedAt: '2026-02-05T10:00:00Z', releasedAt: '2026-02-08T10:00:00Z' },
      { id: randomId('earn'), taskId: 'task-002', taskTitle: 'API Integration Layer', amount: 240, currency: 'USD', status: 'pending', earnedAt: '2026-02-20T10:00:00Z' },
      { id: randomId('earn'), taskId: 'task-001', taskTitle: 'Landing Page Redesign', amount: 180, currency: 'USD', status: 'released', earnedAt: '2026-01-28T10:00:00Z', releasedAt: '2026-02-01T10:00:00Z' },
    ],
  }
}
