'use client'
import { useEffect, useRef } from 'react'
import { Badge } from '@glimmora/ui'
import { cn } from '@glimmora/ui'
import type { SOWClause } from '@glimmora/types'
import { useEditorStore } from '@/store/editor-store'

const CLAUSE_TYPE_BADGE_STATUS = {
  objective: 'inprogress',
  deliverable: 'done',
  timeline: 'normal',
  budget: 'atrisk',
  compliance: 'urgent',
  general: 'normal',
} as const

const CLAUSE_TYPE_LABELS: Record<SOWClause['type'], string> = {
  objective: 'Objective',
  deliverable: 'Deliverable',
  timeline: 'Timeline',
  budget: 'Budget',
  compliance: 'Compliance',
  general: 'General',
}

interface SOWContextPanelProps {
  clauses: SOWClause[]
}

export function SOWContextPanel({ clauses }: SOWContextPanelProps) {
  const selectedClauseId = useEditorStore((s) => s.selectedClauseId)
  const selectClause = useEditorStore((s) => s.selectClause)
  const selectedRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (selectedClauseId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedClauseId])

  // Group clauses by type
  const grouped = clauses.reduce<Record<string, SOWClause[]>>((acc, clause) => {
    const group = acc[clause.type] ?? []
    group.push(clause)
    acc[clause.type] = group
    return acc
  }, {})

  const typeOrder: SOWClause['type'][] = ['objective', 'deliverable', 'compliance', 'timeline', 'budget', 'general']
  const orderedTypes = typeOrder.filter((t) => grouped[t])

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-sm font-heading font-semibold text-text-heading mb-4">
        SOW Clauses
        <span className="ml-2 text-text-caption font-body font-normal">({clauses.length})</span>
      </h2>

      <div className="space-y-6">
        {orderedTypes.map((type) => (
          <div key={type}>
            <h3 className="text-xs font-body font-medium text-text-caption uppercase tracking-wider mb-2">
              {CLAUSE_TYPE_LABELS[type]}
            </h3>
            <div className="space-y-2">
              {grouped[type]!.map((clause) => {
                const isSelected = selectedClauseId === clause.id
                return (
                  <button
                    key={clause.id}
                    ref={isSelected ? selectedRef : undefined}
                    type="button"
                    onClick={() => selectClause(isSelected ? null : clause.id)}
                    className={cn(
                      'w-full text-left rounded-card border p-3 transition-colors cursor-pointer',
                      isSelected
                        ? 'border-brand-primary bg-brand-primary/5'
                        : 'border-border hover:border-brand-primary/40 hover:bg-hover'
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge status={CLAUSE_TYPE_BADGE_STATUS[clause.type]}>
                        {CLAUSE_TYPE_LABELS[clause.type]}
                      </Badge>
                      <span className="ml-auto text-xs font-body text-text-caption">
                        {Math.round(clause.confidence * 100)}%
                      </span>
                    </div>
                    <p className="text-sm font-body text-text-body line-clamp-3">
                      {clause.text}
                    </p>
                    {clause.linkedTaskIds.length > 0 && (
                      <p className="text-xs font-body text-text-caption mt-1">
                        {clause.linkedTaskIds.length} linked task{clause.linkedTaskIds.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
