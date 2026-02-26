'use client'
import { StudentDashboard } from '@/components/dashboard'
import { PageHeader } from '@glimmora/ui'
import { useTranslations } from 'next-intl'

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t('title')} />
      <StudentDashboard />
    </div>
  )
}
