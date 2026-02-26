'use client'
import { DropdownMenu as RadixDropdownMenu } from 'radix-ui'
import { Check, ChevronRight, Circle } from 'lucide-react'
import { cn } from '../../lib/utils'

export const DropdownMenu = RadixDropdownMenu.Root
export const DropdownMenuTrigger = RadixDropdownMenu.Trigger
export const DropdownMenuGroup = RadixDropdownMenu.Group
export const DropdownMenuRadioGroup = RadixDropdownMenu.RadioGroup
export const DropdownMenuSub = RadixDropdownMenu.Sub

export function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: RadixDropdownMenu.DropdownMenuContentProps) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 min-w-[180px] bg-bg-card border border-border rounded-card shadow-card p-1 animate-in fade-in-0 zoom-in-95',
          className
        )}
        {...props}
      />
    </RadixDropdownMenu.Portal>
  )
}

export function DropdownMenuItem({
  className,
  ...props
}: RadixDropdownMenu.DropdownMenuItemProps) {
  return (
    <RadixDropdownMenu.Item
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-inner px-3 py-2 text-sm font-body text-text-body hover:bg-hover focus:bg-hover outline-none',
        className
      )}
      {...props}
    />
  )
}

export function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: RadixDropdownMenu.DropdownMenuCheckboxItemProps) {
  return (
    <RadixDropdownMenu.CheckboxItem
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-inner py-2 pl-8 pr-3 text-sm font-body text-text-body hover:bg-hover focus:bg-hover outline-none',
        className
      )}
      checked={checked}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <RadixDropdownMenu.ItemIndicator>
          <Check className="h-4 w-4 text-brand-primary" />
        </RadixDropdownMenu.ItemIndicator>
      </span>
      {children}
    </RadixDropdownMenu.CheckboxItem>
  )
}

export function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: RadixDropdownMenu.DropdownMenuRadioItemProps) {
  return (
    <RadixDropdownMenu.RadioItem
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-inner py-2 pl-8 pr-3 text-sm font-body text-text-body hover:bg-hover focus:bg-hover outline-none',
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
        <RadixDropdownMenu.ItemIndicator>
          <Circle className="h-2 w-2 fill-brand-primary text-brand-primary" />
        </RadixDropdownMenu.ItemIndicator>
      </span>
      {children}
    </RadixDropdownMenu.RadioItem>
  )
}

export function DropdownMenuLabel({
  className,
  ...props
}: RadixDropdownMenu.DropdownMenuLabelProps) {
  return (
    <RadixDropdownMenu.Label
      className={cn(
        'px-3 py-1.5 text-xs font-medium text-text-caption font-body uppercase tracking-wider',
        className
      )}
      {...props}
    />
  )
}

export function DropdownMenuSeparator({
  className,
  ...props
}: RadixDropdownMenu.DropdownMenuSeparatorProps) {
  return (
    <RadixDropdownMenu.Separator
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

export function DropdownMenuSubTrigger({
  className,
  children,
  ...props
}: RadixDropdownMenu.DropdownMenuSubTriggerProps) {
  return (
    <RadixDropdownMenu.SubTrigger
      className={cn(
        'relative flex cursor-pointer select-none items-center rounded-inner px-3 py-2 text-sm font-body text-text-body hover:bg-hover focus:bg-hover outline-none',
        className
      )}
      {...props}
    >
      {children}
      <ChevronRight className="ml-auto h-4 w-4 text-text-caption" />
    </RadixDropdownMenu.SubTrigger>
  )
}

export function DropdownMenuSubContent({
  className,
  ...props
}: RadixDropdownMenu.DropdownMenuSubContentProps) {
  return (
    <RadixDropdownMenu.Portal>
      <RadixDropdownMenu.SubContent
        className={cn(
          'z-50 min-w-[180px] bg-bg-card border border-border rounded-card shadow-card p-1',
          className
        )}
        {...props}
      />
    </RadixDropdownMenu.Portal>
  )
}
