import type { Meta, StoryObj } from '@storybook/nextjs'
import { SkillGenomePanel } from './skill-genome-panel'

const meta: Meta<typeof SkillGenomePanel> = {
  title: 'Governance/SkillGenomePanel',
  component: SkillGenomePanel,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof SkillGenomePanel>

const sampleSkills = [
  { name: 'TypeScript', tier: 'expert' as const, evidenceCount: 24, progress: 92, verified: true },
  { name: 'React', tier: 'proficient' as const, evidenceCount: 18, progress: 75, verified: true },
  { name: 'Node.js', tier: 'proficient' as const, evidenceCount: 14, progress: 60, verified: false },
  { name: 'PostgreSQL', tier: 'developing' as const, evidenceCount: 7, progress: 45, verified: false },
  { name: 'Python', tier: 'developing' as const, evidenceCount: 5, progress: 30, verified: true },
  { name: 'GraphQL', tier: 'emerging' as const, evidenceCount: 2, progress: 15, verified: false },
]

export const FullProfile: Story = {
  name: 'Full Skill Profile',
  args: { skills: sampleSkills },
  decorators: [
    (Story) => (
      <div className="max-w-md bg-bg-app p-6">
        <Story />
      </div>
    ),
  ],
}

export const VerifiedAndUnverified: Story = {
  name: 'Mixed Verification Status',
  args: {
    skills: [
      { name: 'React', tier: 'expert' as const, evidenceCount: 30, progress: 95, verified: true },
      { name: 'CSS', tier: 'proficient' as const, evidenceCount: 20, progress: 80, verified: true },
      { name: 'Testing', tier: 'developing' as const, evidenceCount: 8, progress: 40, verified: false },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-md bg-bg-app p-6">
        <Story />
      </div>
    ),
  ],
}

export const PrivacyEnforced: Story = {
  name: 'Privacy Enforced (No Rankings)',
  args: {
    skills: sampleSkills,
    privacyLabel: 'Your skills are private. No rankings, no comparisons, no leaderboards.',
  },
  decorators: [
    (Story) => (
      <div className="max-w-md bg-bg-app p-6">
        <Story />
      </div>
    ),
  ],
}

export const EmptyState: Story = {
  args: { skills: [] },
  decorators: [
    (Story) => (
      <div className="max-w-md bg-bg-app p-6">
        <Story />
      </div>
    ),
  ],
}
