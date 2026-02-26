import type { Meta, StoryObj } from '@storybook/nextjs'
import { Stepper } from './stepper'

const meta: Meta<typeof Stepper> = {
  title: 'Design System/Stepper',
  component: Stepper,
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj<typeof Stepper>

const steps = [
  { label: 'Profile' },
  { label: 'Skill Assessment' },
  { label: 'Verification' },
  { label: 'Complete' },
]

export const Step0: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-lg">
      <Stepper steps={steps} currentStep={0} />
    </div>
  ),
}

export const Step1: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-lg">
      <Stepper steps={steps} currentStep={1} />
    </div>
  ),
}

export const Step2: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-lg">
      <Stepper steps={steps} currentStep={2} />
    </div>
  ),
}

export const AllComplete: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-lg">
      <Stepper steps={steps} currentStep={4} />
    </div>
  ),
}

export const WithDescriptions: Story = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-lg">
      <Stepper
        steps={[
          { label: 'SOW Upload', description: 'Upload file' },
          { label: 'Analysis', description: 'AI review' },
          { label: 'Approval', description: 'Confirm scope' },
          { label: 'Deploy', description: 'Start project' },
        ]}
        currentStep={2}
      />
    </div>
  ),
}
