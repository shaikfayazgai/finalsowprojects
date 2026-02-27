import { http, HttpResponse, delay } from 'msw'
import type { OrganizationProfile, TeamMember } from '@glimmora/types'
import { randomId } from '../factories/common'

function createMockOrganization(): OrganizationProfile {
  return {
    id: 'org-001',
    name: 'TechVentures Global',
    logoUrl: 'https://picsum.photos/seed/tv-logo/200',
    industry: 'Technology',
    size: '201-1000',
    headquarters: 'Mumbai, India',
    website: 'https://techventures.example.com',
    primaryContactEmail: 'priya.nair@techventures.example.com',
    taxId: 'IN-GSTIN-27AABCT1234A1Z5',
    billingCurrency: 'USD',
    billingContactEmail: 'billing@techventures.example.com',
    verificationStatus: 'verified',
  }
}

function createMockTeamMembers(): TeamMember[] {
  return [
    {
      id: randomId('tm'),
      email: 'priya.nair@techventures.example.com',
      name: 'Priya Nair',
      role: 'admin',
      invitedAt: '2025-06-01T09:00:00Z',
      acceptedAt: '2025-06-01T09:05:00Z',
      isActive: true,
    },
    {
      id: randomId('tm'),
      email: 'rahul.sharma@techventures.example.com',
      name: 'Rahul Sharma',
      role: 'project-manager',
      invitedAt: '2025-06-15T10:00:00Z',
      acceptedAt: '2025-06-15T14:30:00Z',
      isActive: true,
    },
    {
      id: randomId('tm'),
      email: 'anika.desai@techventures.example.com',
      name: 'Anika Desai',
      role: 'finance-approver',
      invitedAt: '2025-07-01T08:00:00Z',
      acceptedAt: '2025-07-02T11:00:00Z',
      isActive: true,
    },
    {
      id: randomId('tm'),
      email: 'new.hire@techventures.example.com',
      name: 'Vikram Patel',
      role: 'viewer',
      invitedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      isActive: false,
    },
  ]
}

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

function createMockNotificationPrefs(): NotificationPref[] {
  const categories: EnterpriseNotificationCategory[] = [
    'sow_updates',
    'project_updates',
    'evidence_reviews',
    'payment_updates',
    'team_activity',
    'platform_announcements',
  ]
  const channels: NotificationChannel[] = ['in_app', 'email']
  const prefs: NotificationPref[] = []
  for (const category of categories) {
    for (const channel of channels) {
      prefs.push({
        category,
        channel,
        enabled: category !== 'platform_announcements' || channel === 'in_app',
      })
    }
  }
  return prefs
}

export const settingsHandlers = [
  // Organization
  http.get('/api/enterprise/organization', async () => {
    await delay(300)
    return HttpResponse.json(createMockOrganization())
  }),

  http.patch('/api/enterprise/organization', async () => {
    await delay(400)
    return HttpResponse.json({ status: 'updated' })
  }),

  // Team
  http.get('/api/enterprise/team', async () => {
    await delay(300)
    return HttpResponse.json(createMockTeamMembers())
  }),

  http.post('/api/enterprise/team/invite', async ({ request }) => {
    await delay(400)
    const body = (await request.json()) as { email: string; role: string }
    const newMember: TeamMember = {
      id: randomId('tm'),
      email: body.email,
      name: body.email.split('@')[0].replace(/[._]/g, ' '),
      role: body.role as TeamMember['role'],
      invitedAt: new Date().toISOString(),
      isActive: false,
    }
    return HttpResponse.json(newMember, { status: 201 })
  }),

  http.patch('/api/enterprise/team/:id', async () => {
    await delay(300)
    return HttpResponse.json({ status: 'updated' })
  }),

  http.delete('/api/enterprise/team/:id', async () => {
    await delay(300)
    return new HttpResponse(null, { status: 204 })
  }),

  // Notification Preferences
  http.get('/api/enterprise/notifications/preferences', async () => {
    await delay(300)
    return HttpResponse.json({ data: createMockNotificationPrefs() })
  }),

  http.patch('/api/enterprise/notifications/preferences', async () => {
    await delay(400)
    return HttpResponse.json({ status: 'updated' })
  }),
]
