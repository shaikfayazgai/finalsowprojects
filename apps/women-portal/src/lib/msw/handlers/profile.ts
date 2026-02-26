import { http, HttpResponse } from 'msw'
import type { NotificationPreference, DeviceInfo } from '@glimmora/types'

const mockPrivacy = {
  profileVisibleToTeam: false,
  skillsVisibleToMentor: true,
  earningsVisible: false,
}

const mockNotifications: NotificationPreference[] = [
  { channel: 'in_app', category: 'task_updates', enabled: true },
  { channel: 'email', category: 'task_updates', enabled: true },
  { channel: 'in_app', category: 'payments', enabled: true },
  { channel: 'email', category: 'payments', enabled: true },
  { channel: 'in_app', category: 'messages', enabled: true },
  { channel: 'email', category: 'messages', enabled: false },
  { channel: 'in_app', category: 'platform', enabled: true },
  { channel: 'email', category: 'platform', enabled: true },
]

const mockDevices: DeviceInfo = {
  userId: 'user-001',
  primaryDevice: 'laptop',
  internetStability: 'stable',
  hasBackupDevice: true,
  updatedAt: '2026-02-20T10:00:00Z',
}

export const profileHandlers = [
  http.get('/api/settings/privacy', () => HttpResponse.json({ data: mockPrivacy })),
  http.put('/api/settings/privacy', async ({ request }) => {
    const body = await request.json()
    Object.assign(mockPrivacy, body)
    return HttpResponse.json({ data: mockPrivacy })
  }),
  http.get('/api/settings/notifications', () => HttpResponse.json({ data: mockNotifications })),
  http.put('/api/settings/notifications', async ({ request }) => {
    const body = await request.json() as NotificationPreference[]
    return HttpResponse.json({ data: body })
  }),
  http.get('/api/profile/devices', () => HttpResponse.json({ data: mockDevices })),
  http.put('/api/profile/devices', async ({ request }) => {
    const body = await request.json()
    Object.assign(mockDevices, body)
    return HttpResponse.json({ data: mockDevices })
  }),
  http.get('/api/profile', () => {
    return HttpResponse.json({ data: { displayName: 'Fatima', email: 'fatima@example.com', city: 'Karachi', timezone: 'Asia/Karachi' } })
  }),
  http.put('/api/profile', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ data: body })
  }),
]
