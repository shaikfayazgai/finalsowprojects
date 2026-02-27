'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import type { VerificationQueueItem } from '@glimmora/types'
import { PageHeader, Spinner } from '@glimmora/ui'
import { ArrowLeft } from 'lucide-react'
import { VerificationQueueTable } from '@/components/users'

export default function VerificationQueuePage() {
  const { data, isLoading, error } = useQuery<VerificationQueueItem[]>({
    queryKey: ['admin-verification-queue'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users/verification-queue')
      if (!res.ok) throw new Error('Failed to fetch verification queue')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Verification Queue" />
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading verification queue..." />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <PageHeader title="Verification Queue" />
        <div className="p-4 text-status-urgent text-sm">
          Failed to load verification queue. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Verification Queue"
        subtitle={`${data.length} pending verifications`}
        breadcrumb={
          <Link href="/users" className="inline-flex items-center gap-1 hover:text-brand-primary transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Users
          </Link>
        }
      />

      <VerificationQueueTable items={data} />
    </div>
  )
}
