'use client'
import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StepperProps {
  steps: Array<{ label: string; description?: string }>
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('flex items-start', className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={index} className={cn('flex items-start', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center">
              {/* Step circle */}
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-body font-medium transition-colors',
                  isCompleted && 'bg-brand-primary text-white',
                  isActive && 'border-2 border-brand-primary bg-bg-card text-brand-primary',
                  !isCompleted && !isActive && 'border border-border bg-bg-card text-text-caption'
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              {/* Label */}
              <span
                className={cn(
                  'text-xs font-body mt-2 text-center max-w-[80px]',
                  isActive && 'text-brand-primary font-medium',
                  isCompleted && 'text-text-body',
                  !isCompleted && !isActive && 'text-text-caption'
                )}
              >
                {step.label}
              </span>
              {step.description && (
                <span className="text-[10px] font-body text-text-caption text-center max-w-[80px] mt-0.5">
                  {step.description}
                </span>
              )}
            </div>
            {/* Connector line */}
            {!isLast && (
              <div className="flex-1 flex items-center pt-4 px-2">
                <div
                  className={cn(
                    'h-0.5 w-full rounded-full',
                    isCompleted ? 'bg-brand-primary' : 'bg-border'
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
