'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button, Card, CardContent, CardHeader, CardTitle, Spinner } from '@glimmora/ui'
import type { PaymentPreferences, PaymentReleaseMode } from '@glimmora/types'

const modeOptions: Array<{ value: PaymentReleaseMode; label: string; description: string }> = [
  {
    value: 'manual',
    label: 'Manual',
    description: 'Review and approve each payment individually with OTP confirmation',
  },
  {
    value: 'auto-on-approval',
    label: 'Auto on Approval',
    description: 'Automatically release payment when evidence is approved',
  },
  {
    value: 'apg-silent',
    label: 'APG Silent',
    description: 'APG automatically approves and releases payments below threshold',
  },
]

export function PaymentSettingsForm() {
  const [mode, setMode] = useState<PaymentReleaseMode>('manual')
  const [threshold, setThreshold] = useState('')
  const [delayDays, setDelayDays] = useState('')

  const { data, isLoading } = useQuery<PaymentPreferences>({
    queryKey: ['payment-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise/payments/preferences')
      if (!res.ok) throw new Error('Failed to fetch preferences')
      return res.json()
    },
  })

  useEffect(() => {
    if (data) {
      setMode(data.defaultMode)
      setThreshold(data.apgSilentThresholdAmount?.toString() ?? '')
      setDelayDays(data.autoReleaseDelayDays?.toString() ?? '')
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: async (prefs: PaymentPreferences) => {
      const res = await fetch('/api/enterprise/payments/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) throw new Error('Failed to save preferences')
      return res.json()
    },
  })

  function handleSave() {
    const prefs: PaymentPreferences = {
      defaultMode: mode,
      ...(mode === 'apg-silent' && threshold ? { apgSilentThresholdAmount: Number(threshold) } : {}),
      ...(mode === 'auto-on-approval' && delayDays ? { autoReleaseDelayDays: Number(delayDays) } : {}),
    }
    mutation.mutate(prefs)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner label="Loading preferences..." />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default Release Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {modeOptions.map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-3 rounded-md border border-border p-4 cursor-pointer hover:bg-bg-dashboard transition-colors"
              >
                <input
                  type="radio"
                  name="releaseMode"
                  value={option.value}
                  checked={mode === option.value}
                  onChange={() => setMode(option.value)}
                  className="mt-0.5 accent-brand-primary"
                />
                <div>
                  <p className="text-sm font-medium text-text-body">{option.label}</p>
                  <p className="text-xs text-text-caption mt-0.5">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {mode === 'apg-silent' && (
        <Card>
          <CardHeader>
            <CardTitle>APG Silent Threshold</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="block text-sm font-medium text-text-body mb-1">
              Maximum amount for auto-approval (USD)
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g. 20000"
              className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <p className="text-xs text-text-caption mt-1">
              Payments below this amount will be automatically approved by APG without manual review.
            </p>
          </CardContent>
        </Card>
      )}

      {mode === 'auto-on-approval' && (
        <Card>
          <CardHeader>
            <CardTitle>Auto-Release Delay</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="block text-sm font-medium text-text-body mb-1">
              Delay before auto-release (days)
            </label>
            <input
              type="number"
              value={delayDays}
              onChange={(e) => setDelayDays(e.target.value)}
              placeholder="e.g. 3"
              className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-body focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
            <p className="text-xs text-text-caption mt-1">
              Number of days to wait after evidence approval before automatically releasing payment.
            </p>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} loading={mutation.isPending}>
        Save Preferences
      </Button>

      {mutation.isSuccess && (
        <p className="text-sm text-status-success">Preferences saved successfully.</p>
      )}
    </div>
  )
}
