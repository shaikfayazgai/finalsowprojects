import type { Meta, StoryObj } from '@storybook/nextjs'
import { Slider } from './slider'

const meta: Meta<typeof Slider> = {
  title: 'Design System/Slider',
  component: Slider,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof Slider>

export const Default: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-md space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-body text-text-heading">Default</label>
        <Slider defaultValue={[50]} max={100} step={1} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-body text-text-heading">With Value</label>
        <Slider defaultValue={[33]} max={100} step={1} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-body text-text-heading">Range</label>
        <Slider defaultValue={[25, 75]} max={100} step={1} />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-body text-text-heading">Disabled</label>
        <Slider defaultValue={[50]} max={100} step={1} disabled />
      </div>
    </div>
  ),
}
