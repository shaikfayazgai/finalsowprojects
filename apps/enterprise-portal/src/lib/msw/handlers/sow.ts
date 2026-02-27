import { http, HttpResponse, delay } from 'msw'
import { randomId } from '../factories/common'
import {
  createMockSOWIntelligence,
  createMockSOWVersions,
  createMockSOWArchive,
} from '../factories/sow'

export const sowHandlers = [
  http.post('/api/enterprise/sow/upload', async ({ request }) => {
    await delay(2000)

    const formData = await request.formData()
    const existingSOWId = formData.get('existingSOWId') as string | null
    const sowId = existingSOWId || randomId('sow')
    const versionNumber = existingSOWId ? 2 : 1

    return HttpResponse.json({
      sowId,
      versionNumber,
      status: 'parsed',
      message: existingSOWId
        ? `New version (v${versionNumber}) uploaded successfully`
        : 'SOW uploaded and analyzed successfully',
    })
  }),

  http.get('/api/enterprise/sow/:sowId/intelligence', async ({ params }) => {
    await delay(500)
    const sowId = params.sowId as string
    return HttpResponse.json(createMockSOWIntelligence(sowId))
  }),

  http.get('/api/enterprise/sow/:sowId/versions', async ({ params }) => {
    await delay(300)
    const sowId = params.sowId as string
    return HttpResponse.json(createMockSOWVersions(sowId))
  }),

  http.get('/api/enterprise/sow/archive', async () => {
    await delay(300)
    return HttpResponse.json(createMockSOWArchive())
  }),

  http.delete('/api/enterprise/sow/:sowId', async () => {
    await delay(200)
    return new HttpResponse(null, { status: 204 })
  }),
]
