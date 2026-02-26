'use client'
import { Popover as RadixPopover } from 'radix-ui'
import { cn } from '../../lib/utils'

export const Popover = RadixPopover.Root
export const PopoverTrigger = RadixPopover.Trigger
export const PopoverAnchor = RadixPopover.Anchor
export const PopoverClose = RadixPopover.Close

export function PopoverContent({
  className,
  sideOffset = 4,
  align = 'center',
  ...props
}: RadixPopover.PopoverContentProps) {
  return (
    <RadixPopover.Portal>
      <RadixPopover.Content
        sideOffset={sideOffset}
        align={align}
        className={cn(
          'z-50 w-72 bg-bg-card border border-border rounded-card shadow-card-hover p-4',
          className
        )}
        {...props}
      />
    </RadixPopover.Portal>
  )
}
