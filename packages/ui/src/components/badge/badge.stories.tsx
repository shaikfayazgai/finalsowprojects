import type { Meta, StoryObj } from '@storybook/nextjs'
import { Badge } from './badge'

const meta: Meta<typeof Badge> = {
  title: 'Design System/Badge',
  component: Badge,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof Badge>

export const AllStatuses: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 p-6 bg-bg-app">
      <Badge status="urgent">Urgent</Badge>
      <Badge status="normal">Normal</Badge>
      <Badge status="inprogress">In Progress</Badge>
      <Badge status="done">Done</Badge>
      <Badge status="atrisk">At Risk</Badge>
    </div>
  ),
}
