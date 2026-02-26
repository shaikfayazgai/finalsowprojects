'use client'
import { Toast as RadixToast } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

export const ToastProvider = RadixToast.Provider

export function ToastViewport({
  className,
  ...props
}: RadixToast.ToastViewportProps) {
  return (
    <RadixToast.Viewport
      className={cn(
        'fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:flex-col sm:max-w-[380px]',
        className
      )}
      {...props}
    />
  )
}

export const toastVariants = cva(
  'group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-card border p-4 shadow-card transition-all',
  {
    variants: {
      variant: {
        success: 'border-status-success/30 bg-status-success/5 text-status-success',
        warning: 'border-status-warning/30 bg-status-warning/5 text-text-heading',
        error: 'border-status-urgent/30 bg-status-urgent/5 text-status-urgent',
        info: 'border-status-inprogress/30 bg-status-inprogress/5 text-status-inprogress',
      },
    },
    defaultVariants: { variant: 'info' },
  }
)

const variantIcons = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
} as const

interface ToastProps
  extends RadixToast.ToastProps,
    VariantProps<typeof toastVariants> {}

export const Toast = forwardRef<HTMLLIElement, ToastProps>(
  ({ className, variant, children, ...props }, ref) => {
    const Icon = variantIcons[variant ?? 'info']
    return (
      <RadixToast.Root
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        {...props}
      >
        <Icon className="h-5 w-5 shrink-0 mt-0.5" />
        <div className="flex-1">{children}</div>
      </RadixToast.Root>
    )
  }
)
Toast.displayName = 'Toast'

export function ToastTitle({
  className,
  ...props
}: RadixToast.ToastTitleProps) {
  return (
    <RadixToast.Title
      className={cn('text-sm font-body font-medium text-text-heading', className)}
      {...props}
    />
  )
}

export function ToastDescription({
  className,
  ...props
}: RadixToast.ToastDescriptionProps) {
  return (
    <RadixToast.Description
      className={cn('text-sm font-body text-text-body', className)}
      {...props}
    />
  )
}

export function ToastClose({
  className,
  ...props
}: RadixToast.ToastCloseProps) {
  return (
    <RadixToast.Close
      className={cn(
        'absolute right-2 top-2 rounded-inner p-1 text-text-caption hover:text-text-body transition-colors',
        className
      )}
      {...props}
    >
      <X className="h-4 w-4" />
    </RadixToast.Close>
  )
}

export function ToastAction({
  className,
  ...props
}: RadixToast.ToastActionProps) {
  return (
    <RadixToast.Action
      className={cn(
        'inline-flex items-center justify-center rounded-button px-3 py-1 text-sm font-body font-medium hover:bg-hover transition-colors',
        className
      )}
      {...props}
    />
  )
}
