'use client'
import { useState, useEffect } from 'react'
import { Switch, Button, PageHeader } from '@glimmora/ui'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import type { NotificationPreference, NotificationCategory, NotificationChannel } from '@glimmora/types'

const categories: NotificationCategory[] = ['task_updates', 'payments', 'messages', 'platform']
const channels: NotificationChannel[] = ['in_app', 'email']

const categoryLabels: Record<NotificationCategory, string> = {
  task_updates: 'taskUpdates',
  payments: 'payments',
  messages: 'messagesNotif',
  platform: 'platform',
}

const channelLabels: Record<NotificationChannel, string> = {
  in_app: 'inApp',
  email: 'email',
}

export function NotificationPrefsForm() {
  const t = useTranslations('settings')
  const [prefs, setPrefs] = useState<NotificationPreference[]>([])

  const { data } = useQuery<{ data: NotificationPreference[] }>({
    queryKey: ['notification-settings'],
    queryFn: () => fetch('/api/settings/notifications').then(r => r.json()),
  })

  useEffect(() => {
    if (data?.data) setPrefs(data.data)
  }, [data])

  const mutation = useMutation({
    mutationFn: async (notifications: NotificationPreference[]) => {
      const res = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      })
      return res.json()
    },
  })

  const isEnabled = (category: NotificationCategory, channel: NotificationChannel) => {
    return prefs.find(p => p.category === category && p.channel === channel)?.enabled ?? false
  }

  const togglePref = (category: NotificationCategory, channel: NotificationChannel, enabled: boolean) => {
    setPrefs(prev => {
      const existing = prev.find(p => p.category === category && p.channel === channel)
      if (existing) {
        return prev.map(p => p.category === category && p.channel === channel ? { ...p, enabled } : p)
      }
      return [...prev, { category, channel, enabled }]
    })
  }

  const handleSave = () => mutation.mutate(prefs)

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t('notifications')} />

      <div className="max-w-2xl">
        <div className="bg-bg-card rounded-card shadow-card overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border bg-bg-dashboard">
                <th className="text-start px-4 py-3 text-xs font-medium text-text-caption uppercase tracking-wider">Category</th>
                {channels.map((channel) => (
                  <th key={channel} className="text-center px-4 py-3 text-xs font-medium text-text-caption uppercase tracking-wider">
                    {t(channelLabels[channel])}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-body font-medium">{t(categoryLabels[category])}</td>
                  {channels.map((channel) => (
                    <td key={channel} className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <Switch
                          id={`${category}-${channel}`}
                          checked={isEnabled(category, channel)}
                          onCheckedChange={(checked: boolean) => togglePref(category, channel, checked)}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 border-t border-border">
            <Button onClick={handleSave} loading={mutation.isPending}>
              {t('save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
