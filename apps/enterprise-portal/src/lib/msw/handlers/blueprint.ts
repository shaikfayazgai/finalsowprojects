import { http, HttpResponse, delay } from 'msw'
import {
  createMockBlueprint,
  createMockBlueprintIntelligence,
} from '../factories/blueprint'

export const blueprintHandlers = [
  http.get('/api/enterprise/blueprint/:sowId', async ({ params }) => {
    await delay(500)
    const sowId = params.sowId as string
    return HttpResponse.json({
      blueprint: createMockBlueprint(sowId),
      intelligence: createMockBlueprintIntelligence(sowId),
    })
  }),

  http.patch('/api/enterprise/blueprint/:sowId', async () => {
    await delay(300)
    return HttpResponse.json({ status: 'saved', message: 'Blueprint saved successfully' })
  }),

  http.post('/api/enterprise/blueprint/:sowId/approve', async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as { otp: string }
    if (!body.otp || body.otp.length !== 6) {
      return HttpResponse.json(
        { error: 'Invalid OTP. Must be 6 digits.' },
        { status: 400 }
      )
    }
    return HttpResponse.json({
      status: 'approved',
      projectId: 'proj-001',
      message: 'Blueprint approved. Team formation initiated.',
    })
  }),
]
