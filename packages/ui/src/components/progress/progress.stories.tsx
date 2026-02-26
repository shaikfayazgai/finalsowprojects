import type { Meta, StoryObj } from '@storybook/nextjs'
import { Progress } from './progress'

const meta: Meta<typeof Progress> = {
  title: 'Design System/Progress',
  component: Progress,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof Progress>

export const Determinate: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-md space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-body text-text-caption">0%</label>
        <Progress value={0} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-body text-text-caption">25%</label>
        <Progress value={25} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-body text-text-caption">50%</label>
        <Progress value={50} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-body text-text-caption">75%</label>
        <Progress value={75} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-body text-text-caption">100%</label>
        <Progress value={100} />
      </div>
    </div>
  ),
}

export const Indeterminate: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-md space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-body text-text-caption">Loading...</label>
        <Progress indeterminate />
      </div>
    </div>
  ),
}

export const Gradient: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-md space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-body text-text-caption">Milestone Progress (Gradient)</label>
        <Progress value={65} variant="gradient" />
      </div>
    </div>
  ),
}
