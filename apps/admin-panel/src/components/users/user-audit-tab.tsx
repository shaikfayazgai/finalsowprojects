'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable, Spinner, Card, CardContent } from '@glimmora/ui'
import type { UserAuditEntry } from '@/lib/msw/factories/user'

interface UserAuditTabProps {
  userId: string
}

export function UserAuditTab({ userId }: UserAuditTabProps) {
  const { data: auditEntries, isLoading } = useQuery<UserAuditEntry[]>({
    queryKey: ['admin-user-audit', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/audit`)
      if (!res.ok) throw new Error('Failed to fetch audit log')
      return res.json()
    },
  })

  const columns = useMemo<ColumnDef<UserAuditEntry, unknown>[]>(
    () => [
      {
        accessorKey: 'timestamp',
        header: 'Timestamp',
        cell: ({ row }) => (
          <span className="text-xs font-mono text-text-caption">
            {format(new Date(row.original.timestamp), 'yyyy-MM-dd HH:mm')}
          </span>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-text-heading font-body">
            {row.original.action}
          </span>
        ),
      },
      {
        accessorKey: 'performedBy',
        header: 'Performed By',
        cell: ({ row }) => (
          <span className="text-text-body">{row.original.performedBy}</span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="text-sm text-text-caption max-w-[300px] truncate block">
            {row.original.reason}
          </span>
        ),
      },
    ],
    []
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Loading audit log..." />
      </div>
    )
  }

  if (!auditEntries || auditEntries.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-text-caption text-sm font-body">
          No audit entries found for this user.
        </CardContent>
      </Card>
    )
  }

  return <DataTable columns={columns} data={auditEntries} pageSize={10} />
}
