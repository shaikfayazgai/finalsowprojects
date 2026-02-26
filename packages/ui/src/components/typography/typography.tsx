'use client'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'
import { forwardRef, type HTMLAttributes } from 'react'

const headingVariants = cva('font-display text-text-heading', {
  variants: {
    level: {
      h1: 'text-5xl font-medium tracking-tight',
      h2: 'text-4xl font-medium tracking-tight',
      h3: 'text-2xl font-medium',
      h4: 'text-xl font-medium',
    },
  },
  defaultVariants: { level: 'h1' },
})

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4'

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof headingVariants> {
  level?: HeadingLevel
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 'h1', className, children, ...props }, ref) => {
    const Tag = level
    return (
      <Tag ref={ref} className={cn(headingVariants({ level }), className)} {...props}>
        {children}
      </Tag>
    )
  }
)
Heading.displayName = 'Heading'

interface BodyProps extends HTMLAttributes<HTMLParagraphElement> {
  size?: 'sm' | 'base' | 'lg'
}

export const Body = forwardRef<HTMLParagraphElement, BodyProps>(
  ({ size = 'base', className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'font-body text-text-body',
        size === 'sm' && 'text-sm',
        size === 'base' && 'text-base',
        size === 'lg' && 'text-lg',
        className
      )}
      {...props}
    />
  )
)
Body.displayName = 'Body'

export const Label = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('font-body text-sm font-medium text-text-heading', className)} {...props} />
  )
)
Label.displayName = 'Label'

export const Caption = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('font-body text-xs text-text-caption', className)} {...props} />
  )
)
Caption.displayName = 'Caption'
