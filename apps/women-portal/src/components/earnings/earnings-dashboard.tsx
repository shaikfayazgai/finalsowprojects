'use client'
import { Badge, PageHeader } from '@glimmora/ui'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import type { EarningsSummary, EarningStatus } from '@glimmora/types'

const statusBadge: Record<EarningStatus, 'done' | 'atrisk' | 'normal'> = {
  released: 'done',
  pending: 'atrisk',
  withdrawn: 'normal',
}

export function EarningsDashboard() {
  const t = useTranslations('earnings')
  const { data } = useQuery<{ data: EarningsSummary }>({
    queryKey: ['earnings'],
    queryFn: () => fetch('/api/earnings').then(r => r.json()),
  })

  const summary = data?.data
  if (!summary) return null

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t('title')} />

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-bg-card rounded-card shadow-card p-6">
          <p className="text-xs font-body text-text-caption uppercase tracking-wider">{t('pending')}</p>
          <p className="text-2xl font-display font-semibold text-status-warning mt-1">${summary.pendingAmount}</p>
        </div>
        <div className="bg-bg-card rounded-card shadow-card p-6">
          <p className="text-xs font-body text-text-caption uppercase tracking-wider">{t('released')}</p>
          <p className="text-2xl font-display font-semibold text-status-success mt-1">${summary.releasedAmount}</p>
        </div>
        <div className="bg-bg-card rounded-card shadow-card p-6">
          <p className="text-xs font-body text-text-caption uppercase tracking-wider">{t('totalEarned')}</p>
          <p className="text-2xl font-display font-semibold text-text-heading mt-1">${summary.totalEarned}</p>
        </div>
      </div>

      {/* Withdrawal history table */}
      <div className="bg-bg-card rounded-card shadow-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-display text-lg font-semibold text-text-heading">{t('paymentHistory')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border bg-bg-dashboard">
                <th className="text-start px-4 py-3 text-xs font-medium text-text-caption uppercase tracking-wider">Date</th>
                <th className="text-start px-4 py-3 text-xs font-medium text-text-caption uppercase tracking-wider">Task</th>
                <th className="text-start px-4 py-3 text-xs font-medium text-text-caption uppercase tracking-wider">Amount</th>
                <th className="text-start px-4 py-3 text-xs font-medium text-text-caption uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.earningsHistory.map((earning) => (
                <tr key={earning.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-body">{new Date(earning.earnedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-text-body truncate max-w-[200px]">{earning.taskTitle}</td>
                  <td className="px-4 py-3 text-text-heading font-medium">${earning.amount}</td>
                  <td className="px-4 py-3">
                    <Badge status={statusBadge[earning.status]}>
                      {earning.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
