'use client'
import { cn } from '../../lib/utils'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  strokeColor?: string
  showDot?: boolean
  className?: string
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  strokeColor = 'var(--color-brand-primary)',
  showDot = false,
  className,
}: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2

  const points = data.map((value, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = padding + (1 - (value - min) / range) * (height - padding * 2)
    return { x, y }
  })

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ')
  const lastPoint = points[points.length - 1]

  return (
    <svg
      width={width}
      height={height}
      className={cn('inline-block', className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDot && lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={2.5}
          fill={strokeColor}
        />
      )}
    </svg>
  )
}
