'use client'
import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@glimmora/ui'
import type { ESGReportData } from '@glimmora/types'

export function ESGExportForm() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    if (!startDate || !endDate) return
    setExporting(true)
    try {
      const res = await fetch(
        `/api/enterprise/compliance/esg?from=${startDate}&to=${endDate}`
      )
      const { data }: { data: ESGReportData } = await res.json()

      const { pdf } = await import('@react-pdf/renderer')
      const { ESGReportPDF } = await import('./esg-report-pdf')

      const blob = await pdf(<ESGReportPDF data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `esg-report-${startDate}-to-${endDate}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-text-caption">
            The report will include GRI-aligned ESG metrics for the selected period, covering
            workforce diversity (GRI 405), skills development (GRI 404), fair payment, and delivery quality.
          </p>
        </CardContent>
      </Card>

      <Button
        onClick={handleExport}
        disabled={!startDate || !endDate || exporting}
        loading={exporting}
      >
        {exporting ? 'Generating PDF...' : 'Export ESG Report'}
      </Button>
    </div>
  )
}
