'use client'
import { useState } from 'react'
import { cn } from '../../lib/utils'

interface Milestone {
  id: string
  label: string
  date: string
  progress: number
  status: 'completed' | 'active' | 'upcoming'
}

interface TimelineBarProps {
  milestones: Milestone[]
  className?: string
}

export function TimelineBar({ milestones, className }: TimelineBarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Calculate gradient fill width based on furthest completed milestone
  const completedMilestones = milestones.filter((m) => m.status === 'completed')
  const activeMilestones = milestones.filter((m) => m.status === 'active')

  let fillWidth = 0
  if (completedMilestones.length > 0) {
    fillWidth = Math.max(...completedMilestones.map((m) => m.progress))
  }
  // If there's an active milestone, extend fill partway to it
  if (activeMilestones.length > 0) {
    const activeProgress = Math.max(...activeMilestones.map((m) => m.progress))
    fillWidth = Math.max(fillWidth, activeProgress)
  }

  return (
    <div className={cn('relative w-full py-6', className)}>
      {/* Bar track */}
      <div className="relative h-2 w-full rounded-full bg-hover">
        {/* Gradient fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-primary to-brand-gold transition-all duration-500"
          style={{ width: `${fillWidth}%` }}
        />

        {/* Milestone markers */}
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${milestone.progress}%` }}
            onMouseEnter={() => setHoveredId(milestone.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Marker circle */}
            <div
              className={cn(
                'h-[10px] w-[10px] rounded-full cursor-pointer transition-transform hover:scale-125',
                milestone.status === 'completed' && 'bg-brand-primary',
                milestone.status === 'active' &&
                  'bg-brand-primary ring-2 ring-brand-primary/30 animate-pulse',
                milestone.status === 'upcoming' &&
                  'bg-hover border border-border'
              )}
            />

            {/* Tooltip on hover */}
            {hoveredId === milestone.id && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap bg-bg-card border border-border rounded-inner shadow-card text-xs font-body p-2 z-10">
                <p className="font-medium text-text-heading">{milestone.label}</p>
                <p className="text-text-caption">{milestone.date}</p>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
