'use client'
import { Checkbox as RadixCheckbox } from 'radix-ui'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'
import { forwardRef } from 'react'

interface CheckboxProps extends RadixCheckbox.CheckboxProps {
  label?: string
}

export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="flex items-center gap-2">
      <RadixCheckbox.Root
        ref={ref}
        id={id}
        className={cn(
          'h-[18px] w-[18px] rounded-[4px] border border-border bg-bg-card flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary data-[state=checked]:bg-brand-primary data-[state=checked]:border-brand-primary transition-all duration-150',
          className
        )}
        {...props}
      >
        <RadixCheckbox.Indicator>
          <Check className="h-3 w-3 text-white stroke-[3]" />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      {label && <label htmlFor={id} className="text-sm font-body text-text-body cursor-pointer">{label}</label>}
    </div>
  )
)
Checkbox.displayName = 'Checkbox'
