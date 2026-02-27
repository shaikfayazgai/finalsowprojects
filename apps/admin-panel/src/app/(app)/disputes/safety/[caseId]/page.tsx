'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { PageHeader, Spinner, Badge } from '@glimmora/ui'
import { ArrowLeft, Shield, CheckCircle } from 'lucide-react'
import type { SafetyCase } from '@glimmora/types'
import { SafetyCaseView } from '@/components/disputes'

type SafetyCaseDetail = SafetyCase & {
  assignedAdminName?: string
  slaDeadline: string
  evidencePreservedAt: string
}

export default function SafetyCaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>
}) {
  const { caseId } = use(params)

  const { data: safetyCase, isLoading, error } = useQuery<SafetyCaseDetail>({
    queryKey: ['safety-case-detail', caseId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/disputes/safety/${caseId}`)
      if (!res.ok) throw new Error('Failed to fetch safety case')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Safety Case" />
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading safety case..." />
        </div>
      </div>
    )
  }

  if (error || !safetyCase) {
    return (
      <div className="p-6">
        <PageHeader title="Safety Case" />
        <div className="p-4 text-status-urgent text-sm">
          Failed to load safety case. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Enhanced header with subtle urgent background */}
      <div className="bg-status-urgent/5 -mx-6 -mt-6 px-6 pt-6 pb-4 mb-6 rounded-t-card">
        <PageHeader
          title={safetyCase.title}
          breadcrumb={
            <Link
              href="/disputes/safety"
              className="inline-flex items-center gap-1 text-text-caption hover:text-brand-primary transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Safety Cases
            </Link>
          }
          actions={
            <div className="flex items-center gap-2">
              <Badge status="urgent">
                <Shield className="h-3 w-3 mr-1" />
                Privacy Restricted
              </Badge>
              <Badge status="done">
                <CheckCircle className="h-3 w-3 mr-1" />
                Evidence Preserved
              </Badge>
            </div>
          }
        />

        {/* Safety Case label */}
        <div className="flex items-center gap-2 mt-2">
          <Shield className="h-4 w-4 text-status-urgent" />
          <span className="text-sm font-body font-medium text-status-urgent">Safety Case</span>
        </div>
      </div>

      <SafetyCaseView safetyCase={safetyCase} />
    </div>
  )
}
