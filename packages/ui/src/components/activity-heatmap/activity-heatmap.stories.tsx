import type { Meta, StoryObj } from '@storybook/nextjs'
import { ActivityHeatmap } from './activity-heatmap'

const meta: Meta<typeof ActivityHeatmap> = {
  title: 'Design System/Activity Heatmap',
  component: ActivityHeatmap,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof ActivityHeatmap>

// Generate 20 weeks of sample data (140 days)
function generateSampleData(weeks: number) {
  const data = []
  const startDate = new Date('2025-10-01')
  for (let i = 0; i < weeks * 7; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    const dayOfWeek = date.getDay()
    // Simulate realistic activity: weekdays more active, some zero days
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const base = isWeekend ? 1 : 3
    const count = Math.random() > 0.2 ? Math.floor(Math.random() * 10 * (base / 3)) : 0
    data.push({
      date: date.toISOString().split('T')[0],
      count,
    })
  }
  return data
}

const sampleData = generateSampleData(20)

export const Default: Story = {
  render: () => (
    <div className="p-4 bg-bg-card rounded-card">
      <ActivityHeatmap data={sampleData} />
    </div>
  ),
}

export const TenWeeks: Story = {
  render: () => (
    <div className="p-4 bg-bg-card rounded-card">
      <ActivityHeatmap data={generateSampleData(10)} weeks={10} />
    </div>
  ),
}
