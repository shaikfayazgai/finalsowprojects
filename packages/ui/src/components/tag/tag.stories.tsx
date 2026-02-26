import type { Meta, StoryObj } from '@storybook/nextjs'
import { Tag } from './tag'

const meta: Meta<typeof Tag> = {
  title: 'Design System/Tag',
  component: Tag,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof Tag>

export const AllVariants: Story = {
  render: () => (
    <div className="p-6 bg-bg-app space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-body text-text-caption uppercase tracking-wider">Non-dismissible</p>
        <div className="flex flex-wrap gap-2">
          <Tag variant="skill">React</Tag>
          <Tag variant="skill">TypeScript</Tag>
          <Tag variant="category">Frontend</Tag>
          <Tag variant="default">General</Tag>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-body text-text-caption uppercase tracking-wider">Dismissible</p>
        <div className="flex flex-wrap gap-2">
          <Tag variant="skill" dismissible onDismiss={() => {}}>React</Tag>
          <Tag variant="skill" dismissible onDismiss={() => {}}>TypeScript</Tag>
          <Tag variant="category" dismissible onDismiss={() => {}}>Backend</Tag>
          <Tag variant="default" dismissible onDismiss={() => {}}>Tag</Tag>
        </div>
      </div>
    </div>
  ),
}

export const SkillTags: Story = {
  render: () => (
    <div className="p-6 bg-bg-app">
      <div className="flex flex-wrap gap-2">
        <Tag variant="skill">React</Tag>
        <Tag variant="skill">TypeScript</Tag>
        <Tag variant="skill">Node.js</Tag>
        <Tag variant="skill">PostgreSQL</Tag>
        <Tag variant="skill">Tailwind CSS</Tag>
      </div>
    </div>
  ),
}

export const CategoryTags: Story = {
  render: () => (
    <div className="p-6 bg-bg-app">
      <div className="flex flex-wrap gap-2">
        <Tag variant="category">Frontend</Tag>
        <Tag variant="category">Backend</Tag>
        <Tag variant="category">DevOps</Tag>
        <Tag variant="category">Testing</Tag>
      </div>
    </div>
  ),
}
