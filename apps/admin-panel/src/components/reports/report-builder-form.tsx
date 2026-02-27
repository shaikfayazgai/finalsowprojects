'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DatePicker,
  DataTable,
  Spinner,
  Badge,
} from '@glimmora/ui'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, FileText } from 'lucide-react'
import { exportCSV } from '@/lib/export-csv'
import type { ColumnDef } from '@tanstack/react-table'
import type { ReportType, PlatformReportData, ReportConfig } from '@glimmora/types'
import { format } from 'date-fns'

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'platform_overview', label: 'Platform Health' },
  { value: 'user_activity', label: 'User Growth' },
  { value: 'project_delivery', label: 'Delivery Performance' },
  { value: 'financial', label: 'Payment Flow' },
  { value: 'skill_growth', label: 'Dispute Analytics' },
]

const USER_TYPE_FILTERS = [
  { value: 'all', label: 'All User Types' },
  { value: 'woman-contributor', label: 'Women Contributors' },
  { value: 'student-contributor', label: 'Students' },
  { value: 'enterprise-requester', label: 'Enterprise' },
  { value: 'mentor-reviewer', label: 'Mentors' },
]

const PROJECT_STATUS_FILTERS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'frozen', label: 'Frozen' },
]

const PAYMENT_STATUS_FILTERS = [
  { value: 'all', label: 'All Payments' },
  { value: 'pending', label: 'Pending' },
  { value: 'released', label: 'Released' },
  { value: 'held', label: 'Held' },
]

const DISPUTE_TYPE_FILTERS = [
  { value: 'all', label: 'All Disputes' },
  { value: 'payment', label: 'Payment' },
  { value: 'quality', label: 'Quality' },
  { value: 'conduct', label: 'Conduct' },
  { value: 'technical', label: 'Technical' },
  { value: 'safety', label: 'Safety' },
]

interface ReportBuilderFormProps {
  initialType?: string
}

export function ReportBuilderForm({ initialType }: ReportBuilderFormProps) {
  const [reportType, setReportType] = useState<ReportType>(
    (initialType as ReportType) || 'platform_overview'
  )
  const [fromDate, setFromDate] = useState<Date | undefined>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  )
  const [toDate, setToDate] = useState<Date | undefined>(new Date())
  const [filter, setFilter] = useState('all')
  const [generated, setGenerated] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fromStr = fromDate ? format(fromDate, 'yyyy-MM-dd') : ''
  const toStr = toDate ? format(toDate, 'yyyy-MM-dd') : ''

  const { data: reportData, isLoading, refetch } = useQuery<PlatformReportData>({
    queryKey: ['admin-report', reportType, fromStr, toStr, filter],
    queryFn: async () => {
      const params = new URLSearchParams({ from: fromStr, to: toStr })
      if (filter !== 'all') params.set('filter', filter)
      const res = await fetch(`/api/admin/reports/${reportType}?${params}`)
      if (!res.ok) throw new Error('Failed to fetch report')
      return res.json()
    },
    enabled: false,
  })

  function handleGenerate() {
    setGenerated(true)
    refetch()
  }

  const filterOptions = useMemo(() => {
    switch (reportType) {
      case 'user_activity':
        return USER_TYPE_FILTERS
      case 'project_delivery':
        return PROJECT_STATUS_FILTERS
      case 'financial':
        return PAYMENT_STATUS_FILTERS
      case 'skill_growth':
        return DISPUTE_TYPE_FILTERS
      default:
        return null
    }
  }, [reportType])

  const chartRows = reportData?.chartData ?? []
  const metricEntries = Object.entries(reportData?.metrics ?? {})

  // Determine chart data key (first non-label key)
  const chartKeys = chartRows.length > 0 ? Object.keys(chartRows[0]) : []
  const labelKey = chartKeys[0] ?? 'label'
  const valueKeys = chartKeys.slice(1)

  // Build DataTable columns from chart data
  const tableColumns: ColumnDef<Record<string, unknown>, unknown>[] = chartKeys.map(
    (key) => ({
      accessorKey: key,
      header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      cell: ({ getValue }) => {
        const val = getValue()
        return typeof val === 'number' ? val.toLocaleString() : String(val ?? '')
      },
    })
  )

  function handleExportCSV() {
    if (!chartRows.length) return
    const headers = chartKeys.map((k) =>
      k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    )
    const rows = chartRows.map((row) =>
      chartKeys.map((k) => {
        const val = row[k]
        return typeof val === 'number' ? val : String(val ?? '')
      })
    )
    exportCSV(`report-${reportType}-${Date.now()}.csv`, headers, rows)
  }

  async function handleExportPDF() {
    if (!reportData) return
    setExporting(true)
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { ReportPDF } = await import('./report-pdf-document')
      const config: ReportConfig = {
        type: reportType,
        title: REPORT_TYPE_OPTIONS.find((o) => o.value === reportType)?.label ?? reportType,
        description: '',
        dateRange: { from: fromStr, to: toStr },
      }
      const blob = await pdf(<ReportPDF data={reportData} config={config} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${reportType}-${Date.now()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const CHART_COLORS = [
    'var(--color-brand-primary)',
    'var(--color-brand-forest)',
    'var(--color-brand-teal)',
    'var(--color-status-inprogress)',
  ]

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-text-heading font-body mb-1.5">
                Report Type
              </label>
              <Select value={reportType} onValueChange={(v) => { setReportType(v as ReportType); setFilter('all') }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-sm font-medium text-text-heading font-body mb-1.5">
                From Date
              </label>
              <div className="border border-border rounded-inner bg-bg-card">
                <DatePicker selected={fromDate} onSelect={setFromDate} />
              </div>
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium text-text-heading font-body mb-1.5">
                To Date
              </label>
              <div className="border border-border rounded-inner bg-bg-card">
                <DatePicker selected={toDate} onSelect={setToDate} />
              </div>
            </div>

            {/* Filter (conditional) */}
            {filterOptions && (
              <div>
                <label className="block text-sm font-medium text-text-heading font-body mb-1.5">
                  Filter
                </label>
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="mt-4">
            <Button
              onClick={handleGenerate}
              disabled={!fromDate || !toDate || isLoading}
              loading={isLoading}
            >
              {isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {generated && isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner label="Generating report..." />
        </div>
      )}

      {generated && reportData && (
        <>
          {/* Summary Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metricEntries.map(([key, value]) => (
              <Card key={key}>
                <CardContent className="p-4">
                  <p className="text-xs font-body text-text-caption uppercase tracking-wider mb-1">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xl font-display font-semibold text-text-heading">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Chart */}
          {chartRows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Trend Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartRows as Record<string, string | number>[]} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis
                        dataKey={labelKey}
                        tick={{ fontSize: 11, fill: 'var(--color-text-caption)' }}
                      />
                      <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-caption)' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--color-bg-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                      />
                      {valueKeys.map((key, idx) => (
                        <Bar
                          key={key}
                          dataKey={key}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                          radius={[4, 4, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          {chartRows.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Report Data</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={handleExportCSV}>
                      <Download className="h-4 w-4 mr-1.5" />
                      Export CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleExportPDF}
                      disabled={exporting}
                      loading={exporting}
                    >
                      <FileText className="h-4 w-4 mr-1.5" />
                      {exporting ? 'Generating PDF...' : 'Export PDF'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable<Record<string, unknown>>
                  columns={tableColumns}
                  data={chartRows as Record<string, unknown>[]}
                  pageSize={10}
                />
              </CardContent>
            </Card>
          )}

          {/* Report metadata */}
          <p className="text-xs font-body text-text-caption">
            <Badge status="normal">
              {REPORT_TYPE_OPTIONS.find((o) => o.value === reportType)?.label}
            </Badge>
            {' '}Generated at {reportData.generatedAt} | Period: {reportData.dateRange.from} to {reportData.dateRange.to}
          </p>
        </>
      )}
    </div>
  )
}
