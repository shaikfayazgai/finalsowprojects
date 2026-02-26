import type { Meta, StoryObj } from '@storybook/nextjs'
import { Sparkline } from './sparkline'

const meta: Meta<typeof Sparkline> = {
  title: 'Design System/Sparkline',
  component: Sparkline,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof Sparkline>

const uptrend = [2, 4, 3, 6, 8, 7, 10, 12, 11, 15]
const downtrend = [15, 13, 14, 10, 8, 9, 6, 4, 5, 2]
const volatile = [5, 12, 3, 15, 7, 13, 2, 10, 8, 14]
const flat = [5, 5, 6, 5, 5, 6, 5, 5, 5, 6]

export const Patterns: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 bg-bg-app">
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm font-body text-text-body">Uptrend</span>
        <Sparkline data={uptrend} showDot />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm font-body text-text-body">Downtrend</span>
        <Sparkline data={downtrend} showDot />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm font-body text-text-body">Volatile</span>
        <Sparkline data={volatile} showDot />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-24 text-sm font-body text-text-body">Flat</span>
        <Sparkline data={flat} showDot />
      </div>
    </div>
  ),
}

export const Widths: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 bg-bg-app">
      <Sparkline data={uptrend} width={80} height={24} />
      <Sparkline data={uptrend} width={120} height={32} />
      <Sparkline data={uptrend} width={200} height={48} />
    </div>
  ),
}

export const WithoutDot: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-4 bg-bg-app">
      <Sparkline data={uptrend} />
      <Sparkline data={downtrend} />
    </div>
  ),
}
