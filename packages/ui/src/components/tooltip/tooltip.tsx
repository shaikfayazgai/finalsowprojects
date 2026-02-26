'use client'
import { Tooltip as RadixTooltip } from 'radix-ui'
import { cn } from '../../lib/utils'

export const TooltipProvider = RadixTooltip.Provider
export const Tooltip = RadixTooltip.Root
export const TooltipTrigger = RadixTooltip.Trigger

export function TooltipContent({ className, sideOffset = 4, ...props }: RadixTooltip.TooltipContentProps) {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 bg-text-heading text-bg-app text-xs px-3 py-1.5 rounded-badge shadow-card font-body',
          className
        )}
        {...props}
      />
    </RadixTooltip.Portal>
  )
}
