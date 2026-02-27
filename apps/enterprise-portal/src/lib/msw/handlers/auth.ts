import { http, HttpResponse } from 'msw'
import type { EnterpriseUser } from '@glimmora/types'

const mockUser: EnterpriseUser = {
  id: 'eu-001',
  role: 'enterprise-requester',
  displayName: 'Priya Nair',
  email: 'priya@acmecorp.com',
  isActive: true,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-02-27T10:00:00Z',
  organizationId: 'org-001',
  organizationName: 'Acme Corporation',
}

export const authHandlers = [
  http.post('/api/enterprise/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    return HttpResponse.json({
      user: { ...mockUser, email: body.email },
      token: 'mock-enterprise-jwt-token',
    })
  }),

  http.post('/api/enterprise/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),
]
