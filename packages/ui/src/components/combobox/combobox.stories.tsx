import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxSeparator,
} from './combobox'

const meta: Meta = { title: 'Design System/Combobox', parameters: { layout: 'padded' } }
export default meta

export const Basic: StoryObj = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-sm">
      <Combobox>
        <ComboboxInput placeholder="Search skills or categories..." />
        <ComboboxList>
          <ComboboxEmpty>No results found.</ComboboxEmpty>
          <ComboboxGroup heading="Skills">
            <ComboboxItem>React</ComboboxItem>
            <ComboboxItem>TypeScript</ComboboxItem>
            <ComboboxItem>Node.js</ComboboxItem>
          </ComboboxGroup>
          <ComboboxSeparator />
          <ComboboxGroup heading="Categories">
            <ComboboxItem>Frontend</ComboboxItem>
            <ComboboxItem>Backend</ComboboxItem>
            <ComboboxItem>DevOps</ComboboxItem>
          </ComboboxGroup>
        </ComboboxList>
      </Combobox>
    </div>
  ),
}
