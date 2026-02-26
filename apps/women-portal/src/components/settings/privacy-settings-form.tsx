'use client'
import { useState, useEffect } from 'react'
import { Switch, Button, PageHeader } from '@glimmora/ui'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

interface PrivacyData {
  profileVisibleToTeam: boolean
  skillsVisibleToMentor: boolean
  earningsVisible: boolean
}

export function PrivacySettingsForm() {
  const t = useTranslations('settings')
  const [form, setForm] = useState<PrivacyData>({
    profileVisibleToTeam: false,
    skillsVisibleToMentor: false,
    earningsVisible: false,
  })

  const { data } = useQuery<{ data: PrivacyData }>({
    queryKey: ['privacy-settings'],
    queryFn: () => fetch('/api/settings/privacy').then(r => r.json()),
  })

  useEffect(() => {
    if (data?.data) setForm(data.data)
  }, [data])

  const mutation = useMutation({
    mutationFn: async (privacy: PrivacyData) => {
      const res = await fetch('/api/settings/privacy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(privacy),
      })
      return res.json()
    },
  })

  const handleSave = () => mutation.mutate(form)

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t('privacy')} />

      <div className="max-w-lg">
        <div className="bg-bg-card rounded-card shadow-card p-6 space-y-6">
          <p className="text-sm font-body text-text-caption">{t('privacyDescription')}</p>

          <div className="space-y-4">
            <Switch
              id="profileVisibleToTeam"
              label={t('profileVisibleToTeam')}
              checked={form.profileVisibleToTeam}
              onCheckedChange={(checked: boolean) => setForm({ ...form, profileVisibleToTeam: checked })}
            />
            <Switch
              id="skillsVisibleToMentor"
              label={t('skillsVisibleToMentor')}
              checked={form.skillsVisibleToMentor}
              onCheckedChange={(checked: boolean) => setForm({ ...form, skillsVisibleToMentor: checked })}
            />
            <Switch
              id="earningsVisible"
              label={t('earningsVisible')}
              checked={form.earningsVisible}
              onCheckedChange={(checked: boolean) => setForm({ ...form, earningsVisible: checked })}
            />
          </div>

          <Button onClick={handleSave} loading={mutation.isPending}>
            {t('save')}
          </Button>
        </div>
      </div>
    </div>
  )
}
