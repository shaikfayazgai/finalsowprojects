import type { Meta, StoryObj } from '@storybook/nextjs'
import { TextInput, Textarea, PasswordInput } from './input'

const meta: Meta = { title: 'Design System/Input', parameters: { layout: 'padded' } }
export default meta

export const AllInputs: StoryObj = {
  render: () => (
    <div className="space-y-4 p-6 bg-bg-app max-w-md">
      <TextInput label="Task Title" placeholder="Enter task title..." />
      <TextInput label="With Error" placeholder="Enter value..." error="This field is required" />
      <TextInput label="Disabled" placeholder="Cannot edit" disabled />
      <Textarea label="Description" placeholder="Describe the task..." />
      <PasswordInput label="Password" placeholder="Enter password" />
    </div>
  ),
}
