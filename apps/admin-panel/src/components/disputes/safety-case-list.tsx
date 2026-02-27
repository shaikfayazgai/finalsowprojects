'use client'

import Link from 'next/link'
import { Card, CardContent, Badge } from '@glimmora/ui'
import { Shield, CheckCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import type { SafetyCase, DisputeStatus } from '@glimmora/types'

const statusMap: Record<DisputeStatus, 'normal' | 'inprogress' | 'atrisk' | 'done' | 'urgent'> = {
  open: 'normal',
  under_review: 'inprogress',
  awaiting_evidence: 'atrisk',
  resolved: 'done',
  escalated: 'urgent',
}

interface SafetyCaseListProps {
  cases: SafetyCase[]
}

export function SafetyCaseList({ cases }: SafetyCaseListProps) {
  if (cases.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm font-body text-text-caption">No active safety cases.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {cases.map((sc) => (
        <Link key={sc.id} href={`/disputes/safety/${sc.id}`}>
          <Card className="hover:border-brand-primary/30 transition-colors cursor-pointer">
            {/* Subtle urgent header */}
            <div className="bg-status-urgent/5 px-6 py-4 rounded-t-card">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge status="urgent">
                  <Shield className="h-3 w-3 mr-1" />
                  Privacy Restricted
                </Badge>
                <Badge status="urgent">critical</Badge>
                <Badge status={statusMap[sc.status]}>
                  {sc.status.replace(/_/g, ' ')}
                </Badge>
                {sc.evidencePreserved && (
                  <div className="flex items-center gap-1 text-xs font-body text-status-success ml-auto">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Evidence Preserved
                  </div>
                )}
              </div>
            </div>

            <CardContent className="p-6">
              <h3 className="text-base font-body font-medium text-text-heading mb-1">
                {sc.title}
              </h3>
              <p className="text-sm font-body text-text-caption line-clamp-2 mb-3">
                {sc.description}
              </p>
              <div className="flex items-center gap-4 text-xs font-body text-text-caption">
                <span>{sc.projectName}</span>
                <span>
                  Filed {format(new Date(sc.createdAt), 'MMM d, yyyy')}
                  <span className="ml-1 text-text-disabled">
                    ({formatDistanceToNow(new Date(sc.createdAt), { addSuffix: true })})
                  </span>
                </span>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
