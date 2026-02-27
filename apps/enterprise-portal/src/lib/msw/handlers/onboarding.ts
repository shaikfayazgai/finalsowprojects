import { http, HttpResponse } from 'msw'

export const onboardingHandlers = [
  http.get('/api/enterprise/onboarding', () => {
    return HttpResponse.json({
      currentStep: 'company',
      completedSteps: [],
      companyVerified: false,
    })
  }),

  http.post('/api/enterprise/onboarding/company', () => {
    return HttpResponse.json({ success: true, step: 'company' })
  }),

  http.post('/api/enterprise/onboarding/billing', () => {
    return HttpResponse.json({ success: true, step: 'billing' })
  }),

  http.post('/api/enterprise/onboarding/team', () => {
    return HttpResponse.json({ success: true, step: 'team' })
  }),

  http.post('/api/enterprise/onboarding/complete', () => {
    return HttpResponse.json({ success: true, onboardingCompleted: true })
  }),
]
