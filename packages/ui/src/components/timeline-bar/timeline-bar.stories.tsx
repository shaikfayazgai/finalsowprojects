import type { Meta, StoryObj } from '@storybook/nextjs'
import { TimelineBar } from './timeline-bar'

const meta: Meta<typeof TimelineBar> = {
  title: 'Governance/TimelineBar',
  component: TimelineBar,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof TimelineBar>

export const ProjectTimeline: Story = {
  name: 'Project Timeline (Hover for Tooltips)',
  args: {
    milestones: [
      { id: 'm1', label: 'Project Kickoff', date: 'Jan 5, 2026', progress: 0, status: 'completed' },
      { id: 'm2', label: 'Design Approved', date: 'Jan 20, 2026', progress: 20, status: 'completed' },
      { id: 'm3', label: 'MVP Delivered', date: 'Feb 10, 2026', progress: 45, status: 'completed' },
      { id: 'm4', label: 'Beta Testing', date: 'Feb 25, 2026', progress: 65, status: 'active' },
      { id: 'm5', label: 'Production Launch', date: 'Mar 15, 2026', progress: 100, status: 'upcoming' },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl bg-bg-app p-8">
        <Story />
      </div>
    ),
  ],
}

export const AllCompleted: Story = {
  name: 'All Milestones Completed',
  args: {
    milestones: [
      { id: 'm1', label: 'Phase 1', date: 'Jan 1', progress: 0, status: 'completed' },
      { id: 'm2', label: 'Phase 2', date: 'Jan 15', progress: 33, status: 'completed' },
      { id: 'm3', label: 'Phase 3', date: 'Feb 1', progress: 66, status: 'completed' },
      { id: 'm4', label: 'Phase 4', date: 'Feb 15', progress: 100, status: 'completed' },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl bg-bg-app p-8">
        <Story />
      </div>
    ),
  ],
}

export const EarlyStage: Story = {
  name: 'Early Stage (1 active)',
  args: {
    milestones: [
      { id: 'm1', label: 'Requirements', date: 'Feb 20', progress: 10, status: 'active' },
      { id: 'm2', label: 'Design', date: 'Mar 5', progress: 35, status: 'upcoming' },
      { id: 'm3', label: 'Development', date: 'Apr 1', progress: 65, status: 'upcoming' },
      { id: 'm4', label: 'Launch', date: 'May 1', progress: 100, status: 'upcoming' },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl bg-bg-app p-8">
        <Story />
      </div>
    ),
  ],
}
