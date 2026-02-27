'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { format } from 'date-fns'
import type { ProjectMilestone } from '@glimmora/types'

interface GanttTimelineProps {
  milestones: ProjectMilestone[]
  projectStartDate: string
  projectEndDate: string
  className?: string
}

const healthColors: Record<string, string> = {
  completed: 'var(--color-status-success)',
  'in-progress': 'var(--color-brand-primary)',
  pending: 'var(--color-border)',
  overdue: 'var(--color-status-urgent)',
}

interface GanttDataPoint {
  name: string
  offset: number
  duration: number
  status: string
}

export function GanttTimeline({
  milestones,
  projectStartDate,
  projectEndDate,
  className,
}: GanttTimelineProps) {
  const startTs = new Date(projectStartDate).getTime()
  const endTs = new Date(projectEndDate).getTime()
  const totalDuration = endTs - startTs
  const todayTs = Date.now()
  const todayOffset = todayTs - startTs

  const data = useMemo<GanttDataPoint[]>(
    () =>
      milestones.map((m) => {
        const mStart = new Date(m.targetDate).getTime()
        const mEnd = m.completedDate
          ? new Date(m.completedDate).getTime()
          : mStart + 7 * 24 * 3600 * 1000 // Default 1-week duration for pending
        return {
          name: m.name,
          offset: mStart - startTs,
          duration: mEnd - mStart,
          status: m.status,
        }
      }),
    [milestones, startTs]
  )

  const chartHeight = Math.max(200, milestones.length * 48 + 60)

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          barSize={20}
          margin={{ top: 10, right: 30, bottom: 20, left: 160 }}
        >
          <XAxis
            type="number"
            domain={[0, totalDuration]}
            tickCount={6}
            tickFormatter={(val: number) =>
              format(new Date(startTs + val), 'MMM d')
            }
            fontSize={12}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={155}
            fontSize={12}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-inner)',
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--color-text-heading)' }}
            formatter={(value: number, name: string) => {
              if (name === 'offset') return [null, null]
              const days = Math.round(value / (24 * 3600 * 1000))
              return [`${days} days`, 'Duration']
            }}
          />
          <Bar
            dataKey="offset"
            stackId="gantt"
            fill="transparent"
            isAnimationActive={false}
          />
          <Bar
            dataKey="duration"
            stackId="gantt"
            radius={[4, 4, 4, 4]}
            isAnimationActive={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={healthColors[entry.status] ?? healthColors.pending}
              />
            ))}
          </Bar>
          {todayOffset >= 0 && todayOffset <= totalDuration && (
            <ReferenceLine
              x={todayOffset}
              stroke="var(--color-text-caption)"
              strokeDasharray="4 4"
              label={{
                value: 'Today',
                position: 'top',
                fontSize: 11,
              }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
