import { http, HttpResponse } from 'msw'
import { createMockMessageThreads } from '../factories/messages'

const threads = createMockMessageThreads()

export const messageHandlers = [
  http.get('/api/messages', () => {
    return HttpResponse.json({ data: threads })
  }),

  http.post('/api/messages', async ({ request }) => {
    const body = await request.json() as { threadId: string; content: string }
    const thread = threads.find(t => t.id === body.threadId)
    if (thread) {
      thread.messages.push({
        id: `msg-${Date.now()}`,
        threadId: body.threadId,
        senderRole: 'contributor',
        content: body.content,
        sentAt: new Date().toISOString(),
        isRead: true,
      })
      thread.lastMessageAt = new Date().toISOString()
    }
    return HttpResponse.json({ data: thread })
  }),
]
