import type { Meta, StoryObj } from '@storybook/nextjs'
import { Checkbox } from './checkbox'

const meta: Meta<typeof Checkbox> = { title: 'Design System/Checkbox', component: Checkbox, parameters: { layout: 'padded' } }
export default meta

export const AllStates: StoryObj<typeof Checkbox> = {
  render: () => (
    <div className="space-y-3 p-6 bg-bg-app">
      <Checkbox id="cb1" label="Unchecked" />
      <Checkbox id="cb2" label="Checked" defaultChecked />
      <Checkbox id="cb3" label="Disabled" disabled />
      <Checkbox id="cb4" label="Checked & Disabled" defaultChecked disabled />
    </div>
  ),
}
