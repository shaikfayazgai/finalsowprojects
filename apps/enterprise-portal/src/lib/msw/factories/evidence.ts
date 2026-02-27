import type { Evidence, EvidencePack, EvidenceStatus } from '@glimmora/types'
import { randomId } from './common'

function createMockEvidence(
  taskId: string,
  type: Evidence['type'],
  overrides?: Partial<Evidence>
): Evidence {
  const base: Evidence = {
    id: randomId('ev'),
    taskId,
    type,
    title: '',
    description: '',
    content: '',
    status: 'submitted',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * Math.random() * 7).toISOString(),
  }

  switch (type) {
    case 'code':
      return {
        ...base,
        title: 'API Endpoint Implementation',
        description: 'REST API endpoint with authentication middleware',
        content: `import { Router } from 'express';\n\nconst router = Router();\n\nrouter.get('/api/data', authenticate, async (req, res) => {\n  const data = await fetchData(req.user.id);\n  res.json({ data });\n});\n\nexport default router;`,
        fileName: 'api-routes.ts',
        ...overrides,
      }
    case 'file':
      return {
        ...base,
        title: 'Architecture Document',
        description: 'System architecture diagram and technical specification',
        content: '',
        fileName: 'architecture-spec.pdf',
        fileUrl: '/mock/files/architecture-spec.pdf',
        fileSize: 2450000,
        ...overrides,
      }
    case 'url':
      return {
        ...base,
        title: 'Deployed Application',
        description: 'Staging environment deployment URL',
        content: 'https://staging.example.com/app',
        ...overrides,
      }
    case 'video-url':
      return {
        ...base,
        title: 'Feature Demo Recording',
        description: 'Screen recording demonstrating the implemented feature',
        content: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        ...overrides,
      }
    case 'text':
      return {
        ...base,
        title: 'Testing Summary',
        description: 'Unit and integration test results',
        content: 'All 47 unit tests passing. Integration tests: 12/12 passed.\nCode coverage: 89% (lines), 92% (branches).\nPerformance benchmark: avg response time 42ms (target: <100ms).',
        ...overrides,
      }
  }
}

export function createMockEvidencePacks(projectId: string): EvidencePack[] {
  const statuses: EvidenceStatus[] = ['submitted', 'under-review', 'approved', 'rework-required', 'submitted']

  const milestoneNames = [
    'Project Kickoff & Architecture',
    'Core Platform MVP',
    'Analytics & Personalization',
    'Multi-channel Communication',
    'UAT & Launch',
  ]

  return statuses.map((status, i) => {
    const packId = `pack-${String(i + 1).padStart(3, '0')}`
    const taskId = `task-${String(i * 3 + 1).padStart(3, '0')}`

    const evidenceTypes: Evidence['type'][] = ['code', 'file', 'text', 'url']
    const itemCount = 2 + (i % 3)
    const items = evidenceTypes.slice(0, itemCount).map((type) =>
      createMockEvidence(taskId, type, { status })
    )

    return {
      id: packId,
      taskId,
      projectId,
      evidenceItems: items,
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (5 - i)).toISOString(),
      status,
      milestoneName: milestoneNames[i],
    } as EvidencePack & { milestoneName: string }
  })
}

export function createMockEvidencePackDetail(packId: string): EvidencePack & { milestoneName: string } {
  const taskId = 'task-001'
  return {
    id: packId,
    taskId,
    projectId: 'proj-001',
    evidenceItems: [
      createMockEvidence(taskId, 'code', { status: 'submitted' }),
      createMockEvidence(taskId, 'file', { status: 'submitted' }),
      createMockEvidence(taskId, 'text', { status: 'submitted' }),
      createMockEvidence(taskId, 'url', { status: 'submitted' }),
    ],
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    status: 'submitted',
    milestoneName: 'Core Platform MVP',
  }
}

export interface MockReworkRequest {
  id: string
  packId: string
  milestoneName: string
  reason: string
  itemsToAddress: string
  status: 'pending' | 'responded'
  submittedAt: string
  respondedAt?: string
}

export function createMockReworkRequests(projectId: string): MockReworkRequest[] {
  return [
    {
      id: randomId('rw'),
      packId: 'pack-001',
      milestoneName: 'Project Kickoff & Architecture',
      reason: 'Architecture diagram is missing the caching layer and does not show the message queue integration.',
      itemsToAddress: '1. Add Redis caching layer to architecture diagram\n2. Show BullMQ integration for async task processing\n3. Update API gateway routing table',
      status: 'responded',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      respondedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: randomId('rw'),
      packId: 'pack-003',
      milestoneName: 'Analytics & Personalization',
      reason: 'Dashboard charts do not include the real-time data streaming requirement specified in clause 4.2.',
      itemsToAddress: '1. Implement WebSocket connection for real-time chart updates\n2. Add data refresh indicator to chart headers',
      status: 'pending',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
  ]
}

export interface MockEscalation {
  id: string
  packId: string
  milestoneName: string
  reason: string
  priority: 'normal' | 'high' | 'urgent'
  status: 'pending-mentor' | 'resolved'
  submittedAt: string
  resolvedAt?: string
}

export function createMockEscalations(projectId: string): MockEscalation[] {
  return [
    {
      id: randomId('esc'),
      packId: 'pack-002',
      milestoneName: 'Core Platform MVP',
      reason: 'Evidence shows potential security vulnerability in authentication implementation. Need mentor review to assess if JWT refresh token rotation meets SOW security requirements.',
      priority: 'high',
      status: 'pending-mentor',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: randomId('esc'),
      packId: 'pack-001',
      milestoneName: 'Project Kickoff & Architecture',
      reason: 'Ambiguity in SOW clause interpretation -- architecture decision needs mentor input on microservices vs monolith approach.',
      priority: 'normal',
      status: 'resolved',
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ]
}
