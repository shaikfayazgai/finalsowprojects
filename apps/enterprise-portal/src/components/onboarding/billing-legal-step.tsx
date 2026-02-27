'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button, Heading, Body, TextInput, Checkbox, Stepper,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@glimmora/ui'

const ONBOARDING_STEPS = [
  { label: 'Company' },
  { label: 'Billing' },
  { label: 'Team' },
  { label: 'First SOW' },
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED']

export function BillingLegalStep() {
  const router = useRouter()
  const [billingEmail, setBillingEmail] = useState('')
  const [currency, setCurrency] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      await fetch('/api/enterprise/onboarding/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billingEmail, currency, acceptedTerms }),
      })
      router.push('/onboarding/team')
    } catch {
      // Let user retry
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Stepper steps={ONBOARDING_STEPS} currentStep={1} />

      <div>
        <Heading level="h2">Billing & Legal</Heading>
        <Body className="mt-1 text-text-caption">
          Set up your billing preferences and accept our terms of service.
        </Body>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="billingEmail" className="text-sm font-medium text-text-heading">
            Billing Contact Email <span className="text-status-urgent">*</span>
          </label>
          <TextInput
            id="billingEmail"
            type="email"
            placeholder="billing@company.com"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-heading">
            Billing Currency <span className="text-status-urgent">*</span>
          </label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((cur) => (
                <SelectItem key={cur} value={cur}>
                  {cur}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-start gap-3 pt-2">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
          />
          <label htmlFor="terms" className="text-sm text-text-body leading-snug cursor-pointer">
            I accept the GlimmoraTeam Enterprise Terms of Service and acknowledge the
            payment terms (payment released only upon accepted outcome delivery).
          </label>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading || !billingEmail || !currency || !acceptedTerms}
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
