'use client'
import { useState, useEffect } from 'react'
import { TextInput, Button, PageHeader } from '@glimmora/ui'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Lock, Bell, Monitor } from 'lucide-react'

interface ProfileData {
  displayName: string
  email: string
  city: string
  timezone: string
}

export function ProfileSettingsForm() {
  const t = useTranslations('settings')
  const [form, setForm] = useState<ProfileData>({ displayName: '', email: '', city: '', timezone: '' })

  const { data } = useQuery<{ data: ProfileData }>({
    queryKey: ['profile'],
    queryFn: () => fetch('/api/profile').then(r => r.json()),
  })

  useEffect(() => {
    if (data?.data) setForm(data.data)
  }, [data])

  const mutation = useMutation({
    mutationFn: async (profile: ProfileData) => {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      return res.json()
    },
  })

  const handleSave = () => mutation.mutate(form)

  const settingsNav = [
    { label: t('privacy'), href: '/settings/privacy', icon: <Lock className="h-4 w-4" /> },
    { label: t('notifications'), href: '/settings/notifications', icon: <Bell className="h-4 w-4" /> },
    { label: t('devices'), href: '/settings/devices', icon: <Monitor className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t('title')} />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings navigation */}
        <nav className="lg:w-56 shrink-0">
          <div className="bg-bg-card rounded-card shadow-card p-2">
            <div className="px-3 py-2 text-sm font-body font-medium text-brand-primary bg-hover rounded-inner">
              {t('profile')}
            </div>
            {settingsNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2 text-sm font-body text-text-body hover:bg-hover rounded-inner transition-colors"
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        {/* Profile form */}
        <div className="flex-1 max-w-lg">
          <div className="bg-bg-card rounded-card shadow-card p-6 space-y-4">
            <h2 className="font-display text-lg font-semibold text-text-heading">{t('profile')}</h2>
            <TextInput
              label={t('displayName')}
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            />
            <TextInput
              label={t('city')}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <TextInput
              label={t('timezone')}
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
            />
            <Button onClick={handleSave} loading={mutation.isPending}>
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
