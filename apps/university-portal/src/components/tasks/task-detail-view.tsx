'use client'
import { Badge, Tag, Button } from '@glimmora/ui'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { Task } from '@glimmora/types'

const STATUS_BADGE_MAP: Record<
  string,
  'urgent' | 'normal' | 'inprogress' | 'done' | 'atrisk'
> = {
  open: 'normal',
  assigned: 'normal',
  'in-progress': 'inprogress',
  'evidence-submitted': 'inprogress',
  'under-review': 'atrisk',
  'rework-required': 'urgent',
  approved: 'done',
  completed: 'done',
  rejected: 'urgent',
}

interface TaskDetailViewProps {
  taskId: string
}

export function TaskDetailView({ taskId }: TaskDetailViewProps) {
  const t = useTranslations('taskDetail')

  const { data } = useQuery<{ data: Task }>({
    queryKey: ['task', taskId],
    queryFn: () => fetch(`/api/tasks/${taskId}`).then((r) => r.json()),
  })

  const task = data?.data
  if (!task) return null

  const canSubmit =
    task.status === 'assigned' ||
    task.status === 'in-progress' ||
    task.status === 'open'

  async function handleAccept() {
    await fetch(`/api/tasks/${taskId}/accept`, { method: 'POST' })
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">
            {task.title}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge status={STATUS_BADGE_MAP[task.status] ?? 'normal'}>
              {task.status}
            </Badge>
            <span className="text-sm font-body text-text-caption">{task.type}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {task.status === 'open' && (
            <Button variant="primary" onClick={handleAccept}>
              {t('acceptTask')}
            </Button>
          )}
          {canSubmit && task.status !== 'open' && (
            <Link href={`/tasks/${taskId}/submit`}>
              <Button variant="primary">{t('submitEvidence')}</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Task Brief */}
      <div className="bg-bg-card rounded-card shadow-card p-6">
        <h2 className="font-display text-lg font-semibold text-text-heading mb-3">
          {t('brief')}
        </h2>
        <p className="text-sm font-body text-text-body whitespace-pre-wrap">
          {task.description}
        </p>
      </div>

      {/* APG Guidance */}
      {task.apgGuidance && (
        <div className="bg-brand-teal/5 border border-brand-teal/20 rounded-card p-6">
          <h2 className="font-display text-lg font-semibold text-text-heading mb-3 flex items-center gap-2">
            <svg
              className="h-5 w-5 text-brand-teal"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            {t('apgGuidance')}
          </h2>
          <p className="text-sm font-body text-text-body">{task.apgGuidance}</p>
        </div>
      )}

      {/* Meta info */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-bg-card rounded-card p-4">
          <p className="text-xs font-body text-text-caption uppercase tracking-wider">
            {t('skillsRequired')}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {task.skillRequirements.map((skill) => (
              <Tag key={skill} variant="skill">
                {skill}
              </Tag>
            ))}
          </div>
        </div>
        <div className="bg-bg-card rounded-card p-4">
          <p className="text-xs font-body text-text-caption uppercase tracking-wider">
            {t('estimatedHours')}
          </p>
          <p className="text-lg font-display font-semibold text-text-heading mt-1">
            {task.estimatedHours}h
          </p>
        </div>
        <div className="bg-bg-card rounded-card p-4">
          <p className="text-xs font-body text-text-caption uppercase tracking-wider">
            {t('dueDate')}
          </p>
          <p className="text-lg font-display font-semibold text-text-heading mt-1">
            {new Date(task.dueDate).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}
