'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Heading, Body, RadioGroup, RadioItem, Checkbox, Stepper } from '@glimmora/ui'

const ONBOARDING_STEPS = [
  { label: 'Profile' },
  { label: 'Expertise' },
  { label: 'Capacity' },
  { label: 'Orientation' },
]

const CAPACITY_OPTIONS = [
  { value: '5', label: '5 hours / week', description: 'Light commitment - review a few tasks weekly' },
  { value: '10', label: '10 hours / week', description: 'Moderate - steady flow of reviews' },
  { value: '20', label: '20 hours / week', description: 'Significant - regular active mentoring' },
  { value: '40', label: '40+ hours / week', description: 'Full-time - maximum review throughput' },
]

const REVIEW_TYPES = [
  { id: 'code', label: 'Code' },
  { id: 'document', label: 'Document' },
  { id: 'link', label: 'Link / URL' },
  { id: 'video', label: 'Video' },
  { id: 'text', label: 'Text / Written' },
]

export function CapacityStep() {
  const router = useRouter()
  const [capacity, setCapacity] = useState('')
  const [reviewTypes, setReviewTypes] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  function toggleReviewType(typeId: string) {
    setReviewTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!capacity || reviewTypes.length === 0) return

    setIsLoading(true)
    try {
      await fetch('/api/mentor/onboarding/capacity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capacityHoursPerWeek: parseInt(capacity, 10),
          preferredReviewTypes: reviewTypes,
        }),
      })
      router.push('/onboarding/orientation')
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Stepper steps={ONBOARDING_STEPS} currentStep={2} />

      <div>
        <Heading level="h2">Review Capacity</Heading>
        <Body className="text-text-secondary mt-1">
          Set your weekly availability and preferred types of evidence to review.
        </Body>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Weekly capacity */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-text-heading">
            Weekly Hours Available
          </label>
          <RadioGroup value={capacity} onValueChange={setCapacity}>
            <div className="space-y-2">
              {CAPACITY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-card border cursor-pointer transition-colors ${
                    capacity === option.value
                      ? 'border-brand-primary bg-brand-primary/5'
                      : 'border-border hover:border-brand-primary/40'
                  }`}
                >
                  <RadioItem value={option.value} />
                  <div>
                    <Body className="font-medium text-sm">{option.label}</Body>
                    <Body className="text-text-secondary text-xs">{option.description}</Body>
                  </div>
                </label>
              ))}
            </div>
          </RadioGroup>
        </div>

        {/* Review types */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-text-heading">
            Preferred Evidence Types
          </label>
          <Body className="text-text-secondary text-sm">
            Select the types of evidence you are comfortable reviewing.
          </Body>
          <div className="space-y-2">
            {REVIEW_TYPES.map((type) => (
              <label
                key={type.id}
                className="flex items-center gap-3 p-3 rounded-card border border-border hover:border-brand-primary/40 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={reviewTypes.includes(type.id)}
                  onCheckedChange={() => toggleReviewType(type.id)}
                />
                <Body className="text-sm">{type.label}</Body>
              </label>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading || !capacity || reviewTypes.length === 0}
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
