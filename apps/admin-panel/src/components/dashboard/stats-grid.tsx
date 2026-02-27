'use client'

import { GradientCard } from '@glimmora/ui'
import type { PlatformStats } from '@glimmora/types'

interface StatsGridProps {
  stats: PlatformStats
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <GradientCard gradient="primary">
        <p className="text-sm font-body opacity-90">Active Users</p>
        <p className="text-3xl font-display font-bold mt-1">
          {stats.totalActiveUsers.toLocaleString()}
        </p>
        <p className="text-xs font-body opacity-75 mt-1">total active on platform</p>
      </GradientCard>

      <GradientCard gradient="primary">
        <p className="text-sm font-body opacity-90">Active Projects</p>
        <p className="text-3xl font-display font-bold mt-1">
          {stats.activeProjects}
        </p>
        <p className="text-xs font-body opacity-75 mt-1">currently in progress</p>
      </GradientCard>

      <GradientCard
        style={{ background: 'linear-gradient(135deg, #4A6741 0%, #3A8FA0 100%)' }}
      >
        <p className="text-sm font-body opacity-90">Pending Reviews</p>
        <p className="text-3xl font-display font-bold mt-1">
          {stats.pendingReviews}
        </p>
        <p className="text-xs font-body opacity-75 mt-1">evidence packs awaiting review</p>
      </GradientCard>

      <GradientCard gradient="nature">
        <p className="text-sm font-body opacity-90">Open Disputes</p>
        <p className="text-3xl font-display font-bold mt-1">
          {stats.openDisputes}
        </p>
        <p className="text-xs font-body opacity-75 mt-1">requiring attention</p>
      </GradientCard>

      <GradientCard gradient="primary">
        <p className="text-sm font-body opacity-90">Payments Held</p>
        <p className="text-3xl font-display font-bold mt-1">
          {formatCurrency(stats.paymentsHeld, stats.paymentsHeldCurrency)}
        </p>
        <p className="text-xs font-body opacity-75 mt-1">in escrow</p>
      </GradientCard>

      <GradientCard gradient="nature">
        <p className="text-sm font-body opacity-90">System Health</p>
        <p className="text-3xl font-display font-bold mt-1">
          {stats.systemHealthScore}%
        </p>
        <p className="text-xs font-body opacity-75 mt-1">overall platform score</p>
      </GradientCard>
    </div>
  )
}
