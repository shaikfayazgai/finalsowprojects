'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader, Spinner, Caption } from '@glimmora/ui'
import { RefreshCw } from 'lucide-react'
import { Button } from '@glimmora/ui'
import { formatDistanceToNow } from 'date-fns'
import type { PlatformStats } from '@glimmora/types'
import { StatsGrid, PendingActionsCard, SystemAlertFeed } from '@/components/dashboard'

export default function DashboardPage() {
  const { data, isLoading, error, dataUpdatedAt, refetch, isFetching } = useQuery<PlatformStats>({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/admin/dashboard/stats')
      if (!res.ok) throw new Error('Failed to fetch dashboard stats')
      return res.json()
    },
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Platform Overview" />
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading dashboard..." />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <PageHeader title="Platform Overview" />
        <div className="p-4 text-status-urgent text-sm">
          Failed to load dashboard. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Platform Overview"
        actions={
          <div className="flex items-center gap-3">
            {dataUpdatedAt > 0 && (
              <Caption className="text-warm-brown">
                Updated {formatDistanceToNow(new Date(dataUpdatedAt), { addSuffix: true })}
              </Caption>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {/* 6 KPI Cards */}
      <StatsGrid stats={data} />

      {/* Two-column: Pending Actions + System Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <PendingActionsCard stats={data} />
        <SystemAlertFeed />
      </div>
    </div>
  )
}
