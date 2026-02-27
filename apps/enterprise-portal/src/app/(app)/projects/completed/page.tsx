'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, DataTable, Badge, Spinner } from '@glimmora/ui'
import type { ColumnDef } from '@tanstack/react-table'
import type { Project } from '@glimmora/types'

function getDuration(start: string, end?: string): string {
  if (!end) return 'N/A'
  const startDate = new Date(start)
  const endDate = new Date(end)
  const weeks = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
  return `${weeks} weeks`
}

export default function CompletedProjectsPage() {
  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['completed-projects'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise/projects/completed')
      if (!res.ok) throw new Error('Failed to fetch projects')
      return res.json()
    },
  })

  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Project Name',
        cell: ({ row }) => (
          <Link href={`/projects/${row.original.id}`} className="font-medium text-brand-primary hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'actualEndDate',
        header: 'Completion Date',
        cell: ({ row }) =>
          row.original.actualEndDate
            ? new Date(row.original.actualEndDate).toLocaleDateString()
            : 'N/A',
      },
      {
        accessorKey: 'totalTasks',
        header: 'Total Tasks',
      },
      {
        id: 'duration',
        header: 'Duration',
        cell: ({ row }) => getDuration(row.original.startDate, row.original.actualEndDate),
      },
      {
        id: 'podlReport',
        header: 'PoDL Report',
        cell: () => (
          <Link href="/compliance/podl" className="text-sm text-brand-primary hover:underline">
            View Report
          </Link>
        ),
      },
    ],
    []
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Completed Projects" />
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading completed projects..." />
        </div>
      </div>
    )
  }

  if (error || !projects) {
    return (
      <div className="p-6">
        <PageHeader title="Completed Projects" />
        <p className="text-sm text-status-urgent mt-4">Failed to load completed projects.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Completed Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''} completed`}
      />
      <div className="mt-6">
        <DataTable columns={columns} data={projects} />
      </div>
    </div>
  )
}
