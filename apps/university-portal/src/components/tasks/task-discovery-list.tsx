'use client'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge, Tag, Button } from '@glimmora/ui'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { Task, APIResponse } from '@glimmora/types'

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

export function TaskDiscoveryList() {
  const [tab, setTab] = useState('available')
  const t = useTranslations('tasks')

  const { data: availableData, isLoading: isLoadingAvailable } = useQuery<APIResponse<Task[]>>({
    queryKey: ['tasks', 'discover'],
    queryFn: () => fetch('/api/tasks/discover').then((r) => r.json()),
    enabled: tab === 'available',
  })

  const { data: myData, isLoading: isLoadingMy } = useQuery<APIResponse<Task[]>>({
    queryKey: ['tasks', 'my'],
    queryFn: () => fetch('/api/tasks').then((r) => r.json()),
    enabled: tab === 'my' || tab === 'completed',
  })

  const availableTasks = availableData?.data ?? []
  const myTasks = (myData?.data ?? []).filter((t) =>
    tab === 'completed'
      ? t.status === 'completed' || t.status === 'approved'
      : t.status !== 'completed' && t.status !== 'approved'
  )
  const tasks = tab === 'available' ? availableTasks : myTasks
  const isLoading = tab === 'available' ? isLoadingAvailable : isLoadingMy

  async function handleAccept(taskId: string) {
    await fetch(`/api/tasks/${taskId}/accept`, { method: 'POST' })
  }

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="available">{t('available')}</TabsTrigger>
        <TabsTrigger value="my">{t('myTasks')}</TabsTrigger>
        <TabsTrigger value="completed">{t('completed')}</TabsTrigger>
      </TabsList>

      <TabsContent value={tab}>
        <div className="space-y-3 mt-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-bg-card rounded-card shadow-card p-4 hover:shadow-card-hover transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <Link href={`/tasks/${task.id}`} className="flex-1 min-w-0">
                  <h3 className="text-sm font-body font-medium text-text-heading truncate">
                    {task.title}
                  </h3>
                  <p className="text-xs font-body text-text-caption mt-1 line-clamp-2">
                    {task.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {task.skillRequirements.map((skill) => (
                      <Tag key={skill} variant="skill">
                        {skill}
                      </Tag>
                    ))}
                  </div>
                  <span className="text-xs font-body text-text-caption mt-2 inline-block">
                    {t('estimatedHours')}: {task.estimatedHours}h
                  </span>
                </Link>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Badge status={STATUS_BADGE_MAP[task.status] ?? 'normal'}>
                    {task.status}
                  </Badge>
                  {tab === 'available' && task.status === 'open' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAccept(task.id)}
                    >
                      {t('acceptTask')}
                    </Button>
                  )}
                  {tab !== 'available' && (
                    <Link href={`/tasks/${task.id}`}>
                      <Button variant="secondary" size="sm">
                        {t('viewTask')}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && !isLoading && (
            <p className="text-center text-sm font-body text-text-caption py-8">
              {t('noTasks')}
            </p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
