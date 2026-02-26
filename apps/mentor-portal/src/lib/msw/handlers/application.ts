import { http, HttpResponse } from 'msw'
import { createMockApplication } from '../factories/mentor'

let currentApplication = createMockApplication()

export const applicationHandlers = [
  http.post('/api/mentor/application', async ({ request }) => {
    const body = (await request.json()) as {
      expertiseAreas: string[]
      credentials: string
      availability: string
    }

    currentApplication = createMockApplication({
      expertiseAreas: body.expertiseAreas,
      credentials: body.credentials,
      availability: body.availability,
      status: 'under_review',
      submittedAt: new Date().toISOString(),
      reviewedAt: undefined,
    })

    return HttpResponse.json(currentApplication, { status: 201 })
  }),

  http.get('/api/mentor/application', () =>
    HttpResponse.json(currentApplication)
  ),
]
