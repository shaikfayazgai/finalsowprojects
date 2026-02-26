'use client'
import { SkillGenomePanel } from '@glimmora/ui'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'

interface SkillEntry {
  name: string
  tier: 'emerging' | 'developing' | 'proficient' | 'expert'
  evidenceCount: number
  progress: number
  verified: boolean
}

export function SkillGenomePage() {
  const t = useTranslations('skills')

  const { data } = useQuery<{ data: SkillEntry[] }>({
    queryKey: ['skill-genome'],
    queryFn: () => fetch('/api/skill-genome').then((r) => r.json()),
  })

  const skills = data?.data ?? []

  return (
    <div className="space-y-6 max-w-2xl">
      <p className="text-sm font-body text-text-caption">
        {t('description')}
      </p>
      <SkillGenomePanel
        skills={skills}
        privacyLabel="Your skills are private and never shared publicly. Only you can see this."
      />
    </div>
  )
}
