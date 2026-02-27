import { http, HttpResponse } from 'msw'
import {
  createMockAdminUserList,
  createMockUserDetail,
  createMockUserActivity,
  createMockUserProjects,
  createMockUserPayments,
  createMockUserSkills,
  createMockUserAudit,
  createMockVerificationQueue,
} from '../factories/user'

const mockUsers = createMockAdminUserList()
const mockVerificationQueue = createMockVerificationQueue()

export const userHandlers = [
  // ---- Verification routes MUST come BEFORE :userId to prevent path shadowing ----

  http.get('/api/admin/users/verification-queue', () => {
    return HttpResponse.json(mockVerificationQueue)
  }),

  http.post('/api/admin/users/verification/:itemId/approve', async ({ params, request }) => {
    const { reason } = (await request.json()) as { reason: string }
    return HttpResponse.json({
      success: true,
      action: 'approve_verification',
      itemId: params.itemId,
      reason,
      performedAt: new Date().toISOString(),
    })
  }),

  http.post('/api/admin/users/verification/:itemId/reject', async ({ params, request }) => {
    const { reason } = (await request.json()) as { reason: string }
    return HttpResponse.json({
      success: true,
      action: 'reject_verification',
      itemId: params.itemId,
      reason,
      performedAt: new Date().toISOString(),
    })
  }),

  // ---- User list ----
  http.get('/api/admin/users', ({ request }) => {
    const url = new URL(request.url)
    const typeFilter = url.searchParams.get('type')
    const statusFilter = url.searchParams.get('status')

    let filtered = mockUsers
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter((u) => u.userType === typeFilter)
    }
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((u) => u.accountStatus === statusFilter)
    }

    return HttpResponse.json(filtered)
  }),

  // ---- User detail ----
  http.get('/api/admin/users/:userId', ({ params }) => {
    const detail = createMockUserDetail(params.userId as string)
    return HttpResponse.json(detail)
  }),

  // ---- User activity ----
  http.get('/api/admin/users/:userId/activity', ({ params }) => {
    return HttpResponse.json(createMockUserActivity(params.userId as string))
  }),

  // ---- User projects ----
  http.get('/api/admin/users/:userId/projects', ({ params }) => {
    return HttpResponse.json(createMockUserProjects(params.userId as string))
  }),

  // ---- User payments ----
  http.get('/api/admin/users/:userId/payments', ({ params }) => {
    return HttpResponse.json(createMockUserPayments(params.userId as string))
  }),

  // ---- User skills ----
  http.get('/api/admin/users/:userId/skills', ({ params }) => {
    return HttpResponse.json(createMockUserSkills(params.userId as string))
  }),

  // ---- User audit log ----
  http.get('/api/admin/users/:userId/audit', ({ params }) => {
    return HttpResponse.json(createMockUserAudit(params.userId as string))
  }),

  // ---- Suspend user ----
  http.post('/api/admin/users/:userId/suspend', async ({ params, request }) => {
    const { reason } = (await request.json()) as { reason: string }
    return HttpResponse.json({
      success: true,
      action: 'suspend',
      userId: params.userId,
      reason,
      performedAt: new Date().toISOString(),
    })
  }),

  // ---- Reactivate user ----
  http.post('/api/admin/users/:userId/reactivate', async ({ params, request }) => {
    const { reason } = (await request.json()) as { reason: string }
    return HttpResponse.json({
      success: true,
      action: 'reactivate',
      userId: params.userId,
      reason,
      performedAt: new Date().toISOString(),
    })
  }),
]
