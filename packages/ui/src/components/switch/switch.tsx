'use client'
import { Switch as RadixSwitch } from 'radix-ui'
import { cn } from '../../lib/utils'
import { forwardRef } from 'react'

interface SwitchProps extends RadixSwitch.SwitchProps {
  label?: string
}

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="flex items-center gap-2">
      <RadixSwitch.Root
        ref={ref}
        id={id}
        className={cn(
          'h-6 w-11 rounded-full bg-border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary data-[state=checked]:bg-brand-primary disabled:opacity-50',
          className
        )}
        {...props}
      >
        <RadixSwitch.Thumb className="block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 translate-x-0.5 data-[state=checked]:translate-x-[22px]" />
      </RadixSwitch.Root>
      {label && <label htmlFor={id} className="text-sm font-body text-text-body cursor-pointer">{label}</label>}
    </div>
  )
)
Switch.displayName = 'Switch'
