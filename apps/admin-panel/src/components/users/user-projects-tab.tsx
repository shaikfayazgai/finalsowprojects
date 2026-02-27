'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable, Badge, Spinner, Card, CardContent } from '@glimmora/ui'
import type { UserProject } from '@/lib/msw/factories/user'

interface UserProjectsTabProps {
  userId: string
}

const statusVariant: Record<UserProject['status'], 'done' | 'inprogress' | 'normal'> = {
  active: 'inprogress',
  completed: 'done',
  paused: 'normal',
}

const statusLabel: Record<UserProject['status'], string> = {
  active: 'Active',
  completed: 'Completed',
  paused: 'Paused',
}

export function UserProjectsTab({ userId }: UserProjectsTabProps) {
  const { data: projects, isLoading } = useQuery<UserProject[]>({
    queryKey: ['admin-user-projects', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/projects`)
      if (!res.ok) throw new Error('Failed to fetch user projects')
      return res.json()
    },
  })

  const columns = useMemo<ColumnDef<UserProject, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Project Name',
        cell: ({ row }) => (
          <Link
            href={`/projects/${row.original.id}`}
            className="font-medium text-text-heading hover:text-brand-primary transition-colors"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <span className="text-text-body">{row.original.role}</span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge status={statusVariant[row.original.status]}>
            {statusLabel[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: 'joinedAt',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="text-text-caption">
            {format(new Date(row.original.joinedAt), 'MMM d, yyyy')}
          </span>
        ),
      },
      {
        id: 'tasksCompleted',
        header: 'Tasks Completed',
        cell: ({ row }) => (
          <span className="text-text-body">
            {row.original.tasksCompleted} / {row.original.totalTasks}
          </span>
        ),
      },
    ],
    []
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Loading projects..." />
      </div>
    )
  }

  if (!projects || projects.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-text-caption text-sm font-body">
          This user has not joined any projects yet.
        </CardContent>
      </Card>
    )
  }

  return <DataTable columns={columns} data={projects} pageSize={10} />
}
