import { http, HttpResponse, delay } from 'msw'
import {
  createMockPayments,
  createMockPaymentPreferences,
  createMockSilentApprovals,
} from '../factories/payment'

export const paymentHandlers = [
  http.get('/api/enterprise/projects/:id/payments', async ({ params }) => {
    await delay(400)
    const id = params.id as string
    return HttpResponse.json(createMockPayments(id))
  }),

  http.post('/api/enterprise/payments/:id/release', async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as { otp?: string }
    if (!body.otp || body.otp.length !== 6) {
      return HttpResponse.json(
        { error: 'Valid 6-digit OTP is required' },
        { status: 400 }
      )
    }
    return HttpResponse.json({ status: 'released', transactionId: 'TXN-2026-' + Date.now().toString().slice(-4) })
  }),

  http.post('/api/enterprise/payments/bulk-release', async ({ request }) => {
    await delay(600)
    const body = (await request.json()) as { paymentIds?: string[]; otp?: string }
    if (!body.paymentIds || body.paymentIds.length === 0) {
      return HttpResponse.json(
        { error: 'At least one payment must be selected' },
        { status: 400 }
      )
    }
    if (!body.otp || body.otp.length !== 6) {
      return HttpResponse.json(
        { error: 'Valid 6-digit OTP is required' },
        { status: 400 }
      )
    }
    return HttpResponse.json({
      status: 'released',
      releasedCount: body.paymentIds.length,
    })
  }),

  http.get('/api/enterprise/payments/preferences', async () => {
    await delay(300)
    return HttpResponse.json(createMockPaymentPreferences())
  }),

  http.patch('/api/enterprise/payments/preferences', async () => {
    await delay(400)
    return HttpResponse.json({ status: 'updated' })
  }),

  http.get('/api/enterprise/payments/silent-approvals', async () => {
    await delay(300)
    return HttpResponse.json(createMockSilentApprovals())
  }),

  http.get('/api/enterprise/payments/history', async () => {
    await delay(400)
    return HttpResponse.json(createMockPayments('proj-001'))
  }),
]
