'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, Badge, Button } from '@glimmora/ui'
import type { PaymentRecord } from '@glimmora/types'
import { OTPConfirmationDialog } from '@/components/shared'

function statusToBadge(status: PaymentRecord['status']): { label: string; variant: 'done' | 'normal' | 'atrisk' | 'inprogress' } {
  switch (status) {
    case 'released':
      return { label: 'Released', variant: 'done' }
    case 'pending':
      return { label: 'Pending', variant: 'normal' }
    case 'held':
      return { label: 'Held', variant: 'inprogress' }
    case 'disputed':
      return { label: 'Disputed', variant: 'atrisk' }
  }
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

interface PaymentReleaseCardProps {
  payment: PaymentRecord
  onRelease: () => void
}

export function PaymentReleaseCard({ payment, onRelease }: PaymentReleaseCardProps) {
  const queryClient = useQueryClient()
  const [otpOpen, setOtpOpen] = useState(false)

  const releaseMutation = useMutation({
    mutationFn: async (otp: string) => {
      const res = await fetch(`/api/enterprise/payments/${payment.id}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      })
      if (!res.ok) throw new Error('Failed to release payment')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      onRelease()
    },
  })

  const { label, variant } = statusToBadge(payment.status)

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-body font-medium text-text-heading">
              Milestone: {payment.milestoneId}
            </p>
            <p className="text-xs font-body text-text-caption mt-0.5">
              Evidence Pack: {payment.evidencePackId}
            </p>
          </div>
          <Badge status={variant}>{label}</Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <p className="text-xs font-body text-text-caption">Amount</p>
            <p className="text-sm font-body font-medium text-text-heading">
              {formatCurrency(payment.amount, payment.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-body text-text-caption">Platform Fee</p>
            <p className="text-sm font-body text-text-body">
              {formatCurrency(payment.platformFee, payment.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-body text-text-caption">Net to Contributor</p>
            <p className="text-sm font-body font-medium text-status-success">
              {formatCurrency(payment.netToContributor, payment.currency)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-body text-text-caption mb-3">
          <span>Mode: {payment.releaseMode.replace(/-/g, ' ')}</span>
          {payment.releasedAt && (
            <span>Released: {new Date(payment.releasedAt).toLocaleDateString()}</span>
          )}
        </div>

        {payment.status === 'pending' && (
          <Button onClick={() => setOtpOpen(true)} className="w-full">
            Release Payment
          </Button>
        )}

        {payment.holdReason && (
          <p className="text-xs font-body text-status-warning mt-2">
            Hold reason: {payment.holdReason}
          </p>
        )}

        <OTPConfirmationDialog
          open={otpOpen}
          onOpenChange={setOtpOpen}
          title="Confirm Payment Release"
          description={`Release ${formatCurrency(payment.amount, payment.currency)} for milestone ${payment.milestoneId}? Enter the 6-digit code sent to your email.`}
          onConfirm={async (otp) => {
            await releaseMutation.mutateAsync(otp)
          }}
        />
      </CardContent>
    </Card>
  )
}
