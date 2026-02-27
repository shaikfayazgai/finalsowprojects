'use client'

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@glimmora/ui'
import { ChevronRight } from 'lucide-react'
import type { PlatformStats } from '@glimmora/types'

interface PendingActionsCardProps {
  stats: PlatformStats
}

interface ActionRow {
  label: string
  count: number
  href: string
  badgeStatus: 'urgent' | 'atrisk' | 'normal'
}

export function PendingActionsCard({ stats }: PendingActionsCardProps) {
  const actions: ActionRow[] = [
    {
      label: 'Users awaiting verification',
      count: stats.verificationQueueCount,
      href: '/users/verification-queue',
      badgeStatus: stats.verificationQueueCount > 0 ? 'atrisk' : 'normal',
    },
    {
      label: 'Disputes requiring attention',
      count: stats.openDisputes,
      href: '/disputes',
      badgeStatus: stats.openDisputes > 0 ? 'urgent' : 'normal',
    },
    {
      label: 'Escalations pending',
      count: stats.pendingEscalations,
      href: '/disputes?severity=critical',
      badgeStatus: stats.pendingEscalations > 0 ? 'urgent' : 'normal',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-hover"
          >
            <div className="flex items-center gap-3">
              <Badge status={action.badgeStatus}>{action.count}</Badge>
              <span className="text-sm font-body text-text-body">{action.label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-text-caption" />
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}
