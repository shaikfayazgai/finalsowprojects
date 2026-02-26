'use client'
import { ContextMenu as RadixContextMenu } from 'radix-ui'
import { Check, ChevronRight, Circle } from 'lucide-react'
import { cn } from '../../lib/utils'

export const ContextMenu = RadixContextMenu.Root
export const ContextMenuTrigger = RadixContextMenu.Trigger

export function ContextMenuContent({
  className,
  ...props
}: RadixContextMenu.ContextMenuContentProps) {
  return (
    <RadixContextMenu.Portal>
      <RadixContextMenu.Content
        className={cn(
          'z-50 min-w-[180px] bg-bg-card border border-border rounded-card shadow-card p-1 animate-in fade-in-0 zoom-in-95',
          className
        )}
        {...props}
      />
    </RadixContextMenu.Portal>
  )
}

export function ContextMenuItem({
  className,
  ...props
}: RadixContextMenu.ContextMenuItemProps) {
  return (
    <RadixContextMenu.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-inner px-3 py-2 text-sm font-body text-text-body hover:bg-hover focus:bg-hover outline-none',
        className
      )}
      {...props}
    />
  )
}

export function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: RadixContextMenu.ContextMenuCheckboxItemProps) {
  return (
    <RadixContextMenu.CheckboxItem
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-inner py-2 pl-8 pr-3 text-sm font-body text-text-body hover:bg-hover focus:bg-hover outline-none',
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <RadixContextMenu.ItemIndicator>
          <Check className="h-4 w-4 text-brand-primary" />
        </RadixContextMenu.ItemIndicator>
      </span>
      {children}
    </RadixContextMenu.CheckboxItem>
  )
}

export function ContextMenuRadioGroup(props: RadixContextMenu.ContextMenuRadioGroupProps) {
  return <RadixContextMenu.RadioGroup {...props} />
}

export function ContextMenuRadioItem({
  className,
  children,
  ...props
}: RadixContextMenu.ContextMenuRadioItemProps) {
  return (
    <RadixContextMenu.RadioItem
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-inner py-2 pl-8 pr-3 text-sm font-body text-text-body hover:bg-hover focus:bg-hover outline-none',
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <RadixContextMenu.ItemIndicator>
          <Circle className="h-2 w-2 fill-brand-primary text-brand-primary" />
        </RadixContextMenu.ItemIndicator>
      </span>
      {children}
    </RadixContextMenu.RadioItem>
  )
}

export function ContextMenuLabel({
  className,
  ...props
}: RadixContextMenu.ContextMenuLabelProps) {
  return (
    <RadixContextMenu.Label
      className={cn(
        'px-3 py-1.5 text-xs font-medium text-text-caption font-body uppercase tracking-wider',
        className
      )}
      {...props}
    />
  )
}

export function ContextMenuSeparator({
  className,
  ...props
}: RadixContextMenu.ContextMenuSeparatorProps) {
  return (
    <RadixContextMenu.Separator
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

export const ContextMenuSub = RadixContextMenu.Sub

export function ContextMenuSubTrigger({
  className,
  children,
  ...props
}: RadixContextMenu.ContextMenuSubTriggerProps) {
  return (
    <RadixContextMenu.SubTrigger
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-inner px-3 py-2 text-sm font-body text-text-body hover:bg-hover focus:bg-hover outline-none',
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4 text-text-caption" />
    </RadixContextMenu.SubTrigger>
  )
}

export function ContextMenuSubContent({
  className,
  ...props
}: RadixContextMenu.ContextMenuSubContentProps) {
  return (
    <RadixContextMenu.Portal>
      <RadixContextMenu.SubContent
        className={cn(
          'z-50 min-w-[180px] bg-bg-card border border-border rounded-card shadow-card p-1',
          className
        )}
        {...props}
      />
    </RadixContextMenu.Portal>
  )
}
