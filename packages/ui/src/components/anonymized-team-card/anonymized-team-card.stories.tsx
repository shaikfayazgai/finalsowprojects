import type { Meta, StoryObj } from '@storybook/nextjs'
import { AnonymizedTeamCard } from './anonymized-team-card'

const meta: Meta<typeof AnonymizedTeamCard> = {
  title: 'Governance/AnonymizedTeamCard',
  component: AnonymizedTeamCard,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof AnonymizedTeamCard>

export const TeamGrid: Story = {
  name: 'Anonymized Team (No Identity Visible)',
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-bg-app p-6">
      <AnonymizedTeamCard
        seed="a1b2c3d4e5f6"
        role="Frontend Developer"
        skills={['React', 'TypeScript', 'CSS']}
      />
      <AnonymizedTeamCard
        seed="f6e5d4c3b2a1"
        role="Backend Developer"
        skills={['Node.js', 'PostgreSQL', 'Redis']}
      />
      <AnonymizedTeamCard
        seed="1a2b3c4d5e6f"
        role="QA Reviewer"
        skills={['Testing', 'Automation', 'Security', 'Performance']}
      />
      <AnonymizedTeamCard
        seed="6f5e4d3c2b1a"
        role="DevOps Engineer"
        skills={['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform']}
      />
    </div>
  ),
}

export const SingleCard: Story = {
  args: {
    seed: 'unique-seed-hash-abc123',
    role: 'Full Stack Developer',
    skills: ['React', 'Node.js', 'TypeScript'],
  },
  decorators: [
    (Story) => (
      <div className="w-48 bg-bg-app p-6">
        <Story />
      </div>
    ),
  ],
}

export const ManySkillsOverflow: Story = {
  name: 'Skill Overflow (+N more)',
  args: {
    seed: 'overflow-test-seed',
    role: 'Senior Developer',
    skills: ['React', 'Vue', 'Angular', 'Svelte', 'TypeScript', 'GraphQL'],
  },
  decorators: [
    (Story) => (
      <div className="w-48 bg-bg-app p-6">
        <Story />
      </div>
    ),
  ],
}
