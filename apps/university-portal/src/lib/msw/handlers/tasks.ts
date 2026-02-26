import { http, HttpResponse } from 'msw'
import type { APIResponse, Task } from '@glimmora/types'
import { createMockDiscoverableTasks, createMockAcceptedTasks, createMockTask } from '../factories/task'

const discoverTasks = createMockDiscoverableTasks()
const acceptedTasks = createMockAcceptedTasks()
const allTasks = [...discoverTasks, ...acceptedTasks]

export const taskHandlers = [
  http.get('/api/tasks/discover', () => {
    const response: APIResponse<Task[]> = {
      data: discoverTasks,
      meta: { page: 1, pageSize: 10, total: discoverTasks.length, totalPages: 1 },
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/tasks', () => {
    const response: APIResponse<Task[]> = {
      data: acceptedTasks,
      meta: { page: 1, pageSize: 10, total: acceptedTasks.length, totalPages: 1 },
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/tasks/:id', ({ params }) => {
    const task = allTasks.find((t) => t.id === params.id) ?? createMockTask({ id: params.id as string })
    return HttpResponse.json({ data: task })
  }),

  http.post('/api/tasks/:id/accept', ({ params }) => {
    return HttpResponse.json({ data: { taskId: params.id, status: 'accepted' } })
  }),
]
