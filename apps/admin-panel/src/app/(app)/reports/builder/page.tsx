'use client'

import { useSearchParams } from 'next/navigation'
import { PageHeader } from '@glimmora/ui'
import { ReportBuilderForm } from '@/components/reports'

export default function ReportBuilderPage() {
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') ?? undefined

  return (
    <div className="p-6">
      <PageHeader
        title="Custom Report Builder"
        subtitle="Configure and generate custom reports with date range filtering and export options"
        breadcrumb={<span>Reports / Builder</span>}
      />
      <ReportBuilderForm initialType={initialType} />
    </div>
  )
}
