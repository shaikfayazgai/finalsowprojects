'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button, Heading, Body, TextInput, Stepper,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@glimmora/ui'
import { Plus, X } from 'lucide-react'
import type { TeamMemberRole } from '@glimmora/types'

const ONBOARDING_STEPS = [
  { label: 'Company' },
  { label: 'Billing' },
  { label: 'Team' },
  { label: 'First SOW' },
]

const ROLES: Array<{ value: TeamMemberRole; label: string }> = [
  { value: 'project-manager', label: 'Project Manager' },
  { value: 'finance-approver', label: 'Finance Approver' },
  { value: 'viewer', label: 'Viewer' },
]

interface TeamInvite {
  email: string
  role: TeamMemberRole
}

export function TeamSetupStep() {
  const router = useRouter()
  const [invites, setInvites] = useState<TeamInvite[]>([{ email: '', role: 'project-manager' }])
  const [isLoading, setIsLoading] = useState(false)

  function addInvite() {
    setInvites([...invites, { email: '', role: 'project-manager' }])
  }

  function removeInvite(index: number) {
    setInvites(invites.filter((_, i) => i !== index))
  }

  function updateInvite(index: number, field: keyof TeamInvite, value: string) {
    const updated = [...invites]
    updated[index] = { ...updated[index], [field]: value }
    setInvites(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      const validInvites = invites.filter((inv) => inv.email.trim())
      if (validInvites.length > 0) {
        await fetch('/api/enterprise/onboarding/team', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invites: validInvites }),
        })
      }
      router.push('/onboarding/first-sow')
    } catch {
      // Let user retry
    } finally {
      setIsLoading(false)
    }
  }

  function handleSkip() {
    router.push('/onboarding/first-sow')
  }

  return (
    <div className="space-y-6">
      <Stepper steps={ONBOARDING_STEPS} currentStep={2} />

      <div>
        <Heading level="h2">Team Setup</Heading>
        <Body className="mt-1 text-text-caption">
          Invite team members to collaborate on projects. You can also do this later.
        </Body>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {invites.map((invite, index) => (
          <div key={index} className="flex items-start gap-3">
            <div className="flex-1 space-y-2">
              <label
                htmlFor={`invite-email-${index}`}
                className="text-sm font-medium text-text-heading"
              >
                Email
              </label>
              <TextInput
                id={`invite-email-${index}`}
                type="email"
                placeholder="colleague@company.com"
                value={invite.email}
                onChange={(e) => updateInvite(index, 'email', e.target.value)}
              />
            </div>
            <div className="w-44 space-y-2">
              <label className="text-sm font-medium text-text-heading">Role</label>
              <Select
                value={invite.role}
                onValueChange={(value) => updateInvite(index, 'role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {invites.length > 1 && (
              <button
                type="button"
                onClick={() => removeInvite(index)}
                className="mt-8 p-1.5 rounded-full hover:bg-hover transition-colors"
                aria-label="Remove invite"
              >
                <X className="h-4 w-4 text-text-caption" />
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addInvite}
          className="flex items-center gap-2 text-sm text-brand-primary hover:underline"
        >
          <Plus className="h-4 w-4" />
          Add Another
        </button>

        <div className="flex gap-3 pt-2">
          <Button type="submit" size="lg" className="flex-1" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </div>

        <button
          type="button"
          onClick={handleSkip}
          className="w-full text-center text-sm text-text-caption hover:text-text-body transition-colors"
        >
          Skip for now
        </button>
      </form>
    </div>
  )
}
