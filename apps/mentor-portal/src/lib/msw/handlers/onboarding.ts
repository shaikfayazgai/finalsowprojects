import { http, HttpResponse } from 'msw'

const completedSteps: string[] = []

export const onboardingHandlers = [
  http.get('/api/mentor/onboarding/status', () =>
    HttpResponse.json({ completedSteps })
  ),

  http.post('/api/mentor/onboarding/profile', async ({ request }) => {
    const body = (await request.json()) as { displayName: string; bio?: string }
    if (!completedSteps.includes('profile')) {
      completedSteps.push('profile')
    }
    return HttpResponse.json({ success: true, displayName: body.displayName })
  }),

  http.post('/api/mentor/onboarding/skills', async ({ request }) => {
    const body = (await request.json()) as { expertiseAreas: string[] }
    if (!completedSteps.includes('skills')) {
      completedSteps.push('skills')
    }
    return HttpResponse.json({ success: true, count: body.expertiseAreas.length })
  }),

  http.post('/api/mentor/onboarding/capacity', async ({ request }) => {
    const body = (await request.json()) as {
      capacityHoursPerWeek: number
      preferredReviewTypes: string[]
    }
    if (!completedSteps.includes('capacity')) {
      completedSteps.push('capacity')
    }
    return HttpResponse.json({ success: true, hours: body.capacityHoursPerWeek })
  }),

  http.post('/api/mentor/onboarding/orientation', async () => {
    if (!completedSteps.includes('orientation')) {
      completedSteps.push('orientation')
    }
    return HttpResponse.json({ success: true, onboardingComplete: true })
  }),
]
