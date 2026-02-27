'use client'
import { useMemo } from 'react'
import { DataTable, Badge } from '@glimmora/ui'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaymentRecord } from '@glimmora/types'

const statusVariant: Record<PaymentRecord['status'], 'done' | 'normal' | 'atrisk'> = {
  released: 'done',
  pending: 'normal',
  held: 'atrisk',
  disputed: 'atrisk',
}

const statusLabel: Record<PaymentRecord['status'], string> = {
  released: 'Released',
  pending: 'Pending',
  held: 'Held',
  disputed: 'Disputed',
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

interface PaymentHistoryTableProps {
  payments: PaymentRecord[]
}

export function PaymentHistoryTable({ payments }: PaymentHistoryTableProps) {
  const columns = useMemo<ColumnDef<PaymentRecord>[]>(
    () => [
      {
        accessorKey: 'projectId',
        header: 'Project',
      },
      {
        accessorKey: 'milestoneId',
        header: 'Milestone',
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => formatCurrency(row.original.amount, row.original.currency),
      },
      {
        accessorKey: 'platformFee',
        header: 'Platform Fee',
        cell: ({ row }) => formatCurrency(row.original.platformFee, row.original.currency),
      },
      {
        accessorKey: 'netToContributor',
        header: 'Net Amount',
        cell: ({ row }) => formatCurrency(row.original.netToContributor, row.original.currency),
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
        accessorKey: 'releaseMode',
        header: 'Release Mode',
        cell: ({ row }) => {
          const modeLabels: Record<string, string> = {
            'manual': 'Manual',
            'auto-on-approval': 'Auto',
            'apg-silent': 'APG Silent',
          }
          return modeLabels[row.original.releaseMode] ?? row.original.releaseMode
        },
      },
      {
        accessorKey: 'releasedAt',
        header: 'Released Date',
        cell: ({ row }) =>
          row.original.releasedAt
            ? new Date(row.original.releasedAt).toLocaleDateString()
            : '--',
      },
      {
        accessorKey: 'transactionId',
        header: 'Transaction ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.transactionId ?? '--'}</span>
        ),
      },
    ],
    []
  )

  return <DataTable columns={columns} data={payments} />
}
