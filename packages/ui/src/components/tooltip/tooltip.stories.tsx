import type { Meta, StoryObj } from '@storybook/nextjs'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './tooltip'
import { Button } from '../button/button'

const meta: Meta = { title: 'Design System/Tooltip', parameters: { layout: 'centered' } }
export default meta

export const BasicTooltip: StoryObj = {
  render: () => (
    <TooltipProvider>
      <div className="flex gap-4">
        <Tooltip>
          <TooltipTrigger asChild><Button variant="secondary">Hover me</Button></TooltipTrigger>
          <TooltipContent>Submit evidence for review</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild><Button variant="ghost">More info</Button></TooltipTrigger>
          <TooltipContent side="bottom">APG will automatically assign this task</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
}
