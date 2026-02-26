'use client'
import { TaskDiscoveryList } from '@/components/tasks'
import { PageHeader } from '@glimmora/ui'
import { useTranslations } from 'next-intl'

export default function TasksPage() {
  const t = useTranslations('tasks')
  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t('title')} />
      <TaskDiscoveryList />
    </div>
  )
}
