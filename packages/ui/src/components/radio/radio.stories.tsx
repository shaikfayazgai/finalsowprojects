import type { Meta, StoryObj } from '@storybook/nextjs'
import { RadioGroup, RadioItem } from './radio'

const meta: Meta = { title: 'Design System/Radio', parameters: { layout: 'padded' } }
export default meta

export const RadioGroupStory: StoryObj = {
  render: () => (
    <div className="p-6 bg-bg-app">
      <RadioGroup defaultValue="design">
        <RadioItem id="r1" value="development" label="Development" />
        <RadioItem id="r2" value="design" label="Design" />
        <RadioItem id="r3" value="testing" label="Testing" />
        <RadioItem id="r4" value="disabled" label="Disabled option" disabled />
      </RadioGroup>
    </div>
  ),
}
