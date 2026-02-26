'use client'
import { AnonymousTeamView } from '@/components/team'
import { PageHeader } from '@glimmora/ui'
import { useTranslations } from 'next-intl'

export default function TeamPage() {
  const t = useTranslations('team')
  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t('title')} />
      <AnonymousTeamView />
    </div>
  )
}
