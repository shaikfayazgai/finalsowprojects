'use client'
import { cn } from '../../lib/utils'

interface ProgressRingProps {
  value: number
  size?: number
  strokeWidth?: number
  label?: string
  className?: string
}

export function ProgressRing({ value, size = 64, strokeWidth = 4, label, className }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(Math.max(value, 0), 100) / 100) * circumference

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-hover)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-brand-primary)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {label && (
        <span className="absolute text-xs font-body font-medium text-text-heading">
          {label}
        </span>
      )}
    </div>
  )
}
