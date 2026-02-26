'use client'
import { Accordion as RadixAccordion } from 'radix-ui'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../lib/utils'

export const Accordion = RadixAccordion.Root

export function AccordionItem({
  className,
  ...props
}: RadixAccordion.AccordionItemProps) {
  return (
    <RadixAccordion.Item
      className={cn('border-b border-border', className)}
      {...props}
    />
  )
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: RadixAccordion.AccordionTriggerProps) {
  return (
    <RadixAccordion.Header className="flex">
      <RadixAccordion.Trigger
        className={cn(
          'flex flex-1 items-center justify-between py-4 text-sm font-body font-medium text-text-heading hover:text-brand-primary transition-colors [&[data-state=open]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 text-text-caption transition-transform duration-200" />
      </RadixAccordion.Trigger>
    </RadixAccordion.Header>
  )
}

export function AccordionContent({
  className,
  children,
  ...props
}: RadixAccordion.AccordionContentProps) {
  return (
    <RadixAccordion.Content
      className={cn(
        'overflow-hidden text-sm font-body text-text-body transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
        className
      )}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </RadixAccordion.Content>
  )
}
