'use client'
import { useEffect, useRef, useState } from 'react'
import { Tag, cn } from '@glimmora/ui'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Blueprint } from '@glimmora/types'
import { useEditorStore } from '@/store/editor-store'

interface TaskTreePanelProps {
  blueprint: Blueprint
}

export function TaskTreePanel({ blueprint }: TaskTreePanelProps) {
  const selectedClauseId = useEditorStore((s) => s.selectedClauseId)
  const selectTask = useEditorStore((s) => s.selectTask)
  const selectedTaskId = useEditorStore((s) => s.selectedTaskId)
  const selectMilestone = useEditorStore((s) => s.selectMilestone)
  const highlightRef = useRef<HTMLButtonElement>(null)

  const [collapsedPhases, setCollapsedPhases] = useState<Set<string>>(new Set())
  const [collapsedMilestones, setCollapsedMilestones] = useState<Set<string>>(new Set())

  const totalTasks = blueprint.tasks.length

  useEffect(() => {
    if (selectedClauseId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedClauseId])

  function togglePhase(phaseId: string) {
    setCollapsedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }

  function toggleMilestone(milestoneId: string) {
    setCollapsedMilestones((prev) => {
      const next = new Set(prev)
      if (next.has(milestoneId)) {
        next.delete(milestoneId)
      } else {
        next.add(milestoneId)
      }
      return next
    })
  }

  // Build a task lookup for quick access
  const taskMap = new Map(blueprint.tasks.map((t) => [t.id, t]))

  // Track if this is the first highlighted task (for scrollIntoView ref)
  let firstHighlightAssigned = false

  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-sm font-heading font-semibold text-text-heading mb-4">
        Task Tree
        <span className="ml-2 text-text-caption font-body font-normal">({totalTasks} tasks)</span>
      </h2>

      <div className="space-y-1">
        {blueprint.phases.map((phase) => {
          const isPhaseCollapsed = collapsedPhases.has(phase.id)
          const phaseMilestones = blueprint.milestones.filter((m) =>
            phase.milestoneIds.includes(m.id)
          )

          return (
            <div key={phase.id}>
              {/* Phase header */}
              <button
                type="button"
                onClick={() => togglePhase(phase.id)}
                className="flex items-center gap-2 w-full text-left py-2 px-2 rounded-inner hover:bg-hover transition-colors"
              >
                {isPhaseCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-text-caption shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-caption shrink-0" />
                )}
                <span className="text-sm font-body font-semibold text-text-heading">
                  {phase.name}
                </span>
                <span className="ml-auto text-xs font-body text-text-caption">
                  {phase.startDate} - {phase.endDate}
                </span>
              </button>

              {!isPhaseCollapsed && (
                <div className="ml-4 space-y-1">
                  {phaseMilestones.map((milestone) => {
                    const isMilestoneCollapsed = collapsedMilestones.has(milestone.id)
                    const milestoneTasks = milestone.taskIds
                      .map((tid) => taskMap.get(tid))
                      .filter(Boolean)

                    return (
                      <div key={milestone.id}>
                        {/* Milestone header */}
                        <button
                          type="button"
                          onClick={() => {
                            toggleMilestone(milestone.id)
                            selectMilestone(milestone.id)
                          }}
                          className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-inner hover:bg-hover transition-colors"
                        >
                          {isMilestoneCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5 text-text-caption shrink-0" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 text-text-caption shrink-0" />
                          )}
                          <span className="text-sm font-body font-medium text-text-body">
                            {milestone.name}
                          </span>
                          <span className="ml-auto text-xs font-body text-text-caption whitespace-nowrap">
                            ${milestone.budgetAllocation.toLocaleString()} &middot; W{milestone.targetWeek}
                          </span>
                        </button>

                        {!isMilestoneCollapsed && (
                          <div className="ml-6 space-y-1 mt-1">
                            {milestoneTasks.map((task) => {
                              if (!task) return null
                              const isLinked =
                                selectedClauseId !== null &&
                                task.clauseIds.includes(selectedClauseId)
                              const isSelected = selectedTaskId === task.id
                              const isDimmed = selectedClauseId !== null && !isLinked

                              // Assign ref to the first highlighted task
                              const shouldRef = isLinked && !firstHighlightAssigned
                              if (shouldRef) firstHighlightAssigned = true

                              return (
                                <button
                                  key={task.id}
                                  ref={shouldRef ? highlightRef : undefined}
                                  type="button"
                                  onClick={() => selectTask(isSelected ? null : task.id)}
                                  className={cn(
                                    'w-full text-left rounded-inner border p-2.5 transition-all cursor-pointer',
                                    isLinked
                                      ? 'border-brand-primary bg-brand-primary/5'
                                      : isSelected
                                        ? 'border-brand-primary/60 bg-hover'
                                        : 'border-transparent hover:border-border hover:bg-hover',
                                    isDimmed && 'opacity-50'
                                  )}
                                >
                                  <p className="text-sm font-body font-medium text-text-heading">
                                    {task.title}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {task.skillRequirements.slice(0, 3).map((skill) => (
                                      <Tag key={skill} variant="skill">
                                        {skill}
                                      </Tag>
                                    ))}
                                    {task.skillRequirements.length > 3 && (
                                      <span className="text-xs font-body text-text-caption">
                                        +{task.skillRequirements.length - 3}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs font-body text-text-caption mt-1">
                                    {task.estimatedHours}h estimated
                                  </p>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
