'use client'
import { Progress as RadixProgress } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const progressIndicatorVariants = cva(
  'h-full transition-all duration-500 ease-out rounded-full',
  {
    variants: {
      variant: {
        default: 'bg-brand-primary',
        gradient: 'bg-gradient-to-r from-brand-primary to-brand-gold',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

interface ProgressProps
  extends Omit<RadixProgress.ProgressProps, 'value'>,
    VariantProps<typeof progressIndicatorVariants> {
  value?: number
  indeterminate?: boolean
  className?: string
}

export function Progress({
  className,
  value = 0,
  variant,
  indeterminate = false,
  ...props
}: ProgressProps) {
  return (
    <RadixProgress.Root
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-hover', className)}
      value={indeterminate ? undefined : value}
      {...props}
    >
      <RadixProgress.Indicator
        className={cn(
          progressIndicatorVariants({ variant }),
          indeterminate && 'animate-pulse w-full'
        )}
        style={indeterminate ? undefined : { width: `${value}%` }}
      />
    </RadixProgress.Root>
  )
}
