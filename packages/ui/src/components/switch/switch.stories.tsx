import type { Meta, StoryObj } from '@storybook/nextjs'
import { Switch } from './switch'

const meta: Meta<typeof Switch> = { title: 'Design System/Switch', component: Switch, parameters: { layout: 'padded' } }
export default meta

export const AllStates: StoryObj<typeof Switch> = {
  render: () => (
    <div className="space-y-3 p-6 bg-bg-app">
      <Switch id="sw1" label="Notifications enabled" />
      <Switch id="sw2" label="Auto-payment active" defaultChecked />
      <Switch id="sw3" label="Disabled switch" disabled />
    </div>
  ),
}
