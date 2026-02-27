'use client'
import { useMemo, useState } from 'react'
import { DataTable, Button } from '@glimmora/ui'
import type { ColumnDef } from '@tanstack/react-table'
import type { PaymentRecord } from '@glimmora/types'
import { OTPConfirmationDialog } from '@/components/shared'

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
}

interface PendingApprovalsTableProps {
  payments: PaymentRecord[]
  onRelease?: (paymentId: string) => void
}

export function PendingApprovalsTable({ payments, onRelease }: PendingApprovalsTableProps) {
  const [otpOpen, setOtpOpen] = useState(false)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null)

  const pendingPayments = payments.filter((p) => p.status === 'pending')

  function handleReleaseClick(paymentId: string) {
    setSelectedPaymentId(paymentId)
    setOtpOpen(true)
  }

  async function handleConfirmRelease(otp: string) {
    if (!selectedPaymentId) return
    const res = await fetch(`/api/enterprise/payments/${selectedPaymentId}/release`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp }),
    })
    if (!res.ok) throw new Error('Release failed')
    onRelease?.(selectedPaymentId)
  }

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
        accessorKey: 'evidencePackId',
        header: 'Evidence Pack',
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.evidencePackId}</span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            size="sm"
            onClick={() => handleReleaseClick(row.original.id)}
          >
            Release
          </Button>
        ),
      },
    ],
    []
  )

  return (
    <>
      <DataTable columns={columns} data={pendingPayments} />
      <OTPConfirmationDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        title="Confirm Payment Release"
        description="Enter the 6-digit OTP sent to your registered email to authorize this payment release."
        onConfirm={handleConfirmRelease}
      />
    </>
  )
}
