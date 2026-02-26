import { http, HttpResponse } from 'msw'
import { createMockEarningsSummary } from '../factories/earnings'

export const earningsHandlers = [
  http.get('/api/earnings', () => {
    return HttpResponse.json({ data: createMockEarningsSummary() })
  }),
]
