import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuLabel,
  ContextMenuCheckboxItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
} from './context-menu'

const meta: Meta = { title: 'Design System/ContextMenu', parameters: { layout: 'centered' } }
export default meta

export const Basic: StoryObj = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex h-[200px] w-[300px] items-center justify-center rounded-card border border-dashed border-border bg-bg-dashboard text-sm font-body text-text-caption">
          Right-click here
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>Task Actions</ContextMenuLabel>
        <ContextMenuItem>View Details</ContextMenuItem>
        <ContextMenuItem>Edit Task</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuSub>
          <ContextMenuSubTrigger>Assign To</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Team Alpha</ContextMenuItem>
            <ContextMenuItem>Team Beta</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem checked>Show Metadata</ContextMenuCheckboxItem>
        <ContextMenuItem>Archive</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
}
