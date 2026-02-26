'use client'
import { RadioGroup as RadixRadioGroup } from 'radix-ui'
import { cn } from '../../lib/utils'
import { forwardRef } from 'react'

export const RadioGroup = forwardRef<HTMLDivElement, RadixRadioGroup.RadioGroupProps>(
  ({ className, ...props }, ref) => (
    <RadixRadioGroup.Root ref={ref} className={cn('flex flex-col gap-2', className)} {...props} />
  )
)
RadioGroup.displayName = 'RadioGroup'

interface RadioItemProps extends RadixRadioGroup.RadioGroupItemProps {
  label?: string
}

export const RadioItem = forwardRef<HTMLButtonElement, RadioItemProps>(
  ({ className, label, id, value, ...props }, ref) => (
    <div className="flex items-center gap-2">
      <RadixRadioGroup.Item
        ref={ref}
        id={id}
        value={value}
        className={cn(
          'h-[18px] w-[18px] rounded-full border border-border bg-bg-card flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary data-[state=checked]:border-brand-primary transition-all duration-150',
          className
        )}
        {...props}
      >
        <RadixRadioGroup.Indicator className="h-[10px] w-[10px] rounded-full bg-brand-primary" />
      </RadixRadioGroup.Item>
      {label && <label htmlFor={id} className="text-sm font-body text-text-body cursor-pointer">{label}</label>}
    </div>
  )
)
RadioItem.displayName = 'RadioItem'
