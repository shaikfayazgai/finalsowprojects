import type { Meta, StoryObj } from '@storybook/nextjs'
import { Avatar } from './avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Design System/Avatar',
  component: Avatar,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof Avatar>

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-6 bg-bg-app">
      <Avatar name="Fatima Al-Hassan" size="sm" />
      <Avatar name="Fatima Al-Hassan" size="md" />
      <Avatar name="Fatima Al-Hassan" size="lg" />
      <Avatar name="Fatima Al-Hassan" size="xl" />
    </div>
  ),
}

export const ImageMode: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-6 bg-bg-app">
      <Avatar
        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop"
        alt="Profile"
        size="lg"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop"
        alt="Profile"
        size="lg"
      />
    </div>
  ),
}

export const InitialsMode: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-6 bg-bg-app">
      <Avatar name="Fatima Al-Hassan" size="lg" />
      <Avatar name="Arjun Mehta" size="lg" />
      <Avatar name="Priya Nair" size="lg" />
      <Avatar name="Sarah" size="lg" />
    </div>
  ),
}

export const AnonymousMode: Story = {
  render: () => (
    <div className="flex items-center gap-4 p-6 bg-bg-app">
      <Avatar anonymous seed="user-001" size="lg" />
      <Avatar anonymous seed="user-042" size="lg" />
      <Avatar anonymous seed="user-108" size="lg" />
      <Avatar anonymous seed="user-255" size="lg" />
      <Avatar anonymous seed="user-999" size="lg" />
    </div>
  ),
}
