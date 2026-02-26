import { http, HttpResponse } from 'msw'
import type { APIResponse, Task } from '@glimmora/types'

const mockTasks: Task[] = [
  {
    id: 'task-001',
    projectId: 'proj-001',
    title: 'Design Landing Page',
    description: 'Create responsive landing page design following brand guidelines',
    type: 'design',
    status: 'in-progress',
    priority: 'high',
    skillRequirements: ['ui-design', 'figma', 'responsive'],
    assignedContributorId: 'contrib-001',
    estimatedHours: 12,
    dueDate: '2026-03-15T00:00:00Z',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-25T14:30:00Z',
  },
  {
    id: 'task-002',
    projectId: 'proj-001',
    title: 'Implement Authentication Flow',
    description: 'Build login, registration, and password reset flows',
    type: 'development',
    status: 'open',
    priority: 'urgent',
    skillRequirements: ['react', 'typescript', 'auth'],
    estimatedHours: 20,
    dueDate: '2026-03-20T00:00:00Z',
    createdAt: '2026-02-20T10:00:00Z',
    updatedAt: '2026-02-20T10:00:00Z',
  },
]

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
  }),

  http.get('/api/tasks', () => {
    const response: APIResponse<Task[]> = {
      data: mockTasks,
      meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
    }
    return HttpResponse.json(response)
  }),
]
