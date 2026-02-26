'use client'
import { useState, useEffect } from 'react'
import { Checkbox, Button, PageHeader, Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@glimmora/ui'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import type { DeviceInfo, DeviceType, InternetStability } from '@glimmora/types'

const deviceOptions: { value: DeviceType; label: string }[] = [
  { value: 'smartphone', label: 'Smartphone' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'tablet', label: 'Tablet' },
]

const internetOptions: { value: InternetStability; label: string }[] = [
  { value: 'stable', label: 'Stable (reliable connection)' },
  { value: 'intermittent', label: 'Sometimes slow or drops' },
  { value: 'limited', label: 'Limited (mobile data mainly)' },
]

export function DeviceInfoForm() {
  const t = useTranslations('settings')
  const [form, setForm] = useState<{
    primaryDevice: DeviceType
    internetStability: InternetStability
    hasBackupDevice: boolean
  }>({
    primaryDevice: 'laptop',
    internetStability: 'stable',
    hasBackupDevice: false,
  })

  const { data } = useQuery<{ data: DeviceInfo }>({
    queryKey: ['device-settings'],
    queryFn: () => fetch('/api/profile/devices').then(r => r.json()),
  })

  useEffect(() => {
    if (data?.data) {
      setForm({
        primaryDevice: data.data.primaryDevice,
        internetStability: data.data.internetStability,
        hasBackupDevice: data.data.hasBackupDevice,
      })
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: async (devices: typeof form) => {
      const res = await fetch('/api/profile/devices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(devices),
      })
      return res.json()
    },
  })

  const handleSave = () => mutation.mutate(form)

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t('devices')} />

      <div className="max-w-lg">
        <div className="bg-bg-card rounded-card shadow-card p-6 space-y-5">
          <p className="text-sm font-body text-text-caption">{t('deviceDescription')}</p>

          {/* Primary Device */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-heading font-body">{t('primaryDevice')}</label>
            <Select value={form.primaryDevice} onValueChange={(val: string) => setForm({ ...form, primaryDevice: val as DeviceType })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {deviceOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Internet Stability */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-heading font-body">{t('internetStability')}</label>
            <Select value={form.internetStability} onValueChange={(val: string) => setForm({ ...form, internetStability: val as InternetStability })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {internetOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Backup Device */}
          <Checkbox
            id="hasBackupDevice"
            label={t('hasBackupDevice')}
            checked={form.hasBackupDevice}
            onCheckedChange={(checked) => setForm({ ...form, hasBackupDevice: checked === true })}
          />

          <Button onClick={handleSave} loading={mutation.isPending}>
            {t('save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
