'use client'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import { cn } from '../../lib/utils'

interface DatePickerProps {
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

export function DatePicker({ selected, onSelect, className }: DatePickerProps) {
  return (
    <DayPicker
      mode="single"
      animate
      selected={selected}
      onSelect={onSelect}
      className={cn('font-body', className)}
      classNames={{
        root: 'font-body text-text-body p-3',
        day_button:
          'rounded-inner hover:bg-hover h-9 w-9 text-center text-sm font-body transition-colors',
        selected:
          'bg-brand-primary text-white hover:bg-brand-primary/90 rounded-inner font-medium',
        today: 'font-bold text-brand-primary',
        chevron: 'fill-brand-primary',
        caption_label: 'text-sm font-display font-medium text-text-heading',
        weekday: 'text-xs font-body text-text-caption font-medium',
        nav: 'flex items-center',
        month_caption: 'flex items-center justify-center mb-2',
      }}
    />
  )
}
