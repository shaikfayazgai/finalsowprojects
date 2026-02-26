'use client'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-body font-medium uppercase tracking-wider',
  {
    variants: {
      status: {
        urgent: 'bg-status-urgent/10 text-status-urgent',
        normal: 'bg-status-neutral/10 text-status-neutral',
        inprogress: 'bg-status-inprogress/10 text-status-inprogress',
        done: 'bg-status-success/10 text-status-success',
        atrisk: 'bg-status-warning/10 text-status-warning',
      },
    },
    defaultVariants: { status: 'normal' },
  }
)

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, status, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ status }), className)} {...props} />
  )
)
Badge.displayName = 'Badge'

export { badgeVariants }
