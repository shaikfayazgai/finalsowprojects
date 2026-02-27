import type { SystemAlert } from '@glimmora/types'
import { isoPast } from './common'

export function createMockAlerts(): SystemAlert[] {
  return [
    {
      id: 'alert-001',
      severity: 'critical',
      title: 'Payment gateway connection failed',
      message: 'The primary payment processor has been unreachable for 15 minutes. Automatic failover to backup processor is active.',
      entityType: 'payment',
      entityId: 'pg-001',
      entityHref: '/reports',
      createdAt: isoPast(0),
    },
    {
      id: 'alert-002',
      severity: 'warning',
      title: 'Verification queue backlog',
      message: '23 identity verification requests are older than 48 hours. SLA target is 24-hour turnaround.',
      entityType: 'user',
      entityHref: '/users/verification-queue',
      createdAt: isoPast(1),
    },
    {
      id: 'alert-003',
      severity: 'warning',
      title: 'Dispute escalation rate increase',
      message: 'Dispute escalation rate increased 40% week-over-week. 3 disputes were escalated to safety review.',
      entityType: 'dispute',
      entityHref: '/disputes?severity=critical',
      createdAt: isoPast(2),
    },
    {
      id: 'alert-004',
      severity: 'info',
      title: 'Scheduled maintenance window',
      message: 'Database maintenance scheduled for Sunday 02:00-04:00 UTC. Platform will remain available with reduced write throughput.',
      entityType: 'system',
      createdAt: isoPast(3),
    },
    {
      id: 'alert-005',
      severity: 'info',
      title: 'New contributor cohort onboarded',
      message: '47 women contributors from the Karachi region completed onboarding this week, exceeding the 30-user target.',
      entityType: 'user',
      entityHref: '/users',
      createdAt: isoPast(4),
    },
  ]
}
