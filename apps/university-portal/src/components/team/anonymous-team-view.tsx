'use client'
import { AnonymizedTeamCard } from '@glimmora/ui'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

interface TeamMember {
  seed: string
  role: string
  skills: string[]
}

export function AnonymousTeamView() {
  const t = useTranslations('team')

  const { data } = useQuery<{ data: TeamMember[] }>({
    queryKey: ['team'],
    queryFn: () => fetch('/api/team').then((r) => r.json()),
  })

  const members = data?.data ?? []

  return (
    <div className="space-y-6">
      <p className="text-sm font-body text-text-caption">
        {t('description')}
      </p>
      {members.length === 0 ? (
        <p className="text-center text-sm font-body text-text-caption py-12">
          {t('noTeam')}
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {members.map((member) => (
            <AnonymizedTeamCard
              key={member.seed}
              seed={member.seed}
              role={member.role}
              skills={member.skills}
            />
          ))}
        </div>
      )}
    </div>
  )
}
