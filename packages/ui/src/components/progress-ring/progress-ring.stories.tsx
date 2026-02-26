import type { Meta, StoryObj } from '@storybook/nextjs'
import { ProgressRing } from './progress-ring'

const meta: Meta<typeof ProgressRing> = {
  title: 'Design System/Progress Ring',
  component: ProgressRing,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof ProgressRing>

export const Percentages: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-4 bg-bg-app">
      <ProgressRing value={0} label="0%" />
      <ProgressRing value={25} label="25%" />
      <ProgressRing value={50} label="50%" />
      <ProgressRing value={75} label="75%" />
      <ProgressRing value={100} label="100%" />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-4 bg-bg-app">
      <ProgressRing value={65} size={48} strokeWidth={3} label="65%" />
      <ProgressRing value={65} size={64} strokeWidth={4} label="65%" />
      <ProgressRing value={65} size={96} strokeWidth={6} label="65%" />
    </div>
  ),
}

export const NoLabel: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-4 bg-bg-app">
      <ProgressRing value={42} />
      <ProgressRing value={88} size={48} />
    </div>
  ),
}
