import { http, HttpResponse } from 'msw'
import { createMockCredentials } from '../factories/podl'

const credentials = createMockCredentials()

export const credentialHandlers = [
  http.get('/api/credentials', () => {
    return HttpResponse.json({ data: credentials })
  }),

  http.get('/api/credentials/:id', ({ params }) => {
    const credential = credentials.find((c) => c.id === params.id)
    if (!credential) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return HttpResponse.json({ data: credential })
  }),

  http.post('/api/credentials/:id/share', ({ params }) => {
    return HttpResponse.json({
      data: {
        credentialId: params.id,
        shareUrl: `https://glimmora.team/verify/${params.id}`,
      },
    })
  }),
]
