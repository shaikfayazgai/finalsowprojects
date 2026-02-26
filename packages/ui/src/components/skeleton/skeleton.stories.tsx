import type { Meta, StoryObj } from '@storybook/nextjs'
import { Skeleton } from './skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Design System/Skeleton',
  component: Skeleton,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof Skeleton>

export const CardLayout: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-sm">
      <div className="rounded-card border border-border bg-bg-card p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-24 w-full rounded-inner" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-4/6" />
        </div>
      </div>
    </div>
  ),
}

export const TextLines: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-md space-y-3">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  ),
}
