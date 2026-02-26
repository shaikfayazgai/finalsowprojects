import { http, HttpResponse } from 'msw'
import { createMockAPGActivities } from '../factories/apg'

export const apgHandlers = [
  http.get('/api/apg/activities', () => {
    return HttpResponse.json({ data: createMockAPGActivities() })
  }),
]
