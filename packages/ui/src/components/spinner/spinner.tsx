'use client'
import { cn } from '../../lib/utils'

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
} as const

interface SpinnerProps {
  size?: keyof typeof sizeMap
  label?: string
  className?: string
}

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-hover border-t-brand-primary',
          sizeMap[size]
        )}
        role="status"
        aria-label={label ?? 'Loading'}
      />
      {label && (
        <span className="text-sm font-body text-text-caption mt-2">{label}</span>
      )}
    </div>
  )
}
