import type { Meta, StoryObj } from '@storybook/nextjs'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './select'

const meta: Meta = { title: 'Design System/Select', parameters: { layout: 'padded' } }
export default meta

export const BasicSelect: StoryObj = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-xs">
      <Select>
        <SelectTrigger><SelectValue placeholder="Select task type..." /></SelectTrigger>
        <SelectContent>
          <SelectItem value="development">Development</SelectItem>
          <SelectItem value="design">Design</SelectItem>
          <SelectItem value="testing">Testing</SelectItem>
          <SelectItem value="documentation">Documentation</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}
