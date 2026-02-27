'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { PageHeader, Card, CardHeader, CardTitle, CardContent } from '@glimmora/ui'

const settingsLinks = [
  {
    title: 'Organization Profile',
    description: 'Manage company name, logo, industry, headquarters, and verification status.',
    href: '/settings/organization',
  },
  {
    title: 'Team Access',
    description: 'Invite team members, manage roles, and control access permissions.',
    href: '/settings/team',
  },
  {
    title: 'Notifications',
    description: 'Configure notification preferences for different channels and categories.',
    href: '/settings/notifications',
  },
]

export default function SettingsPage() {
  const pathname = usePathname()

  return (
    <div className="p-6">
      <PageHeader title="Settings" subtitle="Manage your organization and preferences" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card
              className={`h-full transition-shadow hover:shadow-md cursor-pointer ${
                pathname === link.href ? 'ring-2 ring-brand-primary' : ''
              }`}
            >
              <CardHeader>
                <CardTitle>{link.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-text-caption">{link.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
