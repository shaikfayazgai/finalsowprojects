'use client'
import { Tabs as RadixTabs } from 'radix-ui'
import { cn } from '../../lib/utils'

export const Tabs = RadixTabs.Root

export function TabsList({
  className,
  ...props
}: RadixTabs.TabsListProps) {
  return (
    <RadixTabs.List
      className={cn(
        'inline-flex h-10 items-center gap-1 rounded-inner bg-bg-dashboard p-1',
        className
      )}
      {...props}
    />
  )
}

export function TabsTrigger({
  className,
  ...props
}: RadixTabs.TabsTriggerProps) {
  return (
    <RadixTabs.Trigger
      className={cn(
        'inline-flex items-center justify-center px-4 py-1.5 text-sm font-body font-medium text-text-caption transition-colors hover:text-text-body data-[state=active]:text-brand-primary data-[state=active]:border-b-2 data-[state=active]:border-brand-primary data-[state=active]:bg-bg-card rounded-inner',
        className
      )}
      {...props}
    />
  )
}

export function TabsContent({
  className,
  ...props
}: RadixTabs.TabsContentProps) {
  return (
    <RadixTabs.Content
      className={cn('mt-4 focus-visible:outline-none', className)}
      {...props}
    />
  )
}
