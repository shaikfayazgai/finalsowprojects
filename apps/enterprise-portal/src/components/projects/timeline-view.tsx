'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@glimmora/ui'
import type { ProjectMilestone } from '@glimmora/types'
import { GanttTimeline } from './gantt-timeline'
import { MilestoneListView } from './milestone-list-view'

interface TimelineViewProps {
  projectId: string
  projectStartDate: string
  projectEndDate: string
}

export function TimelineView({
  projectId,
  projectStartDate,
  projectEndDate,
}: TimelineViewProps) {
  const [view, setView] = useState<'gantt' | 'list'>('gantt')

  const { data: milestones = [], isLoading } = useQuery<ProjectMilestone[]>({
    queryKey: ['enterprise', 'projects', projectId, 'timeline'],
    queryFn: async () => {
      const res = await fetch(
        `/api/enterprise/projects/${projectId}/timeline`
      )
      if (!res.ok) throw new Error('Failed to fetch timeline')
      return res.json()
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-heading font-semibold text-text-heading">
          Timeline
        </h3>
        <div className="flex items-center gap-1 rounded-button border border-border p-0.5">
          <Button
            variant={view === 'gantt' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setView('gantt')}
          >
            Gantt
          </Button>
          <Button
            variant={view === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setView('list')}
          >
            List
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <p className="text-sm font-body text-text-caption">
            Loading timeline...
          </p>
        </div>
      ) : milestones.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-body text-text-caption">
            No milestones found for this project.
          </p>
        </div>
      ) : view === 'gantt' ? (
        <GanttTimeline
          milestones={milestones}
          projectStartDate={projectStartDate}
          projectEndDate={projectEndDate}
        />
      ) : (
        <MilestoneListView milestones={milestones} />
      )}
    </div>
  )
}
