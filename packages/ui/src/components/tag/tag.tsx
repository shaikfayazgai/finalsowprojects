'use client'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'
import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export const tagVariants = cva(
  'inline-flex items-center gap-1 rounded-badge px-2.5 py-1 text-xs font-body font-medium transition-colors',
  {
    variants: {
      variant: {
        skill: 'bg-brand-primary/10 text-brand-primary',
        category: 'bg-brand-forest/10 text-brand-forest',
        default: 'bg-hover text-text-body',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

interface TagProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof tagVariants> {
  dismissible?: boolean
  onDismiss?: () => void
}

export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, variant, dismissible = false, onDismiss, children, ...props }, ref) => (
    <span ref={ref} className={cn(tagVariants({ variant }), className)} {...props}>
      {children}
      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10 transition-colors"
          aria-label="Remove"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
)
Tag.displayName = 'Tag'
