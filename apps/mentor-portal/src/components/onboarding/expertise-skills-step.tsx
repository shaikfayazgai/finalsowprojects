'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Heading, Body, TextInput, Stepper } from '@glimmora/ui'

const ONBOARDING_STEPS = [
  { label: 'Profile' },
  { label: 'Expertise' },
  { label: 'Capacity' },
  { label: 'Orientation' },
]

const EXPERTISE_CATEGORIES = [
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'Java',
  'Go',
  'System Design',
  'DevOps / CI-CD',
  'Data Science',
  'UI/UX Design',
  'Security',
  'Cloud Architecture',
  'Mobile Development',
  'API Design',
  'Database Design',
  'Testing / QA',
]

export function ExpertiseSkillsStep() {
  const router = useRouter()
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [customArea, setCustomArea] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function toggleArea(area: string) {
    setSelectedAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    )
  }

  function addCustomArea() {
    const trimmed = customArea.trim()
    if (trimmed && !selectedAreas.includes(trimmed)) {
      setSelectedAreas((prev) => [...prev, trimmed])
      setCustomArea('')
    }
  }

  const isValid = selectedAreas.length >= 2 && selectedAreas.length <= 8

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setIsLoading(true)
    try {
      await fetch('/api/mentor/onboarding/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertiseAreas: selectedAreas }),
      })
      router.push('/onboarding/capacity')
    } catch {
      // Silently handle
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Stepper steps={ONBOARDING_STEPS} currentStep={1} />

      <div>
        <Heading level="h2">Your Expertise Areas</Heading>
        <Body className="text-text-secondary mt-1">
          Select 2 to 8 areas where you can provide expert-level review and guidance.
        </Body>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {EXPERTISE_CATEGORIES.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedAreas.includes(area)
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-bg-card text-text-body border-border hover:border-brand-primary'
              }`}
            >
              {area}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <TextInput
            placeholder="Add a custom expertise area..."
            value={customArea}
            onChange={(e) => setCustomArea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomArea()
              }
            }}
            className="flex-1"
          />
          <Button type="button" variant="secondary" onClick={addCustomArea} disabled={!customArea.trim()}>
            +
          </Button>
        </div>

        {selectedAreas.length > 0 && (
          <div className="space-y-2">
            <Body className="text-text-secondary text-sm">
              Selected ({selectedAreas.length}/8):
            </Body>
            <div className="flex flex-wrap gap-1.5">
              {selectedAreas.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-brand-primary/10 text-brand-primary"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => toggleArea(area)}
                    className="hover:text-status-error transition-colors"
                    aria-label={`Remove ${area}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {selectedAreas.length > 0 && selectedAreas.length < 2 && (
          <Body className="text-status-error text-sm">
            Please select at least 2 expertise areas.
          </Body>
        )}

        {selectedAreas.length > 8 && (
          <Body className="text-status-error text-sm">
            Maximum 8 expertise areas allowed.
          </Body>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading || !isValid}
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
