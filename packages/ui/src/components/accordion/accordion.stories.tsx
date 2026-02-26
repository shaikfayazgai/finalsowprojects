import type { Meta, StoryObj } from '@storybook/nextjs'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './accordion'

const meta: Meta = { title: 'Design System/Accordion', parameters: { layout: 'padded' } }
export default meta

export const Single: StoryObj = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-lg">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>How does task matching work?</AccordionTrigger>
          <AccordionContent>
            The APG analyzes your Skill Genome and matches you with tasks that fit your verified capabilities.
            Tasks are offered based on proficiency level, not bidding or competition.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>When do I get paid?</AccordionTrigger>
          <AccordionContent>
            Payment is released when the enterprise requester accepts your evidence pack.
            The Proof-of-Delivery Ledger records every accepted outcome.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Is my identity visible to others?</AccordionTrigger>
          <AccordionContent>
            No. GlimmoraTeam is privacy-first by architecture. Your profile is never public,
            and there are no leaderboards or peer rankings.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}

export const Multiple: StoryObj = {
  render: () => (
    <div className="p-6 bg-bg-app max-w-lg">
      <Accordion type="multiple" defaultValue={['item-1']}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Project Overview</AccordionTrigger>
          <AccordionContent>
            High-level summary of the project including objectives, timeline, and stakeholders.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Milestone Breakdown</AccordionTrigger>
          <AccordionContent>
            Detailed view of each milestone with deliverables, dependencies, and deadlines.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3">
          <AccordionTrigger>Team Composition</AccordionTrigger>
          <AccordionContent>
            Anonymous team view showing skill coverage and capacity across the project.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  ),
}
