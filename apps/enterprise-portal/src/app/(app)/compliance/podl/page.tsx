'use client'
import { PageHeader } from '@glimmora/ui'
import { PoDLExportForm } from '@/components/compliance'

export default function PoDLCompliancePage() {
  return (
    <div className="p-6">
      <PageHeader
        title="PoDL Audit Reports"
        subtitle="Generate Proof-of-Delivery audit reports for completed projects"
      />
      <div className="mt-6">
        <PoDLExportForm />
      </div>
    </div>
  )
}
