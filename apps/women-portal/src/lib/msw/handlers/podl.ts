import { http, HttpResponse } from 'msw'
import { createMockPoDLCredentials } from '../factories/podl'

export const podlHandlers = [
  http.get('/api/credentials', () => {
    return HttpResponse.json({ data: createMockPoDLCredentials() })
  }),
]
