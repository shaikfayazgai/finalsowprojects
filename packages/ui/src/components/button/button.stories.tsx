import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from './button'
import { Plus } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'Design System/Button',
  component: Button,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof Button>

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3 p-4 bg-bg-app">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="primary" loading>Loading</Button>
      <Button variant="primary" icon={<Plus className="h-4 w-4" />}>With Icon</Button>
      <Button variant="primary" disabled>Disabled</Button>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3 p-4 bg-bg-app">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}
