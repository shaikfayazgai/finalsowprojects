'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable, Badge, Card, CardContent, CardHeader, CardTitle, Spinner } from '@glimmora/ui'
import type { UserPayment } from '@/lib/msw/factories/user'

interface UserPaymentsTabProps {
  userId: string
}

const statusVariant: Record<UserPayment['status'], 'done' | 'normal' | 'atrisk'> = {
  released: 'done',
  pending: 'normal',
  held: 'atrisk',
}

const statusLabel: Record<UserPayment['status'], string> = {
  released: 'Released',
  pending: 'Pending',
  held: 'Held',
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function UserPaymentsTab({ userId }: UserPaymentsTabProps) {
  const { data: payments, isLoading } = useQuery<UserPayment[]>({
    queryKey: ['admin-user-payments', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}/payments`)
      if (!res.ok) throw new Error('Failed to fetch user payments')
      return res.json()
    },
  })

  const columns = useMemo<ColumnDef<UserPayment, unknown>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'Payment ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-text-caption">{row.original.id}</span>
        ),
      },
      {
        accessorKey: 'projectName',
        header: 'Project',
        cell: ({ row }) => (
          <span className="text-text-body">{row.original.projectName}</span>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="font-medium text-text-heading">
            {formatCurrency(row.original.amount, row.original.currency)}
          </span>
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
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => (
          <span className="text-text-caption">
            {format(new Date(row.original.date), 'MMM d, yyyy')}
          </span>
        ),
      },
      {
        accessorKey: 'transactionId',
        header: 'Transaction ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-text-caption">
            {row.original.transactionId ?? '--'}
          </span>
        ),
      },
    ],
    []
  )

  const summaryStats = useMemo(() => {
    if (!payments) return { total: 0, pending: 0, released: 0 }
    return {
      total: payments.reduce((sum, p) => sum + p.amount, 0),
      pending: payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
      released: payments.filter((p) => p.status === 'released').reduce((sum, p) => sum + p.amount, 0),
    }
  }, [payments])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Loading payments..." />
      </div>
    )
  }

  if (!payments || payments.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-text-caption text-sm font-body">
          No payment records found for this user.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-body uppercase tracking-wider text-text-caption">
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display font-semibold text-text-heading">
              {formatCurrency(summaryStats.total, 'USD')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-body uppercase tracking-wider text-text-caption">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display font-semibold text-status-inprogress">
              {formatCurrency(summaryStats.pending, 'USD')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-body uppercase tracking-wider text-text-caption">
              Released
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-display font-semibold text-status-success">
              {formatCurrency(summaryStats.released, 'USD')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment table */}
      <DataTable columns={columns} data={payments} pageSize={10} />
    </div>
  )
}
