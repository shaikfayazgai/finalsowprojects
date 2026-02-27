import { http, HttpResponse } from 'msw'
import type { PlatformStats } from '@glimmora/types'
import { createMockAlerts } from '../factories/system-alert'

const mockStats: PlatformStats = {
  totalActiveUsers: 1_247,
  activeProjects: 38,
  pendingReviews: 14,
  openDisputes: 5,
  paymentsHeld: 127_500,
  paymentsHeldCurrency: 'USD',
  systemHealthScore: 96,
  verificationQueueCount: 23,
  pendingEscalations: 3,
}

let alerts = createMockAlerts()

export const dashboardHandlers = [
  http.get('/api/admin/dashboard/stats', () => {
    return HttpResponse.json(mockStats)
  }),

  http.get('/api/admin/dashboard/alerts', () => {
    return HttpResponse.json(alerts)
  }),

  http.post('/api/admin/dashboard/alerts/:id/dismiss', ({ params }) => {
    const { id } = params
    alerts = alerts.map((a) =>
      a.id === id ? { ...a, dismissedAt: new Date().toISOString() } : a
    )
    return HttpResponse.json({ success: true })
  }),
]
