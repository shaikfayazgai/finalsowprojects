'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Heading, Body, TextInput, Textarea, Stepper } from '@glimmora/ui'

const ONBOARDING_STEPS = [
  { label: 'Profile' },
  { label: 'Expertise' },
  { label: 'Capacity' },
  { label: 'Orientation' },
]

export function MentorProfileStep() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      await fetch('/api/mentor/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayName, bio }),
      })
      router.push('/onboarding/skills')
    } catch {
      // Silently handle, let user retry
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Stepper steps={ONBOARDING_STEPS} currentStep={0} />

      <div>
        <Heading level="h2">Set Up Your Profile</Heading>
        <Body className="text-text-secondary mt-1">
          This information helps contributors understand who is reviewing their work.
        </Body>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="displayName" className="text-sm font-medium text-text-heading">
            Display Name <span className="text-status-error">*</span>
          </label>
          <TextInput
            id="displayName"
            placeholder="How you want to appear to contributors"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium text-text-heading">
            Bio
          </label>
          <Textarea
            id="bio"
            placeholder="Brief description of your background and mentoring philosophy..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-heading">
            Profile Photo
          </label>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-bg-muted flex items-center justify-center text-text-caption text-xs">
              Photo
            </div>
            <Body className="text-text-secondary text-sm">
              Photo upload will be available soon. An anonymous avatar will be used for now.
            </Body>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading || !displayName.trim()}
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
