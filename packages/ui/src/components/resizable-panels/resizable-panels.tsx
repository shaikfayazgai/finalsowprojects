'use client'
import * as React from 'react'
import { Group, Panel, Separator } from 'react-resizable-panels'
import { cn } from '../../lib/utils'

type GroupProps = React.ComponentPropsWithoutRef<typeof Group>
type SeparatorProps = React.ComponentPropsWithoutRef<typeof Separator>

export function ResizablePanelGroup({ className, ...props }: GroupProps) {
  return (
    <Group
      className={cn(
        'flex h-full w-full',
        className
      )}
      {...props}
    />
  )
}
ResizablePanelGroup.displayName = 'ResizablePanelGroup'

export const ResizablePanel = Panel

export function ResizableHandle({ className, ...props }: SeparatorProps) {
  return (
    <Separator
      className={cn(
        'relative flex w-px items-center justify-center bg-border-default',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
        'hover:bg-brand-primary/30 cursor-col-resize transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-primary',
        className
      )}
      {...props}
    />
  )
}
ResizableHandle.displayName = 'ResizableHandle'
