'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, CardContent, CardHeader, CardTitle, Spinner } from '@glimmora/ui'
import type { Project } from '@glimmora/types'
import type { PoDLReportData } from './podl-report-pdf'

export function PoDLExportForm() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ['completed-projects'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise/projects/completed')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    },
  })

  const selectedProject = projects?.find((p) => p.id === selectedProjectId)

  async function handleExport() {
    if (!selectedProjectId) return
    setExporting(true)
    try {
      const res = await fetch(`/api/enterprise/compliance/podl/${selectedProjectId}`)
      const { data }: { data: PoDLReportData } = await res.json()

      const { pdf } = await import('@react-pdf/renderer')
      const { PoDLReportPDF } = await import('./podl-report-pdf')

      const blob = await pdf(<PoDLReportPDF data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `podl-report-${selectedProjectId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Loading projects..." />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-text-body">
              Completed Project
            </label>
            <select
              value={selectedProjectId ?? ''}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="">Select a project...</option>
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <div className="mt-4 rounded-md border border-border bg-bg-dashboard p-4 space-y-2">
              <p className="text-sm font-medium text-text-body">{selectedProject.name}</p>
              <div className="flex gap-6 text-xs text-text-caption">
                <span>
                  Completed: {selectedProject.actualEndDate
                    ? new Date(selectedProject.actualEndDate).toLocaleDateString()
                    : 'N/A'}
                </span>
                <span>Tasks: {selectedProject.totalTasks}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleExport}
        disabled={!selectedProjectId || exporting}
        loading={exporting}
      >
        {exporting ? 'Generating PDF...' : 'Export PoDL Report'}
      </Button>
    </div>
  )
}
