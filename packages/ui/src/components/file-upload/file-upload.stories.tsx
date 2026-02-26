import type { Meta, StoryObj } from '@storybook/nextjs'
import { FileUpload } from './file-upload'

const meta: Meta<typeof FileUpload> = {
  title: 'Design System/FileUpload',
  component: FileUpload,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof FileUpload>

export const Default: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-md">
      <FileUpload />
    </div>
  ),
}

export const WithAcceptedTypes: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-md">
      <FileUpload accept=".pdf,.docx,.png,.jpg" maxSizeMB={5} />
    </div>
  ),
}

export const SingleFile: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-md">
      <FileUpload maxFiles={1} accept=".pdf" />
    </div>
  ),
}
