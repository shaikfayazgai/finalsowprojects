'use client'
import { GradientCard, KPIStatCard, APGFeed } from '@glimmora/ui'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import type { APGActivity } from '@glimmora/types'

const TYPE_MAP: Record<string, 'task_assigned' | 'review_requested' | 'milestone_completed' | 'risk_detected' | 'team_formed' | 'payment_triggered'> = {
  'task-assigned': 'task_assigned',
  'evidence-reviewed': 'review_requested',
  'milestone-updated': 'milestone_completed',
  'team-formed': 'team_formed',
  'guidance-issued': 'risk_detected',
  'payment-triggered': 'payment_triggered',
}

export function StudentDashboard() {
  const t = useTranslations('dashboard')

  const { data: apgData } = useQuery<{ data: APGActivity[] }>({
    queryKey: ['apg-activities'],
    queryFn: () => fetch('/api/apg/activities').then((r) => r.json()),
  })

  const activities = apgData?.data ?? []
  const actions = activities.map((a) => ({
    id: a.id,
    type: TYPE_MAP[a.type] ?? 'task_assigned',
    title: a.message,
    description: '',
    timestamp: new Date(a.timestamp).toLocaleString(),
  }))

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GradientCard gradient="primary" className="p-6">
          <p className="text-[36px] font-display font-semibold text-white leading-tight">3</p>
          <p className="text-sm font-body text-white/80 mt-1">{t('activeTasks')}</p>
        </GradientCard>
        <GradientCard gradient="nature" className="p-6">
          <p className="text-[36px] font-display font-semibold text-white leading-tight">5</p>
          <p className="text-sm font-body text-white/80 mt-1">{t('podlCredentials')}</p>
        </GradientCard>
        <KPIStatCard label={t('totalEarned')} value="$1,240" />
      </div>

      {/* Quick Actions + APG Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="space-y-4">
          <Link
            href="/tasks"
            className="block bg-bg-card rounded-card shadow-card p-6 hover:shadow-card-hover transition-shadow"
          >
            <h3 className="font-display text-lg font-semibold text-text-heading">
              {t('discoverTasks')}
            </h3>
            <p className="text-sm font-body text-text-caption mt-1">
              {t('discoverDescription')}
            </p>
          </Link>
          <Link
            href="/credentials"
            className="block bg-bg-card rounded-card shadow-card p-6 hover:shadow-card-hover transition-shadow"
          >
            <h3 className="font-display text-lg font-semibold text-text-heading">
              {t('viewCredentials')}
            </h3>
            <p className="text-sm font-body text-text-caption mt-1">
              {t('credentialsDescription')}
            </p>
          </Link>
        </div>

        {/* APG Activity Feed */}
        <div className="bg-bg-card rounded-card shadow-card p-6">
          <h2 className="font-display text-lg font-semibold text-text-heading mb-4">
            {t('apgActivity')}
          </h2>
          <APGFeed actions={actions} maxVisible={5} />
        </div>
      </div>
    </div>
  )
}
