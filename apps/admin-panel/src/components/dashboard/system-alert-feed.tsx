'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent, Body, Caption, EmptyState, Button } from '@glimmora/ui'
import { X } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { SystemAlert, SystemAlertSeverity } from '@glimmora/types'

const SEVERITY_DOT: Record<SystemAlertSeverity, string> = {
  critical: 'bg-status-urgent',
  warning: 'bg-status-warning',
  info: 'bg-brand-teal',
}

export function SystemAlertFeed() {
  const queryClient = useQueryClient()

  const { data: alerts = [], isLoading } = useQuery<SystemAlert[]>({
    queryKey: ['admin-dashboard-alerts'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard/alerts')
      if (!res.ok) throw new Error('Failed to fetch alerts')
      return res.json()
    },
  })

  const dismissMutation = useMutation({
    mutationFn: async (alertId: string) => {
      const res = await fetch(`/api/admin/dashboard/alerts/${alertId}/dismiss`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to dismiss alert')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-alerts'] })
    },
  })

  const activeAlerts = alerts.filter((a) => !a.dismissedAt)

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-4 text-center">
            <Caption className="text-warm-brown">Loading alerts...</Caption>
          </div>
        ) : activeAlerts.length === 0 ? (
          <EmptyState
            title="No active alerts"
            description="All systems operating normally."
          />
        ) : (
          <div className="space-y-1">
            {activeAlerts.map((alert) => {
              const content = (
                <div className="flex items-start gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-hover">
                  <div className="mt-1.5 shrink-0">
                    <div className={`h-2.5 w-2.5 rounded-full ${SEVERITY_DOT[alert.severity]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Body className="font-medium text-sm">{alert.title}</Body>
                    <Caption className="text-warm-brown line-clamp-2">{alert.message}</Caption>
                    <Caption className="mt-1 text-text-caption">
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </Caption>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 mt-0.5"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      dismissMutation.mutate(alert.id)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )

              if (alert.entityHref) {
                return (
                  <Link key={alert.id} href={alert.entityHref}>
                    {content}
                  </Link>
                )
              }

              return <div key={alert.id}>{content}</div>
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
