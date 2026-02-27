'use client'
import { PageHeader } from '@glimmora/ui'
import { ESGExportForm } from '@/components/compliance'

export default function ESGCompliancePage() {
  return (
    <div className="p-6">
      <PageHeader
        title="ESG Compliance Reports"
        subtitle="Generate GRI-aligned ESG compliance reports for your organization"
      />
      <div className="mt-6">
        <ESGExportForm />
      </div>
    </div>
  )
}
