import type { Meta, StoryObj } from '@storybook/nextjs'
import { useState } from 'react'
import { DatePicker } from './date-picker'

const meta: Meta<typeof DatePicker> = {
  title: 'Design System/DatePicker',
  component: DatePicker,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof DatePicker>

export const Default: Story = {
  render: () => (
    <div className="p-6 bg-bg-app inline-block rounded-card border border-border">
      <DatePicker />
    </div>
  ),
}

export const WithSelectedDate: Story = {
  render: function Render() {
    const [date, setDate] = useState<Date | undefined>(new Date())
    return (
      <div className="p-6 bg-bg-app space-y-3">
        <p className="text-sm font-body text-text-body">
          Selected: {date ? date.toLocaleDateString() : 'None'}
        </p>
        <div className="inline-block rounded-card border border-border">
          <DatePicker selected={date} onSelect={setDate} />
        </div>
      </div>
    )
  },
}
