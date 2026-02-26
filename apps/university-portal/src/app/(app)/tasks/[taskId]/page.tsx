'use client'
import { use } from 'react'
import { TaskDetailView } from '@/components/tasks'
import { PageHeader } from '@glimmora/ui'
import Link from 'next/link'

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>
}) {
  const { taskId } = use(params)
  return (
    <div className="p-6">
      <PageHeader
        title="Task Detail"
        breadcrumb={
          <Link href="/tasks" className="hover:text-brand-primary transition-colors">
            Tasks
          </Link>
        }
      />
      <TaskDetailView taskId={taskId} />
    </div>
  )
}
