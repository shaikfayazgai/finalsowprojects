'use client'
import { SkillGenomePage } from '@/components/skills'
import { PageHeader } from '@glimmora/ui'
import { useTranslations } from 'next-intl'

export default function SkillsPage() {
  const t = useTranslations('skills')
  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t('title')} />
      <SkillGenomePage />
    </div>
  )
}
