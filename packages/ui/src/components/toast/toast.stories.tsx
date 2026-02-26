import type { Meta, StoryObj } from '@storybook/nextjs'
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './toast'

const meta: Meta = { title: 'Design System/Toast', parameters: { layout: 'padded' } }
export default meta

export const AllVariants: StoryObj = {
  render: () => (
    <div className="space-y-3 max-w-[380px]">
      <ToastProvider swipeDirection="right">
        <Toast variant="success" open duration={Infinity}>
          <ToastTitle>Evidence Accepted</ToastTitle>
          <ToastDescription>Your evidence pack was approved by the mentor.</ToastDescription>
          <ToastClose />
        </Toast>
        <Toast variant="warning" open duration={Infinity}>
          <ToastTitle>Deadline Approaching</ToastTitle>
          <ToastDescription>Task submission due in 2 hours.</ToastDescription>
          <ToastClose />
        </Toast>
        <Toast variant="error" open duration={Infinity}>
          <ToastTitle>Upload Failed</ToastTitle>
          <ToastDescription>File exceeds maximum size of 10MB.</ToastDescription>
          <ToastClose />
        </Toast>
        <Toast variant="info" open duration={Infinity}>
          <ToastTitle>New Task Available</ToastTitle>
          <ToastDescription>A task matching your Skill Genome is available.</ToastDescription>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    </div>
  ),
}
