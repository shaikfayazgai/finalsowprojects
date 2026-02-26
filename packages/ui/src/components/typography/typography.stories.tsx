import type { Meta, StoryObj } from '@storybook/nextjs'
import { Heading, Body, Label, Caption } from './typography'

const meta: Meta = {
  title: 'Design System/Typography',
  parameters: { layout: 'padded' },
}
export default meta

export const AllTypography: StoryObj = {
  render: () => (
    <div className="space-y-4 p-6 bg-bg-app">
      <Heading level="h1">Miller Display H1 — Premium Heading</Heading>
      <Heading level="h2">Miller Display H2 — Section Title</Heading>
      <Heading level="h3">Miller Display H3 — Card Title</Heading>
      <Heading level="h4">Miller Display H4 — Subheading</Heading>
      <Body size="lg">Large body text — Avenir LT Std, readable and warm</Body>
      <Body>Default body text — Used for descriptions, content, and instructions across all portals</Body>
      <Body size="sm">Small body text — Compact display for secondary information</Body>
      <Label>Label text — For form labels and metadata</Label>
      <Caption>Caption text — For timestamps, IDs, and supporting information</Caption>
    </div>
  ),
}
