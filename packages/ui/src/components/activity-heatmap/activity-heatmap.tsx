'use client'
import { cn } from '../../lib/utils'

interface HeatmapData {
  date: string
  count: number
}

interface ActivityHeatmapProps {
  data: HeatmapData[]
  weeks?: number
  className?: string
}

const CELL_SIZE = 12
const GAP = 2
const DAYS = 7

function getIntensityColor(count: number, maxCount: number): string {
  if (count === 0) return 'var(--color-hover)'
  const ratio = count / maxCount
  if (ratio <= 0.25) return 'var(--color-brand-sand)'
  if (ratio <= 0.5) return 'var(--color-brand-primary)'
  if (ratio <= 0.75) return 'var(--color-brand-forest)'
  return 'var(--color-status-success)'
}

export function ActivityHeatmap({ data, weeks = 20, className }: ActivityHeatmapProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const totalCells = weeks * DAYS

  const svgWidth = weeks * (CELL_SIZE + GAP)
  const svgHeight = DAYS * (CELL_SIZE + GAP)

  return (
    <div className={cn('inline-block', className)}>
      <svg width={svgWidth} height={svgHeight}>
        {Array.from({ length: totalCells }, (_, i) => {
          const week = Math.floor(i / DAYS)
          const day = i % DAYS
          const entry = data[i]
          return (
            <rect
              key={i}
              x={week * (CELL_SIZE + GAP)}
              y={day * (CELL_SIZE + GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={entry ? getIntensityColor(entry.count, maxCount) : 'var(--color-hover)'}
            >
              {entry && <title>{`${entry.date}: ${entry.count} contributions`}</title>}
            </rect>
          )
        })}
      </svg>
      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 text-xs font-body text-text-caption">
        <span>Less</span>
        {['var(--color-hover)', 'var(--color-brand-sand)', 'var(--color-brand-primary)', 'var(--color-brand-forest)', 'var(--color-status-success)'].map((color, i) => (
          <span
            key={i}
            className="inline-block rounded-sm"
            style={{ width: CELL_SIZE, height: CELL_SIZE, backgroundColor: color }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
