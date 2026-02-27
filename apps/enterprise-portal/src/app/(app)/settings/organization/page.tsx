'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { PageHeader, Button, Badge, Card, CardContent, CardHeader, CardTitle, Spinner } from '@glimmora/ui'
import type { OrganizationProfile } from '@glimmora/types'

const industries = [
  'Technology',
  'Finance & Banking',
  'Healthcare',
  'Retail & E-commerce',
  'Manufacturing',
  'Education',
  'Consulting',
  'Energy',
  'Telecommunications',
  'Other',
]

const companySizes = ['1-50', '51-200', '201-1000', '1000+'] as const

const verificationBadge: Record<OrganizationProfile['verificationStatus'], { status: 'done' | 'normal' | 'atrisk'; label: string }> = {
  verified: { status: 'done', label: 'Verified' },
  pending: { status: 'normal', label: 'Pending' },
  rejected: { status: 'atrisk', label: 'Rejected' },
}

export default function OrganizationSettingsPage() {
  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    industry: '',
    size: '' as OrganizationProfile['size'] | '',
    headquarters: '',
    website: '',
    primaryContactEmail: '',
    taxId: '',
  })

  const { data: org, isLoading } = useQuery<OrganizationProfile>({
    queryKey: ['organization'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise/organization')
      if (!res.ok) throw new Error('Failed to fetch organization')
      return res.json()
    },
  })

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name,
        logoUrl: org.logoUrl ?? '',
        industry: org.industry,
        size: org.size,
        headquarters: org.headquarters,
        website: org.website ?? '',
        primaryContactEmail: org.primaryContactEmail,
        taxId: org.taxId,
      })
    }
  }, [org])

  const mutation = useMutation({
    mutationFn: async (data: Partial<OrganizationProfile>) => {
      const res = await fetch('/api/enterprise/organization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Failed to save')
      return res.json()
    },
  })

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSave() {
    mutation.mutate({
      name: form.name,
      logoUrl: form.logoUrl || undefined,
      industry: form.industry,
      size: form.size as OrganizationProfile['size'],
      headquarters: form.headquarters,
      website: form.website || undefined,
      primaryContactEmail: form.primaryContactEmail,
    })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Organization Profile" />
        <div className="flex items-center justify-center py-12">
          <Spinner label="Loading organization..." />
        </div>
      </div>
    )
  }

  const badge = org ? verificationBadge[org.verificationStatus] : null

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <PageHeader title="Organization Profile" />
        {badge && <Badge status={badge.status}>{badge.label}</Badge>}
      </div>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Logo URL
              </label>
              <input
                type="url"
                value={form.logoUrl}
                onChange={(e) => handleChange('logoUrl', e.target.value)}
                placeholder="https://example.com/logo.png"
                className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
              {form.logoUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src={form.logoUrl}
                    alt="Logo preview"
                    className="h-10 w-10 rounded object-cover border border-border"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="text-xs text-text-caption">Preview</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-body mb-1">
                  Industry
                </label>
                <select
                  value={form.industry}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Select industry...</option>
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-body mb-1">
                  Company Size
                </label>
                <select
                  value={form.size}
                  onChange={(e) => handleChange('size', e.target.value)}
                  className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Select size...</option>
                  {companySizes.map((s) => (
                    <option key={s} value={s}>{s} employees</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Headquarters
              </label>
              <input
                type="text"
                value={form.headquarters}
                onChange={(e) => handleChange('headquarters', e.target.value)}
                placeholder="City, Country"
                className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Website
              </label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://example.com"
                className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Primary Contact Email
              </label>
              <input
                type="email"
                value={form.primaryContactEmail}
                onChange={(e) => handleChange('primaryContactEmail', e.target.value)}
                className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-body mb-1">
                Tax ID
              </label>
              <input
                type="text"
                value={form.taxId}
                readOnly
                className="w-full rounded-md border border-border bg-bg-dashboard px-3 py-2 text-sm text-text-caption cursor-not-allowed"
              />
              <p className="text-xs text-text-caption mt-1">Tax ID is read-only after verification.</p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} loading={mutation.isPending}>
          Save Changes
        </Button>

        {mutation.isSuccess && (
          <p className="text-sm text-status-success">Organization profile updated successfully.</p>
        )}
      </div>
    </div>
  )
}
