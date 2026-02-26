import type { Meta, StoryObj } from '@storybook/nextjs'
import { Spinner } from './spinner'

const meta: Meta<typeof Spinner> = {
  title: 'Design System/Spinner',
  component: Spinner,
  parameters: { layout: 'centered' },
}
export default meta
type Story = StoryObj<typeof Spinner>

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-end gap-8 p-6 bg-bg-app">
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-end gap-8 p-6 bg-bg-app">
      <Spinner size="sm" label="Loading..." />
      <Spinner size="md" label="Fetching tasks..." />
      <Spinner size="lg" label="Processing evidence..." />
    </div>
  ),
}
