import { http, HttpResponse } from 'msw'
import { createMockReportData } from '../factories/report'

export const reportHandlers = [
  http.get('/api/admin/reports/:type', ({ params, request }) => {
    const url = new URL(request.url)
    const from = url.searchParams.get('from') ?? ''
    const to = url.searchParams.get('to') ?? ''
    const data = createMockReportData(params.type as string)
    data.dateRange = { from, to }
    return HttpResponse.json(data)
  }),
]
