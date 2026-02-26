import { http, HttpResponse } from 'msw'
import { createMockEvidence } from '../factories/evidence'
import { randomId, isoNow } from '../factories/common'

export const evidenceHandlers = [
  http.post('/api/tasks/:taskId/evidence', async ({ request, params }) => {
    const body = (await request.json()) as { type: string; title: string; description: string; content: string }
    const evidence = createMockEvidence({
      id: randomId('ev'),
      taskId: params.taskId as string,
      type: body.type as 'file' | 'code' | 'url' | 'text',
      title: body.title,
      description: body.description,
      content: body.content,
      submittedAt: isoNow(),
    })
    return HttpResponse.json({ data: evidence }, { status: 201 })
  }),
]
