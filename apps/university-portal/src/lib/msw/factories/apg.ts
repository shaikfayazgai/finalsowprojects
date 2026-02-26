import type { APGActivity } from '@glimmora/types'
import { randomId } from './common'

export function createMockAPGActivities(): APGActivity[] {
  const now = Date.now()
  return [
    {
      id: randomId('apg'),
      type: 'task-assigned',
      message:
        'APG matched "Build Responsive Dashboard Widgets" to your React + TypeScript skills',
      entityId: 'task-001',
      entityType: 'task',
      timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: randomId('apg'),
      type: 'evidence-reviewed',
      message:
        'Evidence for "Search Filters API" moved to mentor review queue',
      entityId: 'task-002',
      entityType: 'evidence',
      timestamp: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: randomId('apg'),
      type: 'milestone-updated',
      message:
        'Project Alpha milestone "Phase 2 Components" is 75% complete',
      entityId: 'proj-001',
      entityType: 'project',
      timestamp: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: randomId('apg'),
      type: 'guidance-issued',
      message:
        'Consider adding unit tests before submitting your API client module',
      entityId: 'task-007',
      entityType: 'task',
      timestamp: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: randomId('apg'),
      type: 'payment-triggered',
      message: 'Payment of $85 released for "Implement Dark Mode Toggle"',
      entityId: 'task-008',
      entityType: 'payment',
      timestamp: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
    },
  ]
}
