'use client'
import { SkillGenomePanel, PageHeader } from '@glimmora/ui'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import type { SkillGenome } from '@glimmora/types'

export function SkillGenomePage() {
  const t = useTranslations('skills')
  const { data } = useQuery<{ data: SkillGenome }>({
    queryKey: ['skill-genome'],
    queryFn: () => fetch('/api/skill-genome').then(r => r.json()),
  })

  const genome = data?.data
  if (!genome) return null

  // Map SkillNode to SkillGenomePanel's expected format
  const skills = genome.skills.map(s => ({
    name: s.name,
    tier: s.level === 'beginner' ? 'emerging' as const : s.level === 'intermediate' ? 'developing' as const : s.level === 'advanced' ? 'proficient' as const : 'expert' as const,
    evidenceCount: s.evidenceCount,
    progress: s.growthPercentage,
    verified: s.verifiedByMentor,
  }))

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t('title')} />

      <div className="max-w-2xl space-y-6">
        {/* Overall stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-card rounded-card shadow-card p-4">
            <p className="text-xs font-body text-text-caption uppercase tracking-wider">{t('totalPodls')}</p>
            <p className="text-2xl font-display font-semibold text-text-heading mt-1">{genome.totalPoDLs}</p>
          </div>
          <div className="bg-bg-card rounded-card shadow-card p-4">
            <p className="text-xs font-body text-text-caption uppercase tracking-wider">{t('overallGrowth')}</p>
            <p className="text-2xl font-display font-semibold text-text-heading mt-1">{genome.overallGrowthPercentage}%</p>
          </div>
        </div>

        {/* Skill Genome Panel -- PRIVATE, no comparison */}
        <SkillGenomePanel skills={skills} />

        {/* Task-to-skill contribution explanation */}
        <div className="bg-bg-card rounded-card shadow-card p-6">
          <h3 className="font-display text-base font-semibold text-text-heading mb-3">{t('howTasksBuild')}</h3>
          <p className="text-sm font-body text-text-body mb-4">
            Every task you complete contributes to your Skill Genome. When a mentor verifies your evidence,
            the associated skills are strengthened and your progress toward the next tier increases.
          </p>
          <div className="space-y-2">
            {genome.skills.filter(s => s.verifiedByMentor).slice(0, 3).map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm font-body">
                <span className="text-text-body">{s.name}</span>
                <span className="text-text-caption">{s.evidenceCount} deliveries verified</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
