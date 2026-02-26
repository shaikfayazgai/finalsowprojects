'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Heading, Body, TextInput, Textarea, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@glimmora/ui'
import { Shield } from 'lucide-react'

const EXPERTISE_SUGGESTIONS = [
  'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'Go',
  'System Design', 'DevOps', 'Data Science', 'UI/UX Design',
  'Security', 'Cloud Architecture', 'Mobile Development', 'API Design',
]

export function ApplicationForm() {
  const router = useRouter()
  const [expertiseInput, setExpertiseInput] = useState('')
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([])
  const [credentials, setCredentials] = useState('')
  const [availability, setAvailability] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addExpertise(area: string) {
    const trimmed = area.trim()
    if (trimmed && !expertiseAreas.includes(trimmed)) {
      setExpertiseAreas((prev) => [...prev, trimmed])
    }
    setExpertiseInput('')
  }

  function removeExpertise(area: string) {
    setExpertiseAreas((prev) => prev.filter((a) => a !== area))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (expertiseAreas.length === 0) {
      setError('Please add at least one expertise area.')
      return
    }
    if (!availability) {
      setError('Please select your availability.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/mentor/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertiseAreas, credentials, availability }),
      })

      if (!res.ok) {
        throw new Error('Failed to submit application')
      }

      router.push('/apply/status')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-brand-primary" />
        </div>
        <Heading level="h2">Apply to Become a Mentor</Heading>
        <Body className="text-text-secondary">
          Share your expertise and help shape the next generation of verified contributors.
        </Body>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Expertise Areas */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-heading">
            Expertise Areas
          </label>
          <div className="flex gap-2">
            <TextInput
              placeholder="Add an expertise area..."
              value={expertiseInput}
              onChange={(e) => setExpertiseInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addExpertise(expertiseInput)
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => addExpertise(expertiseInput)}
              disabled={!expertiseInput.trim()}
            >
              Add
            </Button>
          </div>

          {/* Quick-pick suggestions */}
          <div className="flex flex-wrap gap-1.5">
            {EXPERTISE_SUGGESTIONS.filter((s) => !expertiseAreas.includes(s)).slice(0, 8).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addExpertise(suggestion)}
                className="px-2.5 py-1 rounded-full text-xs border border-border bg-bg-card text-text-secondary hover:border-brand-primary hover:text-brand-primary transition-colors"
              >
                + {suggestion}
              </button>
            ))}
          </div>

          {/* Selected expertise tags */}
          {expertiseAreas.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {expertiseAreas.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-brand-primary/10 text-brand-primary"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => removeExpertise(area)}
                    className="hover:text-status-error transition-colors"
                    aria-label={`Remove ${area}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Credentials */}
        <div className="space-y-2">
          <label htmlFor="credentials" className="text-sm font-medium text-text-heading">
            Credentials &amp; Experience
          </label>
          <Textarea
            id="credentials"
            placeholder="Describe your relevant certifications, work experience, and what makes you qualified to mentor..."
            value={credentials}
            onChange={(e) => setCredentials(e.target.value)}
            rows={4}
            required
          />
        </div>

        {/* Availability */}
        <div className="space-y-2">
          <label htmlFor="availability" className="text-sm font-medium text-text-heading">
            Weekly Availability
          </label>
          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger id="availability">
              <SelectValue placeholder="Select your weekly availability" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5h/week">5 hours / week</SelectItem>
              <SelectItem value="10h/week">10 hours / week</SelectItem>
              <SelectItem value="20h/week">20 hours / week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {error && (
          <p className="text-sm text-status-error">{error}</p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || expertiseAreas.length === 0 || !credentials.trim() || !availability}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </form>
    </div>
  )
}
