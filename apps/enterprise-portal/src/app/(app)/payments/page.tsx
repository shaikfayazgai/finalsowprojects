'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, Tabs, TabsList, TabsTrigger, TabsContent, Button, Spinner } from '@glimmora/ui'
import type { PaymentRecord } from '@glimmora/types'
import { PaymentHistoryTable, PendingApprovalsTable } from '@/components/payments'

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState('pending')

  const { data: payments, isLoading, error } = useQuery<PaymentRecord[]>({
    queryKey: ['payments-history'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise/payments/history')
      if (!res.ok) throw new Error('Failed to fetch payments')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Payments" />
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading payments..." />
        </div>
      </div>
    )
  }

  if (error || !payments) {
    return (
      <div className="p-6">
        <PageHeader title="Payments" />
        <p className="text-sm text-status-urgent mt-4">Failed to load payments.</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Payments" subtitle={`${payments.length} total payment records`} />
        <Link href="/payments/settings">
          <Button variant="secondary">Payment Settings</Button>
        </Link>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({payments.filter((p) => p.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingApprovalsTable payments={payments} />
        </TabsContent>

        <TabsContent value="history">
          <PaymentHistoryTable payments={payments} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
