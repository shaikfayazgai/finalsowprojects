import { http, HttpResponse } from 'msw'
import type { AdminUser } from '@glimmora/types'

const mockAdmin: AdminUser = {
  id: 'admin-001',
  displayName: 'Platform Admin',
  email: 'admin@glimmora.com',
  adminRole: 'super_admin',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
  lastLoginAt: new Date().toISOString(),
}

export const authHandlers = [
  http.post('/api/admin/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string }
    return HttpResponse.json({
      user: { ...mockAdmin, email: body.email },
      token: 'mock-admin-jwt-token',
    })
  }),

  http.post('/api/admin/auth/logout', () => {
    return HttpResponse.json({ success: true })
  }),
]
