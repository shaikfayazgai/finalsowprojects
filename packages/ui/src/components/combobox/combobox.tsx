'use client'
import { Command } from 'cmdk'
import { Search } from 'lucide-react'
import { cn } from '../../lib/utils'

export function Combobox({ className, ...props }: React.ComponentProps<typeof Command>) {
  return (
    <Command
      className={cn(
        'rounded-card border border-border bg-bg-card shadow-card overflow-hidden',
        className
      )}
      {...props}
    />
  )
}

export function ComboboxInput({ className, ...props }: React.ComponentProps<typeof Command.Input>) {
  return (
    <div className="flex items-center border-b border-border px-3">
      <Search className="h-4 w-4 text-text-caption mr-2 shrink-0" />
      <Command.Input
        className={cn(
          'flex h-10 w-full bg-transparent text-sm font-body text-text-body placeholder:text-text-disabled outline-none',
          className
        )}
        {...props}
      />
    </div>
  )
}

export function ComboboxList({ className, ...props }: React.ComponentProps<typeof Command.List>) {
  return (
    <Command.List
      className={cn('max-h-[300px] overflow-y-auto p-1', className)}
      {...props}
    />
  )
}

export function ComboboxEmpty({ className, ...props }: React.ComponentProps<typeof Command.Empty>) {
  return (
    <Command.Empty
      className={cn('py-6 text-center text-sm text-text-caption font-body', className)}
      {...props}
    />
  )
}

export function ComboboxGroup({ className, ...props }: React.ComponentProps<typeof Command.Group>) {
  return (
    <Command.Group
      className={cn(
        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-body [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-caption [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider',
        className
      )}
      {...props}
    />
  )
}

export function ComboboxItem({ className, ...props }: React.ComponentProps<typeof Command.Item>) {
  return (
    <Command.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-inner px-3 py-2 text-sm font-body text-text-body hover:bg-hover data-[selected=true]:bg-hover outline-none',
        className
      )}
      {...props}
    />
  )
}

export function ComboboxSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Command.Separator>) {
  return (
    <Command.Separator
      className={cn('-mx-1 h-px bg-border', className)}
      {...props}
    />
  )
}
