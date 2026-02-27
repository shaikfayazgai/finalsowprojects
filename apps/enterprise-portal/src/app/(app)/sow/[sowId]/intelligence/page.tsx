'use client'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { PageHeader, Spinner } from '@glimmora/ui'
import { IntelligenceDisplay } from '@/components/sow'
import type { SOWIntelligence } from '@glimmora/types'

export default function IntelligencePage() {
  const params = useParams<{ sowId: string }>()

  const { data, isLoading, error } = useQuery<SOWIntelligence>({
    queryKey: ['sow-intelligence', params.sowId],
    queryFn: async () => {
      const res = await fetch(`/api/enterprise/sow/${params.sowId}/intelligence`)
      if (!res.ok) throw new Error('Failed to fetch intelligence')
      return res.json()
    },
  })

  return (
    <div className="p-6">
      <PageHeader
        title="APG Intelligence Report"
        subtitle="AI-extracted analysis of your Statement of Work"
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {error && (
        <div className="p-4 text-status-urgent text-sm">
          Failed to load intelligence report. Please try again.
        </div>
      )}

      {data && <IntelligenceDisplay data={data} />}
    </div>
  )
}
