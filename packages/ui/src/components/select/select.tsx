'use client'
import { Select as RadixSelect } from 'radix-ui'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Select = RadixSelect.Root
export const SelectGroup = RadixSelect.Group
export const SelectValue = RadixSelect.Value

export function SelectTrigger({ className, children, ...props }: RadixSelect.SelectTriggerProps) {
  return (
    <RadixSelect.Trigger
      className={cn(
        'flex h-10 w-full items-center justify-between border border-border bg-bg-card px-3 py-2 text-sm font-body text-text-body rounded-inner focus:outline-none focus:ring-2 focus:ring-brand-primary disabled:opacity-50',
        className
      )}
      {...props}
    >
      {children}
      <RadixSelect.Icon><ChevronDown className="h-4 w-4 text-text-caption" /></RadixSelect.Icon>
    </RadixSelect.Trigger>
  )
}

export function SelectContent({ className, children, ...props }: RadixSelect.SelectContentProps) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        className={cn('z-50 bg-bg-card border border-border rounded-card shadow-card p-1', className)}
        {...props}
      >
        <RadixSelect.Viewport>{children}</RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  )
}

export function SelectItem({ className, children, ...props }: RadixSelect.SelectItemProps) {
  return (
    <RadixSelect.Item
      className={cn('relative flex cursor-pointer select-none items-center rounded-inner px-3 py-2 text-sm font-body text-text-body hover:bg-hover focus:bg-hover outline-none', className)}
      {...props}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="absolute right-2">
        <Check className="h-4 w-4 text-brand-primary" />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  )
}

export function SelectLabel({ className, ...props }: RadixSelect.SelectLabelProps) {
  return <RadixSelect.Label className={cn('px-3 py-1.5 text-xs font-medium text-text-caption font-body uppercase tracking-wider', className)} {...props} />
}
