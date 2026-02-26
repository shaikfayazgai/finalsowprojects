'use client'
import { Slider as RadixSlider } from 'radix-ui'
import { cn } from '../../lib/utils'

interface SliderProps extends RadixSlider.SliderProps {
  className?: string
}

export function Slider({ className, ...props }: SliderProps) {
  return (
    <RadixSlider.Root
      className={cn(
        'relative flex w-full touch-none select-none items-center h-5',
        className
      )}
      {...props}
    >
      <RadixSlider.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-hover">
        <RadixSlider.Range className="absolute h-full bg-brand-primary rounded-full" />
      </RadixSlider.Track>
      {(props.defaultValue ?? props.value ?? [0]).map((_, i) => (
        <RadixSlider.Thumb
          key={i}
          className="block h-4 w-4 rounded-full border border-brand-primary bg-bg-card shadow-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        />
      ))}
    </RadixSlider.Root>
  )
}
