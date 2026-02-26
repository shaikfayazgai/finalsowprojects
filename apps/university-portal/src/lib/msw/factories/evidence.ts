import type { Evidence } from '@glimmora/types'
import { randomId, isoNow } from './common'

export function createMockEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: randomId('ev'),
    taskId: 'task-001',
    contributorId: 'student-001',
    type: 'file',
    title: 'Implementation Evidence',
    description: 'Code implementation with tests passing',
    content: '',
    fileName: 'component.tsx',
    fileSize: 24576,
    fileUrl: '/mock/files/component.tsx',
    status: 'submitted',
    submittedAt: isoNow(),
    ...overrides,
  }
}
