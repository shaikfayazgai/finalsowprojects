'use client'
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Switch, Button, PageHeader } from '@glimmora/ui'

type EnterpriseNotificationCategory =
  | 'sow_updates'
  | 'project_updates'
  | 'evidence_reviews'
  | 'payment_updates'
  | 'team_activity'
  | 'platform_announcements'

type NotificationChannel = 'in_app' | 'email'

interface NotificationPref {
  category: EnterpriseNotificationCategory
  channel: NotificationChannel
  enabled: boolean
}

const categories: EnterpriseNotificationCategory[] = [
  'sow_updates',
  'project_updates',
  'evidence_reviews',
  'payment_updates',
  'team_activity',
  'platform_announcements',
]

const channels: NotificationChannel[] = ['in_app', 'email']

const categoryLabels: Record<EnterpriseNotificationCategory, string> = {
  sow_updates: 'SOW Updates',
  project_updates: 'Project Updates',
  evidence_reviews: 'Evidence Reviews',
  payment_updates: 'Payment Updates',
  team_activity: 'Team Activity',
  platform_announcements: 'Platform Announcements',
}

const channelLabels: Record<NotificationChannel, string> = {
  in_app: 'In-App',
  email: 'Email',
}

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPref[]>([])

  const { data } = useQuery<{ data: NotificationPref[] }>({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/enterprise/notifications/preferences')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  useEffect(() => {
    if (data?.data) setPrefs(data.data)
  }, [data])

  const mutation = useMutation({
    mutationFn: async (notifications: NotificationPref[]) => {
      const res = await fetch('/api/enterprise/notifications/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      })
      return res.json()
    },
  })

  const isEnabled = (category: EnterpriseNotificationCategory, channel: NotificationChannel) => {
    return prefs.find((p) => p.category === category && p.channel === channel)?.enabled ?? false
  }

  const togglePref = (category: EnterpriseNotificationCategory, channel: NotificationChannel, enabled: boolean) => {
    setPrefs((prev) => {
      const existing = prev.find((p) => p.category === category && p.channel === channel)
      if (existing) {
        return prev.map((p) =>
          p.category === category && p.channel === channel ? { ...p, enabled } : p
        )
      }
      return [...prev, { category, channel, enabled }]
    })
  }

  const handleSave = () => mutation.mutate(prefs)

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Notification Preferences" subtitle="Choose how you want to be notified" />

      <div className="max-w-2xl">
        <div className="bg-bg-card rounded-card shadow-card overflow-hidden">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="border-b border-border bg-bg-dashboard">
                <th className="text-start px-4 py-3 text-xs font-medium text-text-caption uppercase tracking-wider">
                  Category
                </th>
                {channels.map((channel) => (
                  <th
                    key={channel}
                    className="text-center px-4 py-3 text-xs font-medium text-text-caption uppercase tracking-wider"
                  >
                    {channelLabels[channel]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-text-body font-medium">
                    {categoryLabels[category]}
                  </td>
                  {channels.map((channel) => (
                    <td key={channel} className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <Switch
                          id={`${category}-${channel}`}
                          checked={isEnabled(category, channel)}
                          onCheckedChange={(checked: boolean) =>
                            togglePref(category, channel, checked)
                          }
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
              Save Preferences
            </Button>
            {mutation.isSuccess && (
              <span className="ml-3 text-sm text-status-success">Saved!</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
