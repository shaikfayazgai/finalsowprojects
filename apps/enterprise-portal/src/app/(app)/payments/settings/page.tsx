'use client'
import { PageHeader } from '@glimmora/ui'
import { PaymentSettingsForm } from '@/components/payments'

export default function PaymentSettingsPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Payment Settings"
        subtitle="Configure how payments are released for your projects"
      />
      <div className="mt-6">
        <PaymentSettingsForm />
      </div>
    </div>
  )
}
