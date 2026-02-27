'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Button, Heading, Body, TextInput, Stepper,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@glimmora/ui'

const ONBOARDING_STEPS = [
  { label: 'Company' },
  { label: 'Billing' },
  { label: 'Team' },
  { label: 'First SOW' },
]

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Manufacturing',
  'Retail', 'Education', 'Government', 'Consulting', 'Other',
]

const COMPANY_SIZES = ['1-50', '51-200', '201-1000', '1000+'] as const

export function CompanyVerificationStep() {
  const router = useRouter()
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [headquarters, setHeadquarters] = useState('')
  const [website, setWebsite] = useState('')
  const [taxId, setTaxId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    try {
      await fetch('/api/enterprise/onboarding/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, industry, companySize, headquarters, website, taxId }),
      })
      router.push('/onboarding/billing')
    } catch {
      // Let user retry
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Stepper steps={ONBOARDING_STEPS} currentStep={0} />

      <div>
        <Heading level="h2">Company Verification</Heading>
        <Body className="mt-1 text-text-caption">
          Tell us about your organization so we can verify your account.
        </Body>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="companyName" className="text-sm font-medium text-text-heading">
            Company Name <span className="text-status-urgent">*</span>
          </label>
          <TextInput
            id="companyName"
            placeholder="Acme Corporation"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-heading">
            Industry <span className="text-status-urgent">*</span>
          </label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind.toLowerCase()}>
                  {ind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-text-heading">
            Company Size <span className="text-status-urgent">*</span>
          </label>
          <Select value={companySize} onValueChange={setCompanySize}>
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size} employees
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="headquarters" className="text-sm font-medium text-text-heading">
            Headquarters <span className="text-status-urgent">*</span>
          </label>
          <TextInput
            id="headquarters"
            placeholder="City, Country"
            value={headquarters}
            onChange={(e) => setHeadquarters(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="website" className="text-sm font-medium text-text-heading">
            Website
          </label>
          <TextInput
            id="website"
            placeholder="https://company.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="taxId" className="text-sm font-medium text-text-heading">
            Tax ID / Registration Number <span className="text-status-urgent">*</span>
          </label>
          <TextInput
            id="taxId"
            placeholder="e.g. EIN, GST, VAT number"
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            required
          />
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading || !companyName || !industry || !companySize || !headquarters || !taxId}
        >
          {isLoading ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
