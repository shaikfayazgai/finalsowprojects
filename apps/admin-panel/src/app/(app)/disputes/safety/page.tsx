'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, Spinner } from '@glimmora/ui'
import { ArrowLeft } from 'lucide-react'
import type { SafetyCase } from '@glimmora/types'
import { SafetyCaseList } from '@/components/disputes'

export default function SafetyCasesPage() {
  const { data: cases, isLoading, error } = useQuery<SafetyCase[]>({
    queryKey: ['safety-cases'],
    queryFn: async () => {
      const res = await fetch('/api/admin/disputes/safety')
      if (!res.ok) throw new Error('Failed to fetch safety cases')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Safety Case Protocol" />
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading safety cases..." />
        </div>
      </div>
    )
  }

  if (error || !cases) {
    return (
      <div className="p-6">
        <PageHeader title="Safety Case Protocol" />
        <div className="p-4 text-status-urgent text-sm">
          Failed to load safety cases. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Safety Case Protocol"
        breadcrumb={
          <Link
            href="/disputes"
            className="inline-flex items-center gap-1 text-text-caption hover:text-brand-primary transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Disputes
          </Link>
        }
        subtitle="Safety cases represent the highest severity incidents requiring full privacy protection and evidence preservation."
      />

      <SafetyCaseList cases={cases} />
    </div>
  )
}
